/**
 * netlify/functions/notifyInquiry.mjs
 *
 * 고객센터 문의(public.inquiries) 테이블에 INSERT 가 발생하면
 * Supabase Database Webhook 이 이 엔드포인트를 POST 로 호출한다.
 *
 * 역할
 *  1) 웹훅 진위 검증 (x-webhook-secret 헤더)
 *  2) 문의 내용을 메일 본문으로 구성
 *  3) Resend API 로 담당자에게 발송
 *
 * 이 함수는 DB 에 쓰기를 하지 않는다.
 * 문의 저장은 InquirySection.jsx 의 supabase.insert() 가 이미 끝낸 상태이며,
 * 이 함수가 실패하더라도 문의 접수 자체에는 영향이 없다.
 *
 * 필요한 Netlify 환경변수
 *  - RESEND_API_KEY  (필수) Resend API 키
 *  - NOTIFY_EMAIL    (필수) 알림 수신 주소. 쉼표로 여러 명 지정 가능
 *  - WEBHOOK_SECRET  (필수) Supabase 웹훅 헤더와 대조할 임의 문자열
 *  - NOTIFY_FROM     (선택) 발신자. 미지정 시 Resend 기본 발신 주소 사용
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'DAONRS 문의알림 <onboarding@resend.dev>';

/** JSON 응답 헬퍼 */
const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/** 문의 내용이 메일 HTML 구조를 깨뜨리지 않도록 이스케이프 */
const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** 줄바꿈 보존용 */
const nl2br = (value) => escapeHtml(value).replace(/\r?\n/g, '<br />');

/** UTC 타임스탬프를 한국 시간 표기로 변환 */
const formatKst = (iso) => {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
};

