# DAONRS 웹 — 페이지 구성 점검 및 개선안

점검일: 2026-09-15 · 대상: `F:\DAONRS\src` (라우팅 · 페이지 · 섹션 · 공통 컴포넌트)
※ 본 문서는 **분석/제안 전용**이며, 코드는 하나도 수정하지 않았습니다.

---

## 1. 현재 페이지 구성 맵

| 라우트 | 페이지 | 구성 | 데이터 소스 |
|---|---|---|---|
| `/` | HomePage | 메인 Swiper 배너(3슬라이드) → SubNav → CasePreviewSection → HeroBanner → ImageGrid | `bannerImages['/']`, Supabase `case_examples` |
| `/about/*` | AboutPage | Banner + SubNav + 라우트 | — |
| └ `vision` | VisionSection | 기업개요 / 핵심역량 4카드 / 비전 서클 | 정적 |
| └ `history` | HistorySection | 가로 타임라인 + 좌우 네비 | Supabase `history` (+ localStorage 캐시) |
| └ `directions` | DirectionsSection | 구글맵 iframe + 연락처 + 카카오맵 링크 | `DirectionsContent.json` |
| └ `Certification ` | Certificationsection(CombinedSection) | **인증 갤러리 + 지식재산권 갤러리 2블록** | Supabase `certifications`, `intellectual_properties` |
| └ `ip` | IntellectualPropertySection | 지식재산권 갤러리 (메뉴에는 없음) | Supabase `intellectual_properties` |
| `/business/*` | BusinessPage | Banner + SubNav + `ip`, `Certification` | (메뉴 주석 처리 상태) |
| `/products/*` | ProductsPage | Banner + SubNav | — |
| └ `product1` | Product1Section | 탄사니 브로슈어 원본 JPG 4장 | 정적 |
| └ `product2` | Product2Section | 다오니 브로슈어 원본 JPG 2장 | 정적 |
| `/cases/*` | CasesPage | Banner + SubNav | — |
| └ `example1` / `example2` | CaseExampleSection1 / 2 | 목록(썸네일 그리드)·상세·글쓰기 3-모드 + 페이지네이션 | Supabase `case_examples` |
| `/support/*` | SupportPage | Banner + SubNav | — |
| └ `notice` | NoticeSection | 아코디언 게시판 + Quill 에디터 + 첨부(업로드/드라이브링크) | Supabase `notices` |
| └ `dataroom` | DataroomSection | 위와 동일 구조 | Supabase `archives` |
| └ `inquiry` | InquirySection | 문의 폼 + 개인정보 동의 + 허니팟 | Supabase `inquiries` |
| `/monitor/*` | MonitorPage | 날씨 대시보드 (Header/Footer 없음) | 기상청 API(넷리파이 함수) + **더미 그래프** |
| `/brochure` | BrochurePage | 플립북 뷰어 (별도 탭) | 정적 |
| `/admin` | AdminLogin / AdminDashboard | 연혁 관리 + 문의 내역 | Supabase |

**전역 셸**: `App.jsx` 에서 Header / Footer / AdminTopNav / LenisScroller / 플로팅 카탈로그 버튼을 조건부 렌더. `/monitor`, `/brochure`, `/admin` 은 셸 제외.

---

## 2. 기능이 실제로 깨져 있는 항목 (우선순위 높음)

### 🔴 A-1. 홈 하단 `HeroBanner` / `ImageGrid` 가 빈 영역으로 출력됨
`HomePage.jsx` 가 넘기는 prop 이름과 컴포넌트가 받는 prop 이름이 서로 다릅니다.

| | HomePage 가 넘기는 값 | 컴포넌트가 기대하는 값 |
|---|---|---|
| HeroBanner | `title`, `description`, `buttonText`, `buttonLink` | `subTitle`, `mainTitle1`, `mainTitle2`, `image` |
| ImageGrid | `images` | `gridData` |

→ HeroBanner 는 텍스트 3개가 전부 `undefined`, 이미지 없음. ImageGrid 는 `gridData && ...` 가 false 라 **아무것도 렌더되지 않음**.
추가로 두 컴포넌트의 `getImageUrl()` 은 "파일명 문자열"을 기대하는데 HomePage 는 `import` 로 만들어진 완성 URL을 넘기고 있어, prop 이름만 맞춰도 경로가 다시 깨집니다.

**개선안**: prop 계약을 한쪽으로 통일. `getImageUrl` 을 없애고 두 컴포넌트가 **완성된 URL을 받도록** 바꾸는 쪽이 Vite 번들링과도 맞습니다(에셋 해시 처리됨). 아니면 홈 하단 두 블록이 현재 기획상 불필요하다면 제거.

