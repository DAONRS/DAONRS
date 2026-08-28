| schemaname | tablename      | policyname                            | permissive | roles           | cmd    | using_expression | with_check_expression |
| ---------- | -------------- | ------------------------------------- | ---------- | --------------- | ------ | ---------------- | --------------------- |
| public     | notices        | 누구나 공지사항을 읽을 수 있습니다.                  | PERMISSIVE | {anon}          | SELECT | true             | null                  |
| public     | notices        | Allow public read access              | PERMISSIVE | {public}        | SELECT | true             | null                  |
| public     | archives       | 누구나 조회 가능                             | PERMISSIVE | {public}        | SELECT | true             | null                  |
| public     | archives       | 관리자만 수정 가능                            | PERMISSIVE | {authenticated} | ALL    | true             | null                  |
| public     | certifications | 인증서 누구나 조회 가능                         | PERMISSIVE | {public}        | SELECT | true             | null                  |
| public     | certifications | 인증서 관리자 전체 권한                         | PERMISSIVE | {authenticated} | ALL    | true             | true                  |
| public     | notices        | 누구나 읽기 가능                             | PERMISSIVE | {public}        | SELECT | true             | null                  |
| public     | notices        | 인증된 사용자만 글쓰기 가능                       | PERMISSIVE | {authenticated} | INSERT | null             | true                  |
| public     | notices        | 로그인한 사용자 전체 수정 허용                     | PERMISSIVE | {authenticated} | UPDATE | true             | true                  |
| public     | notices        | 로그인한 사용자 전체 삭제 허용                     | PERMISSIVE | {authenticated} | DELETE | true             | null                  |
| public     | archives       | 자료실 누구나 읽기 가능                         | PERMISSIVE | {public}        | SELECT | true             | null                  |
| public     | archives       | 자료실 로그인 사용자 업로드 허용                    | PERMISSIVE | {authenticated} | INSERT | null             | true                  |
| public     | archives       | 자료실 로그인 사용자 수정 허용                     | PERMISSIVE | {authenticated} | UPDATE | true             | true                  |
| public     | archives       | 자료실 로그인 사용자 삭제 허용                     | PERMISSIVE | {authenticated} | DELETE | true             | null                  |
| public     | inquiries      | Enable insert for anon users          | PERMISSIVE | {anon}          | INSERT | null             | true                  |
| public     | inquiries      | Enable read for authenticated users   | PERMISSIVE | {authenticated} | SELECT | true             | null                  |
| public     | inquiries      | Enable update for authenticated users | PERMISSIVE | {authenticated} | UPDATE | true             | true                  |