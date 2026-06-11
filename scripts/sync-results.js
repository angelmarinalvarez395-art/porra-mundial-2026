'use strict';

const fetch    = require('node-fetch');
const admin    = require('firebase-admin');
const TEAM_MAP = require('./team-mapping');

// ── DATOS DEL MUNDIAL (copia de app.js) ──────────────────────────────────
const GROUPS = {
  A: { teams: [{ n:'Chequia' }, { n:'México' }, { n:'Sudáfrica' }, { n:'Corea del Sur' }] },
  B: { teams: [{ n:'Bosnia-Herzegovina' }, { n:'Canadá' }, { n:'Catar' }, { n:'Suiza' }] },
  C: { teams: [{ n:'Brasil' }, { n:'Haití' }, { n:'Marruecos' }, { n:'Escocia' }] },
  D: { teams: [{ n:'Australia' }, { n:'Paraguay' }, { n:'Turquía' }, { n:'USA' }] },
  E: { teams: [{ n:'Curazao' }, { n:'Ecuador' }, { n:'Alemania' }, { n:'Costa de Marfil' }] },
  F: { teams: [{ n:'Japón' }, { n:'Países Bajos' }, { n:'Suecia' }, { n:'Túnez' }] },
  G: { teams: [{ n:'Bélgica' }, { n:'Egipto' }, { n:'Irán' }, { n:'Nueva Zelanda' }] },
  H: { teams: [{ n:'Cabo Verde' }, { n:'Arabia Saudí' }, { n:'España' }, { n:'Uruguay' }] },
  I: { teams: [{ n:'Francia' }, { n:'Irak' }, { n:'Noruega' }, { n:'Senegal' }] },
  J: { teams: [{ n:'Argelia' }, { n:'Argentina' }, { n:'Austria' }, { n:'Jordania' }] },
  K: { teams: [{ n:'Colombia' }, { n:'R.D. Congo' }, { n:'Portugal' }, { n:'Uzbekistán' }] },
  L: { teams: [{ n:'Croacia' }, { n:'Inglaterra' }, { n:'Ghana' }, { n:'Panamá' }] },
};

const GROUP_SCHEDULE = {
  A: [
    { pair:[1,2], date:'2026-06-11' }, { pair:[0,3], date:'2026-06-11' },
    { pair:[0,1], date:'2026-06-15' }, { pair:[2,3], date:'2026-06-15' },
    { pair:[0,2], date:'2026-06-18' }, { pair:[1,3], date:'2026-06-18' },
  ],
  B: [
    { pair:[0,1], date:'2026-06-12' }, { pair:[2,3], date:'2026-06-13' },
    { pair:[0,3], date:'2026-06-18' }, { pair:[1,2], date:'2026-06-18' },
    { pair:[1,3], date:'2026-06-24' }, { pair:[0,2], date:'2026-06-24' },
  ],
  C: [
    { pair:[0,2], date:'2026-06-13' }, { pair:[1,3], date:'2026-06-13' },
    { pair:[2,3], date:'2026-06-19' }, { pair:[0,1], date:'2026-06-19' },
    { pair:[0,3], date:'2026-06-24' }, { pair:[1,2], date:'2026-06-24' },
  ],
  D: [
    { pair:[1,3], date:'2026-06-12' }, { pair:[0,2], date:'2026-06-13' },
    { pair:[0,3], date:'2026-06-19' }, { pair:[1,2], date:'2026-06-19' },
    { pair:[2,3], date:'2026-06-25' }, { pair:[0,1], date:'2026-06-25' },
  ],
  E: [
    { pair:[2,0], date:'2026-06-14' }, { pair:[1,3], date:'2026-06-14' },
    { pair:[2,3], date:'2026-06-20' }, { pair:[0,1], date:'2026-06-20' },
    { pair:[1,2], date:'2026-06-25' }, { pair:[0,3], date:'2026-06-25' },
  ],
  F: [
    { pair:[1,0], date:'2026-06-14' }, { pair:[2,3], date:'2026-06-14' },
    { pair:[1,2], date:'2026-06-20' }, { pair:[0,3], date:'2026-06-20' },
    { pair:[0,2], date:'2026-06-25' }, { pair:[1,3], date:'2026-06-25' },
  ],
  G: [
    { pair:[0,1], date:'2026-06-15' }, { pair:[2,3], date:'2026-06-15' },
    { pair:[0,2], date:'2026-06-21' }, { pair:[1,3], date:'2026-06-21' },
    { pair:[0,3], date:'2026-06-26' }, { pair:[1,2], date:'2026-06-26' },
  ],
  H: [
    { pair:[2,0], date:'2026-06-15' }, { pair:[1,3], date:'2026-06-15' },
    { pair:[2,1], date:'2026-06-21' }, { pair:[0,3], date:'2026-06-21' },
    { pair:[0,1], date:'2026-06-26' }, { pair:[2,3], date:'2026-06-26' },
  ],
  I: [
    { pair:[0,3], date:'2026-06-16' }, { pair:[1,2], date:'2026-06-16' },
    { pair:[0,1], date:'2026-06-22' }, { pair:[2,3], date:'2026-06-22' },
    { pair:[0,2], date:'2026-06-26' }, { pair:[1,3], date:'2026-06-26' },
  ],
  J: [
    { pair:[1,0], date:'2026-06-16' }, { pair:[2,3], date:'2026-06-17' },
    { pair:[1,2], date:'2026-06-22' }, { pair:[0,3], date:'2026-06-22' },
    { pair:[1,3], date:'2026-06-27' }, { pair:[0,2], date:'2026-06-27' },
  ],
  K: [
    { pair:[2,1], date:'2026-06-17' }, { pair:[3,0], date:'2026-06-17' },
    { pair:[2,3], date:'2026-06-23' }, { pair:[0,1], date:'2026-06-23' },
    { pair:[0,2], date:'2026-06-27' }, { pair:[1,3], date:'2026-06-27' },
  ],
  L: [
    { pair:[1,0], date:'2026-06-17' }, { pair:[2,3], date:'2026-06-17' },
    { pair:[1,2], date:'2026-06-23' }, { pair:[0,3], date:'2026-06-23' },
    { pair:[1,3], date:'2026-06-27' }, { pair:[0,2], date:'2026-06-27' },
  ],
};

