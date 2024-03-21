# jsmpeg-player

## 介绍

本组件是基于[jsmpeg.js](https://github.com/phoboslab/jsmpeg)二次开发的 vue2 组件（未来会支持 vue3）

- web 播放实时视频流的几种方案对比，详见[此处](https://blog.csdn.net/a843334549/article/details/117319350)
- 本方案详细介绍：[在 Web 中低时延播放 RTSP 视频流（海康、大华）方案 - JSMpeg.js](https://blog.csdn.net/a843334549/article/details/120697574)
- jsmpeg.js 相关链接：[gitee](https://gitee.com/mirrors/jsmpeg)、[github](https://github.com/phoboslab/jsmpeg)、[官网](https://jsmpeg.com/)
- **关于延迟问题**：仅在局域网\本机下实测 1s 左右，在公网下未知，公网要考虑的东西太多(带宽、丢包、流量)，公网下的流媒体服务框架这里推荐[ZLMediaKit](https://github.com/ZLMediaKit/ZLMediaKit)、[SRS](https://github.com/ossrs/srs)
- **关于性能问题**
  - **注意：本方案存在性能瓶颈，可能不适用于大型项目，对性能有追求的请使用开源流媒体框架 ZLMediaKit、SRS**
  - 由于是客户端软解码，所以性能不会太好，在目前的 i5 10 代+8g 这种配置机器上单个页面六路同屏应该是没问题的，再多就不行了，对性能有追求的只能用 webrtc 了，具体性能对比可见[jsmpeg 官网性能对比](https://jsmpeg.com/perf.html)
  - 在使用 vue 开发环境时，可能会产生内存溢出的错误，应该是由于频繁热更新导致的，刷新页面即可
- 交流 QQ 群：56370082（请备注来源）

### Note

`[v1.2.1]` 使用了 vite-plugin-libcss 插件打包，esm 方式引入（即 import）不需要再手动引入样式文件

`[v1.2.0]` jsmpeg.js 已迁移到独立仓库中，以 git 子模块的形式引入

- 初次拉取仓库时请使用 `git clone --recursive`
- 如果已经克隆了主仓库但没有克隆子模块，则使用 `git submodule update --init --recursive`

### 支持的格式

- 视频：mpeg1
- 音频：mp2

  **仅支持 mpeg1 格式视频、mp2 格式音频！！！仅支持 mpeg1 格式视频、mp2 格式音频！！！仅支持 mpeg1 格式视频、mp2 格式音频！！！不要随便拿个 websocket 流去给 jsmpeg 使用，播放不了的！！！也无法直接播放 rtmp 流！！！**

### 组件仓库/npm 地址

- [giee](https://gitee.com/vCloudsail/jsmpeg-player)
- [github](https://github.com/vCloudSail/jsmpeg-player)
- [npm](https://www.npmjs.com/package/vue-jsmpeg-player?activeTab=readme)

## 方案架构

**rtsp 流 => ffmpeg 转码 => ~~http server 接收~~(已废弃，直接通过命令行获取转码数据) => websocket server 转发 => websocket client => 客户端软解码渲染**

![在这里插入图片描述](https://img-blog.csdnimg.cn/2a11509af2b64ee08608518017a7bfad.png)

ffmpeg 推流命令示例：

```shell
ffmpeg ^
-rtsp_transport tcp -i rtsp://[用户名]:[密码]@[ip]:554/h264/ch1/main/av_stream -q 0 ^
-f mpegts ^
-codec:v mpeg1video -s 1920x1080 -b:v 1500k ^
-codec:a mp2 -ar 44100 -ac 1 -b:a 128k ^
http://127.0.0.1:8890/jsmpeg
```

PS:

- 如果是公网，需要自行解决拉取摄像头 rtsp 流
- 本组件仅实现了前端（客户端）部分的功能，后端部分的功能可参考 server 目录下的代码

## 安装教程

本组件使用了```ES6+```语法，要求如下：

- `vue > 2.6.0`
- `core-js > 3 ` (如果不安装，编译会报错)

```javascript
npm i core-js@3 vue@2 -S

npm i vue-jsmpeg-player -S
```

**全局组件**

```javascript
// main.js
import Vue from 'vue'

import JSMpegPlayer from 'vue-jsmpeg-player'
import 'vue-jsmpeg-player/style.css'

Vue.use(JSMpegPlayer)

// 或者

import { JSMpegPlayer, JSMpegMultipathPlayer } from 'vue-jsmpeg-player'
import 'vue-jsmpeg-player/style.css'

Vue.component(JSMpegPlayer.name, JSMpegPlayer)
Vue.component(JSMpegMultipathPlayer.name, JSMpegMultipathPlayer)
```

**局部组件**

```javascript
import { JSMpegPlayer, JSMpegMultipathPlayer } from 'vue-jsmpeg-player';
import 'vue-jsmpeg-player/style.css';

export default {
  ...

  components: {
    [JSMpegPlayer.name]: JSMpegPlayer,
    [JSMpegMultipathPlayer.name]: JSMpegMultipathPlayer
  },

  ...
}

```

**使用**

- 单路播放

```vue
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
      url: 'ws://localhost:8089/xxx'
    }
  },
  computed: {},

  mounted() {},
  beforeDestroy() {},
  methods: {}
}
</script>

<style lang="scss"></style>
```

- 多路播放

```vue
<template>
  <div>
    <jsmpeg-player.multipath v-model="players" />
  </div>
</template>

<script>
export default {
  components: {},

  data() {
    return {
      players: [
        {
          title: '桌面',
          url: 'ws://127.0.0.1:18081/desktop'
        }
      ]
    }
  },
  computed: {},

  mounted() {},
  beforeDestroy() {},
  methods: {}
}
</script>

<style lang="scss"></style>
```

## 使用说明

### JSMpegPlayer - 单路播放器

#### 属性 & Props

| 名称           | 类型    | 说明                                                                              |
| -------------- | ------- | --------------------------------------------------------------------------------- |
| url            | string  | 视频流地址(推荐 websocket，实际上 jsmpeg.js 原生也支持 http 方式，但没有经过测试) |
| title          | string  | 播放器标题                                                                        |
| no-signal-text | string  | 无信号时的显示文本                                                                |
| options        | object  | jsmpeg 原生选项，直接透传，详见下表                                               |
| closeable      | boolean | 是否可关闭（单击关闭按钮，仅抛出事件）                                            |
| in-background  | boolean | 是否处于后台，如 el-tabs 的切换，路由的切换等，支持.sync 修饰符                   |
| show-duration  | boolean | 是否显示持续播放时间                                                              |
| default-muted  | boolean | 默认静音                                                                          |
| with-toolbar   | boolean | 是否需要工具栏                                                                    |
| loading-text   | boolean | 加载时的文本，默认为：拼命加载中                                                  |

**原生属性：**

| 名称 | 类型 | 说明 |
| --- | --- | --- |
| canvas | HTMLCanvasElement | 用于视频渲染的 HTML Canvas 元素。如果没有给出，渲染器将创建自己的 Canvas 元素。 |
| loop | boolean | 是否循环播放视频(仅静态文件)，默认=true |
| autoplay | boolean | 是否立即开始播放（仅限静态文件），默认=false |
| audio | boolean | 是否解码音频，默认=true |
| video | boolean | 是否解码视频，默认=true |
| poster | string | 预览图像的 URL，用来在视频播放之前作为海报显示。 |
| pauseWhenHidden | boolean | 当页面处于非活动状态时是否暂停播放，默认=true（请注意，浏览器通常会在非活动选项卡中限制 JS） |
| disableGl | boolean | 是否禁用 WebGL，始终使用 Canvas2D 渲染器，默认=false |
| disableWebAssembly | boolean | 是否禁用 WebAssembly 并始终使用 JavaScript 解码器，默认=false(不建议设置为 true) |
| preserveDrawingBuffer | boolean | WebGL 上下文是否创建必要的“截图” |
| progressive | boolean | 是否以块的形式加载数据(仅静态文件)。当启用时，回放可以在完整加载源之前开始。 |
| throttled | boolean | 当不需要回放时是否推迟加载块。默认=progressive |
| chunkSize | number | 使用时，以字节为单位加载的块大小。默认(1 mb)1024\*1024 |
| decodeFirstFrame | boolean | 是否解码并显示视频的第一帧，一般用于设置画布大小以及使用初始帧作为"poster"图像。当使用自动播放或流媒体资源时，此参数不受影响。默认 true |
| maxAudioLag | number | 流媒体时，以秒为单位的最大排队音频长度（可以理解为能接受的最大音画不同步时间）。 |
| videoBufferSize | number | 流媒体时，视频解码缓冲区的字节大小。默认的 4 _ 1024 _ 1024 (4MB)。对于非常高的比特率，您可能需要增加此值。 |
| audioBufferSize | number | 流媒体时，音频解码缓冲区的字节大小。默认的 128 \* 1024 (128 kb)。对于非常高的比特率，您可能需要增加此值。 |

#### 事件 & Emits

支持 jsmpeg.js 所有原生事件，并转换为短横线命名法，[jsmpeg 官方文档 - 事件](https://github.com/phoboslab/jsmpeg#usage)

| 名称 | 原生回调名称 | 参数 | 说明 |
| --- | --- | --- | --- |
| **vue 组件事件** | - | - | - |
| volume-change | - | number | 当音量变化时触发 |
| muted | - | number | 当静音时触发 |
| **原生事件** |  | - | - |
| video-decode | [onVideoDecode]() | decoder, time | 视频帧解码事件，当成功解码视频帧时触发 |
| audio-decode | [onAudioDecode]() | decoder, time | 音频帧解码事件，当成功解码音频帧时触发 |
| play | [onPlay]() | player | 播放开始事件 |
| pause | [onPause]() | player | 播放暂停事件 |
| ended | [onEnded]() | player | 播放结束事件 |
| stalled | [onStalled]() | player | 播放停滞事件，当没有足够的数据播放一帧时触发 |
| source-established | [onSourceEstablished]() | source | 源通道建立事件，当 source 第一次收到数据包时触发 |
| source-completed | [onSourceCompleted]() | source | 源播放完成事件，当 source 收到所有数据时触发（即最后一个数据包） |
| **扩展事件** |  | - | - |
| source-connected | - | - | 源连接事件（仅 websocket），当 source(websocket)连接上服务端时触发 |
| source-interrupt | - | - | 源传输中断事件（仅 websocket），当 source(websocket)超过一定时间（5s）没有收到流时触发 |
| source-continue | - | - | 源传输恢复/继续事件（仅 websocket），当 onSourceStreamInterrupt 触发后 websocket 第一次接收到流时触发 |
| source-closed | - | - | 源关闭事件（仅 websocket），当 websocket 关闭后触发 |
| resolution-decode | - | decoder, {width, height} | 分辨率解码事件，当获取到视频分辨率时触发发 |

#### 插槽 & Slot

| 名称      | 参数 | 说明                                               |
| --------- | ---- | -------------------------------------------------- |
| title     | 无   | 标题插槽，使用此插槽后 title 属性失效              |
| loading   | 无   | loading 插槽，可自定义加载效果                     |
| no-signal | 无   | 无信号时的插槽，使用此插槽后 noSignalText 属性失效 |

#### 方法 & Method

| 名称                                   | 参数                                                      | 说明         |
| -------------------------------------- | --------------------------------------------------------- | ------------ |
| **原生方法**                           |                                                           |              |
| play()                                 | -                                                         | 播放         |
| pause()                                | -                                                         | 暂停播放     |
| stop()                                 | -                                                         | 停止播放     |
| nextFrame()                            | -                                                         | 下一帧       |
| **扩展方法**                           |                                                           | -            |
| rotate(angle: string, append: bollean) | angle:旋转角度，append:是否为追加角度（即当前角度+angle） | 旋转画面     |
| toggleFullscreen()                     |                                                           | 切换全屏模式 |
| snapshot()                             |                                                           | 截图         |
| toggleMute()                           |                                                           | 切换禁音模式 |
| toggleRecording()                      |                                                           | 切换录制模式 |

### JSMpegMultipathPlayer - 多路播放器

- [x] 多路播放
- [x] 支持拖拽交换播放器位置
- [x] 支持从外部拖入播放器
- [x] 支持多种分屏模式

#### 属性 & Props

| 名称          | 类型     | 说明                                                            |
| ------------- | -------- | --------------------------------------------------------------- |
| value/v-model | string[] | 播放链接列表                                                    |
| tabindex      | number   | 起始的 tabindex，给每个播放器加上 tabindex，方便按下 tab 键切换 |
| playerProps   | object   | 播放器选项，透传给单个播放器                                    |

#### 事件 & Emits

| 名称 | 参数 | 说明 |
| --- | --- | --- |
| player-click | {data:object,intance:Vue,index:number} | 点击播放器时触发 |
| player-noSignal | {data:object,intance:Vue,index:number} | loading 插槽，可自定义加载效果 |
| player-swap | {sourcePlayer:object,sourceIndex:number,targetPlayer:object,targetIndex:number} | 当两个播放器拖拽交换时触发 |

#### 插槽 & Slot

| 名称 | 参数 | 说明 |
| ---- | ---- | ---- |
| -    | -    | -    |

#### 从外部拖入一个播放器

要实现此功能，只需要在目标元素的 drag-out 事件中调用 dataTransfer.setData 方法即可

```js
function handleDragOut(ev) {
  let dt = ev.dataTransfer
  ev.dataTransfer.effectAllowed = 'copy'
  dt.setData(
    'text/plain',
    JSON.stringify({
      id: '', // 非必传
      title: '',
      url: ''
    })
  )
}
```

## 功能 & 计划

- [x] 自动重连
- [x] 接流中断 loading
- [x] 截图
- [x] 录制
- [x] 画面旋转
- [x] 全屏切换
- [x] 全屏切换
- [x] 事件总线
- [x] 多播放器同屏显示
- [ ] 国际化
- [ ] 移除 element-ui 的依赖
- [ ] 画中画显示(原生只支持 video 元素画中画显示，目前还没想到方案)
- [x] 已知的性能问题(在 data 中定义了 player，导致被双向绑定)
- [x] 构建升级到 vite
- [ ] 同时支持 vue2/vue3

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

## 服务端

参考[JSMpegServer 文档](./server/README.md)

关于 ffmpeg 拉取桌面流见此文章：https://waitwut.info/blog/2013/06/09/desktop-streaming-with-ffmpeg-for-lower-latency/

## 开发/运行 DEMO

1. 克隆仓库，`git clone --recursive https://github.com/vCloudSail/jsmpeg-player`
2. 安装依赖包，运行 cmd: npm i
3. 启动服务端，运行 cmd: npm run server (如果使用 vscode，建议通过 vscode 启动)
4. 启动 DEMO 客户端，运行 cmd: npm run dev
5. 查看 demo

![在这里插入图片描述](https://img-blog.csdnimg.cn/f977c4e6f0434e03a0eb8ea287b55e23.png)

## 参与贡献

1. Fork 本仓库
2. 新建 Feat_xxx 分支
3. 提交代码
4. 新建 Pull Request
