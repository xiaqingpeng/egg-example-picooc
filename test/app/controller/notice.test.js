const { app } = require('egg-mock/bootstrap');

describe('GET /system/notice/list', () => {
  it('should return list with default paging', async () => {
    const res = await app.httpRequest()
      .get('/system/notice/list')
      .expect(200);
    const body = res.body;
    if (typeof body !== 'object') throw new Error('response not object');
    if (!('code' in body)) throw new Error('missing code');
    if (!('rows' in body)) throw new Error('missing rows');
    if (!Array.isArray(body.rows)) throw new Error('rows not array');
    if (!('total' in body)) throw new Error('missing total');
  });

  it('should filter by title', async () => {
    const res = await app.httpRequest()
      .get('/system/notice/list')
      .query({ noticeTitle: '系统' })
      .expect(200);
    const body = res.body;
    if (!Array.isArray(body.rows)) throw new Error('rows not array');
    body.rows.forEach(x => {
      if (!String(x.noticeTitle).includes('系统')) {
        throw new Error('filter failed');
      }
    });
  });
});
