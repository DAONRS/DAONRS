import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DaumPostcode from 'react-daum-postcode';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './MonitorPage.css';

// 기상청 격자 변환 함수
const convertToGrid = (lat, lng) => {
  const RE = 6371.00877; const GRID = 5.0; const SLAT1 = 30.0; const SLAT2 = 60.0;
  const OLON = 126.0; const OLAT = 38.0; const XO = 43; const YO = 136;
  const DEGRAD = Math.PI / 180.0; const re = RE / GRID; const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD; const olon = OLON * DEGRAD; const olat = OLAT * DEGRAD;
  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5); sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5); ro = (re * sf) / Math.pow(ro, sn);
  let rs = {}; let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;
  rs['nx'] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  rs['ny'] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
  return rs;
};

// 그래프용 더미 데이터
const dummyGraphData = [
  { time: '00:00', temp: 6.13 }, { time: '04:00', temp: 5.5 },
  { time: '08:00', temp: 6.0 }, { time: '12:00', temp: 8.5 },
  { time: '16:00', temp: 9.2 }, { time: '20:00', temp: 7.8 },
];

const Dashboard = () => {
  const [weather, setWeather] = useState({ temp: '-', reh: '-', sky: '-' });
  const [address, setAddress] = useState("");
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);

  // 날씨 호출 함수
  const fetchWeather = async (nx, ny) => {
    if (!nx || !ny) return;
    setWeather({ temp: '-', reh: '-', sky: '-' });

    const now = new Date();
    let baseDate = now.toISOString().slice(0, 10).replace(/-/g, '');
    let hour = now.getHours();
    let minute = now.getMinutes();

    if (minute < 40) {
      if (hour === 0) {
        const yesterday = new Date(now.setDate(now.getDate() - 1));
        baseDate = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
        hour = 23;
      } else { hour -= 1; }
    }
    const baseTime = `${String(hour).padStart(2, '0')}00`;

    try {
      const res = await axios.get("/.netlify/functions/apiHandler", {
        params: { type: 'weather', base_date: baseDate, base_time: baseTime, nx, ny }
      });

      if (res.data.response?.header?.resultCode === "00") {
        const items = res.data.response.body.items.item;
        const t1h = items.find(i => i.category === 'T1H')?.obsrValue;
        const reh = items.find(i => i.category === 'REH')?.obsrValue;
        const pty = items.find(i => i.category === 'PTY')?.obsrValue;
        let skyStatus = pty !== '0' ? (pty === '1' ? '비' : '눈') : (parseInt(reh) > 70 ? '흐림' : '맑음');
        setWeather({ temp: t1h || '-', reh: reh || '-', sky: skyStatus });
      }
    } catch (err) {
      console.error("날씨 로드 실패:", err);
    }
  };

  // 주소 검색 완료 로직 (핵심 수정 부분)
  const handleAddressComplete = async (data) => {
    // 도로명보다 검색 정확도가 높은 '지번 주소'를 우선 검색어로 사용
    const searchKeyword = data.jibunAddress || data.address; 
    setAddress(data.roadAddress || data.address);
    setIsPostcodeOpen(false);

    try {
      console.log(`🔍 좌표 변환 시도 키워드: ${searchKeyword}`);
      const res = await axios.get("/.netlify/functions/apiHandler", {
        params: { type: 'address', address: searchKeyword }
      });

      if (res.data.documents && res.data.documents.length > 0) {
        const { x, y } = res.data.documents[0];
        const grid = convertToGrid(parseFloat(y), parseFloat(x));
        fetchWeather(grid.nx, grid.ny);
      } else {
        alert("해당 주소의 좌표를 찾을 수 없습니다. 지번 주소로 입력해주세요.");
      }
    } catch (err) {
      console.error("좌표 변환 실패:", err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="dashboard-container">
      {/* 기존 헤더 UI 유지 */}
      <header className="header">
        <div className="header-left">
          <h1>다오니 <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#93c5fd' }}>Farming Data Logger</span></h1>
        </div>
        <div className="header-right" style={{ fontSize: '12px' }}>
          관리자님 | 회원정보 변경 | 로그아웃
        </div>
      </header>

      <div className="main-layout">
        {/* 기존 사이드바 UI 유지 */}
        <aside className="sidebar">
          <button 
            onClick={() => setIsPostcodeOpen(!isPostcodeOpen)} 
            style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px', cursor: 'pointer', borderRadius: '4px', marginBottom: '20px' }}
          >
            위치 주소 설정
          </button>
          
          {isPostcodeOpen && (
            <div style={{ position: 'absolute', zIndex: 100, border: '1px solid #ccc', width: '350px', backgroundColor: 'white' }}>
              <DaumPostcode onComplete={handleAddressComplete} />
            </div>
          )}

          <div className="device-card">
            <div className="device-header">
              <span style={{ fontWeight: 'bold', color: '#1e40af' }}>★ 양액딸기</span>
              <span className="status-badge">연결</span>
            </div>
            <div className="device-grid">
              <div className="grid-item">
                <div style={{ fontSize: '10px', color: '#6b7280' }}>탄산가스1</div>
                <div style={{ fontWeight: 'bold' }}>472 ppm</div>
              </div>
              <div className="grid-item">
                <div style={{ fontSize: '10px', color: '#6b7280' }}>탄산가스2</div>
                <div style={{ fontWeight: 'bold' }}>432.67 ppm</div>
              </div>
            </div>
          </div>
        </aside>

        {/* 기존 메인 콘텐츠 UI 및 그래프 유지 */}
        <main className="main-content">
          <div className="content-card">
            <div className="weather-section">
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>📍 {address || "주소를 설정해주세요"}</h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '15px' }}>
                <div style={{ fontSize: '40px' }}>
                  {!address ? '📍' : (weather.sky === '맑음' ? '☀️' : '☁️')}
                </div>
                <div>
                  <div style={{ color: '#6b7280' }}>
                    {address ? `${weather.sky}, 습도 ${weather.reh}%` : '위치 정보 없음'}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                    {address ? `${weather.temp}°C` : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* 그래프 구역 */}
            <div className="chart-container" style={{ height: '300px', marginTop: '30px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#374151' }}>온도 변화 추이</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dummyGraphData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={2} name="온도(°C)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;