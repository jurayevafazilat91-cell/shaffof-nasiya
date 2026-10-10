# Shaffof Nasiya

Telefon do‘konlari (masalan, Toshkentdagi Malika savdo majmuasi) uchun raqamli nasiya daftari.
Sotuvchi har bir nasiyani to‘liq kiritadi, to‘lovlarni qabul qiladi va statistikani ko‘radi.
Telegram bot har kuni to‘lov kuni kelgan va kechikkan mijozlarni eslatadi.
Mijoz esa shaxsiy sahifada nasiyaning **haqiqiy narxini** ko‘radi va shartlarni tushunib tasdiqlaydi
(«Moliyaviy savodxonlik» yo‘nalishi).

## Imkoniyatlar

- Sotuvchi hisobi: ro‘yxatdan o‘tish va kirish (parol bcrypt bilan, JWT token).
- Nasiya kartochkasi: mijozning F.I.Sh., ikki telefon raqami, pasporti, manzili; telefon brendi, modeli, xotirasi, rangi, holati; IMEI 1 va IMEI 2 (15 xonali, Luhn nazorat raqami bilan tekshiriladi).
- Shartlar: naqd narx, ustama foizi yoki umumiy narx, boshlang‘ich to‘lov, muddat. Oylik to‘lov va jadval avtomatik tuziladi.
- To‘lov qabul qilish: qisman to‘lov ham bo‘ladi, summa eng eski oydan boshlab taqsimlanadi. Oxirgi to‘lovni bekor qilish mumkin.
- Panel: undirilishi kerak bo‘lgan summa, kechikkan qarz, oylik tushum, kutilayotgan foyda, 6 oylik grafik, top modellar, bugungi va kechikkan to‘lovlar.
- Savdolar ro‘yxati: ism, telefon yoki IMEI bo‘yicha qidiruv, filtrlar, Excel (CSV) eksport.
- Takroriy IMEI ogohlantirishi.
- Saytdagi xabarlar markazi (qo‘ng‘iroqcha belgisi har daqiqada yangilanadi).
- Telegram bot:
  - sotuvchiga har kuni 09:00 da hisobot (bugun, kechikkan, yaqin 3 kun);
  - mijozga to‘lovdan 3 kun oldin, to‘lov kuni va kechikkanda eslatma; to‘lov qabul qilinganda tasdiq;
  - buyruqlar: /bugun, /qarzdorlar, /statistika (sotuvchi), /qarzim (mijoz).
- Mijoz sahifasi `/#/m/<token>`: haqiqiy narx, jadval, «tushunib imzolash» testi.

## Texnologiyalar

- Frontend: HTML, CSS, JavaScript (ES modules), build kerak emas — `public/` papkasi.
- Backend: Node.js, Vercel Serverless Functions — `api/` va `lib/` papkalari.
- Baza: MongoDB Atlas (`mongodb` drayveri).
- Bot: Telegram Bot API (webhook).
- Eslatmalar: Vercel Cron (har kuni 04:00 UTC = 09:00 Toshkent).

## Papka tuzilmasi

```
public/              sayt (index.html, css/app.css, js/...)
  js/app.js          router va ilova qobig‘i
  js/pages/*.js      sahifalar: landing, auth, dashboard (panel), stats, sales, new-sale, sale, notifications, settings, public
api/index.js         barcha /api/* so‘rovlari (vercel.json rewrite orqali)
api/telegram.js      Telegram webhook
api/cron.js          kunlik eslatmalar
lib/routes.js        API mantiqi
lib/util.js          sana, IMEI, to‘lov jadvali hisob-kitobi
lib/reminders.js     eslatmalar va kunlik hisobot
lib/bot.js           bot buyruqlari
lib/db.js            MongoDB ulanishi
```

## API

| Metod | Yo‘l | Vazifa |
|---|---|---|
| POST | /api/auth/register | Ro‘yxatdan o‘tish |
| POST | /api/auth/login | Kirish |
| GET/PATCH | /api/me | Profil |
| GET | /api/stats | Panel statistikasi |
| GET/POST | /api/sales | Ro‘yxat (q, filter) / yangi nasiya |
| GET/PATCH/DELETE | /api/sales/:id | Bitta savdo |
| POST | /api/sales/:id/pay | To‘lov qabul qilish |
| POST | /api/sales/:id/undo | Oxirgi to‘lovni bekor qilish |
| GET | /api/notifications | Xabarlar |
| POST | /api/notifications/read | O‘qildi deb belgilash |
| GET | /api/public/:token | Mijoz sahifasi |
| POST | /api/public/:token/confirm | Tushunib imzolash |
| POST | /api/telegram | Telegram webhook |
| GET | /api/cron | Kunlik eslatmalar |

## O‘zgaruvchilar

`.env.example` faylida izohlari bilan: `MONGODB_URI`, `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, `CRON_SECRET`.

## Kompyuterda ishga tushirish

```
npm install
npx vercel dev
```
`.env` o‘rniga `npx vercel env pull .env.local` bilan Vercel’dagi o‘zgaruvchilarni yuklab olish mumkin.

## Cheklovlar va keyingi bosqich

- Cron Vercel’ning bepul tarifida kuniga bir marta ishlaydi (vaqt bir soat ichida farq qilishi mumkin).
- Mijozga eslatma faqat u botga havola yoki QR orqali kirganidan keyin boradi (Telegram botlar raqam bo‘yicha o‘zi yoza olmaydi). Keyingi bosqich — SMS eslatmalar.
- Pasport va telefon raqamlari shaxsiy ma’lumot: haqiqiy ishga tushirishdan oldin O‘zbekistonning «Shaxsga doir ma’lumotlar to‘g‘risida»gi qonun talablarini o‘rganish kerak.
