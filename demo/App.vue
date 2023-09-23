<template>
  <div id="app">
    <div class="header">
      <el-row>
        websocket:
        <el-input
          v-model="tempUrl"
          style="width: 300px"
        ></el-input>
        <el-button
          @click="url = tempUrl"
          style="margin-left: 10px"
        >
          连接
        </el-button>
        <el-button @click="url = tempUrl = demoUrl">重置</el-button>
      </el-row>
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
    <div class="main"> <jsmpeg-player :url="url" /></div>
  </div>
</template>

<script>
import { formatTimestamp } from '@cloudsail/jsmpeg/utils'

const demoUrl = 'ws://localhost:18082/desktop?resolution=&rate=1000K'

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
      tempUrl: demoUrl,
      timer: new Timer()
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
    padding: 30px;
  }
}
</style>
