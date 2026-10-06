import React, { useLayoutEffect, useRef } from 'react';
import './AdminTopNav.css';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // 1. useNavigate 임포트

const AdminTopNav = () => {
  const { handleLogout } = useAuth();
  const navigate = useNavigate(); // 2. navigate 함수 선언
  const barRef = useRef(null);

  // 관리자 바의 실제 높이를 --admin-bar-h 로 공유한다.
  // 헤더가 이 값만큼 아래로 내려가야 햄버거 버튼이 바에 가려지지 않는다. (Header.css 참고)
  // 높이는 화면 폭·문구 줄바꿈에 따라 달라지므로 고정값 대신 실측한다.
  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const root = document.documentElement;
    const apply = () => root.style.setProperty('--admin-bar-h', `${el.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty('--admin-bar-h');
    };
  }, []);

  return (
    <div className="admin-top-nav" ref={barRef}>
      <div className="container">
        <p>관리자 모드로 로그인 중입니다.</p>
        <div className="nav-buttons">
          {/* 이제 navigate를 정상적으로 사용할 수 있습니다 */}
          <button onClick={() => navigate('/admin')}>대시보드로 이동</button>
          <button onClick={handleLogout}>로그아웃</button>
        </div>
      </div>
    </div>
  );
};

export default AdminTopNav;