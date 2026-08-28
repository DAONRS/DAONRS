import React, { forwardRef } from 'react';
import visionImage from '../../assets/images/vision.jpg';
import './VisionSection.css';

// react-icons 임포트
import { FaMicrochip, FaWind, FaTools, FaGlobeAmericas } from 'react-icons/fa';

// 개별 비전 아이템 컴포넌트
const VisionCard = ({ title, subTitle, description, alignClass }) => (
  <div className={`vision-card-unit ${alignClass}`}>
    <div className="unit-card-header">
      <div className="unit-icon-wrapper">
        <div className="unit-dot-pulse"></div>
      </div>
      <h3 className="unit-title">{title}</h3>
    </div>
    
    <div className="unit-text-group">
      <span className="unit-sub-title">{subTitle}</span>
      <p className="unit-description">{description}</p>
    </div>
  </div>
);

const VisionSection = forwardRef((props, ref) => {
  const visionData = [
    {
      title: "환경친화경영",
      subTitle: "ENVIRONMENTALLY-FRIENDLY",
      description: "지속 가능한 미래를 위해 탄소 배출 저감 및 친환경 농업 솔루션을 선도합니다.",
      align: "left"
    },
    {
      title: "고객중심경영",
      subTitle: "CUSTOMER-FOCUSED MANAGEMENT",
      description: "고객의 성공이 곧 우리의 성장이라는 신념으로 맞춤형 서비스를 제공합니다.",
      align: "right-top"
    },
    {
      title: "기술중심경영",
      subTitle: "TECHNOLOGY-BASED",
      description: "R&D 투자를 통해 농업 생산성을 극대화하는 혁신적인 스마트팜 기술을 개발합니다.",
      align: "right-bottom"
    }
  ];

  return (
    <section id="vision" ref={ref} className="section">
      <div className="sub-section">
        {/* 헤더 영역 */}
        <header className="subsection-header">
          <h1 className="subsection-title">기업개요</h1>
        </header>
        <hr className="section-top-line" />
 
        <h2 className="subsection-subtitle">
          "데이터로 설계하는 스마트팜의 새로운 표준"
        </h2>

        <div className="content-highlight">
          <p>
            DAONRS는 고도화된 측정 제어기와 탄산가스 솔루션으로 
            최적의 생육 환경을 만드는 하드웨어 전문가입니다. <br />
            DAONRS는 장비를 넘어 농업의 디지털 전환과 지속 가능한 미래를 구축합니다.
          </p>
        </div>

        {/* 핵심 역량 그리드 영역 (아이콘 적용) */}
        <div className="capability-container">
          <div className="capability-grid">
        
            {/* 01. 스마트 측정 제어 */}
            <div className="capability-item">
              <div className="capa-icon-box">
                <FaMicrochip className="capa-icon" />
              </div>
              <div className="capa-text-group">
                <h3>첨단 스마트 측정 제어 시스템</h3>
                <p>DAONRS의 독자적인 정밀 센싱 기술로 생육 데이터를 실시간 수집하고, 최적화된 지능형 제어 솔루션을 제공합니다.</p>
              </div>
            </div>

            {/* 02. 탄산가스 발생 솔루션 */}
            <div className="capability-item">
              <div className="capa-icon-box">
                <FaWind className="capa-icon" />
              </div>
              <div className="capa-text-group">
                <h3>고효율 탄산가스 발생 솔루션</h3>
                <p>작물의 광합성 효율을 극대화하는 하드웨어 기술을 바탕으로 연중 안정적인 고품질 작물 생산 체계를 구축합니다.</p>
              </div>
            </div>

            {/* 03. 하드웨어 운용 */}
            <div className="capability-item">
              <div className="capa-icon-box">
                <FaTools className="capa-icon" />
              </div>
              <div className="capa-text-group">
                <h3>농업 혁신을 통한 미래 산업 주도</h3>
                <p>현장의 구조적 한계를 하드웨어 설치 및 운용 기술력으로 극복하여 미래 농업의 새로운 패러다임을 이끕니다.</p>
              </div>
            </div>

            {/* 04. 글로벌 시장 진출 */}
            <div className="capability-item">
              <div className="capa-icon-box">
                <FaGlobeAmericas className="capa-icon" />
              </div>
              <div className="capa-text-group">
                <h3>기술 경쟁력 기반 글로벌 시장 확대</h3>
                <p>검증된 장비 신뢰성을 바탕으로 국내외 스마트팜 시장을 적극 공략하여 글로벌 농업 기술의 표준이 되겠습니다.</p>
              </div>
            </div>

          </div>
        </div>
                
                
        <hr className="section-sub-line" />

        <h2 className="subsection-subtitle">
          지속 가능한 농업을 위한 혁신<br />
          Innovation for Sustainable Agriculture
        </h2>

        <div className="content-highlight">
          <p style={{textAlign:'center'}}>
            "혁신적인 기술로 인류와 자연을 잇는 지속 가능한 농업." <br />
            DAONRS는 스마트 농업의 가치를 재정의하고 고객과 환경이 상생하는 풍요로운 내일을 열어갑니다.  
          </p>
        </div>

        {/* 비전 콘텐츠 영역 (서클 & 카드) */}
        <div className="vision-interactive-container">
          <div className="vision-side-area side-left">
            <VisionCard {...visionData[0]} alignClass="align-right" />
          </div>

          <div className="vision-center-area">
            <div className="vision-main-circle">
              <div className="circle-image-inner">
                <img src={visionImage} alt="DAON RS Vision" />
                <div className="circle-overlay">
                  <h1 className="circle-logo">DAON RS</h1>
                </div>
              </div>
            </div>
          </div>

          <div className="vision-side-area side-right">
            <VisionCard {...visionData[1]} alignClass="align-left" />
            <VisionCard {...visionData[2]} alignClass="align-left" />
          </div>
        </div>
      </div>
    </section>
  );
});

export default VisionSection;