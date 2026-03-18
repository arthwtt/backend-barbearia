const API_BASE_URL = localStorage.getItem('apiBaseUrl') || window.location.origin;
const SHOP_SETTINGS_KEY = 'barbershopSettings';

const state = {
  user: null,
  token: null,
  barbers: [],
  services: []
};

function normalizeUserType(type) {
  const value = String(type || '').toLowerCase();
  if (value === 'barbeiro' || value === 'barber') return 'barber';
  if (value === 'cliente' || value === 'client') return 'client';
  return value;
}

function setMessage(elementId, message, isError = false) {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.textContent = message || '';
  element.style.color = isError ? '#ff6b6b' : '#7ed957';
}

function formatCurrency(value) {
  return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data && data.error ? data.error : 'Erro na requisicao.';
    throw new Error(message);
  }
  return data;
}

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${state.token}`
  };
}

function ensureBarberAccess() {
  try {
    state.user = JSON.parse(localStorage.getItem('authUser') || 'null');
  } catch (error) {
    localStorage.removeItem('authUser');
    state.user = null;
  }

  state.token = localStorage.getItem('authToken');
  if (!state.user || !state.token) {
    window.location.href = 'login.html';
    return false;
  }

  if (normalizeUserType(state.user.type) !== 'barber') {
    window.location.href = 'index.html';
    return false;
  }

  return true;
}

function loadShopSettings() {
  const defaults = {
    name: 'Minha Barbearia',
    phone: '',
    address: '',
    openAt: '08:00',
    closeAt: '18:00'
  };

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(SHOP_SETTINGS_KEY) || '{}');
  } catch (error) {
    saved = {};
  }

  const settings = { ...defaults, ...saved };
  document.getElementById('shopName').value = settings.name;
  document.getElementById('shopPhone').value = settings.phone;
  document.getElementById('shopAddress').value = settings.address;
  document.getElementById('openAt').value = settings.openAt;
  document.getElementById('closeAt').value = settings.closeAt;
}

function saveShopSettings(event) {
  event.preventDefault();
  const payload = {
    name: document.getElementById('shopName').value.trim(),
    phone: document.getElementById('shopPhone').value.trim(),
    address: document.getElementById('shopAddress').value.trim(),
    openAt: document.getElementById('openAt').value,
    closeAt: document.getElementById('closeAt').value
  };

  localStorage.setItem(SHOP_SETTINGS_KEY, JSON.stringify(payload));
  setMessage('shopSettingsMessage', 'Configuracoes salvas com sucesso.');
}

function renderBarbersTable() {
  const tableBody = document.getElementById('barbersTableBody');
  if (!tableBody) return;

  if (!state.barbers.length) {
    tableBody.innerHTML = '<tr><td colspan="3">Nenhum barbeiro encontrado.</td></tr>';
    return;
  }

  tableBody.innerHTML = state.barbers.map((barber) => `
    <tr>
      <td>${barber.id}</td>
      <td>${barber.name || '-'}</td>
      <td>${barber.email || '-'}</td>
    </tr>
  `).join('');
}

async function loadBarbers() {
  state.barbers = await fetchJson(`${API_BASE_URL}/barbers`);
  renderBarbersTable();
}

async function handleCreateBarber(event) {
  event.preventDefault();
  setMessage('barbersMessage', '');

  const payload = {
    name: document.getElementById('barberName').value.trim(),
    email: document.getElementById('barberEmail').value.trim(),
    phone: document.getElementById('barberPhone').value.trim(),
    password: document.getElementById('barberPassword').value
  };

  try {
    const result = await fetchJson(`${API_BASE_URL}/barbers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    document.getElementById('barberForm').reset();
    const totalServices = Number(result && result.default_services_created ? result.default_services_created : 0);
    const suffix = totalServices ? ` e ${totalServices} servicos padrao foram criados.` : '.';
    setMessage('barbersMessage', `Barbeiro cadastrado com sucesso${suffix}`);
    await loadBarbers();
  } catch (error) {
    setMessage('barbersMessage', error.message || 'Erro ao cadastrar barbeiro.', true);
  }
}

