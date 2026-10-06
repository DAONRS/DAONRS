import React, { forwardRef } from 'react';
import content from '../../content/DirectionsContent.json';
import './DirectionsSection.css';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaExternalLinkAlt } from 'react-icons/fa';
import { useRevealGroup } from '../../hooks/useScrollReveal';

const DirectionsSection = forwardRef((props, ref) => {
  // 스크롤 진입 시 섹션 단위 등장 애니메이션 (index.css 의 .reveal)
  const reveal = useRevealGroup();

  return (
    <section id="directions" className="section" ref={ref}>
      <div className="sub-section">
        <header {...reveal('head', 'subsection-header')}>
          <h2 className="subsection-title">오시는 길</h2>
        </header>
        <hr className="section-top-line" />
        <h2 {...reveal('sub', 'subsection-subtitle')}>DAONRS는 여러분의 방문을 환영합니다.</h2>
        
        <div {...reveal('hl', 'content-highlight')}>
          <p>방문을 원하신다면 아래 위치 정보를 참고해주세요.</p>
        </div>
        
        <div {...reveal('map', 'map-container')}>
          <div className="map-wrapper">
            <iframe 
              title="지도"
              src={content.googleMapEmbed}
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>       
          </div>
        </div>

        <div {...reveal('info', 'info-layout')}>
          <div className="contact-row">
            <div className="info-item">
              <div className="icon-circle"><FaPhoneAlt /></div>
              <div className="info-text">
                <h3>Tel</h3>
                <p>{content.phone}</p>
              </div>
            </div>
            <div className="info-item">
              <div className="icon-circle"><FaEnvelope /></div>
              <div className="info-text">
                <h3>E-mail</h3>
                <p>{content.email || "thankyou@daonrs.kr"}</p>
              </div>
            </div>
          </div>

          {/* 주소 섹션 */}
          <div className="address-section">
            <div className="icon-circle"><FaMapMarkerAlt /></div>
            
            <div className="address-body">
              {/* 타이틀과 버튼을 한 행에 배치 */}
              <div className="address-header">
                <h3 style={{marginRight: "20px"}}>Address</h3>
                <button 
                  className="map-link-btn"
                  onClick={() => {
                    const encodedAddress = encodeURIComponent(content.address);
                    const naverMapUrl = `https://place.map.kakao.com/724095620`;
                    window.open(naverMapUrl, '_blank');
                  }}
                >
                  <FaExternalLinkAlt size={10} /> 카카오맵으로 보기
                </button>
              </div>
              {/* 주소 텍스트는 아래행에 배치 */}
              <p className="address-text">{content.address}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default DirectionsSection;