import { processCSV } from './csvReader.js';
import { renderCharts } from './charts.js';
import { calculateMetrics } from './metrics.js';

const input = document.getElementById('csvInput');
const dsInput = document.getElementById('dsInput');
const driverSelect = document.getElementById('driverSelect');
const citySelect = document.getElementById('citySelect');
const statusSelect = document.getElementById('statusSelect');
const cityTableBody = document.getElementById('cityTableBody');

const btnGeneral = document.getElementById('btnGeneral');
const btnSLA = document.getElementById('btnSLA');
const btnDS = document.getElementById('btnDS');
const btnCity = document.getElementById('btnCity');

const homePage = document.getElementById('homePage');
const cityPage = document.getElementById('cityPage');

let rawData = [];
let dsData = [];

let currentMode = 'GENERAL';

const META_SLA = 98;

const cityMap = {
  '65365-000': 'Zé Doca',
  '65272-000': 'Santa Luzia do Paruá',
  '65274-000': 'Nova Olinda do Maranhão',
  '65368-000': 'Araguanã',
  '65398-000': 'Alto Alegre do Pindaré',
  '65363-000': 'Gov. Newton Bello',
  '65385-000': 'São João do Carú',
  '65378-000': 'Tufilândia',
  '65380-000': 'Bom Jardim'
};

function getSlaClass(sla) {
  const v = parseFloat(sla);
  if (v >= 98) return 'sla-green';
  if (v >= 95) return 'sla-yellow';
  return 'sla-red';
}

/* =========================
   FILTROS
========================= */
function applyFilters() {

  let filteredSLA = [...rawData];
  let filteredDS = [...dsData];

  if (driverSelect.value) {
    filteredSLA = filteredSLA.filter(r => r['Driver Name'] === driverSelect.value);
    filteredDS = filteredDS.filter(r => r['Driver Name'] === driverSelect.value);
  }

  if (citySelect.value) {
    filteredSLA = filteredSLA.filter(r => cityMap[r['Postal Code']] === citySelect.value);
    filteredDS = filteredDS.filter(r => cityMap[r['Postal Code']] === citySelect.value);
  }

  if (statusSelect.value) {
    filteredSLA = filteredSLA.filter(r => r['Status'] === statusSelect.value);
    filteredDS = filteredDS.filter(r => r['Status'] === statusSelect.value);
  }

  updateByMode({ sla: filteredSLA, ds: filteredDS });
}

/* =========================
   ATUALIZA DASHBOARD
========================= */
function updateByMode({ sla, ds }) {

  const baseRaw = currentMode === 'DS' ? ds : sla;

  const cardMeta = document.getElementById('cardMeta');
  const cardDiff = document.getElementById('cardDiff');
  const cardScore = document.getElementById('cardScore');

  /* ===== GENERAL ===== */
  if (currentMode === 'GENERAL') {

    cardMeta.style.display = 'none';
    cardDiff.style.display = 'none';
    cardScore.style.display = 'none';

    const slaResult = calculateMetrics(sla, 'SLA');
    const dsResult = calculateMetrics(ds, 'DS');

    const slaVal = parseFloat(slaResult.sla) || 0;
    const dsVal = parseFloat(dsResult.sla) || 0;

    document.getElementById('kpiTotal').innerText = slaResult.total;
    document.getElementById('kpiDelivered').innerText = slaResult.delivered;
    document.getElementById('kpiPending').innerText = slaResult.pending;
    document.getElementById('kpiSla').innerText = slaVal + '%';

    document.getElementById('kpiSlaCard').className =
      'kpi ' + getSlaClass(slaVal);

    document.getElementById('kpiDs').innerText = dsVal + '%';
    document.getElementById('kpiDsCard').className =
      'kpi ' + getSlaClass(dsVal);

    const diff = (dsVal - slaVal).toFixed(2);
    document.getElementById('kpiDiff').innerText =
      (diff > 0 ? '+' : '') + diff + '%';

    let alerta = '';

    if (slaVal >= META_SLA && dsVal >= META_SLA) {
      alerta = '✅ Meta batida (SLA e DS)';
    } 
    else if (slaVal >= META_SLA && dsVal < META_SLA) {
      alerta = '⚠️ SLA OK, mas DS abaixo da meta';
    } 
    else if (slaVal < META_SLA && dsVal >= META_SLA) {
      alerta = '⚠️ DS OK, mas SLA abaixo da meta';
    } 
    else {
      alerta = '🚨 SLA e DS abaixo da meta';
    }

    document.getElementById('kpiAlert').innerText = alerta;

    document.getElementById('kpiForecast').innerText = '-';

    renderCharts(
      { ...slaResult, driverSLA: slaResult.driverSLA, citySLA: slaResult.citySLA },
      currentMode,
      { status: statusSelect.value, rawData: baseRaw }
    );

    renderDriverRanking(sla);
    return;
  }

  /* ===== SLA / DS ===== */

  // 🔥 ESCONDE CARDS DESNECESSÁRIOS
  cardMeta.style.display = 'none';
  cardDiff.style.display = 'none';
  cardScore.style.display = 'block';

  let result;
  if (currentMode === 'SLA') result = calculateMetrics(sla, 'SLA');
  if (currentMode === 'DS') result = calculateMetrics(ds, 'DS');

  document.getElementById('kpiTotal').innerText = result.total;
  document.getElementById('kpiDelivered').innerText = result.delivered;
  document.getElementById('kpiPending').innerText = result.pending;

  if (currentMode === 'SLA') {

    document.getElementById('kpiSla').innerText = result.sla + '%';
    document.getElementById('kpiSlaCard').className =
      'kpi ' + getSlaClass(result.sla);

    document.getElementById('kpiSlaCard').style.display = 'block';
    document.getElementById('kpiDsCard').style.display = 'none';

  } else {

    document.getElementById('kpiDs').innerText = result.sla + '%';
    document.getElementById('kpiDsCard').className =
      'kpi ' + getSlaClass(result.sla);

    document.getElementById('kpiDsCard').style.display = 'block';
    document.getElementById('kpiSlaCard').style.display = 'none';
  }

  let alerta = parseFloat(result.sla) < META_SLA
    ? '🚨 Abaixo da meta (98%)'
    : '✅ Meta batida';

  document.getElementById('kpiAlert').innerText = alerta;

  document.getElementById('kpiScore').innerText = result.sla;

  renderCharts(
    { ...result, driverSLA: result.driverSLA, citySLA: result.citySLA },
    currentMode,
    { status: statusSelect.value, rawData: baseRaw }
  );

  renderDriverTable(baseRaw);
}

