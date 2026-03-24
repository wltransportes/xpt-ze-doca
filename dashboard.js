import { processCSV } from './csvReader.js';
import { renderCharts } from './charts.js';
import { calculateMetrics } from './metrics.js';

const input = document.getElementById('csvInput');
const dsInput = document.getElementById('dsInput');
const driverSelect = document.getElementById('driverSelect');
const citySelect = document.getElementById('citySelect');
const cityTableBody = document.getElementById('cityTableBody');

const btnHome = document.getElementById('btnHome');
const btnCity = document.getElementById('btnCity');
const homePage = document.getElementById('homePage');
const cityPage = document.getElementById('cityPage');

let rawData = [];
let dsData = [];

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

function updateDashboard(data) {

  const result = calculateMetrics(data);

  document.getElementById('kpiTotal').innerText = result.total;
  document.getElementById('kpiDelivered').innerText = result.delivered;
  document.getElementById('kpiPending').innerText = result.pending;
  document.getElementById('kpiSla').innerText = result.sla + '%';

  document.getElementById('kpiSlaCard').className =
    'kpi ' + getSlaClass(result.sla);

  const needed = Math.ceil(
    ((META_SLA / 100) * result.total) - result.delivered
  );

  document.getElementById('kpiForecast').innerText =
    needed > 0 ? needed : 0;

  // 🔥 AQUI ESTÁ A CORREÇÃO
  // usamos citySLA diretamente
  renderCharts({
    ...result,
    driverSLA: result.citySLA
  });
}

function updateDS(data) {
  const result = calculateMetrics(data);

  document.getElementById('kpiDs').innerText =
    result.sla + '%';

  document.getElementById('kpiDsCard').className =
    'kpi ' + getSlaClass(result.sla);
}

// 🔥 TABELA AGORA É DE ENTREGADORES
function renderDriverTable(data) {

  cityTableBody.innerHTML = '';

  const result = calculateMetrics(data);

  result.driverSLA
    .sort((a, b) => parseFloat(b.sla) - parseFloat(a.sla))
    .forEach(driver => {

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

function applyFilters() {

  let filtered = [...rawData];

  if (driverSelect.value) {
    filtered = filtered.filter(
      r => r['Driver Name'] === driverSelect.value
    );
  }

  if (citySelect.value) {
    filtered = filtered.filter(
      r => cityMap[r['Postal Code']] === citySelect.value
    );
  }

  updateDashboard(filtered);
  renderDriverTable(filtered);
}

input.addEventListener('change', async (e) => {

  const file = e.target.files[0];
  if (!file) return;

  rawData = await processCSV(file);

  const drivers = [...new Set(
    rawData.map(r => r['Driver Name']).filter(Boolean)
  )];

  driverSelect.innerHTML = '<option value="">Todos</option>';
  drivers.forEach(d =>
    driverSelect.innerHTML += `<option>${d}</option>`
  );

  const cities = [...new Set(
    rawData.map(r => cityMap[r['Postal Code']]).filter(Boolean)
  )];

  citySelect.innerHTML = '<option value="">Todas</option>';
  cities.forEach(c =>
    citySelect.innerHTML += `<option>${c}</option>`
  );

  updateDashboard(rawData);
  renderDriverTable(rawData);
});

dsInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  dsData = await processCSV(file);
  updateDS(dsData);
});

driverSelect.addEventListener('change', applyFilters);
citySelect.addEventListener('change', applyFilters);

btnHome.addEventListener('click', () => {
  homePage.style.display = 'grid';
  cityPage.style.display = 'none';
  btnHome.classList.add('active');
  btnCity.classList.remove('active');
});

btnCity.addEventListener('click', () => {
  homePage.style.display = 'none';
  cityPage.style.display = 'block';
  btnCity.classList.add('active');
  btnHome.classList.remove('active');
});