### 🔴 A-2. `인증` 서브메뉴 경로에 **뒤쪽 공백**이 들어가 있음
```js
// menuData.js
{ name: '인증', path: 'Certification ' }   // ← 끝에 공백
```
- 이동 경로: `/about/Certification ` (URL 상 `%20`)
- AboutPage 라우트: `path="Certification"` → **매칭 실패 → 본문이 렌더되지 않음**
- SubNav `isActive` = `pathname.endsWith('Certification ')` → 활성 표시도 어긋남

**개선안**: 공백 제거. 겸사겸사 경로 컨벤션을 소문자(`certification`)로 통일하고, 기존 링크 호환용 `<Route path="Certification" element={<Navigate to="../certification" replace/>}/>` 를 한 줄 추가.

### 🔴 A-3. `/business` 진입 시 빈 화면
`BusinessPage` 는 `/` → `Navigate to "scope"` 인데 **`scope` / `rnd` 라우트는 주석 처리**되어 있습니다. 메뉴에서도 '인증현황'이 주석이라 SubNav 도 `null` 을 반환합니다.
→ `/business` 는 배너만 뜨고 아무 내용 없음.

**개선안**: ① `/business` 라우트·페이지·배너 데이터를 통째로 제거하거나, ② `Navigate to "Certification"` 으로 바꿔 살리거나 둘 중 하나로 정리. (현재 인증/지식재산권은 `/about` 아래에서 이미 서비스 중이므로 ①을 권장)

### 🟠 A-4. 홈 배너 슬라이드의 링크가 버튼 문구와 어긋남
```js
link: menuItems[index]?.path
```
menuItems 에서 '인증현황'이 주석 처리되면서 인덱스가 밀렸습니다.

| 슬라이드 문구 | 실제 이동 | 의도 |
|---|---|---|
| DAONRS 소개 바로가기 | `/about` | ✅ |
| 사업분야 확인하기 | `/products` | ❌ |
| 제품 정보 보기 | `/cases` | ❌ |

**개선안**: 인덱스 의존을 끊고 `bannerImages['/']` 각 슬라이드에 `link` 필드를 직접 명시.

### 🟠 A-5. Lenis 부드러운 스크롤과 `window.scrollTo` 직접 호출이 충돌
`useSmoothScroll.js` / `LenisScroller.jsx` 주석에 *"프로그램적 스크롤은 반드시 이 훅으로"* 라고 명시되어 있지만, 실제로는 아래 파일들이 `window.scrollTo({ behavior:'smooth' })` 를 직접 호출합니다.

- `NoticeSection.jsx` (페이지 이동)
- `DataroomSection.jsx` (페이지 이동)
- `CaseExampleSection1.jsx` / `2.jsx` (상세 열기·목록 복귀·페이지 이동)
- `HistorySection.jsx` (자체 `requestAnimationFrame` 가로 스크롤 — 세로는 무관하나 방식이 분리되어 있음)
- `AdminDashboardPage.jsx` (관리자 화면은 Lenis 미적용이라 문제 없음)

Lenis 는 매 프레임 스크롤 위치를 덮어쓰므로, 위 호출은 **튀거나 무시될 수 있습니다.**

**개선안**: 해당 섹션들에서 `useSmoothScroll().scrollToY(...)` 로 교체.

### 🟠 A-6. 스크롤 기준값으로 `ref.current.offsetTop` 사용
`offsetTop` 은 `offsetParent` 기준 상대값이라, 상위에 `transform`/`position` 컨텍스트가 생기면 실제 문서 좌표와 어긋납니다. (`.page-enter` 애니메이션이 `transform` 을 쓰고 있어 위험 구간)

**개선안**: `el.getBoundingClientRect().top + window.scrollY` 로 통일.

### 🟠 A-7. 적용사례 상세가 반복해서 다시 열림
`CaseExampleSection1/2` 의 selectedId 처리 `useEffect` 의존성이 `[location.state, caseExamples]` 입니다. `window.history.replaceState` 로는 **React Router 내부의 `location.state` 가 지워지지 않으므로**, 목록 데이터가 갱신될 때마다 조건이 다시 참이 되어 상세 화면이 재차 열릴 수 있습니다.

**개선안**: `navigate(location.pathname, { replace: true, state: null })` 사용 + `처리 완료` ref 가드 추가.

