import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import './HistorySection.css';

const HistorySection = forwardRef((props, ref) => {
  const [historyData, setHistoryData] = useState(() => {
    const saved = localStorage.getItem('daonrs_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(historyData.length === 0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('history')
          .select('*')
          .order('order_index', { ascending: false });

        if (!error && data) {
          setHistoryData(data);
          localStorage.setItem('daonrs_history', JSON.stringify(data));
        }
      } catch (err) {
        console.error("History fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // [핵심] 커스텀 부드러운 스크롤 함수
  const smoothScrollTo = (target) => {
    const element = scrollRef.current;
    if (!element) return;

    const start = element.scrollLeft;
    const change = target - start;
    const duration = 600; // 애니메이션 지속 시간 (ms) - 이 값을 늘리면 더 천천히 이동합니다.
    let startTime = null;

    const animateScroll = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = currentTime - startTime;

      // Easing 함수 (easeInOutQuad): 가속 후 감속하여 부드럽게 멈춤
      const easeInOutQuad = (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) return (c / 2) * t * t + b;
        t--;
        return (-c / 2) * (t * (t - 2) - 1) + b;
      };

      element.scrollLeft = easeInOutQuad(progress, start, change, duration);

      if (progress < duration) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  useEffect(() => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const firstItem = container.querySelector('.timeline-item');
      if (firstItem) {
        const itemWidth = firstItem.offsetWidth;
        // 브라우저 기본 scrollTo 대신 커스텀 함수 호출
        smoothScrollTo(currentIndex * itemWidth);
      }
    }
  }, [currentIndex]);

  const totalItems = historyData.length;

  const handlePrev = () => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
  const handleNext = () => setCurrentIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));

  if (loading && totalItems === 0) {
    return (
      <section id="history" ref={ref} className="section">
        <div className="sub-section">
          <div className="skeleton-header"></div>
          <div className="skeleton-content"></div>
        </div>
      </section>
    );
  }

  if (totalItems === 0) return null;

  return (
    <section id="history" ref={ref} className="section">
      <div className="sub-section">
        <header className="subsection-header">
          <h1 className="subsection-title">회사 연혁</h1>
        </header>
        <hr className="section-top-line" />

        <h2 className="subsection-subtitle">"DAONRS의 시간은 고객의 성장과 함께합니다."</h2>
        <div className="content-highlight">
          <p>작은 시작부터 지금의 성취까지, <br />
            DAONRS가 걸어온 순간들을 기록합니다.</p>
        </div>  
        
        <div className="navigation">
          <span className="page-num">
            {String(currentIndex + 1).padStart(2, '0')} / {String(totalItems).padStart(2, '0')}
          </span>
          <div className="nav-buttons">
            <button onClick={handlePrev} disabled={currentIndex === 0}>
              <HiChevronLeft size={24} />
            </button>
            <button onClick={handleNext} disabled={currentIndex >= totalItems - 1}>
              <HiChevronRight size={24} />
            </button>
          </div>
        </div>

        <div className="timeline-wrapper" ref={scrollRef}>
          <div className="timeline-track">
            {historyData.map((item) => (
              <div key={item.id} className="timeline-item">
                <div className="timeline-dot dot" />
                <h3 className="year-title year">{item.year}</h3>
                <ul className="event-list">
                  {item.events?.map((event, i) => (
                    <li key={i} className="event-item">
                      <span className="month">{event.month}</span>
                      <div 
                        className="content multi-column" 
                        dangerouslySetInnerHTML={{ __html: event.content }} 
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default HistorySection;