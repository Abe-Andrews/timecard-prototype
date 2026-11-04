// TimeCard redesign – medium-fidelity prototype.
// All data is fictional and lives in memory; refreshing the page resets the demo.

const DAYS = ["Mon 10/26", "Tue 10/27", "Wed 10/28", "Thu 10/29", "Fri 10/30"];
const TODAY = 4; // Friday
const LOCATIONS = ["Remote", "Client Site", "Office"];

const codes = [
  { id: "navy", code: "1001.NAVY.ML.01", nick: "Navy – ML Pipeline", status: "open", fav: true,
    desc: "Model training, data pipeline and MLOps work on the Navy analytics contract.",
    keywords: ["navy", "pipeline", "ml", "model", "standup"] },
  { id: "dhs", code: "2040.DHS.DATA.03", nick: "DHS – Data Dashboard", status: "open", fav: true,
    desc: "Dashboard development and data analysis for the DHS reporting task order.",
    keywords: ["dhs", "dashboard", "homeland"] },
  { id: "train", code: "9000.INT.TRAIN", nick: "Internal Training", status: "open", fav: true,
    desc: "Approved courses, lunch-and-learns and certifications.",
    keywords: ["training", "course", "learn", "lunch"] },
  { id: "prop", code: "9100.INT.BD.22", nick: "Proposal Support", status: "open", fav: false,
    desc: "Writing and reviewing proposals for new business.",
    keywords: ["proposal", "bd", "rfp"] },
  { id: "admin", code: "9900.OH.ADMIN", nick: "Admin / Overhead", status: "open", fav: false,
    desc: "Company meetings, all-hands, IT issues and other non-billable admin time.",
    keywords: ["admin", "all-hands", "overhead"] },
  { id: "pto", code: "0000.LV.PTO", nick: "Paid Time Off", status: "open", fav: false,
    desc: "Vacation or personal time.",
    keywords: ["pto", "vacation", "off"] },
  { id: "navyold", code: "1001.NAVY.ML.00", nick: "Navy – ML Pipeline (FY26 base)", status: "closed", fav: false,
    desc: "Base-year task for the Navy analytics contract.",
    keywords: ["navy"] },
];

let lines = [
  { codeId: "navy", location: "Client Site", hours: [6, 6, 6, 6, 0] },
  { codeId: "dhs", location: "Remote", hours: [2, 2, 1, 2, 0] },
  { codeId: "train", location: "Office", hours: [0, 0, 1, 0, 0] },
];
let submitted = false;

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const codeById = id => codes.find(c => c.id === id);
const fmt = n => (Math.round(n * 100) / 100).toFixed(1);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const dayTotal = d => lines.reduce((s, l) => s + (l.hours[d] || 0), 0);
const weekTotal = () => DAYS.reduce((s, _, d) => s + dayTotal(d), 0);
const lineTotal = l => l.hours.reduce((a, b) => a + b, 0);
const locationOptions = selected => LOCATIONS.map(loc => `<option ${loc === selected ? "selected" : ""}>${loc}</option>`).join("");

/* ================= Navigation ================= */
function show(view) {
  $$(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + view));
  $$(".sidenav a[data-view]").forEach(a => a.classList.toggle("active", a.dataset.view === (view === "codes" ? "codes" : "timesheet")));
  if (view === "timesheet") renderGrid();
  if (view === "codes") renderBrowser($("#codes-browser"), "library");
  $("#status-pill").hidden = !submitted;
  window.scrollTo(0, 0);
}
document.addEventListener("click", e => {
  const nav = e.target.closest("[data-view]");
  if (nav) { e.preventDefault(); show(nav.dataset.view); }
  if (e.target.matches("[data-close]") || e.target.classList.contains("modal-bg")) closeModals();
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModals(); });

function openModal(id) { closeModals(); $("#" + id).classList.add("open"); }
function closeModals() { $$(".modal-bg").forEach(m => m.classList.remove("open")); }

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3500);
}

