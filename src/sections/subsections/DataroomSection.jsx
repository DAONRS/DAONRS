import React, { useEffect, useState, forwardRef, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import { TbPin } from 'react-icons/tb';
import 'react-quill-new/dist/quill.snow.css';
import { supabase } from '../../supabaseClient';
import { createImageHandler, createVideoHandler, getEditorModules, convertYoutubeLinksToIframes } from '../../hooks/editorHandlers';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { isDriveUrl, isStorageUrl, validateAttachLink, downloadAttachment } from '../../hooks/fileAttachHelpers';
import { useRevealGroup } from '../../hooks/useScrollReveal';
import { useAuth } from '../../contexts/AuthContext';
import { runMutation, removeStorageFiles, extractStoragePathsFromHtml, movePost } from '../../utils/supabaseMutation';

const DataroomSection = forwardRef((props, ref) => {
  // 스크롤 진입 시 섹션 단위 등장 애니메이션 (index.css 의 .reveal)
  const reveal = useRevealGroup();

  const [posts, setPosts] = useState([]);
  const [movingId, setMovingId] = useState(null); // 순서 변경 중인 글 (연타 방지)
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  // 관리자 여부는 AuthContext 의 공용 세션을 사용한다 (로그인/로그아웃 즉시 반영)
  const { session } = useAuth();
  const user = session?.user ?? null;
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const [isWriting, setIsWriting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState(null);
  const [existingFileName, setExistingFileName] = useState(null);

  // 첨부 방식: 'upload'(스토리지 업로드) | 'link'(구글 드라이브 등 외부 링크)
  const [attachMode, setAttachMode] = useState('upload');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [isPinned, setIsPinned] = useState(false); // 상단 고정 여부

  const quillRef = useRef(null);
  const fileInputRef = useRef(null);
  const BUCKET_NAME = 'daonrs';

  useEffect(() => {
    fetchArchives();
  }, [currentPage]);

  const fetchArchives = async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, count, error } = await supabase
        .from('archives')
        .select('*', { count: 'exact' })
        // 관리자가 ▲▼ 로 정한 순서 (클수록 위, 새 글은 DB 기본값으로 맨 위)
        // 고정 글이 먼저, 그 안에서는 ▲▼ 로 정한 순서 (supabase_post_pin.sql)
        .order('is_pinned', { ascending: false })
        .order('sort_order', { ascending: false })
        .range(from, to);

      if (!error) {
        setPosts(data.map(item => {
          const created = item.created_at?.split('T')[0];
          const updated = item.updated_at?.split('T')[0];
          // 등록 당일에 고친 경우까지 '수정'으로 표시하면 군더더기라 일 단위로 비교한다
          return { ...item, date: created, editedDate: updated !== created ? updated : null };
        }));
        setTotalCount(count || 0);
      }
    } finally { setLoading(false); }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (ref && ref.current) {
      window.scrollTo({ top: ref.current.offsetTop - 100, behavior: 'smooth' });
    }
  };

  const imageHandler = useMemo(() => createImageHandler(quillRef, 'archives'), []);
  const videoHandler = useMemo(() => createVideoHandler(quillRef), []);
  const modules = useMemo(() => getEditorModules(imageHandler, videoHandler), [imageHandler, videoHandler]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    setExistingFileUrl(null);
    setExistingFileName(null);
    setLinkUrl('');
    setLinkName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 💡 스토리지 파일은 Blob 방식(원본 파일명 유지), 외부 링크는 새 탭으로 처리
  const handleDownload = (post) => downloadAttachment(post);

  const handleSave = async () => {
    if (!user) return alert('관리자 로그인이 필요합니다.');
    if (!title || !content) return alert('입력 확인');
    let uploadedPath = null; // 이번 저장에서 새로 올린 파일 (DB 저장 실패 시 정리용)
    try {
      const prevFileUrl = existingFileUrl; // 교체 시 기존 스토리지 파일 정리용
      let fileUrl = existingFileUrl;
      let fileName = existingFileName;

      if (attachMode === 'link') {
        // 구글 드라이브 등 외부 공유 링크 첨부
        const trimmedUrl = linkUrl.trim();
        if (trimmedUrl) {
          const linkError = validateAttachLink(trimmedUrl);
          if (linkError) return alert(linkError);
          fileUrl = trimmedUrl;
          fileName = linkName.trim() || '첨부파일';
        } else {
          fileUrl = null;
          fileName = null;
        }
      } else if (file) {
        // 새 파일이 선택된 경우 스토리지 업로드
        const ext = file.name.split('.').pop();
        const storagePath = `archives/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, file);
        if (uploadError) throw new Error(`첨부파일 업로드 실패: ${uploadError.message}`);
        uploadedPath = storagePath;

        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(storagePath);

        fileUrl = publicUrl;
        fileName = file.name;
      }

      const postData = { title, content, author: '관리자', file_url: fileUrl, file_name: fileName, is_pinned: isPinned };

      if (isEditing) {
        await runMutation(supabase.from('archives').update(postData).eq('id', editingId).select('id'), '자료 수정');
        uploadedPath = null;

        // 첨부가 교체/삭제된 경우 이전 스토리지 파일 정리 (실패해도 본문 수정은 유지)
        if (prevFileUrl && prevFileUrl !== fileUrl && isStorageUrl(prevFileUrl, BUCKET_NAME)) {
          try {
            const prevPath = prevFileUrl.split(`${BUCKET_NAME}/`)[1];
            if (prevPath) await supabase.storage.from(BUCKET_NAME).remove([prevPath]);
          } catch (cleanupErr) {
            console.warn('이전 첨부파일 삭제 실패:', cleanupErr);
          }
        }
      } else {
        await runMutation(supabase.from('archives').insert([postData]).select('id'), '자료 등록');
        uploadedPath = null;
        setCurrentPage(1);
      }
      cancelWriting(); fetchArchives();
    } catch (err) {
      // DB 저장이 실패하면 방금 올린 첨부파일이 고아 파일로 남지 않게 지운다
      if (uploadedPath) await removeStorageFiles(supabase, BUCKET_NAME, [uploadedPath]);
      alert(err.message);
    }
  };

  const handleDelete = async (e, post) => {
    e.stopPropagation();
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    if (!user) return alert('관리자 로그인이 필요합니다.');
    try {
      // DB 행을 먼저 지운다. (첨부를 먼저 지웠다가 DB 삭제가 실패하면 다운로드가 깨진 글이 남는다)
      await runMutation(supabase.from('archives').delete().eq('id', post.id).select('id'), '자료 삭제');
      // 스토리지에 업로드된 첨부파일 + 본문에 삽입된 이미지를 함께 삭제 (외부 링크/이미지는 건드리지 않음)
      const storagePaths = extractStoragePathsFromHtml(post.content, BUCKET_NAME);
      if (isStorageUrl(post.file_url, BUCKET_NAME)) {
        storagePaths.push(post.file_url.split(`${BUCKET_NAME}/`)[1]);
      }
      await removeStorageFiles(supabase, BUCKET_NAME, storagePaths);
      alert('삭제되었습니다.');
    } catch (err) {
      alert(err.message);
    } finally {
      fetchArchives();
    }
  };

  // 관리자: 바로 위(-1) / 아래(1) 글과 자리 교환
  // 같은 페이지 안이면 화면부터 바꾸고, 페이지 경계를 넘으면 글을 따라 그 페이지로 이동한다.
  const handleMove = async (e, index, direction) => {
    e.stopPropagation();
    if (!user || movingId) return;
    const post = posts[index];
    const target = index + direction;
    const samePage = target >= 0 && target < posts.length;

    setMovingId(post.id);
    if (samePage) {
      setPosts((prev) => {
        const next = [...prev];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      });
    }
    try {
      const moved = await movePost(supabase, 'archives', post.id, direction);
      if (!moved) fetchArchives();
      else if (!samePage) setCurrentPage((p) => p + direction);
    } catch (err) {
      alert(err.message);
      fetchArchives();
    } finally {
      setMovingId(null);
    }
  };

  // 관리자: 상단 고정 / 해제 (is_pinned 만 바뀌므로 수정 날짜는 그대로, 해제하면 원래 자리로 돌아간다)
  const togglePin = async (e, post) => {
    e.stopPropagation();
    if (!user) return alert('관리자 로그인이 필요합니다.');
    try {
      await runMutation(supabase.from('archives').update({ is_pinned: !post.is_pinned }).eq('id', post.id).select('id'), '자료 고정 변경');
    } catch (err) {
      alert(err.message);
    } finally {
      fetchArchives();
    }
  };

  const startEditing = (e, post) => {
    e.stopPropagation(); setIsEditing(true); setEditingId(post.id);
    setTitle(post.title); setContent(post.content);
    setExistingFileUrl(post.file_url || null);
    setExistingFileName(post.file_name || null);
    setIsPinned(!!post.is_pinned);
    setFile(null);

    // 기존 첨부가 외부 링크면 링크 모드로, 아니면 업로드 모드로 열기
    if (isDriveUrl(post.file_url)) {
      setAttachMode('link');
      setLinkUrl(post.file_url);
      setLinkName(post.file_name || '');
    } else {
      setAttachMode('upload');
      setLinkUrl('');
      setLinkName('');
    }

    setIsWriting(true);
  };

  const cancelWriting = () => {
    setIsWriting(false); setIsEditing(false); setTitle(''); setContent(''); setFile(null);
    setExistingFileUrl(null); setExistingFileName(null);
    setAttachMode('upload'); setLinkUrl(''); setLinkName('');
    setIsPinned(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section id="dataroom" ref={ref} className="section">
      <div className="sub-section">
        <header {...reveal('head', 'subsection-header')}>
          <h2 className="subsection-title">자료실</h2>
          {user && !isWriting && <button onClick={() => setIsWriting(true)} className="notice-write-button">글쓰기</button>}
        </header>
        <hr className="section-top-line" />

        {user && isWriting ? (
          <div {...reveal('editor', 'cafe-editor-container')}>
            <input type="text" className="editor-title-input" value={title} onChange={(e)=>setTitle(e.target.value)} />
            <div className="quill-wrapper"><ReactQuill ref={quillRef} value={content} onChange={setContent} modules={modules} /></div>
            <div className="file-attach-area">
              <div className="attach-mode-tabs">
                <button
                  type="button"
                  className={`attach-mode-btn ${attachMode === 'upload' ? 'active' : ''}`}
                  onClick={() => setAttachMode('upload')}
                >파일 업로드</button>
                <button
                  type="button"
                  className={`attach-mode-btn ${attachMode === 'link' ? 'active' : ''}`}
                  onClick={() => setAttachMode('link')}
                >드라이브 링크</button>
              </div>

              {attachMode === 'upload' ? (
                <div className="attach-upload-row">
                  <label className="file-attach-label">
                    <span className="file-attach-icon">📎</span> 파일 첨부
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="file-attach-input" />
                  </label>
                  {(file || (existingFileName && !isDriveUrl(existingFileUrl))) && (
                    <div className="file-attach-preview">
                      <span className="file-attach-name">{file ? file.name : existingFileName}</span>
                      <button type="button" className="file-remove-btn" onClick={removeFile}>✕</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="link-attach-fields">
                  <input
                    type="url"
                    className="link-attach-input"
                    placeholder="구글 드라이브 공유 링크 (예: https://drive.google.com/file/d/파일ID/view?usp=sharing)"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                  <input
                    type="text"
                    className="link-attach-input"
                    placeholder="표시할 파일명 (예: 2026 제품 카탈로그.pdf)"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                  />
                  <p className="link-attach-hint">
                    드라이브에서 해당 파일을 <b>공유 → 링크가 있는 모든 사용자(뷰어)</b>로 설정해야 방문자가 내려받을 수 있습니다.
                  </p>
                </div>
              )}
            </div>
            <label className="pin-checkbox-label">
              <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} /> 상단 고정
            </label>
            <div className="editor-footer">
              <button className="btn-cancel" onClick={cancelWriting}>취소</button>
              <button className="btn-submit" onClick={handleSave}>{isEditing ? '수정완료' : '등록'}</button>
            </div>
          </div>
        ) : (
          <>
            <div {...reveal('list', 'dataroom-list')}>
              {posts.map((post, index) => (
                <div key={post.id} className={`list-item-wrapper ${post.is_pinned ? 'pinned' : ''}`}>
                  <div onClick={() => setExpandedId(expandedId === post.id ? null : post.id)} className="list-item-header">
                    <div className="list-item-title-group">
                      {/* 고정 글은 번호 대신 핀 아이콘. 고정 글이 항상 앞쪽에 오므로 전체 개수에서 위치를 빼면 일반 글이 1번부터 이어진다 */}
                      <span className={`item-no ${post.is_pinned ? 'pinned' : ''}`} title={post.is_pinned ? '상단 고정' : undefined}>{post.is_pinned ? <TbPin aria-label="상단 고정" /> : totalCount - (currentPage - 1) * itemsPerPage - index}</span>
                      <div className="q-icon-circle">D</div><span className="item-title">{post.title}</span></div>
                    <div className="item-meta">
                      {user && (
                        <div className="notice-item-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="notice-action-move"
                            onClick={(e) => handleMove(e, index, -1)}
                            disabled={!!movingId || (currentPage === 1 && index === 0) || (index > 0 && posts[index - 1].is_pinned !== post.is_pinned)}
                            title="위로 이동"
                            aria-label="위로 이동"
                          >▲</button>
                          <button
                            type="button"
                            className="notice-action-move"
                            onClick={(e) => handleMove(e, index, 1)}
                            disabled={!!movingId || (currentPage - 1) * itemsPerPage + index >= totalCount - 1 || (index < posts.length - 1 && posts[index + 1].is_pinned !== post.is_pinned)}
                            title="아래로 이동"
                            aria-label="아래로 이동"
                          >▼</button>
                          <span onClick={(e) => togglePin(e, post)} className="notice-action-pin">{post.is_pinned ? '고정해제' : '고정'}</span>
                          <span onClick={(e) => startEditing(e, post)} className="notice-action-edit">수정</span>
                          <span onClick={(e) => handleDelete(e, post)} className="notice-action-delete">삭제</span>
                        </div>
                      )}
                      <span>{post.date}</span>
                      {post.editedDate && <span className="item-edited">수정 {post.editedDate}</span>}
                      <span className={`dataroom-accordion-icon ${expandedId === post.id ? 'expanded' : ''}`}>▼</span>
                    </div>
                  </div>
                  {expandedId === post.id && (
                    <div className="item-content">
                      <div className="ql-editor" dangerouslySetInnerHTML={{ __html: sanitizeHtml(convertYoutubeLinksToIframes(post.content)) }} />
                      {post.file_url && (
                        <div className="file-download-area">
                          <div onClick={() => handleDownload(post)} className="file-download-link" style={{ cursor: 'pointer' }}>
                            <span className="file-download-icon">{isDriveUrl(post.file_url) ? '🔗' : '📄'}</span>
                            <span className="file-download-name">{post.file_name || '첨부파일 다운로드'}</span>
                            <span className="file-download-btn">다운로드</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalCount > itemsPerPage && (
              <div className="pagination-container">
                <button className="page-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>&lt; 이전</button>
                <span className="page-info"><strong>{currentPage}</strong> / {totalPages}</span>
                <button className="page-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>다음 &gt;</button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
});

export default DataroomSection;