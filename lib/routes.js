// Barcha API yo‘llari. Vercel'da bitta funksiya (api/index.js) orqali ishlaydi.
const { getDb, toId } = require('./db');
const { hashPassword, checkPassword, signToken, readToken } = require('./auth');
const U = require('./util');
const tg = require('./telegram');
const { processSeller, runAll } = require('./reminders');
const { handleUpdate } = require('./bot');

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new HttpError(status, message); };

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = [];
  let size = 0;
  for await (const c of req) { size += c.length; if (size > 200000) fail(413, 'So‘rov juda katta'); chunks.push(c); }
  try { return JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch { return {}; }
}

const str = (v, max = 120) => String(v ?? '').trim().slice(0, max);
const int = (v) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? n : NaN; };

// ---------- Ko‘rinish (frontendga yuboriladigan shakl) ----------
function publicSeller(s) {
  return {
    id: String(s._id), name: s.name, shopName: s.shopName, phone: s.phone,
    telegramConnected: Boolean(s.telegramChatId),
    telegramLink: tg.botLink(`s_${s.linkCode}`),
    botUsername: tg.botUsername() || null,
    createdAt: s.createdAt,
  };
}

function presentSale(sale, today, full = false) {
  const s = U.summarize(sale, today);
  const base = {
    id: String(sale._id), code: sale.code, createdAt: sale.createdAt, startDate: sale.startDate,
    customer: sale.customer, device: sale.device,
    cashPrice: sale.cashPrice, markupPercent: sale.markupPercent, totalPrice: sale.totalPrice,
    downPayment: sale.downPayment, months: sale.months, monthlyPayment: sale.monthlyPayment,
    overpayment: sale.totalPrice - sale.cashPrice,
    status: s.status, paidTotal: s.paidTotal, remaining: s.remaining, overdueAmount: s.overdueAmount,
    lateDays: s.lateDays, next: s.next, progress: s.progress, paidMonths: s.paidMonths,
    ribbon: s.schedule.map((it) => it.status),
    customerLinked: Boolean(sale.customerChatId),
    customerConfirmedAt: sale.customerConfirmedAt || null,
  };
  if (!full) return base;
  return {
    ...base, note: sale.note || '', schedule: s.schedule, payments: sale.payments || [],
    customerToken: sale.customerToken, customerBotLink: tg.botLink(`c_${sale.customerToken}`),
  };
}

// ---------- Kirish ----------
async function register(db, body) {
  const name = str(body.name, 60), shopName = str(body.shopName, 80), phone = U.normPhone(body.phone);
  const password = String(body.password || '');
  if (name.length < 2) fail(400, 'Ismingizni kiriting.');
  if (shopName.length < 2) fail(400, 'Do‘kon nomini kiriting.');
  if (!phone) fail(400, 'Telefon raqam noto‘g‘ri. Masalan: 90 123 45 67');
  if (password.length < 6) fail(400, 'Parol kamida 6 ta belgidan iborat bo‘lsin.');
  if (await db.collection('sellers').findOne({ phone })) fail(409, 'Bu raqam bilan hisob bor. Kirish sahifasidan kiring.');
  const seller = { name, shopName, phone, passwordHash: await hashPassword(password), linkCode: U.token(6), telegramChatId: null, saleCounter: 0, createdAt: new Date() };
  const r = await db.collection('sellers').insertOne(seller);
  seller._id = r.insertedId;
  return { token: signToken(seller._id), seller: publicSeller(seller) };
}

async function login(db, body) {
  const phone = U.normPhone(body.phone);
  const seller = phone && await db.collection('sellers').findOne({ phone });
  if (!seller || !(await checkPassword(String(body.password || ''), seller.passwordHash))) fail(401, 'Telefon raqam yoki parol noto‘g‘ri.');
  return { token: signToken(seller._id), seller: publicSeller(seller) };
}

async function requireSeller(db, req) {
  const sid = readToken(req);
  const id = sid && toId(sid);
  const seller = id && await db.collection('sellers').findOne({ _id: id });
  if (!seller) fail(401, 'Qaytadan kiring.');
  return seller;
}

