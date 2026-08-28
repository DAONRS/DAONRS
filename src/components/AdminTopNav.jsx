import React from 'react';
import './AdminTopNav.css';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // 1. useNavigate 임포트

const AdminTopNav = () => {
  const { handleLogout } = useAuth();
  const navigate = useNavigate(); // 2. navigate 함수 선언

  return (
    <div className="admin-top-nav">
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