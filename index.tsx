import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Fix for error on line 13: `ReactDOM.render` is deprecated in React 18.
// It has been replaced with the `createRoot` API, which is the current standard.
// The import for ReactDOM was also updated from 'react-dom' to 'react-dom/client'.
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
