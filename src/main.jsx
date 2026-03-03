import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Unregister any old PWA service workers so deploys are always fresh
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister())
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
<React.StrictMode>
<App />
</React.StrictMode>
)