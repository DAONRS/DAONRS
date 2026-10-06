import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { menuItems } from '../content/menuData';
import { useMenuNavigation } from '../hooks/useMenuNavigation';
import './Header/Header.css'; 

import logo from '../assets/images/site_logo.webp';
import daoniLogo from '../assets/images/daoni.webp';

const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return windowWidth;
};

const Header = ({ isAdmin }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFullscreenNavOpen, setIsFullscreenNavOpen] = useState(false);
  const [openMobileSubMenu, setOpenMobileSubMenu] = useState(null);
  const [visible, setVisible] = useState(true);
  // 직전 스크롤 위치는 화면에 그려지는 값이 아니므로 state 가 아니라 ref 로 둔다.
  // state 로 두면 스크롤 프레임마다 Header 전체가 리렌더된다.
  const lastScrollYRef = useRef(0);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { handleMainLinkClick, handleSubLinkClick, isActive } = useMenuNavigation();
  const windowWidth = useWindowWidth();
  const isDesktop = windowWidth >= 1024;

  /* --------------------------------------------------------------
     스크롤에 따른 헤더 표시/축소

     - 리스너는 마운트 시 한 번만 등록한다 (의존성 배열 비움).
       이전에는 [lastScrollY] 에 묶여 있어 스크롤 프레임마다
       해제 → 재등록이 반복됐다.
     - passive: true → 브라우저가 스크롤을 리스너 대기 없이 진행시킨다.
     - requestAnimationFrame 스로틀 → 한 프레임당 한 번만 계산한다.
     - setState 는 값이 실제로 바뀔 때만 호출 (React 의 bailout 에만
       기대지 않고 명시적으로 막는다).

     ★ 다음 값(nextVisible)은 반드시 setState 업데이터 "밖"에서 계산한다.

     업데이터 함수는 즉시 실행되지 않고 React 가 업데이트 큐를 처리하는
     렌더 시점에 호출된다. 그 시점에는 아래 lastScrollYRef 대입이 이미
     끝나 있어 `currentScrollY > lastScrollYRef.current` 가 항상 false 가
     되고, 결과적으로 헤더가 절대 숨겨지지 않는다.
     → 이전 프레임 값을 먼저 지역 변수로 떠놓고 비교한다.
     -------------------------------------------------------------- */
  useEffect(() => {
    let ticking = false;

    const update = () => {
      ticking = false;
      const currentScrollY = window.scrollY;

      // 비교에 쓸 이전 프레임 값을 먼저 확보한 뒤 ref 를 갱신한다
      const previousScrollY = lastScrollYRef.current;
      lastScrollYRef.current = currentScrollY;

      const nextScrolled = currentScrollY > 10;
      // 200px 아래에서 "더 내려가는 중" 일 때만 숨긴다
      const nextVisible = !(currentScrollY > 200 && currentScrollY > previousScrollY);

      setIsScrolled((prev) => (prev === nextScrolled ? prev : nextScrolled));
      setVisible((prev) => (prev === nextVisible ? prev : nextVisible));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsFullscreenNavOpen(false);
    setOpenMobileSubMenu(null);
  }, [windowWidth]);

  const toggleMenu = () => {
    if (isDesktop) setIsFullscreenNavOpen(!isFullscreenNavOpen);
    else setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsFullscreenNavOpen(false);
    setOpenMobileSubMenu(null);
    setActiveMenu(null);
  };

  const handleSubMenuClick = (path) => {
    closeAllMenus();
    handleSubLinkClick(path);
  };

  const handleMobileMainClick = (menuName) => {
    setOpenMobileSubMenu(openMobileSubMenu === menuName ? null : menuName);
  };

  const mobileNavLinks = (
    <div className="menu-wrapper">
      <ul>
        {menuItems.map((item) => (
          <li key={item.name}>
            <div className="main-menu-group">
              <div className="main-menu-item">
                {item.subMenus ? (
                  <button 
                    className={`menu-title-btn ${openMobileSubMenu === item.name ? 'is-active' : ''}`} 
                    onClick={() => handleMobileMainClick(item.name)}
                  >
                    {item.name}
                  </button>
                ) : (
                  <NavLink to={item.path} onClick={closeAllMenus}>{item.name}</NavLink>
                )}
              </div>
              {item.subMenus && (
                <ul className={`mobile-submenu ${openMobileSubMenu === item.name ? 'show' : ''}`}>
                  {item.subMenus.map(subItem => {
                    const fullPath = `${item.path}/${subItem.path}`;
                    return (
                      <li key={subItem.name}>
                        <NavLink to={fullPath} onClick={() => handleSubMenuClick(fullPath)}>{subItem.name}</NavLink>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  const desktopNavLinks = (
    <div className="menu-wrapper">
      <ul>
        {menuItems.map((item) => (
          <li key={item.name}>
            <div className="main-menu-group">
              <div className="main-menu-item">
                {item.subMenus ? <span>{item.name}</span> : <NavLink to={item.path} onClick={closeAllMenus}>{item.name}</NavLink>}
              </div>
              {item.subMenus && (
                <ul className="submenu">
                  {item.subMenus.map(subItem => {
                     const fullPath = `${item.path}/${subItem.path}`;
                    return (
                    <li key={subItem.name}>
                      <NavLink to={fullPath} onClick={() => handleSubMenuClick(fullPath)}>{subItem.name}</NavLink>
                    </li>
                  )})}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <header className={`header-container ${visible ? 'is-visible' : ''} ${isAdmin ? 'is-admin' : ''} ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="header-inner">
          <div className={`logo-container ${isScrolled ? 'is-scrolled' : ''}`}>
            <Link to="/" onClick={closeAllMenus}><img src={logo} alt="Logo" /></Link>
          </div>
          
          <nav className={`desktop-nav-container ${isScrolled ? 'is-scrolled' : ''}`}>
            <ul className="main-menu-list">
              {menuItems.map((item) => (
                <li key={item.name} className="main-menu-item" onMouseEnter={() => setActiveMenu(item.name)} onMouseLeave={() => setActiveMenu(null)}>
                  {item.subMenus ? (
                    <NavLink 
                      to={`${item.path}/${item.subMenus[0].path}`} 
                      className={() => isActive(item.path) ? 'active' : ''} 
                      onClick={(e) => {
                        e.preventDefault();
                        handleMainLinkClick(item);
                        closeAllMenus();
                      }}>
                      {item.name}
                    </NavLink>
                  ) : (
                    <NavLink to={item.path} onClick={closeAllMenus} className={({ isActive }) => (isActive ? 'active' : '')}>
                      {item.name}
                    </NavLink>
                  )}
                  {activeMenu === item.name && item.subMenus && (
                    <div className={`dropdown-menu ${isScrolled ? 'is-scrolled' : ''}`}>
                      <ul>
                        {item.subMenus.map(subItem => {
                           const fullPath = `${item.path}/${subItem.path}`;
                          return (
                          <li key={subItem.name}>
                            <NavLink to={fullPath} onClick={() => handleSubMenuClick(fullPath)}>{subItem.name}</NavLink>
                          </li>
                        )})}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* {isDesktop && (
          <div className="logo-container top-daoni">
            <Link to="http://www.daonrs.com" target="_blank" onClick={closeAllMenus}>
              <img 
                src={daoniLogo} 
                alt="Daoni Logo" 
                style={{ height: '60px', marginRight: '20px' }} 
              />
            </Link>
          </div>
          )} */}

          <button onClick={toggleMenu} className={`hamburger-menu ${isScrolled ? 'is-scrolled' : ''}`}>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </button>
        </div>
      </header>

      {/* Fullscreen Nav (Desktop - 햄버거 클릭 시) */}
      <div className={`fullscreen-nav-wrapper ${isFullscreenNavOpen ? 'is-open' : ''}`}>
        <div className="fullscreen-header">
           <div className="logo-container">
             <Link to="/" onClick={closeAllMenus}><img src={logo} alt="Logo" className="menu-open-logo" /></Link>
           </div>
           <button onClick={closeAllMenus} className="close-button"><span></span><span></span></button>
        </div>
        <div className="fullscreen-content">
          <nav className="nav-list is-desktop">
            {desktopNavLinks}
          </nav>
        </div>
      </div>

      {/* Side Panel (Mobile) */}
      <div className={`side-panel-wrapper ${isMobileMenuOpen ? 'is-open' : ''}`}>
        <div className="panel-header">
          <div className="logo-container">
            <Link to="/" onClick={closeAllMenus}><img src={logo} alt="Logo" className="menu-open-logo" /></Link>
          </div>
          <button onClick={closeAllMenus} className="close-button"><span></span><span></span></button>
        </div>

        <div className="panel-content">
          <div className="menu-scroll-area">
            <nav className="nav-list">{mobileNavLinks}</nav>
          </div>

          {/* <div className="side-panel-footer">
            <Link to="http://www.daonrs.com" target="_blank" onClick={closeAllMenus}>
              <img src={daoniLogo} alt="Daoni Logo" />
            </Link>
          </div> */}
        </div>
      </div>

      {(isMobileMenuOpen || isFullscreenNavOpen) && <div className="overlay" onClick={closeAllMenus} />}
    </>
  );
};

export default Header;