let barChart;
let slaDriverChart;

export function renderCharts(data, mode = 'default') {

  if (barChart) barChart.destroy();
  if (slaDriverChart) slaDriverChart.destroy();

  /* ===============================
     🔤 STATUS DOS PEDIDOS
  =============================== */
  const statusLabelsMap = {
    Delivered: 'Entregue',
    Delivering: 'Em Rota',
    Hub_Assigned: 'Hub Atribuído',
    Hub_Received: 'Recebido no Hub',
    LM_Hub_InTransit: 'Em Transferência',
    OnHold: 'Ocorrência'
  };

  const filteredStatus = Object.entries(data.statusMap)
    .filter(([status]) => status && status !== 'undefined');

  const statusLabels = filteredStatus.map(
    ([status]) => statusLabelsMap[status] || status
  );

  const statusValues = filteredStatus.map(
    ([, value]) => value
  );

  barChart = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: statusLabels,
      datasets: [{
        label: 'Status dos Pedidos',
        data: statusValues,
        backgroundColor: '#ff0000'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  /* ===============================
     🟢 SLA POR ENTREGADOR (TODOS)
  =============================== */

  const sortedDrivers = data.driverSLA
    .filter(d => d.name && !isNaN(d.sla))
    .sort((a, b) => b.sla - a.sla);

  const fullNames = sortedDrivers.map(d => d.name);
const shortNames = sortedDrivers.map(d => d.name); // 🔥 nome completo


  /* 🔥 CONTROLE DE ALTURA + SCROLL */
  const pieCanvas = document.getElementById('pieChart');
  const chartWrapper = pieCanvas.parentElement;

  chartWrapper.style.height = '420px'; // área visível
  pieCanvas.style.height = (sortedDrivers.length * 34) + 'px'; // altura real

  slaDriverChart = new Chart(pieCanvas, {
    type: 'bar',
    data: {
      labels: shortNames,
      datasets: [{
        label: 'SLA por Entregador (%)',
        data: sortedDrivers.map(d => d.sla),
        backgroundColor: sortedDrivers.map(d =>
          d.sla >= 98 ? '#22c55e' :
          d.sla >= 95 ? '#facc15' :
          '#ef4444'
        ),
        borderRadius: 6,
        barThickness: 18
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,

      scales: {
        y: {
          ticks: {
            autoSkip: false,        // 🔥 evita sumir nomes
            font: { size: 12 }
          }
        },
        x: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: value => value + '%'
          }
        }
      },

      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: function (items) {
              return fullNames[items[0].dataIndex]; // nome completo
            },
            label: function (context) {
              return `SLA: ${context.raw}%`;
            }
          }
        }
      }
    }
  });
}
