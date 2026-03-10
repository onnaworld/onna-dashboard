// ─── Global modal helpers (showAlert / showPrompt) ──────────────────────────
// These use module-level closures so any component can call them without prop-drilling.

let _modalResolve = null;
let _setModalState = null;

export function registerModalSetter(setter) {
  _setModalState = setter;
}

export function showAlert(msg) {
  return new Promise(resolve => {
    _modalResolve = resolve;
    if (_setModalState) _setModalState({ type: "alert", message: String(msg), show: true });
  });
}

export function showPrompt(msg, defaultVal = "") {
  return new Promise(resolve => {
    _modalResolve = resolve;
    if (_setModalState) _setModalState({ type: "prompt", message: String(msg), defaultVal, show: true });
  });
}

export function closeModal(value) {
  if (_setModalState) _setModalState({ show: false });
  if (_modalResolve) { _modalResolve(value); _modalResolve = null; }
}
