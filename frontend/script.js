const API_BASE_URL = localStorage.getItem('apiBaseUrl') || window.location.origin;

const state = {
  selectedService: null,
  selectedProfessional: null,
  selectedDate: null,
  selectedTime: null,
  occupiedTimes: [],
  totalPrice: 0,
  barbers: [],
  services: []
};

function getAuthToken() {
  return localStorage.getItem('authToken');
}

function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem('authUser') || 'null');
  } catch (error) {
    return null;
  }
}

function normalizeUserType(type) {
  const value = String(type || '').toLowerCase();
  if (value === 'barbeiro' || value === 'barber') return 'barber';
  if (value === 'cliente' || value === 'client') return 'client';
  return value;
}

function setBookingMessage(message, variant = 'info') {
  const messageElement = document.getElementById('bookingMessage');
  if (!messageElement) return;
  messageElement.textContent = message || '';
  messageElement.className = 'booking-message';
  if (!message) return;
  messageElement.classList.add(`is-${variant}`);
}

function formatCurrency(value) {
  return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
}

function updateTotalPrice() {
  const totalPriceElement = document.getElementById('totalPrice');
  totalPriceElement.textContent = formatCurrency(state.totalPrice);
}

function updateConfirmButton() {
  const confirmBtn = document.getElementById('confirmBtn');
  const hasToken = Boolean(getAuthToken());
  const isClient = normalizeUserType(getAuthUser()?.type) === 'client';
  const selectedSlotIsValid = !isSelectedDateTimeInPast(state.selectedDate, state.selectedTime);

  const allSelected = state.selectedService &&
    state.selectedProfessional &&
    state.selectedDate &&
    state.selectedTime;

  confirmBtn.disabled = !(allSelected && hasToken && isClient && selectedSlotIsValid);
}

function resetBooking() {
  document.querySelectorAll('.service-card.selected').forEach((el) => el.classList.remove('selected'));
  document.querySelectorAll('.professional-card.selected').forEach((el) => el.classList.remove('selected'));
  document.querySelectorAll('.date-card.selected').forEach((el) => el.classList.remove('selected'));
  document.querySelectorAll('.time-slot.selected').forEach((el) => el.classList.remove('selected'));

  state.selectedService = null;
  state.selectedProfessional = null;
  state.selectedDate = null;
  state.selectedTime = null;
  state.occupiedTimes = [];
  state.totalPrice = 0;

  updateTotalPrice();
  updateConfirmButton();
  applyOccupiedTimesToSlots();
}

