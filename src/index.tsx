import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; 
import { HelmetProvider } from 'react-helmet-async' 

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider> {/* ✅ ครอบ App ไว้ตรงนี้ */}
    <App />
    </HelmetProvider>
  </React.StrictMode>
);