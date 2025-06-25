import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './Router'; // Import the new router
import './styles.css'; // Import global styles

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AppRouter />
);

