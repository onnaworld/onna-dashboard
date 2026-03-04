import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Unregister any old PWA service workers so deploys are always fresh
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister())
  })
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('ONNA crash:', error, info); }
  render() {
    if (this.state.error) {
      return React.createElement('div', { style: { padding: 40, fontFamily: 'system-ui', textAlign: 'center' } },
        React.createElement('h2', null, 'Something went wrong'),
        React.createElement('p', { style: { color: '#666', margin: '12px 0' } }, String(this.state.error?.message || this.state.error)),
        React.createElement('button', {
          onClick: () => { try { localStorage.clear(); } catch {} window.location.reload(); },
          style: { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#1d1d1f', color: '#fff', fontSize: 14, cursor: 'pointer', marginRight: 8 }
        }, 'Clear cache & reload'),
        React.createElement('button', {
          onClick: () => window.location.reload(),
          style: { padding: '10px 24px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', color: '#333', fontSize: 14, cursor: 'pointer' }
        }, 'Reload')
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
<React.StrictMode>
<ErrorBoundary>
<App />
</ErrorBoundary>
</React.StrictMode>
)
