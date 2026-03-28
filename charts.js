let barChart;
let slaDriverChart;

export function renderCharts(data, mode = 'default', extra = {}) {

  if (barChart) barChart.destroy();
  if (slaDriverChart) slaDriverChart.destroy();

  const selectedStatus = extra.status || '';

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

  const filteredStatus = Object.entries(data.statusMap || {})
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

      // 🔥 HOVER MELHORADO
      interaction: {
        mode: 'index',
        intersect: false
      },

      scales: {
        y: { beginAtZero: true }
      },

      plugins: {
        tooltip: {
          enabled: true,
          backgroundColor: '#111',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#ff0000',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              return `Quantidade: ${context.raw}`;
            }
          }
        }
      }
    }
  });

  /* ===============================
     🔥 GRÁFICO HORIZONTAL
  =============================== */

  let labels = [];
  let values = [];
  let title = '';
  let colors = [];

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

  // 🔥 DS
  if (mode === 'DS') {

    title = 'Quantidade por Cidade';

    const cityCount = {};

    (extra.rawData || []).forEach(row => {
      const cep = row['Postal Code'];
      const city = cityMap[cep] || cep;

      if (city) {
        cityCount[city] = (cityCount[city] || 0) + 1;
      }
    });

    const sorted = Object.entries(cityCount)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    labels = sorted.map(c => c.name);
    values = sorted.map(c => c.total);

    colors = sorted.map(() => '#ff0000');
  }

  // 🔥 ONHOLD
  else if (selectedStatus === 'OnHold') {

    title = 'Ocorrências por Entregador';

    const driverCount = {};

    (extra.rawData || []).forEach(row => {
      const driver = row['Driver Name'];
      const status = row['Status'];

      if (status === 'OnHold' && driver) {
        driverCount[driver] = (driverCount[driver] || 0) + 1;
      }
    });

    const sorted = Object.entries(driverCount)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    labels = sorted.map(d => d.name);
    values = sorted.map(d => d.total);

    colors = sorted.map(() => '#ef4444');
  }

  // 🔥 PADRÃO
  else {

    title = 'Quantidade por Cidade';

    const sorted = (data.citySLA || [])
      .filter(c => c.name)
      .sort((a, b) => b.total - a.total);

    labels = sorted.map(c => c.name);
    values = sorted.map(c => c.total);

    colors = sorted.map(c =>
      c.sla >= 98 ? '#22c55e' :
      c.sla >= 95 ? '#facc15' :
      '#ef4444'
    );
  }

  // 🔥 FALLBACK
  if (!values.length) {
    labels = ['Sem dados'];
    values = [0];
    colors = ['#999'];
  }

  const pieCanvas = document.getElementById('pieChart');
  const chartWrapper = pieCanvas.parentElement;

 

  slaDriverChart = new Chart(pieCanvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: values.map(v => {
          const num = Number(v);
          return isNaN(num) ? 0 : Math.round(num);
        }),
        backgroundColor: colors,
        borderRadius: 6,
        barThickness: 16
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,

      // 🔥 HOVER CORRIGIDO (ESSA LINHA FAZ MÁGICA)
      interaction: {
        mode: 'index',
        intersect: false
      },

      scales: {
        y: {
          ticks: {
            autoSkip: false,
            font: { size: 12 }
          }
        },
        x: {
  beginAtZero: true,
  min: 0,
  max: Math.max(...values) + 1, // adiciona folga
  ticks: {
    stepSize: 1,
    precision: 10
  }
}
      },

      plugins: {
        legend: { display: false },

        tooltip: {
          enabled: true,
          backgroundColor: '#111',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#ff0000',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              return `Quantidade: ${context.raw}`;
            }
          }
        }
      }
    }
  });
}