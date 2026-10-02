/* ==========================================================
   Storage: small wrapper around localStorage.
   All keys start with "studyflo:". Never throws, so the app
   still works if storage is blocked (private mode, etc).
   Later, swap these functions to talk to a server after login.
   ========================================================== */

const Store = {
  prefix: "studyflo:",

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  },

  // Remove everything StudyFlo saved on this device
  clearAll() {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(this.prefix))
        .forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  },
};
