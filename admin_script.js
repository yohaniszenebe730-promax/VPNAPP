
// ─── State ───────────────────────────────────────────────────────────────────
let sessionToken = localStorage.getItem("SESSION_TOKEN") || "";
let currentRole  = "";
let currentUser  = "";
let statsTimer   = null, usersTimer = null, xrayTimer = null;
let formCollapsed = true;
let tlsForwardersState = [];
let editingXrayClientId = null;
let wzInbounds = [];

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const loginOverlay  = document.getElementById("loginOverlay");
const loginUser     = document.getElementById("loginUser");
const loginPass     = document.getElementById("loginPass");
const loginBtn      = document.getElementById("loginBtn");
const loginErr      = document.getElementById("loginErr");
const mainApp       = document.getElementById("mainApp");
const meUsername    = document.getElementById("meUsername");
const roleChip      = document.getElementById("roleChip");
const logoutBtn     = document.getElementById("logoutBtn");
const menuToggle    = document.getElementById("menuToggle");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const themeToggle   = document.getElementById("themeToggle");
const pageTitle     = document.getElementById("pageTitle");
const pageEyebrow   = document.getElementById("pageEyebrow");
const sidebarUsername = document.getElementById("sidebarUsername");
const sidebarRole   = document.getElementById("sidebarRole");
const dashTotalUsers = document.getElementById("dashTotalUsers");
const dashActiveUsers = document.getElementById("dashActiveUsers");
const dashExpiredUsers = document.getElementById("dashExpiredUsers");
const dashConnections = document.getElementById("dashConnections");
const dashServers = document.getElementById("dashServers");
const dashServerStatus = document.getElementById("dashServerStatus");
const dashXrayClients = document.getElementById("dashXrayClients");
const dashXrayStatus = document.getElementById("dashXrayStatus");
const dashQuotaChip = document.getElementById("dashQuotaChip");
const dashQuotaBar = document.getElementById("dashQuotaBar");
const dashQuotaText = document.getElementById("dashQuotaText");
const dashQuotaBreakdown = document.getElementById("dashQuotaBreakdown");
const dashboardQuotaCard = document.getElementById("dashboardQuotaCard");

// Users
const usersBody      = document.getElementById("usersBody");
const userCountChip  = document.getElementById("userCountChip");
const userStatus     = document.getElementById("userStatus");
const lastReload     = document.getElementById("lastReload");
const ownerColHead   = document.getElementById("ownerColHead");
const resellerInfoCard = document.getElementById("resellerInfoCard");
const rUsedMax       = document.getElementById("rUsedMax");
const rExpiry        = document.getElementById("rExpiry");
const rStatus        = document.getElementById("rStatus");

// User form
const userForm       = document.getElementById("userForm");
const userFormWrap   = document.getElementById("userFormWrap");
const toggleFormBtn  = document.getElementById("toggleFormBtn");
const cancelUserBtn  = document.getElementById("cancelUserBtn");
const newUserBtn     = document.getElementById("newUserBtn");
const saveUserBtn    = document.getElementById("saveUserBtn");
const fUsername      = document.getElementById("fUsername");
const fPassword      = document.getElementById("fPassword");
const fTotpSecret    = document.getElementById("fTotpSecret");
const fTotpPeriod    = document.getElementById("fTotpPeriod");
const fTotpWindow    = document.getElementById("fTotpWindow");
const fTotpDigits    = document.getElementById("fTotpDigits");
const fAllowStatic   = document.getElementById("fAllowStatic");
const fMaxConn       = document.getElementById("fMaxConn");
const fExpires       = document.getElementById("fExpires");
const fUp            = document.getElementById("fUp");
const fDown          = document.getElementById("fDown");

// Xray
const xrayChip       = document.getElementById("xrayChip");
const xRunning       = document.getElementById("xRunning");
const xPID           = document.getElementById("xPID");
const xUptime        = document.getElementById("xUptime");
const xStatus        = document.getElementById("xStatus");
const xCfgEditor     = document.getElementById("xCfgEditor");
const xCfgStatus     = document.getElementById("xCfgStatus");
const xLogsBox       = document.getElementById("xLogsBox");
const inboundsContainer = document.getElementById("inboundsContainer");

// Resellers
const resellersBody     = document.getElementById("resellersBody");
const resellerCountChip = document.getElementById("resellerCountChip");
const resellerStatus    = document.getElementById("resellerStatus");
const resellerFormTitle = document.getElementById("resellerFormTitle");
const resellerForm      = document.getElementById("resellerForm");
const rUsername         = document.getElementById("rUsername");
const rPassword         = document.getElementById("rPassword");
const rMaxUsers         = document.getElementById("rMaxUsers");
const rExpires          = document.getElementById("rExpires");
const rActive           = document.getElementById("rActive");

// Stats
const cpuVal     = document.getElementById("cpuVal");
const cpuBar     = document.getElementById("cpuBar");
const memVal     = document.getElementById("memVal");
const memBar     = document.getElementById("memBar");
const memDetail  = document.getElementById("memDetail");
const ifaceBody  = document.getElementById("ifaceBody");
const ifaceSummary = document.getElementById("ifaceSummary");
const statsUpdated = document.getElementById("statsUpdated");
const resetIfaceStatsBtn = document.getElementById("resetIfaceStatsBtn");

// VnStat
const vnstatDailyBody = document.getElementById("vnstatDailyBody");
const vnstatMonthlyBody = document.getElementById("vnstatMonthlyBody");
const vnstatStatus = document.getElementById("vnstatStatus");
const vnTodayTotal = document.getElementById("vnTodayTotal");
const vnMonthTotal = document.getElementById("vnMonthTotal");
const vnIfaceCount = document.getElementById("vnIfaceCount");
const reloadVnstatBtn = document.getElementById("reloadVnstatBtn");
const resetVnstatBtn = document.getElementById("resetVnstatBtn");

// ─── API helper ───────────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const o = Object.assign({ headers: {} }, opts);
  o.headers = Object.assign({}, o.headers, {
    "Content-Type": "application/json",
    "X-Session-Token": sessionToken,
  });
  const res = await fetch(path, o);
  if (res.status === 401 || res.status === 403) throw new Error("auth");
  return res;
}

// ─── Formatters ──────────────────────────────────────────────────────────────
const fmtPct   = n => (n == null || isNaN(n)) ? "--%"  : n.toFixed(1)+"%";
const fmtMbps  = n => (n == null || isNaN(n)) ? "--"   : n.toFixed(2);
function fmtBytes(n) {
  if (!Number.isFinite(n)) return "--";
  if (n<1024) return n+" B";
  const k=n/1024; if(k<1024) return k.toFixed(1)+" KiB";
  const m=k/1024; if(m<1024) return m.toFixed(1)+" MiB";
  return (m/1024).toFixed(1)+" GiB";
}
function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString()+" "+d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
}
function isoFromLocal(v) {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}
function localFromISO(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = n => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function genBase32(len=20) {
  const alpha="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes=new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let bits=0,val=0,out="";
  for(const b of bytes){val=(val<<8)|b;bits+=8;while(bits>=5){out+=alpha[(val>>>(bits-5))&31];bits-=5;}}
  if(bits>0) out+=alpha[(val<<(5-bits))&31];
  return out;
}
function genUUID() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
}

// ─── Navigation / shell ──────────────────────────────────────────────────────
const tabTitles = {
  dashboard: ["Painel", "Visão geral"],
  ssh: ["Contas", "SSH / SlowDNS"],
  xray: ["Contas", "Xray Users"],
  resellers: ["Administração", "Revendedores"],
  stats: ["Servidor", "Monitoramento"],
  vnstat: ["Tráfego", "VnStat"],
  logs: ["Sistema", "Logs"],
  server: ["Sistema", "Configurações"],
};

function selectTab(tab) {
  const pane = document.getElementById("tab-" + tab);
  const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
  if (!pane || !btn) return;
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  pane.classList.add("active");
  const [eyebrow, title] = tabTitles[tab] || ["Painel", tab];
  if (pageEyebrow) pageEyebrow.textContent = eyebrow;
  if (pageTitle) pageTitle.textContent = title;
  document.body.classList.remove("sidebar-open");

  if (tab === "dashboard") refreshDashboard();
  if (tab === "xray") {
    loadXrayStatus();
    loadInbounds();
    if (currentRole === "superadmin") loadWizardFromConfig();
  }
  if (tab === "stats" && currentRole === "superadmin") loadStats();
  if (tab === "resellers" && currentRole === "superadmin") loadResellers();
}

