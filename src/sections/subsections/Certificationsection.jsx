import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; 

// 필요에 따라 CSS 파일을 하나로 통합하거나 아래 import를 상황에 맞게 수정하세요.
import './Certificationsection.css';
import './IntellectualPropertySection.css';
import { useRevealGroup } from '../../hooks/useScrollReveal';
import { useAuth } from '../../contexts/AuthContext';
import { runMutation, removeStorageFiles } from '../../utils/supabaseMutation';

const CombinedSection = React.forwardRef((props, ref) => {
    // 두 블록이 동시에 렌더되므로 등장 애니메이션도 각각 따로 관찰한다
    const reveal = useRevealGroup();

    // State for Certifications
    const [certifications, setCertifications] = useState([]);
    const [certUploading, setCertUploading] = useState(false);
    const [isCertEditMode, setIsCertEditMode] = useState(false);

    // State for IP
    const [ipExamples, setIpExamples] = useState([]);
    const [ipUploading, setIpUploading] = useState(false);
    const [isIpEditMode, setIsIpEditMode] = useState(false);

    // 관리자 여부는 AuthContext 의 공용 상태를 사용한다.
    // (섹션마다 getSession 을 한 번만 확인하면 로그아웃 후에도 버튼이 남아
    //  비로그인 권한으로 요청이 나가 조용히 실패했다)
    const { isAdmin } = useAuth();

    // 로그아웃되면 편집 화면도 즉시 닫히도록 관리자 여부와 함께 판단한다
    const showCertEdit = isAdmin && isCertEditMode;
    const showIpEdit = isAdmin && isIpEditMode;

    useEffect(() => {
        fetchCertifications();
        fetchIPImages();
    }, []);

    const fetchCertifications = async () => {
        try {
            const { data, error } = await supabase.from('certifications').select('*').order('display_order', { ascending: true });
            if (error) throw error;
            setCertifications(data || []);
        } catch (err) { console.error('인증 데이터 로드 오류:', err); }
    };

    const fetchIPImages = async () => {
        try {
            const { data, error } = await supabase.from('intellectual_properties').select('*').order('display_order', { ascending: true });
            if (error) throw error;
            setIpExamples(data || []);
        } catch (err) { console.error('지식재산권 데이터 로드 오류:', err); }
    };

    const refetch = (type) => (type === 'cert' ? fetchCertifications() : fetchIPImages());

    const compressToWebP = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
            reader.onload = (event) => {
                const img = new Image();
                img.onerror = () => reject(new Error('이미지 파일만 등록할 수 있습니다.'));
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxWidth = 1000;
                    let width = img.width, height = img.height;
                    if (width > maxWidth) { height = (maxWidth * height) / width; width = maxWidth; }
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('이미지 변환에 실패했습니다.'))), 'image/webp', 0.8);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleUpload = async (e, type) => {
        const input = e.target;
        const file = input.files[0];
        input.value = ''; // 같은 파일을 다시 선택해도 onChange 가 발생하도록 초기화
        if (!file || !isAdmin) return;

        const isCert = type === 'cert';
        const table = isCert ? 'certifications' : 'intellectual_properties';
        const folder = isCert ? 'Certifications' : 'IntellectualProperty';
        const list = isCert ? certifications : ipExamples;
        const title = file.name.replace(/\.[^.]+$/, '');
        // 스토리지 키에는 한글·공백 등을 쓸 수 없으므로(Invalid key) 영문/숫자로만 만든다.
        // 원래 파일명은 title 컬럼에 그대로 보존된다.
        const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;
        let uploadedPath = null;

        try {
            if (isCert) setCertUploading(true); else setIpUploading(true);
            const webpBlob = await compressToWebP(file);

            const { error: uploadError } = await supabase.storage.from('images').upload(filePath, webpBlob, { contentType: 'image/webp' });
            if (uploadError) throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
            uploadedPath = filePath;

            const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
            const nextOrder = list.reduce((max, item) => Math.max(max, item.display_order ?? 0), -1) + 1;

            await runMutation(
                supabase.from(table).insert([{ title, image_url: publicUrl, storage_path: filePath, display_order: nextOrder }]).select('id'),
                '데이터 등록'
            );
            uploadedPath = null; // 등록 성공 → 정리 대상 아님
            refetch(type);
        } catch (err) {
            // DB 등록이 실패하면 방금 올린 이미지가 고아 파일로 남지 않게 지운다
            if (uploadedPath) await removeStorageFiles(supabase, 'images', [uploadedPath]);
            alert(err.message || '업로드 실패');
        } finally {
            if (isCert) setCertUploading(false); else setIpUploading(false);
        }
    };

    const handleDelete = async (item, type) => {
        if (!isAdmin) return;
        if (!window.confirm("삭제하시겠습니까?")) return;
        try {
            // DB 행을 먼저 지운다. (파일을 먼저 지웠다가 DB 삭제가 실패하면 깨진 이미지가 남는다)
            await runMutation(
                supabase.from(type === 'cert' ? 'certifications' : 'intellectual_properties').delete().eq('id', item.id).select('id'),
                '삭제'
            );
            await removeStorageFiles(supabase, 'images', [item.storage_path]);
        } catch (err) {
            alert(err.message);
        } finally {
            refetch(type);
        }
    };

    const moveItem = async (index, direction, type) => {
        if (!isAdmin) return;
        const items = type === 'cert' ? [...certifications] : [...ipExamples];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= items.length) return;
        [items[index], items[targetIndex]] = [items[targetIndex], items[index]];

        const reordered = items.map((item, idx) => ({ ...item, display_order: idx }));
        const updates = reordered.map((item) => ({ id: item.id, display_order: item.display_order, title: item.title, image_url: item.image_url, storage_path: item.storage_path }));

        // 화면은 먼저 반영하고, 저장에 실패하면 DB 기준으로 되돌린다
        if (type === 'cert') setCertifications(reordered); else setIpExamples(reordered);
        try {
            await runMutation(
                supabase.from(type === 'cert' ? 'certifications' : 'intellectual_properties').upsert(updates).select('id'),
                '순서 변경'
            );
        } catch (err) {
            alert(err.message);
            refetch(type);
        }
    };

    return (
        <section id="certifications-ip" ref={ref} className="section">
            {/* 인증 섹션 */}
            <div className="sub-section">
                {isAdmin && (
                    <div className="admin-toolbar">
                        <button className={`mode-toggle ${isCertEditMode ? 'active' : ''}`} onClick={() => setIsCertEditMode(!isCertEditMode)}>{isCertEditMode ? '수정 완료' : '순서 및 목록 관리'}</button>
                        {isCertEditMode && <label className="upload-btn"><input type="file" hidden onChange={(e) => handleUpload(e, 'cert')} accept="image/*" />{certUploading ? '처리 중...' : '+ 새 인증서 등록'}</label>}
                    </div>
                )}
                <hr className="section-top-line" />
                <header {...reveal('certHead', 'subsection-header')}><h2 className="subsection-title">인증</h2></header>
                <div className="content-wrapper">
                    <h2 className="subsection-subtitle">검증된 신뢰, 내일의 농업을 뒷받침합니다.</h2>
                    <div className="content-highlight"><p>"다온알에스는 엄격한 국제 표준과 국가 공인 기준을 통과하며 스마트팜 솔루션의 안정성을 입증해 왔습니다."</p></div>
                </div>
                {showCertEdit ? (
                    <div className="admin-card-grid">
                        {certifications.map((item, index) => (
                            <div key={item.id} className="admin-card">
                                <div className="card-image-wrapper"><img src={item.image_url} alt={item.title} /><div className="card-controls"><button onClick={() => moveItem(index, -1, 'cert')} disabled={index === 0}>◀</button><button className="del-btn" onClick={() => handleDelete(item, 'cert')}>삭제</button><button onClick={() => moveItem(index, 1, 'cert')} disabled={index === certifications.length - 1}>▶</button></div></div>
                                <div className="card-info"><span>{item.title}</span></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="cert-gallery-grid">
                        {certifications.map((item) => (
                            <div key={item.id} className="gallery-item"><img src={item.image_url} alt={item.title} /></div>
                        ))}
                    </div>
                )}
            </div>

            {/* 지식재산권 섹션 */}
            <div className="sub-section" style={{ marginTop: '60px' }}>
                {isAdmin && (
                    <div className="admin-toolbar">
                        <button className={`mode-toggle ${isIpEditMode ? 'active' : ''}`} onClick={() => setIsIpEditMode(!isIpEditMode)}>{isIpEditMode ? '수정 완료' : '순서 및 목록 관리'}</button>
                        {isIpEditMode && <label className="upload-btn"><input type="file" hidden onChange={(e) => handleUpload(e, 'ip')} accept="image/*" />{ipUploading ? '처리 중...' : '+ 새 지식재산권 등록'}</label>}
                    </div>
                )}
                <hr className="section-top-line" />
                <header {...reveal('ipHead', 'subsection-header')}><h2 className="subsection-title">지식재산권</h2></header>
                <div className="content-wrapper">
                    <h2 className="subsection-subtitle">특허로 기록된 혁신, 기술의 경계를 넓힙니다.</h2>
                    <div className="content-highlight"><p>"R&D에 대한 집요한 투자가 일궈낸 지식재산권은 미래 농업 시장을 선도하는 다온알에스의 엔진입니다."</p></div>
                </div>
                {showIpEdit ? (
                    <div className="admin-card-grid">
                        {ipExamples.map((item, index) => (
                            <div key={item.id} className="admin-card">
                                <div className="card-image-wrapper"><img src={item.image_url} alt={item.title} /><div className="card-controls"><button onClick={() => moveItem(index, -1, 'ip')} disabled={index === 0}>◀</button><button className="del-btn" onClick={() => handleDelete(item, 'ip')}>삭제</button><button onClick={() => moveItem(index, 1, 'ip')} disabled={index === ipExamples.length - 1}>▶</button></div></div>
                                <div className="card-info"><span>{item.title}</span></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="ip-gallery-grid">
                        {ipExamples.map((item) => (
                            <div key={item.id} className="gallery-item"><img src={item.image_url} alt={item.title} /></div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
});

export default CombinedSection;