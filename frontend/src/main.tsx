import { StrictMode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import { AuthBootstrap } from './components/auth/AuthBootstrap';
import './index.css';
import { queryClient } from './lib/query/queryClient';
import 'highlight.js/styles/github.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Toaster position="bottom-right" richColors />
        <AuthBootstrap>
          <App />
        </AuthBootstrap>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
