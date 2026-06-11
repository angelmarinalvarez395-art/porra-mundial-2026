'use strict';

/* ====================================================
   FIREBASE — sincronización en tiempo real
   Reemplaza firebaseConfig con el tuyo de
   console.firebase.google.com → Configuración del proyecto
   ==================================================== */
const firebaseConfig = {
  apiKey:            "AIzaSyB_vPSZjZBtwAIa771ZxRHQLbpKzODxSEg",
  authDomain:        "porra-mundial-2026-73278.firebaseapp.com",
  databaseURL:       "https://porra-mundial-2026-73278-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "porra-mundial-2026-73278",
  storageBucket:     "porra-mundial-2026-73278.firebasestorage.app",
  messagingSenderId: "343896613895",
  appId:             "1:343896613895:web:852095534519a898f6f6a2",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const REF = {
  entries:      db.ref('porra2026/entries'),
  actual_gs:    db.ref('porra2026/actual_gs'),
  actual_ko:    db.ref('porra2026/actual_ko'),
  actual_bonus: db.ref('porra2026/actual_bonus'),
};

// Estado compartido en memoria — los listeners de Firebase lo mantienen actualizado
let _entries     = [];
let _actualGS    = {};
let _actualKO    = {};
let _actualBonus = null;

/* ====================================================
   DATOS DEL MUNDIAL 2026
   ==================================================== */
const WC_KICKOFF = new Date('2026-06-11T13:00:00-06:00'); // México vs Sudáfrica, Azteca

// 12 grupos oficiales del sorteo FIFA 2026
const GROUPS = {
  A: { teams: [{ n:'Chequia',            f:'🇨🇿' }, { n:'México',          f:'🇲🇽' }, { n:'Sudáfrica',      f:'🇿🇦' }, { n:'Corea del Sur',   f:'🇰🇷' }] },
  B: { teams: [{ n:'Bosnia-Herzegovina', f:'🇧🇦' }, { n:'Canadá',          f:'🇨🇦' }, { n:'Catar',          f:'🇶🇦' }, { n:'Suiza',           f:'🇨🇭' }] },
  C: { teams: [{ n:'Brasil',             f:'🇧🇷' }, { n:'Haití',           f:'🇭🇹' }, { n:'Marruecos',      f:'🇲🇦' }, { n:'Escocia',         f:'🏴󠁧󠁢󠁳󠁣󠁴󠁿' }] },
  D: { teams: [{ n:'Australia',          f:'🇦🇺' }, { n:'Paraguay',        f:'🇵🇾' }, { n:'Turquía',        f:'🇹🇷' }, { n:'USA',             f:'🇺🇸' }] },
  E: { teams: [{ n:'Curazao',            f:'🇨🇼' }, { n:'Ecuador',         f:'🇪🇨' }, { n:'Alemania',       f:'🇩🇪' }, { n:'Costa de Marfil', f:'🇨🇮' }] },
  F: { teams: [{ n:'Japón',              f:'🇯🇵' }, { n:'Países Bajos',    f:'🇳🇱' }, { n:'Suecia',         f:'🇸🇪' }, { n:'Túnez',           f:'🇹🇳' }] },
  G: { teams: [{ n:'Bélgica',            f:'🇧🇪' }, { n:'Egipto',          f:'🇪🇬' }, { n:'Irán',           f:'🇮🇷' }, { n:'Nueva Zelanda',   f:'🇳🇿' }] },
  H: { teams: [{ n:'Cabo Verde',         f:'🇨🇻' }, { n:'Arabia Saudí',    f:'🇸🇦' }, { n:'España',         f:'🇪🇸' }, { n:'Uruguay',         f:'🇺🇾' }] },
  I: { teams: [{ n:'Francia',            f:'🇫🇷' }, { n:'Irak',            f:'🇮🇶' }, { n:'Noruega',        f:'🇳🇴' }, { n:'Senegal',         f:'🇸🇳' }] },
  J: { teams: [{ n:'Argelia',            f:'🇩🇿' }, { n:'Argentina',       f:'🇦🇷' }, { n:'Austria',        f:'🇦🇹' }, { n:'Jordania',        f:'🇯🇴' }] },
  K: { teams: [{ n:'Colombia',           f:'🇨🇴' }, { n:'R.D. Congo',      f:'🇨🇩' }, { n:'Portugal',       f:'🇵🇹' }, { n:'Uzbekistán',      f:'🇺🇿' }] },
  L: { teams: [{ n:'Croacia',            f:'🇭🇷' }, { n:'Inglaterra',      f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, { n:'Ghana',          f:'🇬🇭' }, { n:'Panamá',          f:'🇵🇦' }] },
};

// Calendario oficial de partidos por grupo (pair = [idxLocal, idxVisitante])
// Fechas y horas verificadas contra el calendario FIFA 2026
const GROUP_SCHEDULE = {
  A: [ // Chequia(0) México(1) Sudáfrica(2) Corea del Sur(3)
    { pair:[1,2], date:'2026-06-11', time:'13:00', tz:'MX',  city:'Ciudad de México (Azteca)' },
    { pair:[0,3], date:'2026-06-11', time:'20:00', tz:'MX',  city:'Guadalajara (Akron)' },
    { pair:[0,1], date:'2026-06-15', time:'12:00', tz:'ET',  city:'Atlanta (Mercedes-Benz)' },
    { pair:[2,3], date:'2026-06-15', time:'15:00', tz:'ET',  city:'Seattle (Lumen Field)' },
    { pair:[0,2], date:'2026-06-18', time:'12:00', tz:'ET',  city:'Atlanta (Mercedes-Benz)' },
    { pair:[1,3], date:'2026-06-18', time:'21:00', tz:'MX',  city:'Guadalajara (Akron)' },
  ],
  B: [ // Bosnia-H(0) Canadá(1) Catar(2) Suiza(3)
    { pair:[0,1], date:'2026-06-12', time:'19:00', tz:'ET',  city:'Toronto (BMO Field)' },
    { pair:[2,3], date:'2026-06-13', time:'12:00', tz:'PT',  city:'San Francisco (Levi\'s)' },
    { pair:[0,3], date:'2026-06-18', time:'12:00', tz:'PT',  city:'Los Ángeles (SoFi)' },
    { pair:[1,2], date:'2026-06-18', time:'15:00', tz:'PT',  city:'Vancouver (BC Place)' },
    { pair:[1,3], date:'2026-06-24', time:'15:00', tz:'ET',  city:'Vancouver (BC Place)' },
    { pair:[0,2], date:'2026-06-24', time:'15:00', tz:'ET',  city:'Seattle (Lumen Field)' },
  ],
  C: [ // Brasil(0) Haití(1) Marruecos(2) Escocia(3)
    { pair:[0,2], date:'2026-06-13', time:'18:00', tz:'ET',  city:'Nueva York (MetLife)' },
    { pair:[1,3], date:'2026-06-13', time:'21:00', tz:'ET',  city:'Boston (Gillette)' },
    { pair:[2,3], date:'2026-06-19', time:'18:00', tz:'ET',  city:'Boston (Gillette)' },
    { pair:[0,1], date:'2026-06-19', time:'21:00', tz:'ET',  city:'Philadelphia (Lincoln)' },
    { pair:[0,3], date:'2026-06-24', time:'18:00', tz:'ET',  city:'Miami (Hard Rock)' },
    { pair:[1,2], date:'2026-06-24', time:'18:00', tz:'ET',  city:'Atlanta (Mercedes-Benz)' },
  ],
  D: [ // Australia(0) Paraguay(1) Turquía(2) USA(3)
    { pair:[1,3], date:'2026-06-12', time:'18:00', tz:'PT',  city:'Los Ángeles (SoFi)' },
    { pair:[0,2], date:'2026-06-13', time:'15:00', tz:'ET',  city:'Houston (NRG)' },
    { pair:[0,3], date:'2026-06-19', time:'12:00', tz:'PT',  city:'Seattle (Lumen Field)' },
    { pair:[1,2], date:'2026-06-19', time:'21:00', tz:'PT',  city:'San Francisco (Levi\'s)' },
    { pair:[2,3], date:'2026-06-25', time:'22:00', tz:'ET',  city:'Los Ángeles (SoFi)' },
    { pair:[0,1], date:'2026-06-25', time:'22:00', tz:'ET',  city:'San Francisco (Levi\'s)' },
  ],
  E: [ // Curazao(0) Ecuador(1) Alemania(2) Costa de Marfil(3)
    { pair:[2,0], date:'2026-06-14', time:'13:00', tz:'ET',  city:'Houston (NRG)' },
    { pair:[1,3], date:'2026-06-14', time:'19:00', tz:'ET',  city:'Philadelphia (Lincoln)' },
    { pair:[2,3], date:'2026-06-20', time:'16:00', tz:'ET',  city:'Toronto (BMO Field)' },
    { pair:[0,1], date:'2026-06-20', time:'19:00', tz:'CT',  city:'Kansas City (Arrowhead)' },
    { pair:[1,2], date:'2026-06-25', time:'16:00', tz:'ET',  city:'Nueva York (MetLife)' },
    { pair:[0,3], date:'2026-06-25', time:'16:00', tz:'ET',  city:'Philadelphia (Lincoln)' },
  ],
  F: [ // Japón(0) Países Bajos(1) Suecia(2) Túnez(3)
    { pair:[1,0], date:'2026-06-14', time:'16:00', tz:'ET',  city:'Dallas (AT&T)' },
    { pair:[2,3], date:'2026-06-14', time:'22:00', tz:'ET',  city:'Kansas City (Arrowhead)' },
    { pair:[1,2], date:'2026-06-20', time:'13:00', tz:'ET',  city:'Houston (NRG)' },
    { pair:[0,3], date:'2026-06-20', time:'22:00', tz:'MX',  city:'Guadalajara (Akron)' },
    { pair:[0,2], date:'2026-06-25', time:'19:00', tz:'ET',  city:'Dallas (AT&T)' },
    { pair:[1,3], date:'2026-06-25', time:'19:00', tz:'CT',  city:'Kansas City (Arrowhead)' },
  ],
  G: [ // Bélgica(0) Egipto(1) Irán(2) Nueva Zelanda(3)
    { pair:[0,1], date:'2026-06-15', time:'15:00', tz:'PT',  city:'Seattle (Lumen Field)' },
    { pair:[2,3], date:'2026-06-15', time:'21:00', tz:'CT',  city:'Kansas City (Arrowhead)' },
    { pair:[0,2], date:'2026-06-21', time:'15:00', tz:'PT',  city:'Los Ángeles (SoFi)' },
    { pair:[1,3], date:'2026-06-21', time:'21:00', tz:'PT',  city:'Vancouver (BC Place)' },
    { pair:[0,3], date:'2026-06-26', time:'23:00', tz:'ET',  city:'Seattle (Lumen Field)' },
    { pair:[1,2], date:'2026-06-26', time:'23:00', tz:'PT',  city:'Vancouver (BC Place)' },
  ],
  H: [ // Cabo Verde(0) Arabia Saudí(1) España(2) Uruguay(3)
    { pair:[2,0], date:'2026-06-15', time:'12:00', tz:'ET',  city:'Atlanta (Mercedes-Benz)' },
    { pair:[1,3], date:'2026-06-15', time:'18:00', tz:'ET',  city:'Boston (Gillette)' },
    { pair:[2,1], date:'2026-06-21', time:'12:00', tz:'ET',  city:'Atlanta (Mercedes-Benz)' },
    { pair:[0,3], date:'2026-06-21', time:'18:00', tz:'ET',  city:'Dallas (AT&T)' },
    { pair:[0,1], date:'2026-06-26', time:'20:00', tz:'ET',  city:'Houston (NRG)' },
    { pair:[2,3], date:'2026-06-26', time:'20:00', tz:'MX',  city:'Guadalajara (Akron)' },
  ],
  I: [ // Francia(0) Irak(1) Noruega(2) Senegal(3)
    { pair:[0,3], date:'2026-06-16', time:'15:00', tz:'ET',  city:'Philadelphia (Lincoln)' },
    { pair:[1,2], date:'2026-06-16', time:'18:00', tz:'ET',  city:'Nueva York (MetLife)' },
    { pair:[0,1], date:'2026-06-22', time:'17:00', tz:'ET',  city:'Philadelphia (Lincoln)' },
    { pair:[2,3], date:'2026-06-22', time:'20:00', tz:'ET',  city:'Nueva York (MetLife)' },
    { pair:[0,2], date:'2026-06-26', time:'15:00', tz:'ET',  city:'Boston (Gillette)' },
    { pair:[1,3], date:'2026-06-26', time:'15:00', tz:'ET',  city:'Toronto (BMO Field)' },
  ],
  J: [ // Argelia(0) Argentina(1) Austria(2) Jordania(3)
    { pair:[1,0], date:'2026-06-16', time:'21:00', tz:'ET',  city:'Houston (NRG)' },
    { pair:[2,3], date:'2026-06-17', time:'00:00', tz:'ET',  city:'San Francisco (Levi\'s)' },
    { pair:[1,2], date:'2026-06-22', time:'13:00', tz:'ET',  city:'Dallas (AT&T)' },
    { pair:[0,3], date:'2026-06-22', time:'23:00', tz:'ET',  city:'San Francisco (Levi\'s)' },
    { pair:[1,3], date:'2026-06-27', time:'22:00', tz:'ET',  city:'Dallas (AT&T)' },
    { pair:[0,2], date:'2026-06-27', time:'22:00', tz:'CT',  city:'Kansas City (Arrowhead)' },
  ],
  K: [ // Colombia(0) R.D.Congo(1) Portugal(2) Uzbekistán(3)
    { pair:[2,1], date:'2026-06-17', time:'13:00', tz:'ET',  city:'Houston (NRG)' },
    { pair:[3,0], date:'2026-06-17', time:'20:00', tz:'MX',  city:'Ciudad de México (Azteca)' },
    { pair:[2,3], date:'2026-06-23', time:'13:00', tz:'ET',  city:'Houston (NRG)' },
    { pair:[0,1], date:'2026-06-23', time:'22:00', tz:'MX',  city:'Guadalajara (Akron)' },
    { pair:[0,2], date:'2026-06-27', time:'19:30', tz:'ET',  city:'Miami (Hard Rock)' },
    { pair:[1,3], date:'2026-06-27', time:'19:30', tz:'ET',  city:'Atlanta (Mercedes-Benz)' },
  ],
  L: [ // Croacia(0) Inglaterra(1) Ghana(2) Panamá(3)
    { pair:[1,0], date:'2026-06-17', time:'16:00', tz:'ET',  city:'Dallas (AT&T)' },
    { pair:[2,3], date:'2026-06-17', time:'19:00', tz:'ET',  city:'Toronto (BMO Field)' },
    { pair:[1,2], date:'2026-06-23', time:'16:00', tz:'ET',  city:'Boston (Gillette)' },
    { pair:[0,3], date:'2026-06-23', time:'19:00', tz:'ET',  city:'Toronto (BMO Field)' },
    { pair:[1,3], date:'2026-06-27', time:'17:00', tz:'ET',  city:'Nueva York (MetLife)' },
    { pair:[0,2], date:'2026-06-27', time:'17:00', tz:'ET',  city:'Philadelphia (Lincoln)' },
  ],
};

// Estructura del cuadro eliminatorio
const ROUNDS = {
  r32: {
    label: '32avos de Final',
    matches: [
      {id:'r32-0', h:'1A',a:'2B', date:'2026-06-28'}, {id:'r32-1', h:'1C',a:'2D', date:'2026-06-28'},
      {id:'r32-2', h:'1E',a:'2F', date:'2026-06-29'}, {id:'r32-3', h:'1G',a:'2H', date:'2026-06-29'},
      {id:'r32-4', h:'1I',a:'2J', date:'2026-06-30'}, {id:'r32-5', h:'1K',a:'2L', date:'2026-06-30'},
      {id:'r32-6', h:'1B',a:'2A', date:'2026-07-01'}, {id:'r32-7', h:'1D',a:'2C', date:'2026-07-01'},
      {id:'r32-8', h:'1F',a:'2E', date:'2026-07-02'}, {id:'r32-9', h:'1H',a:'2G', date:'2026-07-02'},
      {id:'r32-10',h:'1J',a:'2I', date:'2026-07-03'}, {id:'r32-11',h:'1L',a:'2K', date:'2026-07-03'},
      {id:'r32-12',h:'3-1',a:'3-2', date:'2026-06-28'}, {id:'r32-13',h:'3-3',a:'3-4', date:'2026-06-29'},
      {id:'r32-14',h:'3-5',a:'3-6', date:'2026-06-30'}, {id:'r32-15',h:'3-7',a:'3-8', date:'2026-07-01'},
    ],
  },
  r16: {
    label: 'Octavos de Final',
    matches: [
      {id:'r16-0',p1:'r32-0', p2:'r32-1',  date:'2026-07-04'},
      {id:'r16-1',p1:'r32-2', p2:'r32-3',  date:'2026-07-05'},
      {id:'r16-2',p1:'r32-4', p2:'r32-5',  date:'2026-07-05'},
      {id:'r16-3',p1:'r32-6', p2:'r32-7',  date:'2026-07-06'},
      {id:'r16-4',p1:'r32-8', p2:'r32-9',  date:'2026-07-06'},
      {id:'r16-5',p1:'r32-10',p2:'r32-11', date:'2026-07-07'},
      {id:'r16-6',p1:'r32-12',p2:'r32-13', date:'2026-07-07'},
      {id:'r16-7',p1:'r32-14',p2:'r32-15', date:'2026-07-04'},
    ],
  },
  qf: {
    label: 'Cuartos de Final',
    matches: [
      {id:'qf-0',p1:'r16-0',p2:'r16-7', date:'2026-07-09'},
      {id:'qf-1',p1:'r16-1',p2:'r16-2', date:'2026-07-10'},
      {id:'qf-2',p1:'r16-3',p2:'r16-4', date:'2026-07-11'},
      {id:'qf-3',p1:'r16-5',p2:'r16-6', date:'2026-07-11'},
    ],
  },
  sf: {
    label: 'Semifinales',
    matches: [
      {id:'sf-0',p1:'qf-0',p2:'qf-1', date:'2026-07-14', city:'Dallas (AT&T Stadium)'},
      {id:'sf-1',p1:'qf-2',p2:'qf-3', date:'2026-07-15', city:'Atlanta (Mercedes-Benz Stadium)'},
    ],
  },
  '3rd': {
    label: '3.er Puesto',
    matches: [
      {id:'3rd-0',p1:'sf-0-L',p2:'sf-1-L', date:'2026-07-18', city:'Miami (Hard Rock Stadium)'},
    ],
  },
  final: {
    label: 'Gran Final 🏆',
    matches: [
      {id:'final-0',p1:'sf-0',p2:'sf-1', date:'2026-07-19', city:'Nueva York (MetLife Stadium)'},
    ],
  },
};

const BONUS_POINTS = { campeon:10, subcampeon:6, tercero:4, cuarto:2, goleador:6, portero:4, mvp:6, joven:4, sorpresa:8 };

/* ====================================================
   ALMACENAMIENTO
   ==================================================== */
// Solo el borrador local del usuario se guarda en localStorage
const SK = {
  DRAFT_GS: 'porra26-draft-gs',
  DRAFT_KO: 'porra26-draft-ko',
};

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function getDraftGS()   { return load(SK.DRAFT_GS, {}); }
function saveDraftGS(d) { save(SK.DRAFT_GS, d); }
function getDraftKO()   { return load(SK.DRAFT_KO, {}); }
function saveDraftKO(d) { save(SK.DRAFT_KO, d); }

// Escrituras en Firebase (datos compartidos)
function saveEntry(entry)    { return REF.entries.child(String(entry.id)).set(entry); }
function deleteEntry(id)     { return REF.entries.child(String(id)).remove(); }
function saveActualGS(d)     { return REF.actual_gs.set(d); }
function saveActualKO(d)     { return REF.actual_ko.set(d); }
function saveActualBonus(d)  { return REF.actual_bonus.set(d); }

// Listeners en tiempo real — actualizan estado en memoria y re-renderizan
function initFirebaseListeners() {
  const isAdmin = new URLSearchParams(window.location.search).has('admin');

  REF.entries.on('value', snap => {
    const raw = snap.val() ?? {};
    _entries = Object.values(raw);
    renderLeaderboard();
    const mpN = document.getElementById('mp-nombre')?.value.trim();
    if (mpN && document.getElementById('mp-content')?.children.length) renderMyPorra(mpN);
  });

  REF.actual_gs.on('value', snap => {
    _actualGS = snap.val() ?? {};
    renderLeaderboard();
    renderLiveGroups();
    renderLiveBracket();
    if (isAdmin) renderAdminGS();
  });

  REF.actual_ko.on('value', snap => {
    _actualKO = snap.val() ?? {};
    renderLeaderboard();
    renderLiveBracket();
    const mpN = document.getElementById('mp-nombre')?.value.trim();
    if (mpN && document.getElementById('mp-content')?.children.length) renderMyPorra(mpN);
    if (isAdmin) renderAdminKO();
  });

  REF.actual_bonus.on('value', snap => {
    _actualBonus = snap.val();
    renderLeaderboard();
    const mpN = document.getElementById('mp-nombre')?.value.trim();
    if (mpN && document.getElementById('mp-content')?.children.length) renderMyPorra(mpN);
    if (isAdmin) populateAdminBonus();
  });
}

function populateAdminBonus() {
  const resultsForm = document.getElementById('results-form');
  if (!resultsForm || !_actualBonus) return;
  for (const [field, val] of Object.entries(_actualBonus)) {
    const el = resultsForm.elements[field];
    if (el) el.value = val;
  }
}

/* ====================================================
   HELPER: FORMATO FECHA
   ==================================================== */
function formatDate(d) {
  if (!d) return '';
  return new Date(d + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
}

/* ====================================================
   CLASIFICACIONES DE GRUPO
   ==================================================== */
function calcStandings(gKey, gsData) {
  const teams = GROUPS[gKey].teams.map((t, i) => ({
    i, n:t.n, f:t.f, pts:0, j:0, g:0, e:0, p:0, gf:0, gc:0, gd:0
  }));

  GROUP_SCHEDULE[gKey].forEach((sched, mi) => {
    const key = `${gKey}-${mi}`;
    const sc  = gsData[key];
    if (!sc || sc[0] === '' || sc[1] === '') return;
    const [h, a] = [Number(sc[0]), Number(sc[1])];
    const [hi, ai] = sched.pair;
    teams[hi].j++; teams[hi].gf += h; teams[hi].gc += a; teams[hi].gd += h-a;
    teams[ai].j++; teams[ai].gf += a; teams[ai].gc += h; teams[ai].gd += a-h;
    if (h > a)       { teams[hi].g++; teams[hi].pts+=3; teams[ai].p++; }
    else if (h < a)  { teams[ai].g++; teams[ai].pts+=3; teams[hi].p++; }
    else             { teams[hi].e++; teams[hi].pts++; teams[ai].e++; teams[ai].pts++; }
  });

  return teams.sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf || a.n.localeCompare(b.n));
}

function getAllStandings(gsData) {
  const all = {};
  for (const key of Object.keys(GROUPS)) all[key] = calcStandings(key, gsData);
  return all;
}

function getQualifiers(standings) {
  const q = {};
  for (const [key, st] of Object.entries(standings)) {
    q[`1${key}`] = st[0];
    q[`2${key}`] = st[1];
    q[`3${key}`] = st[2];
  }
  return q;
}

function getBest3rds(standings) {
  return Object.values(standings)
    .map(st => st[2])
    .filter(Boolean)
    .sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf || a.n.localeCompare(b.n));
}

/* ====================================================
   RESOLUCIÓN DE SLOTS DEL CUADRO
   ==================================================== */
function resolveSlot(slot, qualifiers, best3, koPicks) {
  if (/^[12][A-L]$/.test(slot)) {
    const t = qualifiers[slot];
    return t ? `${t.f} ${t.n}` : `${slot[0] === '1' ? '1.º' : '2.º'} Gr. ${slot[1]}`;
  }
  if (/^3-\d+$/.test(slot)) {
    const idx = parseInt(slot.split('-')[1], 10) - 1;
    const t = best3[idx];
    return t ? `${t.f} ${t.n}` : `3.º mejor #${idx+1}`;
  }
  const isLoser = slot.endsWith('-L');
  const matchId = isLoser ? slot.slice(0, -2) : slot;
  const pick = koPicks[matchId];
  if (!pick) return null;
  return `${pick.hf||''} ${pick.team}`.trim();
}

function resolveLoser(matchId, koPicks, qualifiers, best3) {
  const pick = koPicks[matchId];
  if (!pick?.team) return null;
  for (const round of Object.values(ROUNDS)) {
    const m = round.matches.find(m => m.id === matchId);
    if (!m) continue;
    const teamH = m.h ? resolveSlot(m.h, qualifiers, best3, koPicks)
                     : resolveSlot(m.p1, qualifiers, best3, koPicks);
    const teamA = m.a ? resolveSlot(m.a, qualifiers, best3, koPicks)
                     : resolveSlot(m.p2, qualifiers, best3, koPicks);
    const winnerText = `${pick.hf||''} ${pick.team}`.trim();
    if (teamH && teamH.trim() === winnerText) return teamA;
    return teamH;
  }
  return null;
}

/* ====================================================
   FASE DE GRUPOS — UI
   ==================================================== */
function initGroups() {
  const tabNav   = document.getElementById('group-tab-nav');
  const panels   = document.getElementById('group-panels');
  const groupKeys= Object.keys(GROUPS);

  tabNav.innerHTML = groupKeys.map((k, i) =>
    `<button class="phase-tab" role="tab" aria-selected="${i===0}" data-group="${k}">Grupo ${k}</button>`
  ).join('');

  panels.innerHTML = groupKeys.map((k, i) =>
    `<div id="gpanel-${k}" role="tabpanel" ${i !== 0 ? 'hidden' : ''}></div>`
  ).join('');

  tabNav.addEventListener('click', e => {
    const tab = e.target.closest('.phase-tab');
    if (!tab) return;
    tabNav.querySelectorAll('.phase-tab').forEach(t => t.setAttribute('aria-selected','false'));
    tab.setAttribute('aria-selected','true');
    panels.querySelectorAll('[role="tabpanel"]').forEach(p => p.hidden = true);
    document.getElementById(`gpanel-${tab.dataset.group}`).hidden = false;
  });

  groupKeys.forEach(k => renderGroupPanel(k));
}

function renderGroupPanel(gKey) {
  const container = document.getElementById(`gpanel-${gKey}`);
  const gsData    = getDraftGS();
  const standings = calcStandings(gKey, gsData);

  container.innerHTML = `
    <div class="group-panel">
      <div>
        <div class="standings">
          <div class="standings__head">Clasificación Grupo ${gKey}</div>
          <table aria-label="Clasificación del Grupo ${gKey}">
            <thead>
              <tr>
                <th>#</th><th style="text-align:left">Equipo</th>
                <th title="Partidos jugados">PJ</th>
                <th title="Victorias">V</th>
                <th title="Empates">E</th>
                <th title="Derrotas">D</th>
                <th title="Diferencia de goles">DG</th>
                <th title="Puntos">Pts</th>
              </tr>
            </thead>
            <tbody id="st-${gKey}">${renderStandingsRows(standings)}</tbody>
          </table>
        </div>
      </div>
      <div>
        <div class="matches">
          <div class="matches__head">Partidos</div>
          ${GROUP_SCHEDULE[gKey].map((_, mi) => renderMatchRow(gKey, mi, gsData)).join('')}
        </div>
      </div>
    </div>`;

  container.querySelectorAll('.score-inp').forEach(inp => {
    inp.addEventListener('input', () => onScoreChange(gKey));
  });
}

function renderStandingsRows(standings) {
  return standings.map((t, i) => {
    const posClass = i < 2 ? 'st-pos--q' : i === 2 ? 'st-pos--t' : 'st-pos--out';
    return `<tr>
      <td><span class="st-pos ${posClass}">${i+1}</span></td>
      <td><span class="st-team">${t.f} ${t.n}</span></td>
      <td>${t.j}</td><td>${t.g}</td><td>${t.e}</td><td>${t.p}</td>
      <td>${t.gd > 0 ? '+' : ''}${t.gd}</td>
      <td class="st-pts">${t.pts}</td>
    </tr>`;
  }).join('');
}

function renderMatchRow(gKey, mi, gsData) {
  const sched = GROUP_SCHEDULE[gKey][mi];
  const [hi, ai] = sched.pair;
  const th = GROUPS[gKey].teams[hi];
  const ta = GROUPS[gKey].teams[ai];
  const sc = gsData[`${gKey}-${mi}`] ?? ['',''];

  const dateLine = sched.date
    ? `<span class="match-date">${formatDate(sched.date)}${sched.time ? ' · ' + sched.time + ' ' + sched.tz : ''} · ${sched.city}</span>`
    : '';

  return `
    <div class="match-row">
      <div style="flex:1;min-width:0">
        ${dateLine}
        <div style="display:flex;align-items:center;gap:.5rem">
          <span class="match-team">${th.f} <span>${th.n}</span></span>
          <div class="match-score">
            <input class="score-inp" type="number" min="0" max="20" inputmode="numeric"
              value="${sc[0]}"
              data-group="${gKey}" data-match="${mi}" data-side="h"
              aria-label="Goles de ${th.n}">
            <span class="score-sep">-</span>
            <input class="score-inp" type="number" min="0" max="20" inputmode="numeric"
              value="${sc[1]}"
              data-group="${gKey}" data-match="${mi}" data-side="a"
              aria-label="Goles de ${ta.n}">
          </div>
          <span class="match-team match-team--away"><span>${ta.n}</span> ${ta.f}</span>
        </div>
      </div>
    </div>`;
}

function onScoreChange(gKey) {
  const gsData = getDraftGS();
  const panel  = document.getElementById(`gpanel-${gKey}`);

  panel.querySelectorAll('.score-inp').forEach(inp => {
    const key  = `${inp.dataset.group}-${inp.dataset.match}`;
    gsData[key] = gsData[key] ?? ['',''];
    gsData[key][inp.dataset.side === 'h' ? 0 : 1] = inp.value;
  });

  saveDraftGS(gsData);
  document.getElementById(`st-${gKey}`).innerHTML =
    renderStandingsRows(calcStandings(gKey, gsData));
  refreshKnockout();
}

/* ====================================================
   FASE ELIMINATORIA — UI
   ==================================================== */
const KO_ORDER = ['r32','r16','qf','sf','3rd','final'];

function initKnockout() {
  const tabNav = document.getElementById('ko-tab-nav');
  const panels = document.getElementById('ko-panels');

  tabNav.innerHTML = KO_ORDER.map((k, i) =>
    `<button class="phase-tab" role="tab" aria-selected="${i===0}" data-round="${k}">
       ${ROUNDS[k].label}
     </button>`
  ).join('');

  panels.innerHTML = KO_ORDER.map((k, i) =>
    `<div id="kopanel-${k}" role="tabpanel" ${i !== 0 ? 'hidden' : ''}></div>`
  ).join('');

  tabNav.addEventListener('click', e => {
    const tab = e.target.closest('.phase-tab');
    if (!tab) return;
    tabNav.querySelectorAll('.phase-tab').forEach(t => t.setAttribute('aria-selected','false'));
    tab.setAttribute('aria-selected','true');
    panels.querySelectorAll('[role="tabpanel"]').forEach(p => p.hidden = true);
    document.getElementById(`kopanel-${tab.dataset.round}`).hidden = false;
  });

  refreshKnockout();
}

function refreshKnockout() {
  const gsData    = getDraftGS();
  const koPicks   = getDraftKO();
  const standings = getAllStandings(gsData);
  const qualifiers= getQualifiers(standings);
  const best3     = getBest3rds(standings);

  KO_ORDER.forEach(roundKey => {
    const panel = document.getElementById(`kopanel-${roundKey}`);
    if (!panel) return;
    renderKORound(roundKey, panel, qualifiers, best3, koPicks);
  });
}

function renderKORound(roundKey, panel, qualifiers, best3, koPicks) {
  panel.innerHTML = `<div class="ko-round">${
    ROUNDS[roundKey].matches.map(m => renderKOMatch(m, qualifiers, best3, koPicks, roundKey)).join('')
  }</div>`;

  panel.querySelectorAll('.ko-pick').forEach(btn => {
    btn.addEventListener('click', () => onKOPick(btn, koPicks));
  });

  panel.querySelectorAll('.ko-score-inp').forEach(inp => {
    inp.addEventListener('change', () => {
      const picks = getDraftKO();
      const k = inp.dataset.match;
      if (!picks[k]) picks[k] = {};
      picks[k][inp.dataset.side === 'h' ? 'sh' : 'sa'] = inp.value;
      saveDraftKO(picks);
    });
  });
}

function renderKOMatch(m, qualifiers, best3, koPicks, roundKey) {
  let teamH, teamA;

  if (m.h && m.a) {
    teamH = resolveSlot(m.h, qualifiers, best3, koPicks);
    teamA = resolveSlot(m.a, qualifiers, best3, koPicks);
  } else {
    teamH = resolveSlot(m.p1, qualifiers, best3, koPicks);
    teamA = resolveSlot(m.p2, qualifiers, best3, koPicks);
    if (m.p1?.endsWith('-L')) teamH = resolveLoser(m.p1.slice(0,-2), koPicks, qualifiers, best3);
    if (m.p2?.endsWith('-L')) teamA = resolveLoser(m.p2.slice(0,-2), koPicks, qualifiers, best3);
  }

  const pick   = koPicks[m.id];
  const winner = pick?.team ?? null;
  const sh     = pick?.sh ?? '';
  const sa     = pick?.sa ?? '';
  const hasPick= !!winner;
  const hIsWin = winner && teamH && winner === teamH.replace(/^\S+\s/, '').trim();
  const aIsWin = winner && teamA && winner === teamA.replace(/^\S+\s/, '').trim();
  const tbd    = !teamH && !teamA;

  const dateLine = m.date
    ? `<div class="ko-match__date">📅 ${formatDate(m.date)}${m.city ? ' · ' + m.city : ''}</div>`
    : '';

  if (tbd) {
    return `<div class="ko-match">
      <div class="ko-match__teams"><span class="ko-tbd">Por determinar (completa las rondas anteriores)</span></div>
      ${dateLine}
      <div class="ko-match__label">${ROUNDS[roundKey].label} · ${m.id.toUpperCase()}</div>
    </div>`;
  }

  const dis = !teamH || !teamA ? 'disabled' : '';

  return `
    <div class="ko-match${hasPick ? ' has-pick' : ''}" id="kom-${m.id}">
      <div class="ko-match__teams">
        <button class="ko-pick${hIsWin?' is-winner':''}${aIsWin?' is-loser':''}"
          data-match="${m.id}" data-team="${escStr(teamH||'')}" data-side="h"
          ${dis} aria-pressed="${hIsWin}" aria-label="Elegir ${teamH||'equipo'} como ganador">
          ${teamH || '¿?'}
        </button>
        <div class="ko-match__mid">
          <span class="ko-vs">VS</span>
          <div class="ko-score-row">
            <input class="ko-score-inp" type="number" min="0" max="20"
              value="${sh}" data-match="${m.id}" data-side="h"
              aria-label="Goles local" inputmode="numeric">
            <span class="score-sep">-</span>
            <input class="ko-score-inp" type="number" min="0" max="20"
              value="${sa}" data-match="${m.id}" data-side="a"
              aria-label="Goles visitante" inputmode="numeric">
          </div>
        </div>
        <button class="ko-pick ko-pick--away${aIsWin?' is-winner':''}${hIsWin?' is-loser':''}"
          data-match="${m.id}" data-team="${escStr(teamA||'')}" data-side="a"
          ${dis} aria-pressed="${aIsWin}" aria-label="Elegir ${teamA||'equipo'} como ganador">
          ${teamA || '¿?'}
        </button>
      </div>
      ${dateLine}
      <div class="ko-match__label">${ROUNDS[roundKey].label} · ${m.id.toUpperCase()}</div>
    </div>`;
}

function onKOPick(btn, koPicks) {
  const matchId = btn.dataset.match;
  const rawTeam = btn.dataset.team;
  const team    = rawTeam.replace(/^\S+\s/, '').trim() || rawTeam.trim();
  const hf      = rawTeam.split(' ')[0];
  const fresh   = getDraftKO(); // always read fresh to avoid stale score loss
  fresh[matchId] = { ...(fresh[matchId]||{}), team, hf };
  saveDraftKO(fresh);
  refreshKnockout();
}

/* ====================================================
   PUNTUACIÓN
   ==================================================== */
function normalize(str) {
  return String(str ?? '').trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function calcPtsGroup(predH, predA, realH, realA) {
  if (predH === '' || predA === '' || realH === '' || realA === '') return 0;
  const [ph, pa, rh, ra] = [+predH, +predA, +realH, +realA];
  if (ph === rh && pa === ra) return 4;
  const res = n => n > 0 ? 1 : n < 0 ? -1 : 0;
  if (res(ph-pa) === res(rh-ra)) return 2;
  return 0;
}

function calcPtsKO(predTeam, predSH, predSA, realTeam, realSH, realSA) {
  if (!predTeam || !realTeam) return 0;
  if (normalize(predTeam) !== normalize(realTeam)) return 0;
  if (predSH !== '' && predSA !== '' && realSH !== '' && realSA !== ''
      && +predSH === +realSH && +predSA === +realSA) return 6;
  return 3;
}

function calcBonusPts(entry, bonusActual) {
  if (!bonusActual) return 0;
  let pts = 0;
  for (const [field, value] of Object.entries(BONUS_POINTS)) {
    if (entry[field] && bonusActual[field] && normalize(entry[field]) === normalize(bonusActual[field])) {
      pts += value;
    }
  }
  return pts;
}

function calcEntryPts(entry) {
  const actualGS    = _actualGS;
  const actualKO    = _actualKO;
  const bonusActual = _actualBonus;
  let gsPts = 0, koPts = 0;

  if (entry.draftGS) {
    for (const [key, pred] of Object.entries(entry.draftGS)) {
      const real = actualGS[key];
      if (real) gsPts += calcPtsGroup(pred[0], pred[1], real[0], real[1]);
    }
  }
  if (entry.draftKO) {
    for (const [matchId, pred] of Object.entries(entry.draftKO)) {
      const real = actualKO[matchId];
      if (real) koPts += calcPtsKO(pred.team, pred.sh, pred.sa, real.team, real.sh, real.sa);
    }
  }
  return gsPts + koPts + calcBonusPts(entry, bonusActual);
}

/* ====================================================
   LEADERBOARD
   ==================================================== */
const lbEmpty = document.getElementById('lb-empty');
const lbTable = document.getElementById('lb-table');
const lbBody  = document.getElementById('lb-body');

const IS_ADMIN = new URLSearchParams(window.location.search).has('admin');

function renderLeaderboard() {
  const entries = _entries;
  if (entries.length === 0) { lbEmpty.hidden = false; lbTable.hidden = true; return; }

  const ranked = entries
    .map(e => ({ ...e, _pts: calcEntryPts(e) }))
    .sort((a,b) => b._pts - a._pts);

  lbEmpty.hidden = true;
  lbTable.hidden = false;

  lbBody.innerHTML = ranked.map((e, i) => {
    const pos = i + 1;
    const rankClass = pos <= 3 ? `lb-rank--${pos}` : '';
    const medal = pos === 1 ? '🏆' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos;
    const delBtn = IS_ADMIN
      ? `<button class="lb-del" data-id="${e.id}"
           aria-label="Eliminar porra de ${safeText(e.nombre)}">Eliminar</button>`
      : '';
    return `<tr>
      <td><span class="lb-rank ${rankClass}">${medal}</span></td>
      <td><strong>${safeText(e.nombre)}</strong></td>
      <td><span class="lb-pts">${e._pts} pts</span></td>
      <td>${delBtn}</td>
    </tr>`;
  }).join('');

  lbBody.querySelectorAll('.lb-del').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteEntry(Number(btn.dataset.id));
    });
  });
}

