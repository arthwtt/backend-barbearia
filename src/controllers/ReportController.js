const { Op } = require('sequelize');
const { Appointment } = require('../../models');

function normalizeUserType(type) {
  const value = String(type || '').toLowerCase();
  if (value === 'barbeiro' || value === 'barber') return 'barber';
  if (value === 'cliente' || value === 'client') return 'client';
  return value;
}

function toDbDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getStartOfWeek(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

function getEndOfWeek(date) {
  const result = getStartOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

function getStartOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function getEndOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getTimeLabel(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
}

function getDayLabel(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  }).format(parsed).replace('.', '');
}

function sumRevenue(items) {
  return items.reduce((sum, item) => {
    return sum + Number(item.service && item.service.price ? item.service.price : 0);
  }, 0);
}

function buildRanking(itemsMap, formatter) {
  return Object.entries(itemsMap)
    .map(([key, value]) => formatter(key, value))
    .sort((a, b) => b.total - a.total || b.revenue - a.revenue)
    .slice(0, 5);
}

module.exports = {
  async overview(req, res) {
    try {
      if (normalizeUserType(req.userType) !== 'barber') {
        return res.status(403).json({ error: 'Apenas barbeiros podem acessar relatorios.' });
      }

      const now = new Date();
      const weekStart = getStartOfWeek(now);
      const weekEnd = getEndOfWeek(now);
      const monthStart = getStartOfMonth(now);
      const monthEnd = getEndOfMonth(now);

      const weekAppointments = await Appointment.findAll({
        where: {
          barber_id: req.userId,
          start_at: {
            [Op.between]: [toDbDateTime(weekStart), toDbDateTime(weekEnd)]
          }
        },
        include: [
          { association: 'service', attributes: ['id', 'name', 'price', 'duration_minutes'] },
          { association: 'client', attributes: ['id', 'name'] }
        ],
        order: [['start_at', 'ASC']]
      });

      const monthAppointments = await Appointment.findAll({
        where: {
          barber_id: req.userId,
          start_at: {
            [Op.between]: [toDbDateTime(monthStart), toDbDateTime(monthEnd)]
          }
        },
        include: [
          { association: 'service', attributes: ['id', 'name', 'price', 'duration_minutes'] }
        ],
        order: [['start_at', 'ASC']]
      });

      const upcomingAppointments = await Appointment.findAll({
        where: {
          barber_id: req.userId,
          status: { [Op.ne]: 'cancelled' },
          start_at: {
            [Op.gte]: toDbDateTime(now)
          }
        },
        include: [
          { association: 'service', attributes: ['id', 'name', 'price', 'duration_minutes'] },
          { association: 'client', attributes: ['id', 'name'] }
        ],
        order: [['start_at', 'ASC']],
        limit: 5
      });

      const weeklyActiveAppointments = weekAppointments.filter((item) => item.status !== 'cancelled');
      const weeklyRevenue = sumRevenue(weeklyActiveAppointments);
      const averageTicket = weeklyActiveAppointments.length ? weeklyRevenue / weeklyActiveAppointments.length : 0;

      const serviceAggregation = {};
      const dayAggregation = {};
      const hourAggregation = {};

      monthAppointments
        .filter((item) => item.status !== 'cancelled')
        .forEach((appointment) => {
          const serviceName = appointment.service && appointment.service.name ? appointment.service.name : 'Servico';
          const price = Number(appointment.service && appointment.service.price ? appointment.service.price : 0);
          const dayLabel = getDayLabel(appointment.start_at);
          const timeLabel = getTimeLabel(appointment.start_at);

          if (!serviceAggregation[serviceName]) {
            serviceAggregation[serviceName] = { total: 0, revenue: 0 };
          }
          serviceAggregation[serviceName].total += 1;
          serviceAggregation[serviceName].revenue += price;

          if (dayLabel) {
            if (!dayAggregation[dayLabel]) {
              dayAggregation[dayLabel] = { total: 0, revenue: 0 };
            }
            dayAggregation[dayLabel].total += 1;
            dayAggregation[dayLabel].revenue += price;
          }

          if (timeLabel) {
            if (!hourAggregation[timeLabel]) {
              hourAggregation[timeLabel] = { total: 0, revenue: 0 };
            }
            hourAggregation[timeLabel].total += 1;
            hourAggregation[timeLabel].revenue += price;
          }
        });

      return res.json({
        generated_at: now.toISOString(),
        period: {
          week_start: weekStart.toISOString(),
          week_end: weekEnd.toISOString(),
          month_start: monthStart.toISOString(),
          month_end: monthEnd.toISOString()
        },
        summary: {
          appointments_this_week: weekAppointments.length,
          active_this_week: weeklyActiveAppointments.length,
          confirmed_this_week: weekAppointments.filter((item) => item.status === 'confirmed').length,
          cancelled_this_week: weekAppointments.filter((item) => item.status === 'cancelled').length,
          weekly_revenue: weeklyRevenue,
          average_ticket: averageTicket,
          monthly_revenue: sumRevenue(monthAppointments.filter((item) => item.status !== 'cancelled'))
        },
        top_services: buildRanking(serviceAggregation, (name, value) => ({
          name,
          total: value.total,
          revenue: value.revenue
        })),
        busiest_days: buildRanking(dayAggregation, (label, value) => ({
          label,
          total: value.total,
          revenue: value.revenue
        })),
        peak_hours: buildRanking(hourAggregation, (label, value) => ({
          label,
          total: value.total,
          revenue: value.revenue
        })),
        upcoming_appointments: upcomingAppointments.map((appointment) => ({
          id: appointment.id,
          start_at: appointment.start_at,
          status: appointment.status,
          client_name: appointment.client && appointment.client.name ? appointment.client.name : 'Cliente',
          service_name: appointment.service && appointment.service.name ? appointment.service.name : 'Servico',
          service_price: Number(appointment.service && appointment.service.price ? appointment.service.price : 0)
        }))
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao gerar relatorios.' });
    }
  }
};