// ---------- Savdolar ----------
function validateSale(body) {
  const c = body.customer || {}, d = body.device || {};
  const customer = {
    fullName: str(c.fullName, 80), phone: U.normPhone(c.phone), phone2: c.phone2 ? U.normPhone(c.phone2) : null,
    passport: str(c.passport, 20).toUpperCase(), address: str(c.address, 160),
  };
  if (customer.fullName.length < 3) fail(400, 'Mijozning to‘liq ismini kiriting.');
  if (!customer.phone) fail(400, 'Mijoz telefon raqami noto‘g‘ri.');
  if (c.phone2 && !customer.phone2) fail(400, 'Qo‘shimcha telefon raqami noto‘g‘ri.');

  const device = {
    brand: str(d.brand, 40), model: str(d.model, 60), memory: str(d.memory, 20), color: str(d.color, 30),
    condition: d.condition === 'b/u' ? 'b/u' : 'yangi', imei: String(d.imei || '').replace(/\D/g, ''),
    imei2: d.imei2 ? String(d.imei2).replace(/\D/g, '') : '',
  };
  if (!device.brand || !device.model) fail(400, 'Telefon brendi va modelini kiriting.');
  if (!U.imeiValid(device.imei)) fail(400, 'IMEI noto‘g‘ri: 15 ta raqam va to‘g‘ri nazorat raqami bo‘lishi kerak. Telefonda *#06# tering.');
  if (device.imei2 && !U.imeiValid(device.imei2)) fail(400, 'Ikkinchi IMEI noto‘g‘ri.');

  const cashPrice = int(body.cashPrice), months = int(body.months), downPayment = int(body.downPayment || 0);
  const totalPrice = body.totalPrice ? int(body.totalPrice) : null;
  const markupPercent = body.markupPercent !== undefined && body.markupPercent !== '' ? Number(body.markupPercent) : null;
  if (!(cashPrice >= 10000 && cashPrice <= 1e10)) fail(400, 'Naqd narx noto‘g‘ri.');
  if (!(months >= 1 && months <= 36)) fail(400, 'Muddat 1 dan 36 oygacha bo‘lishi kerak.');
  if (totalPrice === null && (markupPercent === null || !(markupPercent >= 0 && markupPercent <= 300))) fail(400, 'Ustama foizi yoki umumiy narxni kiriting.');
  if (totalPrice !== null && !(totalPrice >= cashPrice && totalPrice <= 1e10)) fail(400, 'Umumiy narx naqd narxdan kam bo‘lmasligi kerak.');
  const startDate = U.isDate(body.startDate) ? body.startDate : U.todayStr();

  const plan = U.buildPlan({ cashPrice, markupPercent: markupPercent ?? 0, totalPrice, downPayment, months, startDate });
  if (!(downPayment >= 0 && downPayment < plan.totalPrice)) fail(400, 'Boshlang‘ich to‘lov umumiy narxdan kam bo‘lishi kerak.');
  if (plan.monthlyPayment <= 0) fail(400, 'Oylik to‘lov juda kichik chiqdi. Muddatni kamaytiring.');
  return { customer, device, cashPrice, downPayment, months, startDate, plan, note: str(body.note, 500) };
}

async function createSale(db, seller, body) {
  const v = validateSale(body);
  if (!body.force) {
    const dup = await db.collection('sales').findOne({ sellerId: seller._id, 'device.imei': v.device.imei, status: 'active' });
    if (dup) fail(409, `Bu IMEI bilan faol nasiya bor: ${dup.customer.fullName} (${dup.code}). Baribir saqlash uchun tasdiqlang.`);
  }
  await db.collection('sellers').updateOne({ _id: seller._id }, { $inc: { saleCounter: 1 } });
  const fresh = await db.collection('sellers').findOne({ _id: seller._id });
  const now = new Date();
  const sale = {
    sellerId: seller._id, code: `N-${String(fresh.saleCounter || 1).padStart(4, '0')}`,
    customer: v.customer, device: v.device,
    cashPrice: v.cashPrice, markupPercent: v.plan.markupPercent, totalPrice: v.plan.totalPrice,
    downPayment: v.downPayment, months: v.months, monthlyPayment: v.plan.monthlyPayment,
    startDate: v.startDate, schedule: v.plan.schedule, payments: [], note: v.note,
    status: 'active', customerToken: U.token(8), customerChatId: null, customerConfirmedAt: null,
    createdAt: now, updatedAt: now,
  };
  const r = await db.collection('sales').insertOne(sale);
  sale._id = r.insertedId;
  return presentSale(sale, U.todayStr(), true);
}

