import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from './components/ErrorBoundary';

const GOOGLE_CLIENT_ID = '527976513968-5fpble7j1c7liiph17hp5g834qrgpnth.apps.googleusercontent.com';

const root = ReactDOM.createRoot(document.getElementById('root'));
// Debug: log the imported GoogleOAuthProvider type at startup
console.debug('GoogleOAuthProvider type:', typeof GoogleOAuthProvider, GoogleOAuthProvider);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
