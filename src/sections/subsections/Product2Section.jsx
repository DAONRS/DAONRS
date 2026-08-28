import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import productImage1 from '../../assets/brochure/daoni/page-0001.jpg';
import productImage2 from '../../assets/brochure/daoni/page-0002.jpg';
import './Product2Section.css';
import daoniLogo from '../../assets/images/daoni.png';

const Product2Section = forwardRef((props, ref) => {
  return (
    <section id="product2" ref={ref} className="section">
      <div className="sub-section">
        <header className="subsection-header">

          <h2 className="subsection-title"
            style={{ display: 'flex', alignItems: 'flex-end' }}>
            환경데이터 측정기 /
            <Link to="http://www.daonrs.com" target="_blank" style={{ lineHeight: 1 }}>
              <img 
                src={daoniLogo} 
                alt="Daoni Logo" 
                style={{ 
                  height: '60px', 
                  marginLeft: '10px', 
                  filter: 'brightness(0)',
                  display: 'block' // 하단 공백 제거를 위해 추가
                }} 
              />
            </Link>
            {/* <p
            style={{ 
              fontSize: '0.5em',   // 부모 폰트보다 작게 설정
              color: '#666',       // 가독성을 위해 색상을 살짝 연하게 (선택 사항)
              margin: 0,           // p태그 기본 마진 제거
              paddingBottom: '5px' // 이미지 바닥선과 시각적 높이를 맞추기 위한 미세 조정
            }}>
            클릭시 이동
              </p> */}
          </h2>
        
        
        </header>


        <hr className="section-top-line" />
        <img src={productImage1} alt="탄산가스 발생기" className="product2-image" />
        <img src={productImage2} alt="탄산가스 발생기" className="product2-image" />
      </div>
    </section>
  );
});
export default Product2Section;