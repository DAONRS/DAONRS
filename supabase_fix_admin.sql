-- =====================================================================
-- 관리자 기능 DB 보정 SQL (2026-09-18)
--
-- 목적: 관리자 로그인 시 나타나는 버튼(등록/수정/삭제/업로드/순서변경)이
--       DB 권한·스키마 문제로 실패하지 않도록 보정한다.
-- 실행: Supabase 대시보드 → SQL Editor 에 전체를 붙여넣고 Run
-- 특징: 몇 번을 다시 실행해도 안전하다 (IF NOT EXISTS / DROP IF EXISTS).
--       기존 데이터는 변경·삭제하지 않는다.
-- 정책 이름은 manual/supabase_manual_ver0.0.2.md 와 동일하게 맞췄다.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. 공지사항(notices) 첨부파일 컬럼
--    NoticeSection 이 file_url / file_name 을 저장하는데
--    기존 테이블 정의(db_table.md)에는 이 컬럼이 없다 → 등록/수정 전부 실패
-- ---------------------------------------------------------------------
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS file_url  text;
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS file_name text;


-- ---------------------------------------------------------------------
-- 2. 테이블 RLS 정책 (누구나 조회 / 로그인 관리자 전체 권한)
--    db_rls.md 기준으로 아래 3개 테이블은 정책이 누락되어 있었다.
-- ---------------------------------------------------------------------

-- 2-1. 지식재산권 (intellectual_properties)
ALTER TABLE public.intellectual_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "지식재산권 누구나 조회 가능" ON public.intellectual_properties;
CREATE POLICY "지식재산권 누구나 조회 가능" ON public.intellectual_properties
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "지식재산권 관리자 전체 권한" ON public.intellectual_properties;
CREATE POLICY "지식재산권 관리자 전체 권한" ON public.intellectual_properties
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2-2. 적용 사례 (case_examples)
ALTER TABLE public.case_examples ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "사례 누구나 조회 가능" ON public.case_examples;
CREATE POLICY "사례 누구나 조회 가능" ON public.case_examples
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "사례 관리자 전체 권한" ON public.case_examples;
CREATE POLICY "사례 관리자 전체 권한" ON public.case_examples
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2-3. 연혁 (history)
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "연혁 누구나 조회 가능" ON public.history;
CREATE POLICY "연혁 누구나 조회 가능" ON public.history
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "연혁 관리자 전체 권한" ON public.history;
CREATE POLICY "연혁 관리자 전체 권한" ON public.history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------
-- 3. 스토리지 정책 (daonrs + images 버킷)
--    인증서·지식재산권 이미지는 images 버킷을 쓰는데
--    기존 정책(supabase_sql.txt)은 daonrs 버킷만 허용했다.
-- ---------------------------------------------------------------------

-- 3-0. images 버킷이 없으면 공개 버킷으로 생성 (이미 있으면 그대로 둔다)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "스토리지 파일 조회 허용" ON storage.objects;
CREATE POLICY "스토리지 파일 조회 허용" ON storage.objects
  FOR SELECT USING (bucket_id IN ('daonrs', 'images'));

DROP POLICY IF EXISTS "스토리지 업로드 허용" ON storage.objects;
CREATE POLICY "스토리지 업로드 허용" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('daonrs', 'images'));

DROP POLICY IF EXISTS "스토리지 파일 삭제 허용" ON storage.objects;
CREATE POLICY "스토리지 파일 삭제 허용" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id IN ('daonrs', 'images'));


-- ---------------------------------------------------------------------
-- 4. 적용 결과 확인 (실행 후 아래 결과 표를 확인)
-- ---------------------------------------------------------------------
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE (schemaname = 'public' AND tablename IN
        ('notices','archives','certifications','intellectual_properties','case_examples','history','inquiries'))
   OR (schemaname = 'storage' AND tablename = 'objects')
ORDER BY schemaname, tablename, cmd;
