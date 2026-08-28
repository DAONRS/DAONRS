import React, { useEffect } from 'react';
import HomePage from './pages/HomePage';
import { Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AboutPage from './pages/AboutPage';
import BusinessPage from './pages/BusinessPage';
import ProductsPage from './pages/ProductsPage';
import CasesPage from './pages/CasesPage';
import SupportPage from './pages/SupportPage';
import BrochurePage from './pages/BrochurePage';
import './App.css';
import AdminTopNav from './components/AdminTopNav';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { useAuth } from './contexts/AuthContext';
import MonitorPage from './pages/MonitorPage';

function App() {
  const { session, loading, isAdmin } = useAuth();
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith('/admin');
  const isMonitorPage = location.pathname.startsWith('/monitor');
  const isBrochurePage = location.pathname.startsWith('/brochure');

  useEffect(() => {
    window.scrollTo(0, 0);

    const handleScrollToContent = () => {
      setTimeout(() => {
        window.scrollTo({
          top: window.innerHeight,
          behavior: 'smooth'
        });
      }, 100);
    };

    window.addEventListener('scrollToSubContent', handleScrollToContent);
    return () => window.removeEventListener('scrollToSubContent', handleScrollToContent);
  }, [location.pathname]);

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
      {!isMonitorPage && !isBrochurePage && isAdmin && <AdminTopNav />}
      {!isMonitorPage && !isBrochurePage && <Header isAdmin={isAdmin} />}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about/*" element={<AboutPage />} />
          <Route path="/business/*" element={<BusinessPage />} />
          <Route path="/products/*" element={<ProductsPage />} />
          <Route path="/cases/*" element={<CasesPage />} />
          <Route path="/support/*" element={<SupportPage />} />
          <Route path="/monitor/*" element={<MonitorPage />} />
          <Route path="/brochure" element={<BrochurePage />} />
        </Routes>
      </main>

      {!isMonitorPage && !isBrochurePage && <Footer />}
      
      {/* 화면 우측 하단 고정 플로팅 버튼 (아이콘 내부에 텍스트 포함) */}
      {!isMonitorPage && !isBrochurePage && (
        <Link 
          to="/brochure" 
          className="floating-brochure-btn" 
          title="제품 카탈로그 보기"
          target="_blank"
          rel="noopener noreferrer"
        >
          {/* 책 모양 SVG 아이콘 */}
          <svg 
            className="book-icon"
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.8" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          
          {/* 버튼 내부에 고정된 텍스트 (두 줄) */}
          <div className="btn-text-content">
            <span className="btn-text-line1">제품</span>
            <span className="btn-text-line2">카탈로그</span>
          </div>
        </Link>
      )}
    </div>
  );
}

export default App;