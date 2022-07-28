# jsmpeg-player

# 介绍
基于[jsmpeg.js](https://github.com/phoboslab/jsmpeg)二次开发的vue组件，欢迎各位一起维护

- web播放实时视频流的几种方案对比，详见[此处](https://blog.csdn.net/a843334549/article/details/117319350)
- 详细介绍：[在Web中低时延播放RTSP视频流（海康、大华）方案 - JSMpeg.js](https://blog.csdn.net/a843334549/article/details/120697574)
- jsmpeg.js项目地址：[gitee](https://gitee.com/mirrors/jsmpeg)、[github](https://github.com/phoboslab/jsmpeg)
- [jsmpeg官网](https://jsmpeg.com/)

# 软件架构

rtsp流=>ffmpeg转码=>http server接收=>websocket server转发=>websocket client

![在这里插入图片描述](https://img-blog.csdnimg.cn/2a11509af2b64ee08608518017a7bfad.png)

# 安装教程
本组件使用了element-ui部分组件和icon（后续有空了考虑剔除），要求element-ui>2.15.6，vue>2.6.14

```javascript
npm i vue-jsmpeg-player -S
```

**全局组件**
```javascript
// main.js
import Vue from 'vue'
import JSMpegPlayer from 'vue-jsmpeg-player'

Vue.use(JSMpegPlayer)

// 或者

import { JsmpegPlayer } from 'vue-jsmpeg-player'

Vue.component(JsmpegPlayer.name, JsmpegPlayer)
```

**局部组件**
```javascript
import { JsmpegPlayer } from 'vue-jsmpeg-player'

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

# 使用说明

## 属性 & Props：

| 名称 | 类型 | 说明 |
| -- | -- | -- |
| url | string | 视频流地址(推荐websocket，实际上jsmpeg.js原生也支持http方式，但没有经过测试)
| title| string | 播放器标题
| no-signal-text | string | 无信号时的显示文本
| options | object| jsmpeg原生选项，直接透传，详见下表
| closeable| boolean| 是否可关闭（单击关闭按钮，仅抛出事件）
| in-background | boolean| 是否处于后台，如el-tabs的切换，路由的切换等，支持.sync
| show-duration| boolean| 是否现实持续播放时间
| default-mute | boolean| 默认静音
| with-toolbar | boolean| 是否需要工具栏

**原生属性：**

| 名称 | 类型 | 说明 |
| -- | -- | -- |
| canvas | HTMLCanvasElement | 用于视频渲染的HTML Canvas元素。如果没有给出，渲染器将创建自己的Canvas元素。
| loop | boolean | 是否循环播放视频(仅静态文件)，默认=true
| autoplay | boolean | 是否立即开始播放（仅限静态文件），默认=false
| audio | boolean | 是否解码音频，默认=true
| video | boolean | 是否解码视频，默认=true
| poster | string | 预览图像的URL，用来在视频播放之前作为海报显示。
| pauseWhenHidden | boolean| 当页面处于非活动状态时是否暂停播放，默认=true（请注意，浏览器通常会在非活动选项卡中限制 JS）
| disableGl | boolean| 是否禁用WebGL，始终使用Canvas2D渲染器，默认=false
| disableWebAssembly | boolean | 是否禁用WebAssembly并始终使用JavaScript解码器，默认=false(不建议设置为true)
| preserveDrawingBuffer | boolean | WebGL上下文是否创建必要的“截图”
| progressive | boolean | 是否以块的形式加载数据(仅静态文件)。当启用时，回放可以在完整加载源之前开始。
| throttled | boolean | 当不需要回放时是否推迟加载块。默认=progressive
| chunkSize | number| 使用时，以字节为单位加载的块大小。默认(1 mb)1024*1024
| decodeFirstFrame | boolean | 是否解码并显示视频的第一帧，一般用于设置画布大小以及使用初始帧作为"poster"图像。当使用自动播放或流媒体资源时，此参数不受影响。默认true
| maxAudioLag  | number| 流媒体时，以秒为单位的最大排队音频长度（可以理解为能接受的最大音画不同步时间）。
| videoBufferSize | number| 流媒体时，视频解码缓冲区的字节大小。默认的512 * 1024 (512 kb)。对于非常高的比特率，您可能需要增加此值。
| audioBufferSize | number| 流媒体时，音频解码缓冲区的字节大小。默认的128 * 1024 (128 kb)。对于非常高的比特率，您可能需要增加此值。 

##  事件 & Emits：

支持jsmpeg.js所有原生事件，并转换为短横线命名法，[jsmpeg官方文档 - 事件](https://github.com/phoboslab/jsmpeg#usage)

| 名称 | 参数 | 说明 |
| -- | -- | -- |
| **以下是vue组件事件** | - | -
| volume-change | number | 当音量变化时触发
| muted | number | 当静音时触发
| **以下是原生事件** | - | -
| video-decode | - | onVideoDecode
| audio-decode | - | onAudioDecode
| play | - | onPlay
| pause | - | onPause
| ended | - | onEnded
| stalled | - | onStalled
| source-established | - | onSourceEstablished
| source-completed | - | onSourceCompleted
| **以下是扩展事件** | - | -
| source-connected | - | 当websocket连接上服务端时触发
| source-interrupt | - | 当websocket超过一定时间（5s）没有收到流时触发
| source-continue | - | 当onSourceStreamInterrupt触发后websocket第一次接收到流时触发
| source-closed | - | 当websocket关闭后触发
| resolution-decode | width, height | 当获取到视频分辨率后触发

## 插槽 & Slot:
| 名称 | 参数 | 说明 |
|--|--|--|
| title | 无 | 标题插槽，使用此插槽后title属性失效
| no-signal | 无 | 无信号时的插槽，使用此插槽后noSignalText属性失效

## 功能 & 计划
- [x] 自动重连
- [x] 接流中断loading
- [x] 截图
- [x] 录制
- [x] 画面旋转
- [x] 全屏切换
- [ ] 剔除element-ui的依赖，自行实现部分组件
- [ ] 画中画显示(原生只支持video元素画中画显示，目前还没想到方案)
- [ ] 已知的性能问题(在data中定义了player，导致被双向绑定)


## 效果演示

无信号时：

![在这里插入图片描述](https://img-blog.csdnimg.cn/cae1fbb2d8c74193b834651a767dad02.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5LqR5biGUGxhbg==,size_20,color_FFFFFF,t_70,g_se,x_16)

正常播放：

![在这里插入图片描述](https://img-blog.csdnimg.cn/fe266d7592754a1fa174419694e4fd95.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5LqR5biGUGxhbg==,size_20,color_FFFFFF,t_70,g_se,x_16)

旋转：

![在这里插入图片描述](https://img-blog.csdnimg.cn/692e974957394a79a76f336ee5e82c56.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5LqR5biGUGxhbg==,size_20,color_FFFFFF,t_70,g_se,x_16)

接流中断：

![在这里插入图片描述](https://img-blog.csdnimg.cn/0c5a6646236440f4a863654b09f28389.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5LqR5biGUGxhbg==,size_20,color_FFFFFF,t_70,g_se,x_16)

截图测试：

![在这里插入图片描述](https://img-blog.csdnimg.cn/cc9ad53dcd3b4dd8bd69dd2b9c2c247f.gif)

录制测试：

![在这里插入图片描述](https://img-blog.csdnimg.cn/d95d0987763546fbb4a5a4107b919f50.gif)

# 运行DEMO

1. 拉取git仓库
2. 运行cmd: npm i
3. 运行cmd: npm run dev:full
4. 会分别弹出两个命令行窗口，一个是ffmpeg转码，一个是中转服务器

![在这里插入图片描述](https://img-blog.csdnimg.cn/f977c4e6f0434e03a0eb8ea287b55e23.png)

# 参与贡献
1. Fork 本仓库
2. 新建 Feat_xxx 分支
3. 提交代码
4. 新建 Pull Request