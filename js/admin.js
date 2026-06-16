// =============================================================
// Nixan Portfolio — Admin panel
// =============================================================
(function () {
  "use strict";

  const SHEETS = [
    { key: "skills",     label: "Skills",     fields: ["Skill", "Category", "Percentage"] },
    { key: "experience", label: "Experience", fields: ["Company", "Role", "Start Date", "End Date", "Description", "Technology"] },
    { key: "education",  label: "Education",  fields: ["Degree", "College", "Year", "CGPA"] },
    { key: "projects",   label: "Projects",   fields: ["Project Name", "Description", "Technology", "GitHub URL", "Demo URL", "Image URL"] },
  ];

  const loginView     = document.getElementById("loginView");
  const dashboardView = document.getElementById("dashboardView");
  const backendWarn   = document.getElementById("backendWarn");
  const loginForm     = document.getElementById("loginForm");
  const loginErr      = document.getElementById("loginErr");
  const loginSubmit   = document.getElementById("loginSubmit");
  const tabs          = document.getElementById("tabs");
  const tabPanel      = document.getElementById("tabPanel");
  const modal         = document.getElementById("modal");
  const modalTitle    = document.getElementById("modalTitle");
  const modalBody     = document.getElementById("modalBody");

  // ----- helpers -----
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function openModal(title, html) {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modal.classList.remove("hidden");
  }
  function closeModal() { modal.classList.add("hidden"); modalBody.innerHTML = ""; }
  modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // ----- init -----
  if (!window.api.isConfigured()) backendWarn.classList.remove("hidden");
  if (window.auth.isLoggedIn()) showDashboard(); else showLogin();

  function showLogin() { loginView.classList.remove("hidden"); dashboardView.classList.add("hidden"); }
  function showDashboard() { loginView.classList.add("hidden"); dashboardView.classList.remove("hidden"); renderTabs(); selectTab("skills"); }

  // ----- login -----
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginErr.textContent = "";
    loginSubmit.disabled = true; loginSubmit.textContent = "Signing in…";
    const data = Object.fromEntries(new FormData(loginForm).entries());
    const r = await window.api.login(data.username, data.password);
    loginSubmit.disabled = false; loginSubmit.textContent = "Sign in";
    if (r && r.ok && r.data && r.data.token) { window.auth.set(r.data.token); showDashboard(); }
    else { loginErr.textContent = (r && r.error) || "Invalid credentials"; }
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    window.auth.clear(); showLogin();
  });

  // ----- tabs -----
  let currentTab = "skills";
  function renderTabs() {
    const items = SHEETS.map((s) => `<button class="tab" data-key="${s.key}">${s.label}</button>`).join("");
    tabs.innerHTML = items + `<button class="tab" data-key="contact">Messages</button>`;
    tabs.querySelectorAll(".tab").forEach((b) =>
      b.addEventListener("click", () => selectTab(b.getAttribute("data-key")))
    );
  }
  function selectTab(key) {
    currentTab = key;
    tabs.querySelectorAll(".tab").forEach((b) => b.classList.toggle("is-active", b.getAttribute("data-key") === key));
    if (key === "contact") renderMessages();
    else renderCrud(SHEETS.find((s) => s.key === key));
  }

  // ----- CRUD panel -----
  async function renderCrud(meta) {
    tabPanel.innerHTML = `
      <div class="crud">
        <div class="crud__head">
          <h2>${escapeHtml(meta.label)}</h2>
          <button class="btn btn-primary" id="addNewBtn" style="height:36px;padding:0 1rem;font-size:.875rem">+ Add new</button>
        </div>
        <div id="crudBody" class="crud__empty">Loading…</div>
      </div>`;
    document.getElementById("addNewBtn").addEventListener("click", () =>
      openEditor(meta, Object.fromEntries(meta.fields.map((f) => [f, ""])))
    );

    const r = await window.api.list(meta.key);
    const body = document.getElementById("crudBody");
    if (!r || !r.ok) { body.innerHTML = `<div class="crud__empty" style="color:var(--destructive)">${escapeHtml((r && r.error) || "Failed to load")}</div>`; return; }
    const rows = r.data || [];
    if (!rows.length) { body.innerHTML = `<div class="crud__empty">No records yet.</div>`; return; }

    body.outerHTML = `
      <div class="scroll-x">
        <table class="crud__table">
          <thead><tr>${meta.fields.map((f) => `<th>${escapeHtml(f)}</th>`).join("")}<th></th></tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                ${meta.fields.map((f) => `<td>${escapeHtml(row[f])}</td>`).join("")}
                <td class="crud__actions">
                  <button class="link" data-edit='${encodeURIComponent(JSON.stringify(row))}'>Edit</button>
                  <button class="link-danger" data-del="${escapeHtml(row.ID)}">Delete</button>
                </td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;

    tabPanel.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => openEditor(meta, JSON.parse(decodeURIComponent(b.getAttribute("data-edit")))))
    );
    tabPanel.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => deleteRow(meta, b.getAttribute("data-del")))
    );
  }

  function openEditor(meta, row) {
    const isMultiline = (f) => f === "Description" || f === "Message";
    const fieldsHtml = meta.fields.map((f) => {
      const v = escapeHtml(row[f] || "");
      return `<label>
        <span class="form-label">${escapeHtml(f)}</span>
        ${isMultiline(f)
          ? `<textarea name="${escapeHtml(f)}" rows="3">${v}</textarea>`
          : `<input name="${escapeHtml(f)}" value="${v}" />`}
      </label>`;
    }).join("");

    openModal(row.ID ? "Edit record" : "Add record", `
      <form id="editForm">
        ${fieldsHtml}
        <div class="modal__foot">
          <button type="button" class="btn-ghost" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>`);

    modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));

    document.getElementById("editForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      const r = row.ID
        ? await window.api.update(meta.key, row.ID, data)
        : await window.api.create(meta.key, data);
      if (r && r.ok) { closeModal(); renderCrud(meta); }
      else alert((r && r.error) || "Save failed");
    });
  }

  async function deleteRow(meta, id) {
    if (!confirm("Delete this record?")) return;
    const r = await window.api.remove(meta.key, id);
    if (r && r.ok) renderCrud(meta);
    else alert((r && r.error) || "Delete failed");
  }

  // ----- messages -----
  async function renderMessages() {
    tabPanel.innerHTML = `<div class="crud" style="padding:1.25rem"><h2 style="margin-bottom:1rem">Messages</h2><div id="msgList" class="crud__empty">Loading…</div></div>`;
    const r = await window.api.list("contact");
    const list = document.getElementById("msgList");
    if (!r || !r.ok) { list.outerHTML = `<div class="crud__empty" style="color:var(--destructive)">${escapeHtml((r && r.error) || "Failed to load")}</div>`; return; }
    const rows = (r.data || []).slice().reverse();
    if (!rows.length) { list.outerHTML = `<div class="crud__empty">No messages yet.</div>`; return; }
    list.outerHTML = `<div class="msgs">${rows.map((m) => `
      <div class="msg">
        <div class="msg__head">
          <div>
            <p class="msg__from">${escapeHtml(m.Name)} <span>&lt;${escapeHtml(m.Email)}&gt;</span></p>
            ${m.Subject ? `<p class="msg__subj">${escapeHtml(m.Subject)}</p>` : ""}
          </div>
          <span class="msg__date">${escapeHtml(m.Date)}</span>
        </div>
        <p class="msg__body">${escapeHtml(m.Message)}</p>
      </div>`).join("")}</div>`;
  }
})();
