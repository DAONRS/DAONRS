import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; 

import './IntellectualPropertySection.css';

const IntellectualPropertySection = React.forwardRef((props, ref) => {
    const [ipExamples, setIpExamples] = useState([]);
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

    const fetchIPImages = async () => {
        try {
            const { data, error } = await supabase
                .from('intellectual_properties')
                .select('*')
                .order('display_order', { ascending: true });
            
            if (error) throw error;
            setIpExamples(data);
        } catch (err) {
            console.error('데이터 로드 오류:', err);
        }
    };

    useEffect(() => { fetchIPImages(); }, []);

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
            const filePath = `IntellectualProperty/${fileName}`;

            await supabase.storage.from('images').upload(filePath, webpBlob, { contentType: 'image/webp' });
            const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);

            await supabase.from('intellectual_properties').insert([{
                title: file.name.split('.')[0],
                image_url: publicUrl,
                storage_path: filePath,
                display_order: ipExamples.length
            }]);
            fetchIPImages();
        } catch (err) {
            alert('업로드 실패');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm("삭제하시겠습니까?")) return;
        await supabase.storage.from('images').remove([item.storage_path]);
        await supabase.from('intellectual_properties').delete().eq('id', item.id);
        fetchIPImages();
    };

    const moveItem = async (index, direction) => {
        const newItems = [...ipExamples];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newItems.length) return;

        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        setIpExamples(newItems);

        const updates = newItems.map((item, idx) => ({
            id: item.id,
            display_order: idx,
            title: item.title,
            image_url: item.image_url,
            storage_path: item.storage_path
        }));
        await supabase.from('intellectual_properties').upsert(updates);
    };

    return (
        <section id="ip" ref={ref} className="section">
            <div className="sub-section">
                <header className="subsection-header">
                    <h2 className="subsection-title">지식재산권</h2>
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

                {/* 추가된 서브타이틀 및 하이라이트 섹션 */}
                <div className="content-wrapper">
                    <h2 className="subsection-subtitle">
                        {/* 독보적인 기술력으로 <br/>
                        미래 농업의 표준을 만들어갑니다. */}
                        특허로 기록된 혁신, 기술의 경계를 넓힙니다.
                    </h2>
                    <div className="content-highlight">
                        <p>
                            "R&D에 대한 집요한 투자가 일궈낸 지식재산권은 미래 농업 시장을 선도하는 다온알에스의 엔진입니다. <br />
                             도용될 수 없는 우리만의 기술력으로 농업의 디지털 전환을 이끌어갑니다."

                            {/* 다온알에스의 기술력은 수많은 특허와 인증으로 입증된 <strong>R&D의 결과물</strong>입니다. <br />
                            DAONRS는 <strong>지식재산 중심의 가치 창출</strong>을 통해 스마트팜 현장에 가장 적합한 솔루션을 제공합니다. */}
                        </p>
                    </div>
                </div>

                {isEditMode ? (
                    <div className="admin-card-grid">
                        {ipExamples.map((item, index) => (
                            <div key={item.id} className="admin-card">
                                <div className="card-image-wrapper">
                                    <img src={item.image_url} alt={item.title} />
                                    <div className="card-controls">
                                        <button onClick={() => moveItem(index, -1)} disabled={index === 0}>◀</button>
                                        <button className="del-btn" onClick={() => handleDelete(item)}>삭제</button>
                                        <button onClick={() => moveItem(index, 1)} disabled={index === ipExamples.length - 1}>▶</button>
                                    </div>
                                </div>
                                <div className="card-info">
                                    <span>{item.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="ip-gallery-grid">
                        <div className="grid-row row-top">
                            {ipExamples.slice(0, 3).map((item) => (
                                <div key={item.id} className="gallery-item">
                                    <img src={item.image_url} alt={item.title} />
                                </div>
                            ))}
                        </div>
                        {ipExamples.length > 3 && (
                            <div className="grid-row row-bottom">
                                {ipExamples.slice(3, 5).map((item) => (
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

export default IntellectualPropertySection;