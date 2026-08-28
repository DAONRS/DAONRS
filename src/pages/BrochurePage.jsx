import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HTMLFlipBook from 'react-pageflip';

// 이미지 임포트 (다오니, 탄사니 전체 포함)
import daoni1 from '../assets/brochure/daoni/page-0001.jpg';
import daoni2 from '../assets/brochure/daoni/page-0002.jpg';
import tansani1 from '../assets/brochure/tansani/page-0001.jpg';
import tansani2 from '../assets/brochure/tansani/page-0002.jpg';
import tansani3 from '../assets/brochure/tansani/page-0003.jpg';
import tansani4 from '../assets/brochure/tansani/page-0004.jpg';

// 사운드 파일 임포트
import bookSound from '../assets/sound/book.wav';

const Page = React.forwardRef((props, ref) => (
  <div className="page" ref={ref} style={styles.pageStyle}>
    <img src={props.image} alt="brochure page" style={styles.pageImage} />
  </div>
));
Page.displayName = 'Page';

function BrochurePage() {
  const navigate = useNavigate();
  // 최초 페이지 로드 시 'tansani'가 먼저 로드되도록 초기값 설정
  const [selectedBrochure, setSelectedBrochure] = useState('tansani');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const bookRef = useRef(null);

  // 오디오 객체 생성 및 설정
  const flipAudio = useRef(null);

  useEffect(() => {
    const audio = new Audio(bookSound);
    audio.volume = 0.2; // 소리 크기 조절
    audio.preload = 'auto';
    flipAudio.current = audio;
  }, []);

  // 페이지 넘김 사운드 재생 함수 (중복 방지 및 빠른 반응)
  const playFlipSound = () => {
    if (flipAudio.current) {
      flipAudio.current.currentTime = 0;
      flipAudio.current.play().catch((error) => {
        console.log("Audio play blocked:", error);
      });
    }
  };

  const brochures = {
    tansani: { title: '탄사니 브로슈어', pages: [tansani1, tansani2, tansani3, tansani4] },
    daoni: { title: '다오니 브로슈어', pages: [daoni1, daoni2] },
  };

  const currentPages = brochures[selectedBrochure].pages;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClose = () => {
    window.close();
    setTimeout(() => {
      navigate('/');
    }, 100);
  };

  return (
    <div style={styles.fullScreenContainer}>
      {/* --- 상단 UI 컨트롤 (브로슈어 선택 탭 및 닫기 버튼) --- */}
      <div style={styles.headerControls}>
        <div style={styles.tabContainer}>
          {['tansani', 'daoni'].map((type) => (
            <button
              key={type}
              style={{
                ...styles.tabBtn,
                backgroundColor: selectedBrochure === type ? '#525252' : '#262626',
              }}
              onClick={() => setSelectedBrochure(type)}
            >
              {brochures[type].title}
            </button>
          ))}
        </div>
        <button style={styles.closeBtn} onClick={handleClose} title="닫기">✕</button>
      </div>

      {/* --- 좌우 이동 버튼 --- */}
      <button style={styles.prevBtn} onClick={() => bookRef.current.pageFlip().flipPrev()} title="이전 페이지">
        ❮
      </button>
      <button style={styles.nextBtn} onClick={() => bookRef.current.pageFlip().flipNext()} title="다음 페이지">
        ❯
      </button>

      {/* --- 브로슈어 뷰어 영역 --- */}
      <div style={styles.bookViewer}>
        <HTMLFlipBook
          key={`${selectedBrochure}-${isMobile}`}
          ref={bookRef}
          width={isMobile ? 320 : 450}
          height={isMobile ? 480 : 640}
          size="stretch"
          minWidth={250}
          maxWidth={800}
          minHeight={350}
          maxHeight={800}
          usePortrait={isMobile}
          onFlip={playFlipSound}
          style={{ margin: '0 auto', maxHeight: '100vh', maxWidth: '100%' }}
        >
          {currentPages.map((img, index) => <Page key={index} image={img} />)}
        </HTMLFlipBook>
      </div>
    </div>
  );
}

const styles = {
  fullScreenContainer: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    width: '100vw', 
    height: '100vh', 
    backgroundColor: '#121212', // 무채색 다크 그레이 배경
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden'
  },
  bookViewer: { 
    width: '100vw', 
    height: '100vh', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 1, 
  },
  headerControls: {
    position: 'absolute',
    top: '20px',
    left: '24px',
    right: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000 
  },
  tabContainer: { 
    display: 'flex', 
    gap: '10px' 
  },
  tabBtn: { 
    padding: '8px 16px', 
    color: '#ffffff', 
    border: '1px solid #404040', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '600',
    fontSize: '14px',
    transition: 'background-color 0.3s ease'
  },
  closeBtn: { 
    background: '#262626', 
    color: '#a3a3a3', 
    border: '1px solid #404040', 
    borderRadius: '50%', 
    width: '40px', 
    height: '40px', 
    cursor: 'pointer', 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px'
  },
  prevBtn: { 
    position: 'absolute', 
    left: '20px', 
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1000, 
    background: '#262626', 
    color: '#e5e5e5', 
    border: '1px solid #404040', 
    borderRadius: '50%', 
    width: '48px', 
    height: '48px', 
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px'
  },
  nextBtn: { 
    position: 'absolute', 
    right: '20px', 
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1000, 
    background: '#262626', 
    color: '#e5e5e5', 
    border: '1px solid #404040', 
    borderRadius: '50%', 
    width: '48px', 
    height: '48px', 
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px'
  },
  pageStyle: { 
    backgroundColor: '#ffffff', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  },
  pageImage: { 
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  }
};

export default BrochurePage;