/* ================= Timesheet grid ================= */
function renderGrid(flashIdx = []) {
  const grid = $("#grid");
  const lock = submitted ? "disabled" : "";
  $("thead", grid).innerHTML = `<tr><th>Charge code</th><th>Location</th>
    ${DAYS.map((d, i) => `<th class="${i === TODAY ? "today" : ""}">${d}${i === TODAY ? "<br><small>today</small>" : ""}</th>`).join("")}
    <th>Total</th><th></th></tr>`;

  $("tbody", grid).innerHTML = lines.map((l, i) => {
    const c = codeById(l.codeId);
    return `<tr data-i="${i}" class="${flashIdx.includes(i) ? "flash" : ""}">
      <td class="code-cell">
        <div class="nick">${c.fav ? "★" : ""} ${esc(c.nick)}</div>
        <div class="desc">${esc(c.desc)}</div>
        <div class="mono">${c.code}</div>
      </td>
      <td><select data-loc ${lock}>${locationOptions(l.location)}</select></td>
      ${l.hours.map((h, d) => `<td class="${d === TODAY ? "today" : ""}">
        <input type="number" min="0" step="0.5" data-d="${d}" value="${h || ""}" placeholder="–" ${lock}></td>`).join("")}
      <td><b>${fmt(lineTotal(l))}</b></td>
      <td><button class="rm" data-rm title="Remove line" ${lock}>&times;</button></td>
    </tr>`;
  }).join("") || `<tr><td colspan="9"><div class="empty">No charge codes yet.</div></td></tr>`;

  $("tfoot", grid).innerHTML = `<tr><td>Daily total</td><td></td>
    ${DAYS.map((_, d) => `<td class="${d === TODAY ? "today" : ""}">${fmt(dayTotal(d))}</td>`).join("")}
    <td>${fmt(weekTotal())}</td><td></td></tr>`;

  $$(".action-row button", $("#view-timesheet")).forEach(b => b.disabled = submitted);
}

$("#grid").addEventListener("change", e => {
  const tr = e.target.closest("tr[data-i]");
  if (!tr) return;
  if (e.target.matches("[data-loc]")) { lines[+tr.dataset.i].location = e.target.value; return; }
  if (!e.target.matches("input[data-d]")) return;
  const v = parseFloat(e.target.value);
  lines[+tr.dataset.i].hours[+e.target.dataset.d] = isNaN(v) || v < 0 ? 0 : v;
  renderGrid();
});
$("#grid").addEventListener("click", e => {
  if (!e.target.matches("[data-rm]")) return;
  lines.splice(+e.target.closest("tr").dataset.i, 1);
  renderGrid();
});

/* ================= Charge code browser (library + picker) ================= */
let pickerCallback = null;

const matches = (c, q) => !q || [c.nick, c.desc, c.code, ...c.keywords].join(" ").toLowerCase().includes(q.toLowerCase());