document.querySelectorAll(".tab-btn").forEach(btn => btn.addEventListener("click", () => selectTab(btn.dataset.tab)));
menuToggle?.addEventListener("click", () => document.body.classList.add("sidebar-open"));
drawerBackdrop?.addEventListener("click", () => document.body.classList.remove("sidebar-open"));
themeToggle?.addEventListener("click", () => document.body.classList.toggle("light-mode"));
document.querySelectorAll(".quick-action[data-jump]").forEach(btn => btn.addEventListener("click", () => selectTab(btn.dataset.jump)));
document.getElementById("quickCreateUserBtn")?.addEventListener("click", () => { selectTab("ssh"); setFormCollapsed(false); fUsername?.focus(); });
document.getElementById("quickOpenXrayBtn")?.addEventListener("click", () => selectTab("xray"));

// ─── Login / Logout ───────────────────────────────────────────────────────────
loginBtn.addEventListener("click", doLogin);
loginPass.addEventListener("keydown", e => { if (e.key==="Enter") doLogin(); });
logoutBtn.addEventListener("click", async () => {
  try { await api("/api/auth/logout", { method: "POST" }); } catch {}
  sessionToken = "";
  localStorage.removeItem("SESSION_TOKEN");
  clearTimers();
  mainApp.classList.add("hidden");
  loginOverlay.classList.remove("hidden");
  loginErr.textContent = "";
  loginUser.value = loginPass.value = "";
});

async function doLogin() {
  loginErr.textContent = "";
  loginBtn.disabled = true;
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ username: loginUser.value.trim(), password: loginPass.value }),
    });
    if (!res.ok) {
      loginErr.textContent = res.status === 401 ? "Invalid credentials." :
                             res.status === 403 ? "Account suspended or expired." :
                             "Login failed.";
      return;
    }
    const data = await res.json();
    sessionToken = data.token;
    currentRole  = data.role;
    currentUser  = data.username;
    localStorage.setItem("SESSION_TOKEN", sessionToken);
    loginOverlay.classList.add("hidden");
    mainApp.classList.remove("hidden");
    initAfterLogin();
  } catch (e) {
    loginErr.textContent = "Network error.";
  } finally {
    loginBtn.disabled = false;
  }
}

// ─── Init after login ─────────────────────────────────────────────────────────
function clearTimers() {
  [statsTimer, usersTimer, xrayTimer].forEach(t => t && clearInterval(t));
  statsTimer = usersTimer = xrayTimer = null;
}

function initAfterLogin() {
  meUsername.textContent = currentUser;
  if (sidebarUsername) sidebarUsername.textContent = currentUser;
  if (sidebarRole) sidebarRole.textContent = currentRole === "superadmin" ? "Super Admin" : "Revendedor";
  roleChip.innerHTML = currentRole === "superadmin"
    ? `<span class="chip green">superadmin</span>`
    : `<span class="chip warn">reseller</span>`;

  document.querySelectorAll(".superadmin-only").forEach(el => {
    el.classList.toggle("hidden", currentRole !== "superadmin");
  });
  document.querySelectorAll(".xray-admin-only").forEach(el => {
    el.classList.toggle("hidden", currentRole !== "superadmin");
  });

  resellerInfoCard.classList.toggle("hidden", currentRole !== "reseller");
  dashboardQuotaCard?.classList.toggle("hidden", currentRole !== "reseller");

  selectTab("dashboard");

  if (currentRole === "superadmin") {
    loadStats();
    statsTimer = setInterval(loadStats, 2000);
  } else {
    loadMe();
  }
  xrayTimer = setInterval(loadXrayStatus, 7000);

  loadUsers();
  loadInbounds();
  usersTimer = setInterval(() => loadUsersSilent(), 3000);
}

// ─── Me (reseller info) ───────────────────────────────────────────────────────
async function loadMe() {
  try {
    const res = await api("/api/auth/me");
    const d   = await res.json();
    const used = d.used_users ?? 0;
    const max = d.max_users || 0;
    rUsedMax.textContent = used + " / " + (max || "∞");
    rExpiry.textContent  = d.expires_at ? fmtDate(d.expires_at) : "No limit";
    rStatus.textContent  = d.is_active  ? "Active" : "Suspended";
    rStatus.style.color  = d.is_active  ? "var(--success)" : "var(--danger)";
    updateQuotaCard(used, max, d.used_ssh_users || 0, d.used_xray_users || 0);
  } catch {}
}

function updateQuotaCard(used, max, sshUsed = 0, xrayUsed = 0) {
  if (!dashQuotaText) return;
  const labelMax = max || "∞";
  dashQuotaChip.textContent = `${used} / ${labelMax}`;
  dashQuotaText.textContent = max ? `${Math.max(0, max - used)} contas disponíveis` : "Sem limite definido pelo admin";
  dashQuotaBreakdown.textContent = `SSH ${sshUsed} · Xray ${xrayUsed}`;
  const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
  dashQuotaBar.style.width = `${pct}%`;
}

function updateDashboardFromUsers(users = []) {
  if (!dashTotalUsers) return;
  const now = new Date();
  let active = 0, expired = 0, conns = 0;
  users.forEach(u => {
    conns += Number(u.active_conns || 0);
    if (u.expires_at && new Date(u.expires_at) < now) expired++;
    else active++;
  });
  dashTotalUsers.textContent = users.length;
  dashActiveUsers.textContent = active;
  dashExpiredUsers.textContent = expired;
  dashConnections.textContent = conns;
}

function updateDashboardXray(inbounds = []) {
  if (!dashXrayClients) return;
  const total = inbounds.reduce((sum, ib) => sum + ((ib.clients || []).length), 0);
  dashXrayClients.textContent = total;
  const running = xrayChip?.textContent || "--";
  dashXrayStatus.textContent = `Core: ${running}`;
}

function refreshDashboard() {
  loadUsersSilent();
  loadInbounds();
  loadXrayStatus();
  if (currentRole === "reseller") loadMe();
}

// ─── SSH Users ────────────────────────────────────────────────────────────────
document.getElementById("reloadUsersBtn").addEventListener("click", loadUsers);
newUserBtn.addEventListener("click", () => {
  setFormCollapsed(false);
  userForm.reset();
  fTotpPeriod.value = 60; fTotpWindow.value = 1; fTotpDigits.value = 6;
  userStatus.textContent = "New user.";
  fUsername.focus();
});
cancelUserBtn.addEventListener("click", () => setFormCollapsed(true));
toggleFormBtn.addEventListener("click", () => setFormCollapsed(!formCollapsed));
document.getElementById("genTotpBtn").addEventListener("click", () => {
  fTotpSecret.value = genBase32();
  if (!fTotpPeriod.value) fTotpPeriod.value = 60;
  if (!fTotpWindow.value) fTotpWindow.value = 1;
  if (!fTotpDigits.value) fTotpDigits.value = 6;
  userStatus.textContent = "TOTP secret generated.";
});
document.getElementById("clearTotpBtn").addEventListener("click", () => { fTotpSecret.value = ""; });

function setFormCollapsed(v) {
  formCollapsed = v;
  userFormWrap.classList.toggle("collapsed", v);
  toggleFormBtn.textContent = v ? "Show form" : "Hide form";
}

async function loadUsers() {
  userStatus.textContent = "Loading…";
  try {
    const res  = await api("/api/users");
    const data = await res.json();
    renderUsers(data || []);
    userStatus.textContent = "Loaded.";
    lastReload.textContent = "Last reload: " + new Date().toLocaleTimeString();
  } catch (e) {
    if (e.message==="auth") { doAuthError(); } else { userStatus.textContent = "Error loading users."; }
  }
}
async function loadUsersSilent() {
  try {
    const res  = await api("/api/users");
    const data = await res.json();
    renderUsers(data || []);
  } catch (e) {
    if (e.message==="auth") doAuthError();
  }
}

function renderUsers(users) {
  updateDashboardFromUsers(users);
  const isSA = currentRole === "superadmin";
  userCountChip.textContent = users.length;
  if (isSA) ownerColHead.classList.remove("hidden");
  usersBody.innerHTML = "";
  let online = 0;
  users.forEach(u => {
    const on = (u.active_conns || 0) > 0;
    if (on) online++;
    const tr = document.createElement("tr");
    const cells = [
      u.username,
      on ? '<span class="badge-on">online</span>' : '<span class="badge-off">idle</span>',
      u.totp_enabled ? (u.allow_static_password ? "TOTP+pw" : "TOTP") : "Password",
      u.active_conns ?? 0,
      u.max_connections || 0,
      u.limit_mbps_up || 0,
      u.limit_mbps_down || 0,
      u.expires_at ? fmtDate(u.expires_at) : "—",
    ];
    if (isSA) cells.push(u.owner_username || "—");
    cells.forEach((c, i) => {
      const td = document.createElement("td");
      if (i === 1) td.innerHTML = c; else td.textContent = c;
      tr.appendChild(td);
    });
    const tdA = document.createElement("td");
    const editBtn = Object.assign(document.createElement("button"), {
      className:"btn btn-ghost btn-sm", textContent:"Edit",
      onclick: () => fillUserForm(u),
    });
    const delBtn = Object.assign(document.createElement("button"), {
      className:"btn btn-danger btn-sm", textContent:"Del",
      style: "margin-left:4px;",
      onclick: () => deleteUser(u.username),
    });
    tdA.append(editBtn, delBtn);
    tr.appendChild(tdA);
    usersBody.appendChild(tr);
  });
  userCountChip.textContent = `${users.length} (${online} online)`;
}

