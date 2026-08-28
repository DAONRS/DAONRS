import React, { useState, useEffect, useRef } from 'react'; // useRef 추가
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { supabase } from '../../supabaseClient';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './CasePreviewSection.css';

const CasePreviewSection = () => {
    const [recentCases, setRecentCases] = useState([]);
    const navigate = useNavigate();
    
    // 이관된 부분: 커스텀 버튼 연결을 위한 Ref
    const prevRef = useRef(null);
    const nextRef = useRef(null);

    useEffect(() => {
        const fetchRecentCases = async () => {
            const { data, error } = await supabase
                .from('case_examples')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (error) console.error('Error fetching cases:', error);
            else setRecentCases(data || []);
        };
        fetchRecentCases();
    }, []);

    const getThumbnail = (htmlContent) => {
        // 1. 이미지 태그가 있는 경우 우선 추출
        const imgRegex = /<img[^>]+src="([^">]+)"/;
        const match = imgRegex.exec(htmlContent);
        if (match) return match[1];

        // 2. 유튜브 iframe src 또는 일반 유튜브 링크 감지
        // youtube.com/embed/ID, youtube.com/watch?v=ID, youtu.be/ID 매칭
        const ytRegex = /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const ytMatch = ytRegex.exec(htmlContent);
        if (ytMatch && ytMatch[1]) {
            return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
        }

        return 'https://via.placeholder.com/600x400?text=No+Image';
    };

    return (
        <section className="section">
            <div className="sub-section">
                <div className="case-preview-body">
                    <div className="portfolio-intro">
                        <p className="portfolio-sub">LATEST PROJECTS</p>
                        <h3 className="portfolio-main">현장에서 증명된 스마트 농업 솔루션</h3>
                    </div>

                    <div className="custom-swiper-container">
                        {/* 이전 버튼: ref 연결 */}
                        <button ref={prevRef} className="nav-btn-custom prev-trigger">
                            <span className="arrow">〈</span>
                            <div className="label-group">
                                <span className="label-top">PREV</span>
                                <span className="label-bottom">이전 사례</span>
                            </div>
                        </button>

                        <div className="swiper-mask">
                            {/* 데이터가 있을 때만 Swiper 렌더링 (Navigation Ref 매핑 보장) */}
                            {recentCases.length > 0 && (
                                <Swiper
                                    modules={[Autoplay, Pagination, Navigation]}
                                    spaceBetween={20}
                                    slidesPerView={1}
                                    speed={1200}
                                    loop={recentCases.length > 1}
                                    autoplay={{ delay: 5000, disableOnInteraction: false }}
                                    navigation={{
                                        prevEl: prevRef.current,
                                        nextEl: nextRef.current,
                                    }}
                                    onBeforeInit={(swiper) => {
                                        // 초기화 시점에 버튼 엘리먼트 할당
                                        swiper.params.navigation.prevEl = prevRef.current;
                                        swiper.params.navigation.nextEl = nextRef.current;
                                    }}
                                    pagination={{ clickable: true }}
                                    className="case-single-swiper"
                                >
                                    {recentCases.map((item) => (
                                        <SwiperSlide key={item.id}>
                                            <div className="case-slide-item" onClick={() => {
                                                const targetPath = item.category === 'example2' ? 'example2' : 'example1';
                                                navigate(`/cases/${targetPath}`, { state: { selectedId: item.id } });
                                            }}>
                                                <div className="case-img-wrapper">
                                                    <img src={getThumbnail(item.content)} alt={item.title} />
                                                </div>
                                                <div className="case-text-wrapper">
                                                    <h4 className="case-item-title">{item.title}</h4>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            )}
                            
                            <div className="view-more-container">
                                <button onClick={() => navigate('/cases')} className="view-more-link">
                                    더 많은 사례 보러가기 <span className="view-more-icon">→</span>
                                </button>
                            </div>
                        </div>

                        {/* 다음 버튼: ref 연결 */}
                        <button ref={nextRef} className="nav-btn-custom next-trigger">
                            <div className="label-group align-right">
                                <span className="label-top">NEXT</span>
                                <span className="label-bottom">다음 사례</span>
                            </div>
                            <span className="arrow">〉</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CasePreviewSection;