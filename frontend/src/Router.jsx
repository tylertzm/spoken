import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout'; // Import the new Layout component
import Landing from './pages/Landing/Landing';
import App from './App';
import Contact from './pages/Contact/Contact'; // Assuming you have a Contact component
import TranscribeLayout from './TranscribeLayout';

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/contact" element={<Contact />} />
          {/* ...other routes... */}
        </Route>
        <Route
          path="/transcribe"
          element={
            <TranscribeLayout>
              <App />
            </TranscribeLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default AppRouter;
