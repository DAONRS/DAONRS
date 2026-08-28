# 개발자 가이드 매뉴얼 v2 (상세 디렉토리 구조 및 역할 포함)

본 문서는 `daonrs` (Lumiela.github.io) 프로젝트를 인계받아 유지보수 및 추가 개발을 진행할 개발자를 위한 가이드입니다.

## 1. 기술 스택 (Tech Stack)
- **프론트엔드 프레임워크**: React (v19.2.0)
- **빌드 도구**: Vite
- **라우팅**: React Router v7
- **스타일링**: Tailwind CSS v4, Styled-components, 순수 CSS 혼용
- **UI 컴포넌트**: Ant Design (antd), Lucide-react, React-icons
- **상태 관리 및 기능**: React Context API (`AuthContext`)
- **기타 라이브러리**: Swiper (캐러셀), Recharts (차트), React-quill-new (에디터), Lenis (스무스 스크롤)
- **백엔드 (BaaS)**: Supabase (Auth, Database, Storage)

## 2. 프로젝트 실행 방법 (Local Setup)
```bash
# 1. 의존성 설치
npm install

# 2. 로컬 개발 서버 실행
npm run dev

# 3. 프로덕션 빌드
npm run build
```
*(참고: 루트 폴더의 `.env` 파일에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`가 필수적으로 세팅되어 있어야 합니다.)*

---

## 3. 디렉토리 구조 및 핵심 컴포넌트 분석

프로젝트의 주요 비즈니스 로직과 UI 컴포넌트는 `/src` 내부에 다음과 같이 계층적으로 분리되어 있습니다.

### `/src/pages` (페이지 라우트 컴포넌트)
라우터에 의해 렌더링되는 최상단 페이지 컴포넌트들이 모여 있습니다.
- **`HomePage.jsx` / `AboutPage.jsx` / `BusinessPage.jsx` / `ProductsPage.jsx` 등**: 각 메뉴별 진입점 역할을 하며, 주로 내부적으로 `sections` 폴더의 하위 컴포넌트들을 import 하여 조합하는 구조를 띕니다.
- **`AdminLoginPage.jsx`**: Supabase Auth를 통한 관리자 로그인 인터페이스.
- **`AdminDashboardPage.jsx`**: 인증된 사용자만 접근할 수 있는 통합 관리자 페이지. 이곳에서 문의(inquiries), 연혁(history) 등을 읽고 쓰는 주요 비즈니스 로직과 상태 관리가 가장 복잡하게 구현되어 있습니다.
- **`MonitorPage.jsx`**: 별도의 모니터링/대시보드 또는 데이터 시각화(Recharts 사용 추정)를 제공하는 페이지입니다.

### `/src/sections` 및 `/src/sections/subsections` (페이지 구성 블록)
페이지를 구성하는 각 영역(Hero, Content, Footer 등)이나 특정 기능 단위 컴포넌트가 존재합니다. 파일 명명 규칙이 기능별로 매우 직관적으로 나누어져 있습니다.
- **`HistorySection.jsx`**: DB의 history 테이블과 연동하여 연혁을 렌더링하는 섹션.
- **`InquirySection.jsx`**: 고객이 문의를 남길 수 있는 Form UI와 `supabase.from('inquiries').insert()` 로직이 포함된 컴포넌트.
- **`CaseExampleSection1.jsx`, `CaseExampleSection2.jsx`, `CasePreviewSection.jsx`**: 시공 사례 게시판의 목록, 상세 보기, 썸네일 프리뷰 등을 담당하는 컴포넌트들. 내부적으로 에디터 렌더링을 처리합니다.
- **`NoticeSection.jsx`, `DataroomSection.jsx`**: 공지사항 및 자료실 렌더링.
- **`Certificationsection.jsx`, `IntellectualPropertySection.jsx`**: 지식재산권/인증서 이미지를 불러와 캐러셀(Swiper) 등으로 보여주는 섹션입니다.
- **`VisionSection.jsx`, `ScopeSection.jsx`, `RndSection.jsx`, `DirectionsSection.jsx`**: 주로 About 페이지 등에서 사용되는 정적 정보 섹션입니다.

### `/src/hooks` (커스텀 훅)
컴포넌트들에서 공통으로 사용되는 상태 및 부수효과 로직을 분리해 두었습니다.
- **`editorHandlers.js`**: React-Quill 에디터에서 이미지를 첨부할 때, Supabase Storage(`daonrs` 버킷)로 이미지를 업로드하고 반환된 publicUrl을 에디터에 삽입해 주는 역할을 하는 매우 중요한 훅입니다.
- **`useMenuNavigation.js`, `useNavigation.js`**: 라우팅 이동 및 메뉴 활성화 상태 관리를 지원합니다.
- **`useScrollHeader.js`, `useScrollReveal.js`, `useScrollSpy.js`**: 스크롤 애니메이션(Scroll Reveal), 특정 위치 도달 시 헤더 스타일 변경, 화면 내 특정 요소 트래킹 등 UI의 동적 효과를 담당하는 유틸리티 훅들입니다.

### `/src/contexts` (전역 상태)
- **`AuthContext.jsx`**: 앱 전역에서 Supabase 세션(Session) 정보를 관리합니다. 컴포넌트들이 이 Context를 통해 현재 로그인 여부(관리자 여부)를 파악하고 기능 접근 제어를 수행합니다.

---

## 4. 백엔드(Supabase) 연동
- 프로젝트 내 `supabaseClient.js` (또는 `.ts`)를 통해 Supabase에 연결됩니다.
- 데이터베이스 설계, 스키마, 정책(RLS) 등은 별도로 작성된 **`supabase_manual_ver0.0.2.md`** 문서를 참고하세요. 해당 문서에는 쿼리문이 보존되어 있으므로 스키마 변경 시 반드시 참고해야 합니다.

---

## 5. 인계 시 주요 확인 사항
1. **에디터 기반 콘텐츠 (React-Quill)**: 에디터에서 생성된 HTML 문자열이 DB에 저장되므로, 프론트에서 이를 렌더링할 때 `dangerouslySetInnerHTML` 처리가 들어갑니다. XSS 등의 보안 이슈가 없도록 주의해야 하며 가급적 관리자만 작성 가능한 구조를 유지하세요.
2. **스타일링 혼재**: Tailwind CSS와 Styled-components, 그리고 일반 CSS 파일(예: `AdminDashboardPage.css`)이 혼재되어 사용되고 있습니다. 새로운 UI 추가 시 기존 프로젝트 규칙 중 어떤 것을 우선할지 정책을 정하는 것이 좋습니다.
3. **스토리지 잔존 파일 관리**: `editorHandlers.js`를 통해 이미지를 업로드한 후, 글 작성을 취소하거나 글 자체를 삭제할 경우 스토리지의 원본 이미지가 고아(Orphan) 상태로 남을 수 있습니다. 필요하다면 삭제 트리거 연동 로직을 추가 구현해야 할 수 있습니다.
