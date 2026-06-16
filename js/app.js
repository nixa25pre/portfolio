// =============================================================
// Nixan Portfolio — public site behaviour
// =============================================================
(function () {
  "use strict";

  // ---------- Fallback content (used when backend not configured) ----------
  const DEFAULT_SKILLS = [
    { ID: "1", Skill: "C++",   Category: "Programming",      Percentage: "90" },
    { ID: "2", Skill: "C",     Category: "Programming",      Percentage: "85" },
    { ID: "3", Skill: "Pro*C", Category: "Programming",      Percentage: "80" },
    { ID: "4", Skill: "Oracle",Category: "Database",         Percentage: "85" },
    { ID: "5", Skill: "SQL",   Category: "Database",         Percentage: "85" },
    { ID: "6", Skill: "Linux", Category: "Operating System", Percentage: "80" },
    { ID: "7", Skill: "Git",   Category: "Version Control",  Percentage: "85" },
  ];
  const DEFAULT_EXP = [
    { ID: "1", Company: "Your Company", Role: "Senior C++ Developer",
      "Start Date": "2022", "End Date": "Present",
      Description: "Telecom platform engineering — high-throughput backend services in C/C++ on Linux.",
      Technology: "C++, Pro*C, Oracle, Linux" },
  ];
  const DEFAULT_EDU = [
    { ID: "1", Degree: "B.E. Computer Science", College: "Your College", Year: "2018 - 2022", CGPA: "8.5" },
  ];
  const DEFAULT_PROJECTS = [
    { ID: "1", "Project Name": "Telecom Billing Engine",
      Description: "High-volume billing pipeline processing millions of CDRs per day.",
      Technology: "C++, Oracle, Linux", "GitHub URL": "", "Demo URL": "", "Image URL": "" },
    { ID: "2", "Project Name": "Real-time Charging Module",
      Description: "Low-latency rating module integrated with OCS.",
      Technology: "C, Pro*C, Oracle", "GitHub URL": "", "Demo URL": "", "Image URL": "" },
  ];

  // ---------- Theme toggle ----------
  const themeBtn = document.getElementById("themeToggle");
  function syncThemeIcon() {
    const dark = document.documentElement.classList.contains("dark");
    themeBtn.querySelector("i").className = dark ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }
  syncThemeIcon();
  themeBtn.addEventListener("click", () => {
    const dark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("nixan-theme", dark ? "dark" : "light");
    syncThemeIcon();
  });

  // ---------- Mobile menu ----------
  document.getElementById("menuToggle").addEventListener("click", () => {
    document.getElementById("navLinks").classList.toggle("is-open");
  });
  document.querySelectorAll("#navLinks a").forEach((a) =>
    a.addEventListener("click", () => document.getElementById("navLinks").classList.remove("is-open"))
  );

  // ---------- Year ----------
  document.getElementById("year").textContent = new Date().getFullYear();

  // ---------- Reveal on scroll ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  function observeReveal(el) { el.classList.add("reveal"); io.observe(el); }

  // ---------- Stat counters ----------
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseInt(el.getAttribute("data-count"), 10) || 0;
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        o.disconnect();
        let cur = 0;
        const step = Math.max(1, Math.ceil(target / 30));
        const t = setInterval(() => {
          cur += step;
          if (cur >= target) { cur = target; clearInterval(t); }
          el.textContent = cur + (el.textContent.includes("+") ? "+" : "");
        }, 40);
      });
    }, { threshold: 0.5 });
    obs.observe(el);
  });

  // ---------- Load section data ----------
  async function loadOr(fallback, fetcher) {
    if (!window.api.isConfigured()) return fallback;
    try {
      const r = await fetcher();
      return (r && r.ok && r.data && r.data.length) ? r.data : fallback;
    } catch { return fallback; }
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function chips(str) {
    if (!str) return "";
    return '<div class="chip-list">' +
      str.split(",").map((t) => `<span class="chip">${escapeHtml(t.trim())}</span>`).join("") +
      "</div>";
  }

  // SKILLS
  loadOr(DEFAULT_SKILLS, () => window.api.list("skills")).then((skills) => {
    const grid = document.getElementById("skillsGrid");
    const cats = [...new Set(skills.map((s) => s.Category))];
    grid.innerHTML = cats.map((cat) => {
      const items = skills.filter((s) => s.Category === cat).map((s) => `
        <div class="skill" data-pct="${escapeHtml(s.Percentage)}">
          <div class="skill__head">
            <span class="skill__name">${escapeHtml(s.Skill)}</span>
            <span class="skill__pct">${escapeHtml(s.Percentage)}%</span>
          </div>
          <div class="skill__bar"><div class="skill__fill"></div></div>
        </div>`).join("");
      return `<div class="skills__cat">
        <h3 class="skills__cat-title"><i class="fa-solid fa-code"></i> ${escapeHtml(cat)}</h3>
        ${items}
      </div>`;
    }).join("");

    // Animate progress bars when visible
    grid.querySelectorAll(".skill").forEach((el) => {
      const fill = el.querySelector(".skill__fill");
      const pct = el.getAttribute("data-pct");
      const obs = new IntersectionObserver((entries, o) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { fill.style.width = pct + "%"; o.disconnect(); }
        });
      }, { threshold: 0.4 });
      obs.observe(el);
    });
  });

  // EXPERIENCE
  loadOr(DEFAULT_EXP, () => window.api.list("experience")).then((rows) => {
    document.getElementById("timeline").innerHTML = rows.map((e, i) => `
      <div class="timeline__item ${i % 2 ? "timeline__item--right" : ""}">
        <span class="timeline__dot"></span>
        <div class="timeline__card">
          <div class="timeline__date">${escapeHtml(e["Start Date"])} — ${escapeHtml(e["End Date"])}</div>
          <h3 class="timeline__role">${escapeHtml(e.Role)}</h3>
          <p class="timeline__company">${escapeHtml(e.Company)}</p>
          <p class="timeline__desc">${escapeHtml(e.Description)}</p>
          ${chips(e.Technology)}
        </div>
      </div>`).join("");
    document.querySelectorAll(".timeline__card").forEach(observeReveal);
  });

  // EDUCATION
  loadOr(DEFAULT_EDU, () => window.api.list("education")).then((rows) => {
    document.getElementById("eduGrid").innerHTML = rows.map((e) => `
      <div class="edu__card">
        <div class="edu__flip">
          <div class="edu__face edu__face--front">
            <div>
              <i class="fa-solid fa-graduation-cap"></i>
              <h3>${escapeHtml(e.Degree)}</h3>
              <p>${escapeHtml(e.College)}</p>
            </div>
            <p class="muted" style="font-size:.75rem">${escapeHtml(e.Year)}</p>
          </div>
          <div class="edu__face edu__face--back">
            <p>CGPA / Percentage</p>
            <p class="edu__cgpa">${escapeHtml(e.CGPA)}</p>
          </div>
        </div>
      </div>`).join("");
  });

  // PROJECTS
  loadOr(DEFAULT_PROJECTS, () => window.api.list("projects")).then((rows) => {
    document.getElementById("projectsGrid").innerHTML = rows.map((p) => {
      const img = p["Image URL"]
        ? `<img src="${escapeHtml(p["Image URL"])}" alt="${escapeHtml(p["Project Name"])}" loading="lazy" />`
        : '<i class="fa-solid fa-code"></i>';
      const gh   = p["GitHub URL"] && p["GitHub URL"] !== "#" ? `<a href="${escapeHtml(p["GitHub URL"])}" target="_blank" rel="noreferrer"><i class="fa-brands fa-github"></i> Code</a>` : "";
      const demo = p["Demo URL"]   && p["Demo URL"]   !== "#" ? `<a href="${escapeHtml(p["Demo URL"])}"   target="_blank" rel="noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Demo</a>` : "";
      return `<article class="proj">
        <div class="proj__img">${img}</div>
        <div class="proj__body">
          <h3 class="proj__title">${escapeHtml(p["Project Name"])}</h3>
          <p class="proj__desc">${escapeHtml(p.Description)}</p>
          ${chips(p.Technology)}
          <div class="proj__links">${gh}${demo}</div>
        </div>
      </article>`;
    }).join("");
    document.querySelectorAll(".proj").forEach(observeReveal);
  });

  // ---------- Resume ----------
  async function downloadResume() {
    const r = await window.api.resume();
    if (r && r.ok && r.data && r.data.url) window.open(r.data.url, "_blank");
    else alert(r && r.error ? r.error : "Resume not configured yet.");
  }
  document.getElementById("downloadResumeBtn").addEventListener("click", downloadResume);
  document.getElementById("downloadResumeBtn2").addEventListener("click", downloadResume);

  // ---------- Contact form ----------
  const form = document.getElementById("contactForm");
  const errEl = document.getElementById("contactErr");
  const okEl  = document.getElementById("contactOk");
  const submitBtn = document.getElementById("contactSubmit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl.textContent = ""; okEl.textContent = "";
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.Name.trim() || !data.Message.trim()) { errEl.textContent = "Name and Message are required."; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.Email)) { errEl.textContent = "Please enter a valid email."; return; }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    const r = await window.api.create("contact", { ...data, Date: new Date().toISOString() });
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Message";
    if (r && r.ok) { okEl.textContent = "Thanks — your message was sent!"; form.reset(); }
    else { errEl.textContent = (r && r.error) || "Failed to send."; }
  });
})();