async function getOwnedSale(db, seller, id) {
  const _id = toId(id);
  const sale = _id && await db.collection('sales').findOne({ _id, sellerId: seller._id });
  if (!sale) fail(404, 'Savdo topilmadi.');
  return sale;
}

async function saveSchedule(db, sale) {
  sale.schedule = U.allocate(sale.schedule, sale.payments);
  const s = U.summarize(sale);
  sale.status = s.status === 'closed' ? 'closed' : 'active';
  await db.collection('sales').updateOne({ _id: sale._id }, { $set: { schedule: sale.schedule, payments: sale.payments, status: sale.status, updatedAt: new Date() } });
  return s;
}

async function pay(db, seller, id, body) {
  const sale = await getOwnedSale(db, seller, id);
  const s0 = U.summarize(sale);
  const amount = int(body.amount);
  if (!(amount > 0)) fail(400, 'To‘lov summasini kiriting.');
  if (amount > s0.remaining) fail(400, `Qolgan qarz ${U.money(s0.remaining)}. Undan ko‘p kiritib bo‘lmaydi.`);
  sale.payments = [...(sale.payments || []), { amount, at: new Date().toISOString(), date: U.todayStr(), note: str(body.note, 120) }];
  const s = await saveSchedule(db, sale);
  if (sale.customerChatId) {
    tg.send(sale.customerChatId, `✅ To‘lov qabul qilindi: <b>${U.money(amount)}</b>\n${tg.esc(sale.device.brand)} ${tg.esc(sale.device.model)}\nQolgan qarz: ${U.money(s.remaining)}${s.status === 'closed' ? '\n🎉 Nasiya to‘liq yopildi. Rahmat!' : ''}`);
  }
  return presentSale(sale, U.todayStr(), true);
}

async function undoPayment(db, seller, id) {
  const sale = await getOwnedSale(db, seller, id);
  if (!sale.payments?.length) fail(400, 'Bekor qilinadigan to‘lov yo‘q.');
  sale.payments = sale.payments.slice(0, -1);
  await saveSchedule(db, sale);
  return presentSale(sale, U.todayStr(), true);
}

async function updateSale(db, seller, id, body) {
  const sale = await getOwnedSale(db, seller, id);
  const set = { updatedAt: new Date() };
  if (body.customer) {
    const c = body.customer;
    const phone = c.phone !== undefined ? U.normPhone(c.phone) : sale.customer.phone;
    if (!phone) fail(400, 'Telefon raqam noto‘g‘ri.');
    set.customer = { ...sale.customer, fullName: c.fullName !== undefined ? str(c.fullName, 80) : sale.customer.fullName, phone,
      phone2: c.phone2 ? U.normPhone(c.phone2) : (c.phone2 === '' ? null : sale.customer.phone2),
      passport: c.passport !== undefined ? str(c.passport, 20).toUpperCase() : sale.customer.passport,
      address: c.address !== undefined ? str(c.address, 160) : sale.customer.address };
    if (set.customer.fullName.length < 3) fail(400, 'Mijozning to‘liq ismini kiriting.');
  }
  if (body.note !== undefined) set.note = str(body.note, 500);
  await db.collection('sales').updateOne({ _id: sale._id }, { $set: set });
  return presentSale({ ...sale, ...set }, U.todayStr(), true);
}

