// Eslatmalar: saytdagi xabarlar (notifications) va Telegram orqali yuboriladigan xabarlar
const { summarize, todayStr, daysBetween, money } = require('./util');
const tg = require('./telegram');

const label = (sale) => `${sale.customer.fullName} — ${sale.device.brand} ${sale.device.model}`;

async function addNote(db, sellerId, key, type, text, saleId) {
  const col = db.collection('notifications');
  if (await col.findOne({ sellerId, key })) return false;
  try {
    await col.insertOne({ sellerId, key, type, text, saleId, read: false, createdAt: new Date() });
    return true;
  } catch { return false; } // bir vaqtda ikki marta yaratilsa, unique index to‘xtatadi
}

// Bitta sotuvchi uchun bugungi holatni tekshirib, xabarlar yaratadi.
// telegram=true bo‘lsa (kunlik cron), Telegram'ga ham yuboradi.
async function processSeller(db, seller, { telegram = false, today = todayStr() } = {}) {
  const sales = await db.collection('sales').find({ sellerId: seller._id, status: 'active' }).toArray();
  const digest = { today: [], soon: [], overdue: [] };

  for (const sale of sales) {
    const s = summarize(sale, today);
    if (!s.next) continue;
    const n = s.next.n;
    if (s.overdueCount) {
      digest.overdue.push({ sale, s });
      await addNote(db, seller._id, `${sale._id}:${n}:overdue`, 'overdue',
        `Kechikkan to‘lov: ${label(sale)}. ${s.lateDays} kun kechikdi, qarz ${money(s.overdueAmount)}.`, sale._id);
    } else if (s.next.dueDate === today) {
      digest.today.push({ sale, s });
      await addNote(db, seller._id, `${sale._id}:${n}:today`, 'today',
        `Bugun to‘lov kuni: ${label(sale)}. ${n}-oy, ${money(s.next.amount)}.`, sale._id);
    } else {
      const left = daysBetween(today, s.next.dueDate);
      if (left > 0 && left <= 3) {
        digest.soon.push({ sale, s, left });
        await addNote(db, seller._id, `${sale._id}:${n}:soon`, 'soon',
          `${left} kundan keyin to‘lov: ${label(sale)}. ${money(s.next.amount)}, ${s.next.dueDate}.`, sale._id);
      }
    }

    if (telegram && sale.customerChatId && sale.lastCustomerReminder !== today) {
      const msg = customerReminder(sale, s, today);
      if (msg && await tg.send(sale.customerChatId, msg)) {
        await db.collection('sales').updateOne({ _id: sale._id }, { $set: { lastCustomerReminder: today } });
      }
    }
  }

  if (telegram && seller.telegramChatId && seller.lastDigest !== today) {
    const text = sellerDigest(seller, digest);
    if (text && await tg.send(seller.telegramChatId, text)) {
      await db.collection('sellers').updateOne({ _id: seller._id }, { $set: { lastDigest: today } });
    }
  }
  return digest;
}

function customerReminder(sale, s, today) {
  const dev = tg.esc(`${sale.device.brand} ${sale.device.model}`);
  if (s.overdueCount && [1, 3, 7, 14, 30].includes(s.lateDays)) {
    return `⚠️ <b>To‘lov kechikdi</b>\n${dev} uchun ${s.lateDays} kun kechikdingiz.\nQarz: <b>${money(s.overdueAmount)}</b>\nIltimos, sotuvchiga murojaat qiling.`;
  }
  if (!s.overdueCount && s.next) {
    const left = daysBetween(today, s.next.dueDate);
    if (left === 0) return `🔔 <b>Bugun to‘lov kuni</b>\n${dev}, ${s.next.n}-oy: <b>${money(s.next.amount)}</b>\nQolgan umumiy qarz: ${money(s.remaining)}`;
    if (left === 3) return `📅 3 kundan keyin to‘lov: <b>${money(s.next.amount)}</b> (${s.next.dueDate})\n${dev}, ${s.next.n}-oy.`;
  }
  return null;
}

function sellerDigest(seller, d) {
  if (!d.today.length && !d.overdue.length && !d.soon.length) return null;
  const line = ({ sale, s }) => `• ${tg.esc(sale.customer.fullName)} (${tg.esc(sale.customer.phone)}) — ${tg.esc(sale.device.model)}, ${money(s.next.amount)}`;
  const parts = [`📒 <b>${tg.esc(seller.shopName)}</b> — kunlik hisobot`];
  if (d.today.length) parts.push(`\n🔔 <b>Bugun to‘lashi kerak (${d.today.length})</b>\n${d.today.slice(0, 15).map(line).join('\n')}`);
  if (d.overdue.length) {
    parts.push(`\n⚠️ <b>Kechikkanlar (${d.overdue.length})</b>\n${d.overdue.slice(0, 15).map(({ sale, s }) =>
      `• ${tg.esc(sale.customer.fullName)} (${tg.esc(sale.customer.phone)}) — ${s.lateDays} kun, ${money(s.overdueAmount)}`).join('\n')}`);
  }
  if (d.soon.length) parts.push(`\n📅 <b>Yaqin 3 kunda (${d.soon.length})</b>\n${d.soon.slice(0, 15).map(line).join('\n')}`);
  return parts.join('\n');
}

async function runAll(db) {
  const sellers = await db.collection('sellers').find({}).toArray();
  let count = 0;
  for (const seller of sellers) { await processSeller(db, seller, { telegram: true }); count++; }
  return count;
}

module.exports = { processSeller, runAll, sellerDigest };
