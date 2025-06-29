import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import logoLight from './logo_lightmode.svg';
import logoDark from './logo_darkmode.svg';

const Layout = () => {
  const [transitioning, setTransitioning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleNavigation = (event) => {
      event.preventDefault();
      const targetPath = event.currentTarget.getAttribute('href');
      if (targetPath && targetPath !== location.pathname) {
        setTransitioning(true);
        setTimeout(() => {
          navigate(targetPath);
          setTransitioning(false);
        }, 300); // Match the duration of the fade-out CSS animation
      }
    };

    const links = document.querySelectorAll('a');
    links.forEach((link) => link.addEventListener('click', handleNavigation));

    return () => {
      links.forEach((link) => link.removeEventListener('click', handleNavigation));
    };
  }, [navigate, location.pathname]);

  return (
    <>
      <header className="site-header">
        <Link to="/" className="logo-link">
          <picture>
            <source srcSet={logoDark} media="(prefers-color-scheme: dark)" />
            <img src={logoLight} className="App-logo" alt="logo" />
          </picture>
        </Link>
        {location.pathname !== '/transcribe' && (
          <nav className="site-nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Home
            </Link>
            <Link to="/transcribe" className={location.pathname === '/transcribe' ? 'active' : ''}>
              Transcribe
            </Link>
            <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>
              Partner with Us
            </Link>
          </nav>
        )}
      </header>
      <main className={transitioning ? 'fade-out' : 'fade-in'}>
        <Outlet />
      </main>
    </>
  );
};

export default Layout;
