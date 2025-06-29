import React from 'react';
import { Link } from 'react-router-dom';
import logoLight from './logo_lightmode.svg';
import logoDark from './logo_darkmode.svg';

const TranscribeLayout = ({ children }) => (
  <>
    <header className="site-header">
      <Link to="/" className="logo-link">
        <picture>
          <source srcSet={logoDark} media="(prefers-color-scheme: dark)" />
          <img src={logoLight} className="App-logo" alt="logo" />
        </picture>
      </Link>
      {/* No nav for transcribe */}
    </header>
    <main className="fade-in">
      {children}
    </main>
  </>
);

export default TranscribeLayout;