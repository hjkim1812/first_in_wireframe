const MISSION_STATUS = {
  WAITING: "대기",
  IN_PROGRESS: "진행 중",
  PAUSED: "중지",
  ENDED: "완료",
  CANCELED: "취소",
};

const EVENT_STATUS = {
  DETECTED: "신규",
  REVIEWED: "검토됨",
  CONFIRMED: "현장 확인",
  FALSE_POSITIVE: "오탐",
  RESCUED: "구조 완료",
  UNKNOWN: "확인 불가",
};

// UI 프로토타입용 명시적 mock 계층. API 연동 시 이 객체를 repository/API 호출로 교체한다.
const mockStore = {
  controlUser: { name: "윤영은", team: "서울소방재난본부" },
  missions: [
    {
      id: "FST-2026-0721-03", code: "2814", title: "한빛물류센터 화재", location: "서울시 송파구 위례성대로 18",
      createdAt: "2026.07.21 09:36", status: "IN_PROGRESS", completion: "탐색 64%", report: "B동 2층 서편에서 연기 발생. 작업자 2명 연락 두절 추정.",
      mapVersion: "MAP v4", routeVersion: "ROUTE v7",
    },
    {
      id: "FST-2026-0720-02", code: "5931", title: "성북 복합상가 화재", location: "서울시 성북구 동소문로 99",
      createdAt: "2026.07.20 18:12", status: "ENDED", completion: "구조 완료 · 18:54", report: "지하 1층 전기실 화재 신고.",
      mapVersion: "MAP v3", routeVersion: "ROUTE v5",
    },
    {
      id: "FST-2026-0719-01", code: "7128", title: "동작구 지하주차장", location: "서울시 동작구 상도로 55",
      createdAt: "2026.07.19 14:03", status: "CANCELED", completion: "현장 출동 취소", report: "연기 오인 신고.",
      mapVersion: "MAP v1", routeVersion: "-",
    },
  ],
  robot: { name: "FIRSTIN-01", battery: 68, connection: "정상", lastHeartbeat: "1초 전", localization: "양호", temperature: 51 },
  team: { name: "송파 구조대 1팀", connection: "정상", distance: 32, next: "12m 직진 후 우회전" },
  events: [
    { id: "EVT-042", missionId: "FST-2026-0721-03", type: "PERSON_CANDIDATE", label: "인명 후보", place: "B동 2층 · 적재실 2", temp: 37.8, confidence: 82, time: "10:14:32", status: "DETECTED", severity: "critical" },
    { id: "EVT-039", missionId: "FST-2026-0721-03", type: "HEAT_SOURCE_CANDIDATE", label: "열원 후보", place: "B동 2층 · 전기실", temp: 128.4, confidence: 91, time: "10:08:17", status: "REVIEWED", severity: "warning" },
    { id: "EVT-031", missionId: "FST-2026-0721-03", type: "PERSON_CANDIDATE", label: "인명 후보", place: "B동 2층 · 복도 A", temp: 34.2, confidence: 61, time: "09:56:03", status: "FALSE_POSITIVE", severity: "muted" },
  ],
  logs: [
    { time: "10:20:16", type: "현장 보고", text: "구조대 1팀이 진입 지원 경로 v7을 수신했습니다." },
    { time: "10:18:44", type: "경로 갱신", text: "복도 A 차단 반영 · 경로 v6 → v7" },
    { time: "10:14:32", type: "신규 탐지", text: "적재실 2에서 인명 후보 EVT-042가 감지되었습니다." },
  ],
};

const EVENT_MAP_POSITIONS = {
  "EVT-042": { mapX: 590, mapY: 350, worldX: 26.0, worldY: 15.5, place: "가상 주거 평면 · 침실-1" },
  "EVT-039": { mapX: 286, mapY: 116, worldX: 10.8, worldY: 3.8, place: "가상 주거 평면 · 식당" },
  "EVT-031": { mapX: 350, mapY: 286, worldX: 14.0, worldY: 12.3, place: "가상 주거 평면 · 거실" },
};

mockStore.events.forEach((event) => Object.assign(event, EVENT_MAP_POSITIONS[event.id] || {}));

const session = {
  controlAuthenticated: false,
  sidebarCollapsed: true,
  firefighterMissionId: null,
  dashboardTab: "dashboard",
  selectedEventId: null,
  eventPopupOpen: false,
  fieldEventArmed: false,
  setupStep: 1,
  pendingCode: "",
  codeError: "",
  missionDraft: { title: "", location: "", report: "" },
  firefighterName: "",
  crewId: "",
  instructionsExpanded: false,
  pttActive: false,
  markerPlaced: true,
  positionPings: [],
  lastMarkerDragAt: 0,
  liveEventsExpanded: false,
  thermalCollapsed: false,
  rgbCollapsed: false,
  mapLayers: { base: true, slam: true, crew: true, events: true, route: true },
  selectedRecipients: ["전체 대원"],
  selectedCrew: null,
  messages: [
    { time: "10:12", text: "복도 A 차단 확인. 우측 통로로 우회하세요." },
    { time: "10:18", text: "EVT-042 인명 여부 확인 후 O/X로 보고하세요." },
  ],
};

const icons = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  shield: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 5h4M11 18h2"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/>',
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12 18.5 5.5M12 3v2M3 12h2"/>',
  alert: '<path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  robot: '<rect x="5" y="7" width="14" height="11" rx="3"/><path d="M9 11h.01M15 11h.01M9 15h6M12 7V4M10 4h4M3 12h2M19 12h2"/>',
  battery: '<rect x="3" y="7" width="17" height="10" rx="2"/><path d="M20 10h2v4h-2M6 10h8v4H6z"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M6 17c0-6 12-4 12-10"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  play: '<path d="m8 5 11 7-11 7Z"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  wifi: '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3M13 5h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  trash: '<path d="M3 6h18M8 6V3h8v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
};

function icon(name, className = "") {
  return `<svg class="icon ${className}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.grid}</svg>`;
}

function statusPill(label, tone = "neutral", pulse = false) {
  return `<span class="status-pill ${tone}">${pulse ? '<i class="pulse-dot"></i>' : ""}${label}</span>`;
}

function missionById(id) {
  return mockStore.missions.find((mission) => mission.id === id) || mockStore.missions[0];
}

function route() {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  return hash.split("?")[0];
}

function navigate(path) {
  window.location.hash = path;
}

function controlRouteGuard() {
  if (!session.controlAuthenticated) {
    navigate("/control/login");
    return false;
  }
  return true;
}

function renderRoute() {
  const current = route();
  let content = "";

  if (current === "/") content = renderRoleSelect();
  else if (current === "/control/login") content = renderControlLogin();
  else if (current === "/control/missions") content = controlRouteGuard() ? renderMissionList() : "";
  else if (current.startsWith("/control/dashboard/")) content = controlRouteGuard() ? renderControlDashboard(current.split("/").pop()) : "";
  else if (current.startsWith("/control/report/")) content = controlRouteGuard() ? renderReport(current.split("/").pop()) : "";
  else if (current === "/firefighter/code") content = renderFirefighterCodeV3();
  else if (current === "/firefighter/mission") content = session.firefighterMissionId ? renderFirefighterMissionV3(session.firefighterMissionId) : renderFirefighterCodeV3();
  else { navigate("/"); return; }

  document.getElementById("app").innerHTML = content;
  bindEvents();
}

function publicBrand() {
  return `<button class="brand public-brand" data-route="/" aria-label="FIRSTIN 시작 화면"><span class="brand-mark"><i></i><i></i><i></i></span><span><b>FIRSTIN</b><small>MISSION CONTROL</small></span></button>`;
}

function renderRoleSelect() {
  return `<main class="entry-shell">
    <header class="entry-topbar">${publicBrand()}<span class="entry-status">${icon("wifi")} 로컬 네트워크 연결됨</span></header>
    <section class="role-hero">
      <p class="eyebrow">FIRSTIN ACCESS</p>
      <h1>역할을 선택하세요</h1>
      <p>선택한 역할에 필요한 기능과 임무 정보만 안전하게 제공합니다.</p>
      <div class="role-cards">
        <button class="role-card control" data-route="/control/login"><span class="role-icon">${icon("shield")}</span><div><small>CONTROL</small><h2>관제</h2><p>로그인 후 임무를 생성하고, 로봇과 현장 상황을 통합 관제합니다.</p></div><footer><span>관제 로그인</span>${icon("arrow")}</footer></button>
        <button class="role-card firefighter" data-route="/firefighter/code"><span class="role-icon">${icon("phone")}</span><div><small>FIREFIGHTER</small><h2>대원</h2><p>임무 코드를 입력해 배정된 임무의 지도, 경로와 현장 보고 기능을 확인합니다.</p></div><footer><span>임무 코드 입력</span>${icon("arrow")}</footer></button>
      </div>
      <p class="entry-note">대원은 인증된 임무의 데이터만 조회할 수 있습니다.</p>
    </section>
  </main>`;
}

function renderControlLogin() {
  return `<main class="entry-shell control-login-shell">
    <header class="entry-topbar">${publicBrand()}<button class="text-button" data-route="/">${icon("back")} 역할 선택으로</button></header>
    <section class="auth-card">
      <span class="auth-icon">${icon("lock")}</span>
      <p class="eyebrow">CONTROL ACCESS</p><h1>관제 로그인</h1><p>관제 기능은 인증된 사용자만 접근할 수 있습니다.</p>
      <form id="control-login-form" class="auth-form">
        <label><span>관제 ID</span><input name="userId" value="operator.firstin" required /></label>
        <label><span>비밀번호</span><input name="password" type="password" value="firstin" required /></label>
        <button class="button primary full" type="submit">로그인 ${icon("arrow")}</button>
      </form>
      <small class="mock-note">프로토타입에서는 입력값과 관계없이 로그인됩니다.</small>
    </section>
  </main>`;
}

