const { getRows } = require('../lib/sheets');
const { checkPassword } = require('../lib/auth');

const MAX_ROWS = 500;

function normDate(raw) {
  const m = String(raw || '').match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!m) return '';
  return m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
}

function toNum(v) {
  return Number(String(v == null ? '' : v).replace(/[,$\s]/g, '')) || 0;
}

function loadType(rows, type) {
  // 第一列是表頭，略過
  return rows.slice(1).map((r, i) => ({
    type,
    order: i,
    date: normDate(r[0]),
    party: r[1] || '',
    item: r[2] || '',
    qty: r[3] || '',
    unit: r[4] || '',
    price: r[5] || '',
    total: toNum(r[6]),
    payment: type === 'sale' ? r[7] || '' : '',
    extra: toNum(type === 'sale' ? r[8] : r[7]), // 其他金額欄：進貨在 H、銷貨在 I（銷貨的 H 是收款方式）
  })).filter(r => r.item || r.party || r.total);
}

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
    const { type = 'all', from = '', to = '', keyword = '' } = req.body || {};
    const kw = String(keyword).trim().toLowerCase();

    let list = [];
    if (type === 'all' || type === 'purchase') list = list.concat(loadType(await getRows('進貨'), 'purchase'));
    if (type === 'all' || type === 'sale') list = list.concat(loadType(await getRows('銷貨'), 'sale'));

    list = list.filter(r => {
      if (from && (!r.date || r.date < from)) return false;
      if (to && (!r.date || r.date > to)) return false;
      if (kw) {
        const hay = (r.party + ' ' + r.item + ' ' + r.payment).toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });

    // 日期新到舊，同一天內後輸入的在前
    list.sort((a, b) => (a.date === b.date ? b.order - a.order : a.date < b.date ? 1 : -1));

    const sum = t => list.filter(r => r.type === t).reduce((s, r) => s + r.total, 0);
    res.status(200).json({
      count: list.length,
      totalPurchase: sum('purchase'),
      totalSale: sum('sale'),
      truncated: list.length > MAX_ROWS,
      rows: list.slice(0, MAX_ROWS),
    });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
};
