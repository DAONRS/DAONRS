import React, { forwardRef, useEffect, useRef } from 'react';
import { MdSensors, MdSettingsRemote, MdStorage } from "react-icons/md";
import './ScopeSection.css';
import img1 from '../../assets/images/1.JPG';
import img2 from '../../assets/images/2.JPG';
import img3 from '../../assets/images/3.JPG';

const ScopeSection = forwardRef((props, ref) => {
  const scrollRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scope-active'); // 클래스명 수정
        }
      });
    }, { threshold: 0.1 });

    const currentRefs = scrollRef.current;
    currentRefs.forEach((el) => { if (el) observer.observe(el); });

    return () => currentRefs.forEach((el) => { if (el) observer.unobserve(el); });
  }, []);

  const items = [
    {
      icon: <MdSensors />,
      title: "환경측정 (Environmental Sensing)",
      desc: "정밀 센서를 통해 온·습도, CO2, 일사량 등 농가 핵심 데이터를 실시간 수집합니다. LoRa 무선망을 통해 끊김 없는 전송을 보장하며 모바일로 실시간 모니터링이 가능합니다.",
      img: img1
    },
    {
      icon: <MdSettingsRemote />,
      title: "환경제어 (Smart Control)",
      desc: "데이터 기반 관수, 냉난방, 차광막 등을 자동으로 제어하여 최적의 생육 환경을 조성합니다. 알고리즘 기반 지능형 제어로 에너지 비용 절감과 수확량 극대화를 실현합니다.",
      img: img2
    },
    {
      icon: <MdStorage />,
      title: "Big Data 구축 (Data Intelligence)",
      desc: "누적된 환경 정보와 재배 이력을 결합하여 농가만의 독자적인 빅데이터를 자산화합니다. 분석된 데이터를 바탕으로 최적의 재배 레시피를 도출하는 지능형 시스템을 구축합니다.",
      img: img3
    }
  ];

  return (
    <section id="scope" ref={ref} className="section">
      <div className="sub-section">
        <header className="subsection-header">
          <h2 className="subsection-title">사업영역</h2>
        </header>
        <hr className="section-top-line" />
        
        <div className="scope-header-group">
          <h2 className="subsection-subtitle">"디지털영농을 선도하는 다온알에스"</h2>
          <p className="content-highlight">
            다온알에스는 첨단 ICT 기술을 농업 현장에 접목하여, <br className="pc-only" />
            데이터 중심의 정밀 농업 솔루션을 통해 지속 가능한 미래 농업의 표준을 제시합니다.
          </p>
        </div>

        {/* 타임라인 컨테이너 클래스 수정 */}
        <div className="scope-timeline-container">
          <div className="scope-timeline-line"></div>
          {items.map((item, idx) => (
            <div 
              key={idx} 
              className={`scope-timeline-item ${idx % 2 === 0 ? 'left' : 'right'}`}
              ref={el => scrollRef.current[idx] = el}
              style={{ transitionDelay: `${idx * 0.15}s` }}
            >
              <div className="scope-timeline-dot"></div>
              
              <div className="scope-text-card">
                <h3 className="scope-title-with-icon">
                  <span className="scope-icon-wrapper">{item.icon}</span>
                  {item.title}
                </h3>
                <p>{item.desc}</p>
              </div>

              <div className="scope-image-card">
                <div className="scope-image-placeholder">
                  <img src={item.img} alt={item.title} className="scope-filled-image" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

export default ScopeSection;