import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useNavigation = (menuItems) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [activeMainMenu, setActiveMainMenu] = useState(null);
  const [activeSubMenu, setActiveSubMenu] = useState(null);

  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const mainPath = pathParts.length > 0 ? `/${pathParts[0]}` : '/';
    
    const currentMain = menuItems.find(item => item.path === mainPath);
    if (currentMain) {
      setActiveMainMenu(currentMain.path);
      
      if (pathParts.length > 1) {
        const subPath = pathParts[1];
        const currentSub = currentMain.subMenus.find(sub => sub.path === subPath);
        if (currentSub) {
          setActiveSubMenu(`${currentMain.path}/${currentSub.path}`);
        }
      } else if (currentMain.subMenus && currentMain.subMenus.length > 0) {
        // 메인 메뉴 클릭 시 첫 서브메뉴 활성화
        setActiveSubMenu(`${currentMain.path}/${currentMain.subMenus[0].path}`);
      }
    } else {
      setActiveMainMenu(null);
      setActiveSubMenu(null);
    }
  }, [location.pathname, menuItems]);

  const handleSubNavClick = () => {
    window.dispatchEvent(new CustomEvent('scrollToSubContent'));
  };

  const navigateTo = (path) => {
    navigate(path);
  };
  
  return { activeMainMenu, activeSubMenu, handleSubNavClick, navigateTo };
};
