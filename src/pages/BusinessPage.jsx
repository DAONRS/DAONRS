import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Banner from '../components/Banner/Banner';
import SubNav from '../components/SubNav/SubNav';
import ScopeSection from '../sections/subsections/ScopeSection';
import RndSection from '../sections/subsections/RndSection';
import IntellectualPropertySection from '../sections/subsections/IntellectualPropertySection';
import Certification from '../sections/subsections/Certificationsection';
import bannerImages from '../content/bannerImages.js';

const BusinessPage = () => {
  const { title, subtitle, image } = bannerImages['/business'];

  return (
    <>
      <Banner title={title} subtitle={subtitle} image={image} />
      <SubNav />
      <Routes>
        <Route path="/" element={<Navigate to="scope" />} />
        {/* <Route path="scope" element={<ScopeSection />} />
        <Route path="rnd" element={<RndSection />} /> */}
        <Route path="ip" element={<IntellectualPropertySection />} />
        <Route path="Certification" element={<Certification />} />
      </Routes>
    </>
  );
};

export default BusinessPage;
