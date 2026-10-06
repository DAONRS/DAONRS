// src/components/LenisScroller.jsx
//
// Lenis 기반 부드러운 스크롤.
//
// - 전역(root) Lenis 인스턴스만 생성하고 DOM 은 렌더하지 않는다.
//   (lenis/react 의 ReactLenis 는 children 이 없으면 null 을 반환하지만 인스턴스는 생성한다)
// - 인스턴스는 lenis/react 의 전역 store 에 등록되므로 앱 어디서든 useLenis() 로 접근 가능하다.
// - 프로그램적 스크롤은 반드시 hooks/useSmoothScroll 을 통해 호출한다.
//   window.scrollTo 를 직접 쓰면 Lenis 내부 위치값과 어긋나 스크롤이 튄다.
//
// 참고: Lenis 필수 CSS(html.lenis ...)는 index.css 하단에 인라인되어 있다.

import { ReactLenis } from 'lenis/react';

/* ------------------------------------------------------------------
   Lenis 가 휠/터치를 가로채면 안 되는 영역

   모달 오버레이·antd 드롭다운·Quill 에디터처럼 자체 스크롤이 필요한 영역은
   네이티브 스크롤로 넘긴다. Lenis 는 이벤트 타깃에서 상위로 올라가며
   이 함수를 호출한다.

   일반적인 내부 스크롤 영역(표, 긴 목록 등)은 allowNestedScroll 옵션이
   자동으로 처리하므로 여기에 나열하지 않아도 된다.
   ------------------------------------------------------------------ */
const PREVENT_CLASSNAMES = [
  'modal-overlay',            // 모달 오버레이
  'ant-drawer',
  'ant-modal-wrap',
  'ant-image-preview-wrap',
  'ant-select-dropdown',
  'ant-picker-dropdown',
  'ant-dropdown',
  'ql-editor',                // react-quill 본문 영역
  'ql-picker-options',
];

const preventNode = (node) => {
  if (!node || node.nodeType !== 1) return false;
  if (typeof node.hasAttribute === 'function' && node.hasAttribute('data-lenis-prevent')) {
    return true;
  }
  const list = node.classList;
  if (!list) return false;
  for (let i = 0; i < PREVENT_CLASSNAMES.length; i += 1) {
    if (list.contains(PREVENT_CLASSNAMES[i])) return true;
  }
  return false;
};

/* ------------------------------------------------------------------
   스크롤 감각 설정

   lerp 방식(프레임 독립 감쇠)을 쓴다. duration + easing 방식이 아니다.

   Lenis 내부 로직상 두 방식은 배타적이며 duration 이 우선한다.
       if (this.duration && this.easing) { ...duration 방식... }
       else if (this.lerp)               { ...lerp 방식...     }
   따라서 lerp 를 쓰려면 duration / easing 을 아예 넘기지 않아야 한다.

   lerp 값이 작을수록 더 길고 부드럽게 따라온다 (Lenis 기본값 0.1).
   0.07 은 한 번의 휠 입력이 약 1.1초에 걸쳐 감쇠하며 멎는 감각이다.
   ------------------------------------------------------------------ */
const LENIS_OPTIONS = {
  lerp: 0.07,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1,
  // 모바일은 네이티브 터치 스크롤을 그대로 둔다 (관성 이중 적용 방지)
  syncTouch: false,
  // 내부 스크롤 영역은 자동으로 네이티브 처리
  allowNestedScroll: true,
  // 앵커 이동은 App.jsx / SubNav 로직이 직접 제어하므로 Lenis 자동 처리는 끈다
  anchors: false,
  prevent: preventNode,
};

/* ------------------------------------------------------------------
   전역 인스턴스 생성 컴포넌트

   prefers-reduced-motion(모션 최소화) 설정과 무관하게 항상 마운트한다.

   과거 두 가지 방식을 거쳤고, 둘 다 되돌렸다.
     1) reduce 면 컴포넌트가 null 을 반환 → Lenis 미생성
     2) reduce 면 smoothWheel: false / lerp: 1 → 사실상 네이티브
   두 방식 모두 Windows "애니메이션 효과" 를 끈 PC(= reduce)에서는
   부드러운 스크롤이 전혀 적용되지 않았다. 참고로 Windows 의 이 설정은
   Chrome 내장 Smooth Scrolling 까지 함께 꺼버리기 때문에, 브라우저에
   맡기는 것으로는 대체가 되지 않는다.

   따라서 휠 스크롤 감각은 OS 설정과 분리해 항상 동일하게 제공한다.
   (등장 애니메이션 .reveal 과 페이지 전환 페이드는 계속 reduce 를 존중한다
    — index.css / App.css 의 @media (prefers-reduced-motion: reduce) 블록과
    hooks/useScrollReveal.js 의 shouldSkipReveal 참고)
   ------------------------------------------------------------------ */
export default function LenisScroller() {
  return <ReactLenis root options={LENIS_OPTIONS} />;
}
