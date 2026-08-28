import React, { forwardRef } from 'react';
import rndImage from '../../assets/images/153967a69df72734c0b5d9845f6637ec_1588584439_0108.png';
import './RndSection.css';

const RndSection = forwardRef((props, ref) => {
  return (
    <section id="rnd" ref={ref} className="section">
      <div className="sub-section">
        <header className="subsection-header">
          <h2 className="subsection-title">연구개발</h2>
        </header>
        <hr className="section-top-line" />
        <img src={rndImage} alt="연구개발" className="rnd-image" />
      </div>
    </section>
  );
});

export default RndSection;