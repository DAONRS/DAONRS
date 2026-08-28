import React, { forwardRef } from 'react';
import productImage1 from '../../assets/brochure/tansani/page-0001.jpg';
import productImage2 from '../../assets/brochure/tansani/page-0002.jpg';
import productImage3 from '../../assets/brochure/tansani/page-0003.jpg';
import productImage4 from '../../assets/brochure/tansani/page-0004.jpg';
import './Product1Section.css';

const Product1Section = forwardRef((props, ref) => {
  return (
    <section id="product1" ref={ref} className="section">
      <div className="sub-section">
        <header className="subsection-header">
          <h2 className="subsection-title">촉매형 탄산가스발생기 / 탄사니
              </h2>
        </header>
        <hr className="section-top-line" />
        <img src={productImage1} alt="스마트 측정 제어기" className="product1-image" />
        <img src={productImage2} alt="스마트 측정 제어기" className="product1-image" />
        <img src={productImage3} alt="스마트 측정 제어기" className="product1-image" />
        <img src={productImage4} alt="스마트 측정 제어기" className="product1-image" />
      </div>
    </section>
  );
});

export default Product1Section;