async function listSales(db, seller, query) {
  const today = U.todayStr();
  const all = await db.collection('sales').find({ sellerId: seller._id }).sort({ createdAt: -1 }).toArray();
  let list = all.map((s) => presentSale(s, today));
  const q = str(query.q, 60).toLowerCase();
  if (q) {
    const digits = q.replace(/\D/g, '');
    list = list.filter((s) => [s.customer.fullName, s.device.brand, s.device.model, s.code].some((x) => String(x).toLowerCase().includes(q))
      || (digits.length >= 3 && [s.customer.phone, s.customer.phone2, s.device.imei, s.device.imei2].some((x) => String(x || '').includes(digits))));
  }
  const f = query.filter;
  if (f === 'active') list = list.filter((s) => s.status !== 'closed');
  else if (f === 'overdue') list = list.filter((s) => s.status === 'overdue');
  else if (f === 'closed') list = list.filter((s) => s.status === 'closed');
  else if (f === 'today') list = list.filter((s) => s.next && s.next.dueDate === today && s.next.status === 'today');
  return { items: list, total: all.length };
}

// ---------- Statistika ----------
async function stats(db, seller) {
  const today = U.todayStr();
  await processSeller(db, seller, { today }); // saytdagi xabarlarni yangilab qo‘yamiz
  const sales = await db.collection('sales').find({ sellerId: seller._id }).toArray();
  const month = today.slice(0, 7);
  const months = [];
  for (let i = 5; i >= 0; i--) months.push(U.addMonths(`${month}-01`, -i).slice(0, 7));
  const chart = Object.fromEntries(months.map((m) => [m, { month: m, collected: 0, expected: 0, sold: 0 }]));
  const models = {};
  const t = { active: 0, closed: 0, overdueSales: 0, portfolio: 0, collected: 0, outstanding: 0, overdueAmount: 0, expectedProfit: 0, monthExpected: 0, monthCollected: 0, customersLinked: 0 };
  const todayList = [], overdueList = [], soonList = [];
  const weeks = [0, 0, 0, 0, 0]; // joriy oy: 1–7, 8–14, 15–21, 22–28, 29–31
  const weekOf = (date) => Math.min(4, Math.floor((Number(date.slice(8, 10)) - 1) / 7));

  for (const sale of sales) {
    const s = U.summarize(sale, today);
    const p = presentSale(sale, today);
    t.collected += s.paidTotal;
    t.expectedProfit += sale.totalPrice - sale.cashPrice;
    if (sale.customerChatId) t.customersLinked++;
    if (s.status === 'closed') t.closed++;
    else {
      t.active++; t.portfolio += sale.totalPrice; t.outstanding += s.remaining; t.overdueAmount += s.overdueAmount;
      if (s.status === 'overdue') { t.overdueSales++; overdueList.push(p); }
      else if (s.next && s.next.dueDate === today) todayList.push(p);
      else if (s.next && U.daysBetween(today, s.next.dueDate) <= 7) soonList.push(p);
    }
    const created = new Date(sale.createdAt);
    const cm = U.todayStr(created).slice(0, 7);
    if (chart[cm]) { chart[cm].sold++; chart[cm].collected += sale.downPayment || 0; }
    if (cm === month && sale.downPayment) weeks[weekOf(U.todayStr(created))] += sale.downPayment;
    for (const it of sale.schedule) if (chart[it.dueDate.slice(0, 7)]) chart[it.dueDate.slice(0, 7)].expected += it.amount;
    for (const pay of sale.payments || []) {
      const pm = (pay.date || '').slice(0, 7);
      if (chart[pm]) chart[pm].collected += pay.amount;
      if (pm === month) { t.monthCollected += pay.amount; weeks[weekOf(pay.date)] += pay.amount; }
    }
    for (const it of sale.schedule) if (it.dueDate.slice(0, 7) === month) t.monthExpected += it.amount;
    const key = `${sale.device.brand} ${sale.device.model}`;
    models[key] = (models[key] || 0) + 1;
  }
  overdueList.sort((a, b) => b.lateDays - a.lateDays);
  soonList.sort((a, b) => a.next.dueDate.localeCompare(b.next.dueDate));
  const unread = (await db.collection('notifications').find({ sellerId: seller._id, read: false }).toArray()).length;
  return {
    today, totals: { ...t, sales: sales.length }, chart: months.map((m) => chart[m]), weeks,
    topModels: Object.entries(models).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count })),
    todayList, overdueList: overdueList.slice(0, 20), soonList: soonList.slice(0, 20), unread,
  };
}

