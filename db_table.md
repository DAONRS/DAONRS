| table\_name              | column\_name   | data\_type                | is\_nullable | column\_default               | rls\_enabled |

| ----------------------- | ------------- | ------------------------ | ----------- | ---------------------------- | ----------- |

| archives                | id            | uuid                     | NO          | gen\_random\_uuid()            | true        |

| archives                | created\_at    | timestamp with time zone | YES         | now()                        | true        |

| archives                | title         | text                     | NO          | null                         | true        |

| archives                | content       | text                     | YES         | null                         | true        |

| archives                | author        | text                     | YES         | null                         | true        |

| archives                | file\_url      | text                     | YES         | null                         | true        |

| archives                | file\_name     | text                     | YES         | null                         | true        |

| archives                | notice\_no     | bigint                   | NO          | null                         | true        |

| case\_examples           | id            | uuid                     | NO          | gen\_random\_uuid()            | true        |

| case\_examples           | title         | text                     | NO          | null                         | true        |

| case\_examples           | content       | text                     | YES         | null                         | true        |

| case\_examples           | created\_at    | timestamp with time zone | NO          | timezone('utc'::text, now()) | true        |

| case\_examples           | region        | text                     | YES         | null                         | true        |

| case\_examples           | crop          | text                     | YES         | null                         | true        |

| case\_examples           | facility\_type | text                     | YES         | null                         | true        |

| case\_examples           | area          | text                     | YES         | null                         | true        |

| case\_examples           | category      | text                     | YES         | 'example1'::text             | true        |

| certifications          | id            | uuid                     | NO          | gen\_random\_uuid()            | true        |

| certifications          | title         | text                     | NO          | null                         | true        |

| certifications          | image\_url     | text                     | NO          | null                         | true        |

| certifications          | storage\_path  | text                     | NO          | null                         | true        |

| certifications          | display\_order | integer                  | YES         | 0                            | true        |

| certifications          | created\_at    | timestamp with time zone | YES         | now()                        | true        |

| history                 | id            | uuid                     | NO          | gen\_random\_uuid()            | true        |

| history                 | year          | text                     | NO          | null                         | true        |

| history                 | events        | jsonb                    | NO          | null                         | true        |

| history                 | order\_index   | integer                  | YES         | null                         | true        |

| history                 | created\_at    | timestamp with time zone | YES         | now()                        | true        |

| inquiries               | id            | bigint                   | NO          | null                         | true        |

| inquiries               | created\_at    | timestamp with time zone | NO          | now()                        | true        |

| inquiries               | name          | character varying        | NO          | null                         | true        |

| inquiries               | email         | character varying        | NO          | null                         | true        |

| inquiries               | company       | character varying        | NO          | null                         | true        |

| inquiries               | phone         | character varying        | NO          | null                         | true        |

| inquiries               | subject       | character varying        | NO          | null                         | true        |

| inquiries               | message       | text                     | NO          | null                         | true        |

| inquiries               | is\_read       | boolean                  | YES         | false                        | true        |

| intellectual\_properties | id            | uuid                     | NO          | uuid\_generate\_v4()           | true        |

| intellectual\_properties | title         | text                     | NO          | null                         | true        |

| intellectual\_properties | image\_url     | text                     | NO          | null                         | true        |

| intellectual\_properties | storage\_path  | text                     | NO          | null                         | true        |

| intellectual\_properties | display\_order | integer                  | YES         | 0                            | true        |

| intellectual\_properties | created\_at    | timestamp with time zone | YES         | now()                        | true        |

| notices                 | id            | uuid                     | NO          | gen\_random\_uuid()            | true        |

| notices                 | title         | text                     | NO          | null                         | true        |

| notices                 | content       | text                     | YES         | null                         | true        |

| notices                 | author        | text                     | YES         | '관리자'::text                  | true        |

| notices                 | created\_at    | timestamp with time zone | NO          | timezone('utc'::text, now()) | true        |

| notices                 | notice\_no     | bigint                   | NO          | null                         | true        |