const ROUNDS = {
  r32: { matches: [
    {id:'r32-0',  h:'1A', a:'2B',  date:'2026-06-28'},
    {id:'r32-1',  h:'1C', a:'2D',  date:'2026-06-28'},
    {id:'r32-2',  h:'1E', a:'2F',  date:'2026-06-29'},
    {id:'r32-3',  h:'1G', a:'2H',  date:'2026-06-29'},
    {id:'r32-4',  h:'1I', a:'2J',  date:'2026-06-30'},
    {id:'r32-5',  h:'1K', a:'2L',  date:'2026-06-30'},
    {id:'r32-6',  h:'1B', a:'2A',  date:'2026-07-01'},
    {id:'r32-7',  h:'1D', a:'2C',  date:'2026-07-01'},
    {id:'r32-8',  h:'1F', a:'2E',  date:'2026-07-02'},
    {id:'r32-9',  h:'1H', a:'2G',  date:'2026-07-02'},
    {id:'r32-10', h:'1J', a:'2I',  date:'2026-07-03'},
    {id:'r32-11', h:'1L', a:'2K',  date:'2026-07-03'},
    {id:'r32-12', h:'3-1',a:'3-2', date:'2026-06-28'},
    {id:'r32-13', h:'3-3',a:'3-4', date:'2026-06-29'},
    {id:'r32-14', h:'3-5',a:'3-6', date:'2026-06-30'},
    {id:'r32-15', h:'3-7',a:'3-8', date:'2026-07-01'},
  ]},
  r16: { matches: [
    {id:'r16-0', p1:'r32-0',  p2:'r32-1',  date:'2026-07-04'},
    {id:'r16-1', p1:'r32-2',  p2:'r32-3',  date:'2026-07-05'},
    {id:'r16-2', p1:'r32-4',  p2:'r32-5',  date:'2026-07-05'},
    {id:'r16-3', p1:'r32-6',  p2:'r32-7',  date:'2026-07-06'},
    {id:'r16-4', p1:'r32-8',  p2:'r32-9',  date:'2026-07-06'},
    {id:'r16-5', p1:'r32-10', p2:'r32-11', date:'2026-07-07'},
    {id:'r16-6', p1:'r32-12', p2:'r32-13', date:'2026-07-07'},
    {id:'r16-7', p1:'r32-14', p2:'r32-15', date:'2026-07-04'},
  ]},
  qf: { matches: [
    {id:'qf-0', p1:'r16-0', p2:'r16-7', date:'2026-07-09'},
    {id:'qf-1', p1:'r16-1', p2:'r16-2', date:'2026-07-10'},
    {id:'qf-2', p1:'r16-3', p2:'r16-4', date:'2026-07-11'},
    {id:'qf-3', p1:'r16-5', p2:'r16-6', date:'2026-07-11'},
  ]},
  sf: { matches: [
    {id:'sf-0', p1:'qf-0', p2:'qf-1', date:'2026-07-14'},
    {id:'sf-1', p1:'qf-2', p2:'qf-3', date:'2026-07-15'},
  ]},
  '3rd': { matches: [
    {id:'3rd-0', p1:'sf-0-L', p2:'sf-1-L', date:'2026-07-18'},
  ]},
  final: { matches: [
    {id:'final-0', p1:'sf-0', p2:'sf-1', date:'2026-07-19'},
  ]},
};

