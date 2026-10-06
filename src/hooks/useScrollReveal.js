// src/hooks/useScrollReveal.js
//
// 스크롤 진입 시 한 번 나타나는 등장 애니메이션 훅.
// 실제 스타일은 index.css 의 `.reveal` / `.reveal.active` 에 정의되어 있다.
//
// 두 가지를 제공한다.
//
//   useScrollReveal()  — 단일 요소용
//     const { ref, getClassName } = useScrollReveal();
//     <div ref={ref} className={getClassName('my-class')}>
//
//   useRevealGroup()   — 한 컴포넌트 안의 여러 블록용 (권장)
//     const reveal = useRevealGroup();
//     <header {...reveal('head', 'subsection-header')}>
//     <div    {...reveal('body', 'content-wrapper')}>
//
// ※ 섹션 전체(.sub-section)에 한 번에 거는 방식은 쓰지 않는다.
//    3000~7000px 짜리 거대 요소에 opacity/transform 전환을 걸면
//    브라우저가 그 서브트리 전체를 별도 레이어로 승격·재래스터화하면서
//    스크롤 프레임이 끊긴다(측정: 끊긴 프레임 9.0% → 블록 단위 전환 시 개선).
//    반드시 섹션 내부의 개별 블록 단위로 건다.

import { useCallback, useEffect, useRef, useState } from 'react';

// IntersectionObserver 미지원 브라우저 → 애니메이션 없이 즉시 노출
//
// prefers-reduced-motion 은 더 이상 여기서 보지 않는다.
// Windows 의 "애니메이션 효과" 를 끈 PC 가 전부 reduce 로 잡히는 탓에
// 그 환경에서는 등장 효과가 통째로 사라졌기 때문이다.
// (스크롤 감각 LenisScroller / index.css .reveal 과 기준을 통일)
const shouldSkipReveal = () => typeof IntersectionObserver === 'undefined';

const joinClassNames = (isVisible, extras) =>
  ['reveal', isVisible ? 'active' : '', ...extras].filter(Boolean).join(' ');

export const useScrollReveal = (options = {}) => {
  const {
    // threshold 는 0 으로 둔다.
    // 0.1 로 두면 뷰포트의 10배가 넘는 긴 블록(에디터로 올린 긴 본문 등)은
    // 교차율이 0.1 에 영원히 도달하지 못해 opacity: 0 에 갇힌다.
    // 발동 시점은 아래 rootMargin 이 담당하므로 0 이어도 동작은 같다.
    threshold = 0,
    // 화면 아래쪽 8% 는 아직 "등장"으로 치지 않는다 → 너무 이른 발동 방지
    rootMargin = '0px 0px -8% 0px',
    once = true,
  } = options;

  // IntersectionObserver 미지원이면 처음부터 보이는 상태로 시작한다
  // (콘텐츠가 opacity: 0 에 갇히는 사고 방지).
  // 초기값으로 처리하므로 effect 안에서 동기 setState 를 할 필요가 없다.
  const [isVisible, setIsVisible] = useState(shouldSkipReveal);

  // ref 객체가 아닌 콜백 ref 를 쓴다.
  // 로딩 스켈레톤 → 실제 콘텐츠처럼 대상 엘리먼트가 교체되는 경우
  // ref 객체 방식은 최초 엘리먼트만 관찰한 채 남아 새 콘텐츠가
  // opacity: 0 상태로 영영 멈추는 문제가 생긴다.
  const [node, setNode] = useState(null);
  const setRef = useCallback((el) => setNode(el ?? null), []);

  useEffect(() => {
    const el = node;
    if (!el) return undefined;

    // 즉시 노출 대상이면 관찰하지 않는다 (초기 state 에서 이미 true)
    if (shouldSkipReveal()) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // ref 대신 entry.target 을 쓴다 → 언마운트 타이밍의 null 참조 방지
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [node, threshold, rootMargin, once]);

  // 기존 클래스명을 덮어쓰지 않고 합쳐서 돌려준다
  const getClassName = useCallback(
    (...extraClassNames) => joinClassNames(isVisible, extraClassNames),
    [isVisible]
  );

  return {
    ref: setRef,
    isVisible,
    getClassName,
    className: getClassName(),
  };
};

/* ------------------------------------------------------------------
   한 컴포넌트 안의 여러 블록을 하나의 IntersectionObserver 로 관찰한다.

   반환값은 함수이며, 블록마다 key 를 주고 호출하면
   { ref, className } 을 돌려준다. JSX 에서 스프레드로 붙인다.

       const reveal = useRevealGroup();
       <header {...reveal('head', 'subsection-header')}>

   - ref 콜백은 key 별로 캐시되어 매 렌더마다 새로 만들어지지 않는다.
     (매번 새 함수를 넘기면 React 가 ref 를 null → node 로 다시 호출해
      관찰이 계속 끊겼다 붙었다 한다)
   - 조건부 렌더로 엘리먼트가 교체돼도 정상 동작한다.
   ------------------------------------------------------------------ */
export const useRevealGroup = (options = {}) => {
  const {
    // 0.1 이면 아주 긴 블록이 영영 발동하지 않는다 (위 useScrollReveal 주석 참고)
    threshold = 0,
    rootMargin = '0px 0px -8% 0px',
    once = true,
  } = options;

  const [skip] = useState(shouldSkipReveal);
  const [visibleKeys, setVisibleKeys] = useState(() => new Set());

  const observerRef = useRef(null);
  const keyToNodeRef = useRef(new Map());
  const nodeToKeyRef = useRef(new Map());
  const refCacheRef = useRef(new Map());

  const getObserver = useCallback(() => {
    if (observerRef.current) return observerRef.current;
    if (skip) return null;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const revealed = [];
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const key = nodeToKeyRef.current.get(entry.target);
          if (key === undefined) return;
          revealed.push(key);
          if (once) observerRef.current?.unobserve(entry.target);
        });
        if (!revealed.length) return;
        setVisibleKeys((prev) => {
          const next = new Set(prev);
          revealed.forEach((k) => next.add(k));
          return next;
        });
      },
      { threshold, rootMargin }
    );
    return observerRef.current;
  }, [skip, threshold, rootMargin, once]);

  // 언마운트 시 정리
  useEffect(
    () => () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      keyToNodeRef.current.clear();
      nodeToKeyRef.current.clear();
    },
    []
  );

  const getRef = useCallback(
    (key) => {
      const cached = refCacheRef.current.get(key);
      if (cached) return cached;

      const callbackRef = (el) => {
        const previous = keyToNodeRef.current.get(key);
        if (previous && previous !== el) {
          observerRef.current?.unobserve(previous);
          nodeToKeyRef.current.delete(previous);
          keyToNodeRef.current.delete(key);
        }
        if (!el) return;

        keyToNodeRef.current.set(key, el);
        nodeToKeyRef.current.set(el, key);
        getObserver()?.observe(el);
      };

      refCacheRef.current.set(key, callbackRef);
      return callbackRef;
    },
    [getObserver]
  );

  return useCallback(
    (key, ...extraClassNames) => ({
      ref: getRef(key),
      className: joinClassNames(skip || visibleKeys.has(key), extraClassNames),
    }),
    [getRef, skip, visibleKeys]
  );
};

export default useScrollReveal;
