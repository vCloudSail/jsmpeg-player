<template>
  <div id="app">
    <div class="header">
      <el-row class="current-time">
        延迟测试：{{ currTime }}
        <el-button
          @click="toggleTimerStatus"
          style="margin-left: 10px"
        >
          {{ timer.running ? '暂停' : '继续' }}
        </el-button>
      </el-row>
    </div>
    <div class="main">
      <el-tabs
        v-model="activeTab"
        type="border-card"
        style="width: 100%"
      >
        <el-tab-pane
          name="sing"
          label="单路播放"
        >
          <el-row>
            websocket:
            <el-input
              v-model="tempUrl"
              style="width: 300px; margin-bottom: 12px"
            ></el-input>
            <el-button
              @click="url = tempUrl"
              style="margin-left: 10px"
            >
              连接
            </el-button>
            <el-button @click="url = tempUrl = demoUrl">重置</el-button>
          </el-row>
          <jsmpeg-player :url="url" />
        </el-tab-pane>
        <el-tab-pane
          name="mutli"
          label="多路播放"
          lazy
        >
          <jsmpeg-player.multipath v-model="players"> </jsmpeg-player.multipath>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import { formatTimestamp } from '@cloudsail/jsmpeg/utils'

const demoUrl = 'ws://localhost:18082/desktop?resolution=&bitrate=1000K'

class Timer {
  _startTime = null
  time = 0
  running = false
  start() {
    this._startTime = Date.now()
    this.running = true
    this.timer = setInterval(() => {
      this.time = Date.now() - this._startTime
    }, 5)
  }
  pause() {
    this.running = false
    this._pauseTime = Date.now()
    clearInterval(this.timer)
  }
  continue() {
    this.running = true
    this._startTime += Date.now() - this._pauseTime
    this._pauseTime = null
    this.timer = setInterval(() => {
      this.time = Date.now() - this._startTime
    }, 5)
  }
  stop() {
    this.running = false
    this._startTime = null
    this.time = 0
    clearInterval(this.timer)
  }
}

export default {
  name: 'App',
  components: {},

  // #region 数据相关
  data() {
    return {
      url: demoUrl,
      activeTab: 'sing',
      tempUrl: demoUrl,
      timer: new Timer(),
      players: [
        {
          id: 'deps',
          title: '桌面',
          url: demoUrl
        },
        {
          id: 'apple',
          title: '苹果测试流 (丢帧，17秒左右就卡顿)',
          url: "ws://localhost:18082/apple?source=http://devimages.apple.com/iphone/samples/bipbop/bipbopall.m3u8&bitrate=200K"
        },
        {
          id: '伊拉克',
          title: '伊拉克 Al Sharqiya 电视台',
          url: "ws://localhost:18082/ylk?source=rtmp://ns8.indexforce.com/home/mystream&bitrate=1M"
        },
        // {
        //   id: 'test1',
        //   title: 'test1',
        //   url: "ws://localhost:18082/test1?source=rtsp://admin:tsk1.com@111.198.72.247:8008/h264/ch33/sub/av_stream"
        // },
        // {
        //   id: 'test2',
        //   title: 'test2',
        //   url: "ws://localhost:18082/test2?source=rtsp://admin:tsk1.com@111.198.72.247:8008/h264/ch34/sub/av_stream"
        // }
      ]
    }
  },
  computed: {
    currTime() {
      return formatTimestamp(this.timer.time, true)
    },
    demoUrl() {
      return demoUrl
    }
  },
  // #endregion

  // #region 生命周期
  mounted() {
    this.timer.start()
  },
  beforeDestroy() {
    this.timer.stop()
  },
  // #endregion
  methods: {
    toggleTimerStatus() {
      if (this.timer.running) {
        return this.timer.pause()
      }
      this.timer.continue()
    }
  }
}
</script>

<style lang="scss">
body {
  padding: 0;
  margin: 0;
}
* {
  box-sizing: border-box;
}
#app {
  width: 100vw;
  height: 100vh;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;

  display: flex;
  flex-direction: column;

  .header {
    height: auto;
    padding: 10px;
    .current-time {
      margin-top: 10px;
      font-size: 20px;
      font-weight: bolder;
    }
  }
  .main {
    flex: 1;
    padding: 0 30px 30px;
    display: flex;
    overflow: hidden;
    .jsmpeg-player {
      width: auto;
    }
    .el-tabs__content {
      width: 100%;
      height: calc(100% - 39px);
      .el-tab-pane {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
    }
  }
}
</style>