/** 메일 본문(HTML) 구성 */
const buildHtml = (record) => {
  const rows = [
    ['이름', escapeHtml(record.name)],
    ['회사명', escapeHtml(record.company)],
    ['이메일', escapeHtml(record.email)],
    ['휴대전화', escapeHtml(record.phone)],
    ['접수일시', escapeHtml(formatKst(record.created_at))],
  ]
    .map(
      ([label, value]) => `
        <tr>
          <th style="width:110px;padding:10px 14px;text-align:left;background:#f7f7f7;border-bottom:1px solid #eee;font-weight:600;color:#555;font-size:14px;">${label}</th>
          <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:14px;color:#222;">${value || '-'}</td>
        </tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="ko">
  <body style="margin:0;padding:24px;background:#f2f3f5;font-family:'Malgun Gothic','Apple SD Gothic Neo',Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:6px;overflow:hidden;border:1px solid #e5e5e5;">
      <div style="padding:20px 24px;background:#000;color:#fff;">
        <p style="margin:0;font-size:13px;letter-spacing:1px;opacity:.7;">DAONRS 고객센터</p>
        <h1 style="margin:6px 0 0;font-size:19px;font-weight:600;">새 문의가 접수되었습니다</h1>
      </div>

      <div style="padding:24px;">
        <p style="margin:0 0 6px;font-size:13px;color:#888;">제목</p>
        <p style="margin:0 0 22px;font-size:17px;font-weight:600;color:#111;">${escapeHtml(record.subject)}</p>

        <table style="width:100%;border-collapse:collapse;border-top:1px solid #eee;">${rows}</table>

        <p style="margin:24px 0 8px;font-size:13px;color:#888;">문의 내용</p>
        <div style="padding:16px;background:#fafafa;border:1px solid #eee;border-radius:4px;font-size:14px;line-height:1.7;color:#333;white-space:normal;">
          ${nl2br(record.message)}
        </div>

        <p style="margin:24px 0 0;font-size:12px;color:#999;line-height:1.6;">
          이 메일에 그대로 답장하면 문의자(${escapeHtml(record.email)})에게 전달됩니다.<br />
          문의 ID: ${escapeHtml(record.id)}
        </p>
      </div>
    </div>
  </body>
</html>`;
};

/** 메일 본문(텍스트) — HTML 을 못 받는 클라이언트 대비 + 스팸 점수 완화 */
const buildText = (record) =>
  [
    '[DAONRS] 새 문의가 접수되었습니다.',
    '',
    `제목    : ${record.subject ?? '-'}`,
    `이름    : ${record.name ?? '-'}`,
    `회사명  : ${record.company ?? '-'}`,
    `이메일  : ${record.email ?? '-'}`,
    `휴대전화: ${record.phone ?? '-'}`,
    `접수일시: ${formatKst(record.created_at)}`,
    '',
    '--- 문의 내용 ---',
    record.message ?? '',
    '',
    `문의 ID: ${record.id ?? '-'}`,
  ].join('\n');

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  const {
    RESEND_API_KEY,
    NOTIFY_EMAIL,
    WEBHOOK_SECRET,
    NOTIFY_FROM,
  } = process.env;

  // --- 1. 환경변수 점검 -----------------------------------------------------
  const missing = [
    !RESEND_API_KEY && 'RESEND_API_KEY',
    !NOTIFY_EMAIL && 'NOTIFY_EMAIL',
    !WEBHOOK_SECRET && 'WEBHOOK_SECRET',
  ].filter(Boolean);

  if (missing.length) {
    console.error('[notifyInquiry] 환경변수 누락:', missing.join(', '));
    return json(500, { error: `환경변수 누락: ${missing.join(', ')}` });
  }

  // --- 2. 웹훅 진위 검증 ----------------------------------------------------
  // Netlify 는 헤더 키를 소문자로 정규화하지만, 방어적으로 둘 다 확인한다.
  const headers = event.headers ?? {};
  const provided = headers['x-webhook-secret'] ?? headers['X-Webhook-Secret'];

  if (provided !== WEBHOOK_SECRET) {
    console.warn('[notifyInquiry] 시크릿 불일치로 요청 거부');
    return json(401, { error: 'Unauthorized' });
  }

  // --- 3. 페이로드 파싱 -----------------------------------------------------
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  // 웹훅을 INSERT 전용으로 설정하더라도, 설정 실수로 UPDATE/DELETE 가 들어올 수 있다.
  // 메일 오발송을 막기 위해 함수 쪽에서도 한 번 더 걸러낸다.
  if (payload.type !== 'INSERT' || payload.table !== 'inquiries') {
    console.log(`[notifyInquiry] 대상 아님 — type=${payload.type}, table=${payload.table}`);
    return json(200, { skipped: true });
  }

  const record = payload.record;
  if (!record || typeof record !== 'object') {
    return json(400, { error: 'record 필드가 없습니다.' });
  }

  // --- 4. 메일 발송 ---------------------------------------------------------
  const recipients = NOTIFY_EMAIL.split(',')
    .map((addr) => addr.trim())
    .filter(Boolean);

  if (!recipients.length) {
    return json(500, { error: 'NOTIFY_EMAIL 값이 비어 있습니다.' });
  }

  const mail = {
    from: NOTIFY_FROM || DEFAULT_FROM,
    to: recipients,
    subject: `[DAONRS 문의] ${record.subject ?? '제목 없음'}`,
    html: buildHtml(record),
    text: buildText(record),
  };

  // 담당자가 메일에 그대로 답장하면 문의자에게 가도록 한다.
  // 값이 비어 있거나 형식이 깨져 있으면 Resend 가 요청 전체를 거부하므로 최소 검증 후 추가한다.
  if (typeof record.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
    mail.reply_to = record.email;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mail),
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('[notifyInquiry] Resend 발송 실패:', res.status, JSON.stringify(result));
      return json(502, { error: 'mail send failed', status: res.status, detail: result });
    }

    console.log(`[notifyInquiry] 발송 완료 — id=${result.id}, inquiry=${record.id}`);
    return json(200, { ok: true, id: result.id });
  } catch (error) {
    console.error('[notifyInquiry] 예외 발생:', error.message);
    return json(500, { error: error.message });
  }
};