function renderBrowser(root, mode) {
  const state = root._state || (root._state = { q: "", tab: "fav" });
  root.innerHTML = `
    <input class="search" placeholder="Search by name, description or code…" value="${esc(state.q)}">
    <div class="tabs">
      ${[["fav", "★ Favorites"], ["all", "All codes"]].map(([k, label]) =>
        `<button data-tab="${k}" class="${state.tab === k ? "active" : ""}">${label}</button>`).join("")}
    </div>
    <div class="code-list"></div>`;
  const list = $(".code-list", root);
  const search = $(".search", root);

  function draw() {
    let items = codes.filter(c => matches(c, state.q));
    if (!state.q && state.tab === "fav") items = items.filter(c => c.fav);
    list.innerHTML = items.map(c => `<div class="code-item ${c.status}">
        <button class="star" data-star="${c.id}" title="${c.fav ? "Remove from" : "Add to"} favorites">${c.fav ? "★" : "☆"}</button>
        <div>
          <div class="title"><span data-nick="${c.id}">${esc(c.nick)}</span>
            ${mode === "library" ? `<button class="link" data-rename="${c.id}">edit nickname</button>` : ""}
            <span class="badge ${c.status === "closed" ? "closed" : ""}">${c.status === "closed" ? "Closed" : "Open"}</span>
          </div>
          <div class="desc">${esc(c.desc)}</div>
          <div class="mono">${c.code}</div>
        </div>
        <div>${mode === "pick" && c.status === "open" ? `<button class="btn sm primary" data-pick="${c.id}">Select</button>` : ""}</div>
      </div>`).join("") || `<div class="empty">No codes match "${esc(state.q)}".</div>`;
  }

  search.addEventListener("input", () => { state.q = search.value; draw(); });
  root.onclick = e => {
    const tab = e.target.closest("[data-tab]");
    if (tab) { state.tab = tab.dataset.tab; state.q = ""; renderBrowser(root, mode); return; }
    const star = e.target.closest("[data-star]");
    if (star) { const c = codeById(star.dataset.star); c.fav = !c.fav; draw(); return; }
    const ren = e.target.closest("[data-rename]");
    if (ren) {
      const c = codeById(ren.dataset.rename);
      const span = $(`[data-nick="${c.id}"]`, root);
      span.innerHTML = `<input class="nick-edit" value="${esc(c.nick)}">`;
      const inp = $("input", span);
      inp.focus(); inp.select();
      inp.addEventListener("blur", () => { c.nick = inp.value.trim() || c.nick; draw(); });
      inp.addEventListener("keydown", ev => { if (ev.key === "Enter") inp.blur(); });
      return;
    }
    const pick = e.target.closest("[data-pick]");
    if (pick && pickerCallback) { const cb = pickerCallback; pickerCallback = null; closeModals(); cb(pick.dataset.pick); }
  };
  draw();
}

function openPicker(title, cb) {
  $("#picker-title").textContent = title;
  pickerCallback = cb;
  const root = $("#picker-browser");
  root._state = { q: "", tab: "fav" };
  renderBrowser(root, "pick");
  openModal("picker-modal");
  setTimeout(() => $(".search", root).focus(), 50);
}

$("#open-picker").onclick = () => openPicker("Add a charge code", id => {
  lines.push({ codeId: id, location: LOCATIONS[0], hours: [0, 0, 0, 0, 0] });
  renderGrid([lines.length - 1]);
});

/* Add {codeId, location, hours} entries to today's column */
function addToToday(entries) {
  const touched = new Set();
  entries.forEach(en => {
    let idx = lines.findIndex(l => l.codeId === en.codeId && l.location === en.location);
    if (idx === -1) { lines.push({ codeId: en.codeId, location: en.location, hours: [0, 0, 0, 0, 0] }); idx = lines.length - 1; }
    lines[idx].hours[TODAY] += en.hours;
    touched.add(idx);
  });
  closeModals();
  renderGrid([...touched]);
  toast(`Added ${fmt(entries.reduce((s, e) => s + e.hours, 0))} h to ${DAYS[TODAY]}.`);
}

/* ================= Voice / text entry ================= */
let draft = [];
$("#asst-day").textContent = DAYS[TODAY];

$("#open-assistant").onclick = () => {
  draft = [];
  $("#asst-text").value = "";
  $("#asst-draft").innerHTML = "";
  $("#mic-status").textContent = "Tap Speak to talk, or type instead.";
  openModal("assistant-modal");
};

// Speech is simulated so the demo is reliable for the video walkthrough.
$("#mic-btn").onclick = () => {
  const mic = $("#mic-btn");
  if (mic.classList.contains("listening")) return;
  const phrase = "I worked 4 hours on the Navy pipeline at the client site, 3 hours on the DHS dashboard from home and 1 hour of training at the office";
  mic.classList.add("listening");
  $("#mic-status").textContent = "Listening…";
  let i = 0;
  const iv = setInterval(() => {
    $("#asst-text").value = phrase.slice(0, i += 3);
    if (i >= phrase.length) {
      clearInterval(iv);
      $("#asst-text").value = phrase;
      mic.classList.remove("listening");
      $("#mic-status").textContent = "Done listening.";
    }
  }, 45);
};

