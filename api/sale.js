const { appendRow } = require('../lib/sheets');
const { checkPassword } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!checkPassword(req)) {
    res.status(401).json({ error: '密碼錯誤或未登入' });
    return;
  }
  try {
    const { date, customer, item, qty, unit, price, payment } = req.body || {};
    if (!item) {
      res.status(400).json({ error: '請至少填品名' });
      return;
    }
    const qtyNum = Number(qty) || 0;
    const priceNum = Number(price) || 0;
    const total = qtyNum * priceNum;
    await appendRow('銷貨', [date || '', customer || '', item, qtyNum, unit || '', priceNum, total, payment || '']);
    res.status(200).json({ ok: true, total });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
};
