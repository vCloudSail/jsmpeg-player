'use strict'

import TS from '../demuxer/ts'

export default class WSSource {
  timer = {
    heartbeat: null,
    streamInterrupt: null
  }
  reconnectInterval
  shouldAttemptReconnect
  progress = 0
  reconnectTimeoutId = 0
  reconnectCount = 0
  callbacks = { connect: [], data: [] }
  streaming = true
  completed = false
  established = false
  isPaused = false
  isStreamInterrupt = false
  /** @type {TS} */
  destination
  /** @type {WebSocket} */
  socket
  /** @type {string} */
  url
  /** @type {import('../../utils/event-bus').EventBus} */
  eventBus
  onEstablishedCallback
  onCompletedCallback
  onClosedCallback
  onStreamInterruptCallback
  onConnectedCallback
  onStreamTimeoutFirstReceiveCallback
  /**
   *
   * @param {string} url
   * @param {import('../../types').PlayerOptions} options
   */
  constructor(url, options) {
    this.url = url
    this.options = options

    this.reconnectInterval =
      options.reconnectInterval !== undefined ? options.reconnectInterval : 5
    this.shouldAttemptReconnect = !!this.reconnectInterval

    this.eventBus = options.eventBus
    this.onEstablishedCallback = options.onSourceEstablished
    this.onCompletedCallback = options.onSourceCompleted // Never used
    this.onClosedCallback = options.onSourceClosed
    this.onConnectedCallback = options.onSourceConnected
    this.onStreamInterruptCallback = options.onSourceStreamInterrupt
    this.onStreamContinueCallback = options.onSourceStreamContinue
  }

  connect(destination) {
    this.destination = destination
  }

  changeUrl(url = '') {
    clearTimeout(this.timer.streamInterrupt)

    if (typeof url === 'string' && url !== '') {
      if (this.url !== url) {
        this.destroy()
        this.url = url
        this.start()
      }
    } else {
      this.destroy()
      this.url = ''
    }
  }

  reload() {
    this.destroy()
    this.start()
  }

  destroy() {
    clearTimeout(this.reconnectTimeoutId)
    this.reconnectTimeoutId = 0
    this.shouldAttemptReconnect = false
    this.socket?.close()
    if (this.socket) {
      this.socket.onmessage = null
      this.socket.onopen = null
      this.socket.onerror = null
      this.socket.onclose = null
      this.socket.onmessage = null
      this.socket = null
    }
  }

  start() {
    this.reconnectTimeoutId = 0
    this.reconnectCount = 0
    this.shouldAttemptReconnect = !!this.reconnectInterval
    this.progress = 0
    this.established = false
    this.isPaused = false

    this.wsConnect()
  }

  wsConnect() {
    if (!this.url) return
    // 连java的websocket时，第二个参数要么传值，要么不传值，不能传null，否则会一直出现连接失败的问题
    try {
      this.socket = new WebSocket(this.url, this.options?.protocols)
      this.socket.binaryType = 'arraybuffer'
      this.socket.onmessage = this.onMessage.bind(this)
      this.socket.onopen = this.onOpen.bind(this)
      this.socket.onerror = this.onError.bind(this)
      this.socket.onclose = this.onClose.bind(this)
    } catch (error) {
      console.error('websocket connect error: ', error)
    }
  }

  pause() {
    if (!this.isPaused) {
      clearTimeout(this.timer.streamInterrupt)
      this.isPaused = true
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.onmessage = null
      }
    }
    //  if (this.reconnectTimeoutId) {
    //   clearTimeout(this.reconnectTimeoutId)
    //   this.reconnectTimeoutId = null
    // }
  }

  continue() {
    // Nothing to do here
    if (this.isPaused) {
      this.isPaused = false
      if (this.socket == null) {
        this.start()
      } else if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.onmessage = this.onMessage.bind(this)
        this.startStreamTimeoutTimer()
      }
    }
  }

  onOpen() {
    this.progress = 1
    this.reconnectTimeoutId = 0
    this.reconnectCount = 0
    this.isOpened = true
    if (this.onConnectedCallback) {
      this.onConnectedCallback(this)
      this.eventBus?.emit('source-connected', this)
    }
    this.startStreamTimeoutTimer()
  }

  onError(err) {
    // console.error(err)
  }

  onClose() {
    this.established = false
    if (this.progress >= 1) {
      // progress>=1，表示已经建立连接后的断开
      this.progress = 0
      if (this.onClosedCallback) {
        this.onClosedCallback(this)
        this.eventBus?.emit('source-closed', this)
      }
      clearTimeout(this.reconnectTimeoutId)
      this.reconnectTimeoutId = setTimeout(this.start.bind(this), 5000)
      return
    }

    if (this.shouldAttemptReconnect && this.reconnectCount < 10) {
      // 最多重连10次
      clearTimeout(this.reconnectTimeoutId)
      this.reconnectTimeoutId = setTimeout(
        this.wsConnect.bind(this),
        this.reconnectInterval * 1000
      )
      this.reconnectCount += 1
      console.log('websocket 重连次数： ', this.reconnectCount)
    }
  }

  /**
   *
   * @param {MessageEvent} ev
   */
  onMessage(ev) {
    this.startStreamTimeoutTimer()
    try {
      if (!this.established) {
        this.established = true
        this.isStreamInterrupt = false
        this.onEstablishedCallback?.(this)
        this.eventBus?.emit('source-established', this)
        console.log(ev)
      } else if (this.isStreamInterrupt) {
        this.isStreamInterrupt = false
        this.onStreamContinueCallback?.(this)
        this.eventBus?.emit('source-continue', this)
      }

      if (this.destination) {
        this.destination.write(ev.data)
      }
    } catch (error) {
      if (error.message?.indexOf('memory access out of bounds') > -1) {
        this.reload()
      } else {
        console.error(error)
      }
    }
    if (this.recorder) {
      try {
        this.recorder.write?.(ev.data)
      } catch (error) {
        this.recorder = null
      }
    }
  }

  startStreamTimeoutTimer() {
    if (this.timer.streamInterrupt) {
      clearTimeout(this.timer.streamInterrupt)
    }
    this.timer.streamInterrupt = setTimeout(() => {
      console.warn('[JSMpeg]: 等待视频流超时')
      this.timer.streamInterrupt = null
      this.isStreamInterrupt = true
      if (this.onStreamInterruptCallback) {
        this.onStreamInterruptCallback()
        this.eventBus?.emit('source-interrupt', this)
      }
    }, 5000)
  }
}
