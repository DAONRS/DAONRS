import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; 

import './Certificationsection.css';

const CertificationSection = React.forwardRef((props, ref) => {
    const [certifications, setCertifications] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAdmin(!!session);
        };
        checkSession();
    }, []);

    const fetchCertifications = async () => {
        try {
            const { data, error } = await supabase
                .from('certifications')
                .select('*')
                .order('display_order', { ascending: true });
            
            if (error) throw error;
            setCertifications(data);
        } catch (err) {
            console.error('데이터 로드 오류:', err);
        }
    };

    useEffect(() => { fetchCertifications(); }, []);

    const compressToWebP = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxWidth = 1000; 
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) {
                        height = (maxWidth * height) / width;
                        width = maxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.8);
                };
            };
        });
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !isAdmin) return;
        try {
            setUploading(true);
            const webpBlob = await compressToWebP(file);
            const fileName = `${Date.now()}_${file.name.split('.')[0]}.webp`;
            const filePath = `Certifications/${fileName}`;

            await supabase.storage.from('images').upload(filePath, webpBlob, { contentType: 'image/webp' });
            const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);

            await supabase.from('certifications').insert([{
                title: file.name.split('.')[0],
                image_url: publicUrl,
                storage_path: filePath,
                display_order: certifications.length
            }]);
            fetchCertifications();
        } catch (err) {
            alert('업로드 실패');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm("삭제하시겠습니까?")) return;
        await supabase.storage.from('images').remove([item.storage_path]);
        await supabase.from('certifications').delete().eq('id', item.id);
        fetchCertifications();
    };

    const moveItem = async (index, direction) => {
        const newItems = [...certifications];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newItems.length) return;

        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        setCertifications(newItems);

        const updates = newItems.map((item, idx) => ({
            id: item.id,
            display_order: idx,
            title: item.title,
            image_url: item.image_url,
            storage_path: item.storage_path
        }));
        await supabase.from('certifications').upsert(updates);
    };

    return (
        <section id="certifications" ref={ref} className="section">
            <div className="sub-section">
                <header className="subsection-header">
                    <h2 className="subsection-title">인증</h2>
                </header>
                {isAdmin && (
                    <div className="admin-toolbar">
                        <button className={`mode-toggle ${isEditMode ? 'active' : ''}`} onClick={() => setIsEditMode(!isEditMode)}>
                            {isEditMode ? '수정 완료' : '순서 및 목록 관리'}
                        </button>
                        {isEditMode && (
                            <label className="upload-btn">
                                <input type="file" hidden onChange={handleUpload} accept="image/*" />
                                {uploading ? '처리 중...' : '+ 새 인증서 등록'}
                            </label>
                        )}
                    </div>
                )}
                <hr className="section-top-line" />

                <div className="content-wrapper">
                    <h2 className="subsection-subtitle">
                        검증된 신뢰, 내일의 농업을 뒷받침합니다.
                    </h2>
                    <div className="content-highlight">
                        <p>
                            "다온알에스는 엄격한 국제 표준과 국가 공인 기준을 통과하며 스마트팜 솔루션의 안정성을 입증해 왔습니다. <br />
                            단순한 기술을 넘어, 믿고 맡길 수 있는 농업 파트너로서의 책임을 다합니다."
                        </p>
                    </div>
                </div>

                {isEditMode ? (
                    <div className="admin-card-grid">
                        {certifications.map((item, index) => (
                            <div key={item.id} className="admin-card">
                                <div className="card-image-wrapper">
                                    <img src={item.image_url} alt={item.title} />
                                    <div className="card-controls">
                                        <button onClick={() => moveItem(index, -1)} disabled={index === 0}>◀</button>
                                        <button className="del-btn" onClick={() => handleDelete(item)}>삭제</button>
                                        <button onClick={() => moveItem(index, 1)} disabled={index === certifications.length - 1}>▶</button>
                                    </div>
                                </div>
                                <div className="card-info">
                                    <span>{item.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="cert-gallery-grid">
                        <div className="grid-row row-top">
                            {certifications.slice(0, 3).map((item) => (
                                <div key={item.id} className="gallery-item">
                                    <img src={item.image_url} alt={item.title} />
                                </div>
                            ))}
                        </div>
                        {certifications.length > 3 && (
                            <div className="grid-row row-bottom">
                                {certifications.slice(3, 5).map((item) => (
                                    <div key={item.id} className="gallery-item">
                                        <img src={item.image_url} alt={item.title} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
});

export default CertificationSection;