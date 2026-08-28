import { useState, useEffect, useRef } from 'react';

export const useScrollSpy = (targetRefs, options = {}) => {
  // 1. 초기값을 null 대신 첫 번째 섹션 등으로 설정하거나, 로직에서 처리
  const [activeId, setActiveId] = useState(null);
  const observer = useRef(null);
  const intersectingElements = useRef(new Map());

  useEffect(() => {
    if (observer.current) {
      observer.current.disconnect();
    }

    const defaultOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0,
      ...options,
    };

    // 현재 스파이 중인 요소들 중 가장 적절한 활성 ID를 찾는 함수를 분리
    const determineActiveId = () => {
      let lastIntersectingTarget = null;
      for (const ref of targetRefs) {
        if (ref.current && intersectingElements.current.get(ref.current)) {
          lastIntersectingTarget = ref.current;
        }
      }
      if (lastIntersectingTarget) {
        setActiveId(lastIntersectingTarget.id);
      }
    };

    observer.current = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        intersectingElements.current.set(entry.target, entry.isIntersecting);
      });
      determineActiveId();
    }, defaultOptions);

    const { current: currentObserver } = observer;
    
    // 2. 관찰 시작 시점에 이미 화면에 있는 요소를 강제로 체크하기 위해 
    // 약간의 지연(setTimeout)을 주어 브라우저의 레이아웃 계산을 기다립니다.
    targetRefs.forEach(ref => {
      if (ref.current) {
        currentObserver.observe(ref.current);
      }
    });

    // [핵심 추가] 새로고침 시 초기 스크롤 위치에 따른 즉각 감지 로직
    const initialCheck = () => {
      const scrollPos = window.scrollY + (window.innerHeight * 0.2); // rootMargin과 유사한 기준
      let currentSection = '';

      targetRefs.forEach((ref) => {
        if (ref.current && scrollPos >= ref.current.offsetTop) {
          currentSection = ref.current.id;
        }
      });
      
      if (currentSection) setActiveId(currentSection);
    };

    initialCheck(); // 즉시 실행

    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
    };
  }, [targetRefs, JSON.stringify(options)]);

  return activeId;
};