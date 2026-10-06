import React, { useEffect, useLayoutEffect, useRef } from 'react';
import HomePage from './pages/HomePage';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AboutPage from './pages/AboutPage';
import ProductsPage from './pages/ProductsPage';
import CasesPage from './pages/CasesPage';
import SupportPage from './pages/SupportPage';
import BrochurePage from './pages/BrochurePage';
import './App.css';
import AdminTopNav from './components/AdminTopNav';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { useAuth } from './contexts/AuthContext';
import LenisScroller from './components/LenisScroller';
import FloatingBrochureButton from './components/FloatingBrochureButton';
import { useSmoothScroll } from './hooks/useSmoothScroll';

function App() {
  const { session, loading, isAdmin } = useAuth();
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith('/admin');
  const isBrochurePage = location.pathname.startsWith('/brochure');

  // 부드러운 스크롤을 쓰지 않는 화면 (대시보드 / 모니터링 / 페이지플립 브로슈어)
  const enableSmoothScroll = !isAdminPage && !isBrochurePage;

  const { scrollToTop, scrollToY } = useSmoothScroll();
  const mainRef = useRef(null);
  const lastPathRef = useRef(null);

  /* ----------------------------------------------------------------
     화면 전환 페이드 인

     key={pathname} 로 리마운트시키지 않는 이유:
     /about/vision → /about/history 처럼 서브메뉴만 바뀔 때도 AboutPage 가
     통째로 리마운트되어 Banner 의 등장 애니메이션(circleReveal)이 초기화된다.
     이때 배너는 이미 화면 밖이라 IntersectionObserver 가 다시 발동하지 않아
     위로 올리면 배너가 검게 비어 보인다.
     → 리마운트 없이 애니메이션만 재시작시킨다.
     ---------------------------------------------------------------- */
  useLayoutEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    el.classList.remove('page-enter');
    // 강제 리플로우: 같은 애니메이션을 다시 재생시키기 위해 필요하다
    void el.offsetWidth;
    el.classList.add('page-enter');
  }, [location.pathname]);

  // 라우트 변경 시 최상단으로 (Lenis 내부 위치값과 동기화된 방식으로 이동)
  //
  // scrollToTop 은 Lenis 인스턴스가 붙고 떨어질 때마다 새 함수가 되므로
  // 경로가 실제로 바뀐 경우에만 동작시킨다.
  // (그렇지 않으면 Lenis 마운트 직후 의도치 않게 최상단으로 튄다)
  useEffect(() => {
    if (lastPathRef.current === location.pathname) return;
    lastPathRef.current = location.pathname;
    scrollToTop(true);
  }, [location.pathname, scrollToTop]);

  // 서브메뉴 클릭 시 배너 아래 본문으로 부드럽게 이동
  useEffect(() => {
    let timer = null;

    const handleScrollToContent = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        scrollToY(window.innerHeight);
      }, 100);
    };

    window.addEventListener('scrollToSubContent', handleScrollToContent);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('scrollToSubContent', handleScrollToContent);
    };
  }, [scrollToY]);

  if (loading) return <div>Loading...</div>;

  if (isAdminPage) {
    return (
      <Routes>
        <Route path="/admin" element={session ? <AdminDashboardPage /> : <AdminLoginPage />} />
      </Routes>
    );
  }

  return (
    <div className={`App ${isAdmin ? 'admin-logged-in' : ''}`}>
      {enableSmoothScroll && <LenisScroller />}

      {!isBrochurePage && isAdmin && <AdminTopNav />}
      {!isBrochurePage && <Header isAdmin={isAdmin} />}

      <main className="main-content" ref={mainRef}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about/*" element={<AboutPage />} />
          <Route path="/products/*" element={<ProductsPage />} />
          <Route path="/cases/*" element={<CasesPage />} />
          <Route path="/support/*" element={<SupportPage />} />
          <Route path="/brochure" element={<BrochurePage />} />
        </Routes>
      </main>

      {!isBrochurePage && <Footer />}
      
      {/* 화면 우측 하단 고정 카탈로그 버튼 (40vh 이상 스크롤 시 표시) */}
      {!isBrochurePage && <FloatingBrochureButton />}
    </div>
  );
}

export default App;