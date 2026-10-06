// -----------------------------------------------------------------
// 첨부파일 공용 유틸
// - Supabase 스토리지 업로드 파일과 구글 드라이브 공유 링크를 함께 지원
// - 공지사항(NoticeSection) / 자료실(DataroomSection)에서 공유해서 사용
// -----------------------------------------------------------------

// 구글 드라이브(문서 포함) 링크인지 판별
export const isDriveUrl = (url) => !!url && /(?:drive|docs)\.google\.com/i.test(url);

// 드라이브 "폴더" 공유 링크인지 판별 (폴더는 직접 다운로드 변환 불가)
export const isDriveFolderUrl = (url) =>
  !!url && /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\//i.test(url);

// 공유 링크에서 파일 ID 추출
// 지원 형태:
//   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
//   https://docs.google.com/document/d/FILE_ID/edit
//   https://drive.google.com/open?id=FILE_ID
//   https://drive.usercontent.google.com/download?id=FILE_ID&export=download
export const extractDriveFileId = (url) => {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
    /\/d\/([a-zA-Z0-9_-]{10,})/,
    /[?&]id=([a-zA-Z0-9_-]{10,})/,
  ];
  for (const pattern of patterns) {
    const matched = url.match(pattern);
    if (matched && matched[1]) return matched[1];
  }
  return null;
};

// 공유 링크 → 바로 다운로드가 시작되는 주소로 변환
// (폴더 링크이거나 ID를 못 찾으면 원본 링크를 그대로 사용)
export const toDriveDownloadUrl = (url) => {
  if (!url || isDriveFolderUrl(url)) return url;
  const fileId = extractDriveFileId(url);
  if (!fileId) return url;
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
};

// 관리자가 입력한 링크의 형식 검증 (문제가 있으면 안내 문구, 정상이면 null 반환)
export const validateAttachLink = (url) => {
  const trimmed = (url || '').trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) {
    return 'http:// 또는 https:// 로 시작하는 링크를 입력해 주세요.';
  }
  if (isDriveUrl(trimmed) && !isDriveFolderUrl(trimmed) && !extractDriveFileId(trimmed)) {
    return '구글 드라이브 공유 링크 형식을 확인해 주세요.\n(예: https://drive.google.com/file/d/파일ID/view?usp=sharing)';
  }
  return null;
};

// Supabase 스토리지에 올라간 파일인지 판별
export const isStorageUrl = (url, bucketName) =>
  !!url && !isDriveUrl(url) && url.includes(`/${bucketName}/`);

// 첨부파일 다운로드 공통 처리
// - 스토리지 파일: fetch → blob 으로 받아 원본 파일명으로 강제 저장
// - 외부 링크(드라이브 등): CORS 로 fetch 가 불가능하므로 새 탭으로 이동
export const downloadAttachment = async (post) => {
  const url = post?.file_url;
  if (!url) return;

  if (isDriveUrl(url)) {
    window.open(toDriveDownloadUrl(url), '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('파일을 불러오지 못했습니다.');

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = post.file_name || '다운로드파일'; // 원본 파일명 지정
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    // 스토리지 외 외부 링크가 저장되어 있거나 CORS 로 막힌 경우 새 탭 열기로 폴백
    console.warn('직접 다운로드 실패, 새 탭으로 엽니다:', err);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
