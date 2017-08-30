package main

import (
	"github.com/hpcloud/tail"
	"github.com/influxdata/influxdb/client/v2"
	"log"
	"os"
	"strconv"
	"strings"
	"time"
)

// get the spdy tag
func getSpdy(time float64) string {
	if time < 100 {
		return "0"
	}
	if time < 300 {
		return "1"
	}
	if time < 1000 {
		return "2"
	}
	if time < 3000 {
		return "3"
	}
	return "4"
}

func analyse(str string) *client.Point {
	arr := strings.SplitN(strings.TrimSpace(str), "\"", -1)

	limitLength := 14
	result := make([]string, 0, limitLength*2)
	for index, item := range arr {
		trimItem := strings.TrimSpace(item)
		if len(trimItem) == 0 {
			continue
		}
		if index == 5 {
			result = append(result, trimItem)
		} else {
			tmpArr := strings.SplitN(trimItem, " ", -1)
			result = append(result, tmpArr...)
		}
	}

	if len(result) != limitLength {
		return nil
	}

	status, _ := strconv.ParseInt(result[8], 10, 32)
	responseTime, _ := strconv.ParseFloat(result[10], 64)
	requestTime, _ := strconv.ParseFloat(result[11], 64)
	bytes, _ := strconv.ParseInt(result[9], 10, 32)

	fields := map[string]interface{}{
		"ip":           result[2],
		"track":        result[3],
		"responseId":   result[4],
		"url":          result[6],
		"status":       status,
		"bytes":        bytes,
		"responseTime": responseTime,
		"requestTime":  requestTime,
		"referrer":     result[12],
		"via":          result[13],
	}
	tags := map[string]string{
		"method": result[5],
		"type":   result[8][0:1],
		"spdy":   getSpdy(requestTime),
	}
	pt, err := client.NewPoint("nginx_access", tags, fields, time.Now())
	if err != nil {
		log.Println(err)
	}
	return pt
}

func main() {
	logPath := os.Getenv("ACCESS_FILE")
	if len(logPath) == 0 {
		logPath = "/logs/access.log"
	}
	file, err := os.Stat(logPath)
	database := "telegraf"
	batchSize := 50
	if err != nil {
		log.Panic(err)
	}
	influxServer := os.Getenv("INFLUX")
	if len(influxServer) == 0 {
		influxServer = "http://127.0.0.1:8086"
	}
	c, err := client.NewHTTPClient(client.HTTPConfig{
		Addr:     influxServer,
		Username: os.Getenv("USER"),
		Password: os.Getenv("PASS"),
	})
	if err != nil {
		log.Panic(err)
	}
	_, _, err = c.Ping(time.Second * 5)
	if err != nil {
		log.Panic(err)
	}
	// Get the seek info (the tail of file)
	seekInfo := tail.SeekInfo{
		Offset: file.Size(),
	}
	t, err := tail.TailFile(logPath, tail.Config{
		Follow:   true,
		// 在mac环境下使用docker挂载文件，需要使用pull才能获取文件写入
		// Poll:     true,
		Location: &seekInfo,
	})
	if err != nil {
		log.Panic(err)
	}
	// Create a new point batch
	bp, err := client.NewBatchPoints(client.BatchPointsConfig{
		Database: database,
	})
	if err != nil {
		log.Panic(err)
	}
	count := 0
	for line := range t.Lines {
		pt := analyse(line.Text)
		if pt == nil {
			continue
		}
		if bp == nil {
			bp, err = client.NewBatchPoints(client.BatchPointsConfig{
				Database: database,
			})
			// create point batch fail, contine
			if err != nil {
				log.Println(err)
				continue
			}
		}
		count++
		bp.AddPoint(pt)
		log.Println(count)
		if count >= batchSize {
			if err := c.Write(bp); err != nil {
				log.Println(err)
			}
			count = 0
			bp = nil
		}
	}
}