function fillUserForm(u) {
  setFormCollapsed(false);
  fUsername.value       = u.username || "";
  fPassword.value       = "";
  fTotpSecret.value     = u.totp_secret || "";
  fTotpPeriod.value     = u.totp_period || 60;
  fTotpWindow.value     = u.totp_window ?? 1;
  fTotpDigits.value     = u.totp_digits || 6;
  fAllowStatic.checked  = !!u.allow_static_password;
  fMaxConn.value        = u.max_connections || "";
  fUp.value             = u.limit_mbps_up || "";
  fDown.value           = u.limit_mbps_down || "";
  fExpires.value        = u.expires_at ? localFromISO(u.expires_at) : "";
  userStatus.textContent = `Editing ${u.username}`;
}

userForm.addEventListener("submit", async e => {
  e.preventDefault();
  saveUserBtn.disabled = true;
  userStatus.textContent = "Saving…";
  const payload = {
    username: fUsername.value.trim(),
    password: fPassword.value || undefined,
    totp_secret: fTotpSecret.value.trim(),
    totp_period: parseInt(fTotpPeriod.value||"60",10),
    totp_window: parseInt(fTotpWindow.value||"1",10),
    totp_digits: parseInt(fTotpDigits.value||"6",10),
    allow_static_password: !!fAllowStatic.checked,
    max_connections: parseInt(fMaxConn.value||"0",10),
    expires_at: isoFromLocal(fExpires.value),
    limit_mbps_up:   parseInt(fUp.value||"0",10),
    limit_mbps_down: parseInt(fDown.value||"0",10),
  };
  try {
    const res = await api("/api/users/create", { method:"POST", body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(await res.text());
    userStatus.textContent = "Saved.";
    fPassword.value = "";
    loadUsers();
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else userStatus.textContent = "Error: " + e.message;
  } finally {
    saveUserBtn.disabled = false;
  }
});

async function deleteUser(username) {
  if (!confirm(`Delete user "${username}"?`)) return;
  userStatus.textContent = `Deleting ${username}…`;
  try {
    const res = await api(`/api/users/delete?username=${encodeURIComponent(username)}`, { method:"DELETE" });
    if (!res.ok && res.status !== 204) throw new Error("delete failed");
    userStatus.textContent = "Deleted.";
    loadUsers();
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else userStatus.textContent = "Error deleting.";
  }
}

// ─── Xray ─────────────────────────────────────────────────────────────────────
document.getElementById("xStartBtn").addEventListener("click", () => xrayCtrl("start"));
document.getElementById("xStopBtn").addEventListener("click", () => xrayCtrl("stop"));
document.getElementById("xRestartBtn").addEventListener("click", () => xrayCtrl("restart"));
document.getElementById("xRefreshBtn").addEventListener("click", loadXrayStatus);
document.getElementById("xLoadInboundsBtn").addEventListener("click", loadInbounds);
document.getElementById("xLoadCfgBtn").addEventListener("click", loadXrayCfg);
document.getElementById("xSaveCfgBtn").addEventListener("click", saveXrayCfg);
document.getElementById("xLoadLogsBtn").addEventListener("click", loadXrayLogs);

document.querySelector("[data-tab='xray']")?.addEventListener("click", () => {
  loadXrayStatus();
  loadInbounds();
  if (currentRole === "superadmin") loadWizardFromConfig();
});

async function loadXrayStatus() {
  try {
    const res = await api("/api/xray/status");
    const s   = await res.json();
    const run = !!s.running;
    xrayChip.textContent  = run ? "running" : (s.enabled ? "stopped" : "disabled");
    xrayChip.className    = "chip " + (run ? "green" : "red");
    xRunning.textContent  = run ? "Running" : "Stopped";
    xRunning.style.color  = run ? "var(--success)" : "var(--danger)";
    xPID.textContent      = s.pid    || "--";
    xUptime.textContent   = s.uptime || "--";
    if (dashServers) dashServers.textContent = s.enabled ? "1" : "0";
    if (dashServerStatus) dashServerStatus.textContent = run ? "1 online" : (s.enabled ? "parado" : "desativado");
    if (dashXrayStatus) dashXrayStatus.textContent = `Core: ${xrayChip.textContent}`;
    if (s.error) xStatus.textContent = "Error: " + s.error;
  } catch (e) { if (e.message==="auth") doAuthError(); }
}

async function xrayCtrl(action) {
  xStatus.textContent = action.charAt(0).toUpperCase()+action.slice(1)+"ing Xray…";
  try {
    const res = await api(`/api/xray/${action}`, { method:"POST" });
    if (!res.ok) throw new Error(await res.text());
    xStatus.textContent = "Xray "+action+" OK.";
    setTimeout(loadXrayStatus, 700);
    setTimeout(loadInbounds, 1200);
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else xStatus.textContent = "Error: "+e.message;
  }
}

async function loadInbounds() {
  inboundsContainer.innerHTML = '<div class="hint" style="padding:8px 0;">Loading…</div>';
  try {
    const res      = await api("/api/xray/inbounds");
    const inbounds = await res.json();
    renderInbounds(inbounds || []);
  } catch (e) {
    inboundsContainer.textContent = "Error loading inbounds.";
    if (e.message==="auth") doAuthError();
  }
}

function renderInbounds(inbounds) {
  updateDashboardXray(inbounds);
  if (!inbounds.length) {
    inboundsContainer.innerHTML = '<div class="hint" style="padding:8px 0;">No VLESS/VMess/Trojan inbounds found.</div>';
    return;
  }
  inboundsContainer.innerHTML = "";
  inbounds.forEach(ib => {
    const section = document.createElement("div");
    section.style = "margin-bottom:14px;";

    const hdr = document.createElement("div");
    hdr.className = "card-hdr";
    hdr.style = "margin-bottom:6px;";
    hdr.innerHTML = `
      <div class="card-title" style="font-size:.8rem;">
        <span class="chip">${ib.protocol}</span>
        ${ib.tag || "untagged"}
        <span class="hint">:${ib.port ?? "?"}</span>
      </div>
      <button class="btn btn-sm" onclick="openAddClient('${ib.tag}')">+ Add Client</button>`;
    section.appendChild(hdr);

    // Add client mini-form (hidden by default)
    const addForm = document.createElement("div");
    addForm.id = `add-form-${ib.tag}`;
    addForm.className = "hidden";
    addForm.style = "background:rgba(15,23,42,.9);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;";
    addForm.innerHTML = `
      <div class="form-grid" style="grid-template-columns:1fr 1fr;">
        <div class="field">
          <label>UUID</label>
          <div class="field-row">
            <input id="newUUID-${ib.tag}" placeholder="auto-generate" style="border-radius:6px;"/>
            <button class="btn btn-ghost btn-sm" type="button" onclick="document.getElementById('newUUID-${ib.tag}').value=genUUID()">Gen</button>
          </div>
        </div>
        <div class="field"><label>Email / label</label><input id="newEmail-${ib.tag}" placeholder="user@example" style="border-radius:6px;"/></div>
        <div class="field"><label>Display Name</label><input id="newName-${ib.tag}" placeholder="e.g. Maykinho01" style="border-radius:6px;"/></div>
        <div class="field"><label>Expiry Date</label><input type="datetime-local" id="newExpiry-${ib.tag}" style="border-radius:6px;color-scheme:dark;"/></div>
        <div class="field"><label>Max Connections <span class="hint">(0 = unlimited)</span></label><input type="number" min="0" id="newMaxConns-${ib.tag}" placeholder="0" style="border-radius:6px;"/></div>
      </div>
      <div class="form-actions" style="margin-top:6px;">
        <button class="btn btn-sm" onclick="addClient('${ib.tag}')">Add</button>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('add-form-${ib.tag}').classList.add('hidden')">Cancel</button>
      </div>`;
    section.appendChild(addForm);

    // Clients table
    const tblWrap = document.createElement("div");
    tblWrap.className = "tbl-wrap";
    const clients = ib.clients || [];
    if (!clients.length) {
      tblWrap.innerHTML = '<div class="hint" style="padding:4px 0;">No clients.</div>';
    } else {
      const tbl = document.createElement("table");
      tbl.innerHTML = `<thead><tr><th>Name</th><th>UUID</th><th>Email</th><th>Expiry</th><th>Status</th><th>Max</th><th>Actions</th></tr></thead>`;
      const tbody = document.createElement("tbody");
      clients.forEach(c => {
        const exp = c.expires_at ? new Date(c.expires_at) : null;
        const expStr = exp ? exp.toLocaleDateString() : "Unlimited";
        const isExpired = !!c.expired;
        const daysLeft = c.expiration_days;
        let statusHtml;
        if (isExpired) {
          statusHtml = `<span style="color:var(--danger);font-size:.68rem;">Expired</span>`;
        } else if (daysLeft === -1 || !exp) {
          statusHtml = `<span style="color:var(--success);font-size:.68rem;">Active</span>`;
        } else {
          statusHtml = `<span style="color:var(--success);font-size:.68rem;">Active (${daysLeft}d)</span>`;
        }
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${c.name || "—"}</td>
          <td style="font-family:monospace;font-size:.65rem;">${c.id}</td>
          <td>${c.email || "—"}</td>
          <td style="font-size:.7rem;">${expStr}</td>
          <td>${statusHtml}</td>
          <td style="font-size:.7rem;">${c.max_conns || "∞"}</td>`;
        const actTd = document.createElement("td");
        actTd.style.whiteSpace = "nowrap";
        const copyBtn = document.createElement("button");
        copyBtn.className = "btn btn-ghost btn-sm";
        copyBtn.textContent = "Copy";
        copyBtn.onclick = () => navigator.clipboard.writeText(c.id);
        const editBtn = document.createElement("button");
        editBtn.className = "btn btn-warn btn-sm";
        editBtn.style.marginLeft = "4px";
        editBtn.textContent = "Edit";
        editBtn.onclick = () => openEditXrayClient(ib.tag, c);
        const delBtn = document.createElement("button");
        delBtn.className = "btn btn-danger btn-sm";
        delBtn.style.marginLeft = "4px";
        delBtn.textContent = "Del";
        delBtn.onclick = () => removeClient(ib.tag, c.id);
        actTd.append(copyBtn, editBtn, delBtn);
        tr.appendChild(actTd);
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody);
      tblWrap.appendChild(tbl);
    }
    section.appendChild(tblWrap);

    const divider = document.createElement("hr");
    divider.style = "border:none;border-top:1px solid var(--border);margin-top:10px;";
    section.appendChild(divider);

    inboundsContainer.appendChild(section);
  });
}

function openAddClient(tag) {
  const form = document.getElementById(`add-form-${tag}`);
  if (form) { form.classList.remove("hidden"); }
  const uuidField = document.getElementById(`newUUID-${tag}`);
  if (uuidField && !uuidField.value) uuidField.value = genUUID();
}

async function addClient(tag) {
  const uuidEl     = document.getElementById(`newUUID-${tag}`);
  const emailEl    = document.getElementById(`newEmail-${tag}`);
  const nameEl     = document.getElementById(`newName-${tag}`);
  const expiryEl   = document.getElementById(`newExpiry-${tag}`);
  const maxConnsEl = document.getElementById(`newMaxConns-${tag}`);
  const uuid       = (uuidEl?.value || "").trim();
  const email      = (emailEl?.value || "").trim();
  const name       = (nameEl?.value || "").trim();
  const expiresAt  = isoFromLocal(expiryEl?.value || "");
  const maxConns   = parseInt(maxConnsEl?.value || "0", 10) || 0;
  if (!uuid) { xStatus.textContent = "UUID required."; return; }
  try {
    const res = await api("/api/xray/clients/add", {
      method: "POST",
      body: JSON.stringify({ inbound_tag: tag, uuid, email, name, expires_at: expiresAt, max_connections: maxConns }),
    });
    if (!res.ok) throw new Error(await res.text());
    xStatus.textContent = `Client ${uuid.slice(0,8)}… added. Restarting Xray…`;
    setTimeout(loadInbounds, 1500);
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else xStatus.textContent = "Error: "+e.message;
  }
}

async function removeClient(tag, uuid) {
  if (!confirm(`Remove client ${uuid.slice(0,8)}… from ${tag}?`)) return;
  try {
    const res = await api(`/api/xray/clients/remove?inbound_tag=${encodeURIComponent(tag)}&uuid=${encodeURIComponent(uuid)}`, { method:"DELETE" });
    if (!res.ok && res.status !== 204) throw new Error(await res.text());
    xStatus.textContent = "Client removed. Restarting Xray…";
    setTimeout(loadInbounds, 1500);
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else xStatus.textContent = "Error: "+e.message;
  }
}

async function loadXrayCfg() {
  try {
    const res  = await api("/api/xray/config");
    if (!res.ok) throw new Error(await res.text());
    const text = await res.text();
    try { xCfgEditor.value = JSON.stringify(JSON.parse(text), null, 2); }
    catch { xCfgEditor.value = text; }
    xCfgStatus.textContent = "Config loaded.";
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else xCfgStatus.textContent = "Error: "+e.message;
  }
}

async function saveXrayCfg() {
  const text = xCfgEditor.value.trim();
  try { JSON.parse(text); } catch(e) { xCfgStatus.textContent = "Invalid JSON: "+e.message; return; }
  xCfgStatus.textContent = "Saving…";
  try {
    const res = await api("/api/xray/config", { method:"POST", body: text });
    if (!res.ok) throw new Error(await res.text());
    xCfgStatus.textContent = "Saved. Restarting Xray…";
    await xrayCtrl("restart");
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else xCfgStatus.textContent = "Error: "+e.message;
  }
}

async function loadXrayLogs() {
  try {
    const res  = await api("/api/xray/logs");
    const data = await res.json();
    xLogsBox.textContent = (data.lines||[]).join("\n");
    xLogsBox.scrollTop   = xLogsBox.scrollHeight;
  } catch (e) { if (e.message==="auth") doAuthError(); }
}

// ─── Resellers ────────────────────────────────────────────────────────────────
document.getElementById("reloadResellersBtn").addEventListener("click", loadResellers);
document.getElementById("newResellerBtn").addEventListener("click", () => {
  resellerFormTitle.textContent = "Create Reseller";
  resellerForm.reset();
  rActive.checked = true;
  resellerStatus.textContent = "New reseller.";
});
document.getElementById("cancelResellerBtn").addEventListener("click", () => {
  resellerForm.reset();
  rActive.checked = true;
  resellerFormTitle.textContent = "Create Reseller";
});

document.querySelector("[data-tab='resellers']")?.addEventListener("click", loadResellers);

async function loadResellers() {
  resellerStatus.textContent = "Loading…";
  try {
    const res  = await api("/api/resellers");
    const data = await res.json();
    renderResellers(data || []);
    resellerStatus.textContent = "Loaded.";
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else resellerStatus.textContent = "Error loading.";
  }
}

function renderResellers(list) {
  resellerCountChip.textContent = list.length;
  resellersBody.innerHTML = "";
  list.forEach(r => {
    const expired = r.expires_at && new Date(r.expires_at) < new Date();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.username}</td>
      <td>${r.used_users} / ${r.max_users || "∞"}<div class="hint">SSH ${r.used_ssh_users || 0} · Xray ${r.used_xray_users || 0}</div></td>
      <td>${r.expires_at ? fmtDate(r.expires_at) : "—"}</td>
      <td><span class="${r.is_active && !expired ? 'badge-on' : 'badge-off'}">${r.is_active && !expired ? "Active" : expired ? "Expired" : "Suspended"}</span></td>
      <td></td>`;
    const tdA = tr.lastElementChild;
    const editBtn = Object.assign(document.createElement("button"),{
      className:"btn btn-ghost btn-sm", textContent:"Edit",
      onclick: () => fillResellerForm(r),
    });
    const delBtn = Object.assign(document.createElement("button"),{
      className:"btn btn-danger btn-sm", textContent:"Del",
      style: "margin-left:4px;",
      onclick: () => deleteReseller(r.username),
    });
    tdA.append(editBtn, delBtn);
    resellersBody.appendChild(tr);
  });
}

function fillResellerForm(r) {
  resellerFormTitle.textContent = `Edit: ${r.username}`;
  rUsername.value  = r.username;
  rPassword.value  = "";
  rMaxUsers.value  = r.max_users || 0;
  rExpires.value   = r.expires_at ? localFromISO(r.expires_at) : "";
  rActive.checked  = r.is_active;
  resellerStatus.textContent = `Editing ${r.username}.`;
}

resellerForm.addEventListener("submit", async e => {
  e.preventDefault();
  const btn = document.getElementById("saveResellerBtn");
  btn.disabled = true;
  resellerStatus.textContent = "Saving…";
  const payload = {
    username:   rUsername.value.trim(),
    password:   rPassword.value || undefined,
    max_users:  parseInt(rMaxUsers.value||"0",10),
    expires_at: isoFromLocal(rExpires.value),
    is_active:  rActive.checked,
  };
  try {
    const res = await api("/api/resellers/create", { method:"POST", body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(await res.text());
    resellerStatus.textContent = "Saved.";
    resellerForm.reset(); rActive.checked = true;
    resellerFormTitle.textContent = "Create Reseller";
    loadResellers();
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else resellerStatus.textContent = "Error: "+e.message;
  } finally { btn.disabled = false; }
});

async function deleteReseller(username) {
  if (!confirm(`Delete reseller "${username}"? All their SSH sessions will be disconnected.`)) return;
  resellerStatus.textContent = `Deleting ${username}…`;
  try {
    const res = await api(`/api/resellers/delete?username=${encodeURIComponent(username)}`, { method:"DELETE" });
    if (!res.ok && res.status !== 204) throw new Error("failed");
    resellerStatus.textContent = "Deleted.";
    loadResellers();
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else resellerStatus.textContent = "Error deleting.";
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────
document.querySelector("[data-tab='stats']")?.addEventListener("click", loadStats);

async function loadStats() {
  try {
    const res = await api("/api/stats");
    const s   = await res.json();
    const cpu = s?.cpu_percent ?? 0;
    cpuVal.textContent = fmtPct(cpu);
    cpuBar.style.width = Math.min(100, Math.max(0, cpu)) + "%";
    const mp  = s?.mem_percent ?? null;
    memVal.textContent = mp == null ? "--%"  : fmtPct(mp);
    memBar.style.width = mp == null ? "0%"   : Math.min(100, Math.max(0, mp)) + "%";
    const mu = s?.mem_used_bytes, mt = s?.mem_total_bytes;
    memDetail.textContent = (mu != null && mt != null) ? `${fmtBytes(mu)} / ${fmtBytes(mt)}` : "";
    const ifaces = Array.isArray(s.interfaces) ? s.interfaces : [];
    ifaceBody.innerHTML = "";
    let totRx = 0, totTx = 0;
    ifaces.forEach(it => {
      totRx += it.rx_bytes||0; totTx += it.tx_bytes||0;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${it.name}</td><td>${fmtMbps(it.rx_mbps)}</td><td>${fmtMbps(it.tx_mbps)}</td><td>${fmtBytes(it.rx_bytes)}</td><td>${fmtBytes(it.tx_bytes)}</td>`;
      ifaceBody.appendChild(tr);
    });
    ifaceSummary.textContent = `Total: ${fmtBytes(totRx)} rx / ${fmtBytes(totTx)} tx`;
    statsUpdated.textContent = "Updated: " + new Date().toLocaleTimeString();
  } catch (e) { if (e.message==="auth") doAuthError(); }
}

resetIfaceStatsBtn?.addEventListener("click", resetInterfaceStats);

async function resetInterfaceStats() {
  if (!confirm("Clean the live Interface totals now? This does not delete VnStat daily/monthly history.")) return;
  resetIfaceStatsBtn.disabled = true;
  ifaceSummary.textContent = "Cleaning interface totals…";
  try {
    const res = await api("/api/stats/interfaces/reset", { method:"POST" });
    if (!res.ok) throw new Error(await res.text());
    ifaceSummary.textContent = "Interface totals cleaned. Auto-clean remains every 30 days.";
    loadStats();
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else ifaceSummary.textContent = "Error cleaning totals: " + e.message;
  } finally {
    resetIfaceStatsBtn.disabled = false;
  }
}

// ─── VnStat ───────────────────────────────────────────────────────────────────
document.querySelector("[data-tab='vnstat']")?.addEventListener("click", loadVnstat);
reloadVnstatBtn?.addEventListener("click", loadVnstat);
resetVnstatBtn?.addEventListener("click", resetVnstatHistory);

function renderVnstatRows(body, rows, emptyLabel) {
  body.innerHTML = "";
  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" class="hint">${emptyLabel}</td>`;
    body.appendChild(tr);
    return;
  }
  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.period || "--"}</td><td>${r.iface || "--"}</td><td>${fmtBytes(r.rx_bytes||0)}</td><td>${fmtBytes(r.tx_bytes||0)}</td><td>${fmtBytes(r.total_bytes||((r.rx_bytes||0)+(r.tx_bytes||0)))}</td>`;
    body.appendChild(tr);
  });
}

async function loadVnstat() {
  vnstatStatus.textContent = "Loading VnStat usage…";
  try {
    const res = await api("/api/vnstat?days=31&months=12");
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const daily = Array.isArray(data.daily) ? data.daily : [];
    const monthly = Array.isArray(data.monthly) ? data.monthly : [];
    renderVnstatRows(vnstatDailyBody, daily, "No daily usage recorded yet.");
    renderVnstatRows(vnstatMonthlyBody, monthly, "No monthly usage recorded yet.");

    // Use the server/database periods when available. Falling back to the
    // newest row avoids browser UTC/local-time mismatches that can make
    // "Today total" show 0 while the daily table has data.
    const today = data.today_period || daily[0]?.period || localDateKey();
    const month = data.month_period || today.slice(0,7);
    const todayTotal = data.today_total_bytes ?? daily.filter(r => r.period === today).reduce((sum, r) => sum + (r.total_bytes||0), 0);
    const monthTotal = data.month_total_bytes ?? monthly.filter(r => r.period === month).reduce((sum, r) => sum + (r.total_bytes||0), 0);
    const ifaces = new Set([...daily, ...monthly].map(r => r.iface).filter(Boolean));
    vnTodayTotal.textContent = fmtBytes(todayTotal);
    vnMonthTotal.textContent = fmtBytes(monthTotal);
    vnIfaceCount.textContent = String(data.interface_count ?? ifaces.size ?? 0);
    vnstatStatus.textContent = "Updated: " + new Date().toLocaleTimeString() + " · history is kept until manually cleaned.";
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else vnstatStatus.textContent = "Error loading VnStat usage: " + e.message;
  }
}

async function resetVnstatHistory() {
  if (!confirm("Clean all VnStat daily/monthly usage history? This does not reset the live Interface totals.")) return;
  resetVnstatBtn.disabled = true;
  vnstatStatus.textContent = "Cleaning VnStat history…";
  try {
    const res = await api("/api/vnstat/reset", { method:"POST" });
    if (!res.ok) throw new Error(await res.text());
    vnstatStatus.textContent = "VnStat history cleaned.";
    loadVnstat();
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else vnstatStatus.textContent = "Error cleaning VnStat history: " + e.message;
  } finally {
    resetVnstatBtn.disabled = false;
  }
}

// ─── Logs ─────────────────────────────────────────────────────────────────────
document.querySelector("[data-tab='logs']")?.addEventListener("click", loadSystemLogs);
document.getElementById("logSource")?.addEventListener("change", loadSystemLogs);
document.getElementById("clearPanelLogBtn")?.addEventListener("click", clearPanelLog);

async function loadSystemLogs() {
  const box = document.getElementById("systemLogBox");
  const st = document.getElementById("systemLogStatus");
  const source = document.getElementById("logSource")?.value || "panel";
  const clearBtn = document.getElementById("clearPanelLogBtn");
  if (clearBtn) clearBtn.disabled = source !== "panel";
  st.textContent = "Loading…";
  try {
    const res = await api(`/api/system/logs?source=${encodeURIComponent(source)}&lines=500`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const lines = Array.isArray(data.lines) ? data.lines : [];
    box.textContent = lines.length ? lines.join("\n") : "No log lines yet.";
    box.scrollTop = box.scrollHeight;
    st.textContent = `${data.source || source} logs${data.path ? " · " + data.path : ""} · ${lines.length} lines · ` + new Date().toLocaleTimeString();
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

async function clearPanelLog() {
  const st = document.getElementById("systemLogStatus");
  if (!confirm("Clean the panel log now? Logs are already auto-cleaned after 1 MiB.")) return;
  st.textContent = "Cleaning panel log…";
  try {
    const res = await api("/api/system/logs/reset", { method:"POST" });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    st.textContent = `Panel log cleaned · ${data.path || "panel.log"} · max ${fmtBytes(data.max_bytes || 1048576)}`;
    await loadSystemLogs();
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else st.textContent = "Error cleaning panel log: " + e.message;
  }
}

// ─── Server Config ────────────────────────────────────────────────────────────
document.querySelector("[data-tab='server']")?.addEventListener("click", loadServerConfig);

function toggleDnsttFields(on) {
  const el = document.getElementById("dnsttFields");
  el.style.opacity = on ? "1" : ".4";
  el.style.pointerEvents = on ? "" : "none";
}
function toggleUdpgwFields(on) {
  const el = document.getElementById("udpgwFields");
  el.style.opacity = on ? "1" : ".4";
  el.style.pointerEvents = on ? "" : "none";
}

async function loadServerConfig() {
  const st = document.getElementById("srvCfgStatus");
  st.textContent = "Loading…";
  try {
    const res = await api("/api/server/config");
    if (!res.ok) throw new Error(await res.text());
    const c = await res.json();

    // Network
    document.getElementById("cfgListen").value       = c.listen || "";
    document.getElementById("cfgExtraListen").value  = (c.extra_listen || []).join("\n");

    // SSH / general
    document.getElementById("cfgLimitUp").value      = c.default_limit_mbps_up || 0;
    document.getElementById("cfgLimitDown").value    = c.default_limit_mbps_down || 0;
    document.getElementById("cfgQuiet").checked      = !!c.quiet;
    document.getElementById("cfgUserCount").checked  = !!c.user_count;

    // Banner
    document.getElementById("cfgBanner").value       = c.banner || "";

    // DNSTT
    const hasDnstt = !!c.dnstt;
    document.getElementById("cfgDnsttEnabled").checked = hasDnstt;
    toggleDnsttFields(hasDnstt);
    const d = c.dnstt || {};
    document.getElementById("cfgDnsttDomain").value    = d.domain || "";
    document.getElementById("cfgDnsttUDP").value       = d.udp_listen || "";
    document.getElementById("cfgDnsttKey").value       = d.privkey_file || "/opt/sshpanel/dnstt.key";
    document.getElementById("cfgDnsttNoStats").checked = !!d.disable_stats_log;
    document.getElementById("cfgDnsttNoConsole").checked = !!d.disable_console_log;

    // UDPGW
    const hasUdpgw = !!c.udpgw;
    document.getElementById("cfgUdpgwEnabled").checked = hasUdpgw;
    toggleUdpgwFields(hasUdpgw);
    const u = c.udpgw || {};
    document.getElementById("cfgUdpgwListen").value    = u.listen || "";
    document.getElementById("cfgUdpgwMaxConns").value  = u.max_client_conns || 0;
    document.getElementById("cfgUdpgwIdle").value      = u.idle_timeout || "";
    document.getElementById("cfgUdpgwMapTTL").value    = u.map_ttl || "";
    document.getElementById("cfgUdpgwDebug").checked   = !!u.debug;

    // TLS forwarders
    tlsForwardersState = c.tls_forwarders || [];
    renderTLSForwarders();

    // Xray
    const x = c.xray || {};
    document.getElementById("cfgXrayEnabled").checked = !!x.enabled;

    st.textContent = "Config loaded.";
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

async function saveServerConfig() {
  const st = document.getElementById("srvCfgStatus");
  st.textContent = "Saving…";

  const tlsArr = tlsForwardersState;

  const extraLines = document.getElementById("cfgExtraListen").value
    .split("\n").map(s => s.trim()).filter(Boolean);

  const cfg = {
    listen:               document.getElementById("cfgListen").value.trim(),
    extra_listen:         extraLines,
    host_key_file:        "/opt/sshpanel/ssh_host_rsa_key",
    admin_dir:            "/opt/sshpanel/admin",
    default_limit_mbps_up:   parseInt(document.getElementById("cfgLimitUp").value  || "0", 10),
    default_limit_mbps_down: parseInt(document.getElementById("cfgLimitDown").value || "0", 10),
    quiet:      document.getElementById("cfgQuiet").checked,
    user_count: document.getElementById("cfgUserCount").checked,
    banner:      document.getElementById("cfgBanner").value,
    banner_file: "/opt/sshpanel/banner.txt",
    dnstt: document.getElementById("cfgDnsttEnabled").checked ? {
      domain:              document.getElementById("cfgDnsttDomain").value.trim(),
      udp_listen:          document.getElementById("cfgDnsttUDP").value.trim(),
      privkey_file:        document.getElementById("cfgDnsttKey").value.trim(),
      disable_stats_log:   document.getElementById("cfgDnsttNoStats").checked,
      disable_console_log: document.getElementById("cfgDnsttNoConsole").checked,
    } : null,
    udpgw: document.getElementById("cfgUdpgwEnabled").checked ? {
      listen:          document.getElementById("cfgUdpgwListen").value.trim(),
      max_client_conns: parseInt(document.getElementById("cfgUdpgwMaxConns").value || "0", 10),
      idle_timeout:    document.getElementById("cfgUdpgwIdle").value.trim(),
      map_ttl:         document.getElementById("cfgUdpgwMapTTL").value.trim(),
      debug:           document.getElementById("cfgUdpgwDebug").checked,
    } : null,
    tls_forwarders: tlsArr,
    xray: {
      enabled:     document.getElementById("cfgXrayEnabled").checked,
      bin_path:    "/opt/sshpanel/xray",
      config_file: "/opt/sshpanel/xray_config.json",
    },
  };

  try {
    const res = await api("/api/server/config", { method: "POST", body: JSON.stringify(cfg) });
    if (!res.ok) throw new Error(await res.text());
    const report = await res.json().catch(() => null);
    const warnings = report?.warnings || [];
    const bad = Object.entries(report?.services || {}).filter(([_, v]) => v?.enabled && !v?.running);
    if (warnings.length || bad.length) {
      const badText = bad.map(([name, v]) => `${name}: ${v.error || "not running"}`).join(" | ");
      st.textContent = "Saved live with warnings: " + [...warnings, badText].filter(Boolean).join(" | ");
    } else {
      st.textContent = "Saved and applied live.";
    }
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

// ─── TLS Forwarders ────────────────────────────────────────────────────────────
function renderTLSForwarders() {
  const list = document.getElementById("tlsForwardersList");
  const chip = document.getElementById("tlsCountChip");
  if (!list) return;
  chip.textContent = tlsForwardersState.length;
  if (!tlsForwardersState.length) {
    list.innerHTML = '<div class="hint" style="padding:4px 0;">No TLS forwarders configured.</div>';
    return;
  }
  list.innerHTML = "";
  tlsForwardersState.forEach((fw, i) => {
    const row = document.createElement("div");
    row.style = "display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);font-size:.73rem;";
    row.innerHTML = `<span style="flex:1;font-family:monospace;">${fw.listen}</span>
      <span class="hint">${fw.cert_file ? fw.cert_file.split("/").pop() : "no cert"}</span>`;
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger btn-sm";
    delBtn.textContent = "Remove";
    delBtn.onclick = () => { tlsForwardersState.splice(i,1); renderTLSForwarders(); };
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

function toggleAddTLSForm() {
  const panel = document.getElementById("addTLSPanel");
  panel.classList.toggle("hidden");
  if (!panel.classList.contains("hidden")) {
    document.getElementById("tlsAddStatus").textContent = "";
    document.getElementById("tlsListenAddr").value = "";
    document.getElementById("tlsSSLDomain").value = "";
    document.getElementById("tlsCertType").value = "selfsigned";
    onTLSTypeChange("selfsigned");
  }
}

function onTLSTypeChange(val) {
  document.getElementById("tlsSSFields").style.display     = val === "selfsigned"  ? "" : "none";
  document.getElementById("tlsLEFields").style.display     = val === "letsencrypt" ? "grid" : "none";
  document.getElementById("tlsPasteFields").style.display  = val === "paste"       ? "" : "none";
  document.getElementById("tlsCustomFields").style.display = val === "custom"      ? "grid" : "none";
}

async function addTLSForwarder() {
  const st = document.getElementById("tlsAddStatus");
  const listen   = document.getElementById("tlsListenAddr").value.trim();
  const certType = document.getElementById("tlsCertType").value;
  if (!listen) { st.textContent = "Listen address required."; return; }
  let certFile = "", keyFile = "";
  st.textContent = "Processing…";
  if (certType === "selfsigned") {
    const domain = document.getElementById("tlsSSLDomain").value.trim();
    if (!domain) { st.textContent = "Domain required."; return; }
    try {
      const res = await api("/api/tls/generate-selfsigned", { method:"POST", body: JSON.stringify({ domain }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      certFile = data.cert_file; keyFile = data.key_file;
      st.textContent = "Self-signed cert generated.";
    } catch (e) {
      if (e.message==="auth") doAuthError();
      else st.textContent = "Cert error: " + e.message;
      return;
    }
  } else if (certType === "letsencrypt") {
    const domain = document.getElementById("tlsLEDomain").value.trim();
    const email  = document.getElementById("tlsLEEmail").value.trim();
    if (!domain || !email) { st.textContent = "Domain and email required."; return; }
    st.textContent = "Running certbot… (may take ~30s)";
    try {
      const res = await api("/api/tls/letsencrypt", { method:"POST", body: JSON.stringify({ domain, email }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      certFile = data.cert_file; keyFile = data.key_file;
      st.textContent = "Let's Encrypt cert issued.";
    } catch (e) {
      if (e.message==="auth") doAuthError();
      else st.textContent = "certbot error: " + e.message;
      return;
    }
  } else if (certType === "paste") {
    const name = document.getElementById("tlsPasteName").value.trim();
    const cert = document.getElementById("tlsPasteCert").value.trim();
    const key  = document.getElementById("tlsPasteKey").value.trim();
    if (!name || !cert || !key) { st.textContent = "Name, cert PEM, and key PEM required."; return; }
    try {
      const res = await api("/api/tls/upload-pem", { method:"POST", body: JSON.stringify({ name, cert, key }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      certFile = data.cert_file; keyFile = data.key_file;
      st.textContent = "PEM saved.";
    } catch (e) {
      if (e.message==="auth") doAuthError();
      else st.textContent = "Upload error: " + e.message;
      return;
    }
  } else {
    certFile = document.getElementById("tlsCustomCert").value.trim();
    keyFile  = document.getElementById("tlsCustomKey").value.trim();
    if (!certFile || !keyFile) { st.textContent = "Cert and key paths required."; return; }
  }
  tlsForwardersState.push({ listen, cert_file: certFile, key_file: keyFile });
  renderTLSForwarders();
  document.getElementById("addTLSPanel").classList.add("hidden");
  st.textContent = "Added. Save config to apply.";
}

// ─── Xray wizard cert source picker ──────────────────────────────────────────
function setWzCertSrc(mode) {
  ["file","paste","gen"].forEach(m => {
    const cap = m.charAt(0).toUpperCase() + m.slice(1);
    document.getElementById("wzCertSrc"+cap).style.display = m === mode ? "" : "none";
    const btn = document.getElementById("wzCertSrc"+cap+"Btn");
    if (btn) btn.className = (m === mode ? "btn btn-sm" : "btn btn-ghost btn-sm");
  });
  document.getElementById("wzPasteCertStatus").textContent = "";
  document.getElementById("wzGenCertStatus").textContent   = "";
}

async function wzSavePastedCert() {
  const st   = document.getElementById("wzPasteCertStatus");
  const name = document.getElementById("wzPastedName").value.trim();
  const cert = document.getElementById("wzPastedCert").value.trim();
  const key  = document.getElementById("wzPastedKey").value.trim();
  if (!name || !cert || !key) { st.textContent = "Name, cert, and key required."; return; }
  st.textContent = "Saving…";
  try {
    const res = await api("/api/tls/upload-pem", { method:"POST", body: JSON.stringify({ name, cert, key }) });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    document.getElementById("wzTLSCert").value = data.cert_file;
    document.getElementById("wzTLSKey").value  = data.key_file;
    st.textContent = "Saved ✓ paths set.";
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

async function wzGenerateCert() {
  const st     = document.getElementById("wzGenCertStatus");
  const domain = document.getElementById("wzGenDomain").value.trim();
  if (!domain) { st.textContent = "Domain required."; return; }
  st.textContent = "Generating…";
  try {
    const res = await api("/api/tls/generate-selfsigned", { method:"POST", body: JSON.stringify({ domain }) });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    document.getElementById("wzTLSCert").value = data.cert_file;
    document.getElementById("wzTLSKey").value  = data.key_file;
    st.textContent = "Generated ✓ paths set.";
  } catch (e) {
    if (e.message === "auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

// ─── DNSTT Key Management ─────────────────────────────────────────────────────
async function generateDnsttKey() {
  const st = document.getElementById("dnsttKeyStatus");
  st.textContent = "Generating key…";
  try {
    const res = await api("/api/dnstt/genkey", { method: "POST" });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    document.getElementById("cfgDnsttKey").value = data.privkey_file;
    document.getElementById("dnsttPubkeyVal").value = data.pubkey;
    document.getElementById("dnsttPubkeyWrap").classList.remove("hidden");
    st.textContent = "Key generated. Save config to apply.";
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

async function loadDnsttPubkey() {
  const st = document.getElementById("dnsttKeyStatus");
  st.textContent = "Loading public key…";
  try {
    const res = await api("/api/dnstt/pubkey");
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    document.getElementById("dnsttPubkeyVal").value = data.pubkey;
    document.getElementById("dnsttPubkeyWrap").classList.remove("hidden");
    st.textContent = "";
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

// ─── Xray Client Edit ─────────────────────────────────────────────────────────
function openEditXrayClient(tag, client) {
  editingXrayClientId = client.id;
  document.getElementById("editClientUUID").textContent = client.id;
  document.getElementById("editXrayName").value    = client.name  || "";
  document.getElementById("editXrayEmail").value   = client.email || "";
  document.getElementById("editXrayExpiry").value  = client.expires_at ? localFromISO(client.expires_at) : "";
  document.getElementById("editXrayMaxConns").value = client.max_conns || 0;
  document.getElementById("editXrayClientStatus").textContent = "";
  document.getElementById("editXrayClientPanel").classList.remove("hidden");
  document.getElementById("editXrayClientPanel").scrollIntoView({ behavior:"smooth", block:"nearest" });
}

function closeEditXrayClient() {
  editingXrayClientId = null;
  document.getElementById("editXrayClientPanel").classList.add("hidden");
}

async function saveEditXrayClient() {
  if (!editingXrayClientId) return;
  const st = document.getElementById("editXrayClientStatus");
  st.textContent = "Saving…";
  const payload = {
    uuid:            editingXrayClientId,
    name:            document.getElementById("editXrayName").value.trim(),
    email:           document.getElementById("editXrayEmail").value.trim(),
    expires_at:      isoFromLocal(document.getElementById("editXrayExpiry").value),
    max_connections: parseInt(document.getElementById("editXrayMaxConns").value || "0", 10),
  };
  try {
    const res = await api("/api/xray/clients/update", { method:"POST", body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(await res.text());
    st.textContent = "Saved.";
    setTimeout(() => { closeEditXrayClient(); loadInbounds(); }, 700);
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

// ─── Xray Config Wizard ────────────────────────────────────────────────────────
function setXrayCfgMode(mode) {
  const wizPane  = document.getElementById("xrayWizardPane");
  const jsonPane = document.getElementById("xrayCfgPaneJson");
  const wizBtn   = document.getElementById("xrayWizardTabBtn");
  const jsonBtn  = document.getElementById("xrayJsonTabBtn");
  if (mode === "wizard") {
    wizPane.classList.remove("hidden");
    jsonPane.classList.add("hidden");
    wizBtn.classList.remove("btn-ghost");
    jsonBtn.classList.add("btn-ghost");
    loadWizardFromConfig();
  } else {
    wizPane.classList.add("hidden");
    jsonPane.classList.remove("hidden");
    jsonBtn.classList.remove("btn-ghost");
    wizBtn.classList.add("btn-ghost");
    loadXrayCfg();
  }
}

function loadWizardFromConfig() {
  api("/api/xray/config").then(async res => {
    if (!res.ok) return;
    try {
      const cfg = JSON.parse(await res.text());
      document.getElementById("wzLogLevel").value = cfg.log?.loglevel || "warning";
      wzInbounds = cfg.inbounds || [];
      renderWzInbounds();
    } catch {}
  }).catch(() => {});
}

function renderWzInbounds() {
  const list = document.getElementById("wzInboundsList");
  if (!list) return;
  if (!wzInbounds.length) {
    list.innerHTML = '<div class="hint" style="padding:4px 0;">No inbounds. Click + Add to create one.</div>';
    return;
  }
  list.innerHTML = "";
  wzInbounds.forEach((ib, i) => {
    const row = document.createElement("div");
    row.style = "display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);font-size:.73rem;";
    const portStr = ib.port !== undefined ? `:${ib.port}` : "";
    const ss  = ib.streamSettings || {};
    const net = ss.network || "";
    const sec = ss.security || "";
    const secLabel = sec === "tls" ? " TLS" : sec === "reality" ? " Reality" : "";
    const modeLabel = net === "xhttp" && ss.xhttpSettings?.mode ? " ("+ss.xhttpSettings.mode+")" : "";
    row.innerHTML = `<span class="chip">${ib.protocol}</span>
      <span style="font-family:monospace;">${ib.tag||"untagged"}${portStr}</span>
      <span class="hint" style="flex:1;">${ib.listen||"0.0.0.0"}${net?" · "+net:""}${modeLabel}${secLabel}</span>`;
    const clients = ib.settings?.clients;
    if (Array.isArray(clients) && clients.length) {
      const badge = document.createElement("span");
      badge.className = "chip green";
      badge.textContent = clients.length + " client" + (clients.length!==1?"s":"");
      row.appendChild(badge);
    }
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger btn-sm";
    delBtn.textContent = "Remove";
    delBtn.onclick = () => { wzInbounds.splice(i,1); renderWzInbounds(); };
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

function wzToggleAddInbound() {
  const form = document.getElementById("wzAddInboundForm");
  form.classList.toggle("hidden");
  if (!form.classList.contains("hidden")) {
    onWzProtoChange(document.getElementById("wzProtocol").value);
    onWzNetworkChange(document.getElementById("wzNetwork").value);
    onWzTLSChange(document.getElementById("wzTLS").value);
  }
}

function onWzProtoChange(val) {
  const usesClientTransport = val === "vless" || val === "vmess";
  document.getElementById("wzVlessFields").style.display   = usesClientTransport    ? "grid" : "none";
  document.getElementById("wzTrojanFields").style.display  = val === "trojan"       ? "" : "none";
  document.getElementById("wzSSFields").style.display      = val === "shadowsocks"  ? "grid" : "none";

  const tlsSel = document.getElementById("wzTLS");
  const realityOpt = document.querySelector("#wzTLS option[value='reality']");
  if (realityOpt) {
    realityOpt.disabled = val === "vmess";
    if (val === "vmess" && tlsSel.value === "reality") {
      tlsSel.value = "none";
      onWzTLSChange("none");
    }
  }

  const portMap = { vless:10086, vmess:10087, trojan:8443, shadowsocks:8388, socks:10808 };
  const tagMap  = { vless:"vless-in", vmess:"vmess-in", trojan:"trojan-in", shadowsocks:"ss-in", socks:"socks-local" };
  const portEl = document.getElementById("wzPort");
  const tagEl  = document.getElementById("wzTag");
  const lisEl  = document.getElementById("wzListenIP");
  const knownPorts = Object.values(portMap).map(String);
  const knownTags  = Object.values(tagMap);
  if (!portEl.value || knownPorts.includes(portEl.value)) portEl.value = portMap[val] || "";
  if (!tagEl.value || knownTags.includes(tagEl.value))     tagEl.value  = tagMap[val]  || val+"-in";
  if (!lisEl.value || lisEl.value === "0.0.0.0" || lisEl.value === "127.0.0.1") {
    lisEl.value = val === "socks" ? "127.0.0.1" : "0.0.0.0";
  }
}

function onWzNetworkChange(val) {
  const show = (id, v) => document.getElementById(id).style.display = v ? "" : "none";
  // WebSocket
  show("wzWSPathField",      val === "ws");
  // XHTTP
  show("wzXHTTPPathField",   val === "xhttp");
  show("wzXHTTPHostField",   val === "xhttp");
  show("wzXHTTPModeField",   val === "xhttp");
  // HTTPUpgrade
  show("wzHUPathField",      val === "httpupgrade");
  show("wzHUHostField",      val === "httpupgrade");
  // H2
  show("wzH2PathField",      val === "h2");
  show("wzH2HostField",      val === "h2");
  // gRPC
  show("wzGRPCServiceField", val === "grpc");
  show("wzGRPCMultiField",   val === "grpc");
  // Auto-select TLS defaults
  const tlsSel = document.getElementById("wzTLS");
  if ((val === "h2" || val === "grpc") && tlsSel.value === "none") {
    tlsSel.value = "tls"; onWzTLSChange("tls");
  }
}

function onWzTLSChange(val) {
  const show = (id, v) => document.getElementById(id).style.display = v ? "" : "none";
  show("wzTLSCertBlock",       val === "tls");
  show("wzRealityDestField",   val === "reality");
  show("wzRealitySNIField",    val === "reality");
  show("wzRealityPrivField",   val === "reality");
  show("wzRealityShortIDField",val === "reality");
}

function wzSaveInbound() {
  const proto  = document.getElementById("wzProtocol").value;
  const port   = parseInt(document.getElementById("wzPort").value || "0", 10);
  const listen = document.getElementById("wzListenIP").value.trim() || "0.0.0.0";
  const tag    = document.getElementById("wzTag").value.trim() || proto+"-in";
  if (!port) { alert("Port required."); return; }
  const ib = { tag, port, listen, protocol: proto, settings: {} };
  if (proto === "vless" || proto === "vmess") {
    ib.settings = proto === "vless" ? { clients: [], decryption: "none" } : { clients: [] };
    const net    = document.getElementById("wzNetwork").value;
    const tlsVal = document.getElementById("wzTLS").value;
    ib.streamSettings = { network: net };
    // Transport-specific settings
    switch (net) {
      case "ws":
        ib.streamSettings.wsSettings = { path: document.getElementById("wzWSPath").value.trim() || "/" };
        break;
      case "xhttp":
        ib.streamSettings.xhttpSettings = {
          path: document.getElementById("wzXHTTPPath").value.trim() || "/",
          host: document.getElementById("wzXHTTPHost").value.trim() || undefined,
          mode: document.getElementById("wzXHTTPMode").value,
        };
        if (!ib.streamSettings.xhttpSettings.host) delete ib.streamSettings.xhttpSettings.host;
        break;
      case "httpupgrade":
        ib.streamSettings.httpupgradeSettings = {
          path: document.getElementById("wzHUPath").value.trim() || "/",
          host: document.getElementById("wzHUHost").value.trim() || undefined,
        };
        if (!ib.streamSettings.httpupgradeSettings.host) delete ib.streamSettings.httpupgradeSettings.host;
        break;
      case "h2":
        ib.streamSettings.httpSettings = {
          path: document.getElementById("wzH2Path").value.trim() || "/",
          host: [document.getElementById("wzH2Host").value.trim()].filter(Boolean),
        };
        break;
      case "grpc":
        ib.streamSettings.grpcSettings = {
          serviceName: document.getElementById("wzGRPCService").value.trim() || "grpc",
          multiMode:   document.getElementById("wzGRPCMulti").checked,
        };
        break;
    }
    // TLS / Reality
    if (tlsVal === "tls") {
      ib.streamSettings.security = "tls";
      ib.streamSettings.tlsSettings = {
        certificates: [{ certificateFile: document.getElementById("wzTLSCert").value.trim(), keyFile: document.getElementById("wzTLSKey").value.trim() }],
      };
    } else if (tlsVal === "reality" && proto === "vless") {
      ib.streamSettings.security = "reality";
      ib.streamSettings.realitySettings = {
        dest:        document.getElementById("wzRealityDest").value.trim(),
        serverNames: [document.getElementById("wzRealitySNI").value.trim()].filter(Boolean),
        privateKey:  document.getElementById("wzRealityPriv").value.trim(),
        shortIds:    [document.getElementById("wzRealityShortID").value.trim()].filter(Boolean),
      };
    }
  } else if (proto === "trojan") {
    ib.settings = { clients: [{ password: document.getElementById("wzTrojanPass").value.trim() || "change-me" }] };
    ib.streamSettings = { network: "tcp", security: "tls", tlsSettings: {} };
  } else if (proto === "shadowsocks") {
    ib.settings = { method: document.getElementById("wzSSMethod").value, password: document.getElementById("wzSSPass").value.trim() || "change-me", network: "tcp,udp" };
  } else if (proto === "socks") {
    ib.settings = { auth: "noauth", udp: true };
    ib.streamSettings = { network: "tcp" };
  }
  wzInbounds.push(ib);
  renderWzInbounds();
  document.getElementById("wzAddInboundForm").classList.add("hidden");
  document.getElementById("wzPort").value = "";
  document.getElementById("wzTag").value  = "";
  document.getElementById("wzListenIP").value = "";
}

async function applyWizardConfig() {
  const st = document.getElementById("wzStatus");
  st.textContent = "Saving…";
  const cfg = {
    log: { loglevel: document.getElementById("wzLogLevel").value },
    inbounds: wzInbounds,
    outbounds: [
      { tag:"direct",  protocol:"freedom",  settings:{} },
      { tag:"blocked", protocol:"blackhole", settings:{} }
    ]
  };
  try {
    const res = await api("/api/xray/config", { method:"POST", body: JSON.stringify(cfg, null, 2) });
    if (!res.ok) throw new Error(await res.text());
    st.textContent = "Saved. Restarting Xray…";
    await xrayCtrl("restart");
    st.textContent = "Config saved and Xray restarted.";
  } catch (e) {
    if (e.message==="auth") doAuthError();
    else st.textContent = "Error: " + e.message;
  }
}

// ─── Auth error ───────────────────────────────────────────────────────────────
function doAuthError() {
  sessionToken = "";
  localStorage.removeItem("SESSION_TOKEN");
  clearTimers();
  mainApp.classList.add("hidden");
  loginOverlay.classList.remove("hidden");
  loginErr.textContent = "Session expired — please sign in again.";
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
window.addEventListener("load", () => {
  if (sessionToken) {
    // Try to validate the stored token
    api("/api/auth/me").then(async res => {
      if (!res.ok) { doAuthError(); return; }
      const d = await res.json();
      currentRole = d.role;
      currentUser = d.username;
      loginOverlay.classList.add("hidden");
      mainApp.classList.remove("hidden");
      initAfterLogin();
    }).catch(() => doAuthError());
  } else {
    loginOverlay.classList.remove("hidden");
  }
});
