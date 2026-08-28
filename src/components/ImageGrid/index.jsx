import React from 'react';
import './ImageGrid.css';

// Re-using the same image utility function
const getImageUrl = (name) => {
  return new URL(`../../assets/images/${name}`, import.meta.url).href;
};

const ImageGrid = ({ gridData }) => {
  return (
    <div className="field-grid">
      {gridData && gridData.map((item, index) => (
        <a key={index} href={item.link}>
          <img 
            src={getImageUrl(item.image)} 
            alt={`field-${index + 1}`} 
            className="grid-img"
          />
        </a>
      ))}
    </div>
  );
};

export default ImageGrid;

