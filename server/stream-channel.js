const { exec, ChildProcess, spawn } = require('child_process')
const WebSocket = require('ws')

const restartTime = 10000
/**

 */
class StreamChannel {
  /** 通道名称 */
  /** @type {'running'|'starting'|'stoping'|'stoped'} */
  status = 'stop'
  name = ''
  /** 流媒体源地址 */
  source = ''
  /** 最多连接多少客户端 */
  maxClient = 30
  /** 接流超时时间，默认30秒 */
  timeout = 30
  /** @type {ChildProcess} */
  ffmpeProcess = null

  /** @type {Array<WebSocket>} */
  clients = []
  /** @type {http.IncomingMessage} */
  incomingMessage = null
  serverOptions = {}
  ffmpegOptions = {
    outputResolution: '1920x1080',
    outputBitrate: '1500K'
  }
  timers = {
    /** 丢失最后一个客户端 */
    lostLastClient: null,
    /** 丢失推流端 */
    lostStreamClient: null,
    /** */
    notReceivedFromStream: null
  }
  /**
   *
   * @param {import('./type').StreamChannelOptions} options
   */
  constructor({ name, source = '', maxClient, timeout, ffmpegOptions, serverOptions } = {}) {
    this.name = name
    this.source = source?.trim() || ''
    this.timeout = timeout || 30
    this.maxClient = maxClient || -1
    this.ffmpegOptions.outputBitrate = ffmpegOptions?.bitrate || '1500K'
    this.ffmpegOptions.outputResolution = ffmpegOptions?.resolution || '1920x1080'
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
  // acceptIncomingMessage(request) {
  //   this.log('启动ffmpeg推流进程成功，开始推流')
  //   this.status = 'running'
  //   this.incomingMessage = request
  //   this.incomingMessage.on('data', (data) => {
  //     this.#onReceiveStreamData(data)
  //   })
  //   this.incomingMessage.on('end', () => {
  //     this.incomingMessage = null
  //     this.log(`推流端断开连接`)
  //     // if (request.socket.recording) {
  //     //   request.socket.recording.close()
  //     // }
  //   })
  // }
  /**
   * 添加客户端
   * @param {WebSocket} client
   */
  addClient(client) {
    if (this.clients.includes(client)) {
      return
    } else if (this.maxClient > 0 && this.clients.length > this.maxClient) {
      // 客户端超过限制，强制关闭连接
      client.close()
      return
    }

    if (this.timers?.lostLastClient) {
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
      this.timers.lostLastClient = setTimeout(() => {
        this.#onLastClientLost()
      }, 30 * 1000)
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
    msg && console.log(`${new Date().toLocaleString()} - 通道[${this.name}]`, msg)
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
        source = `-f gdigrab -s 1920x1080 -draw_mouse 1 -i desktop`
      } else if (/^rtsp[:]/.test(this.source)) {
        source = `-rtsp_transport tcp -i ${this.source}`
      } else if (/^rtmp[:]/.test(this.source)) {
        source = `-i ${this.source}`
      } else if (/^https?[:].*[.]m3u8$/.test(this.source)) {
        source = `-i ${this.source} -reset_timestamps 1`
      }

      if (!source) {
        this.log('无法识别流媒体源类型，不启动ffmpeg推流 -> ' + this.source)
        return
      }

      const options = [
        ...source.split(' '),
        '-r', // 强制24fps，因为mpeg1/2不支持过低的帧率
        '24',
        '-q',
        '0',
        '-f',
        'mpegts',
        '-codec:v', // 编码格式
        'mpeg1video',
        '-s',
        this.ffmpegOptions.outputResolution || '1920x1080', // 输出分辨率
        '-b:v',
        this.ffmpegOptions.outputBitrate || '1000k', // 视频码率
        '-codec:a', // 音频编码器
        'mp2',
        '-ar', // 音频采样率
        '44100',
        '-ac', // 音频通道
        '1',
        '-b:a', // 音频码率
        '128k',
        // `${this.name}.ts`
        // ,
        '-'
        // `http://127.0.0.1:${this.serverOptions.streamPort}/${this.name}`
      ]
      this.log('启动ffmpeg推流进程 -> ' + `ffmpeg ${options.join(' ')}`)
      this.ffmpeProcess = spawn(`ffmpeg`, options, {
        detached: false
      })
      this.log('启动ffmpeg推流进程成功，开始推流')
      this.ffmpeProcess.stdout.on('data', (data) => {
        this.#onReceiveStreamData(data)
      })
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
          `ffmpeg推流进程已退出 -> code: ${code} signal: ${signal}` //  error: ${this.ffmpeProcess.stderr.read()}
        )
        this.status = 'stoped'
        this.ffmpeProcess = null
        if (this.clients.length > 0) {
          // 还有客户端，表示异常退出，重新启动
          this.log(
            `ffmpeg推流进程异常关闭，${restartTime / 1000}秒后重启` //  error: ${this.ffmpeProcess.stderr.read()}
          )
          setTimeout(() => {
            this.start()
          }, restartTime)
        }
      })
    } catch (error) {
      this.status = 'stoped'
      console.error(error)
    }
  }
  stop() {
    if (!this.ffmpeProcess) {
      this.status = 'stoped'
      return
    }

    this.log('开始停止ffmpeg推流进程')
    this.status = 'stoping'
    try {
      this.ffmpeProcess?.kill()
    } catch (error) {
      console.error(error)
    }
  }
  #onReceiveStreamData(data) {
    this.broadcast(data)
    if (this.timers.notReceivedFromStream) {
      clearTimeout(this.timers.notReceivedFromStream)
      this.timers.notReceivedFromStream = null
    }
    this.timers.notReceivedFromStream = setTimeout(() => {
      this.#onStreamInterrupt()
    }, this.timeout * 1000)
  }
  #onStreamInterrupt() {
    this.log('接收ffmpeg推流数据超时，重启ffmpeg进程 -> ' + this.ffmpeProcess.stdout.read())
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
