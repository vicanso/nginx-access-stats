const {
  Tail,
} = require('tail');
const Influx = require('influxdb-nodejs');

const client = new Influx(process.env.INFLUX || 'http://127.0.0.1:8086/telegraf');

const analyse = require('./lib/analyse');

const accessFile = process.env.ACCESS_FILE || '/logs/access.log';
const tail = new Tail(accessFile, {
  logger: console,
  useWatchFile: true,
});

tail.on('line', (data) => {
  const result = analyse(data);
  if (!result || result.url === '/favicon.ico') {
    return;
  }
  const tagKyes = 'method type spdy'.split(' ');
  const tags = {};
  const fields = {};
  Object.keys(result).forEach((key) => {
    if (tagKyes.includes(key)) {
      tags[key] = result[key];
    } else {
      fields[key] = result[key];
    }
  });
  if (fields.via) {
    const app = fields.via.split(' ').pop();
    tags.app = app;
  }
  client.write('nginx_access')
    .tag(tags)
    .field(fields)
    .queue();
  if (client.writeQueueLength > 100) {
    client.syncWrite()
      .then(() => console.info('sync write queue success'))
      .catch(err => console.error(`sync write queue fail, ${err.message}`));
  }
});

tail.on('error', err => console.error(`tail error, ${err.message}`));
