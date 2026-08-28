import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { menuItems } from '../content/menuData';
import { useMenuNavigation } from '../hooks/useMenuNavigation';
import './Header/Header.css'; 

import logo from '../assets/images/site_logo.png';
import daoniLogo from '../assets/images/daoni.png';

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
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { handleMainLinkClick, handleSubLinkClick, isActive } = useMenuNavigation();
  const windowWidth = useWindowWidth();
  const isDesktop = windowWidth >= 1024;

  const controlNavbar = () => {
    const currentScrollY = window.scrollY;
    setIsScrolled(currentScrollY > 10);
    if (currentScrollY > 200 && currentScrollY > lastScrollY) {
      setVisible(false);
    } else {
      setVisible(true);
    }
    setLastScrollY(currentScrollY);
  };

  useEffect(() => {
    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

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