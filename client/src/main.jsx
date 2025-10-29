/**
 * @fileoverview Application entry point - initializes React root and renders App component
 * @module main
 */

import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/vscode-dark-modern-prism.css';
import './styles/reduced-motion.css';
import { App } from './App.jsx';
import { AppErrorBoundary } from './components/AppErrorBoundary.jsx';
import { LiveAnnouncer } from './components/LiveAnnouncer.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <LiveAnnouncer>
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>
      </LiveAnnouncer>
    </AppErrorBoundary>
  </StrictMode>,
);