// ── FIREBASE ──────────────────────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  databaseURL: 'https://porra-mundial-2026-73278-default-rtdb.europe-west1.firebasedatabase.app',
});
const db = admin.database();

// ── HELPERS ───────────────────────────────────────────────────────────────
function toEs(name) { return TEAM_MAP[name] || name; }

function calcStandings(gKey, gsData) {
  const teams = GROUPS[gKey].teams.map((t, i) => ({
    i, n: t.n, pts: 0, gf: 0, gc: 0, gd: 0,
  }));
  GROUP_SCHEDULE[gKey].forEach((sched, mi) => {
    const sc = gsData[`${gKey}-${mi}`];
    if (!sc || sc[0] === '' || sc[1] === '') return;
    const [h, a] = [Number(sc[0]), Number(sc[1])];
    const [hi, ai] = sched.pair;
    teams[hi].gf += h; teams[hi].gc += a; teams[hi].gd += h - a;
    teams[ai].gf += a; teams[ai].gc += h; teams[ai].gd += a - h;
    if (h > a)      { teams[hi].pts += 3; }
    else if (h < a) { teams[ai].pts += 3; }
    else            { teams[hi].pts++; teams[ai].pts++; }
  });
  return teams.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.n.localeCompare(b.n));
}

function getQualifiers(gsData) {
  const q = {};
  for (const gKey of Object.keys(GROUPS)) {
    const st = calcStandings(gKey, gsData);
    q[`1${gKey}`] = st[0]?.n || null;
    q[`2${gKey}`] = st[1]?.n || null;
    q[`3${gKey}`] = st[2]?.n || null;
  }
  return q;
}

function getBest3rds(gsData) {
  return Object.keys(GROUPS)
    .map(gKey => calcStandings(gKey, gsData)[2])
    .filter(Boolean)
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.n.localeCompare(b.n));
}

function resolveSlot(slot, qualifiers, best3, koWinners, koLosers) {
  if (!slot) return null;
  if (slot.endsWith('-L')) {
    return koLosers[slot.slice(0, -2)] || null;
  }
  if (/^[12][A-L]$/.test(slot)) return qualifiers[slot] || null;
  if (/^3-\d+$/.test(slot)) {
    const idx = parseInt(slot.split('-')[1], 10) - 1;
    return best3[idx]?.n || null;
  }
  return koWinners[slot] || null;
}

function buildGSLookup() {
  const lookup = {};
  for (const [gKey, matches] of Object.entries(GROUP_SCHEDULE)) {
    const teams = GROUPS[gKey].teams;
    matches.forEach((sched, mi) => {
      const [hi, ai] = sched.pair;
      const homeEs = teams[hi].n;
      const awayEs = teams[ai].n;
      // Direct order (pair[0] = home in our data)
      lookup[`${sched.date}_${homeEs}_${awayEs}`] = { fbKey: `${gKey}-${mi}`, swapped: false };
      // Reversed order (API might assign home/away differently)
      lookup[`${sched.date}_${awayEs}_${homeEs}`] = { fbKey: `${gKey}-${mi}`, swapped: true };
    });
  }
  return lookup;
}

function buildKOLookup(qualifiers, best3, koWinners, koLosers) {
  const lookup = {};
  for (const round of Object.values(ROUNDS)) {
    for (const m of round.matches) {
      const hSlot = m.h !== undefined ? m.h : m.p1;
      const aSlot = m.a !== undefined ? m.a : m.p2;
      const teamH = resolveSlot(hSlot, qualifiers, best3, koWinners, koLosers);
      const teamA = resolveSlot(aSlot, qualifiers, best3, koWinners, koLosers);
      if (teamH && teamA) {
        lookup[`${m.date}_${teamH}_${teamA}`] = m.id;
        lookup[`${m.date}_${teamA}_${teamH}`] = m.id;
      }
    }
  }
  return lookup;
}

// ── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  // 1. Estado actual en Firebase
  const [gsSnap, koSnap] = await Promise.all([
    db.ref('porra2026/actual_gs').once('value'),
    db.ref('porra2026/actual_ko').once('value'),
  ]);
  const currentGS = gsSnap.val() || {};
  const currentKO = koSnap.val() || {};

  // 2. Fetch de todos los partidos del Mundial 2026
  const resp = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY },
  });
  if (!resp.ok) {
    throw new Error(`API error ${resp.status}: ${await resp.text()}`);
  }
  const { matches } = await resp.json();
  console.log(`📡 API devolvió ${matches.length} partidos`);

  // 3. Procesar fase de grupos
  const gsLookup = buildGSLookup();
  const newGS = { ...currentGS };

  for (const m of matches) {
    if (m.stage !== 'GROUP_STAGE' || m.status !== 'FINISHED') continue;
    const homeEs = toEs(m.homeTeam.name);
    const awayEs = toEs(m.awayTeam.name);
    const date   = m.utcDate.slice(0, 10);
    const entry  = gsLookup[`${date}_${homeEs}_${awayEs}`];

    if (!entry) {
      console.warn(`⚠️  Sin mapeo para ${homeEs} vs ${awayEs} (${date})`);
      continue;
    }

    let home = m.score.fullTime.home;
    let away = m.score.fullTime.away;
    if (home === null || away === null) {
      console.warn(`⚠️  Score null para ${homeEs} vs ${awayEs}, ignorando`);
      continue;
    }
    if (entry.swapped) [home, away] = [away, home];
    newGS[entry.fbKey] = [home, away];
    console.log(`  GS ${entry.fbKey}: ${homeEs} ${home}-${away} ${awayEs}`);
  }

  // 4. Construir lookup KO con los datos actuales
  const qualifiers = getQualifiers(newGS);
  const best3      = getBest3rds(newGS);

  // Winners y losers conocidos hasta ahora (de Firebase)
  const koWinners = {};
  const koLosers  = {};
  for (const [matchId, data] of Object.entries(currentKO)) {
    if (data?.team) koWinners[matchId] = data.team;
  }
  // Calcular losers de semifinales (para el partido por el 3er puesto)
  for (const m of ROUNDS.sf.matches) {
    const winner = koWinners[m.id];
    if (!winner) continue;
    const teamH = resolveSlot(m.p1, qualifiers, best3, koWinners, koLosers);
    const teamA = resolveSlot(m.p2, qualifiers, best3, koWinners, koLosers);
    koLosers[m.id] = (teamH === winner) ? teamA : teamH;
  }

  const koLookup = buildKOLookup(qualifiers, best3, koWinners, koLosers);
  const newKO = { ...currentKO };

  // 5. Procesar fase eliminatoria
  for (const m of matches) {
    if (m.stage === 'GROUP_STAGE' || m.status !== 'FINISHED') continue;
    const homeEs  = toEs(m.homeTeam.name);
    const awayEs  = toEs(m.awayTeam.name);
    const date    = m.utcDate.slice(0, 10);
    const matchId = koLookup[`${date}_${homeEs}_${awayEs}`]
                 || koLookup[`${date}_${awayEs}_${homeEs}`];

    if (!matchId) {
      console.warn(`⚠️  Sin matchId KO para ${homeEs} vs ${awayEs} (${date})`);
      continue;
    }

    // Ganador: preferir score.winner del API (maneja prórroga y penaltis)
    const winnerEs = m.score.winner === 'HOME_TEAM' ? homeEs : awayEs;
    // Marcador: usar extra time si existe, si no tiempo reglamentario
    const score    = m.score.extraTime?.home != null ? m.score.extraTime : m.score.fullTime;

    newKO[matchId] = {
      team: winnerEs,
      sh:   String(score.home ?? ''),
      sa:   String(score.away ?? ''),
    };

    // Actualizar winners/losers para resolver rondas siguientes en la misma ejecución
    koWinners[matchId] = winnerEs;
    const teamH = homeEs, teamA = awayEs;
    koLosers[matchId]  = (winnerEs === teamH) ? teamA : teamH;

    console.log(`  KO ${matchId}: ganador ${winnerEs} (${score.home}-${score.away})`);
  }

  // 6. Escribir en Firebase solo si hay cambios
  const gsStr = JSON.stringify(newGS);
  const koStr = JSON.stringify(newKO);
  const writes = [];

  if (gsStr !== JSON.stringify(currentGS)) {
    writes.push(db.ref('porra2026/actual_gs').set(newGS));
    console.log('✅ actual_gs actualizado en Firebase');
  }
  if (koStr !== JSON.stringify(currentKO)) {
    writes.push(db.ref('porra2026/actual_ko').set(newKO));
    console.log('✅ actual_ko actualizado en Firebase');
  }
  if (writes.length === 0) {
    console.log('ℹ️  Sin cambios — Firebase no modificado');
  }

  await Promise.all(writes);
  console.log('✓ Sync completado');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
