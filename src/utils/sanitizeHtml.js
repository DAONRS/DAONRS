// -----------------------------------------------------------------
// HTML 정화 공용 모듈
//
// 이 프로젝트는 ReactQuill 로 작성한 HTML 을 DB 에 원문 그대로 저장하고,
// 화면에 뿌릴 때 dangerouslySetInnerHTML 로 렌더한다.
// 저장된 값을 그대로 믿으면 저장형 XSS 가 성립하므로,
// "렌더 직전"에 반드시 이 모듈을 거치게 한다. (DB 는 건드리지 않는다)
//
// ⚠️ 유지보수 주의
// Quill 툴바에 기능을 추가하면(정렬 / 글자색 / 표 등) 그 서식이 만들어내는
// 태그·속성을 아래 CONFIG 에도 같이 추가해야 한다.
// 그러지 않으면 새로 쓴 글에서 "그 서식만" 조용히 사라진다. 에러는 나지 않는다.
// 현재 툴바: header(1,2) / bold / italic / underline / strike /
//            list(ordered,bullet) / image / link / video / clean
//            → editorHandlers.js 의 getEditorModules 참고
// -----------------------------------------------------------------
import DOMPurify from 'dompurify';

// 이 앱이 실제로 생성하는 유튜브 임베드 주소 형태.
// editorHandlers.js 의 convertYoutubeLinksToIframes 가 만들어내는 것과 동일하다.
const YOUTUBE_EMBED_SRC = /^https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]{11}(?:[?#].*)?$/;

const CONFIG = {
  // DOMPurify 는 기본적으로 iframe 을 통째로 제거한다.
  // 허용하지 않으면 기존 게시글의 유튜브 영상이 전부 사라지므로 열어주되,
  // 아래 훅에서 유튜브 임베드가 아닌 iframe 은 다시 걷어낸다.
  ADD_TAGS: ['iframe'],

  // data-list: Quill 2 는 불릿 목록도 <ol><li data-list="bullet"> 로 출력한다.
  //            이 속성이 잘리면 모든 불릿이 번호 목록으로 보인다.
  ADD_ATTR: ['allowfullscreen', 'frameborder', 'allow', 'target', 'data-list'],

  FORBID_TAGS: ['style', 'form', 'input', 'button'],
  FORBID_ATTR: ['srcdoc', 'formaction', 'ping'],
};

let hooksInstalled = false;

function installHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // iframe 은 유튜브 임베드만 남긴다.
    // (단순히 iframe 태그를 허용하면 임의의 외부 사이트를 끼워넣을 수 있다)
    if (node.tagName === 'IFRAME') {
      const src = node.getAttribute('src') || '';
      if (!YOUTUBE_EMBED_SRC.test(src)) {
        node.parentNode?.removeChild(node);
        return;
      }
    }

    // 새 탭으로 열리는 링크에 opener 유출 방지 속성을 붙인다.
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

/**
 * 게시글 본문처럼 서식을 살려야 하는 HTML 을 정화한다.
 * 반드시 유튜브 링크 변환을 마친 "최종 HTML"을 넘길 것.
 *   O  sanitizeHtml(convertYoutubeLinksToIframes(content))
 *   X  convertYoutubeLinksToIframes(sanitizeHtml(content))  ← 변환이 iframe 을 다시 주입해 정화가 무의미해진다
 */
export function sanitizeHtml(html) {
  if (!html) return '';
  installHooks();
  return DOMPurify.sanitize(html, CONFIG);
}

/**
 * 목록의 "내용 요약" 칸처럼 서식이 필요 없는 곳에서 쓴다.
 * 태그를 전부 제거하고 순수 텍스트만 남긴 뒤 길이를 자른다.
 * HTML 문자열을 그냥 substring 하면 태그 중간이 잘려 마크업이 깨지므로,
 * 텍스트로 만든 다음에 자르는 것이 중요하다.
 */
export function toPlainText(html, maxLength) {
  if (!html) return '';
  installHooks();
  const stripped = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  // &amp; 같은 엔티티를 실제 문자로 되돌린다.
  const text = new DOMParser()
    .parseFromString(stripped, 'text/html')
    .body.textContent || '';
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!maxLength || normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength) + '…';
}
