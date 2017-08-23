const assert = require('assert');

const analyse = require('../lib/analyse');

describe('Limiter', () => {
  it('analyse success', () => {
    const nginxLog = '2017-08-22T12:08:13+00:00 - 113.111.11.129 H1NTpFSDZ - "GET /favicon.ico HTTP/1.1" 304 0 0.003 0.003 "http://jenny.f3322.net:9011/api/docs/setting.js.html" "1.0 nginx, 5.0 vx, 0.0.1 albi"  ';
    const result = analyse(nginxLog);

    assert.equal(result.ip, '113.111.11.129');
    assert.equal(result.url, '/api/users/me?cache-control=no-cache');
    assert.equal(result.method, 'GET');
    assert.equal(result.status, 200);
    assert.equal(result.type, '2');
    assert.equal(result.bytes, 152);
    assert.equal(result.requestTime, 0.004);
    assert.equal(result.responseTime, 0.004);
    assert.equal(result.spdy, '0');
    assert.equal(result.track, 'SkM1YPgXPZ');
    assert.equal(result.responseId, 'r1eUSix7v-');
    assert.equal(result.referrer, 'http://jenny.f3322.net:9011/');
    assert.equal(result.via, '1.0 nginx, 5.0 vx, 0.0.1 albi');
  });
});
