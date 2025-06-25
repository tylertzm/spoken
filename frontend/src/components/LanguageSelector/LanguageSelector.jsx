import React, { useState } from 'react';

function LanguageSelector({ onLanguageChange }) {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleChange = (event) => {
    const newLanguage = event.target.value;
    setSelectedLanguage(newLanguage);
    onLanguageChange(newLanguage);
  };

  return (
    <div className="language-selector">
      <select className='language-dropdown' value={selectedLanguage} onChange={handleChange}>
        <option value="en">English</option>
        <option value="yue">Cantonese</option>
        <option value="de">German</option>
      </select>
      <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>
        More Languages Coming Soon!
      </span>
    </div>
  );
}

export default LanguageSelector; 