function parse(text) {
  const words = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
  return text.split(/,|;|\band\b/i).map(s => s.trim()).filter(Boolean).flatMap(seg => {
    const m = seg.match(/(\d+(?:\.\d+)?|an?|one|two|three|four|five|six|seven|eight)\s*(?:hours?|hrs?|h)\b/i);
    if (!m) return [];
    const lower = seg.toLowerCase();
    const c = codes.find(c => c.status === "open" && c.keywords.some(k => new RegExp("\\b" + k + "\\b").test(lower)));
    const location = /client|on site|onsite/.test(lower) ? "Client Site" : /office/.test(lower) ? "Office" : "Remote";
    return [{ hours: isNaN(parseFloat(m[1])) ? words[m[1].toLowerCase()] : parseFloat(m[1]), codeId: c ? c.id : "", location }];
  });
}

function codeOptions(selected) {
  return `<option value="">– choose –</option>` + codes.filter(c => c.status === "open")
    .map(c => `<option value="${c.id}" ${c.id === selected ? "selected" : ""}>${c.fav ? "★ " : ""}${esc(c.nick)}</option>`).join("");
}

$("#asst-parse").onclick = () => {
  const text = $("#asst-text").value.trim();
  if (!text) return;
  draft = parse(text);
  renderDraft();
};

function renderDraft() {
  const box = $("#asst-draft");
  if (!draft.length) {
    box.innerHTML = `<div class="draft empty">No hours found. Try "8 hours on the Navy pipeline".</div>`;
    return;
  }
  const ready = draft.every(d => d.codeId && d.hours > 0);
  box.innerHTML = `<div class="draft">
    <h3>Review before adding to ${DAYS[TODAY]}</h3>
    <table>
      <thead><tr><th>Charge code</th><th>Description</th><th>Location</th><th>Hours</th><th></th></tr></thead>
      <tbody>${draft.map((d, i) => {
        const c = d.codeId && codeById(d.codeId);
        return `<tr data-di="${i}">
          <td><select data-dcode>${codeOptions(d.codeId)}</select>${c ? `<div class="mono">${c.code}</div>` : ""}</td>
          <td class="small muted">${c ? esc(c.desc) : ""}</td>
          <td><select data-dloc>${locationOptions(d.location)}</select></td>
          <td><input type="number" min="0" step="0.5" value="${d.hours}" data-dh></td>
          <td><button class="link" data-drm>remove</button></td>
        </tr>`;
      }).join("")}</tbody>
    </table>
    <div class="draft-foot">
      <span class="small">Total: <b>${fmt(draft.reduce((s, d) => s + (d.hours || 0), 0))} h</b></span>
      <span class="spacer"></span>
      <button class="btn dark" id="draft-apply" ${ready ? "" : "disabled"}>Confirm &amp; add</button>
    </div>
  </div>`;
}

$("#asst-draft").addEventListener("change", e => {
  const tr = e.target.closest("tr[data-di]");
  if (!tr) return;
  const d = draft[+tr.dataset.di];
  if (e.target.matches("[data-dh]")) d.hours = Math.max(0, parseFloat(e.target.value) || 0);
  if (e.target.matches("[data-dcode]")) d.codeId = e.target.value;
  if (e.target.matches("[data-dloc]")) d.location = e.target.value;
  renderDraft();
});
$("#asst-draft").addEventListener("click", e => {
  if (e.target.id === "draft-apply") { addToToday(draft); return; }
  if (e.target.matches("[data-drm]")) { draft.splice(+e.target.closest("tr").dataset.di, 1); renderDraft(); }
});

