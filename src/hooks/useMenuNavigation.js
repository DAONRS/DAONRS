import { useLocation, useNavigate } from 'react-router-dom';
import { menuItems } from '../content/menuData';
import { useCallback } from 'react';

export const useMenuNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 현재 경로를 기반으로 활성화된 메인 메뉴를 찾습니다.
  const currentMainMenu = menuItems.find(item => location.pathname.startsWith(item.path) && item.path !== '/');

  // 현재 메인 메뉴에 속한 서브 메뉴 목록을 가져옵니다.
  const currentSubMenus = currentMainMenu ? currentMainMenu.subMenus : [];

  // 경로가 현재 활성화된 상태인지 확인합니다.
  const isActive = useCallback((path) => {
    return location.pathname.endsWith(path);
  }, [location.pathname]);

  // 메인 메뉴 링크 클릭 핸들러
  // 서브 메뉴가 있는 경우, 첫 번째 서브 메뉴로 이동합니다.
  const handleMainLinkClick = useCallback((item) => {
    if (item.subMenus && item.subMenus.length > 0) {
      navigate(`${item.path}/${item.subMenus[0].path}`);
    } else {
      navigate(item.path);
    }
  }, [navigate]);

  // 서브 메뉴 링크 클릭 핸들러
  // App.jsx에 스크롤 이벤트를 전달합니다.
  const handleSubLinkClick = useCallback((path) => {
    navigate(path);
    window.dispatchEvent(new CustomEvent('scrollToSubContent'));
  }, [navigate]);

  return {
    currentMainMenu,
    currentSubMenus,
    isActive,
    handleMainLinkClick,
    handleSubLinkClick
  };
};
