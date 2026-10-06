import React, { useState, useEffect } from 'react';
// 동일 디렉토리 경로 반영
import { supabase } from '../supabaseClient';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; 
import './AdminDashboardPage.css';
import { toPlainText } from '../utils/sanitizeHtml';
import { runMutation } from '../utils/supabaseMutation';

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('history'); 
  const [historyList, setHistoryList] = useState([]);
  const [isEditingHistory, setIsEditingHistory] = useState(false);
  const [currentHistoryId, setCurrentHistoryId] = useState(null);
  const [historyYear, setHistoryYear] = useState('');
  // 이제 여러 개가 아닌, 단 하나의 문자열(HTML)로 관리합니다.
  const [editorContent, setEditorContent] = useState('');
  const [inquiryList, setInquiryList] = useState([]);

  const fetchData = async () => {
    if (activeTab === 'history') {
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .order('order_index', { ascending: false });
      if (!error) setHistoryList(data || []);
    } 
    else if (activeTab === 'inquiry') {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      if (!error) setInquiryList(data || []);
    }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleEditClick = (item) => {
    setIsEditingHistory(true);
    setCurrentHistoryId(item.id);
    setHistoryYear(item.year);
    // 기존 배열 구조에서 첫 번째 content만 가져와 에디터에 채웁니다.
    setEditorContent(item.events?.[0]?.content || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetHistoryForm = () => {
    setIsEditingHistory(false);
    setCurrentHistoryId(null);
    setHistoryYear('');
    setEditorContent('');
  };

  const handleHistorySubmit = async (e) => {
    e.preventDefault();
    const year = historyYear.trim();
    // 연도는 정렬값(order_index)의 기준이므로 4자리 숫자만 허용한다
    if (!/^\d{4}$/.test(year)) {
      alert('연도는 4자리 숫자로 입력해 주세요. (예: 2024)');
      return;
    }
    const generatedOrderIndex = parseInt(`${year}00`, 10);
    
    // DB 구조 호환성을 위해 단일 content를 배열 형태로 감싸서 저장합니다.
    const payload = { 
      year, 
      events: [{ content: editorContent }], 
      order_index: generatedOrderIndex 
    };

    try {
      if (isEditingHistory) {
        await runMutation(supabase.from('history').update(payload).eq('id', currentHistoryId).select('id'), '연혁 수정');
      } else {
        await runMutation(supabase.from('history').insert([payload]).select('id'), '연혁 등록');
      }
    } catch (err) {
      // 실패 시 입력 내용을 유지해 다시 시도할 수 있게 한다
      alert(err.message);
      return;
    }
    alert(isEditingHistory ? '수정되었습니다.' : '등록되었습니다.');
    resetHistoryForm();
    fetchData();
  };

  const handleHistoryDelete = async (item) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await runMutation(supabase.from('history').delete().eq('id', item.id).select('id'), '연혁 삭제');
    } catch (err) {
      alert(err.message);
    } finally {
      fetchData();
    }
  };

  const handleInquiryRead = async (inquiry) => {
    if (!window.confirm('읽음 처리하시겠습니까?')) return;
    try {
      await runMutation(supabase.from('inquiries').update({ is_read: true }).eq('id', inquiry.id).select('id'), '읽음 처리');
    } catch (err) {
      alert(err.message);
    } finally {
      fetchData();
    }
  };

  return (
    <div className="admin-dashboard-container">
      <header className="admin-dashboard-header">
        <div>
          <p style={{ color: '#6366f1', fontWeight: '800', marginBottom: '4px', fontSize: '0.9rem' }}>Management Space</p>
          <h2>관리자 대시보드</h2>
        </div>
        <div className="header-buttons">
          <button className="home-button" onClick={() => window.location.href='/'}>사이트 홈</button>
          <button className="logout-button" onClick={() => supabase.auth.signOut()}>로그아웃</button>
        </div>
      </header>
      
      <main className="admin-dashboard-content">
        <nav className="admin-tabs">
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => { setActiveTab('history'); resetHistoryForm(); }}>
            📅 연혁 관리
          </button>
          <button className={activeTab === 'inquiry' ? 'active' : ''} onClick={() => setActiveTab('inquiry')}>
            ✉️ 문의 내역
            {inquiryList.length > 0 && <span className="inquiry-badge">{inquiryList.length}</span>}
          </button>
        </nav>

        {activeTab === 'history' && (
          <div className="fade-in">
            <section className="section-card">
              <h3 className="section-title">
                {isEditingHistory ? '✨ 연혁 데이터 수정' : '➕ 새로운 연혁 등록'}
              </h3>
              
              <form onSubmit={handleHistorySubmit}>
                <div style={{ marginBottom: '25px' }}>
                  <label className="form-label">기점 연도</label>
                  <input 
                    style={{ width: '180px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1.1rem', fontWeight: '800' }}
                    type="text" 
                    value={historyYear} 
                    onChange={(e) => setHistoryYear(e.target.value)} 
                    placeholder="예: 2024" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">상세 내용 (이 에디터 하나에 모든 월별 내용을 작성하세요)</label>
                  <div className="editor-wrapper" style={{ height: '400px' }}>
                    <ReactQuill 
                      theme="snow"
                      value={editorContent}
                      onChange={setEditorContent}
                      style={{ height: '350px' }}
                      placeholder="내용을 입력하세요. (예: [03월] 서비스 오픈 [Enter] [05월] 기술 인증 취득...)"
                    />
                  </div>
                </div>

                <div className="form-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '60px' }}>
                  {isEditingHistory && <button type="button" className="btn-cancel" style={{ padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }} onClick={resetHistoryForm}>취소</button>}
                  <button type="submit" className="btn-submit" style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>
                    {isEditingHistory ? '업데이트 완료' : '데이터 저장'}
                  </button>
                </div>
              </form>
            </section>

            <section className="section-card">
              <h3 className="section-title">현재 등록된 연혁 목록</h3>
              <table className="history-table">
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>연도</th>
                    <th>내용 요약</th>
                    <th style={{ textAlign: 'right', width: '150px' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '800', fontSize: '1.1rem', color: '#4f46e5' }}>{item.year}년</td>
                      <td>
                        <div className="quill-preview-small" style={{ fontSize: '0.95rem', color: '#666' }}>{toPlainText(item.events?.[0]?.content, 100)}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-edit" onClick={() => handleEditClick(item)}>수정</button>
                        <button className="btn-delete" onClick={() => handleHistoryDelete(item)}>삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {/* 문의 내역 탭은 이전과 동일 (생략 없음) */}
        {activeTab === 'inquiry' && (
          <div className="section-card fade-in">
            <h3 className="section-title">미처리 문의 ({inquiryList.length})</h3>
            {inquiryList.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>새로운 문의 내역이 없습니다. ✨</p>
            ) : (
              inquiryList.map(inquiry => (
                <div key={inquiry.id} className="inquiry-card">
                  <div className="inquiry-header" style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span className="inquiry-name" style={{ fontSize: '1.1rem', fontWeight: '800' }}>👤 {inquiry.name} <span style={{ fontWeight: '500', color: '#64748b', fontSize: '0.9rem' }}>({inquiry.company})</span></span>
                      <span className="inquiry-date" style={{ color: '#888', fontSize: '0.85rem' }}>{new Date(inquiry.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '5px', marginBottom: '15px', fontSize: '0.9rem', color: '#6366f1', fontWeight: '600' }}>
                    <span>📧 {inquiry.email}</span> | <span>📞 {inquiry.phone}</span>
                  </div>
                  <div className="inquiry-subject" style={{ marginBottom: '10px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: '700' }}>
                    제목: {inquiry.subject}
                  </div>
                  <div className="inquiry-message" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', color: '#334155' }}>
                    {inquiry.message}
                  </div>
                  <button onClick={() => handleInquiryRead(inquiry)} className="btn-complete" style={{ marginTop: '20px' }}>
                    ✓ 확인 완료
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboardPage;