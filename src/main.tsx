import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './lib/auth';
import './styles.css';

const App = lazy(() => import('./App'));

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element #root was not found.');
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <NotificationProvider>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-uba-gold border-t-transparent" /></div>}>
              <Routes>
                <Route path="/*" element={<App />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </NotificationProvider>
    </ErrorBoundary>
  </StrictMode>,
);