function controlShell(mission, body) {
  const tabs = [["dashboard", "관제 대시보드", "grid"]];
  return `<div class="app-shell ${session.sidebarCollapsed ? "sidebar-collapsed" : ""}">
    <aside class="sidebar">
      ${publicBrand()}
      <div class="control-mission-mini"><small>현재 임무</small><b>${mission.title}</b><span>${statusPill(MISSION_STATUS[mission.status], "success", true)}</span></div>
      <nav class="main-nav" aria-label="관제 메뉴">
        <p class="nav-label">관제</p>
        ${tabs.map(([id, label, iconName]) => `<button class="nav-item ${session.dashboardTab === id ? "active" : ""}" data-dashboard-tab="${id}">${icon(iconName)}<span>${label}</span>${id === "events" ? '<span class="nav-count">2</span>' : ""}</button>`).join("")}
        <p class="nav-label nav-label-spaced">임무</p>
        <button class="nav-item" data-route="/control/missions">${icon("file")}<span>임무 목록</span></button>
      </nav>
      <div class="sidebar-foot"><button class="profile" data-action="logout"><span class="avatar">윤</span><span><b>${mockStore.controlUser.name} 관제원</b><small>${mockStore.controlUser.team}</small></span>${icon("logout")}</button></div>
    </aside>
    <main class="main-area"><header class="topbar"><div class="topbar-leading"><button class="sidebar-toggle" data-action="toggle-sidebar" aria-label="내비게이션 ${session.sidebarCollapsed ? "펼치기" : "접기"}" aria-expanded="${!session.sidebarCollapsed}">${icon("menu")}</button><div class="breadcrumb"><button class="text-button" data-route="/control/missions">전체목록</button>${icon("chevron")}<b>현재 임무</b></div></div><div class="topbar-actions"><span class="current-time" id="current-time"></span><span class="mission-elapsed"><small>경과 시간</small><b>00:44:18</b></span><button class="code-badge" data-action="copy-code" title="임무 코드 복사"><span>임무 코드</span><b>${mission.code}</b>${icon("copy")}</button><button class="icon-button" data-action="notify" aria-label="알림">${icon("bell")}<i class="notification-dot"></i></button><button class="button danger mission-end" data-action="end-mission">임무 종료</button></div></header><div class="page figma-control-page">${body}</div></main>
  </div>`;
}

function renderMissionList() {
  const active = mockStore.missions.filter((mission) => mission.status === "IN_PROGRESS");
  const others = mockStore.missions.filter((mission) => mission.status !== "IN_PROGRESS");
  return `<main class="missions-shell">
    <header class="missions-topbar">${publicBrand()}<div><span>${mockStore.controlUser.name} 관제원</span><button class="text-button" data-action="logout">로그아웃 ${icon("logout")}</button></div></header>
    <section class="missions-page">
      <div class="page-heading"><div><p class="eyebrow">CONTROL · MISSION LIST</p><h1>임무 목록</h1><p>관제할 임무를 선택하거나 새 임무를 생성하세요.</p></div><span class="missions-count">전체 ${mockStore.missions.length}개</span></div>
      <section class="mission-section"><div class="section-label"><span class="live-label"><i></i> 진행 중</span><b>${active.length}개</b></div><div class="mission-list">${active.map(missionCard).join("")}</div></section>
      <section class="mission-section"><div class="section-label"><span>종료된 임무</span><b>${others.length}개</b></div><div class="mission-list muted-list">${others.map(missionCard).join("")}</div></section>
      <button class="mission-fab" data-action="new-mission">${icon("plus")}<span>새 임무 생성</span></button>
      ${session.setupStep ? "" : ""}
    </section>
    ${session.creating ? renderMissionCreateModal() : ""}
  </main>`;
}

function missionCard(mission) {
  const live = mission.status === "IN_PROGRESS";
  const tone = live ? "success" : mission.status === "CANCELED" ? "neutral" : "warning";
  return `<button class="mission-card ${live ? "active-mission" : "closed-mission"}" data-mission-select="${mission.id}"><div class="mission-card-top"><span class="mission-id">${mission.id}</span>${statusPill(MISSION_STATUS[mission.status], tone, live)}</div><h2>${mission.title}</h2><p>${icon("map")} ${mission.location}</p><div class="mission-card-bottom"><span>${icon("clock")} ${mission.createdAt}</span><b>${mission.completion}</b>${icon("chevron")}</div></button>`;
}

function renderMissionCreateModal() {
  const step = session.setupStep;
  return `<div class="modal-backdrop"><section class="create-modal" role="dialog" aria-modal="true" aria-label="새 임무 생성">
    <header><div><p class="eyebrow">C-MIS-03</p><h2>새 임무 생성</h2></div><button class="icon-button" data-action="close-create">${icon("close")}</button></header>
    <div class="create-steps"><span class="${step >= 1 ? "active" : ""}">1. 신고 정보</span><i></i><span class="${step >= 2 ? "active" : ""}">2. 도면·초기 위치</span><i></i><span class="${step >= 3 ? "active" : ""}">3. 코드 발급</span></div>
    ${step === 1 ? `<form id="mission-draft-form" class="create-form"><label><span>임무명</span><input name="title" value="${session.missionDraft.title}" placeholder="예: 한빛물류센터 화재" required /></label><label><span>화재 위치</span><input name="location" value="${session.missionDraft.location}" placeholder="주소 또는 현장명" required /></label><label><span>신고 내용</span><textarea name="report" rows="4" placeholder="현장에 확인된 신고 내용을 입력하세요." required>${session.missionDraft.report}</textarea></label><footer><button class="button secondary" type="button" data-action="close-create">취소</button><button class="button primary" type="submit">다음 ${icon("arrow")}</button></footer></form>` : ""}
    ${step === 2 ? `<div class="create-map-step"><div class="create-map">${renderMap("setup")}</div><div class="setup-summary"><b>도면·초기 위치</b><p>기존 C-MAP / C-LOC 화면 구성요소를 사용합니다.</p><div><span>도면 버전</span><b>MAP v1</b></div><div><span>초기 위치</span><b>x 12.4 · y 8.8 · yaw 90°</b></div></div><footer><button class="button secondary" data-action="create-back">이전</button><button class="button primary" data-action="issue-code">코드 발급 ${icon("arrow")}</button></footer></div>` : ""}
    ${step === 3 ? `<div class="issued-code-step"><span class="issued-icon">${icon("check")}</span><p class="eyebrow">MISSION CREATED</p><h3>대원 참가 코드를 발급했습니다</h3><div class="issued-code">${session.issuedCode}</div><p>이 코드를 오프라인으로 전달하면 대원이 해당 임무에만 참여할 수 있습니다.</p><footer><button class="button primary full" data-action="open-new-dashboard">관제 대시보드로 이동 ${icon("arrow")}</button></footer></div>` : ""}
  </section></div>`;
}

function renderControlDashboard(id) {
  const mission = missionById(id);
  const content = { dashboard: renderOperations }[session.dashboardTab] || renderOperations;
  return controlShell(mission, content(mission));
}

function renderDashboardOverview(mission) {
  return `${pageHeading("MISSION OVERVIEW", mission.title, `${mission.location} · ${mission.createdAt} 생성`, `<button class="button secondary" data-dashboard-tab="operations">${icon("map")} 현장 관제</button><button class="button primary" data-dashboard-tab="events">${icon("radar")} 탐지 후보 2건</button>`)}
    <section class="summary-strip">${metricCard("임무 상태", MISSION_STATUS[mission.status], "로봇 ACK 수신", "shield", "green")}${metricCard("탐색 진행률", "64%", "+8% 최근 10분", "radar", "cyan")}${metricCard("검토 필요", "2건", "인명 후보 1 · 열원 후보 1", "alert", "orange")}${metricCard("로봇 배터리", "68%", "예상 운용 42분", "battery", "green")}</section>
    <section class="dashboard-grid"><article class="panel map-panel overview-map"><div class="panel-head"><div><p class="panel-kicker">LIVE MAP</p><h2>B동 2층 통합 지도</h2></div><div class="head-meta">${statusPill(mission.mapVersion, "neutral")}<span>10:20:15 갱신</span></div></div>${renderMap("overview")}<div class="map-legend"><span><i class="legend robot"></i>로봇</span><span><i class="legend person"></i>인명 후보</span><span><i class="legend heat"></i>열원 후보</span><span><i class="legend block"></i>차단 통로</span></div><button class="map-open" data-dashboard-tab="operations">전체 화면 관제 ${icon("arrow")}</button></article>
    <aside class="right-stack"><article class="panel robot-card"><div class="panel-head compact"><div><p class="panel-kicker">ROBOT</p><h2>${mockStore.robot.name}</h2></div>${statusPill(mockStore.robot.connection, "success", true)}</div><div class="robot-illustration"><div class="robot-body"><span></span><i></i><b></b></div><div class="scan-line"></div></div><div class="robot-stats"><div><span>운용 모드</span><b>자율 탐색</b></div><div><span>위치 품질</span><b>양호 · 96%</b></div><div><span>마지막 통신</span><b>${mockStore.robot.lastHeartbeat}</b></div><div><span>내부 온도</span><b>${mockStore.robot.temperature}°C</b></div></div><button class="button ghost full" data-dashboard-tab="operations">로봇 제어 열기 ${icon("chevron")}</button></article><article class="panel activity-card"><div class="panel-head compact"><div><p class="panel-kicker">ACTIVITY</p><h2>최근 활동</h2></div></div><div class="activity-list">${mockStore.logs.map(activityItem).join("")}</div></article></aside></section>
    <section class="panel event-preview"><div class="panel-head"><div><p class="panel-kicker">DETECTION QUEUE</p><h2>검토 대기 탐지 후보</h2></div><button class="text-button" data-dashboard-tab="events">모든 이벤트 ${icon("arrow")}</button></div><div class="event-cards">${missionEvents(mission.id).slice(0, 2).map(eventCard).join("")}</div></section>`;
}

