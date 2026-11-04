const { getRows } = require('../lib/sheets');
const { checkPassword } = require('../lib/auth');

const LIMIT = 200;
const RECENT_ROWS = 80; // 最近這幾筆有用到的，排在前面
const JUNK = /測試|範例|可刪除/; // 試算表裡留下的測試資料不要出現在選單

// 取出某一欄（略過表頭、空白、測試資料），順序＝輸入的先後
const col = (rows, c) =>
  rows.slice(1).map(r => String((r && r[c]) || '').trim()).filter(v => v && !JUNK.test(v));

// 排序：最近有用到的優先 → 整體用得多的 → 最後用到的
function rank(lists) {
  const stat = new Map();
  lists.forEach(names => {
    const n = names.length;
    names.forEach((name, i) => {
      const s = stat.get(name) || { count: 0, recent: 0, last: -1 };
      s.count++;
      if (i >= n - RECENT_ROWS) s.recent++;
      s.last = Math.max(s.last, i / n);
      stat.set(name, s);
    });
  });
  return [...stat.entries()]
    .sort((a, b) => b[1].recent - a[1].recent || b[1].count - a[1].count || b[1].last - a[1].last)
    .map(e => e[0])
    .slice(0, LIMIT);
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
    const [pur, sale] = await Promise.all([getRows('進貨'), getRows('銷貨')]);
    res.status(200).json({
      suppliers: rank([col(pur, 1)]),
      items: rank([col(pur, 2), col(sale, 2)]),
    });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
};