function renderServicesTable() {
  const tableBody = document.getElementById('servicesTableBody');
  if (!tableBody) return;

  if (!state.services.length) {
    tableBody.innerHTML = '<tr><td colspan="5">Nenhum servico cadastrado para este barbeiro.</td></tr>';
    return;
  }

  tableBody.innerHTML = state.services.map((service) => `
    <tr>
      <td>${service.id}</td>
      <td>${service.name}</td>
      <td>${formatCurrency(service.price)}</td>
      <td>${service.duration_minutes} min</td>
      <td>
        <button class="admin-action-btn" data-action="edit" data-id="${service.id}">Editar</button>
        <button class="admin-action-btn danger" data-action="delete" data-id="${service.id}">Excluir</button>
      </td>
    </tr>
  `).join('');
}

async function loadServices() {
  state.services = await fetchJson(`${API_BASE_URL}/services?barber_id=${state.user.id}`);
  renderServicesTable();
}

function resetServiceForm() {
  document.getElementById('serviceId').value = '';
  document.getElementById('serviceForm').reset();
  document.getElementById('serviceSubmitButton').textContent = 'Adicionar Servico';
}

function fillServiceForm(serviceId) {
  const service = state.services.find((item) => Number(item.id) === Number(serviceId));
  if (!service) return;
  document.getElementById('serviceId').value = String(service.id);
  document.getElementById('serviceName').value = service.name || '';
  document.getElementById('servicePrice').value = Number(service.price || 0);
  document.getElementById('serviceDuration').value = Number(service.duration_minutes || 0);
  document.getElementById('serviceSubmitButton').textContent = 'Salvar Alteracoes';
}

async function handleServiceSubmit(event) {
  event.preventDefault();
  setMessage('servicesMessage', '');

  const serviceId = document.getElementById('serviceId').value;
  const payload = {
    name: document.getElementById('serviceName').value.trim(),
    price: Number(document.getElementById('servicePrice').value),
    duration_minutes: Number(document.getElementById('serviceDuration').value)
  };

  try {
    if (serviceId) {
      await fetchJson(`${API_BASE_URL}/services/${serviceId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      setMessage('servicesMessage', 'Servico atualizado com sucesso.');
    } else {
      await fetchJson(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      setMessage('servicesMessage', 'Servico cadastrado com sucesso.');
    }

    resetServiceForm();
    await loadServices();
  } catch (error) {
    setMessage('servicesMessage', error.message || 'Erro ao salvar servico.', true);
  }
}

async function handleServiceTableAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const serviceId = Number(button.dataset.id);
  if (!serviceId) return;

  if (action === 'edit') {
    fillServiceForm(serviceId);
    return;
  }

  if (action === 'delete') {
    const confirmed = window.confirm('Deseja realmente excluir este servico?');
    if (!confirmed) return;

    try {
      await fetchJson(`${API_BASE_URL}/services/${serviceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      setMessage('servicesMessage', 'Servico excluido com sucesso.');
      resetServiceForm();
      await loadServices();
    } catch (error) {
      setMessage('servicesMessage', error.message || 'Erro ao excluir servico.', true);
    }
  }
}

function setupLogout() {
  const logoutButton = document.getElementById('logoutButton');
  logoutButton.addEventListener('click', function onLogout(event) {
    event.preventDefault();
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    window.location.href = 'login.html';
  });
}

async function initializeAdmin() {
  if (!ensureBarberAccess()) return;

  setupLogout();
  loadShopSettings();
  document.getElementById('shopSettingsForm').addEventListener('submit', saveShopSettings);
  document.getElementById('barberForm').addEventListener('submit', handleCreateBarber);
  document.getElementById('serviceForm').addEventListener('submit', handleServiceSubmit);
  document.getElementById('servicesTableBody').addEventListener('click', handleServiceTableAction);

  try {
    await Promise.all([loadBarbers(), loadServices()]);
  } catch (error) {
    setMessage('barbersMessage', 'Falha ao carregar barbeiros.', true);
    setMessage('servicesMessage', 'Falha ao carregar servicos.', true);
  }
}

document.addEventListener('DOMContentLoaded', initializeAdmin);