/* =========================
   RANKING
========================= */
function renderDriverRanking(data) {

  cityTableBody.innerHTML = '';

  const result = calculateMetrics(data);

result.driverSLA
  .sort((a, b) => b.total - a.total) // 🔥 AQUI A MUDANÇA
  .forEach((driver, index) => {

    const tr = document.createElement('tr');

    let medal = '';
    if (index === 0) medal = '🥇';
    else if (index === 1) medal = '🥈';
    else if (index === 2) medal = '🥉';

    tr.innerHTML = `
      <td>${medal} ${driver.name}</td>
      <td>${driver.total}</td>
      <td>${driver.delivered}</td>
      <td>${driver.pending}</td>
      <td class="${getSlaClass(driver.sla)}">${driver.sla}%</td>
    `;

    cityTableBody.appendChild(tr);
  });
}

/* =========================
   TABELA NORMAL
========================= */
function renderDriverTable(data) {

  cityTableBody.innerHTML = '';

  const result = calculateMetrics(data);

  result.driverSLA.forEach(driver => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${driver.name}</td>
      <td>${driver.total}</td>
      <td>${driver.delivered}</td>
      <td>${driver.pending}</td>
      <td class="${getSlaClass(driver.sla)}">${driver.sla}%</td>
    `;

    cityTableBody.appendChild(tr);
  });
}

/* =========================
   LOAD CSV
========================= */
input.addEventListener('change', async (e) => {

  const file = e.target.files[0];
  if (!file) return;

  rawData = await processCSV(file);

  const drivers = [...new Set(rawData.map(r => r['Driver Name']).filter(Boolean))];
  driverSelect.innerHTML = '<option value="">Todos os Entregadores</option>';
  drivers.forEach(d => driverSelect.innerHTML += `<option value="${d}">${d}</option>`);

  const cities = [...new Set(rawData.map(r => cityMap[r['Postal Code']]).filter(Boolean))];
  citySelect.innerHTML = '<option value="">Todas as Cidades</option>';
  cities.forEach(c => citySelect.innerHTML += `<option value="${c}">${c}</option>`);

  const statuses = [...new Set(rawData.map(r => r['Status']).filter(Boolean))];
  statusSelect.innerHTML = '<option value="">Todos Status</option>';
  statuses.forEach(s => statusSelect.innerHTML += `<option value="${s}">${s}</option>`);

  applyFilters();
});

dsInput.addEventListener('change', async (e) => {
  dsData = await processCSV(e.target.files[0]);
  applyFilters();
});

driverSelect.addEventListener('change', applyFilters);
citySelect.addEventListener('change', applyFilters);
statusSelect.addEventListener('change', applyFilters);

/* =========================
   NAV
========================= */
function setActiveButton(btn) {
  [btnGeneral, btnSLA, btnDS, btnCity].forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

btnGeneral.onclick = () => {
  currentMode = 'GENERAL';

  document.getElementById('kpiSlaCard').style.display = 'block';
  document.getElementById('kpiDsCard').style.display = 'block';

  homePage.style.display = 'grid';
  cityPage.style.display = 'none';
  setActiveButton(btnGeneral);
  applyFilters();
};

btnSLA.onclick = () => {
  currentMode = 'SLA';

  document.getElementById('kpiSlaCard').style.display = 'block';
  document.getElementById('kpiDsCard').style.display = 'none';

  homePage.style.display = 'grid';
  cityPage.style.display = 'none';
  setActiveButton(btnSLA);
  applyFilters();
};

btnDS.onclick = () => {
  currentMode = 'DS';

  document.getElementById('kpiDsCard').style.display = 'block';
  document.getElementById('kpiSlaCard').style.display = 'none';

  homePage.style.display = 'grid';
  cityPage.style.display = 'none';
  setActiveButton(btnDS);
  applyFilters();
};

btnCity.onclick = () => {
  homePage.style.display = 'none';
  cityPage.style.display = 'block';
  setActiveButton(btnCity);
};

function exportDashboard() {
  const element = document.getElementById('homePage');

  // ativa modo exportação (remove sombras)
  document.body.classList.add('export-mode');

  html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  }).then(canvas => {

    document.body.classList.remove('export-mode');

    const link = document.createElement('a');
    link.download = 'dashboard.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}