function metricCard(label, value, detail, iconName, tone) { return `<article class="metric-card ${tone}"><div class="metric-icon">${icon(iconName)}</div><div><span>${label}</span><strong>${value}</strong><small>${detail}</small></div></article>`; }
function activityItem(log) { return `<div class="activity"><i></i><time>${log.time}</time><div><b>${log.type}</b><p>${log.text}</p></div></div>`; }
function missionEvents(id) { return mockStore.events.filter((event) => event.missionId === id); }
function eventCard(event) { const tone = event.severity === "critical" ? "danger" : "warning"; return `<button class="event-card" data-event-select="${event.id}"><span class="event-symbol ${tone}">${icon(event.type === "PERSON_CANDIDATE" ? "radar" : "alert")}</span><span class="event-main"><span>${event.label} · ${event.id}</span><b>${event.place}</b><small>${event.time} · ${event.temp}°C · 신뢰도 ${event.confidence}%</small></span>${statusPill(EVENT_STATUS[event.status], tone)}${icon("chevron")}</button>`; }

function renderOperations(mission) {
  const events = missionEvents(mission.id);
  const rightPanelState = [session.thermalCollapsed ? "thermal-collapsed" : "", session.rgbCollapsed ? "rgb-collapsed" : "", session.liveEventsExpanded ? "events-expanded" : ""].filter(Boolean).join(" ");
  const hiddenLayerClasses = Object.entries(session.mapLayers).filter(([, visible]) => !visible).map(([layerId]) => `hide-layer-${layerId}`).join(" ");
  return `<section class="operations-layout requirements-layout"><article class="panel map-panel operations-map ${hiddenLayerClasses}">${renderMap("operations")}${renderMapHud()}${renderCrewMessageOverlay()}<div class="layer-control interactive-layer-control"><p>컴포넌트 레이어</p>${layer("base", "기본 도면", "#707984")}${layer("slam", "SLAM 진행", "#38bdf8")}${layer("crew", "대원 위치", "#f4f6f5")}${layer("events", "이벤트 마커", "#ff7043")}${layer("route", "진입·복귀 경로", "#f59e0b")}</div></article>
  <aside class="ops-right requirements-right ${rightPanelState}"><article class="panel video-panel stream-panel ${session.thermalCollapsed || session.liveEventsExpanded ? "collapsed" : ""}"><div class="panel-head compact"><div><h2>열화상 스트리밍</h2></div><div class="stream-panel-actions">${statusPill("연결됨", "success", true)}<button class="chevron-toggle ${session.thermalCollapsed || session.liveEventsExpanded ? "" : "open"}" data-action="toggle-thermal" aria-label="열화상 패널 ${session.thermalCollapsed || session.liveEventsExpanded ? "확장" : "축소"}">›</button></div></div><div class="thermal-feed"><div class="thermal-person"></div><span class="vision-box"><b>PERSON 82%</b></span><div class="thermal-scale"><span>130°</span><i></i><span>20°</span></div><span class="crosshair"></span><small>CAM-T01 · 9 FPS · 10:20:16</small></div></article>
  <article class="panel video-panel stream-panel ${session.rgbCollapsed || session.liveEventsExpanded ? "collapsed" : ""}"><div class="panel-head compact"><div><h2>RGB 카메라 스트리밍</h2></div><div class="stream-panel-actions">${statusPill("연결됨", "success", true)}<button class="chevron-toggle ${session.rgbCollapsed || session.liveEventsExpanded ? "" : "open"}" data-action="toggle-rgb" aria-label="RGB 패널 ${session.rgbCollapsed || session.liveEventsExpanded ? "확장" : "축소"}">›</button></div></div><div class="rgb-feed"><div class="rgb-smoke"></div><span class="rgb-reticle"></span><small>CAM-R01 · 24 FPS · 10:20:16</small></div></article>
  <article class="panel live-events ${session.liveEventsExpanded ? "expanded" : ""}"><div class="panel-head compact"><div><h2>탐지 이벤트 ${events.length}건</h2></div><button class="chevron-toggle ${session.liveEventsExpanded ? "open" : ""}" data-action="toggle-live-events" aria-label="탐지 이벤트 패널 ${session.liveEventsExpanded ? "축소" : "확장"}">›</button></div><div class="live-event-scroll">${events.map((event) => `<button class="mini-event ${event.status === "DETECTED" ? "unreviewed" : ""} ${session.selectedEventId === event.id ? "selected" : ""}" data-event-select="${event.id}"><i class="${event.severity}"></i><div><b>${event.label}</b><span>${event.place}</span><small>${event.time} · 신뢰도 ${event.confidence}%</small></div>${statusPill(EVENT_STATUS[event.status], event.status === "DETECTED" ? "danger" : "neutral")}</button>`).join("")}</div></article></aside></section>${renderEventPopup()}`;
}

function renderMapHudLegacy() {
  const selectedEvent = mockStore.events.find((event) => event.id === session.selectedEventId);
  const eventFocus = selectedEvent ? `<div class="event-map-focus ${selectedEvent.type === "PERSON_CANDIDATE" ? "person" : "heat"}"><span></span><div><b>${selectedEvent.label}</b><small>${selectedEvent.id}</small><button data-action="open-event-popup">보기</button></div></div>` : "";
  return `<div class="robot-map-battery">${icon("battery")}<span>${mockStore.robot.battery}%</span></div><button class="crew-map-marker crew-map-one ${session.selectedCrew?.id === "F-01" ? "selected" : ""}" data-crew-select="F-01" data-crew-name="김대원"><span>김</span><small>김대원</small></button><button class="crew-map-marker crew-map-two ${session.selectedCrew?.id === "F-02" ? "selected" : ""}" data-crew-select="F-02" data-crew-name="이대원"><span>이</span><small>이대원</small></button>${eventFocus}`;
}

function renderCrewMessageOverlay() {
  if (!session.selectedCrew) return "";
  return `<form id="dispatch-form" class="map-message-overlay"><div class="map-message-head"><div><span class="crew-avatar">${session.selectedCrew.name[0]}</span><p><b>${session.selectedCrew.name}</b><small>${session.selectedCrew.id} · 연결됨</small></p></div><button type="button" data-action="close-crew-message" aria-label="메시지 창 닫기">${icon("close")}</button></div><div class="dispatch-compose"><textarea name="message" rows="2" placeholder="${session.selectedCrew.name} 대원에게 보낼 지시를 입력하세요." required></textarea><button class="button primary" type="submit">전송 ${icon("arrow")}</button></div></form>`;
}

function renderEventPopupLegacy() {
  if (!session.eventPopupOpen || !session.selectedEventId) return "";
  const event = mockStore.events.find((item) => item.id === session.selectedEventId);
  if (!event) return "";
  const tone = event.type === "PERSON_CANDIDATE" ? "danger" : "warning";
  return `<div class="event-modal-backdrop"><section class="event-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title"><header><div><div class="event-modal-tags">${statusPill(event.label, tone)}${statusPill(EVENT_STATUS[event.status], "neutral")}</div><h2 id="event-modal-title">${event.id} 탐지 상세정보</h2><p>${event.place}</p></div><button class="icon-button" data-action="close-event-popup" aria-label="탐지 상세정보 닫기">${icon("close")}</button></header><div class="event-modal-media"><article><h3>열화상 캡처</h3><div class="thermal-feed event-capture"><div class="thermal-person"></div><span class="vision-box"><b>${event.type === "PERSON_CANDIDATE" ? "PERSON" : "HEAT"} ${event.confidence}%</b></span><div class="thermal-scale"><span>130°</span><i></i><span>20°</span></div><small>THERMAL · ${event.time}</small></div></article><article><h3>RGB 카메라 캡처</h3><div class="rgb-feed event-capture"><div class="rgb-smoke"></div><span class="rgb-reticle"></span><small>RGB · ${event.time}</small></div></article></div><dl class="event-modal-data"><div><dt>신뢰도</dt><dd>${event.confidence}%</dd></div><div><dt>최고 온도</dt><dd>${event.temp}°C</dd></div><div><dt>감지 시각</dt><dd>${event.time}</dd></div><div><dt>지도 위치</dt><dd>x 24.8 · y 12.1</dd></div><div><dt>감지 유형</dt><dd>${event.label}</dd></div><div><dt>이벤트 상태</dt><dd>${EVENT_STATUS[event.status]}</dd></div></dl><footer><button class="button secondary" data-action="request-crew-route">요원 경로 생성</button><button class="button secondary" data-action="request-exit-route">출입구 경로 생성</button><button class="button danger" data-action="mark-detection-error">탐지 오류</button></footer></section></div>`;
}

function layer(id, label, color) { return `<label class="layer-row"><input type="checkbox" data-map-layer="${id}" ${session.mapLayers[id] ? "checked" : ""}/><i style="--layer-color:${color}"></i><span>${label}</span></label>`; }

function renderEvents(mission) {
  const events = missionEvents(mission.id); const selected = events.find((event) => event.id === session.selectedEventId) || events[0];
  return `${pageHeading("DETECTION EVENTS", "탐지 후보 검토", "AI 탐지 결과는 인명 또는 열원의 후보이며, 관제원과 현장대원의 확인을 거쳐 상태를 변경합니다.")}
    <div class="safety-banner">${icon("shield")}<p><b>판단 지원 정보</b> 탐지 결과만으로 사람의 존재, 신원 또는 생존 여부를 확정하지 않습니다.</p></div>
    <section class="events-layout"><article class="panel event-list-panel"><div class="filter-bar"><div class="filter-tabs"><button class="active">전체 <span>${events.length}</span></button><button>검토 필요 <span>2</span></button></div><span class="filter-caption">${mission.id}</span></div><div class="event-table"><div class="event-row header"><span>이벤트</span><span>위치</span><span>감지 정보</span><span>상태</span></div>${events.map((event) => eventRow(event, selected)).join("")}</div></article><aside class="panel event-detail">${renderEventDetail(selected)}</aside></section>`;
}

