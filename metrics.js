export function calculateMetrics(data) {

  let total = 0;
  let delivered = 0;
  let onHold = 0;

  const statusMap = {};
  const driverMap = {};
  const cityMapInternal = {};

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

  data.forEach(row => {

    const status = row['Status'];
    const driver = row['Driver Name'];
    const city = cityMap[row['Postal Code']];

    if (!status) return;

    const cleanStatus = status.toString().trim();
    const statusLower = cleanStatus.toLowerCase();

    total++;

    statusMap[cleanStatus] =
      (statusMap[cleanStatus] || 0) + 1;

    if (statusLower === 'onhold') {
      onHold++;
    }

    const isDelivered =
      statusLower === 'delivered' ||
      statusLower.endsWith('_delivered');

    if (isDelivered) {
      delivered++;
    }

    // ===== DRIVER =====
    if (driver) {
      if (!driverMap[driver]) {
        driverMap[driver] = { total: 0, delivered: 0 };
      }

      if (statusLower !== 'onhold') {
        driverMap[driver].total++;
      }

      if (isDelivered) {
        driverMap[driver].delivered++;
      }
    }

    // ===== CITY =====
    if (city) {
      if (!cityMapInternal[city]) {
        cityMapInternal[city] = { total: 0, delivered: 0 };
      }

      if (statusLower !== 'onhold') {
        cityMapInternal[city].total++;
      }

      if (isDelivered) {
        cityMapInternal[city].delivered++;
      }
    }

  });

  const validBase = total - onHold;
  const pending = validBase - delivered;
  const sla = validBase > 0
    ? ((delivered / validBase) * 100).toFixed(2)
    : 0;

  const driverSLA = Object.entries(driverMap).map(([name, info]) => ({
    name,
    total: info.total,
    delivered: info.delivered,
    pending: info.total - info.delivered,
    sla: info.total > 0
      ? ((info.delivered / info.total) * 100).toFixed(1)
      : 0
  }));

  const citySLA = Object.entries(cityMapInternal).map(([name, info]) => ({
    name,
    total: info.total,
    delivered: info.delivered,
    pending: info.total - info.delivered,
    sla: info.total > 0
      ? ((info.delivered / info.total) * 100).toFixed(1)
      : 0
  }));

  return {
    total: validBase,
    delivered,
    pending,
    sla,
    statusMap,   // 🔥 IMPORTANTE (seu gráfico precisa disso)
    driverSLA,
    citySLA
  };
}
