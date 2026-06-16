// ============================================================
// Nixan Portfolio — API client
// Configure your deployed Google Apps Script Web App URL below.
// ============================================================
window.APPS_SCRIPT_URL = ""; // <-- paste your Apps Script /exec URL here

window.api = (function () {
  const URL_ = () => window.APPS_SCRIPT_URL;

  async function call(params, body) {
    if (!URL_()) {
      return { ok: false, error: "Backend not configured. Set APPS_SCRIPT_URL in js/api.js." };
    }
    const url = new URL(URL_());
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    try {
      const res = await fetch(url.toString(), {
        method: body ? "POST" : "GET",
        // text/plain avoids the CORS preflight that Apps Script can't handle
        headers: body ? { "Content-Type": "text/plain;charset=utf-8" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        redirect: "follow",
      });
      const text = await res.text();
      try { return JSON.parse(text); }
      catch { return { ok: false, error: "Invalid response from backend" }; }
    } catch (e) {
      return { ok: false, error: e.message || "Network error" };
    }
  }

  return {
    isConfigured: () => !!URL_(),
    list:   (sheet)             => call({ action: "list", sheet }),
    create: (sheet, row)        => call({ action: "create", sheet }, row),
    update: (sheet, id, row)    => call({ action: "update", sheet, id }, row),
    remove: (sheet, id)         => call({ action: "delete", sheet, id }),
    login:  (username, password)=> call({ action: "login" }, { username, password }),
    resume: ()                  => call({ action: "resume" }),
  };
})();

window.auth = {
  KEY: "nixan-admin-token",
  get()        { return localStorage.getItem(this.KEY); },
  set(token)   { localStorage.setItem(this.KEY, token); },
  clear()      { localStorage.removeItem(this.KEY); },
  isLoggedIn() { return !!localStorage.getItem(this.KEY); },
};