### 🟡 A-8. 연혁의 `month` 값이 항상 비어 있음
`AdminDashboardPage` 는 `events: [{ content }]` 만 저장하는데, `HistorySection` 은 `<span className="month">{event.month}</span>` 를 렌더합니다. → 빈 span 이 매 항목마다 자리만 차지.

**개선안**: 관리자 폼에 월 입력을 추가하거나, 마크업에서 month 를 제거(현재 기획에 맞춰 택1).

---

## 3. 구조 · 중복 (유지보수 비용)

### B-1. `CaseExampleSection1.jsx` ↔ `2.jsx` — **각 18.9KB, 실질 차이 2줄**
diff 결과 실제 차이는 `category: 'example1' | 'example2'` 와 제목 문자열뿐입니다. 이미 썸네일 정규식과 `useMemo` 의존성 배열이 미세하게 달라지기 시작해, **한쪽만 고치는 버그**가 발생하기 좋은 상태입니다.

**개선안**
```jsx
// CaseExampleSection.jsx (단일 파일)
const CaseExampleSection = forwardRef(({ category, title }, ref) => { ... });

// CasesPage.jsx
<Route path="example1" element={<CaseExampleSection category="example1" title="촉매형 탄산가스발생기(탄사니) 적용 사례" />} />
<Route path="example2" element={<CaseExampleSection category="example2" title="환경데이터측정기(다오니) 적용 사례" />} />
```
→ 약 19KB 감소, 유지보수 지점 1곳으로.

### B-2. `NoticeSection` ↔ `DataroomSection` — 거의 동일 (27KB)
목록/아코디언/Quill 에디터/첨부(업로드·드라이브링크)/스토리지 정리/페이지네이션 로직이 통째로 같고, 다른 것은 **테이블명(`notices`/`archives`), 스토리지 폴더, 라벨(Q/D), `author` 필드 유무** 정도입니다.

**개선안**: `BoardSection({ table, storageFolder, title, badge, extraFields })` 공통 컴포넌트로 추출. 두 파일 → 1개 + 얇은 래퍼 2개.

### B-3. 지식재산권 UI가 2벌로 존재
- `IntellectualPropertySection.jsx` (단독, `/about/ip`)
- `Certificationsection.jsx` 안에 **동일 갤러리가 다시 구현**됨 (인증 + 지식재산권 2블록)

업로드·WebP 압축·순서 변경·삭제 로직이 두 파일에 중복되어 있고, `Certificationsection.jsx` 는 `IntellectualPropertySection.css` 까지 import 합니다.

**개선안**: `GalleryManagerSection({ table, storageFolder, title, subtitle, highlight })` 하나로 통합 → 인증/지식재산권을 props 로만 구분.

### B-4. 사용되지 않는 파일 (import 참조 0건 확인)
| 파일 | 상태 |
|---|---|
| `src/App.jsx.txt` | 구버전 백업 |
| `sections/subsections/Certificationsection-backup.jsx` | 백업 |
| `components/HomeFloatingButton.jsx` + `.css` | 어디서도 import 안 함 |
| `components/CasesModal.jsx` + `.css` | 미사용 (LenisScroller 주석에만 언급) |
| `components/IntellectualPropertyModal.jsx` + `.css` | 미사용 (동상) |
| `hooks/useNavigation.js` | `useMenuNavigation` 과 기능 중복, 미사용 |
| `hooks/useScrollSpy.js` | 미사용 |
| `sections/subsections/ScopeSection.jsx` / `RndSection.jsx` | BusinessPage 에서 import 되지만 **라우트가 주석**이라 죽은 코드 |

**개선안**: 삭제(또는 `_legacy/` 로 이동). ScopeSection 은 내용 품질이 괜찮으므로 살릴지 여부만 결정하면 됩니다.

### B-5. 홈의 `<SubNav />` 는 항상 `null`
`useMenuNavigation` 은 `/` 에 해당하는 메인 메뉴를 찾지 못해 `currentSubMenus = []` → SubNav 가 `null` 반환. HomePage 의 `<SubNav />` 는 실질적으로 죽은 코드입니다.

---

## 4. 성능

### C-1. 🔴 이미지 원본을 그대로 노출 (가장 체감이 큰 항목)
| 파일 | 크기 | 사용처 |
|---|---|---|
| `brochure/tansani/page-0002.jpg` | **4.4 MB** | 제품 페이지 + 브로슈어 |
| `brochure/tansani/page-0003.jpg` | 3.5 MB | 동상 |
| `brochure/tansani/page-0001.jpg` | 3.1 MB | 동상 |
| `brochure/tansani/page-0004.jpg` | 2.4 MB | 동상 |
| `images/ec799f...8999.jpg` | 5.3 MB | (미사용 추정) |
| `images/banner/banner1.jpg` = `daonrs_img.jpg` | 2.3 MB ×2 (중복 파일) | 메인 배너 |
| `banner4.jpg` | 1.6 MB | 적용사례 배너 |

