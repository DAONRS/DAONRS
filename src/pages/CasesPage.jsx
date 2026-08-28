import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Banner from '../components/Banner/Banner';
import SubNav from '../components/SubNav/SubNav';
import CaseExampleSection1 from '../sections/subsections/CaseExampleSection1';
import CaseExampleSection2 from '../sections/subsections/CaseExampleSection2';
import bannerImages from '../content/bannerImages.js';

const CasesPage = () => {
  const { title, subtitle, image } = bannerImages['/cases'];

  return (
    <>
      <Banner title={title} subtitle={subtitle} image={image} />
      <SubNav />
      <Routes>
        <Route path="/" element={<Navigate to="example1" />} />
        <Route path="example1" element={<CaseExampleSection1 />} />
        <Route path="example2" element={<CaseExampleSection2 />} />
      </Routes>
    </>
  );
};

export default CasesPage;
