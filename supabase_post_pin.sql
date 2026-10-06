-- =====================================================================
-- 게시글 상단 고정 (2026-10-02)
--
-- 목적: 공지사항(notices) / 자료실(archives)에서 지정한 글을
--       목록 맨 위(1페이지 상단)에 고정한다.
-- 방법: is_pinned 컬럼을 두고 정렬 시 고정 글을 먼저 보여 준다.
--       고정 글끼리 / 일반 글끼리는 기존처럼 sort_order(▲▼ 로 정한 순서)를 따른다.
--       고정을 해제하면 sort_order 가 그대로이므로 원래 자리로 돌아간다.
-- 실행: Supabase 대시보드 → SQL Editor 에 전체를 붙여넣고 Run
--       ⚠️ supabase_post_sort_order.sql 을 먼저 실행한 뒤에 실행한다.
--       ⚠️ 앱 코드를 배포하기 "전에" 먼저 실행해야 한다.
--          (컬럼이 없으면 목록 조회가 실패해 게시판이 비어 보인다)
-- 특징: 몇 번을 다시 실행해도 안전하다. 기존 글은 모두 "고정 안 함" 으로 시작한다.
--       is_pinned 만 바뀌는 UPDATE 는 touch 트리거(supabase_post_updated_at.sql)의
--       WHEN 조건에 걸리지 않으므로 고정/해제해도 수정 날짜는 바뀌지 않는다.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. is_pinned 컬럼 추가
-- ---------------------------------------------------------------------
ALTER TABLE public.notices  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;
ALTER TABLE public.archives ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;


-- ---------------------------------------------------------------------
-- 2. 정렬용 인덱스 (앱의 order 순서와 동일)
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS notices_pinned_sort_idx  ON public.notices  (is_pinned DESC, sort_order DESC);
CREATE INDEX IF NOT EXISTS archives_pinned_sort_idx ON public.archives (is_pinned DESC, sort_order DESC);


-- ---------------------------------------------------------------------
-- 3. 자리 교환 함수 재정의 (supabase_post_sort_order.sql 의 move_post 를 대체)
--
-- 바뀐 점: 이웃 글을 "같은 고정 여부" 안에서만 찾는다.
--   → 고정 글은 고정 글끼리, 일반 글은 일반 글끼리만 ▲▼ 로 움직인다.
--   (이 조건이 없으면 일반 글 맨 위에서 ▲ 를 눌렀을 때 고정 글과 sort_order 가
--    뒤바뀌어 화면상 순서는 그대로인데 해제 후 자리만 엉키는 일이 생긴다)
-- 호출 방식 / 반환값 / 권한은 기존과 동일하다.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.move_post(p_table text, p_id text, p_direction int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  cur_order  bigint;
  cur_pinned boolean;
  nb_id      text;
  nb_order   bigint;
  affected   int;
BEGIN
  IF p_table NOT IN ('notices', 'archives') THEN
    RAISE EXCEPTION '허용되지 않은 테이블입니다: %', p_table;
  END IF;
  IF p_direction NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'p_direction 은 -1(위) 또는 1(아래)이어야 합니다.';
  END IF;

  EXECUTE format('SELECT sort_order, is_pinned FROM public.%I WHERE id::text = $1', p_table)
    INTO cur_order, cur_pinned USING p_id;
  IF cur_order IS NULL THEN
    RAISE EXCEPTION '글을 찾을 수 없습니다.';
  END IF;

  IF p_direction = -1 THEN
    EXECUTE format('SELECT id::text, sort_order FROM public.%I
                    WHERE is_pinned = $2 AND sort_order > $1
                    ORDER BY sort_order ASC LIMIT 1', p_table)
      INTO nb_id, nb_order USING cur_order, cur_pinned;
  ELSE
    EXECUTE format('SELECT id::text, sort_order FROM public.%I
                    WHERE is_pinned = $2 AND sort_order < $1
                    ORDER BY sort_order DESC LIMIT 1', p_table)
      INTO nb_id, nb_order USING cur_order, cur_pinned;
  END IF;

  IF nb_id IS NULL THEN
    RETURN false;
  END IF;

  EXECUTE format('UPDATE public.%I
                  SET sort_order = CASE WHEN id::text = $1 THEN $3 ELSE $4 END
                  WHERE id::text IN ($1, $2)', p_table)
    USING p_id, nb_id, nb_order, cur_order;

  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 2 THEN
    RAISE EXCEPTION '순서 변경 권한이 없습니다. 로그인 상태 또는 DB 권한(RLS) 설정을 확인해 주세요.';
  END IF;

  RETURN true;
END
$$;

REVOKE EXECUTE ON FUNCTION public.move_post(text, text, int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.move_post(text, text, int) TO authenticated;


-- ---------------------------------------------------------------------
-- 4. 적용 결과 확인
-- ---------------------------------------------------------------------
SELECT 'notices' AS 테이블,
       count(*)                          AS 전체,
       count(*) FILTER (WHERE is_pinned) AS 고정된_글
FROM public.notices
UNION ALL
SELECT 'archives',
       count(*),
       count(*) FILTER (WHERE is_pinned)
FROM public.archives;
