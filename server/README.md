# JSMpeg-Server
## 介绍

本服务基于nodejs开发，参考原jsmpeg仓库[websocket-relay.js](https://github.com/phoboslab/jsmpeg/blob/master/websocket-relay.js)的代码，支持多通道多路推流
- 通过child_process库的span方法启动\管理ffmpeg命令行进程进行转码推流
- 通过ws模块启动websocket服务
- 通过http模块启动http接流服务
- 以websocket、http的子路径作为推流通道名称

**注意：本服务仅作为Demo服务使用，仅供参考，未经过正式测试，可能存在诸多BUG，不建议用于生产环境**

## 运行
安装依赖

(PS：如果安装ws模块后还是出现找不到ws模块的错误，请检查环境变量是否配置正确)
```
npm i ws -g
```


启动服务
```shell
node server/index.js <stream-port> <websocket-port>

# e.g.
node server/index.js 18081 18082
```

## Http接流服务

URL(用于ffmpeg推流): http://127.0.0.1:{stream-port}/{通道名称}

### 参数
- channelName（通道名称）：使用http第一子路径作为通道名称

## WebSocket服务

URL: ws://127.0.0.1:{websocket-port}/{通道名称}

注意：使用websocket第一个子路径作为通道名称，可带参数（仅使用第一次连接的客户端所带的参数，后续连接的客户端所带的参数无效）
### 参数
| 名称       | 类型   | 说明                         |
| ---------- | ------ | ---------------------------- |
| source     | string | 流媒体地址，目前仅支持rtsp流 |
| resolution | string | 输出分辨率，默认为1920*1080  |
| rate       | string | 输出码率，默认为1500k        |

## 推流通道


推流通道的作用是把http-server某个通道收到的流数据转发给各个websocket客户端，存在以下逻辑

- 当第一个客户端接入时，创建推流通道，以此客户端传递的参数作为主参数
- 当最后一个客户端断开时
  - 倒计时30秒内无客户端连接，停止ffmpeg推流
  - 倒计时30秒内有客户端连接，清除定时器
- 当ffmpeg进程退出时，若还存在客户端，重启推流（一般是ffmpeg推流异常的情况才会退出）
- 当超过10秒未收到ffmpeg推流数据时，重启ffmpeg推流进程(一般是ffmpeg推流异常卡死，但又没有退出)
- 当ffmpeg推流通道连接时不存在此通道的话，将被强制中断


推流流程如下：

流媒体源=>ffmpeg转码推送=>http server接流=>websocket server推流=>websocket client接流(jsmpeg客户端)


