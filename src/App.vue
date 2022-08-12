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
      <el-row class="current-time"> 延迟测试：{{ currTime }} </el-row>
    </div>
    <div class="main"> <jsmpeg-player :url="url" /></div>
  </div>
</template>

<script>
const demoUrl = 'ws://localhost:8891'

class Timer {
  _startTime = null
  time = 0
  start() {
    this._startTime = Date.now()
    this.timer = setInterval(() => {
      this.time = Date.now() - this._startTime
    }, 5)
  }
  stop() {
    this._startTime = null
    this.time = 0
    clearInterval(this.timer)
  }
}

/** 补零 */
export function prefixPadZero(num) {
  if (num < 10) {
    return '0' + num
  }
  return num
}

export function formatTime(mss) {
  let minutes = parseInt(mss / 1000),
    seconds = parseInt(minutes / 60),
    hours = parseInt(seconds / 60)

  if (minutes >= 60) {
    minutes %= 60
  }
  if (seconds >= 60) {
    seconds %= 60
  }
  if (hours >= 24) {
    hours %= 24
  }

  return `${prefixPadZero(hours)}:${prefixPadZero(seconds)}:${prefixPadZero(
    minutes
  )}.${mss % 1000}`
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
      return formatTime(this.timer.time)
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
  methods: {}
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
    padding: 60px;
  }
}
</style>
