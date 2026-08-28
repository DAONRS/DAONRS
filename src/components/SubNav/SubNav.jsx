import React from 'react';
import { NavLink } from 'react-router-dom';
import { useMenuNavigation } from '../../hooks/useMenuNavigation';
import './SubNav.css';

const SubNav = () => {
  const { currentMainMenu, currentSubMenus, handleSubLinkClick, isActive } = useMenuNavigation();

  if (!currentSubMenus || currentSubMenus.length === 0) {
    return null;
  }

  return (
    <nav className="sub-nav-container">
      <ul>
        {currentSubMenus.map(subItem => {
          const fullPath = `${currentMainMenu.path}/${subItem.path}`;
          return (
            <li key={subItem.name}>
              <NavLink
                to={fullPath}
                className={() => isActive(subItem.path) ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault(); // NavLink의 기본 동작을 막습니다.
                  handleSubLinkClick(fullPath);
                }}
              >
                {subItem.name}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SubNav;