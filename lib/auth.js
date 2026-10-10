// Sotuvchi autentifikatsiyasi: parol bcrypt bilan xeshlanadi, kirish JWT token orqali
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw Object.assign(new Error('JWT_SECRET sozlanmagan (kamida 16 belgi)'), { status: 500 });
  return s;
}

const hashPassword = (p) => bcrypt.hash(p, 10);
const checkPassword = (p, h) => bcrypt.compare(p, h);
const signToken = (sellerId) => jwt.sign({ sid: String(sellerId) }, secret(), { expiresIn: '30d' });

function readToken(req) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return null;
  try { return jwt.verify(t, secret()).sid; } catch { return null; }
}

module.exports = { hashPassword, checkPassword, signToken, readToken };
