// src/components/FloatingBrochureButton.jsx
//
// 화면 우측 하단 고정 "제품 카탈로그" 플로팅 버튼.
//
// - 최상단에서 40vh 이상 내려왔을 때만 서서히 나타난다.
//   (첫 화면 배너를 가리지 않고, 콘텐츠를 읽기 시작한 사용자에게만 노출)
// - 경계값 근처에서 깜빡이지 않도록 나타남/사라짐 기준에 약간의 간격(히스테리시스)을 둔다.
// - 숨김 상태에서는 클릭·키보드 포커스·스크린리더 모두 차단한다.
// - 루트 Lenis 는 window 를 스크롤하므로 window scroll 이벤트로 감지할 수 있다.

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const SHOW_RATIO = 0.4;   // 40vh 를 넘으면 표시
const HIDE_RATIO = 0.3;   // 30vh 위로 올라오면 숨김

export default function FloatingBrochureButton() {
  const [visible, setVisible] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const vh = window.innerHeight;
      setVisible((prev) => (prev ? y > vh * HIDE_RATIO : y > vh * SHOW_RATIO));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pathname]);

  return (
    <Link
      to="/brochure"
      className={`floating-brochure-btn ${visible ? 'is-visible' : ''}`}
      title="제품 카탈로그 보기"
      aria-label="제품 카탈로그 보기 (새 창)"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      target="_blank"
      rel="noopener noreferrer"
    >
      {/* 책 모양 SVG 아이콘 */}
      <svg
        className="book-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>

      {/* 버튼 내부에 고정된 텍스트 (두 줄) */}
      <div className="btn-text-content">
        <span className="btn-text-line1">제품</span>
        <span className="btn-text-line2">카탈로그</span>
      </div>
    </Link>
  );
}
