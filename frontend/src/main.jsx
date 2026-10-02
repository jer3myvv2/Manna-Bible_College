import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { SiteInfoProvider } from './context/SiteInfoContext';
import './styles/theme.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/admin.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      {/* Opt in to React Router v7 behaviour now so upgrading later is painless. */}
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SiteInfoProvider>
          <App />
        </SiteInfoProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
);
