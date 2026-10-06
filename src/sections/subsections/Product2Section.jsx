import React, { forwardRef } from 'react';
import productImage1 from '../../assets/brochure/daoni/page-0001.webp';
import productImage2 from '../../assets/brochure/daoni/page-0002.webp';
import './Product2Section.css';
import daoniLogo from '../../assets/images/daoni.webp';
import { useRevealGroup } from '../../hooks/useScrollReveal';
// 브로슈어/대형 이미지에는 등장 애니메이션을 걸지 않는다.
// 표시 폭은 960px 이지만 원본이 2481x3508px 이라 요소 하나가 1300px 이상이고,
// 여기에 opacity/transform 전환을 걸면 스크롤 중 대형 레이어를 반복 래스터화해
// 오히려 프레임이 끊긴다(A/B 측정: 끊김 8.0% → 9.7% 악화 확인).

const Product2Section = forwardRef((props, ref) => {
  // 스크롤 진입 시 섹션 단위 등장 애니메이션 (index.css 의 .reveal)
  const reveal = useRevealGroup();

  return (
    <section id="product2" ref={ref} className="section">
      <div className="sub-section">
        <header className="subsection-header">
          {/* 로고는 수정 전과 동일하게 h2 안, 제목 오른쪽에 배치.
              인라인 style 만 Product2Section.css 로 옮겨 두어
              모바일에서의 비율 왜곡만 별도로 제어한다. */}
          <h2 {...reveal('head', 'subsection-title', 'product2-title')}>
            환경데이터 측정기 /
            <a
              className="product2-logo-link"
              href="http://www.daonrs.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={daoniLogo} alt="다오니 로고" className="product2-logo" />
            </a>
          </h2>
        </header>

        <hr className="section-top-line" />

        <img
          src={productImage1}
          alt="환경데이터 측정기 다오니 브로슈어 1페이지"
          className="product2-image"
          loading="lazy"
          decoding="async"
        />
        <img
          src={productImage2}
          alt="환경데이터 측정기 다오니 브로슈어 2페이지"
          className="product2-image"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  );
});

export default Product2Section;
