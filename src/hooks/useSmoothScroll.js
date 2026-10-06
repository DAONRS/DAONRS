// src/hooks/useSmoothScroll.js
//
// 프로그램적 스크롤 헬퍼.
//
// window.scrollTo 를 직접 호출하면 Lenis 내부 위치값과 어긋나 스크롤이 튀므로
// 코드에서 스크롤을 옮길 때는 반드시 이 훅을 통한다.
//
// Lenis 가 없는 화면(관리자 / 모니터 / 브로슈어)이나 모션 최소화 설정에서는
// 자동으로 네이티브 window.scrollTo 로 폴백한다.

import { useCallback } from 'react';
import { useLenis } from 'lenis/react';
import { matchReducedMotion } from '../utils/motion';

export const useSmoothScroll = () => {
  const lenis = useLenis();

  const scrollToTop = useCallback(
    (immediate = true) => {
      if (lenis) {
        lenis.scrollTo(0, { immediate, force: true });
        return;
      }
      window.scrollTo(0, 0);
    },
    [lenis]
  );

  const scrollToY = useCallback(
    (y, options = {}) => {
      const target = Math.max(0, y);

      if (matchReducedMotion()) {
        if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
        else window.scrollTo(0, target);
        return;
      }

      if (lenis) {
        // duration 을 넘기지 않아야 인스턴스의 lerp 설정을 그대로 따라간다
        // (휠 스크롤과 메뉴 이동의 감각이 어긋나지 않게 한다)
        lenis.scrollTo(target, { force: true, ...options });
        return;
      }
      window.scrollTo({ top: target, behavior: 'smooth' });
    },
    [lenis]
  );

  return { lenis, scrollToTop, scrollToY };
};

export default useSmoothScroll;
