import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HTMLFlipBook from 'react-pageflip';

// 이미지 임포트 (다오니, 탄사니 전체 포함)
import daoni1 from '../assets/brochure/daoni/page-0001.webp';
import daoni2 from '../assets/brochure/daoni/page-0002.webp';
import tansani1 from '../assets/brochure/tansani/page-0001.webp';
import tansani2 from '../assets/brochure/tansani/page-0002.webp';
import tansani3 from '../assets/brochure/tansani/page-0003.webp';
import tansani4 from '../assets/brochure/tansani/page-0004.webp';

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
  const viewerRef = useRef(null);
  // 리사이즈로 플립북이 다시 생성될 때 보던 페이지 유지
  const [currentPage, setCurrentPage] = useState(0);
  // 헤더와 푸터 사이 뷰어 영역의 실제 크기
  const [viewerSize, setViewerSize] = useState({ width: 0, height: 0 });

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

  // 뷰어 영역 크기 측정 (헤더·푸터를 제외한 남은 공간)
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setViewerSize({ width: Math.floor(width), height: Math.floor(height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 뷰어 영역 안에 들어가도록 페이지 크기 계산 (비율 유지)
  const pageRatio = isMobile ? 480 / 320 : 640 / 450; // 높이 / 너비
  const pagesPerSpread = isMobile ? 1 : 2;
  const pageWidth = Math.floor(
    Math.min(viewerSize.width / pagesPerSpread, viewerSize.height / pageRatio)
  );
  const pageHeight = Math.floor(pageWidth * pageRatio);

  const handleFlip = (e) => {
    setCurrentPage(e.data);
    playFlipSound();
  };

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
              onClick={() => {
                setSelectedBrochure(type);
                setCurrentPage(0); // 브로슈어 변경 시 첫 페이지부터
              }}
            >
              {brochures[type].title}
            </button>
          ))}
        </div>
        <button style={styles.closeBtn} onClick={handleClose} title="닫기">✕</button>
      </div>

      {/* --- 브로슈어 뷰어 영역 --- */}
      <div style={styles.bookViewer} ref={viewerRef}>
        {pageWidth > 0 && pageHeight > 0 && (
          <HTMLFlipBook
            key={`${selectedBrochure}-${isMobile}-${pageWidth}x${pageHeight}`}
            ref={bookRef}
            width={pageWidth}
            height={pageHeight}
            size="fixed"
            usePortrait={isMobile}
            startPage={currentPage}
            onFlip={handleFlip}
            style={{ margin: '0 auto' }}
          >
            {currentPages.map((img, index) => <Page key={index} image={img} />)}
          </HTMLFlipBook>
        )}
      </div>

      {/* --- 하단 UI 컨트롤 (좌우 이동 버튼, 가운데 정렬) --- */}
      <div style={styles.footerControls}>
        <button style={styles.navBtn} onClick={() => bookRef.current?.pageFlip()?.flipPrev()} title="이전 페이지">
          ❮
        </button>
        <button style={styles.navBtn} onClick={() => bookRef.current?.pageFlip()?.flipNext()} title="다음 페이지">
          ❯
        </button>
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
    flexDirection: 'column',      // 헤더 → 뷰어 → 푸터 세로 배치 (겹침 구조적 차단)
    alignItems: 'stretch',
    overflow: 'hidden'
  },
  bookViewer: {
    flex: '1 1 auto',             // 헤더·푸터가 쓰고 남은 높이만 차지
    minHeight: 0,                 // flex 아이템 축소 허용 (오버플로 방지)
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0 16px',
    boxSizing: 'border-box',
    overflow: 'hidden',           // 이미지가 헤더·푸터 영역을 침범하지 않도록 차단
    zIndex: 1,
  },
  headerControls: {
    flex: '0 0 auto',             // 헤더 높이 고정, 축소되지 않음
    width: '100%',
    padding: '20px 24px',
    boxSizing: 'border-box',
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
  footerControls: {
    flex: '0 0 auto',             // 푸터 높이 고정, 축소되지 않음
    width: '100%',
    padding: '20px 24px',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    zIndex: 1000
  },
  navBtn: {
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