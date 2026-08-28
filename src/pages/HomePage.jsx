import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SubNav from '../components/SubNav/SubNav';
import HeroBanner from '../components/HeroBanner';
import ImageGrid from '../components/ImageGrid';
import CasePreviewSection from '../sections/subsections/CasePreviewSection';

import { menuItems } from '../content/menuData'; 
import bannerImagesData from '../content/bannerImages';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import daonrs_img from '../assets/images/daonrs_img.jpg';
import site_logo from '../assets/images/site_logo.png';
import daoni from '../assets/images/daoni.png';

import './HomePage.css';

function HomePage() {
  // 배너 전용 네비게이션 Ref (CasePreviewSection과 별개)
  const bannerPrevRef = useRef(null);
  const bannerNextRef = useRef(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const homeBannerSlides = (bannerImagesData['/'] || []).map((slide, index) => {
    return {
      ...slide,
      link: menuItems[index]?.path || '/about' 
    };
  });

  const heroBannerData = {
    title: "DAONRS와 함께하는 혁신",
    description: "최고의 기술력으로 고객의 성공을 이끌어갑니다.",
    buttonText: "자세히 알아보기",
    buttonLink: "/about/vision"
  };

  const imagesForGrid = [
    { src: daonrs_img, alt: "DAONRS Image 1" },
    { src: site_logo, alt: "DAONRS Logo" },
    { src: daoni, alt: "DAONI" },
    { src: daonrs_img, alt: "DAONRS Image 2" },
  ];

  return (
    <>
      <div className="homepage-banner-container">
        <Swiper
          className="homepage-swiper"
          spaceBetween={0}
          slidesPerView={1}
          speed={2000}
          autoplay={{ delay: 6000, disableOnInteraction: false }}
          pagination={{ clickable: true, el: '.swiper-pagination-custom' }}
          navigation={{
            prevEl: bannerPrevRef.current,
            nextEl: bannerNextRef.current,
          }}
          onBeforeInit={(swiper) => {
            swiper.params.navigation.prevEl = bannerPrevRef.current;
            swiper.params.navigation.nextEl = bannerNextRef.current;
            swiper.params.pagination.el = '.swiper-pagination-custom';
          }}
          onRealIndexChange={(swiper) => setActiveSlideIndex(swiper.realIndex)}
          loop={true}
          modules={[Autoplay, Pagination, Navigation]}
        >
          {homeBannerSlides.map((slide, index) => (
            <SwiperSlide key={index}>
              <div 
                className="slide-bg-image" 
                style={{ backgroundImage: `url(${slide.image})` }}
              ></div>
              
              <div className="slide-content">
                <h2>{slide.title}</h2>
                <p>{slide.subtitle}</p>
                <Link to={slide.link} className="banner-detail-link-inline">
                  {slide.buttonText || "자세히 알아보기"} <span>→</span>
                </Link>
              </div>
            </SwiperSlide>
          ))}
          
          <div className="swiper-pagination-custom"></div>

          {/* 복구된 네비게이션 버튼 영역 */}
          <div className="swiper-controls-container">
            <div className="swiper-navigation-buttons">
              <button ref={bannerPrevRef} className="swiper-button-prev-custom" aria-label="Previous slide"></button>
              <button ref={bannerNextRef} className="swiper-button-next-custom" aria-label="Next slide"></button>
            </div>
          </div>
        </Swiper>
      </div>

      <SubNav />
      <CasePreviewSection />

      <HeroBanner {...heroBannerData} />
      <ImageGrid images={imagesForGrid} />
    </>
  );
}

export default HomePage;