import React from 'react';
import './Footer/Footer.css';
import daonrslogo from '../assets/images/bt_logo.png';

const Footer = React.forwardRef((props, ref) => {
  return (
    <footer ref={ref} className="footer-section">
      <div className="footer-inner">
        {/* 왼쪽: 로고 영역 */}
        
          <div className="footer-logo">
          {/* 실제 로고 이미지 경로로 수정하세요 */}
          <img src={daonrslogo} alt="DAONRS 로고" className="logo-placeholder" />
        </div>

        {/* 중앙: 상세 정보 (Grid 레이아웃) */}
        <div className="footer-info-grid">
          <div className="info-item">
            <span className="label">회사명</span>
            <span className="value">(주)다온알에스</span>
          </div>
          <div className="info-item">
            <span className="label">TEL</span>
            <span className="value">1811-6101</span>
          </div>
          <div className="info-item">
            <span className="label">Address</span>
            <span className="value">광주광역시 북구 용봉로 77, 전남대 정비센터</span>
          </div>
          <div className="info-item">
            <span className="label">FAX</span>
            <span className="value">062-525-0347</span>
          </div>
          <div className="info-item">
            <span className="label">대표자</span>
            <span className="value">정필수</span>
          </div>
          <div className="info-item">
            <span className="label">E-mail</span>
            <span className="value">thankyou@daonrs.kr</span>
          </div>
          <div className="info-item full-width">
            <span className="label">사업자번호</span>
            <span className="value">561-81-00047</span>
          </div>
        </div>

        {/* 오른쪽: 카피라이트 */}
        <div className="footer-copyright">
          {/* <p>Copyright © (주)다온알에스. All Rights Reserved.</p> */}
        </div>
      </div>
    </footer>
  );
});

export default Footer;