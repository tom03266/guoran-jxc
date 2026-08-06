const { appendRow } = require('../lib/sheets');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { date, supplier, item, qty, unit, price } = req.body || {};
    if (!item) {
      res.status(400).json({ error: '請至少填品名' });
      return;
    }
    const qtyNum = Number(qty) || 0;
    const priceNum = Number(price) || 0;
    const total = qtyNum * priceNum;
    await appendRow('進貨', [date || '', supplier || '', item, qtyNum, unit || '', priceNum, total]);
    res.status(200).json({ ok: true, total });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
};