// ---------- Xabarlar ----------
async function notifications(db, seller) {
  await processSeller(db, seller, {});
  const items = await db.collection('notifications').find({ sellerId: seller._id }).sort({ createdAt: -1 }).limit(100).toArray();
  const activeSales = (await db.collection('sales').find({ sellerId: seller._id, status: 'active' }).toArray()).length;
  return { items: items.map((n) => ({ id: String(n._id), type: n.type, text: n.text, saleId: n.saleId ? String(n.saleId) : null, read: n.read, createdAt: n.createdAt })), unread: items.filter((n) => !n.read).length, activeSales };
}

async function markRead(db, seller, body) {
  const col = db.collection('notifications');
  if (body.all) {
    const items = await col.find({ sellerId: seller._id, read: false }).toArray();
    for (const n of items) await col.updateOne({ _id: n._id }, { $set: { read: true } });
  } else if (Array.isArray(body.ids)) {
    for (const id of body.ids.slice(0, 100)) { const _id = toId(id); if (_id) await col.updateOne({ _id, sellerId: seller._id }, { $set: { read: true } }); }
  }
  return { ok: true };
}

// ---------- Mijoz sahifasi (ochiq havola) ----------
async function publicSale(db, tokenStr) {
  const sale = await db.collection('sales').findOne({ customerToken: String(tokenStr) });
  if (!sale) fail(404, 'Havola topilmadi.');
  const seller = await db.collection('sellers').findOne({ _id: sale.sellerId });
  const p = presentSale(sale, U.todayStr(), true);
  return {
    shopName: seller?.shopName || '', sellerPhone: seller?.phone || '',
    customerName: sale.customer.fullName,
    device: { brand: sale.device.brand, model: sale.device.model, memory: sale.device.memory, color: sale.device.color, imeiTail: sale.device.imei.slice(-4) },
    cashPrice: p.cashPrice, totalPrice: p.totalPrice, overpayment: p.overpayment, markupPercent: p.markupPercent,
    downPayment: p.downPayment, months: p.months, monthlyPayment: p.monthlyPayment,
    schedule: p.schedule.map(({ n, dueDate, amount, paid, status }) => ({ n, dueDate, amount, paid, status })),
    remaining: p.remaining, next: p.next, status: p.status, progress: p.progress,
    confirmedAt: p.customerConfirmedAt, botLink: p.customerBotLink,
  };
}

async function confirmPublic(db, tokenStr, body) {
  const sale = await db.collection('sales').findOne({ customerToken: String(tokenStr) });
  if (!sale) fail(404, 'Havola topilmadi.');
  const ok = int(body.total) === sale.totalPrice && int(body.overpayment) === sale.totalPrice - sale.cashPrice && int(body.months) === sale.months;
  if (!ok) fail(400, 'Javoblarda xato bor. Shartlarni qayta ko‘rib chiqing.');
  const at = new Date();
  await db.collection('sales').updateOne({ _id: sale._id }, { $set: { customerConfirmedAt: at } });
  return { confirmedAt: at };
}

