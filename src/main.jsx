import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// One-time cleanup: forcibly remove any service worker + caches left behind
// by the old vite-plugin-pwa setup (removed — it was the root cause of
// deployed fixes being invisible in already-open tabs). Without this, a
// browser that already installed the old SW would keep running it forever,
// since nothing in the new code path ever tells it to go away.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
}
if ('caches' in window) {
  caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
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
