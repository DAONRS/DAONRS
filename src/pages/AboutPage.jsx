import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Banner from '../components/Banner/Banner';
import SubNav from '../components/SubNav/SubNav';
import VisionSection from '../sections/subsections/VisionSection';
import HistorySection from '../sections/subsections/HistorySection';
import DirectionsSection from '../sections/subsections/DirectionsSection';
import bannerImages from '../content/bannerImages.js';
import IntellectualPropertySection from '../sections/subsections/IntellectualPropertySection';
import Certification from '../sections/subsections/Certificationsection';

const AboutPage = () => {
  const { title, subtitle, image } = bannerImages['/about'];

  return (
    <>
      <Banner title={title} subtitle={subtitle} image={image} />
      <SubNav />
      <Routes>
        <Route path="/" element={<Navigate to="vision" />} />
        <Route path="vision" element={<VisionSection />} />
        <Route path="history" element={<HistorySection />} />
        <Route path="directions" element={<DirectionsSection />} />
        <Route path="ip" element={<IntellectualPropertySection />} />
        <Route path="Certification" element={<Certification />} />
      </Routes>
    </>
  );
};

export default AboutPage;
