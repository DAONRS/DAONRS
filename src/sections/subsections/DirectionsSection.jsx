import React, { forwardRef } from 'react';
import content from '../../content/DirectionsContent.json';
import './DirectionsSection.css';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaExternalLinkAlt } from 'react-icons/fa';

const DirectionsSection = forwardRef((props, ref) => {
  return (
    <section id="directions" className="section" ref={ref}>
      <div className="sub-section">
        <header className="subsection-header">
          <h2 className="subsection-title">오시는 길</h2>
        </header>
        <hr className="section-top-line" />
        <h2 className="subsection-subtitle">DAONRS는 여러분의 방문을 환영합니다.</h2>
        
        <div className="content-highlight">
          <p>방문을 원하신다면 아래 위치 정보를 참고해주세요.</p>
        </div>
        
        <div className="map-container">
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

        <div className="info-layout">
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
                <p>{content.email || "saleskss@twim21.com"}</p>
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