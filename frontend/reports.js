const API_BASE_URL = localStorage.getItem('apiBaseUrl') || 'http://localhost:3000';

function normalizeUserType(type) {
  const value = String(type || '').toLowerCase();
  if (value === 'barbeiro' || value === 'barber') return 'barber';
  if (value === 'cliente' || value === 'client') return 'client';
  return value;
}

function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem('authUser') || 'null');
  } catch (error) {
    localStorage.removeItem('authUser');
    return null;
  }
}

function getAuthToken() {
  return localStorage.getItem('authToken');
}

function setReportsMessage(message, isError = false) {
  const element = document.getElementById('reportsMessage');
  if (!element) return;
  element.textContent = message || '';
  element.style.color = isError ? '#ff6b6b' : '#7ed957';
}

function formatCurrency(value) {
  return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
}

function formatDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value || '-');
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} as ${hours}:${minutes}`;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data && data.error ? data.error : 'Erro na requisicao.');
  }
  return data;
}

function ensureBarberAccess() {
  const user = getAuthUser();
  const token = getAuthToken();

  if (!user || !token) {
    window.location.href = 'login.html';
    return false;
  }

  if (normalizeUserType(user.type) !== 'barber') {
    window.location.href = 'index.html';
    return false;
  }

  return true;
}

function renderSummary(summary) {
  document.getElementById('weeklyAppointments').textContent = String(summary.appointments_this_week || 0);
  document.getElementById('weeklyRevenue').textContent = formatCurrency(summary.weekly_revenue || 0);
  document.getElementById('averageTicket').textContent = formatCurrency(summary.average_ticket || 0);
  document.getElementById('weeklyCancelled').textContent = String(summary.cancelled_this_week || 0);
  document.getElementById('weeklyConfirmed').textContent = String(summary.confirmed_this_week || 0);
  document.getElementById('monthlyRevenue').textContent = formatCurrency(summary.monthly_revenue || 0);
}

function renderTable(tableBodyId, items, emptyLabel, columns) {
  const tableBody = document.getElementById(tableBodyId);
  if (!tableBody) return;

  if (!items.length) {
    tableBody.innerHTML = `<tr><td colspan="${columns.length}">${emptyLabel}</td></tr>`;
    return;
  }

  tableBody.innerHTML = items.map((item) => `
    <tr>
      ${columns.map((column) => `<td>${column(item)}</td>`).join('')}
    </tr>
  `).join('');
}

function renderUpcomingAppointments(items) {
  const list = document.getElementById('upcomingAppointmentsList');
  const emptyState = document.getElementById('reportsEmptyState');
  if (!list || !emptyState) return;

  if (!items.length) {
    list.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  list.innerHTML = items.map((item) => `
    <article class="appointment-card appointment-card-client barber-appointment-card">
      <div class="appointment-details">
        <div class="barber-appointment-header">
          <h3 class="appointment-service">${item.service_name}</h3>
          <span class="appointment-status ${item.status === 'confirmed' ? 'status-confirmed' : 'status-scheduled'}">${item.status === 'confirmed' ? 'Confirmado' : 'Agendado'}</span>
        </div>
        <p class="appointment-barber">Cliente: ${item.client_name}</p>
        <p class="appointment-datetime">${formatDateTime(item.start_at)}</p>
        <p class="appointment-price">${formatCurrency(item.service_price)}</p>
      </div>
    </article>
  `).join('');
}

async function loadReports() {
  const token = getAuthToken();
  setReportsMessage('Carregando relatorios...');

  try {
    const reports = await fetchJson(`${API_BASE_URL}/reports/overview`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    renderSummary(reports.summary || {});
    renderTable(
      'topServicesTableBody',
      Array.isArray(reports.top_services) ? reports.top_services : [],
      'Nenhum servico encontrado neste periodo.',
      [
        (item) => item.name,
        (item) => String(item.total),
        (item) => formatCurrency(item.revenue)
      ]
    );
    renderTable(
      'busiestDaysTableBody',
      Array.isArray(reports.busiest_days) ? reports.busiest_days : [],
      'Nenhum dia movimentado encontrado.',
      [
        (item) => item.label,
        (item) => String(item.total),
        (item) => formatCurrency(item.revenue)
      ]
    );
    renderTable(
      'peakHoursTableBody',
      Array.isArray(reports.peak_hours) ? reports.peak_hours : [],
      'Nenhum horario de pico encontrado.',
      [
        (item) => item.label,
        (item) => String(item.total),
        (item) => formatCurrency(item.revenue)
      ]
    );
    renderUpcomingAppointments(Array.isArray(reports.upcoming_appointments) ? reports.upcoming_appointments : []);
    setReportsMessage('Relatorios atualizados com sucesso.');
  } catch (error) {
    setReportsMessage(error.message || 'Erro ao carregar relatorios.', true);
  }
}

function setupLogout() {
  const logoutButton = document.getElementById('logoutButton');
  if (!logoutButton) return;

  logoutButton.addEventListener('click', (event) => {
    event.preventDefault();
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    window.location.href = 'login.html';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!ensureBarberAccess()) return;
  setupLogout();
  document.getElementById('refreshReportsButton').addEventListener('click', loadReports);
  loadReports();
});
