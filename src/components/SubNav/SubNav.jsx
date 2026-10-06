import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useMenuNavigation } from '../../hooks/useMenuNavigation';
import './SubNav.css';

const SubNav = () => {
  const { currentMainMenu, currentSubMenus, handleSubLinkClick, isActive } = useMenuNavigation();

  const listRef = useRef(null);
  const activeRef = useRef(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const subMenuCount = currentSubMenus ? currentSubMenus.length : 0;

  // 스크롤 여지가 있는 방향에만 페이드를 켠다 (잘림이 아니라 "더 있음"을 표시)
  const syncEdges = useCallback(() => {
    const list = listRef.current;
    if (!list) return;

    const overflow = list.scrollWidth - list.clientWidth;
    if (overflow <= 1) {
      setEdges((prev) => (prev.start || prev.end ? { start: false, end: false } : prev));
      return;
    }

    const next = {
      start: list.scrollLeft > 1,
      end: list.scrollLeft < overflow - 1,
    };
    setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;

    syncEdges();
    list.addEventListener('scroll', syncEdges, { passive: true });
    window.addEventListener('resize', syncEdges);

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(syncEdges);
      observer.observe(list);
    }

    return () => {
      list.removeEventListener('scroll', syncEdges);
      window.removeEventListener('resize', syncEdges);
      if (observer) observer.disconnect();
    };
  }, [syncEdges, subMenuCount]);

  // 현재 선택된 항목이 화면 밖이면 가운데로 끌어온다
  useEffect(() => {
    const list = listRef.current;
    const item = activeRef.current;
    if (!list || !item) return;

    const max = list.scrollWidth - list.clientWidth;
    if (max <= 1) return;

    const listRect = list.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const delta =
      itemRect.left + itemRect.width / 2 - (listRect.left + listRect.width / 2);

    const left = Math.max(0, Math.min(list.scrollLeft + delta, max));
    if (Math.abs(list.scrollLeft - left) < 2) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    list.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [isActive, subMenuCount]);

  if (!currentSubMenus || currentSubMenus.length === 0) {
    return null;
  }

  const listClassName = [
    edges.start ? 'fade-start' : '',
    edges.end ? 'fade-end' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <nav className="sub-nav-container" aria-label="섹션 이동">
      <ul ref={listRef} className={listClassName}>
        {currentSubMenus.map((subItem) => {
          const fullPath = `${currentMainMenu.path}/${subItem.path}`;
          const active = isActive(subItem.path);

          return (
            <li key={subItem.name} ref={active ? activeRef : null}>
              <NavLink
                to={fullPath}
                className={() => (active ? 'active' : '')}
                aria-current={active ? 'page' : undefined}
                title={subItem.name}
                onClick={(e) => {
                  e.preventDefault(); // NavLink의 기본 동작을 막습니다.
                  handleSubLinkClick(fullPath);
                }}
              >
                <span className="sub-nav-label-full">{subItem.name}</span>
                <span className="sub-nav-label-short">
                  {subItem.shortName || subItem.name}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SubNav;
