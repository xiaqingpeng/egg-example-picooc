const { Service } = require('egg');
const path = require('node:path');
const fs = require('node:fs');

class NoticeService extends Service {
  list(query) {
    const dataPath = path.join(this.app.baseDir, 'app', 'data', 'notice.json');
    const raw = fs.readFileSync(dataPath, 'utf8');
    let items = [];
    try {
      items = JSON.parse(raw);
    } catch (e) {
      items = [];
    }

    let filtered = items;
    const title = query.noticeTitle;
    const type = query.noticeType;
    const status = query.status;

    if (title) {
      filtered = filtered.filter(x => String(x.noticeTitle || '').includes(String(title)));
    }
    if (type) {
      filtered = filtered.filter(x => String(x.noticeType) === String(type));
    }
    if (status) {
      filtered = filtered.filter(x => String(x.status) === String(status));
    }

    const pageNum = parseInt(query.pageNum || '1', 10);
    const pageSize = parseInt(query.pageSize || '10', 10);
    const total = filtered.length;
    const start = (pageNum - 1) * pageSize;
    const rows = filtered.slice(start, start + pageSize);

    return { code: 0, msg: '', rows, total };
  }
}

module.exports = NoticeService;
