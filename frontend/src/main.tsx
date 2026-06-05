import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initTheme } from './stores/theme-store';
import './index.css';

initTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