function eventRow(event, selected) { const tone = event.severity === "critical" ? "danger" : event.severity === "warning" ? "warning" : "neutral"; return `<button class="event-row ${selected.id === event.id ? "selected" : ""}" data-event-select="${event.id}"><span><i class="event-type-dot ${event.severity}"></i><b>${event.label}</b><small>${event.id} · ${event.time}</small></span><span>${event.place}</span><span><b>${event.temp}°C</b><small>신뢰도 ${event.confidence}%</small></span><span>${statusPill(EVENT_STATUS[event.status], tone)}</span></button>`; }
function renderEventDetail(event) { return `<div class="detail-head"><div><span>${event.label}</span><h2>${event.id}</h2></div></div><div class="event-image ${event.type === "PERSON_CANDIDATE" ? "person-image" : "heat-image"}"><span class="focus-box"></span><div><b>${event.temp}°C</b><small>탐지 영역 최고 온도</small></div><p>THERMAL · ${event.time}</p></div><div class="detail-section"><h3>탐지 정보</h3><dl><div><dt>후보 유형</dt><dd>${event.label}</dd></div><div><dt>위치</dt><dd>${event.place}</dd></div><div><dt>신뢰도</dt><dd>${event.confidence}%</dd></div><div><dt>지도 좌표</dt><dd>x 24.8 · y 12.1</dd></div></dl></div><div class="detail-section"><h3>상태 이력</h3><div class="timeline"><span class="complete"></span><div><b>탐지됨</b><small>${event.time} · FIRSTIN-01</small></div><span class="current"></span><div><b>${EVENT_STATUS[event.status]}</b><small>현재 상태</small></div></div></div><div class="detail-actions"><button class="button secondary" data-action="mark-false">오탐으로 처리</button><button class="button primary" data-action="request-route">${icon("route")} 진입 경로 요청</button></div>`; }

function renderReport(id) {
  const mission = missionById(id);
  return `<main class="report-route-page"><div class="report-modal"><button class="icon-button report-close" data-route="/control/missions">${icon("close")}</button><span class="report-icon">${icon("file")}</span><p class="eyebrow">MISSION REPORT · PLACEHOLDER</p><h1>${mission.title}</h1><p>${mission.createdAt} · ${mission.location}</p><div class="report-status">${statusPill(MISSION_STATUS[mission.status], mission.status === "ENDED" ? "success" : "neutral")}</div><div class="report-placeholder"><b>요약 리포트</b><p>완료된 임무의 탐색 결과, 탐지 이벤트, 현장 보고와 로그를 제공하는 화면입니다. 이번 작업에서는 요구사항에 따라 Placeholder로 구현했습니다.</p></div><button class="button primary" data-route="/control/missions">임무 목록으로 ${icon("arrow")}</button></div></main>`;
}

function renderFirefighterCode() {
  const digits = [0, 1, 2, 3].map((index) => `<span class="pin-slot ${session.pendingCode[index] ? "filled" : ""}">${session.pendingCode[index] || ""}</span>`).join("");
  return `<main class="entry-shell firefighter-code-shell"><header class="entry-topbar">${publicBrand()}<button class="text-button" data-route="/">${icon("back")} 역할 선택으로</button></header><section class="pin-card"><span class="auth-icon field-auth-icon">${icon("phone")}</span><p class="eyebrow">FIREFIGHTER ACCESS</p><h1>임무 코드를 입력하세요</h1><p>관제원에게 전달받은 4자리 코드로 해당 임무에 참여합니다.</p><div class="pin-slots" aria-label="4자리 임무 코드">${digits}</div>${session.codeError ? `<p class="pin-error">${icon("alert")} ${session.codeError}</p>` : ""}<div class="keypad">${[1,2,3,4,5,6,7,8,9].map((number) => `<button data-key="${number}">${number}</button>`).join("")}<button class="key-empty" disabled></button><button data-key="0">0</button><button class="key-delete" data-action="delete-code" aria-label="한 글자 삭제">⌫</button></div><small class="mock-note">데모 코드: <b>${mockStore.missions.find((mission) => mission.status === "IN_PROGRESS").code}</b></small></section></main>`;
}

function renderFirefighterMission(id) {
  const mission = missionById(id);
  return `<main class="field-access-shell"><header class="field-access-head">${publicBrand()}<div><span>${statusPill("임무 연결됨", "success", true)}</span><button class="text-button" data-action="leave-field">나가기 ${icon("logout")}</button></div></header><section class="field-access-page"><div class="field-mission-meta"><p class="eyebrow">FIREFIGHTER MISSION</p><h1>${mission.title}</h1><p>${mission.location} · ${mission.id}</p><span class="field-code-locked">${icon("lock")} 인증된 임무 데이터만 표시</span></div><div class="field-preview-layout"><div class="phone-frame"><div class="phone-speaker"></div><div class="mobile-screen"><header class="mobile-head"><div><small>${mission.id}</small><b>B동 2층 진입</b></div><span>${icon("wifi")} 정상</span></header><div class="mobile-alert"><span>${icon("alert")}</span><div><b>경로가 변경되었습니다</b><small>복도 A 차단 반영 · ${mission.routeVersion}</small></div></div><div class="mobile-map">${renderMap("mobile")}</div><div class="direction-card"><span class="direction-arrow">↱</span><div><small>다음 이동</small><strong>${mockStore.team.next}</strong><p><b>${mockStore.team.distance}m</b> 남음 · 예상 2분</p></div></div><div class="mobile-route-tabs"><button class="active">진입 경로</button><button>복귀 경로</button></div><div class="field-report-grid"><button data-report="ARRIVED_AT_TARGET">${icon("route")}<span>지점 도착</span></button><button data-report="PERSON_CONFIRMED">${icon("radar")}<span>인명 확인</span></button><button data-report="ROUTE_BLOCKED">${icon("alert")}<span>경로 차단</span></button><button data-report="RESCUE_COMPLETED">${icon("check")}<span>구조 완료</span></button></div><nav class="mobile-nav"><button class="active">${icon("map")}<span>지도</span></button><button>${icon("radar")}<span>후보</span><i>2</i></button><button>${icon("bell")}<span>보고</span></button></nav></div></div><aside class="field-notes"><article class="panel"><p class="panel-kicker">MISSION ACCESS</p><h2>현재 임무</h2><dl class="field-data-list"><div><dt>참가 코드</dt><dd>${mission.code}</dd></div><div><dt>지도 버전</dt><dd>${mission.mapVersion}</dd></div><div><dt>경로 버전</dt><dd>${mission.routeVersion}</dd></div><div><dt>미전송 보고</dt><dd>0건</dd></div></dl></article><article class="panel field-access-note">${icon("shield")}<div><b>현장 대원 권한</b><p>지도·탐지 후보·진입 경로 확인 및 현장 보고만 가능합니다. 관제, 로봇 제어, 임무 생성 기능은 제공하지 않습니다.</p></div></article></aside></div></section></main>`;
}

function renderFirefighterCodeV3() {
  const activeMission = mockStore.missions.find((mission) => mission.status === "IN_PROGRESS");
  const digits = [0, 1, 2, 3].map((index) => `<span class="pin-slot ${session.pendingCode[index] ? "filled" : ""}">${session.pendingCode[index] || ""}</span>`).join("");
  return `<main class="entry-shell firefighter-code-shell landscape-code-shell"><header class="entry-topbar firefighter-code-topbar">${publicBrand()}<button class="text-button" data-route="/">${icon("back")} 역할 선택으로</button></header><section class="landscape-code-card"><div class="code-intro"><span class="auth-icon field-auth-icon">${icon("phone")}</span><div><h1>임무에 접속하세요</h1><p>대원 이름과 관제에서 전달받은 4자리 임무 코드를 입력하세요.</p></div><label class="firefighter-name"><span>대원 이름</span><input id="firefighter-name" value="${session.firefighterName}" maxlength="12" placeholder="예: 김대원" autocomplete="name"></label><small class="mock-note">접속 순서에 따라 대원 식별자가 자동 발급됩니다.</small></div><div class="code-entry-panel"><div class="code-entry-head"><div><b>임무 코드</b><small>숫자 4자리</small></div><div class="pin-slots" aria-label="4자리 임무 코드">${digits}</div></div>${session.codeError ? `<p class="pin-error">${icon("alert")} ${session.codeError}</p>` : ""}<div class="keypad landscape-keypad">${[1,2,3,4,5,6,7,8,9].map((number) => `<button data-key="${number}">${number}</button>`).join("")}<button class="key-empty" disabled></button><button data-key="0">0</button><button class="key-delete" data-action="delete-code" aria-label="마지막 숫자 삭제">⌫</button></div><small class="demo-code">데모 코드 <b>${activeMission.code}</b></small></div></section></main>`;
}

