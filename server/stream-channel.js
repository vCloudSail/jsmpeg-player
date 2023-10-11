const { exec, ChildProcess, spawn } = require('child_process')
const WebSocket = require('ws')

class StreamChannel {
  /** 通道名称 */
  /** @type {'running'|'starting'|'stoping'|'stoped'} */
  status = 'stop'
  name = ''
  /** 流媒体源地址 */
  source = ''
  /** @type {ChildProcess} */
  ffmpeProcess = null

  /** @type {Array<WebSocket>} */
  clients = []
  /** @type {http.IncomingMessage} */
  incomingMessage = null
  serverOptions = {}
  ffmpegOptions = {
    outputResolution: '1920x1080',
    outputRate: '1500K'
  }
  timers = {
    /** 丢失最后一个客户端 */
    lostLastClient: null,
    /** 丢失推流端 */
    lostStreamClient: null,
    /** */
    notReceivedFromStream: null
  }
  constructor({
    name,
    source,
    resolution,
    rate,
    maxClient,
    serverOptions
  } = {}) {
    this.name = name
    this.source = source
    this.ffmpegOptions.outputRate = rate || '1500K'
    this.ffmpegOptions.outputResolution = resolution || '1920x1080'
    this.serverOptions = serverOptions

    if (this.name === 'desktop' || this.source) {
      this.start()
    }
  }
  async broadcast(data) {
    try {
      for (let client of this.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data)
        } else {
          this.removeClient(client)
        }
      }
    } catch (error) {
      this.log('广播数据失败')
    }
    // if (this.recording) {
    //   this.recording.write(data)
    // }
  }
  /**
   *
   * @param {import('http').IncomingMessage} request
   */
  acceptIncomingMessage(request) {
    this.log('启动ffmpeg推流进程成功，开始推流')
    this.status = 'running'
    this.incomingMessage = request
    this.incomingMessage.on('data', (data) => {
      this.broadcast(data)
      if (this.timers.notReceivedFromStream) {
        clearTimeout(this.timers.notReceivedFromStream)
        this.timers.notReceivedFromStream = null
      }
      this.timers.notReceivedFromStream = setTimeout(() => {
        this.#onStreamInterrupt()
      }, 10 * 1000)
    })
    this.incomingMessage.on('end', () => {
      this.incomingMessage = null
      this.log(`推流端断开连接`)
      // if (request.socket.recording) {
      //   request.socket.recording.close()
      // }
    })
  }
  /**
   * 添加客户端
   * @param {WebSocket} client
   */
  addClient(client) {
    if (this.clients.includes(client)) {
      return
    }
    if (this.timers.lostLastClient) {
      this.log('新客户端接入，清除自动停止推流定时器')
      clearTimeout(this.timers.lostLastClient)
      this.timers.lostLastClient = null
    }
    this.clients.push(client)
    client.on('close', () => {
      this.removeClient(client)
    })
    if (this.status !== 'running' && !this.ffmpeProcess) {
      this.start()
    }
  }
  /**
   * 移除客户端
   * @param {WebSocket} client
   */
  removeClient(client) {
    const index = this.clients.indexOf(client)
    if (index > -1) {
      this.clients.splice(index, 1)
    }

    if (this.clients.length === 0) {
      // 当最后一个客户端连接断开后30秒内无任何客户端接入时，停止推流
      this.log('最后一个客户端连接断开，倒计时30秒内无任何客户端接入将停止推流')
      this.timers.lostLastClient = setTimeout(this.#onLastClientLost, 30 * 1000)
    }
  }
  restart() {
    if (this.status === 'running' && this.ffmpeProcess) {
      this.ffmpeProcess.on('exit', (code) => {
        this.start()
      })

      this.stop()
    } else {
      this.status = 'stoped'
      this.start()
    }
  }
  log(msg) {
    msg && console.log(`通道[${this.name}]`, msg)
  }
  start() {
    if (this.status === 'running' || this.status === 'starting') {
      return
    }
    try {
      this.status = 'starting'

      let source = ''

      if (this.name === 'desktop' && !this.source) {
        /**
         * -f参数说明
         * x11grab  指定输入格式为X11抓取
         * gdigrab
         */
        /**
         * 获取真实分辨率
         * -s $(xdpyinfo | grep dimensions | awk '{print $2;}')
         */
        /**
         * 捕获桌面流参考链接
         * - https://www.bilibili.com/read/cv20197318/
         * - https://zhuanlan.zhihu.com/p/455572544#h_455572544_20
         */
        source = '-f gdigrab -draw_mouse 1 -i desktop'
      } else if (/^rtsp[:]/.test(this.source)) {
        source = `-rtsp_transport tcp -i ${this.source}`
      }

      if (!source) {
        this.log('无法识别流媒体源类型，不启动ffmpeg推流 -> ' + this.source)
        return
      }

      this.log('启动ffmpeg推流进程 -> ' + source)
      this.ffmpeProcess = spawn(`ffmpeg`, [
        ...source.split(' '),
        '-q',
        '0',
        '-f',
        'mpegts',
        '-codec:v',
        'mpeg1video',
        '-s',
        this.ffmpegOptions.outputResolution || '1920x1080',
        '-b:v',
        this.ffmpegOptions.outputRate || '1500k',
        '-codec:a',
        'mp2',
        '-ar',
        '44100',
        '-ac',
        '1',
        '-b:a',
        '128k',
        `http://127.0.0.1:${this.serverOptions.streamPort}/${this.name}`
      ])
      this.ffmpeProcess.on('error', (err) => {
        // this.ffmpeProcess.disconnect()
        // this.ffmpeProcess = null
        // this.start()
        // this.status = 'stoped'
        this.log('ffmpeg推流进程出错 -> ' + err)
      })
      this.ffmpeProcess.on('exit', (code, signal) => {
        if (this.timers.notReceivedFromStream) {
          clearTimeout(this.timers.notReceivedFromStream)
          this.timers.notReceivedFromStream = null
        }
        this.log(
          `ffmpeg推流进程关闭 -> code: ${code} signal: ${signal}` //  error: ${this.ffmpeProcess.stderr.read()}
        )
        this.status = 'stoped'
        this.ffmpeProcess = null
        if (this.clients.length > 0) {
          // 还有客户端，表示异常退出，重新启动
          this.start()
        }
      })
    } catch (error) {
      this.status = 'stoped'
    }
  }
  stop() {
    if (!this.ffmpeProcess) {
      return
    }

    this.log('开始停止ffmpeg推流进程')
    this.status = 'stoping'
    this.ffmpeProcess?.kill(1000)
  }
  #onStreamInterrupt() {
    this.log('超过10秒未收到推流端数据，重启ffmpeg进程')
    this.timers.notReceivedFromStream = null
    this.stop()
  }
  #onLastClientLost() {
    this.timers.lostLastClient = null
    this.stop()
  }
}

// export default StreamChannel
module.exports = StreamChannel
