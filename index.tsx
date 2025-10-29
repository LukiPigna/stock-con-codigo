import React from 'react';
// Fix: The `ReactDOM.render` API is deprecated in React 18.
// The new `createRoot` API is imported from `react-dom/client`.
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