→ `/products/product1` 한 페이지가 **이미지만 13.4 MB**. 모바일 LTE 기준 수십 초.

**개선안**
1. 정적 에셋 일괄 WebP/AVIF 변환 + 최대 폭 1600px 리사이즈 (예상 90%+ 감소)
2. `<img srcset>` 로 모바일/데스크톱 분기
3. 중복 파일(`banner1.jpg` ↔ `daonrs_img.jpg`) 정리, 미사용 이미지 삭제
4. 관리자 업로드 경로는 이미 WebP 압축을 하고 있으므로 **정적 에셋만 맞추면 정책이 통일**됨

### C-2. 코드 스플리팅 없음
`react-pageflip`(브로슈어), `recharts` + `axios` + `react-daum-postcode`(모니터), `react-quill-new`(관리 화면) 가 전부 **첫 화면 번들**에 포함됩니다.

**개선안**: `App.jsx` 에서 `React.lazy` + `<Suspense>` 로 `BrochurePage` / `MonitorPage` / `Admin*` 분리. 초기 JS 대폭 감소.

### C-3. 미사용 의존성
| 패키지 | 소스 내 사용 |
|---|---|
| `antd` | 컴포넌트 사용 0건. 단, `main.jsx` 가 `antd/dist/reset.css` 를 import 중 |
| `styled-components` | 0건 |
| `clsx`, `tailwind-merge`, `lucide-react` | 0건 |
| `tailwindcss` | `index.css` 에 `@import "tailwindcss"` 는 있으나 유틸리티 클래스 사용 0건 (프리플라이트만 적용 중) |

또한 `tailwind.config.js` 는 v3 형식인데 설치본은 **v4** 라 그대로는 읽히지 않습니다(v4는 `@theme` 또는 `@config` 사용).

**개선안**: 실제로 안 쓸 것이라면 `antd` / `styled-components` / `clsx` / `tailwind-merge` / `lucide-react` 제거 + `main.jsx` 의 antd reset import 제거. Tailwind 는 "쓸지 말지" 방침만 정하면 됩니다 — 쓰지 않는다면 `@import "tailwindcss"` 와 config 제거(프리플라이트가 기존 CSS와 충돌할 여지도 사라짐).

### C-4. 스크롤/리사이즈 리스너
- `Header.jsx`: `useEffect(..., [lastScrollY])` 라서 **스크롤 이벤트마다 리스너를 해제·재등록**합니다. `{ passive: true }` 도 없음.
  → `useRef` 로 이전 값을 들고, 리스너는 마운트 시 1회만 등록 + `requestAnimationFrame` 스로틀 권장.
- `Header.jsx` / `BrochurePage.jsx`: `resize` 디바운스 없음 → 창 크기 조절 중 전체 리렌더.

---

## 5. 보안 · 데이터

### D-1. 🔴 "로그인한 사용자 = 관리자" 전제
- RLS 정책이 전부 `{authenticated}` 대상 `USING true` 입니다. → **Supabase 에 가입된 아무 계정이나** 공지·자료실·인증서·지식재산권을 수정/삭제할 수 있습니다.
- 프론트도 `AuthContext` 에서 `isAdmin: !!session` 으로 동일한 가정을 합니다.

**개선안**: `profiles` 테이블(또는 `auth.jwt() -> 'app_metadata' ->> 'role'`)에 role 을 두고 RLS 를 `role = 'admin'` 으로 조이기. 회원가입이 열려 있다면 특히 시급.

### D-2. `dangerouslySetInnerHTML` + Quill 본문
공지/자료실/적용사례 본문을 그대로 주입합니다. 작성자가 관리자로 제한되면 위험도는 낮지만, **D-1 과 결합하면 XSS 경로**가 됩니다.
**개선안**: `DOMPurify.sanitize()` 를 렌더 시점에 적용 (허용 태그에 `iframe` 포함 필요 — 유튜브 변환 때문에).

### D-3. 문의 폼 스팸
`inquiries` 는 `anon` INSERT 허용이고 방어는 허니팟 하나입니다.
**개선안**: Turnstile/hCaptcha 또는 Netlify Function 경유 + 간단한 rate limit.

