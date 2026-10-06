import React, { forwardRef } from 'react';
import productImage1 from '../../assets/brochure/tansani/page-0001.webp';
import productImage2 from '../../assets/brochure/tansani/page-0002.webp';
import productImage3 from '../../assets/brochure/tansani/page-0003.webp';
import productImage4 from '../../assets/brochure/tansani/page-0004.webp';
import './Product1Section.css';
import { useRevealGroup } from '../../hooks/useScrollReveal';
// 브로슈어/대형 이미지에는 등장 애니메이션을 걸지 않는다.
// 표시 폭은 960px 이지만 원본이 2481x3508px 이라 요소 하나가 1300px 이상이고,
// 여기에 opacity/transform 전환을 걸면 스크롤 중 대형 레이어를 반복 래스터화해
// 오히려 프레임이 끊긴다(A/B 측정: 끊김 8.0% → 9.7% 악화 확인).

const Product1Section = forwardRef((props, ref) => {
  // 스크롤 진입 시 섹션 단위 등장 애니메이션 (index.css 의 .reveal)
  const reveal = useRevealGroup();

  return (
    <section id="product1" ref={ref} className="section">
      <div className="sub-section">
        <header {...reveal('head', 'subsection-header')}>
          <h2 className="subsection-title">촉매형 탄산가스발생기 / 탄사니</h2>
        </header>
        <hr className="section-top-line" />
        <img
          src={productImage1}
          alt="촉매형 탄산가스발생기 탄사니 브로슈어 1페이지"
          className="product1-image"
          loading="lazy"
          decoding="async"
        />
        <img
          src={productImage2}
          alt="촉매형 탄산가스발생기 탄사니 브로슈어 2페이지"
          className="product1-image"
          loading="lazy"
          decoding="async"
        />
        <img
          src={productImage3}
          alt="촉매형 탄산가스발생기 탄사니 브로슈어 3페이지"
          className="product1-image"
          loading="lazy"
          decoding="async"
        />
        <img
          src={productImage4}
          alt="촉매형 탄산가스발생기 탄사니 브로슈어 4페이지"
          className="product1-image"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  );
});

export default Product1Section;
