export const menuItems = [

  { 
    name: '회사소개', 
    path: '/about', 
    subMenus: [
      { name: '기업개요', path: 'vision' },
      { name: '회사연혁', path: 'history' },
      // { name: '지식재산권', path: 'ip' },
      { name: '인증', path: 'Certification ' },
      { name: '오시는길', path: 'directions' },
    ] 
  },
  // { 
  //   name: '인증현황', 
  //   path: '/business',
  //   subMenus: [
  //     // { name: '사업영역', path: 'scope' },
  //     // { name: '연구개발', path: 'rnd' },
  //     { name: '지식재산권', path: 'ip' },
  //     { name: '인증 ', path: 'Certification ' },

  //   ]
  // },
  { 
    name: '제품', 
    path: '/products',
    subMenus: [
      { name: '촉매형 탄산가스발생기(탄사니)', path: 'product1' },
      { name: '환경데이터측정기(다오니)', path: 'product2' },
    ]
  },
  { name: '적용사례', 
    path: '/cases' ,
    subMenus: [
      { name: '촉매형 탄산가스발생기(탄사니)', path: 'example1' },
      { name: '환경데이터측정기(다오니)', path: 'example2' }]
  },
  { 
    name: '고객센터', 
    path: '/support',
    subMenus: [
      { name: '공지사항', path: 'notice' },
      { name: '자료실', path: 'dataroom' },
      { name: '문의하기', path: 'inquiry' },
    ]
  },
];
