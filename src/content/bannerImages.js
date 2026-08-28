import banner1 from '../assets/images/banner/banner1.jpg';
import banner2 from '../assets/images/banner/banner2.jpg';
import banner3 from '../assets/images/banner/banner3.jpg';
import banner4 from '../assets/images/banner/banner4.jpg';
import banner5 from '../assets/images/banner/banner5.jpg';

const bannerImages = {
  '/': [
    {
      title: 'DAONRS',
      subtitle: '기술로 미래를 선도하는 기업',
      image: banner1,
      buttonText: 'DAONRS 소개 바로가기' 
    },
    {
      title: 'DAONRS의 혁신적인 기술',
      subtitle: '새로운 시대를 열어가는 힘',
      image: banner2,
      buttonText: '사업분야 확인하기'
    },
    {
      title: '고객과 함께하는 DAONRS',
      subtitle: '최고의 솔루션으로 보답하겠습니다',
      image: banner3,
      buttonText: '제품 정보 보기'
    }
  ],
  '/about': {
    title: '회사소개',
    subtitle: '혁신적인 기술로 미래를 선도하는 기업, DAONRS입니다.',
    image: banner1
  },
  '/business': {
    title: '인증현황',
    subtitle: '기술의 깊이로 증명하는 DAONRS의 독보적인 전문 사업 영역입니다.',
    image: banner2
  },
  '/products': {
    title: '제품소개',
    subtitle: 'DAONRS의 기술력으로 만든 최고의 제품들을 만나보세요',
    image: banner3
  },
  '/cases': {
    title: '적용사례',
    subtitle: 'DAONRS가 함께한 성공의 기록들입니다.',
    image: banner4
  },
  '/support': {
    title: '고객지원',
    subtitle: '고객의 성공을 가장 가까이에서 돕겠습니다.',
    image: banner5
  },
};

export default bannerImages;
