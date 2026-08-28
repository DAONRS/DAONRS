import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; 

// 필요에 따라 CSS 파일을 하나로 통합하거나 아래 import를 상황에 맞게 수정하세요.
import './Certificationsection.css';
import './IntellectualPropertySection.css';

const CombinedSection = React.forwardRef((props, ref) => {
    // State for Certifications
    const [certifications, setCertifications] = useState([]);
    const [certUploading, setCertUploading] = useState(false);
    const [isCertEditMode, setIsCertEditMode] = useState(false);

    // State for IP
    const [ipExamples, setIpExamples] = useState([]);
    const [ipUploading, setIpUploading] = useState(false);
    const [isIpEditMode, setIsIpEditMode] = useState(false);

    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAdmin(!!session);
        };
        checkSession();
        fetchCertifications();
        fetchIPImages();
    }, []);

    const fetchCertifications = async () => {
        try {
            const { data, error } = await supabase.from('certifications').select('*').order('display_order', { ascending: true });
            if (error) throw error;
            setCertifications(data);
        } catch (err) { console.error('인증 데이터 로드 오류:', err); }
    };

    const fetchIPImages = async () => {
        try {
            const { data, error } = await supabase.from('intellectual_properties').select('*').order('display_order', { ascending: true });
            if (error) throw error;
            setIpExamples(data);
        } catch (err) { console.error('지식재산권 데이터 로드 오류:', err); }
    };

    const compressToWebP = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxWidth = 1000;
                    let width = img.width, height = img.height;
                    if (width > maxWidth) { height = (maxWidth * height) / width; width = maxWidth; }
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.8);
                };
            };
        });
    };

    const handleUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file || !isAdmin) return;
        try {
            if (type === 'cert') setCertUploading(true); else setIpUploading(true);
            const webpBlob = await compressToWebP(file);
            const table = type === 'cert' ? 'certifications' : 'intellectual_properties';
            const folder = type === 'cert' ? 'Certifications' : 'IntellectualProperty';
            const fileName = `${Date.now()}_${file.name.split('.')[0]}.webp`;
            const filePath = `${folder}/${fileName}`;

            await supabase.storage.from('images').upload(filePath, webpBlob, { contentType: 'image/webp' });
            const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);

            await supabase.from(table).insert([{ title: file.name.split('.')[0], image_url: publicUrl, storage_path: filePath, display_order: type === 'cert' ? certifications.length : ipExamples.length }]);
            type === 'cert' ? fetchCertifications() : fetchIPImages();
        } catch (err) { alert('업로드 실패'); } finally {
            type === 'cert' ? setCertUploading(false) : setIpUploading(false);
        }
    };

    const handleDelete = async (item, type) => {
        if (!window.confirm("삭제하시겠습니까?")) return;
        await supabase.storage.from('images').remove([item.storage_path]);
        await supabase.from(type === 'cert' ? 'certifications' : 'intellectual_properties').delete().eq('id', item.id);
        type === 'cert' ? fetchCertifications() : fetchIPImages();
    };

    const moveItem = async (index, direction, type) => {
        const items = type === 'cert' ? [...certifications] : [...ipExamples];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= items.length) return;
        [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
        
        const updates = items.map((item, idx) => ({ id: item.id, display_order: idx, title: item.title, image_url: item.image_url, storage_path: item.storage_path }));
        await supabase.from(type === 'cert' ? 'certifications' : 'intellectual_properties').upsert(updates);
        type === 'cert' ? setCertifications(items) : setIpExamples(items);
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
                <header className="subsection-header"><h2 className="subsection-title">인증</h2></header>
                <div className="content-wrapper">
                    <h2 className="subsection-subtitle">검증된 신뢰, 내일의 농업을 뒷받침합니다.</h2>
                    <div className="content-highlight"><p>"다온알에스는 엄격한 국제 표준과 국가 공인 기준을 통과하며 스마트팜 솔루션의 안정성을 입증해 왔습니다."</p></div>
                </div>
                {isCertEditMode ? (
                    <div className="admin-card-grid">
                        {certifications.map((item, index) => (
                            <div key={item.id} className="admin-card">
                                <div className="card-image-wrapper"><img src={item.image_url} alt={item.title} /><div className="card-controls"><button onClick={() => moveItem(index, -1, 'cert')}>◀</button><button className="del-btn" onClick={() => handleDelete(item, 'cert')}>삭제</button><button onClick={() => moveItem(index, 1, 'cert')}>▶</button></div></div>
                                <div className="card-info"><span>{item.title}</span></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="cert-gallery-grid">
                        <div className="grid-row row-top">{certifications.slice(0, 3).map((item) => <div key={item.id} className="gallery-item"><img src={item.image_url} alt={item.title} /></div>)}</div>
                        {certifications.length > 3 && <div className="grid-row row-bottom">{certifications.slice(3, 5).map((item) => <div key={item.id} className="gallery-item"><img src={item.image_url} alt={item.title} /></div>)}</div>}
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
                <header className="subsection-header"><h2 className="subsection-title">지식재산권</h2></header>
                <div className="content-wrapper">
                    <h2 className="subsection-subtitle">특허로 기록된 혁신, 기술의 경계를 넓힙니다.</h2>
                    <div className="content-highlight"><p>"R&D에 대한 집요한 투자가 일궈낸 지식재산권은 미래 농업 시장을 선도하는 다온알에스의 엔진입니다."</p></div>
                </div>
                {isIpEditMode ? (
                    <div className="admin-card-grid">
                        {ipExamples.map((item, index) => (
                            <div key={item.id} className="admin-card">
                                <div className="card-image-wrapper"><img src={item.image_url} alt={item.title} /><div className="card-controls"><button onClick={() => moveItem(index, -1, 'ip')}>◀</button><button className="del-btn" onClick={() => handleDelete(item, 'ip')}>삭제</button><button onClick={() => moveItem(index, 1, 'ip')}>▶</button></div></div>
                                <div className="card-info"><span>{item.title}</span></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="ip-gallery-grid">
                        <div className="grid-row row-top">{ipExamples.slice(0, 3).map((item) => <div key={item.id} className="gallery-item"><img src={item.image_url} alt={item.title} /></div>)}</div>
                        {ipExamples.length > 3 && <div className="grid-row row-bottom">{ipExamples.slice(3, 5).map((item) => <div key={item.id} className="gallery-item"><img src={item.image_url} alt={item.title} /></div>)}</div>}
                    </div>
                )}
            </div>
        </section>
    );
});

export default CombinedSection;