function safeText(str) {
  const d = document.createElement('span');
  d.textContent = str;
  return d.innerHTML;
}

function escStr(str) { return str.replace(/"/g, '&quot;'); }

/* ====================================================
   RESULTADOS EN VIVO — Clasificación de grupos
   ==================================================== */
let _liveGroupsReady = false;

function renderGroupMatchResults(k) {
  const teams = GROUPS[k].teams;
  return GROUP_SCHEDULE[k].map((sched, mi) => {
    const [hi, ai] = sched.pair;
    const sc = _actualGS[`${k}-${mi}`];
    const hasResult = sc != null && sc[0] != null && sc[1] != null;
    const dateStr = new Date(sched.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const scoreH = hasResult ? safeText(String(sc[0])) : '?';
    const scoreA = hasResult ? safeText(String(sc[1])) : '?';
    return `<div class="match-row${hasResult ? ' match-row--done' : ''}">
      <span class="match-row__date">${safeText(dateStr)}</span>
      <span class="match-team">${safeText(teams[hi].n)}</span>
      <span class="match-score">
        <span class="live-score">${scoreH}</span>
        <span class="score-sep">–</span>
        <span class="live-score">${scoreA}</span>
      </span>
      <span class="match-team match-team--away">${safeText(teams[ai].n)}</span>
    </div>`;
  }).join('');
}

function renderLiveGroups() {
  const tabNav = document.getElementById('live-group-tabs');
  const panels = document.getElementById('live-group-panels');
  if (!tabNav || !panels) return;

  const groupKeys = Object.keys(GROUPS);

  if (!_liveGroupsReady) {
    _liveGroupsReady = true;
    tabNav.innerHTML = groupKeys.map((k, i) =>
      `<button class="phase-tab" role="tab" aria-selected="${i===0}" data-live-group="${k}">Grupo ${k}</button>`
    ).join('');

    panels.innerHTML = groupKeys.map((k, i) =>
      `<div id="livepanel-${k}" role="tabpanel" ${i !== 0 ? 'hidden' : ''}>
        <div class="standings">
          <div class="standings__head">Partidos Grupo ${k}</div>
          <div id="live-matches-${k}"></div>
        </div>
        <div class="standings">
          <div class="standings__head">Clasificación Grupo ${k}</div>
          <table aria-label="Clasificación real del Grupo ${k}">
            <thead>
              <tr>
                <th>#</th><th style="text-align:left">Equipo</th>
                <th title="Partidos jugados">PJ</th>
                <th title="Victorias">V</th>
                <th title="Empates">E</th>
                <th title="Derrotas">D</th>
                <th title="Diferencia de goles">DG</th>
                <th title="Puntos">Pts</th>
              </tr>
            </thead>
            <tbody id="live-st-${k}"></tbody>
          </table>
        </div>
      </div>`
    ).join('');

    tabNav.addEventListener('click', e => {
      const tab = e.target.closest('.phase-tab[data-live-group]');
      if (!tab) return;
      tabNav.querySelectorAll('.phase-tab').forEach(t => t.setAttribute('aria-selected','false'));
      tab.setAttribute('aria-selected','true');
      panels.querySelectorAll('[role="tabpanel"]').forEach(p => p.hidden = true);
      document.getElementById(`livepanel-${tab.dataset.liveGroup}`).hidden = false;
    });
  }

  groupKeys.forEach(k => {
    const tbody = document.getElementById(`live-st-${k}`);
    if (tbody) tbody.innerHTML = renderStandingsRows(calcStandings(k, _actualGS));
    const matchesEl = document.getElementById(`live-matches-${k}`);
    if (matchesEl) matchesEl.innerHTML = renderGroupMatchResults(k);
  });
}

/* ====================================================
   RESULTADOS EN VIVO — Cuadro eliminatorio
   ==================================================== */
let _liveBracketReady = false;

function resolveLiveSlot(slot, qualifiers, best3) {
  if (!slot) return null;
  const isLoser = slot.endsWith('-L');
  const matchId = isLoser ? slot.slice(0, -2) : slot;

  if (/^[12][A-L]$/.test(matchId)) {
    const t = qualifiers[matchId];
    return t ? `${t.f} ${t.n}` : null;
  }
  if (/^3-\d+$/.test(matchId)) {
    const idx = parseInt(matchId.split('-')[1], 10) - 1;
    const t = best3[idx];
    return t ? `${t.f} ${t.n}` : null;
  }

  const actual = _actualKO[matchId];
  if (!actual?.team) return null;
  if (!isLoser) return actual.team;

  // Para slot de perdedor: buscar el equipo que no ganó ese partido
  for (const round of Object.values(ROUNDS)) {
    const m = round.matches.find(x => x.id === matchId);
    if (!m) continue;
    const h = m.h ? resolveLiveSlot(m.h, qualifiers, best3) : resolveLiveSlot(m.p1, qualifiers, best3);
    const a = m.a ? resolveLiveSlot(m.a, qualifiers, best3) : resolveLiveSlot(m.p2, qualifiers, best3);
    const stripFlag = s => s ? s.replace(/^\S+\s/, '').trim() : s;
    if (h && normalize(stripFlag(h) || h) === normalize(actual.team)) return a;
    if (a && normalize(stripFlag(a) || a) === normalize(actual.team)) return h;
    return null;
  }
  return null;
}

function renderLiveBracketMatch(m, roundKey, qualifiers, best3) {
  let teamH, teamA;
  if (m.h && m.a) {
    teamH = resolveLiveSlot(m.h, qualifiers, best3);
    teamA = resolveLiveSlot(m.a, qualifiers, best3);
  } else {
    teamH = m.p1 ? resolveLiveSlot(m.p1, qualifiers, best3) : null;
    teamA = m.p2 ? resolveLiveSlot(m.p2, qualifiers, best3) : null;
  }

  const actual  = _actualKO[m.id];
  const winner  = actual?.team;
  const sh      = actual?.sh;
  const sa      = actual?.sa;

  const hDisplay = teamH ?? (m.h || m.p1 || '?');
  const aDisplay = teamA ?? (m.a || m.p2 || '?');
  const stripFlag = s => s ? s.replace(/^\S+\s/, '').trim() : s;
  const hWins = winner && teamH && normalize(winner) === normalize(stripFlag(teamH) || teamH);
  const aWins = winner && teamA && normalize(winner) === normalize(stripFlag(teamA) || teamA);

  return `
    <div class="ko-match${winner ? ' has-pick' : ''}">
      <div class="ko-match__teams">
        <button class="ko-pick${hWins ? ' is-winner' : ''}${(winner && !hWins) ? ' is-loser' : ''}"
          disabled aria-label="${escStr(hDisplay)}">${safeText(hDisplay)}</button>
        <div class="ko-match__mid">
          <span class="ko-vs">VS</span>
          <div class="ko-score-row">
            <span class="live-score">${winner ? (sh ?? '?') : '?'}</span>
            <span class="score-sep">–</span>
            <span class="live-score">${winner ? (sa ?? '?') : '?'}</span>
          </div>
        </div>
        <button class="ko-pick ko-pick--away${aWins ? ' is-winner' : ''}${(winner && !aWins) ? ' is-loser' : ''}"
          disabled aria-label="${escStr(aDisplay)}">${safeText(aDisplay)}</button>
      </div>
      ${m.date ? `<div class="ko-match__date">📅 ${formatDate(m.date)}${m.city ? ' · ' + m.city : ''}</div>` : ''}
      <div class="ko-match__label">${ROUNDS[roundKey].label} · ${m.id.toUpperCase()}</div>
    </div>`;
}

function renderLiveBracket() {
  const container = document.getElementById('live-bracket');
  if (!container) return;

  if (!_liveBracketReady) {
    _liveBracketReady = true;

    const tabNav = document.createElement('nav');
    tabNav.className = 'phase-tabs';
    tabNav.id = 'live-ko-tabs';
    tabNav.setAttribute('role', 'tablist');
    tabNav.setAttribute('aria-label', 'Rondas eliminatorias (resultados reales)');
    tabNav.innerHTML = KO_ORDER.map((k, i) =>
      `<button class="phase-tab" role="tab" aria-selected="${i===0}" data-live-round="${k}">${ROUNDS[k].label}</button>`
    ).join('');
    container.appendChild(tabNav);

    const panelsDiv = document.createElement('div');
    panelsDiv.id = 'live-ko-panels';
    KO_ORDER.forEach((k, i) => {
      const p = document.createElement('div');
      p.id = `live-kopanel-${k}`;
      p.setAttribute('role', 'tabpanel');
      if (i !== 0) p.hidden = true;
      panelsDiv.appendChild(p);
    });
    container.appendChild(panelsDiv);

    tabNav.addEventListener('click', e => {
      const tab = e.target.closest('.phase-tab[data-live-round]');
      if (!tab) return;
      tabNav.querySelectorAll('.phase-tab').forEach(t => t.setAttribute('aria-selected','false'));
      tab.setAttribute('aria-selected','true');
      panelsDiv.querySelectorAll('[role="tabpanel"]').forEach(p => p.hidden = true);
      document.getElementById(`live-kopanel-${tab.dataset.liveRound}`).hidden = false;
    });
  }

  const allStandings = getAllStandings(_actualGS);
  const qualifiers   = getQualifiers(allStandings);
  const best3        = getBest3rds(allStandings);

  KO_ORDER.forEach(roundKey => {
    const panel = document.getElementById(`live-kopanel-${roundKey}`);
    if (!panel) return;
    panel.innerHTML = `<div class="ko-round">${
      ROUNDS[roundKey].matches.map(m => renderLiveBracketMatch(m, roundKey, qualifiers, best3)).join('')
    }</div>`;
  });
}

function initParticipaSteps() {
  const tabNav = document.getElementById('participa-tabs');
  if (!tabNav) return;

  function activateStep(name) {
    tabNav.querySelectorAll('.phase-tab').forEach(t =>
      t.setAttribute('aria-selected', t.dataset.pstep === name ? 'true' : 'false')
    );
    ['grupos', 'elim', 'form'].forEach(s => {
      document.getElementById(`pstep-${s}`).hidden = s !== name;
    });
  }

  tabNav.addEventListener('click', e => {
    const tab = e.target.closest('.phase-tab[data-pstep]');
    if (tab) activateStep(tab.dataset.pstep);
  });

  document.querySelectorAll('a[data-pstep]').forEach(link => {
    link.addEventListener('click', () => activateStep(link.dataset.pstep));
  });
}

function initPanelTabs() {
  const tabNav = document.getElementById('panel-tabs');
  if (!tabNav) return;

  function activatePanel(name) {
    tabNav.querySelectorAll('.phase-tab').forEach(t =>
      t.setAttribute('aria-selected', t.dataset.panel === name ? 'true' : 'false')
    );
    document.getElementById('panel-live').hidden     = name !== 'live';
    document.getElementById('panel-mi-porra').hidden = name !== 'mi-porra';
  }

  tabNav.addEventListener('click', e => {
    const tab = e.target.closest('.phase-tab[data-panel]');
    if (tab) activatePanel(tab.dataset.panel);
  });

  document.querySelectorAll('a[data-open-panel]').forEach(link => {
    link.addEventListener('click', () => activatePanel(link.dataset.openPanel));
  });

  // Sub-tabs: Grupos / Eliminatorias dentro del panel de resultados
  const mainTabs = document.getElementById('live-main-tabs');
  if (mainTabs) {
    mainTabs.addEventListener('click', e => {
      const tab = e.target.closest('.phase-tab[data-live-tab]');
      if (!tab) return;
      mainTabs.querySelectorAll('.phase-tab').forEach(t => t.setAttribute('aria-selected','false'));
      tab.setAttribute('aria-selected','true');
      document.getElementById('live-grupos').hidden = tab.dataset.liveTab !== 'live-grupos';
      document.getElementById('live-elim').hidden   = tab.dataset.liveTab !== 'live-elim';
    });
  }

  renderLiveGroups();
  renderLiveBracket();
}

/* ====================================================
   MI PORRA — Seguimiento personal de predicciones
   ==================================================== */
const BONUS_LABELS = {
  campeon: 'Campeón 🏆', subcampeon: 'Subcampeón 🥈', tercero: 'Tercer Puesto 🥉',
  cuarto: 'Cuarto 4️⃣', goleador: 'Goleador ⚽', portero: 'Portero 🧤',
  mvp: 'MVP ⭐', joven: 'Joven 👶', sorpresa: 'Sorpresa 😲',
};

function mpStatusIcon(pts, hasReal) {
  if (!hasReal) return '<span class="mp-icon mp-icon--pending">—</span>';
  if (pts === 4 || pts === 6) return '<span class="mp-icon mp-icon--ok">✓✓</span>';
  if (pts > 0) return '<span class="mp-icon mp-icon--ok">✓</span>';
  return '<span class="mp-icon mp-icon--fail">✗</span>';
}

function renderMyPorraGS(entry) {
  const rows = Object.keys(GROUPS).map(gKey => {
    const matchRows = GROUP_SCHEDULE[gKey].map((sched, mi) => {
      const key  = `${gKey}-${mi}`;
      const pred = entry.draftGS?.[key];
      const real = _actualGS[key];
      const th   = GROUPS[gKey].teams[sched.pair[0]];
      const ta   = GROUPS[gKey].teams[sched.pair[1]];
      const predStr = pred && pred[0] !== '' && pred[1] !== '' ? `${pred[0]}–${pred[1]}` : '—';
      const realStr = real && real[0] !== '' && real[1] !== '' ? `${real[0]}–${real[1]}` : '—';
      const pts  = (real && pred) ? calcPtsGroup(pred[0], pred[1], real[0], real[1]) : 0;
      return `<tr>
        <td class="mp-match">${th.f} ${th.n} – ${ta.n} ${ta.f}</td>
        <td class="mp-pred">${predStr}</td>
        <td class="mp-real">${realStr}</td>
        <td>${mpStatusIcon(pts, !!real)}</td>
        <td class="mp-pts">${real && pred ? `+${pts}` : '—'}</td>
      </tr>`;
    }).join('');
    return `<tr class="mp-group-head"><td colspan="5">Grupo ${gKey}</td></tr>${matchRows}`;
  }).join('');

  return `
    <div class="mp-section">
      <h3 class="mp-section-title">⚽ Fase de Grupos</h3>
      <div class="mp-table-wrap">
        <table class="mp-table">
          <thead><tr><th>Partido</th><th>Tu marcador</th><th>Real</th><th></th><th>Pts</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderMyPorraKO(entry) {
  const rows = KO_ORDER.flatMap(roundKey =>
    ROUNDS[roundKey].matches.map(m => {
      const pred = entry.draftKO?.[m.id];
      const real = _actualKO[m.id];
      const predTeam  = pred?.team ? safeText(pred.team) : '—';
      const predScore = (pred?.sh !== undefined && pred?.sh !== '') ? ` (${pred.sh}–${pred.sa})` : '';
      const realTeam  = real?.team ? safeText(real.team) : '—';
      const realScore = (real?.sh !== undefined && real?.sh !== '') ? ` (${real.sh}–${real.sa})` : '';
      const pts = real ? calcPtsKO(pred?.team, pred?.sh, pred?.sa, real.team, real.sh, real.sa) : 0;
      return `<tr>
        <td class="mp-match">${ROUNDS[roundKey].label}</td>
        <td class="mp-pred">${predTeam}${predScore}</td>
        <td class="mp-real">${realTeam}${realScore}</td>
        <td>${mpStatusIcon(pts, !!real)}</td>
        <td class="mp-pts">${real ? `+${pts}` : '—'}</td>
      </tr>`;
    })
  ).join('');

  return `
    <div class="mp-section">
      <h3 class="mp-section-title">🏆 Fase Eliminatoria</h3>
      <div class="mp-table-wrap">
        <table class="mp-table">
          <thead><tr><th>Ronda</th><th>Tu equipo</th><th>Ganador real</th><th></th><th>Pts</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderMyPorraBonus(entry) {
  const rows = Object.entries(BONUS_POINTS).map(([field, maxPts]) => {
    const pred    = entry[field] || '';
    const real    = _actualBonus?.[field] || '';
    const correct = _actualBonus && pred && normalize(pred) === normalize(real);
    const pts     = correct ? maxPts : 0;
    return `<tr>
      <td class="mp-match">${BONUS_LABELS[field]}</td>
      <td class="mp-pred">${safeText(pred) || '—'}</td>
      <td class="mp-real">${safeText(real) || '—'}</td>
      <td>${mpStatusIcon(pts, !!_actualBonus)}</td>
      <td class="mp-pts">${_actualBonus ? `+${pts}/${maxPts}` : '—'}</td>
    </tr>`;
  }).join('');

  return `
    <div class="mp-section">
      <h3 class="mp-section-title">⭐ Bonus Especiales</h3>
      <div class="mp-table-wrap">
        <table class="mp-table">
          <thead><tr><th>Premio</th><th>Tu predicción</th><th>Real</th><th></th><th>Pts</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderMyPorra(nombre) {
  const content = document.getElementById('mp-content');
  if (!content) return;
  const n = (nombre || '').trim();
  if (!n) { content.innerHTML = ''; return; }

  const entry = _entries.find(e => normalize(e.nombre) === normalize(n));
  if (!entry) {
    content.innerHTML = `<p class="mp-msg mp-msg--error">No se encontró ninguna porra con el nombre "<strong>${safeText(n)}</strong>".<br>Comprueba que escribes exactamente el mismo nombre que usaste al guardar.</p>`;
    return;
  }

  const totalPts = calcEntryPts(entry);
  content.innerHTML = `
    <div class="mp-summary">
      <span class="mp-summary__name">${safeText(entry.nombre)}</span>
      <span class="lb-pts">${totalPts} pts</span>
    </div>
    ${renderMyPorraGS(entry)}
    ${renderMyPorraKO(entry)}
    ${renderMyPorraBonus(entry)}`;
}

function initMyPorra() {
  const input  = document.getElementById('mp-nombre');
  const btn    = document.getElementById('mp-buscar');
  if (!input || !btn) return;

  const saved = localStorage.getItem('porra26-mi-nombre');
  if (saved) { input.value = saved; renderMyPorra(saved); }

  btn.addEventListener('click', () => {
    const n = input.value.trim();
    if (n) localStorage.setItem('porra26-mi-nombre', n);
    renderMyPorra(n);
  });

  input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
}

/* ====================================================
   FORMULARIO DE PARTICIPACIÓN
   ==================================================== */
(function initForm() {
  const form      = document.getElementById('porra-form');
  const nameInput = document.getElementById('f-nombre');
  const nameErr   = document.getElementById('f-nombre-err');
  const toast     = document.getElementById('form-toast');
  const toastMsg  = document.getElementById('toast-msg');

  // Soft-lock: only lock if user has actually submitted a porra (not just searched in Mi Porra)
  const savedName = localStorage.getItem('porra26-guardada');
  if (savedName) {
    nameInput.value    = savedName;
    nameInput.readOnly = true;
    nameInput.classList.add('is-locked');
    const lockNote = document.createElement('p');
    lockNote.className = 'form-lock-note';
    lockNote.textContent = `Editando la porra de `;
    const strong = document.createElement('strong');
    strong.textContent = savedName;
    lockNote.appendChild(strong);
    lockNote.appendChild(document.createTextNode('. Puedes actualizar tus predicciones.'));
    nameInput.parentElement.appendChild(lockNote);
    const submitSpan = form.querySelector('[type="submit"] span:first-child');
    if (submitSpan) submitSpan.textContent = 'Actualizar mi porra';
  }

  nameInput.addEventListener('input', () => {
    nameInput.classList.remove('is-invalid');
    nameErr.textContent = '';
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const nombre = nameInput.value.trim();
    if (!nombre) {
      nameInput.classList.add('is-invalid');
      nameErr.textContent = 'Por favor, escribe tu nombre o alias.';
      nameInput.focus();
      return;
    }

    const entry = {
      id:         Date.now(),
      nombre,
      campeon:    form.campeon.value.trim(),
      subcampeon: form.subcampeon.value.trim(),
      tercero:    form.tercero.value.trim(),
      cuarto:     form.cuarto.value.trim(),
      goleador:   form.goleador.value.trim(),
      portero:    form.portero.value.trim(),
      mvp:        form.mvp.value.trim(),
      joven:      form.joven.value.trim(),
      sorpresa:   form.sorpresa.value.trim(),
      draftGS:    getDraftGS(),
      draftKO:    getDraftKO(),
    };

    const existing = _entries.find(ex => normalize(ex.nombre) === normalize(nombre));
    if (existing) {
      entry.id = existing.id; // reutiliza la misma clave en Firebase
      showToast('✅ Porra actualizada con tus predicciones actuales.');
    } else {
      showToast('✅ ¡Porra guardada! Grupos, eliminatoria y bonus registrados.');
    }

    await saveEntry(entry);
    localStorage.setItem('porra26-mi-nombre', entry.nombre);
    localStorage.setItem('porra26-guardada', entry.nombre);
    form.reset();
    document.getElementById('clasificacion').scrollIntoView({ behavior:'smooth', block:'start' });
  });

  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.hidden = true; }, 6000);
  }
})();

/* ====================================================
   PANEL DE ADMINISTRACIÓN  (?admin=1)
   Introduce resultados reales día a día →
   los puntos se recalculan automáticamente
   ==================================================== */
(function initAdmin() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('admin')) return;

  const panel = document.getElementById('admin-panel');
  panel.hidden = false;

  // GS results
  const adminGSWrap = document.createElement('div');
  adminGSWrap.innerHTML = `
    <h4 class="admin-panel__title" style="margin-top:1.5rem">⚽ Resultados Reales — Fase de Grupos</h4>
    <p class="admin-panel__desc">Introduce el marcador real de cada partido. Los puntos se recalculan al instante.</p>
    <div id="admin-gs-content"></div>`;
  panel.appendChild(adminGSWrap);

  // KO results
  const adminKOWrap = document.createElement('div');
  adminKOWrap.innerHTML = `
    <h4 class="admin-panel__title" style="margin-top:1.5rem">🏆 Resultados Reales — Fase Eliminatoria</h4>
    <p class="admin-panel__desc">Introduce el ganador y el marcador de cada partido eliminatorio.</p>
    <div id="admin-ko-content"></div>`;
  panel.appendChild(adminKOWrap);

  renderAdminGS();
  renderAdminKO();

  // Bonus form — la pre-carga se hace en populateAdminBonus() cuando llega el snapshot de Firebase
  const resultsForm = document.getElementById('results-form');

  resultsForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(
      Object.keys(BONUS_POINTS).map(f => [f, resultsForm.elements[f]?.value.trim() ?? ''])
    );
    saveActualBonus(data);
    // renderLeaderboard se llama automáticamente por el listener de Firebase
    showAdminToast('✅ Bonus guardados. Puntuaciones actualizadas.');
  });
})();

function renderAdminGS() {
  const container = document.getElementById('admin-gs-content');
  if (!container) return;
  const actual = _actualGS;

  container.innerHTML = Object.entries(GROUPS).map(([gKey, g]) =>
    `<details style="margin-bottom:.6rem">
      <summary style="cursor:pointer;padding:.5rem;font-weight:700;color:var(--c-gold)">Grupo ${gKey}</summary>
      <div style="padding:.25rem 0">
        ${GROUP_SCHEDULE[gKey].map((sched, mi) => {
          const th = g.teams[sched.pair[0]], ta = g.teams[sched.pair[1]];
          const key = `${gKey}-${mi}`;
          const sc  = actual[key] ?? ['',''];
          const dl  = sched.date ? `<span style="font-size:.7rem;color:var(--c-text-3)">${formatDate(sched.date)} · ${sched.city}</span>` : '';
          return `<div class="match-row" style="flex-wrap:wrap">
            ${dl ? `<div style="flex-basis:100%;padding-bottom:.15rem">${dl}</div>` : ''}
            <span class="match-team" style="font-size:.82rem">${th.f} ${th.n}</span>
            <div class="match-score">
              <input class="score-inp admin-gs-inp" type="number" min="0" max="20"
                value="${sc[0]}" data-key="${key}" data-side="h"
                style="background:var(--c-bg-alt)" inputmode="numeric">
              <span class="score-sep">-</span>
              <input class="score-inp admin-gs-inp" type="number" min="0" max="20"
                value="${sc[1]}" data-key="${key}" data-side="a"
                style="background:var(--c-bg-alt)" inputmode="numeric">
            </div>
            <span class="match-team match-team--away" style="font-size:.82rem">${ta.n} ${ta.f}</span>
          </div>`;
        }).join('')}
      </div>
    </details>`
  ).join('');

  container.querySelectorAll('.admin-gs-inp').forEach(inp => {
    inp.addEventListener('change', () => {
      const updated = { ..._actualGS };
      updated[inp.dataset.key] = [...(updated[inp.dataset.key] ?? ['',''])];
      updated[inp.dataset.key][inp.dataset.side === 'h' ? 0 : 1] = inp.value;
      saveActualGS(updated);
      // renderLeaderboard y renderAdminGS se llaman automáticamente por el listener
      showAdminToast('✅ Resultado guardado. Clasificación actualizada.');
    });
  });
}

function renderAdminKO() {
  const container = document.getElementById('admin-ko-content');
  if (!container) return;
  const actual = _actualKO;

  const allMatches = KO_ORDER.flatMap(rk =>
    ROUNDS[rk].matches.map(m => ({ ...m, roundLabel: ROUNDS[rk].label }))
  );

  container.innerHTML = `<div style="display:flex;flex-direction:column;gap:.5rem">` +
    allMatches.map(m => {
      const pick = actual[m.id] ?? {};
      const dl   = m.date ? `<span style="font-size:.7rem;color:var(--c-text-3)">${formatDate(m.date)}${m.city ? ' · '+m.city : ''}</span>` : '';
      return `<div class="match-row" style="flex-wrap:wrap;gap:.5rem">
        <span style="font-size:.75rem;color:var(--c-text-2);flex-basis:100%">${m.roundLabel} — ${m.id.toUpperCase()} ${dl}</span>
        <input type="text" class="form-input admin-ko-team" data-match="${m.id}"
          value="${escStr(pick.team||'')}" placeholder="Equipo ganador"
          style="flex:1;min-width:130px;font-size:.85rem;padding:.5rem .75rem">
        <div class="match-score">
          <input class="score-inp admin-ko-sh" type="number" min="0" max="20"
            value="${pick.sh||''}" data-match="${m.id}" style="background:var(--c-bg-alt)" inputmode="numeric">
          <span class="score-sep">-</span>
          <input class="score-inp admin-ko-sa" type="number" min="0" max="20"
            value="${pick.sa||''}" data-match="${m.id}" style="background:var(--c-bg-alt)" inputmode="numeric">
        </div>
        <button class="btn btn--secondary admin-ko-save" data-match="${m.id}"
          style="padding:.4rem .9rem;font-size:.82rem">Guardar</button>
      </div>`;
    }).join('') + `</div>`;

  container.querySelectorAll('.admin-ko-save').forEach(btn => {
    btn.addEventListener('click', () => {
      const matchId = btn.dataset.match;
      const row     = btn.closest('.match-row');
      const updated = { ..._actualKO };
      updated[matchId] = {
        team: row.querySelector('.admin-ko-team').value.trim(),
        sh:   row.querySelector('.admin-ko-sh').value,
        sa:   row.querySelector('.admin-ko-sa').value,
      };
      saveActualKO(updated);
      // renderLeaderboard y renderAdminKO se llaman automáticamente por el listener
      showAdminToast('✅ Resultado guardado. Puntuaciones recalculadas.');
    });
  });
}

function showAdminToast(msg) {
  let t = document.getElementById('admin-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'admin-toast';
    t.className = 'form-toast';
    t.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:999;max-width:360px';
    document.body.appendChild(t);
  }
  t.innerHTML = `<span>✅</span><p>${safeText(msg)}</p>`;
  t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.hidden = true; }, 4000);
}

/* ====================================================
   COUNTDOWN
   ==================================================== */
(function initCountdown() {
  const els = {
    days:  document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    mins:  document.getElementById('cd-mins'),
    secs:  document.getElementById('cd-secs'),
  };
  function pad(n) { return String(n).padStart(2,'0'); }
  function tick() {
    const diff = WC_KICKOFF - Date.now();
    if (diff <= 0) {
      document.querySelector('.hero__countdown').innerHTML =
        '<p style="color:var(--c-gold);font-size:1.4rem;font-weight:800">¡El Mundial ha comenzado! ⚽</p>';
      return;
    }
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000)  /    60_000);
    const s = Math.floor((diff %    60_000)  /     1_000);
    els.days.textContent = pad(d); els.hours.textContent = pad(h);
    els.mins.textContent = pad(m); els.secs.textContent  = pad(s);
  }
  tick();
  setInterval(tick, 1000);
})();

/* ====================================================
   NAVEGACIÓN MÓVIL
   ==================================================== */
(function initNav() {
  const toggle = document.querySelector('.nav__toggle');
  const menu   = document.getElementById('nav-menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded','false');
    });
  });
  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded','false');
    }
  });
})();

/* ====================================================
   PRINT
   ==================================================== */
document.getElementById('btn-print')?.addEventListener('click', () => window.print());

/* ====================================================
   ARRANQUE
   ==================================================== */
initGroups();
initKnockout();
initParticipaSteps();
initPanelTabs();
initMyPorra();
initFirebaseListeners(); // Inicia la sincronización en tiempo real con Firebase
