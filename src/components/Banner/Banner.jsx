import React, { useState, useEffect, useRef } from "react";
import './Banner.css';

const Banner = ({ title, subtitle, image }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    // IntersectionObserver 설정
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(domRef.current); // 애니메이션이 한 번만 실행되도록 관찰 종료
        }
      });
    }, { threshold: 0.2 }); // 요소가 20% 보일 때 실행

    const { current } = domRef;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <section 
      ref={domRef} 
      className={`banner-container ${isVisible ? 'is-visible' : ''}`}
      // CSS 변수를 사용하여 이미지를 전달합니다.
      style={{ '--banner-img': image ? `url(${image})` : 'none' }}
    >
      <div className={`banner-content ${isVisible ? 'is-visible' : ''}`}>
        <h1 className="banner-title">{title}</h1>
        <h2 className="banner-subtitle">{subtitle}</h2>
      </div>
    </section>
  );
};

export default Banner;