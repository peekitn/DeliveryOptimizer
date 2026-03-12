import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // (opcional, pode criar um CSS global mínimo)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)