/* ================= Calendar suggestions ================= */
const calendar = [
  { start: "9:00", end: "9:30", title: "Navy daily standup", codeId: "navy", location: "Client Site" },
  { start: "9:30", end: "12:00", title: "Pipeline refactor", codeId: "navy", location: "Client Site" },
  { start: "1:00", end: "2:00", title: "Lunch & learn: LLM evaluation", codeId: "train", location: "Office" },
  { start: "2:00", end: "5:00", title: "DHS dashboard review", codeId: "dhs", location: "Remote" },
];
const toMin = t => { let [h, m] = t.split(":").map(Number); if (h < 7) h += 12; return h * 60 + m; };
let calRows = [];

$("#open-calendar").onclick = () => {
  calRows = calendar.map(ev => ({ ...ev, hours: (toMin(ev.end) - toMin(ev.start)) / 60, on: true }));
  $("#cal-day-label").textContent = DAYS[TODAY];
  renderCal();
  openModal("calendar-modal");
};

function renderCal() {
  const sel = calRows.filter(r => r.on && r.codeId);
  const total = sel.reduce((s, r) => s + r.hours, 0);
  $("#cal-list").innerHTML = calRows.map((r, i) => `
    <div class="cal-row" data-ci="${i}">
      <input type="checkbox" data-con ${r.on ? "checked" : ""}>
      <span class="time">${r.start} – ${r.end}</span>
      <span class="ev">${esc(r.title)}</span>
      <span><input type="number" min="0" step="0.5" value="${r.hours}" data-chours class="cal-hours"> h</span>
      <select data-ccode>${codeOptions(r.codeId)}</select>
      <select data-cloc>${locationOptions(r.location)}</select>
    </div>`).join("") + `
    <div class="draft-foot">
      <span class="small">Selected: <b>${fmt(total)} h</b></span>
      <span class="spacer"></span>
      <button class="btn ghost" data-close>Cancel</button>
      <button class="btn dark" id="cal-apply" ${sel.length ? "" : "disabled"}>Accept &amp; add</button>
    </div>`;
}
$("#cal-list").addEventListener("change", e => {
  const row = e.target.closest("[data-ci]");
  if (!row) return;
  const r = calRows[+row.dataset.ci];
  if (e.target.matches("[data-con]")) r.on = e.target.checked;
  if (e.target.matches("[data-ccode]")) r.codeId = e.target.value;
  if (e.target.matches("[data-cloc]")) r.location = e.target.value;
  if (e.target.matches("[data-chours]")) r.hours = Math.max(0, parseFloat(e.target.value) || 0);
  renderCal();
});
$("#cal-list").addEventListener("click", e => {
  if (e.target.id === "cal-apply") addToToday(calRows.filter(r => r.on && r.codeId).map(r => ({ codeId: r.codeId, location: r.location, hours: r.hours })));
});

/* ================= Submit & confirmation ================= */
$("#submit-btn").onclick = () => {
  submitted = true;
  $("#confirm-table").innerHTML = `<thead><tr><th>Charge code</th><th>Location</th>${DAYS.map(d => `<th>${d.split(" ")[0]}</th>`).join("")}<th>Total</th></tr></thead>
    <tbody>${lines.filter(l => lineTotal(l)).map(l => {
      const c = codeById(l.codeId);
      return `<tr><td><b>${esc(c.nick)}</b><div class="mono">${c.code}</div></td><td>${l.location}</td>
        ${l.hours.map(h => `<td>${h ? fmt(h) : "–"}</td>`).join("")}<td><b>${fmt(lineTotal(l))}</b></td></tr>`;
    }).join("")}</tbody>
    <tfoot><tr><td colspan="2">Total</td>${DAYS.map((_, d) => `<td>${fmt(dayTotal(d))}</td>`).join("")}<td>${fmt(weekTotal())}</td></tr></tfoot>`;
  show("confirm");
};

// All state is in memory, so reloading restores the starting timesheet.
$("#reset-btn").onclick = () => location.reload();

renderGrid();
