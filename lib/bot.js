// Telegram bot buyruqlari (webhook orqali keladi)
const tg = require('./telegram');
const { summarize, todayStr, money } = require('./util');
const { processSeller } = require('./reminders');

const HELP_SELLER = 'Buyruqlar:\n/bugun — bugungi to‘lovlar\n/qarzdorlar — kechikkan mijozlar\n/statistika — umumiy holat';
const HELP_CUSTOMER = 'Buyruqlar:\n/qarzim — qolgan qarz va keyingi to‘lov';

async function handleUpdate(db, update) {
  const msg = update.message || update.edited_message;
  if (!msg || !msg.text) return;
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const [cmd, arg = ''] = text.split(/\s+/, 2);
  const sellers = db.collection('sellers');
  const sales = db.collection('sales');

  if (cmd === '/start' && arg.startsWith('s_')) {
    const seller = await sellers.findOne({ linkCode: arg.slice(2) });
    if (!seller) return tg.send(chatId, 'Havola eskirgan. Saytdagi Sozlamalar sahifasidan yangi havola oling.');
    await sellers.updateOne({ _id: seller._id }, { $set: { telegramChatId: chatId } });
    return tg.send(chatId, `✅ <b>${tg.esc(seller.shopName)}</b> do‘koni ulandi!\nHar kuni ertalab to‘lov kuni kelgan va kechikkan mijozlar ro‘yxatini yuboraman.\n\n${HELP_SELLER}`);
  }

  if (cmd === '/start' && arg.startsWith('c_')) {
    const sale = await sales.findOne({ customerToken: arg.slice(2) });
    if (!sale) return tg.send(chatId, 'Havola topilmadi. Sotuvchidan yangi havola so‘rang.');
    await sales.updateOne({ _id: sale._id }, { $set: { customerChatId: chatId } });
    const s = summarize(sale);
    const seller = await sellers.findOne({ _id: sale.sellerId });
    if (seller?.telegramChatId) tg.send(seller.telegramChatId, `🔗 Mijoz botga ulandi: ${tg.esc(sale.customer.fullName)} — ${tg.esc(sale.device.model)}`);
    return tg.send(chatId, `Assalomu alaykum, ${tg.esc(sale.customer.fullName)}!\n<b>${tg.esc(sale.device.brand)} ${tg.esc(sale.device.model)}</b> uchun to‘lov eslatmalari yoqildi.\n\nUmumiy narx: ${money(sale.totalPrice)}\nQolgan qarz: <b>${money(s.remaining)}</b>\n${s.next ? `Keyingi to‘lov: ${money(s.next.amount)}, ${s.next.dueDate}` : 'Barcha to‘lovlar yopilgan 🎉'}\n\nTo‘lov kunidan 3 kun oldin va o‘sha kuni eslataman.\n${HELP_CUSTOMER}`);
  }

  const seller = await sellers.findOne({ telegramChatId: chatId });

  if (seller && (cmd === '/bugun' || cmd === '/qarzdorlar')) {
    const d = await processSeller(db, seller, { telegram: false });
    const list = cmd === '/bugun' ? d.today : d.overdue;
    if (!list.length) return tg.send(chatId, cmd === '/bugun' ? 'Bugun to‘lov kuni kelgan mijoz yo‘q ✅' : 'Kechikkan mijoz yo‘q ✅');
    const lines = list.slice(0, 30).map(({ sale, s }) => cmd === '/bugun'
      ? `• ${tg.esc(sale.customer.fullName)} (${tg.esc(sale.customer.phone)}) — ${money(s.next.amount)}`
      : `• ${tg.esc(sale.customer.fullName)} (${tg.esc(sale.customer.phone)}) — ${s.lateDays} kun, ${money(s.overdueAmount)}`);
    return tg.send(chatId, `<b>${cmd === '/bugun' ? 'Bugungi to‘lovlar' : 'Kechikkanlar'} (${list.length})</b>\n${lines.join('\n')}`);
  }

  if (seller && cmd === '/statistika') {
    const all = await sales.find({ sellerId: seller._id }).toArray();
    const today = todayStr();
    let remaining = 0, overdue = 0, active = 0;
    for (const sale of all) {
      const s = summarize(sale, today);
      if (s.status !== 'closed') { active++; remaining += s.remaining; overdue += s.overdueAmount; }
    }
    return tg.send(chatId, `📊 <b>${tg.esc(seller.shopName)}</b>\nFaol nasiyalar: ${active}\nUndirilishi kerak: ${money(remaining)}\nKechikkan qarz: ${money(overdue)}\nJami savdolar: ${all.length}`);
  }

  if (cmd === '/qarzim') {
    const mine = await sales.find({ customerChatId: chatId }).toArray();
    if (!mine.length) return tg.send(chatId, 'Sizga bog‘langan nasiya topilmadi.');
    return tg.send(chatId, mine.map((sale) => {
      const s = summarize(sale);
      return `<b>${tg.esc(sale.device.brand)} ${tg.esc(sale.device.model)}</b>\nQolgan qarz: ${money(s.remaining)}\n${s.next ? `Keyingi to‘lov: ${money(s.next.amount)}, ${s.next.dueDate}` : 'To‘liq yopilgan ✅'}`;
    }).join('\n\n'));
  }

  return tg.send(chatId, seller
    ? `Salom! ${HELP_SELLER}`
    : 'Salom! Bu Shaffof Nasiya boti. Sotuvchi bergan havola yoki QR-kod orqali kiring.\n' + HELP_CUSTOMER);
}

module.exports = { handleUpdate };
