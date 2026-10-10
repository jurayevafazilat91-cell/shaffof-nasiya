// Sana, pul, IMEI va to‘lov jadvali hisob-kitoblari
const crypto = require('crypto');

const TZ_OFFSET_MIN = 5 * 60; // Toshkent vaqti UTC+5

function todayStr(now = new Date()) {
  return new Date(now.getTime() + TZ_OFFSET_MIN * 60000).toISOString().slice(0, 10);
}

function addMonths(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + n, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay)); // 31-yanvar + 1 oy = 28/29-fevral
  return target.toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const t = new Date(dateStr + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}

const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

// IMEI: 15 ta raqam + Luhn nazorat raqami (soxta/xato IMEI'ni ushlaydi)
function imeiValid(imei) {
  if (!/^\d{15}$/.test(imei)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = Number(imei[i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

function normPhone(p) {
  const digits = String(p || '').replace(/\D/g, '');
  if (digits.length === 9) return '+998' + digits;
  if (digits.length === 12 && digits.startsWith('998')) return '+' + digits;
  return null;
}

const token = (bytes = 9) => crypto.randomBytes(bytes).toString('hex');
const roundK = (n) => Math.round(n / 1000) * 1000;

// Nasiya rejasi: umumiy narx, oylik to‘lov va jadval
function buildPlan({ cashPrice, markupPercent, totalPrice, downPayment, months, startDate }) {
  const total = totalPrice ? roundK(totalPrice) : roundK(cashPrice * (1 + markupPercent / 100));
  const remaining = total - downPayment;
  const base = Math.floor(remaining / months / 1000) * 1000;
  const schedule = [];
  for (let i = 1; i <= months; i++) {
    const amount = i < months ? base : remaining - base * (months - 1);
    schedule.push({ n: i, dueDate: addMonths(startDate, i), amount, paid: 0, paidAt: null });
  }
  const overpayment = total - cashPrice;
  return {
    totalPrice: total,
    markupPercent: Math.round((overpayment / cashPrice) * 1000) / 10,
    remainingAfterDown: remaining,
    monthlyPayment: base,
    overpayment,
    schedule,
  };
}

// To‘lovlarni jadvalga eng eski oydan boshlab taqsimlash (qisman to‘lov ham hisobga olinadi)
function allocate(schedule, payments) {
  const items = schedule.map((s) => ({ ...s, paid: 0, paidAt: null }));
  for (const p of payments) {
    let left = p.amount;
    for (const it of items) {
      if (left <= 0) break;
      const need = it.amount - it.paid;
      if (need <= 0) continue;
      const take = Math.min(need, left);
      it.paid += take;
      left -= take;
      if (it.paid >= it.amount) it.paidAt = p.at;
    }
  }
  return items;
}

function itemStatus(it, today) {
  if (it.paid >= it.amount) return 'paid';
  if (it.dueDate < today) return 'overdue';
  if (it.dueDate === today) return 'today';
  return 'upcoming';
}

// Savdo bo‘yicha xulosa: qancha to‘langan, qancha qolgan, keyingi to‘lov, kechikish
function summarize(sale, today = todayStr()) {
  const schedule = sale.schedule.map((it) => ({ ...it, status: itemStatus(it, today) }));
  const paidInstallments = schedule.reduce((a, it) => a + it.paid, 0);
  const totalInstallments = schedule.reduce((a, it) => a + it.amount, 0);
  const overdue = schedule.filter((it) => it.status === 'overdue');
  const next = schedule.find((it) => it.status !== 'paid') || null;
  const remaining = totalInstallments - paidInstallments;
  let status = 'active';
  if (remaining <= 0) status = 'closed';
  else if (overdue.length) status = 'overdue';
  const maxLate = overdue.length ? daysBetween(overdue[0].dueDate, today) : 0;
  return {
    schedule,
    paidTotal: (sale.downPayment || 0) + paidInstallments,
    remaining,
    overdueAmount: overdue.reduce((a, it) => a + (it.amount - it.paid), 0),
    overdueCount: overdue.length,
    lateDays: maxLate,
    next: next ? { n: next.n, dueDate: next.dueDate, amount: next.amount - next.paid, status: next.status } : null,
    paidMonths: schedule.filter((it) => it.status === 'paid').length,
    status,
    progress: totalInstallments ? Math.round((paidInstallments / totalInstallments) * 100) : 100,
  };
}

const money = (n) => `${Math.round(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} so‘m`;

module.exports = { todayStr, addMonths, addDays, daysBetween, isDate, imeiValid, normPhone, token, buildPlan, allocate, itemStatus, summarize, money };