function renderFirefighterMissionV3Legacy(id) {
  const mission = missionById(id);
  return `<main class="field-access-shell"><header class="field-access-head">${publicBrand()}<div><span>${statusPill("임무 연결됨", "success", true)}</span><b class="crew-identity">${session.firefighterName} · ${session.crewId}</b><button class="text-button" data-action="leave-field">나가기 ${icon("logout")}</button></div></header><section class="field-access-page"><div class="field-mission-meta"><p class="eyebrow">FIREFIGHTER MISSION</p><h1>${mission.title}</h1><p>${mission.location} · ${mission.id}</p><span class="field-code-locked">${icon("lock")} 인증된 임무 데이터만 표시</span></div><div class="field-preview-layout"><div class="phone-frame requirements-phone"><div class="phone-speaker"></div><div class="mobile-screen"><header class="mobile-head"><div><small>${mission.id}</small><b>${session.firefighterName} · ${session.crewId}</b></div><span>${icon("wifi")} 정상</span></header><div class="mobile-alert"><span>${icon("alert")}</span><div><b>경로가 변경되었습니다</b><small>복도 A 차단 반영 · ${mission.routeVersion}</small></div></div><div class="mobile-map">${renderMap("mobile")}${session.markerPlaced ? '<button class="marker-trash" data-action="delete-marker">휴지통에 놓아 삭제</button>' : ''}<button class="place-marker" data-action="place-marker">${icon("plus")} 위치 핑</button></div><div class="field-instructions ${session.instructionsExpanded ? "expanded" : ""}"><button data-action="toggle-instructions"><span>${icon("bell")} 관제 지시 ${session.messages.length}건</span><b>${session.instructionsExpanded ? "접기" : "펼치기"}</b></button><div>${session.messages.map((message) => `<p><time>${message.time}</time>${message.text}</p>`).join("")}</div></div><div class="event-verification"><b>EVT-042 인명·열원 확인</b><div><button data-action="confirm-person">O 인명 확인</button><button data-action="reject-person">X 오탐</button><button data-action="unknown-event">확인 불가</button></div></div><div class="field-action-row"><button class="ptt-button ${session.pttActive ? "active" : ""}" data-action="toggle-ptt">${icon("wifi")}<span>${session.pttActive ? "송신 중 · 눌러 종료" : "눌러서 관제와 통화"}</span></button><button data-report="ROUTE_BLOCKED">${icon("alert")} 경로 차단</button></div><nav class="mobile-nav"><button class="active">${icon("map")}<span>지도</span></button><button>${icon("radar")}<span>후보</span><i>2</i></button><button>${icon("bell")}<span>보고</span></button></nav></div></div><aside class="field-notes"><article class="panel"><p class="panel-kicker">MISSION ACCESS</p><h2>현재 임무</h2><dl class="field-data-list"><div><dt>대원 식별자</dt><dd>${session.crewId}</dd></div><div><dt>지도 버전</dt><dd>${mission.mapVersion}</dd></div><div><dt>경로 버전</dt><dd>${mission.routeVersion}</dd></div><div><dt>WebRTC</dt><dd>${session.pttActive ? "음성 송신 중" : "연결됨 · 음소거"}</dd></div></dl></article><article class="panel field-access-note">${icon("shield")}<div><b>현장 대원 권한</b><p>지도·탐지 후보·진입 경로 확인, 위치 핑과 O/X 판정, 관제 지시 확인 및 PTT 통화가 가능합니다.</p></div></article></aside></div></section></main>`;
}

function renderFirefighterMissionV3Base(id) {
  const mission = missionById(id);
  const latestInstruction = session.messages[session.messages.length - 1];
  return `<main class="field-mobile-landscape"><header class="field-landscape-head"><div class="field-head-identity"><b>${session.firefighterName} · ${session.crewId}</b><span>${icon("wifi")} 임무 연결됨</span></div><div class="field-head-time"><span>현재 시각 <b id="current-time"></b></span><span>경과 시간 <b>00:44:18</b></span></div><div class="field-head-meta"><small>${mission.mapVersion} · ${mission.routeVersion}</small><button class="field-end-button" data-action="leave-field">종료</button></div></header><section class="field-landscape-body"><div class="field-map-column"><div class="field-live-map">${renderMap("mobile")}<div class="field-route-alert">${icon("alert")}<div><b>경로가 변경되었습니다</b><small>복도 차단 반영 · ${mission.routeVersion}</small></div></div><div class="field-next-route"><small>다음 이동</small><b>${mockStore.team.next}</b><span>${mockStore.team.distance}m 남음</span></div><button class="field-position-ping ${session.markerPlaced ? "active" : ""}" data-action="${session.markerPlaced ? "delete-marker" : "place-marker"}">${icon(session.markerPlaced ? "close" : "plus")} ${session.markerPlaced ? "위치 핑 제거" : "위치 핑"}</button></div><div class="field-command-bar"><div class="field-landscape-instructions ${session.instructionsExpanded ? "expanded" : ""}"><button data-action="toggle-instructions">${icon("bell")}<span><b>관제 지시 ${session.messages.length}건</b><small>${latestInstruction?.text || "새 지시 없음"}</small></span><i>${session.instructionsExpanded ? "접기" : "보기"}</i></button><div class="instruction-popover">${session.messages.map((message) => `<p><time>${message.time}</time><span>${message.text}</span></p>`).join("")}</div></div><button class="field-ptt ${session.pttActive ? "active" : ""}" data-action="toggle-ptt">${icon("wifi")}<span>${session.pttActive ? "송신 중" : "무전"}</span></button></div></div><aside class="field-decision-rail"><div class="field-decision-title"><b>EVT-042</b><span>인명 후보 확인</span></div><button class="field-decision yes" data-action="confirm-person"><strong>O</strong><span>인명 확인</span></button><button class="field-decision no" data-action="reject-person"><strong>X</strong><span>오탐</span></button><div class="field-decision-secondary"><button data-action="unknown-event">확인 불가</button><button data-report="ROUTE_BLOCKED">${icon("alert")}<span>경로 차단</span></button></div></aside></section></main>`;
}

