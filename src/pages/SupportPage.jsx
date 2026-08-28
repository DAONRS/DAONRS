import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Banner from '../components/Banner/Banner';
import SubNav from '../components/SubNav/SubNav';
import NoticeSection from '../sections/subsections/NoticeSection';
import DataroomSection from '../sections/subsections/DataroomSection';
import InquirySection from '../sections/subsections/InquirySection'; // InquirySection으로 변경
import bannerImages from '../content/bannerImages.js';
import './SupportPage.css';

const SupportPage = () => {
  const { title, subtitle, image } = bannerImages['/support'];

  return (
    <>
      <Banner title={title} subtitle={subtitle} image={image} />
      <SubNav />
      <Routes>
        <Route path="/" element={<Navigate to="notice" />} />
        <Route path="notice" element={<NoticeSection />} />
        <Route path="dataroom" element={<DataroomSection />} />
        <Route path="inquiry" element={<InquirySection />} /> 
      </Routes>
    </>
  );
};

export default SupportPage;
