-- =====================================================================
-- 게시글 수정 시 목록 최상단으로 올리기 (2026-10-01)
--
-- 목적: 공지사항(notices) / 자료실(archives)에서 글을 수정하면
--       해당 글이 목록 맨 위로 올라오도록 한다.
-- 방법: updated_at 컬럼을 두고, 내용이 실제로 바뀐 UPDATE 에서만
--       트리거가 시각을 갱신한다. 정렬 기준을 이 컬럼으로 바꾼다.
-- 실행: Supabase 대시보드 → SQL Editor 에 전체를 붙여넣고 Run
-- 특징: 몇 번을 다시 실행해도 안전하다.
--       기존 created_at 은 건드리지 않으므로 원 작성일이 보존된다.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. updated_at 컬럼 추가
--
-- ⚠️ DEFAULT now() 를 붙여서 한 번에 추가하면 안 된다.
--    그렇게 하면 기존 글이 전부 "지금" 수정된 것으로 찍히고,
--    이 스크립트를 두 번째 실행할 때 이미 쌓인 수정 이력이 날아간다.
--    → nullable 로 먼저 추가하고, NULL 인 행만 채운 뒤 제약을 건다.
-- ---------------------------------------------------------------------
ALTER TABLE public.notices  ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE public.archives ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- 기존 글은 작성일로 채운다 → 지금 보이는 순서가 그대로 유지된다.
-- WHERE 절 덕분에 재실행해도 이미 수정된 글의 값은 건드리지 않는다.
UPDATE public.notices  SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE public.archives SET updated_at = created_at WHERE updated_at IS NULL;

-- 이제 제약을 건다 (앞으로 등록되는 글은 자동으로 현재 시각)
ALTER TABLE public.notices  ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.notices  ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE public.archives ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.archives ALTER COLUMN updated_at SET NOT NULL;


-- ---------------------------------------------------------------------
-- 2. 갱신 함수
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$;


-- ---------------------------------------------------------------------
-- 3. 트리거
--
-- WHEN 절이 핵심이다. 이게 없으면 관리자가 글을 열어 아무것도 고치지 않고
-- 저장만 눌러도 옛날 글이 맨 위로 올라간다.
-- 제목 / 본문 / 첨부 중 하나라도 실제로 달라졌을 때만 발동한다.
--
-- 앱이 수정 시 값을 어떻게 넘기는지는 NoticeSection.jsx 의 postData 참고.
-- 첨부를 건드리지 않으면 기존 file_url 을 그대로 다시 넣으므로
-- IS DISTINCT FROM 비교가 정확히 동작한다.
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_notices_touch ON public.notices;
CREATE TRIGGER trg_notices_touch
  BEFORE UPDATE ON public.notices
  FOR EACH ROW
  WHEN (OLD.title    IS DISTINCT FROM NEW.title
     OR OLD.content  IS DISTINCT FROM NEW.content
     OR OLD.file_url IS DISTINCT FROM NEW.file_url)
  EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_archives_touch ON public.archives;
CREATE TRIGGER trg_archives_touch
  BEFORE UPDATE ON public.archives
  FOR EACH ROW
  WHEN (OLD.title    IS DISTINCT FROM NEW.title
     OR OLD.content  IS DISTINCT FROM NEW.content
     OR OLD.file_url IS DISTINCT FROM NEW.file_url)
  EXECUTE FUNCTION public.touch_updated_at();


-- ---------------------------------------------------------------------
-- 4. 적용 결과 확인
--    updated_at 이 created_at 과 다른 글 = 수정 이력이 있는 글
-- ---------------------------------------------------------------------
SELECT 'notices' AS 테이블,
       count(*)                                        AS 전체,
       count(*) FILTER (WHERE updated_at <> created_at) AS 수정된_글
FROM public.notices
UNION ALL
SELECT 'archives',
       count(*),
       count(*) FILTER (WHERE updated_at <> created_at)
FROM public.archives;

-- 트리거가 걸렸는지 확인
SELECT event_object_table AS 테이블, trigger_name AS 트리거, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN ('trg_notices_touch', 'trg_archives_touch')
ORDER BY event_object_table;


-- ---------------------------------------------------------------------
-- 참고: 실수로 옛날 글이 위로 올라갔을 때 되돌리기
--   UPDATE public.notices SET updated_at = created_at WHERE id = '<글 id>';
-- created_at 은 보존되므로 언제든 복구 가능하다.
-- ---------------------------------------------------------------------
