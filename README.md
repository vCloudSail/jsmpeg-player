# jsmpeg-player

## 介绍
本组件是基于[jsmpeg.js](https://github.com/phoboslab/jsmpeg)二次开发的vue组件

- web播放实时视频流的几种方案对比，详见[此处](https://blog.csdn.net/a843334549/article/details/117319350)
- 本方案详细介绍：[在Web中低时延播放RTSP视频流（海康、大华）方案 - JSMpeg.js](https://blog.csdn.net/a843334549/article/details/120697574)
- jsmpeg.js相关链接：[gitee](https://gitee.com/mirrors/jsmpeg)、[github](https://github.com/phoboslab/jsmpeg)、[官网](https://jsmpeg.com/)
- 关于延迟问题，仅在局域网\本机下实测1s左右，在公网下未知，公网要考虑的东西太多(带宽、丢包、流量)，公网下的流媒体服务框架这里推荐[ZLMediaKit](https://github.com/ZLMediaKit/ZLMediaKit)
- jsmpeg采用软解码方式，对客户端硬件有一定的性能要求
- 在使用vue开发环境时，可能会产生内存溢出的错误，应该是由于频繁热更新导致的，刷新页面即可
- 存在性能瓶颈，本组件可能不适用于大型项目
- 交流QQ群：56370082（请备注来源）
  
### 支持的格式
- 视频：mpeg1
- 音频：mp2

### 组件仓库/npm地址
- [giee](https://gitee.com/vCloudsail/jsmpeg-player)
- [github](https://github.com/vCloudSail/jsmpeg-player)
- [npm](https://www.npmjs.com/package/vue-jsmpeg-player?activeTab=readme)

## 方案架构

**rtsp流 => ffmpeg转码 => http server接收 => websocket server转发 => websocket client => 客户端软解码渲染**

![在这里插入图片描述](https://img-blog.csdnimg.cn/2a11509af2b64ee08608518017a7bfad.png)

ffmpeg推流命令示例：
```shell
ffmpeg ^
-rtsp_transport tcp -i rtsp://[用户名]:[密码]@[ip]:554/h264/ch1/main/av_stream -q 0 ^
-f mpegts ^
-codec:v mpeg1video -s 1920x1080 -b:v 1500k ^
-codec:a mp2 -ar 44100 -ac 1 -b:a 128k ^
http://127.0.0.1:8890/jsmpeg
```

PS: 
- 如果是公网，需要自行解决拉取摄像头rtsp流
- 本组件仅实现了前端（客户端）部分的功能，需自行实现后端部分的功能

## 安装教程
本组件使用了element-ui部分组件（后续有空了考虑剔除）以及ES6+语法，要求如下：
- element-ui>2.15.1
- vue>2.6.1
- core-js>3(如果不安装，编译会报错)

```javascript
npm i core-js@3 element-ui@2 vue@2 -S

npm i vue-jsmpeg-player -S
```

**全局组件**
```javascript
// main.js
import Vue from 'vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

import JSMpegPlayer from 'vue-jsmpeg-player';
import 'vue-jsmpeg-player/dist/jsmpeg-player.css';

Vue.use(ElementUI)
Vue.use(JSMpegPlayer)

// 或者

import { JsmpegPlayer } from 'vue-jsmpeg-player';
import 'vue-jsmpeg-player/dist/jsmpeg-player.css';

Vue.component(JsmpegPlayer.name, JsmpegPlayer)
```

**局部组件**
```javascript
import { JsmpegPlayer } from 'vue-jsmpeg-player';
import 'vue-jsmpeg-player/dist/jsmpeg-player.css';

export default {
  ...

  components: { JsmpegPlayer },

  ...
}

```

**使用**
```javascript
<template>
  <div>
    <jsmpeg-player :url="url" />
  </div>
</template>

<script>

export default {
  components: {},

  data() {
    return {
      url: "ws://localhost:8089/xxx",
    }
  },
  computed: {
  },

  mounted() {
  },
  beforeDestroy() {
  },
  methods: {}
}
</script>

<style lang="scss">
</style>

```

## 使用说明

### 属性 & Props：

| 名称           | 类型    | 说明                                                                         |
| -------------- | ------- | ---------------------------------------------------------------------------- |
| url            | string  | 视频流地址(推荐websocket，实际上jsmpeg.js原生也支持http方式，但没有经过测试) |
| title          | string  | 播放器标题                                                                   |
| no-signal-text | string  | 无信号时的显示文本                                                           |
| options        | object  | jsmpeg原生选项，直接透传，详见下表                                           |
| closeable      | boolean | 是否可关闭（单击关闭按钮，仅抛出事件）                                       |
| in-background  | boolean | 是否处于后台，如el-tabs的切换，路由的切换等，支持.sync修饰符                 |
| show-duration  | boolean | 是否现实持续播放时间                                                         |
| default-mute   | boolean | 默认静音                                                                     |
| with-toolbar   | boolean | 是否需要工具栏                                                               |
| loading-text   | boolean | 加载时的文本，默认为：拼命加载中                                          |

**原生属性：**

| 名称                  | 类型              | 说明                                                                                                                                   |
| --------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| canvas                | HTMLCanvasElement | 用于视频渲染的HTML Canvas元素。如果没有给出，渲染器将创建自己的Canvas元素。                                                            |
| loop                  | boolean           | 是否循环播放视频(仅静态文件)，默认=true                                                                                                |
| autoplay              | boolean           | 是否立即开始播放（仅限静态文件），默认=false                                                                                           |
| audio                 | boolean           | 是否解码音频，默认=true                                                                                                                |
| video                 | boolean           | 是否解码视频，默认=true                                                                                                                |
| poster                | string            | 预览图像的URL，用来在视频播放之前作为海报显示。                                                                                        |
| pauseWhenHidden       | boolean           | 当页面处于非活动状态时是否暂停播放，默认=true（请注意，浏览器通常会在非活动选项卡中限制 JS）                                           |
| disableGl             | boolean           | 是否禁用WebGL，始终使用Canvas2D渲染器，默认=false                                                                                      |
| disableWebAssembly    | boolean           | 是否禁用WebAssembly并始终使用JavaScript解码器，默认=false(不建议设置为true)                                                            |
| preserveDrawingBuffer | boolean           | WebGL上下文是否创建必要的“截图”                                                                                                        |
| progressive           | boolean           | 是否以块的形式加载数据(仅静态文件)。当启用时，回放可以在完整加载源之前开始。                                                           |
| throttled             | boolean           | 当不需要回放时是否推迟加载块。默认=progressive                                                                                         |
| chunkSize             | number            | 使用时，以字节为单位加载的块大小。默认(1 mb)1024*1024                                                                                  |
| decodeFirstFrame      | boolean           | 是否解码并显示视频的第一帧，一般用于设置画布大小以及使用初始帧作为"poster"图像。当使用自动播放或流媒体资源时，此参数不受影响。默认true |
| maxAudioLag           | number            | 流媒体时，以秒为单位的最大排队音频长度（可以理解为能接受的最大音画不同步时间）。                                                       |
| videoBufferSize       | number            | 流媒体时，视频解码缓冲区的字节大小。默认的512 * 1024 (512 kb)。对于非常高的比特率，您可能需要增加此值。                                |
| audioBufferSize       | number            | 流媒体时，音频解码缓冲区的字节大小。默认的128 * 1024 (128 kb)。对于非常高的比特率，您可能需要增加此值。                                |

###  事件 & Emits：

支持jsmpeg.js所有原生事件，并转换为短横线命名法，[jsmpeg官方文档 - 事件](https://github.com/phoboslab/jsmpeg#usage)

| 名称               | 原生回调名称            | 参数                     | 说明                                                                                             |
| ------------------ | ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| **vue组件事件**    | -                       | -                        | -                                                                                                |
| volume-change      | -                       | number                   | 当音量变化时触发                                                                                 |
| muted              | -                       | number                   | 当静音时触发                                                                                     |
| **原生事件**       |                         | -                        | -                                                                                                |
| video-decode       | [onVideoDecode]()       | decoder, time            | 视频帧解码事件，当成功解码视频帧时触发                                                           |
| audio-decode       | [onAudioDecode]()       | decoder, time            | 音频帧解码事件，当成功解码音频帧时触发                                                           |
| play               | [onPlay]()              | player                   | 播放开始事件                                                                                     |
| pause              | [onPause]()             | player                   | 播放暂停事件                                                                                     |
| ended              | [onEnded]()             | player                   | 播放结束事件                                                                                     |
| stalled            | [onStalled]()           | player                   | 播放停滞事件，当没有足够的数据播放一帧时触发                                                     |
| source-established | [onSourceEstablished]() | source                   | 源通道建立事件，当source第一次收到数据包时触发                                                   |
| source-completed   | [onSourceCompleted]()   | source                   | 源播放完成事件，当source收到所有数据时触发（即最后一个数据包）                                   |
| **扩展事件**       |                         | -                        | -                                                                                                |
| source-connected   | -                       | -                        | 源连接事件（仅websocket），当source(websocket)连接上服务端时触发                                 |
| source-interrupt   | -                       | -                        | 源传输中断事件（仅websocket），当source(websocket)超过一定时间（5s）没有收到流时触发             |
| source-continue    | -                       | -                        | 源传输恢复/继续事件（仅websocket），当onSourceStreamInterrupt触发后websocket第一次接收到流时触发 |
| source-closed      | -                       | -                        | 源关闭事件（仅websocket），当websocket关闭后触发                                                 |
| resolution-decode  | -                       | decoder, {width, height} | 分辨率解码事件，当获取到视频分辨率时触发发                                                       |

### 插槽 & Slot:
| 名称      | 参数 | 说明                                             |
| --------- | ---- | ------------------------------------------------ |
| title     | 无   | 标题插槽，使用此插槽后title属性失效              |
| loading   | 无   | loading插槽，可自定义加载效果         |
| no-signal | 无   | 无信号时的插槽，使用此插槽后noSignalText属性失效 |

### 功能 & 计划

- [x] 自动重连
- [x] 接流中断loading
- [x] 截图
- [x] 录制
- [x] 画面旋转
- [x] 全屏切换
- [x] 全屏切换
- [x] 事件总线
- [ ] 多播放器同屏显示
- [ ] 国际化
- [ ] 剔除element-ui的依赖，自行实现部分组件
- [ ] 画中画显示(原生只支持video元素画中画显示，目前还没想到方案)
- [x] 已知的性能问题(在data中定义了player，导致被双向绑定)


## 效果演示

- 无信号时：

![在这里插入图片描述](https://img-blog.csdnimg.cn/cae1fbb2d8c74193b834651a767dad02.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5LqR5biGUGxhbg==,size_20,color_FFFFFF,t_70,g_se,x_16)

- 正常播放：

![在这里插入图片描述](https://img-blog.csdnimg.cn/fe266d7592754a1fa174419694e4fd95.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5LqR5biGUGxhbg==,size_20,color_FFFFFF,t_70,g_se,x_16)

- 旋转画面：
  
![在这里插入图片描述](https://img-blog.csdnimg.cn/692e974957394a79a76f336ee5e82c56.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5LqR5biGUGxhbg==,size_20,color_FFFFFF,t_70,g_se,x_16)

- 接流中断：
  
![在这里插入图片描述](https://img-blog.csdnimg.cn/0c5a6646236440f4a863654b09f28389.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5LqR5biGUGxhbg==,size_20,color_FFFFFF,t_70,g_se,x_16)

- 截图测试：
  
![在这里插入图片描述](https://img-blog.csdnimg.cn/cc9ad53dcd3b4dd8bd69dd2b9c2c247f.gif)

- 录制测试：
  
![在这里插入图片描述](https://img-blog.csdnimg.cn/d95d0987763546fbb4a5a4107b919f50.gif)

## 运行DEMO

1. 拉取git仓库
2. 运行cmd: npm i
3. 运行cmd: npm run dev:full
4. 会分别弹出两个命令行窗口，一个是ffmpeg转码，一个是中转服务器

ffmpeg拉取桌面流见此文章：https://waitwut.info/blog/2013/06/09/desktop-streaming-with-ffmpeg-for-lower-latency/

![在这里插入图片描述](https://img-blog.csdnimg.cn/f977c4e6f0434e03a0eb8ea287b55e23.png)

## 参与贡献
1. Fork 本仓库
2. 新建 Feat_xxx 分支
3. 提交代码
4. 新建 Pull Request
