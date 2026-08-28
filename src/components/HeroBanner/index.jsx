import React from 'react';
import './HeroBanner.css';

// It's a good practice to handle image paths robustly.
// For Vite, using new URL(..., import.meta.url) is standard.
const getImageUrl = (name) => {
  // Assuming images are in src/assets/images/
  return new URL(`../../assets/images/${name}`, import.meta.url).href;
};

const HeroBanner = ({ subTitle, mainTitle1, mainTitle2, image }) => {
  return (
    <div className="main-banner">
      <div className="banner-image-container">
        {image && (
          <img 
            src={getImageUrl(image)} 
            alt="메인 배너 이미지" 
            className="full-width-img" 
          />
        )}
      </div>
      <div className='banner-text'>
        <p className="sub-title">{subTitle}</p>
        <h2 className="main-title">{mainTitle1}</h2>
        <h2 className="main-title">{mainTitle2}</h2>
      </div>
    </div>
  );
};

export default HeroBanner;