// ---------- Router ----------
async function route(req, res, segments) {
  const method = req.method;
  const [a, b, c] = segments;
  const query = Object.fromEntries(new URL(req.url, 'http://x').searchParams);

  if (a === 'health') return { ok: true, time: new Date().toISOString() };

  if (a === 'telegram' && method === 'POST') {
    const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
    if (process.env.TELEGRAM_WEBHOOK_SECRET && secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) fail(401, 'secret');
    const db = await getDb();
    try { await handleUpdate(db, await readJson(req)); } catch (e) { console.error('bot', e); }
    return { ok: true };
  }

  if (a === 'cron') {
    const auth = req.headers.authorization || '';
    if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}` && query.key !== process.env.CRON_SECRET) fail(401, 'Ruxsat yo‘q');
    const db = await getDb();
    return { ok: true, sellers: await runAll(db) };
  }

  const db = await getDb();

  if (a === 'auth' && b === 'register' && method === 'POST') return register(db, await readJson(req));
  if (a === 'auth' && b === 'login' && method === 'POST') return login(db, await readJson(req));

  if (a === 'public' && b) {
    if (method === 'GET' && !c) return publicSale(db, b);
    if (method === 'POST' && c === 'confirm') return confirmPublic(db, b, await readJson(req));
  }

  const seller = await requireSeller(db, req);

  if (a === 'me') {
    if (method === 'GET' && !b) return publicSeller(seller);
    if (method === 'PATCH' && !b) {
      const body = await readJson(req);
      const set = {};
      if (body.name !== undefined) { set.name = str(body.name, 60); if (set.name.length < 2) fail(400, 'Ism juda qisqa.'); }
      if (body.shopName !== undefined) { set.shopName = str(body.shopName, 80); if (set.shopName.length < 2) fail(400, 'Do‘kon nomi juda qisqa.'); }
      if (body.newPassword) {
        if (!(await checkPassword(String(body.password || ''), seller.passwordHash))) fail(400, 'Joriy parol noto‘g‘ri.');
        if (String(body.newPassword).length < 6) fail(400, 'Yangi parol kamida 6 ta belgi.');
        set.passwordHash = await hashPassword(String(body.newPassword));
      }
      await db.collection('sellers').updateOne({ _id: seller._id }, { $set: set });
      return publicSeller({ ...seller, ...set });
    }
    if (method === 'POST' && b === 'telegram-unlink') {
      await db.collection('sellers').updateOne({ _id: seller._id }, { $set: { telegramChatId: null, linkCode: U.token(6) } });
      return publicSeller({ ...seller, telegramChatId: null });
    }
    if (method === 'POST' && b === 'telegram-test') {
      if (!seller.telegramChatId) fail(400, 'Avval Telegram botni ulang.');
      const ok = await tg.send(seller.telegramChatId, '✅ Sinov xabari: bot ishlayapti!');
      if (!ok) fail(502, 'Telegram xabar yubormadi. TELEGRAM_BOT_TOKEN ni tekshiring.');
      return { ok: true };
    }
  }

  if (a === 'stats' && method === 'GET') return stats(db, seller);

  if (a === 'notifications') {
    if (method === 'GET') return notifications(db, seller);
    if (method === 'POST' && b === 'read') return markRead(db, seller, await readJson(req));
  }

  if (a === 'sales') {
    if (!b && method === 'GET') return listSales(db, seller, query);
    if (!b && method === 'POST') return createSale(db, seller, await readJson(req));
    if (b && !c && method === 'GET') return presentSale(await getOwnedSale(db, seller, b), U.todayStr(), true);
    if (b && !c && method === 'PATCH') return updateSale(db, seller, b, await readJson(req));
    if (b && !c && method === 'DELETE') {
      const sale = await getOwnedSale(db, seller, b);
      await db.collection('sales').deleteOne({ _id: sale._id });
      return { ok: true };
    }
    if (b && c === 'pay' && method === 'POST') return pay(db, seller, b, await readJson(req));
    if (b && c === 'undo' && method === 'POST') return undoPayment(db, seller, b);
  }

  fail(404, 'Bunday API yo‘q.');
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const url = new URL(req.url, 'http://x');
  let path = url.searchParams.get('route') || url.pathname.replace(/^\/api\/?/, '');
  if (path.startsWith('index')) path = path.replace(/^index\/?/, '');
  const segments = path.split('/').filter(Boolean).map(decodeURIComponent);
  try {
    const data = await route(req, res, segments);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error(e);
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: status === 500 ? `Server xatosi: ${e.message}` : e.message }));
  }
}

module.exports = { handler, route };
