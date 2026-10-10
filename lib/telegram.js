// Telegram Bot API bilan ishlash
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function send(chatId, text, extra = {}) {
  const tokenStr = process.env.TELEGRAM_BOT_TOKEN;
  if (!tokenStr || !chatId) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${tokenStr}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra }),
    });
    return r.ok;
  } catch { return false; }
}

const botUsername = () => (process.env.TELEGRAM_BOT_USERNAME || '').replace(/^@/, '');
const botLink = (payload) => (botUsername() ? `https://t.me/${botUsername()}?start=${payload}` : null);

module.exports = { send, esc, botUsername, botLink };
