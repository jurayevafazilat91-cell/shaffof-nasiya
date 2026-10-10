// Xabarlar markazi
import { api } from '../api.js';
import { $, esc, icon, ago } from '../ui.js';

const TYPE = { today: ['bell', 'n-today', 'Bugun'], overdue: ['alert', 'n-overdue', 'Kechikkan'], soon: ['clock', 'n-soon', 'Yaqinlashmoqda'] };

export default async function notificationsPage(el, _p, ctx, id) {
  const r = await api('GET', 'notifications');
  if (!ctx.isCurrent(id)) return;
  el.innerHTML = `
  <div class="page narrow">
    <header class="ph"><div><h1>Xabarlar</h1><p class="muted">${r.unread ? `${r.unread} ta o‘qilmagan` : 'Hammasi o‘qilgan'}</p></div>
      ${r.unread ? '<button class="btn ghost" id="all" type="button">Hammasini o‘qildi deb belgilash</button>' : ''}</header>
    ${r.items.length ? `<ul class="notes">${r.items.map((n) => {
      const [ic, cls, label] = TYPE[n.type] || ['bell', '', ''];
      return `<li class="${n.read ? '' : 'unread'}"><a href="${n.saleId ? `#/savdo/${n.saleId}` : '#/xabarlar'}" data-id="${n.id}">
        <span class="n-ic ${cls}">${icon(ic)}</span>
        <div><p>${esc(n.text)}</p><small>${label} · ${ago(n.createdAt)}</small></div>
      </a></li>`;
    }).join('')}</ul>` : `<div class="empty">${icon('bell')}<h3>Xabarlar yo‘q</h3><p>To‘lov kuni yaqinlashganda yoki kechikkanda shu yerda ko‘rasiz.</p></div>`}
  </div>`;
  $('#all', el)?.addEventListener('click', async () => { await api('POST', 'notifications/read', { all: true }); ctx.refreshBell(); ctx.go('#/xabarlar'); });
  el.querySelectorAll('[data-id]').forEach((a) => a.addEventListener('click', () => { api('POST', 'notifications/read', { ids: [a.dataset.id] }).then(ctx.refreshBell).catch(() => {}); }));
}
