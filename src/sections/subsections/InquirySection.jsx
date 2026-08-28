import React, { useState, forwardRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const InquirySection = forwardRef((props, ref) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(false);
  
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!agreed) {
      alert('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // 스팸 방지 필드 체크
    if (confirmEmail !== '') {
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
        window.dispatchEvent(new CustomEvent('scrollToSubContent')); 
      }, 1000);
      return;
    }

    const { error: supabaseError } = await supabase
      .from('inquiries')
      .insert([{ name, email, company, phone, subject, message }]);

    setIsSubmitting(false);

    if (supabaseError) {
      setError('제출에 실패했습니다. 다시 시도해 주세요.');
    } else {
      setIsSubmitted(true);
      window.dispatchEvent(new CustomEvent('scrollToSubContent')); 
      
      // 상태 초기화
      setName(''); setEmail(''); setCompany(''); setPhone(''); setSubject(''); setMessage(''); setAgreed(false);
    }
  };

  const renderContent = () => {
    if (isSubmitted) {
      return (
        <div className="thank-you-container">
          <div className="q-icon-circle">✓</div>
          <h3>문의가 정상적으로 접수되었습니다.</h3>
          <p>빠른 시일 내에 답변드리겠습니다.</p>
          <div className="form-footer">
            <button 
              onClick={() => navigate('/')} 
              className="btn-primary"
            >
              홈으로 이동
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <header className="subsection-header">
          <h2 className="subsection-title">문의하기</h2>
        </header>
        <hr className="section-top-line" />
        <form onSubmit={handleSubmit} className="inquiry-form-wrapper">
          <div style={{ opacity: 0, position: 'absolute', zIndex: -1, pointerEvents: 'none' }}>
            <input id="confirm_email" type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} tabIndex="-1" />
          </div>

          {/* 이름 / 이메일 */}
          <div className="form-row inline-fields inquiry-form-row">
            <div className="form-group">
              <label htmlFor="name">이름<span className="required-dot"></span></label>
              <input type="text" id="name" placeholder="이름을 입력해 주세요." value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="email">이메일<span className="required-dot"></span></label>
              <input type="email" id="email" placeholder="example@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          {/* 회사명 / 휴대전화 */}
          <div className="form-row inline-fields inquiry-form-row">
            <div className="form-group">
              <label htmlFor="company">회사명<span className="required-dot"></span></label>
              <input type="text" id="company" placeholder="회사명을 입력해 주세요." value={company} onChange={(e) => setCompany(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="phone">휴대전화<span className="required-dot"></span></label>
              <input type="tel" id="phone" placeholder="010-0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </div>
          
          {/* 제목 (정렬 수정을 위해 full-width 클래스 유지) */}
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="subject">제목<span className="required-dot"></span></label>
              <input type="text" id="subject" placeholder="제목을 입력해 주세요." value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
          </div>

          {/* 내용 (정렬 수정을 위해 full-width 클래스 유지) */}
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="message">내용<span className="required-dot"></span></label>
              <textarea id="message" placeholder="내용을 입력해 주세요." value={message} onChange={(e) => setMessage(e.target.value)} required />
            </div>
          </div>

          <div className="privacy-accordion-section" style={{ marginTop: '40px' }}>
            <div className="list-item-wrapper" style={{ borderTop: '1px solid #f0f0f0' }}>
              <div 
                className={`list-item-header ${isPrivacyExpanded ? 'expanded' : ''}`}
                onClick={() => setIsPrivacyExpanded(!isPrivacyExpanded)}
              >
                <div className="list-item-title-group">
                  <div className="q-icon-circle">!</div>
                  <span className={`item-title ${isPrivacyExpanded ? 'expanded' : ''}`}>
                    개인정보 수집 및 이용에 대한 안내 (필수)
                  </span>
                </div>
                <div className="item-meta">
                  <span>{isPrivacyExpanded ? '▲' : '▼'}</span>
                </div>
              </div>
              {isPrivacyExpanded && (
                <div className="item-content">
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    <p style={{ marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>[개인정보 수집 및 이용 목적]</p>
                    <p style={{ marginBottom: '15px' }}>- 문의사항 확인 및 답변을 위한 연락, 서비스 안내</p>
                    <p style={{ marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>[수집하는 개인정보 항목]</p>
                    <p style={{ marginBottom: '15px' }}>- 이름, 이메일, 휴대폰 번호, 회사명</p>
                    <p style={{ marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>[개인정보의 보유 및 이용기간]</p>
                    <p>- 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ padding: '20px 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="privacy-check" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="privacy-check" style={{ fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>위의 내용을 읽었으며, 개인정보 수집 및 이용에 동의합니다.</label>
            </div>
          </div>
          
          {error && <p className="error-message">{error}</p>}

          <div className="form-footer" style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '40px' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting}
              style={{
              width: '100%',
              maxWidth: '300px',
              height: '56px',
              backgroundColor: isSubmitting ? '#ccc' : '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '600',
              letterSpacing: '0.5px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isSubmitting ? '전송 중...' : '문의하기'}
            </button>
          </div>
        </form>
      </>
    );
  };

  return (
    <section id="inquiry" ref={ref} className="section">
      <div className="sub-section">
        {renderContent()}
      </div>
    </section>
  );
});

export default InquirySection;