function renderFirefighterMissionV3(id) {
  let html = renderFirefighterMissionV3Base(id)
    .replace("<span>인명 후보 확인</span>", `<span>${session.fieldEventArmed ? "판정 활성화됨" : "지도에서 인명 후보를 선택하세요"}</span>`)
    .replace("<span>오탐</span>", "<span>인명 확인 불가</span>")
    .replace('<button data-action="unknown-event">확인 불가</button>', "");

  html = html
    .replace('<main class="field-mobile-landscape">', `<main class="field-mobile-landscape"><div class="field-marker-trash" id="field-marker-trash">${icon("trash")}<b>마커 삭제</b><span>여기에 놓아 삭제</span></div>`)
    .replace(/<button class="field-position-ping[\s\S]*?<\/button>/, '<div class="field-position-hint">지도를 터치해 현재 위치 기록</div>');

  if (!session.fieldEventArmed) {
    html = html
      .replace('class="field-decision yes"', 'class="field-decision yes" disabled aria-disabled="true"')
      .replace('class="field-decision no"', 'class="field-decision no" disabled aria-disabled="true"')
      .replace('data-report="ROUTE_BLOCKED"', 'data-report="ROUTE_BLOCKED" disabled aria-disabled="true"');
  }

  return html;
}

function renderMapLegacy(variant) {
  const compact = variant === "mobile";
  return `<div class="map-canvas map-${variant}"><svg viewBox="0 0 760 480" role="img" aria-label="한빛물류센터 B동 2층 지도"><defs><pattern id="grid-${variant}" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="currentColor" stroke-width=".6"/></pattern></defs><rect width="760" height="480" class="map-grid-bg" fill="url(#grid-${variant})"/><g class="floor-plan"><path d="M77 62H681V405H77Z"/><path d="M77 169h142V62M219 62v217H77M219 169h205V62M424 62v107h257M424 169v110H219M424 279h257M553 279v126M219 279v126M77 344h142M553 169v110"/><path class="door" d="M185 169a34 34 0 0 1 34-34M424 240a39 39 0 0 0-39 39M553 314a35 35 0 0 1 35-35"/></g><g class="room-labels"><text x="110" y="110">창고 A</text><text x="286" y="115">적재실 1</text><text x="492" y="115">적재실 2</text><text x="100" y="235">복도 A</text><text x="288" y="226">중앙 홀</text><text x="498" y="226">전기실</text><text x="102" y="378">출입구</text><text x="285" y="352">작업실</text><text x="600" y="352">창고 B</text></g><g class="slam"><path d="M92 78h109v72H92zM235 77h169v75H235zM442 78h220v75H442zM238 186h164v76H238zM442 186h93v76h-93z"/><path d="M91 297h111v93H91zM238 297h295v93H238zM570 297h91v92h-91z"/></g><path class="support-route" d="M103 373 C148 350, 166 316, 183 289 S280 254, 333 229 S398 191, 459 180 S507 143, 526 118"/><path class="route-progress" d="M103 373 C148 350, 166 316, 183 289 S280 254, 333 229"/><circle cx="103" cy="373" r="7" class="route-point"/><circle cx="526" cy="118" r="9" class="route-target"/><g class="obstacles"><path d="M205 260l28 28M233 260l-28 28"/><path d="M408 276h44"/><rect x="405" y="270" width="50" height="12" rx="5"/></g><g class="robot-marker" transform="translate(${compact ? 335 : 333} 229) rotate(-12)"><circle r="23"/><path d="M-10-8h20v16h-20zM0-16V-8M-7 13h14"/><path class="robot-direction" d="M0-18 0-48M-7-39 0-48l7 9"/></g><g class="candidate-marker person" transform="translate(526 118)"><circle r="22"/><circle r="10"/><path d="M0-32v-9M0 32v9M-32 0h-9M32 0h9"/><text x="29" y="5">인명 후보</text></g><g class="candidate-marker heat" transform="translate(500 220)"><circle r="17"/><path d="M0 10c-12-8 2-15-2-27 14 7 15 18 2 27Z"/><text x="24" y="5">열원 후보</text></g>${compact ? '<g class="field-team" transform="translate(182 289)"><circle r="14"/><path d="M-4 5V-5h8V5M0-5v-8"/></g>' : ""}</svg>${variant !== "mobile" ? '<div class="map-scale"><span></span>10m</div><div class="map-north">N<i>↑</i></div>' : ""}</div>`;
}

function eventMarkerSvg(event, showCallout, fieldInteractive = false) {
  const person = event.type === "PERSON_CANDIDATE";
  const selected = session.selectedEventId === event.id;
  const stateClass = event.status === "FALSE_POSITIVE" ? "muted" : "";
  const marker = person
    ? `<circle r="22"/><circle r="10"/><path d="M0-32v-9M0 32v9M-32 0h-9M32 0h9"/><text x="29" y="5">인명 후보</text>`
    : `<circle r="18"/><path d="M0 10c-12-8 2-15-2-27 14 7 15 18 2 27Z"/><text x="25" y="5">열원 후보</text>`;
  const callout = selected && showCallout
    ? `<circle class="event-focus-ring" r="31"/><foreignObject x="28" y="-40" width="128" height="84"><div xmlns="http://www.w3.org/1999/xhtml" class="svg-event-callout"><b>${event.label}</b><small>${event.id} · ${event.place.split(" · ").pop()}</small><button data-action="open-event-popup">보기</button></div></foreignObject>`
    : "";
  const isFieldTarget = fieldInteractive && event.id === "EVT-042";
  const fieldTargetAttributes = isFieldTarget ? `data-field-event="${event.id}" role="button" tabindex="0" aria-label="${event.id} 인명 탐지 이벤트 선택"` : "";
  return `<g class="candidate-marker ${person ? "person" : "heat"} ${selected ? "selected-svg-event" : ""} ${isFieldTarget ? "field-target-event" : ""} ${stateClass}" data-map-event="${event.id}" ${fieldTargetAttributes} transform="translate(${event.mapX} ${event.mapY})">${marker}${callout}</g>`;
}

function renderApartmentPlanSvg() {
  return `<g class="apartment-plan">
    <path class="apartment-floor" d="M72 48H490V58H688V258H676V430H506V445H397V430H72Z"/>
    <g class="apartment-walls">
      <path d="M72 48H490M518 58H688V258M676 285V430H506M480 445H397V430M366 430H72V48"/>
      <path d="M150 58V212M72 212H190M220 212H370M370 48V188M370 218V252"/>
      <path d="M72 295H165M195 295H260V430M190 212V270M190 292H72"/>
      <path d="M440 168H525V285H475M445 285H420V330M420 360V430M500 305V430"/>
      <path d="M544 285H676M525 168V138H490M460 138H370"/>
      <path d="M490 58V126M525 138H688M575 58V138"/>
    </g>
    <g class="apartment-doors">
      <path d="M370 188a30 30 0 0 1 30 30M190 270a30 30 0 0 1 30 30M445 285a30 30 0 0 1 30 30M510 285a34 34 0 0 1 34 34M420 330a30 30 0 0 1 30 30M460 138a30 30 0 0 1 30-30"/>
      <path d="M490 88a38 38 0 0 1 38 38"/>
    </g>
    <g class="apartment-windows">
      <path d="M88 48h46M175 48h76M276 48h66M85 430h145M282 430h78M545 430h102"/>
    </g>
    <g class="apartment-stairs">
      <rect x="575" y="72" width="96" height="52" rx="2"/>
      ${Array.from({ length: 9 }, (_, index) => `<path d="M${584 + index * 10} 73v50"/>`).join("")}
      <path d="M585 98h76M630 82l22 16-22 16"/>
      <rect x="548" y="150" width="122" height="92" rx="2"/>
      ${Array.from({ length: 9 }, (_, index) => `<path d="M549 ${158 + index * 9}h120"/>`).join("")}
    </g>
    <g class="apartment-slam">
      <path class="slam-coverage coverage-current" d="M158 61L353 62L358 101L365 112L364 190L342 203L307 198L270 205L232 198L195 205L160 194Z"/>
      <path class="slam-coverage coverage-recent" d="M82 61L139 63L142 196L126 205L103 198L83 204Z"/>
      <path class="slam-coverage coverage-accumulated" d="M378 190C397 183 418 185 432 198L438 274L469 291L525 294L536 315L658 301L662 414L536 416L509 403L501 420L426 419L414 381L386 412L272 415L259 398L244 414L85 414L82 307L176 303L196 286L224 280L229 222L359 220Z"/>
      <g class="slam-rays">
        <path d="M210 160L160 67M210 160L190 62M210 160L223 62M210 160L257 63M210 160L302 65M210 160L352 69M210 160L358 111M210 160L358 158M210 160L348 198M210 160L285 203M210 160L226 199M210 160L162 193M210 160L160 151M210 160L160 108"/>
        <circle class="lidar-range" cx="210" cy="160" r="57"/>
      </g>
      <g class="slam-detected-obstacles">
        <rect x="235" y="125" width="78" height="58" rx="5"/>
        <rect x="270" y="236" width="118" height="34" rx="5"/>
        <rect x="292" y="292" width="92" height="44" rx="5"/>
        <rect x="95" y="334" width="126" height="76" rx="6"/>
        <rect x="539" y="320" width="99" height="92" rx="6"/>
        <ellipse cx="155" cy="252" rx="13" ry="17"/>
        <ellipse cx="484" cy="224" rx="13" ry="17"/>
      </g>
    </g>
    <g class="apartment-labels">
      <text x="94" y="120">발코니</text><text x="248" y="112">식당</text><text x="402" y="92">현관</text>
      <text x="600" y="200">계단 / 외부</text><text x="105" y="238">화장실-2</text><text x="455" y="195">화장실-1</text>
      <text x="316" y="222">거실</text><text x="135" y="320">침실-2</text><text x="442" y="322">옷방</text><text x="574" y="310">침실-1</text>
    </g>
  </g>`;
}

function renderMapApartmentLegacy(variant) {
  const compact = variant === "mobile";
  const markers = mockStore.events.map((event) => eventMarkerSvg(event, !compact)).join("");
  return `<div class="map-canvas map-${variant}"><svg viewBox="0 0 760 480" role="img" aria-label="첨부 평면도를 기반으로 재구성한 가상 주거 도면"><defs><pattern id="grid-${variant}" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="currentColor" stroke-width=".6"/></pattern><filter id="wall-shadow-${variant}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity=".35"/></filter></defs><rect width="760" height="480" class="map-grid-bg" fill="url(#grid-${variant})"/>${renderApartmentPlanSvg()}<path class="support-route apartment-route" d="M430 91C430 135 402 177 398 220C394 261 414 279 450 296S530 331 590 350"/><path class="route-progress apartment-route-progress" d="M430 91C430 135 402 177 398 220C394 248 408 268 430 281"/><circle cx="430" cy="91" r="7" class="route-point"/><circle cx="590" cy="350" r="9" class="route-target"/><g class="obstacles apartment-obstacle"><path d="M522 276l24 24M546 276l-24 24"/></g><g class="robot-marker" transform="translate(430 281) rotate(18)"><circle r="23"/><path d="M-10-8h20v16h-20zM0-16V-8M-7 13h14"/><path class="robot-direction" d="M0-18 0-48M-7-39 0-48l7 9"/></g><g class="robot-svg-battery" transform="translate(406 309)"><rect width="49" height="18" rx="9"/><text x="24.5" y="12.5" text-anchor="middle">BAT ${mockStore.robot.battery}%</text></g>${markers}${compact ? '<g class="field-team" transform="translate(398 220)"><circle r="14"/><path d="M-4 5V-5h8V5M0-5v-8"/></g>' : ""}</svg>${variant !== "mobile" ? '<div class="map-scale"><span></span>10m</div><div class="map-north">N<i>↑</i></div>' : ""}</div>`;
}

function renderMapHud() {
  return "";
}

function positionTrackPath(points) {
  if (points.length < 2) return "";
  let path = `M${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] || points[index];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2] || next;
    const control1 = { x: current.x + (next.x - previous.x) / 6, y: current.y + (next.y - previous.y) / 6 };
    const control2 = { x: next.x - (afterNext.x - current.x) / 6, y: next.y - (afterNext.y - current.y) / 6 };
    path += ` C${control1.x.toFixed(1)} ${control1.y.toFixed(1)} ${control2.x.toFixed(1)} ${control2.y.toFixed(1)} ${next.x} ${next.y}`;
  }
  return path;
}

function renderPositionTrackSvg(variant) {
  const pings = session.positionPings || [];
  if (!pings.length) return "";
  const compact = variant === "mobile";
  const latest = pings[pings.length - 1];
  const track = pings.length > 1 ? `<path class="crew-position-track-line" d="${positionTrackPath(pings)}"/>` : "";
  const pastMarkers = pings.slice(0, -1).map((ping) => `<g class="crew-position-ping past" data-position-ping="${ping.id}" data-ping-x="${ping.x}" data-ping-y="${ping.y}" transform="translate(${ping.x} ${ping.y})"><circle class="ping-hit-area" r="13"/><circle class="ping-dot" r="4.5"/></g>`).join("");
  const timeLabel = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(latest.timestamp));
  const crewSelectAttributes = compact ? "" : `data-crew-select="${session.crewId || "F-02"}" data-crew-name="${session.firefighterName || "접속 대원"}"`;
  const currentMarker = `<g class="crew-position-ping current field-team map-crew-endpoint" data-position-ping="${latest.id}" data-ping-x="${latest.x}" data-ping-y="${latest.y}" data-ping-timestamp="${latest.timestamp}" ${crewSelectAttributes} transform="translate(${latest.x} ${latest.y})" role="button" tabindex="0" aria-label="${session.firefighterName || "접속 대원"} 최신 위치 ${timeLabel}"><circle class="crew-icon-bg" r="22"/><image href="assets/firefighter-marker.png" x="-18" y="-18" width="36" height="36" preserveAspectRatio="xMidYMid meet"/><text class="crew-position-name" x="28" y="1">${session.firefighterName || "접속 대원"}</text><text class="crew-position-time" x="28" y="13">${timeLabel}</text></g>`;
  return `<g class="crew-position-track" data-crew-track="${session.crewId || "F-02"}">${track}${pastMarkers}${currentMarker}</g>`;
}

function renderGeneratedRoutesSvg() {
  const latestPing = session.positionPings?.[session.positionPings.length - 1];
  const crewStart = latestPing || { x: 400, y: 270 };
  const activeCrewId = latestPing?.crewId || session.crewId || "F-02";
  const entranceToPerson = "M500 112C494 125 487 135 476 142C448 157 431 174 430 206C429 244 431 275 449 292C466 307 500 305 528 303C540 321 559 343 590 350";
  const crewToPerson = crewStart.x >= 525 && crewStart.y >= 285
    ? `M${crewStart.x} ${crewStart.y}C${Math.max(crewStart.x + 18, 548)} ${crewStart.y + 8} 566 344 590 350`
    : `M${crewStart.x} ${crewStart.y}C${Math.max(crewStart.x + 18, 420)} ${Math.min(crewStart.y, 270)} 440 272 454 282C462 288 470 293 486 295C502 297 520 296 532 301C547 307 550 328 565 339C574 346 582 349 590 350`;
  return `<g class="generated-routes"><path class="generated-route event-route ${session.selectedEventId === "EVT-042" ? "selected-route" : ""}" data-route-start="ENTRANCE" data-route-endpoint="EVT-042" d="${entranceToPerson}"/><path class="generated-route crew-route ${session.selectedCrew?.id === activeCrewId ? "selected-route" : ""}" data-route-start="${activeCrewId}" data-route-endpoint="EVT-042" d="${crewToPerson}"/><g class="route-anchor entrance-anchor" transform="translate(500 112)"><rect x="-9" y="-9" width="18" height="18" rx="4"/><path d="M-4 0h8M1-4l4 4-4 4"/><text x="15" y="4">출입구</text></g></g>`;
}

function renderCrewEndpointsSvg() {
  const crew = [
    { id: "F-01", name: "김대원", x: 225, y: 315 },
    { id: "F-02", name: "이대원", x: 400, y: 270 },
  ];
  const visibleCrew = session.positionPings?.length ? crew.filter((member) => member.id !== "F-02") : crew;
  return visibleCrew.map((member) => `<g class="field-team map-crew-endpoint ${session.selectedCrew?.id === member.id ? "selected" : ""}" data-crew-select="${member.id}" data-crew-name="${member.name}" data-route-endpoint="${member.id}" transform="translate(${member.x} ${member.y})" role="button" tabindex="0" aria-label="${member.name} 위치"><circle class="crew-icon-bg" r="20"/><image href="assets/firefighter-marker.png" x="-16" y="-16" width="32" height="32" preserveAspectRatio="xMidYMid meet"/><text x="26" y="4">${member.name}</text></g>`).join("");
}

function renderMapBase(variant) {
  const compact = variant === "mobile";
  const markers = mockStore.events.map((event) => eventMarkerSvg(event, !compact, compact)).join("");
  return `<div class="map-canvas map-${variant}"><svg viewBox="0 0 760 480" role="img" aria-label="라이다 탐색 영역과 장애물 경계를 누적 표시하는 가상 주거 SLAM 지도"><defs><pattern id="grid-${variant}" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="currentColor" stroke-width=".6"/></pattern></defs><rect width="760" height="480" class="map-grid-bg" fill="url(#grid-${variant})"/>${renderApartmentPlanSvg()}${renderGeneratedRoutesSvg()}<g class="robot-marker" transform="translate(210 160) rotate(12)"><circle r="23"/><path d="M-10-8h20v16h-20zM0-16V-8M-7 13h14"/><path class="robot-direction" d="M0-18 0-48M-7-39 0-48l7 9"/></g>${markers}${renderCrewEndpointsSvg()}</svg>${variant !== "mobile" ? '<div class="map-scale"><span></span>10m</div><div class="map-north">N<i>↑</i></div>' : ""}</div>`;
}

function renderMap(variant) {
  const compact = variant === "mobile";
  return renderMapBase(variant)
    .replace("<svg ", `<svg ${compact ? 'data-field-map="true" ' : ""}`)
    .replace("</svg>", `${renderPositionTrackSvg(variant)}</svg>`);
}

function renderEventPopup() {
  const event = mockStore.events.find((item) => item.id === session.selectedEventId);
  const html = renderEventPopupLegacy();
  if (!event || !html) return html;
  return html.replace(/x 24\.8[^<]*y 12\.1/, `x ${event.worldX.toFixed(1)} · y ${event.worldY.toFixed(1)}`);
}

function pageHeading(eyebrow, title, description, actions = "") { return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></div><div class="heading-actions">${actions}</div></div>`; }

function fieldMapPoint(svg, pointerEvent) {
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  const point = svg.createSVGPoint();
  point.x = pointerEvent.clientX;
  point.y = pointerEvent.clientY;
  const mapped = point.matrixTransform(matrix.inverse());
  return {
    x: Math.round(Math.max(0, Math.min(760, mapped.x)) * 10) / 10,
    y: Math.round(Math.max(0, Math.min(480, mapped.y)) * 10) / 10,
  };
}

function isPointerOverMarkerTrash(pointerEvent, trash) {
  const bounds = trash.getBoundingClientRect();
  return pointerEvent.clientX >= bounds.left && pointerEvent.clientX <= bounds.right && pointerEvent.clientY >= 0 && pointerEvent.clientY <= Math.max(bounds.bottom, 64);
}

function addFieldPositionPing(svg, pointerEvent) {
  const blockedTarget = pointerEvent.target.closest?.("[data-position-ping], [data-field-event], [data-crew-select], button");
  if (blockedTarget || Date.now() - session.lastMarkerDragAt < 350) return;
  const point = fieldMapPoint(svg, pointerEvent);
  if (!point) return;
  session.positionPings.push({
    id: `PING-${Date.now()}`,
    x: point.x,
    y: point.y,
    timestamp: new Date().toISOString(),
    crewId: session.crewId,
  });
  session.markerPlaced = true;
  renderRoute();
  toast("현재 위치를 기록하고 관제 지도에 동기화했습니다.", "success");
}

function bindPositionPingDrag(marker) {
  marker.addEventListener("pointerdown", (pointerDownEvent) => {
    const trash = document.getElementById("field-marker-trash");
    const svg = marker.ownerSVGElement;
    if (!trash || !svg) return;
    pointerDownEvent.preventDefault();
    pointerDownEvent.stopPropagation();
    const start = { x: pointerDownEvent.clientX, y: pointerDownEvent.clientY };
    let dragging = false;
    let overTrash = false;
    marker.setPointerCapture?.(pointerDownEvent.pointerId);

    const move = (pointerMoveEvent) => {
      if (!dragging && Math.hypot(pointerMoveEvent.clientX - start.x, pointerMoveEvent.clientY - start.y) < 6) return;
      dragging = true;
      const point = fieldMapPoint(svg, pointerMoveEvent);
      if (point) marker.setAttribute("transform", `translate(${point.x} ${point.y})`);
      marker.classList.add("dragging");
      trash.classList.add("visible");
      overTrash = isPointerOverMarkerTrash(pointerMoveEvent, trash);
      trash.classList.toggle("armed", overTrash);
    };

    const finish = (pointerUpEvent) => {
      marker.removeEventListener("pointermove", move);
      marker.removeEventListener("pointerup", finish);
      marker.removeEventListener("pointercancel", cancel);
      marker.releasePointerCapture?.(pointerDownEvent.pointerId);
      const shouldDelete = overTrash || isPointerOverMarkerTrash(pointerUpEvent, trash);
      trash.classList.remove("visible", "armed");
      marker.classList.remove("dragging");
      if (!dragging) return;
      session.lastMarkerDragAt = Date.now();
      if (shouldDelete) {
        session.positionPings = session.positionPings.filter((ping) => ping.id !== marker.dataset.positionPing);
        session.markerPlaced = session.positionPings.length > 0;
        renderRoute();
        toast("선택한 위치 마커를 삭제했습니다.");
        return;
      }
      renderRoute();
    };

    const cancel = () => {
      trash.classList.remove("visible", "armed");
      marker.classList.remove("dragging");
      renderRoute();
    };

    marker.addEventListener("pointermove", move);
    marker.addEventListener("pointerup", finish);
    marker.addEventListener("pointercancel", cancel);
  });
}

function bindEvents() {
  document.querySelectorAll("[data-route]").forEach((element) => element.addEventListener("click", () => navigate(element.dataset.route)));
  document.querySelectorAll("[data-dashboard-tab]").forEach((element) => element.addEventListener("click", () => { session.dashboardTab = element.dataset.dashboardTab; renderRoute(); }));
  document.querySelectorAll("[data-mission-select]").forEach((element) => element.addEventListener("click", () => { const mission = missionById(element.dataset.missionSelect); navigate(mission.status === "IN_PROGRESS" ? `/control/dashboard/${mission.id}` : `/control/report/${mission.id}`); }));
  document.querySelectorAll("[data-event-select]").forEach((element) => element.addEventListener("click", () => { session.selectedEventId = element.dataset.eventSelect; session.eventPopupOpen = false; session.selectedCrew = null; session.dashboardTab = "dashboard"; renderRoute(); }));
  document.querySelectorAll("[data-crew-select]").forEach((element) => element.addEventListener("click", () => { session.selectedCrew = { id: element.dataset.crewSelect, name: element.dataset.crewName }; renderRoute(); }));
  document.querySelectorAll("[data-field-event]").forEach((element) => element.addEventListener("click", () => {
    session.selectedEventId = element.dataset.fieldEvent;
    session.fieldEventArmed = element.dataset.fieldEvent === "EVT-042";
    renderRoute();
  }));
  document.querySelectorAll("[data-field-map]").forEach((element) => element.addEventListener("click", (event) => addFieldPositionPing(element, event)));
  document.querySelectorAll(".field-live-map [data-position-ping]").forEach(bindPositionPingDrag);
  document.querySelectorAll("[data-key]").forEach((element) => element.addEventListener("click", () => enterCode(element.dataset.key)));
  document.querySelectorAll("[data-report]").forEach((element) => element.addEventListener("click", () => toast(`${element.querySelector("span").textContent} 보고를 전송했습니다.`, "success")));
  document.querySelectorAll("[data-action]").forEach((element) => element.addEventListener("click", () => handleAction(element.dataset.action)));
  document.querySelectorAll("[data-map-layer]").forEach((element) => element.addEventListener("change", () => { const layerId = element.dataset.mapLayer; session.mapLayers[layerId] = element.checked; element.closest(".operations-map")?.classList.toggle(`hide-layer-${layerId}`, !element.checked); }));
  const loginForm = document.getElementById("control-login-form"); if (loginForm) loginForm.addEventListener("submit", (event) => { event.preventDefault(); session.controlAuthenticated = true; navigate("/control/missions"); });
  const draftForm = document.getElementById("mission-draft-form"); if (draftForm) draftForm.addEventListener("submit", (event) => { event.preventDefault(); const data = new FormData(draftForm); session.missionDraft = { title: data.get("title"), location: data.get("location"), report: data.get("report") }; session.setupStep = 2; renderRoute(); });
  const firefighterName = document.getElementById("firefighter-name"); if (firefighterName) firefighterName.addEventListener("input", (event) => { session.firefighterName = event.target.value; session.codeError = ""; });
  const dispatchForm = document.getElementById("dispatch-form"); if (dispatchForm) dispatchForm.addEventListener("submit", (event) => { event.preventDefault(); const data = new FormData(dispatchForm); const text = String(data.get("message") || "").trim(); if (!text) return; const time = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()); session.messages.push({ time, text }); const recipient = session.selectedCrew?.name || "선택한 대원"; session.selectedCrew = null; renderRoute(); toast(`${recipient}에게 지시를 전송했습니다.`, "success"); });
  updateClock();
}

