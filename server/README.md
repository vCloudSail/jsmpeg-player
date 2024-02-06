# JSMpeg-Server
## 介绍

本服务基于nodejs开发，参考原jsmpeg仓库[websocket-relay.js](https://github.com/phoboslab/jsmpeg/blob/master/websocket-relay.js)以及[node-rtsp-stream](https://github.com/kyriesent/node-rtsp-stream)仓库的代码，支持多通道多路推流
- 通过child_process库的spawn方法启动\管理ffmpeg命令行进程进行转码推流、接收推流数据
- 通过ws模块启动websocket服务，将流数据转发给各个客户端

**注意：本服务仅作为Demo服务使用，仅供参考，未经过正式测试，可能存在诸多BUG，不建议用于生产环境**

## 运行
安装依赖

(PS：如果安装ws模块后还是出现找不到ws模块的错误，请检查npm环境变量是否配置正确)
```
npm i ws -g
```


启动服务
```shell
node server/index.js <websocket-port>

# e.g.
node server/index.js 18082
```

## ~~HttpServer - 接流服务 (已废弃)~~

### URL (用于接收ffmpeg推流)

- http://[ip]:[websocket-port]/${channelName}

### 参数
- channelName（通道名称）：使用http第一子路径作为通道名称



## WebSocketServer - 转发服务

### URL

- ws://[ip]:[websocket-port]/${channelName}?${query}

注意：使用websocket第一个子路径作为通道名称，可带参数（仅使用第一次连接的客户端所带的参数，后续连接的客户端所带的参数无效）

### 参数
| 名称       | 类型   | 说明                                                                     |
| ---------- | ------ | ------------------------------------------------------------------------ |
| source     | string | 流媒体地址，目前仅支持rtsp流                                             |
| resolution | string | 输出分辨率，默认为1920*1080                                              |
| bitrate    | string | 输出码率，默认为1500k                                                    |
| timeout    | string | 接流超时时间(单位：秒)，表示多久未收到ffmpeg转发的数据重启进程，默认15秒 |
| maxClient  | number | 限制客户端个数，默认无限制                                               |

## 推流通道

推流通道的作用是把接收到的流数据转发给各个websocket客户端，存在以下逻辑

- 强制帧率为24fps，因为mpeg1/2不支持过低的帧率（原因自行百度，帧率过低会导致ffmpeg报错）
- 当第一个客户端接入时，创建推流通道，以此客户端传递的参数作为主参数
- 当最后一个客户端断开时
  - 倒计时30秒内无客户端连接，停止ffmpeg推流
  - 倒计时30秒内有客户端连接，清除定时器
- 当ffmpeg进程退出时，若还存在客户端，重启推流（一般是ffmpeg推流异常的情况才会退出）
- 当接收fmpeg推流数据超时，重启ffmpeg推流进程(一般是ffmpeg推流异常卡死，但又没有退出)
- 当ffmpeg推流通道连接但不存在此通道时，将被强制中断


### 推流流程
流媒体源=>ffmpeg转码=>websocket server推流=>websocket client接流(jsmpeg客户端)


### 桌面流通道
本服务内置了桌面流通道，路径为/desktop

注意：
1. 如果传了source参数，则以source作为原始流
2. 由于ffmpeg推桌面流时是无法指定哪个屏幕的，只能指定分辨率，默认拉取分辨率为1920x1080，如果你是2k屏幕，参数resolution传2k屏幕大小

**.e.g:** ws://127.0.0.1:{websocket-port}/desktop


### 支持的流媒体源
- rtmp流
- rtsp流
- m3u8流(http/https)：用苹果的[测试源](http://devimages.apple.com.edgekey.net/streaming/examples/bipbop_4x3/gear2/prog_index.m3u8)做了测试，效果不稳定，不推荐使用

## 测试源

**更新时间：2023年10月16日16:32:38**

通过以下文章收录
- https://www.cnblogs.com/dong1/p/9575335.html
- https://blog.csdn.net/Jason_HD/article/details/130158072

### rtsp
- ~~rtsp://184.72.239.149/vod/mp4:BigBuckBunny_175k.mov~~   (不可用)
- 大熊兔（VOD）：
  - 最新地址可参考：https://www.wowza.com/developer/rtsp-stream-test
  - rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4
  - ~~rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4~~   (不可用)

### rtmp（2019.04更新）
- ~~香港卫视: rtmp://live.hkstv.hk.lxdns.com/live/hks~~ (不可用)
- 香港财经: rtmp://202.69.69.180:443/webcast/bshdlive-pc（推荐，信号好不卡顿）
- 韩国GoodTV: rtmp://mobliestream.c3tv.com:554/live/goodtv.sdp
- 韩国朝鲜日报: rtmp://live.chosun.gscdn.com/live/tvchosun1.stream
- 美国2: rtmp://media3.scctv.net/live/scctv_800
- 美国中文电视: rtmp://media3.sinovision.net:1935/live/livestream
- 湖南卫视: rtmp://58.200.131.2:1935/livetv/hunantv
- **伊拉克 Al Sharqiya 电视台: rtmp://ns8.indexforce.com/home/mystream**（可用）
  
### http（m3u8）
- 香港卫视：http://live.hkstv.hk.lxdns.com/live/hks/playlist.m3u8
- CCTV1高清：http://ivi.bupt.edu.cn/hls/cctv1hd.m3u8
- CCTV3高清：http://ivi.bupt.edu.cn/hls/cctv3hd.m3u8
- CCTV5高清：http://ivi.bupt.edu.cn/hls/cctv5hd.m3u8
- CCTV5+高清：http://ivi.bupt.edu.cn/hls/cctv5phd.m3u8
- CCTV6高清：http://ivi.bupt.edu.cn/hls/cctv6hd.m3u8
- **苹果提供的测试源，都可用：**
  + http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8
  + http://devimages.apple.com/iphone/samples/bipbop/gear3/prog_index.m3u8
  + https://devimages.apple.com.edgekey.net/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8
- 漳浦综合HD：http://220.161.87.62:8800/hls/0/index.m3u8
- 漳浦数字HD：http://220.161.87.62:8800/hls/1/index.m3u8