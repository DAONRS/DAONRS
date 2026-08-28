import React from 'react';
import './HomeFloatingButton.css';

const HomeFloatingButton = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className="floating-home-button"
      aria-label="맨 위로 이동"
    >
      <span className="icon">▲</span> {/* Changed to upward triangle/chevron */}
      <span className="button-text">TOP</span> {/* Changed text */}
    </button>
  );
};

export default HomeFloatingButton;