function enterCode(number) { if (session.pendingCode.length >= 4) return; session.pendingCode += number; session.codeError = ""; if (session.pendingCode.length === 4) validateCode(); else renderRoute(); }
function validateCode() { const mission = mockStore.missions.find((item) => item.code === session.pendingCode && item.status === "IN_PROGRESS"); if (!session.firefighterName.trim()) { session.codeError = "대원 이름을 먼저 입력하세요."; session.pendingCode = ""; renderRoute(); return; } if (mission) { session.firefighterMissionId = mission.id; session.crewId = `F-${String(1 + Math.floor(Math.random() * 8)).padStart(2, "0")}`; session.pendingCode = ""; session.codeError = ""; navigate("/firefighter/mission"); } else { session.codeError = "유효하지 않거나 참여할 수 없는 임무 코드입니다."; session.pendingCode = ""; renderRoute(); } }

function handleAction(action) {
  if (action === "toggle-sidebar") { session.sidebarCollapsed = !session.sidebarCollapsed; renderRoute(); return; }
  if (action === "new-mission") { session.creating = true; session.setupStep = 1; session.missionDraft = { title: "", location: "", report: "" }; renderRoute(); return; }
  if (action === "close-create") { session.creating = false; renderRoute(); return; }
  if (action === "create-back") { session.setupStep = 1; renderRoute(); return; }
  if (action === "issue-code") { session.issuedCode = String(Math.floor(1000 + Math.random() * 9000)); session.setupStep = 3; renderRoute(); return; }
  if (action === "open-new-dashboard") { const id = `FST-2026-0721-${String(mockStore.missions.length + 4).padStart(2, "0")}`; const mission = { id, code: session.issuedCode, title: session.missionDraft.title, location: session.missionDraft.location, report: session.missionDraft.report, createdAt: "2026.07.21 10:25", status: "IN_PROGRESS", completion: "탐색 준비", mapVersion: "MAP v1", routeVersion: "ROUTE v1" }; mockStore.missions.unshift(mission); session.creating = false; session.dashboardTab = "dashboard"; navigate(`/control/dashboard/${id}`); toast(`새 임무가 생성되고 대원 참가 코드 ${mission.code}가 발급되었습니다.`, "success"); return; }
  if (action === "delete-code") { session.pendingCode = session.pendingCode.slice(0, -1); session.codeError = ""; renderRoute(); return; }
  if (action === "leave-field") { session.firefighterMissionId = null; session.fieldEventArmed = false; navigate("/firefighter/code"); return; }
  if (action === "toggle-live-events") { session.liveEventsExpanded = !session.liveEventsExpanded; renderRoute(); return; }
  if (action === "toggle-thermal") { const wasVisuallyCollapsed = session.thermalCollapsed || session.liveEventsExpanded; session.liveEventsExpanded = false; session.thermalCollapsed = !wasVisuallyCollapsed; renderRoute(); return; }
  if (action === "toggle-rgb") { const wasVisuallyCollapsed = session.rgbCollapsed || session.liveEventsExpanded; session.liveEventsExpanded = false; session.rgbCollapsed = !wasVisuallyCollapsed; renderRoute(); return; }
  if (action === "close-crew-message") { session.selectedCrew = null; renderRoute(); return; }
  if (action === "open-event-popup") { session.eventPopupOpen = true; renderRoute(); return; }
  if (action === "close-event-popup") { session.eventPopupOpen = false; renderRoute(); return; }
  if (action === "request-crew-route" || action === "request-exit-route") { session.eventPopupOpen = false; renderRoute(); toast(action === "request-crew-route" ? "선택한 이벤트까지 요원 경로 생성을 요청했습니다." : "이벤트 지점에서 출입구까지 경로 생성을 요청했습니다.", "success"); return; }
  if (action === "mark-detection-error") { const event = mockStore.events.find((item) => item.id === session.selectedEventId); if (event) event.status = "FALSE_POSITIVE"; session.eventPopupOpen = false; session.selectedEventId = null; renderRoute(); toast("탐지 오류로 처리하고 지도 마커를 제거했습니다."); return; }
  if (action === "toggle-instructions") { session.instructionsExpanded = !session.instructionsExpanded; renderRoute(); return; }
  if (action === "toggle-ptt") { session.pttActive = !session.pttActive; renderRoute(); toast(session.pttActive ? "WebRTC 음성 송신을 시작했습니다." : "음성 송신을 종료하고 음소거했습니다.", session.pttActive ? "success" : "neutral"); return; }
  if (action === "place-marker") { session.markerPlaced = true; renderRoute(); toast("현재 위치 핑을 관제 지도와 동기화했습니다.", "success"); return; }
  if (action === "delete-marker") { session.markerPlaced = false; renderRoute(); toast("위치 핑을 삭제하고 관제 화면에 반영했습니다."); return; }
  if (["confirm-person", "reject-person", "unknown-event"].includes(action)) { if (!session.fieldEventArmed) return; const event = mockStore.events.find((item) => item.id === "EVT-042"); event.status = action === "confirm-person" ? "CONFIRMED" : "UNKNOWN"; session.fieldEventArmed = false; renderRoute(); toast(action === "confirm-person" ? "인명 확인 결과를 관제에 전송했습니다." : "인명 확인 불가로 처리하고 관제에 알렸습니다.", "success"); return; }
  if (action === "end-mission") { toast("임무 종료 요청을 전송했습니다. 종료 ACK를 대기합니다.", "warning"); return; }
  if (action === "logout") { session.controlAuthenticated = false; session.dashboardTab = "dashboard"; navigate("/"); return; }
  if (action === "copy-code") { const mission = currentMission(); navigator.clipboard?.writeText(mission.code); toast(`대원 참가 코드 ${mission.code}를 복사했습니다.`, "success"); return; }
  const messages = { notify: "새 알림 2건: 탐지 후보 1건, 경로 변경 1건", "pause-mission": "임무 중지 명령을 전송했습니다. ACK 수신 후 상태가 반영됩니다.", emergency: "비상 정지 확인이 필요합니다. 실제 구현에서는 2단계 확인 후 최우선 명령으로 전송됩니다.", "start-search": "탐색 시작 명령을 전송했습니다. ACK 대기 중입니다.", "return-robot": "로봇 복귀 명령을 전송했습니다.", "manual-mode": "수동 조작 모드는 제어권 확인 후 활성화됩니다.", "retry-command": "최근 명령 상태를 확인했습니다.", "mark-false": "이벤트 상태를 오탐으로 변경했습니다.", "request-route": "선택한 후보까지의 진입 지원 경로 생성을 요청했습니다." };
  toast(messages[action] || "프로토타입 상호작용입니다.", action === "emergency" ? "danger" : "neutral");
}

function currentMission() { const match = route().match(/\/control\/dashboard\/(.+)/); return missionById(match?.[1]); }
function toast(message, tone = "neutral") { const region = document.getElementById("toast-region"); if (!region) return; const node = document.createElement("div"); node.className = `toast ${tone}`; node.innerHTML = `${icon(tone === "danger" ? "alert" : tone === "success" ? "check" : "bell")}<span>${message}</span>`; region.appendChild(node); requestAnimationFrame(() => node.classList.add("show")); setTimeout(() => { node.classList.remove("show"); setTimeout(() => node.remove(), 250); }, 3200); }
function updateClock() { const target = document.getElementById("current-time"); if (!target) return; target.textContent = new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "medium" }).format(new Date()); }

window.addEventListener("hashchange", renderRoute);
renderRoute();
setInterval(updateClock, 1000);
