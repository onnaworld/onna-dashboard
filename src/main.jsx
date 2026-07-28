import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'
import { flushAllSaves, waitForPendingSaves } from './utils/helpers'

registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    // Workbox only checks for a new deploy on page load by default, so a
    // tab left open for a long session (exactly the case that kept biting
    // us) would never notice new deploys until manually reloaded. Poll
    // explicitly so onNeedRefresh actually fires while the tab is open.
    if (!registration) return;
    setInterval(() => { registration.update(); }, 60 * 1000);
  },
  onNeedRefresh() {
    // A new deploy is available. Reloading immediately would abort any
    // debounced save still in flight and lose unsaved edits, so we wait
    // until the user isn't actively typing and any pending save has
    // actually reached the server before reloading.
    const isEditing = () => {
      const el = document.activeElement;
      return !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT');
    };
    const tryReload = () => {
      if (isEditing()) { setTimeout(tryReload, 1500); return; }
      flushAllSaves();
      waitForPendingSaves(8000).then(() => window.location.reload());
    };
    tryReload();
  },
})

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
