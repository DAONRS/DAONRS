import React, { useEffect, useState, forwardRef, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { supabase } from '../../supabaseClient';
import { createImageHandler, createVideoHandler, getEditorModules, convertYoutubeLinksToIframes } from '../../hooks/editorHandlers';

const DataroomSection = forwardRef((props, ref) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [user, setUser] = useState(null);
  
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

  const quillRef = useRef(null);
  const fileInputRef = useRef(null);
  const BUCKET_NAME = 'daonrs';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

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
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!error) {
        setPosts(data.map(item => ({ ...item, date: item.created_at?.split('T')[0] })));
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 💡 [수정] Blob 방식으로 파일을 받아와 브라우저 내장 뷰어 열림을 방지하고 원본 파일명으로 강제 다운로드
  const handleDownload = async (post) => {
    if (!post.file_url) return;
    
    try {
      const response = await fetch(post.file_url);
      if (!response.ok) throw new Error('파일을 불러오지 못했습니다.');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = post.file_name || '다운로드파일'; // 원본 파일명 지정
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('파일 다운로드 실패: ' + err.message);
    }
  };

  const handleSave = async () => {
    if (!title || !content) return alert('입력 확인');
    try {
      let fileUrl = existingFileUrl;
      let fileName = existingFileName;

      // 새 파일이 선택된 경우 업로드
      if (file) {
        const ext = file.name.split('.').pop();
        const storagePath = `archives/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(storagePath);

        fileUrl = publicUrl;
        fileName = file.name;
      }

      const postData = { title, content, author: '관리자', file_url: fileUrl, file_name: fileName };

      if (isEditing) {
        await supabase.from('archives').update(postData).eq('id', editingId);
      } else {
        await supabase.from('archives').insert([postData]);
        setCurrentPage(1);
      }
      cancelWriting(); fetchArchives();
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (e, post) => {
    e.stopPropagation();
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      // 첨부파일이 있으면 스토리지에서도 삭제
      if (post.file_url && post.file_url.includes(BUCKET_NAME)) {
        const filePath = post.file_url.split(`${BUCKET_NAME}/`)[1];
        if (filePath) await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      }
      await supabase.from('archives').delete().eq('id', post.id);
      alert('삭제되었습니다.');
      fetchArchives();
    } catch (err) { alert(err.message); }
  };

  const startEditing = (e, post) => {
    e.stopPropagation(); setIsEditing(true); setEditingId(post.id);
    setTitle(post.title); setContent(post.content);
    setExistingFileUrl(post.file_url || null);
    setExistingFileName(post.file_name || null);
    setFile(null);
    setIsWriting(true);
  };

  const cancelWriting = () => {
    setIsWriting(false); setIsEditing(false); setTitle(''); setContent(''); setFile(null);
    setExistingFileUrl(null); setExistingFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section id="dataroom" ref={ref} className="section">
      <div className="sub-section">
        <header className="subsection-header">
          <h2 className="subsection-title">자료실</h2>
          {user && !isWriting && <button onClick={() => setIsWriting(true)} className="notice-write-button">글쓰기</button>}
        </header>
        <hr className="section-top-line" />

        {isWriting ? (
          <div className="cafe-editor-container">
            <input type="text" className="editor-title-input" value={title} onChange={(e)=>setTitle(e.target.value)} />
            <div className="quill-wrapper"><ReactQuill ref={quillRef} value={content} onChange={setContent} modules={modules} /></div>
            <div className="file-attach-area">
              <label className="file-attach-label">
                <span className="file-attach-icon">📎</span> 파일 첨부
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="file-attach-input" />
              </label>
              {(file || existingFileName) && (
                <div className="file-attach-preview">
                  <span className="file-attach-name">{file ? file.name : existingFileName}</span>
                  <button type="button" className="file-remove-btn" onClick={removeFile}>✕</button>
                </div>
              )}
            </div>
            <div className="editor-footer">
              <button className="btn-cancel" onClick={cancelWriting}>취소</button>
              <button className="btn-submit" onClick={handleSave}>{isEditing ? '수정완료' : '등록'}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="dataroom-list">
              {posts.map((post) => (
                <div key={post.id} className="list-item-wrapper">
                  <div onClick={() => setExpandedId(expandedId === post.id ? null : post.id)} className="list-item-header">
                    <div className="list-item-title-group"><div className="q-icon-circle">D</div><span className="item-title">{post.title}</span></div>
                    <div className="item-meta">
                      {user && (
                        <div className="notice-item-actions">
                          <span onClick={(e) => startEditing(e, post)} className="notice-action-edit">수정</span>
                          <span onClick={(e) => handleDelete(e, post)} className="notice-action-delete">삭제</span>
                        </div>
                      )}
                      <span>{post.date}</span>
                      <span className={`dataroom-accordion-icon ${expandedId === post.id ? 'expanded' : ''}`}>▼</span>
                    </div>
                  </div>
                  {expandedId === post.id && (
                    <div className="item-content">
                      <div className="ql-editor" dangerouslySetInnerHTML={{ __html: convertYoutubeLinksToIframes(post.content) }} />
                      {post.file_url && (
                        <div className="file-download-area">
                          <div onClick={() => handleDownload(post)} className="file-download-link" style={{ cursor: 'pointer' }}>
                            <span className="file-download-icon">📄</span>
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