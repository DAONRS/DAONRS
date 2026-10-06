// src/utils/motion.js
// 모션 최소화(prefers-reduced-motion) 설정 감지 유틸.
// Lenis / 등장 애니메이션 / 화면 전환이 모두 같은 기준을 쓰도록 한 곳에 둔다.

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const matchReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(REDUCED_MOTION_QUERY).matches;

export default matchReducedMotion;
