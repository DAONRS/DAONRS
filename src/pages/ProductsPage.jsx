import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Banner from '../components/Banner/Banner';
import SubNav from '../components/SubNav/SubNav';
import Product1Section from '../sections/subsections/Product1Section';
import Product2Section from '../sections/subsections/Product2Section';
import bannerImages from '../content/bannerImages.js';

const ProductsPage = () => {
  const { title, subtitle, image } = bannerImages['/products'];

  return (
    <>
      <Banner title={title} subtitle={subtitle} image={image} />
      <SubNav />
      <Routes>
        <Route path="/" element={<Navigate to="product1" />} />
        <Route path="product1" element={<Product1Section />} />
        <Route path="product2" element={<Product2Section />} />
      </Routes>
    </>
  );
};

export default ProductsPage;
