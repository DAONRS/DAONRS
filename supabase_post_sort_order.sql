-- =====================================================================
-- 게시글 순서 직접 변경 (2026-10-02)
--
-- 목적: 공지사항(notices) / 자료실(archives)에서 관리자가 ▲▼ 버튼으로
--       바로 위/아래 글과 자리를 바꿀 수 있게 한다. (클라이언트 요청)
-- 방법: sort_order 컬럼(클수록 위)을 두고 목록 정렬 기준을 이 컬럼으로 바꾼다.
--       자리 교환은 move_post() 함수가 한 트랜잭션으로 처리한다.
-- 실행: Supabase 대시보드 → SQL Editor 에 전체를 붙여넣고 Run
--       ⚠️ 앱 코드를 배포하기 "전에" 먼저 실행해야 한다.
--          (컬럼이 없으면 목록 조회가 실패해 게시판이 비어 보인다)
-- 특징: 몇 번을 다시 실행해도 안전하다.
--
-- 참고: supabase_post_updated_at.sql 의 "수정하면 맨 위로" 정렬은 이것으로 대체된다.
--       updated_at 과 트리거는 그대로 두며, 목록의 '수정 YYYY-MM-DD' 표시에만 쓰인다.
--       트리거는 제목/본문/첨부가 바뀔 때만 발동하므로 순서 변경은 수정일을 건드리지 않는다.
--
-- ⚠️ move_post 함수는 supabase_post_pin.sql 에서 "고정 여부가 같은 글끼리만 교환" 하도록 재정의된다.
--    이 파일을 다시 실행했다면 supabase_post_pin.sql 도 이어서 다시 실행할 것.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. sort_order 컬럼 추가 + 지금 보이는 순서대로 채우기
--
-- 현재 목록은 updated_at 최신순이므로, 오래된 글부터 1, 2, 3 ... 을 매긴다.
-- (값이 클수록 위) → 적용 직후에도 화면 순서가 그대로 유지된다.
-- WHERE sort_order IS NULL 덕분에 재실행해도 이미 정한 순서는 건드리지 않는다.
-- ---------------------------------------------------------------------
ALTER TABLE public.notices  ADD COLUMN IF NOT EXISTS sort_order bigint;
ALTER TABLE public.archives ADD COLUMN IF NOT EXISTS sort_order bigint;

WITH base AS (SELECT coalesce(max(sort_order), 0) AS m FROM public.notices),
     ranked AS (
       SELECT id, row_number() OVER (ORDER BY updated_at, created_at, id) AS rn
       FROM public.notices WHERE sort_order IS NULL
     )
UPDATE public.notices t SET sort_order = base.m + ranked.rn
FROM ranked, base WHERE t.id = ranked.id;

WITH base AS (SELECT coalesce(max(sort_order), 0) AS m FROM public.archives),
     ranked AS (
       SELECT id, row_number() OVER (ORDER BY updated_at, created_at, id) AS rn
       FROM public.archives WHERE sort_order IS NULL
     )
UPDATE public.archives t SET sort_order = base.m + ranked.rn
FROM ranked, base WHERE t.id = ranked.id;


-- ---------------------------------------------------------------------
-- 2. 새 글은 자동으로 맨 위
--
-- 시퀀스를 현재 최댓값에 맞춰 두고 기본값으로 지정한다.
-- 앱의 insert 코드는 sort_order 를 넘기지 않아도 된다.
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.notices_sort_order_seq;
CREATE SEQUENCE IF NOT EXISTS public.archives_sort_order_seq;

SELECT setval('public.notices_sort_order_seq',
              greatest((SELECT coalesce(max(sort_order), 0) FROM public.notices), 1));
SELECT setval('public.archives_sort_order_seq',
              greatest((SELECT coalesce(max(sort_order), 0) FROM public.archives), 1));

ALTER TABLE public.notices  ALTER COLUMN sort_order SET DEFAULT nextval('public.notices_sort_order_seq');
ALTER TABLE public.archives ALTER COLUMN sort_order SET DEFAULT nextval('public.archives_sort_order_seq');
ALTER TABLE public.notices  ALTER COLUMN sort_order SET NOT NULL;
ALTER TABLE public.archives ALTER COLUMN sort_order SET NOT NULL;

-- UNIQUE 는 걸지 않는다. 두 행을 한 번의 UPDATE 로 맞바꿀 때
-- 즉시 검사되는 UNIQUE 제약은 중간 상태에서 충돌을 일으킨다.
CREATE INDEX IF NOT EXISTS notices_sort_order_idx  ON public.notices  (sort_order DESC);
CREATE INDEX IF NOT EXISTS archives_sort_order_idx ON public.archives (sort_order DESC);


-- ---------------------------------------------------------------------
-- 3. 자리 교환 함수
--
-- move_post('notices', '<글 id>', -1)  → 바로 위 글과 교환
-- move_post('notices', '<글 id>',  1)  → 바로 아래 글과 교환
-- 반환값: 교환했으면 true, 이미 맨 위/맨 아래라 바꿀 글이 없으면 false
--
-- 이웃 글을 DB 에서 직접 찾으므로 페이지 경계(1페이지 마지막 ↔ 2페이지 첫 글)도 처리된다.
-- SECURITY INVOKER: 호출한 사용자의 RLS 권한으로 실행된다.
-- RLS 에 막히면 0건 반영으로 끝나므로 반영 건수를 확인해 오류를 낸다.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.move_post(p_table text, p_id text, p_direction int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  cur_order bigint;
  nb_id     text;
  nb_order  bigint;
  affected  int;
BEGIN
  IF p_table NOT IN ('notices', 'archives') THEN
    RAISE EXCEPTION '허용되지 않은 테이블입니다: %', p_table;
  END IF;
  IF p_direction NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'p_direction 은 -1(위) 또는 1(아래)이어야 합니다.';
  END IF;

  EXECUTE format('SELECT sort_order FROM public.%I WHERE id::text = $1', p_table)
    INTO cur_order USING p_id;
  IF cur_order IS NULL THEN
    RAISE EXCEPTION '글을 찾을 수 없습니다.';
  END IF;

  IF p_direction = -1 THEN
    EXECUTE format('SELECT id::text, sort_order FROM public.%I
                    WHERE sort_order > $1 ORDER BY sort_order ASC LIMIT 1', p_table)
      INTO nb_id, nb_order USING cur_order;
  ELSE
    EXECUTE format('SELECT id::text, sort_order FROM public.%I
                    WHERE sort_order < $1 ORDER BY sort_order DESC LIMIT 1', p_table)
      INTO nb_id, nb_order USING cur_order;
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

-- 비로그인 방문자는 호출 자체를 막는다 (RLS 와 이중 방어)
REVOKE EXECUTE ON FUNCTION public.move_post(text, text, int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.move_post(text, text, int) TO authenticated;


-- ---------------------------------------------------------------------
-- 4. 적용 결과 확인 (위에서부터 화면에 보이는 순서)
-- ---------------------------------------------------------------------
SELECT 'notices' AS 테이블, sort_order, title, created_at::date AS 작성일
FROM public.notices ORDER BY sort_order DESC LIMIT 15;

SELECT 'archives' AS 테이블, sort_order, title, created_at::date AS 작성일
FROM public.archives ORDER BY sort_order DESC LIMIT 15;