### D-4. 외부 의존
- 썸네일 대체 이미지가 `via.placeholder.com` — 해당 서비스 장애/차단 시 카드가 깨집니다. → 로컬 SVG placeholder 권장.
- `index.html` 의 Kakao SDK `%KAKAO_JS_KEY%` 치환은 Vite 기본 동작이 아닙니다(플러그인 필요). 현재 코드에서 Kakao SDK 를 직접 쓰는 곳이 없어 보이므로 **제거 후보**.

---

## 6. SEO · 접근성 · 일관성

| 항목 | 현재 | 개선안 |
|---|---|---|
| `index.html` | `<html lang="en">` | `lang="ko"` |
| 메타 태그 | description / OG / twitter 없음 | 공유 미리보기·검색 노출을 위해 추가 |
| favicon | `/src/assets/images/site_logo.png` (개발 경로) | `public/` 로 옮기고 `/favicon.png` 참조 |
| SPA 새로고침 | `netlify/` 폴더 존재 | `_redirects` 에 `/* /index.html 200` 확인 필요 |
| 제목 태그 | VisionSection 만 `<h1 className="subsection-title">`, 나머지는 `<h2>`. Banner 도 `<h1>` | 페이지당 `h1` 1개 원칙으로 통일 |
| 페이지별 title | 모든 라우트가 동일 `(주) 다온알에스` | 라우트별 document.title 설정 |
| 이미지 lazy | 브로슈어 섹션에만 적용 | 인증/지식재산권 갤러리, 사례 썸네일에도 `loading="lazy"` |
| 명칭 불일치 | 메뉴 `고객센터` ↔ 배너 `고객지원`, 메뉴 `제품` ↔ 배너 `제품소개` | 용어 통일 |
| 피드백 UI | `alert()` / `confirm()` 다수 | 토스트/모달로 교체하면 완성도 상승 |
| 인라인 스타일 | `InquirySection`, `AdminDashboardPage`, `BrochurePage` 에 대량 | 각 CSS 파일로 이동 (패치내역의 "CSS 분리" 방침과 일치) |

---

## 7. 개별 페이지 메모

- **MonitorPage**: 그래프가 `dummyGraphData` 고정이고, 기기 카드("양액딸기 / 472 ppm")도 하드코딩입니다. 헤더의 `관리자님 | 회원정보 변경 | 로그아웃` 은 동작하지 않는 텍스트. **로그인 없이 `/monitor` 로 누구나 접근 가능** → 공개 여부를 먼저 정해야 합니다.
- **BrochurePage**: `handleClose` 가 `window.close()` 를 먼저 호출합니다. 스크립트로 연 창이 아니면 브라우저가 무시하므로 100ms 뒤 `navigate('/')` 로 폴백하는 구조인데, `target="_blank"` 로 여는 현재 흐름에선 대부분 닫힙니다. 직접 URL 접근 시에는 폴백이 동작 — 의도된 동작인지 확인만 필요.
- **AdminDashboardPage**: 문의 배지 숫자가 `inquiry` 탭을 열어야만 채워집니다(초기 진입 시 0). → 마운트 시 미처리 건수를 한 번 조회하면 개선.
- **VisionSection**: 정적 텍스트가 JSX 에 하드코딩. 다른 섹션들이 Supabase/JSON 기반인 것과 대비되므로, 수정 빈도가 있다면 `content/` 로 분리 권장.

---

## 8. 권장 진행 순서

| 단계 | 내용 | 리스크 | 체감 효과 |
|---|---|---|---|
| **1** | A-2(인증 경로 공백), A-3(`/business`), A-4(배너 링크) | 매우 낮음 (한 줄 단위) | 깨진 메뉴 즉시 복구 |
| **2** | A-1(홈 하단 블록) — 살릴지 제거할지 결정 필요 | 낮음 | 홈 완성도 |
| **3** | C-1 이미지 최적화 + B-4 미사용 파일 정리 | 낮음 | **로딩 속도 최대 개선** |
| **4** | A-5/A-6/A-7 스크롤·상세보기 동작 정리 | 중간 (동작 확인 필요) | 조작감 안정화 |
| **5** | D-1 RLS 권한 분리 + D-2 sanitize | 중간 (DB 정책 변경) | 보안 |
| **6** | B-1/B-2/B-3 중복 컴포넌트 통합 + C-2 코드 스플리팅 | 높음 (리팩터링) | 유지보수·번들 |
| **7** | C-3 미사용 패키지 제거, SEO/접근성 정리 | 낮음~중간 | 품질 |

> 1~3 단계는 서로 독립적이라 바로 진행 가능합니다. 4단계 이후는 동작 확인(회귀 테스트)이 함께 필요합니다.
