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
'65413-000': 'Alto Alegre do Maranhão',
'65700-000': 'Bacabal',
'65723-000': 'Bernardo do Mearim',
'65704-000': 'Bom Lugar',
'65710-000': 'Conceição do Lago-Açu',
'65720-000': 'Igarapé Grande',
'65715-000': 'Lago da Pedra',
'65710-000': 'Lago do Junco',
'65712-000': 'Lago dos Rodrigues',
'65705-000': 'Lago Verde',
'65728-000': 'Lima Campos',
'65706-000': 'Olho d’Água das Cunhãs',
'65716-000': 'Paulo Ramos',
'65725-000': 'Pedreiras',
'65740-000': 'Poção de Pedras',
'65708-000': 'São Luís Gonzaga do Maranhão',
'65470-000': 'São Mateus do Maranhão',
'65727-000': 'Trizidela do Vale',
'65320-000': 'Vitorino Freire'
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