function extractHHMMFromDate(value) {
  if (!value) return null;

  const raw = String(value);
  if (/[zZ]$|[+\-]\d{2}:\d{2}$/.test(raw)) {
    const parsedWithTz = new Date(raw);
    if (!Number.isNaN(parsedWithTz.getTime())) {
      const hours = String(parsedWithTz.getHours()).padStart(2, '0');
      const minutes = String(parsedWithTz.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }

  const fromIso = raw.match(/T(\d{2}:\d{2})/);
  if (fromIso) return fromIso[1];

  const fromSql = raw.match(/ (\d{2}:\d{2})/);
  if (fromSql) return fromSql[1];

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function buildLocalDateTime(date, time) {
  if (!date || !time) return null;
  const [year, month, day] = String(date).split('-').map(Number);
  const [hours, minutes] = String(time).split(':').map(Number);
  if (!year || !month || !day || hours == null || minutes == null) return null;
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function isSelectedDateTimeInPast(date, time) {
  const slotDateTime = buildLocalDateTime(date, time);
  if (!slotDateTime || Number.isNaN(slotDateTime.getTime())) return false;
  return slotDateTime.getTime() < Date.now();
}

function isTodaySelected() {
  if (!state.selectedDate) return false;
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-');
  return state.selectedDate === today;
}

function applyOccupiedTimesToSlots() {
  const occupied = new Set(state.occupiedTimes);

  document.querySelectorAll('.time-slot').forEach((slot) => {
    const isOccupied = occupied.has(slot.dataset.time);
    const isPast = isSelectedDateTimeInPast(state.selectedDate, slot.dataset.time);
    slot.classList.toggle('unavailable', isOccupied || isPast);
    slot.classList.toggle('past-slot', isPast);
    slot.disabled = isOccupied || isPast;

    if ((isOccupied || isPast) && slot.classList.contains('selected')) {
      slot.classList.remove('selected');
      state.selectedTime = null;
    }
  });

  updateConfirmButton();
}

function renderProfessionals() {
  const container = document.querySelector('.professionals-scroll');
  if (!container) return;

  if (!state.barbers.length) {
    container.innerHTML = '<p>Nenhum barbeiro encontrado.</p>';
    return;
  }

  container.innerHTML = state.barbers.map((barber) => {
    const initials = barber.name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');

    return `
      <div class="professional-card" data-professional-id="${barber.id}">
        <div class="professional-avatar">${initials}</div>
        <p class="professional-name">${barber.name}</p>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.professional-card').forEach((card) => {
    card.addEventListener('click', function onProfessionalSelect() {
      document.querySelectorAll('.professional-card').forEach((item) => item.classList.remove('selected'));
      this.classList.add('selected');

      const barberId = Number(this.dataset.professionalId);
      state.selectedProfessional = state.barbers.find((barber) => barber.id === barberId) || null;
      state.selectedService = null;
      state.selectedTime = null;
      state.occupiedTimes = [];
      state.totalPrice = 0;

      document.querySelectorAll('.service-card').forEach((item) => item.classList.remove('selected'));
      document.querySelectorAll('.time-slot.selected').forEach((item) => item.classList.remove('selected'));
      applyOccupiedTimesToSlots();
      updateTotalPrice();
      updateConfirmButton();
      setBookingMessage('Profissional selecionado. Agora escolha o servico e o horario desejado.');

      loadServices(barberId);
      loadOccupiedTimes();
    });
  });
}

function renderServices() {
  const container = document.querySelector('.services-grid');
  if (!container) return;

  if (!state.services.length) {
    container.innerHTML = '<p>Selecione um barbeiro para ver os servicos.</p>';
    return;
  }

  container.innerHTML = state.services.map((service) => `
    <div class="service-card" data-service-id="${service.id}" data-price="${service.price}">
      <div class="service-card-background"></div>
      <div class="service-card-content">
        <h3 class="service-name">${service.name}</h3>
        <div class="service-details">
          <span class="service-duration"><strong></strong> ${service.duration_minutes} min</span>
          <p class="service-price">${formatCurrency(service.price)}</p>
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.service-card').forEach((card) => {
    card.addEventListener('click', function onServiceSelect() {
      document.querySelectorAll('.service-card').forEach((item) => item.classList.remove('selected'));
      this.classList.add('selected');

      const serviceId = Number(this.dataset.serviceId);
      state.selectedService = state.services.find((service) => service.id === serviceId) || null;
      state.totalPrice = Number(state.selectedService?.price || 0);

      updateTotalPrice();
      updateConfirmButton();
      setBookingMessage('Servico selecionado. Falta escolher a data e um horario disponivel.');
    });
  });
}

function renderDates() {
  const container = document.querySelector('.dates-scroll');
  if (!container) return;

  const formatterDay = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
  const formatterMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateISO = date.toISOString().slice(0, 10);
    const dayName = formatterDay.format(date).replace('.', '');
    const monthName = formatterMonth.format(date).replace('.', '');
    dates.push({ dateISO, day: dayName, number: String(date.getDate()).padStart(2, '0'), month: monthName });
  }

  container.innerHTML = dates.map((item) => `
    <div class="date-card" data-date="${item.dateISO}">
      <p class="date-day">${item.day}</p>
      <p class="date-number">${item.number}</p>
      <p class="date-month">${item.month}</p>
    </div>
  `).join('');

  document.querySelectorAll('.date-card').forEach((card) => {
    card.addEventListener('click', function onDateSelect() {
      document.querySelectorAll('.date-card').forEach((item) => item.classList.remove('selected'));
      this.classList.add('selected');
      state.selectedDate = this.dataset.date;
      state.selectedTime = null;
      document.querySelectorAll('.time-slot.selected').forEach((item) => item.classList.remove('selected'));
      updateConfirmButton();
      setBookingMessage(
        isTodaySelected()
          ? 'Horarios que ja passaram foram bloqueados automaticamente para hoje.'
          : 'Data selecionada. Escolha um horario disponivel.'
      );
      loadOccupiedTimes();
    });
  });
}

function setupTimeSelection() {
  document.querySelectorAll('.time-slot').forEach((slot) => {
    slot.addEventListener('click', function onTimeSelect() {
      if (this.disabled || this.classList.contains('unavailable')) return;
      document.querySelectorAll('.time-slot').forEach((item) => item.classList.remove('selected'));
      this.classList.add('selected');
      state.selectedTime = this.dataset.time;
      updateConfirmButton();
      setBookingMessage(`Horario ${state.selectedTime} selecionado. Revise e confirme o agendamento.`);
    });
  });
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

async function loadBarbers() {
  const barbers = await fetchJson(`${API_BASE_URL}/barbers`);
  state.barbers = barbers.filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i);
  renderProfessionals();
}

async function loadServices(barberId) {
  const query = barberId ? `?barber_id=${barberId}` : '';
  const services = await fetchJson(`${API_BASE_URL}/services${query}`);
  state.services = Array.isArray(services)
    ? services.filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i)
    : [];
  renderServices();
}

async function loadOccupiedTimes() {
  if (!state.selectedProfessional || !state.selectedDate) {
    state.occupiedTimes = [];
    applyOccupiedTimesToSlots();
    return;
  }

  const token = getAuthToken();
  if (!token) {
    state.occupiedTimes = [];
    applyOccupiedTimesToSlots();
    return;
  }

  try {
    const appointments = await fetchJson(
      `${API_BASE_URL}/appointments?barber_id=${state.selectedProfessional.id}&date=${state.selectedDate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    state.occupiedTimes = appointments
      .map((appointment) => extractHHMMFromDate(appointment.start_at))
      .filter(Boolean);
  } catch (error) {
    state.occupiedTimes = [];
    setBookingMessage(error.message || 'Nao foi possivel carregar horarios ocupados.', 'error');
  }

  applyOccupiedTimesToSlots();
}

function buildAppointmentStartAt(date, time) {
  return `${date}T${time}:00`;
}

async function createAppointment() {
  const token = getAuthToken();
  if (!token) {
    setBookingMessage('Voce precisa fazer login para agendar.', 'error');
    window.location.href = 'login.html';
    return;
  }

  if (isSelectedDateTimeInPast(state.selectedDate, state.selectedTime)) {
    throw new Error('Esse horario ja passou. Escolha outro horario disponivel.');
  }

  const payload = {
    barber_id: state.selectedProfessional.id,
    service_id: state.selectedService.id,
    start_at: buildAppointmentStartAt(state.selectedDate, state.selectedTime)
  };

  await fetchJson(`${API_BASE_URL}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

function setupConfirmButton() {
  const confirmBtn = document.getElementById('confirmBtn');
  confirmBtn.addEventListener('click', async function onConfirmClick() {
    if (confirmBtn.disabled) return;

    try {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Confirmando...';
      setBookingMessage('Enviando agendamento...');
      await createAppointment();
      const successMessage = `Agendamento confirmado para ${state.selectedDate} as ${state.selectedTime} com ${state.selectedProfessional.name}.`;
      resetBooking();
      setBookingMessage(successMessage, 'success');
    } catch (error) {
      setBookingMessage(error.message || 'Erro ao confirmar agendamento.', 'error');
      updateConfirmButton();
    } finally {
      confirmBtn.textContent = 'Confirmar Agendamento';
      updateConfirmButton();
    }
  });
}

function validateAccessForBooking() {
  const token = getAuthToken();
  const user = getAuthUser();
  const role = normalizeUserType(user?.type);

  if (!token || !user) {
    setBookingMessage('Entre na conta para realizar um agendamento.');
    return;
  }

  if (role !== 'client') {
    setBookingMessage('Apenas clientes podem criar agendamentos nesta tela.', 'error');
    return;
  }
}

async function initializeApp() {
  updateTotalPrice();
  renderDates();
  setupTimeSelection();
  setupConfirmButton();
  validateAccessForBooking();
  updateConfirmButton();

  try {
    await loadBarbers();
    renderServices();
  } catch (error) {
    setBookingMessage(error.message || 'Erro ao carregar dados iniciais.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', initializeApp);
