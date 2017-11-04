# access-stats (golang)

Get the stats from nginx's access log

## docker build

```
docker build -t vicanso/nginx-access-stats:go .
```

## docker env

- `ACCESS_FILE` the path of nginx's access log, default is '/logs/access.log'

- `INFLUX` the uri for influxdb server, default is 'http://127.0.0.1:8086'

- `USER` the user for influxdb

- `PASS` the password for influxdb

- `POOL` Poll for file changes instead of using inotify



## docker run

```
docker run -d --restart=always \
  -v /data/nginx/access.log:/logs/access.log \
  -e INFLUX=http://172.0.0.1:8086 \
  -e USER=user \
  -e PASS=password \
  vicanso/nginx-access-stats:go
``` 
