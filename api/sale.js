const { appendRow } = require('../lib/sheets');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { date, customer, item, qty, unit, price, payment } = req.body || {};
    if (!date || !item || !qty || !price || !payment) {
      res.status(400).json({ error: '欄位不齊全' });
      return;
    }
    const qtyNum = Number(qty);
    const priceNum = Number(price);
    const total = qtyNum * priceNum;
    await appendRow('銷貨', [date, customer || '', item, qtyNum, unit || '', priceNum, total, payment]);
    res.status(200).json({ ok: true, total });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
};
