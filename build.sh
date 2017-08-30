GOOS=linux go build

docker build -t vicanso/nginx-access-stats:go .

rm ./nginx-access-stats