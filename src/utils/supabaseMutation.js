// src/utils/supabaseMutation.js
//
// 관리자 쓰기 작업(insert / update / upsert / delete) 공용 결과 확인 유틸.
//
// supabase-js 는 요청이 실패해도 예외를 던지지 않고 { data, error } 를 돌려준다.
// 또한 RLS 정책에 막힌 UPDATE / DELETE 는 error 없이 "0건 반영" 으로 끝난다.
// 결과를 확인하지 않으면 실제로는 실패했는데도 "등록되었습니다" 가 표시되므로
// 모든 쓰기 요청은 이 함수를 거쳐 실패 시 예외를 던지도록 한다.
//
// 사용법: 반드시 .select() 를 붙여 반영된 행을 돌려받도록 호출한다.
//   await runMutation(
//     supabase.from('notices').update(data).eq('id', id).select('id'),
//     '공지 수정'
//   );

export const runMutation = async (query, label = '요청') => {
  const { data, error } = await query;

  if (error) {
    throw new Error(`${label} 실패: ${error.message}`);
  }

  if (Array.isArray(data) && data.length === 0) {
    throw new Error(
      `${label} 실패: 반영된 데이터가 없습니다.\n로그인 상태 또는 DB 권한(RLS) 설정을 확인해 주세요.`
    );
  }

  return data;
};

// 스토리지 파일 삭제 (본 작업의 성패에는 영향을 주지 않는 정리 작업)
// 실패해도 예외를 던지지 않고 콘솔 경고만 남긴다.
export const removeStorageFiles = async (supabase, bucket, paths) => {
  const targets = (paths || []).filter(Boolean);
  if (!targets.length) return;

  try {
    const { error } = await supabase.storage.from(bucket).remove(targets);
    if (error) console.warn(`[${bucket}] 스토리지 파일 삭제 실패:`, error.message);
  } catch (err) {
    console.warn(`[${bucket}] 스토리지 파일 삭제 실패:`, err);
  }
};

// 에디터 본문(HTML)에 삽입된 이미지 중 지정 버킷에 올라간 파일의 스토리지 경로만 추출한다.
// 글 삭제 시 본문 이미지까지 함께 정리하는 데 사용한다. (외부 이미지 주소는 제외)
export const extractStoragePathsFromHtml = (html, bucket) => {
  if (!html) return [];
  const paths = [];
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    const marker = `/${bucket}/`;
    const idx = src.indexOf(marker);
    if (idx === -1) continue;
    const path = decodeURIComponent(src.slice(idx + marker.length).split('?')[0]);
    if (path) paths.push(path);
  }
  return paths;
};

// 게시글을 바로 위(-1) / 아래(1) 글과 자리 교환한다. (공지사항·자료실 관리자 전용)
// 이웃 글 탐색과 교환은 DB 함수 move_post 가 한 트랜잭션으로 처리한다.
// → supabase_post_sort_order.sql 참고
// 반환값: 교환했으면 true, 이미 맨 위/맨 아래라 바꿀 글이 없으면 false
export const movePost = async (supabase, table, id, direction) => {
  const { data, error } = await supabase.rpc('move_post', {
    p_table: table,
    p_id: String(id),
    p_direction: direction,
  });
  if (error) throw new Error(`순서 변경 실패: ${error.message}`);
  return data === true;
};
