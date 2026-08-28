import React, { useEffect } from 'react';
import './IntellectualPropertyModal.css';

const IntellectualPropertyModal = ({ isOpen, onClose, children }) => {
  // 스크롤 방지 로직
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} // 내부 클릭 시 닫힘 방지
      >
        <button 
          className="modal-close-button" 
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default IntellectualPropertyModal;