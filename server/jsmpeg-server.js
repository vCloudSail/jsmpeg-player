// Use the websocket-relay to serve a raw MPEG-TS over WebSockets. You can use
// ffmpeg to feed the relay. ffmpeg -> websocket-relay -> browser
// Example:
// node websocket-relay yoursecret 8081 8082
// ffmpeg -i <some input> -f mpegts http://localhost:8081/yoursecret

const { exec, ChildProcess } = require('child_process')
const fs = require('fs'),
  http = require('http'),
  WebSocket = require('ws'),
  os = require('os')

if (process.argv.length < 2) {
  console.log(
    'Usage: \n' + 'node jsmpeg-server.js [<stream-port> <websocket-port>]'
  )
  process.exit()
}

const options = {
  streamPort: process.argv[2] || 18081,
  websocketPort: process.argv[3] || 18082,
  recordStream: false
}

/** @type {Map<string,StreamChannel>} */
const streamChannelMap = new Map()

class StreamChannel {
  /** 通道名称 */
  name = ''
  /** @type {'running'|'starting'|'stoping'|'stoped'} */
  status = 'stop'
  rtspUrl = ''
  /** @type {ChildProcess} */
  ffmpeProcess = null

  /** @type {Array<WebSocket>} */
  clients = []
  /** @type {http.IncomingMessage} */
  incomingMessage = null
  constructor(name, rtspUrl) {
    if (name !== 'desktop' && !rtspUrl) {
      throw new Error('[StreamChannel] 必须传入rtspUrl参数')
    }

    this.name = name
    this.rtspUrl = rtspUrl

    this.start()
  }
  /**
   *
   * @param {http.IncomingMessage} request
   */
  setIncomingMessage(request) {
    this.incomingMessage = request
    this.incomingMessage.on('data', (data) => {
      for (let client of this.clients) {
        try {
          client.send(data)
        } catch (error) {}
      }
      // socketServer.broadcast(data)
      // if (request.socket.recording) {
      //   request.socket.recording.write(data)
      // }
    })
    this.incomingMessage.on('end', function () {
      this.incomingMessage = null
      console.log('close')
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
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer)
      this.autoStopTimer = null
    }
    this.clients.push(client)
    if (this.status !== 'running') {
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
      this.autoStopTimer = setTimeout(() => {
        this.autoStopTimer = null
        this.stop()
      }, 30 * 1000)
    }
  }
  restart() {
    this.ffmpeProcess.on('exit', (code) => {
      this.start()
    })

    this.stop()
  }
  start() {
    if (this.status === 'running') {
      return
    }

    this.status = 'starting'
    this.ffmpeProcess = exec(
      `
echo off
%1 mshta vbscript:CreateObject("Shell.Application").ShellExecute("cmd.exe","/c %~s0 ::","","runas",1)(window.close)&&exit
ffmpeg ^
-f gdigrab -s 1920x1080 -i desktop -q 0 ^
-f mpegts ^
-codec:v mpeg1video -s 1920x1080 -b:v 1500k ^
-codec:a mp2 -ar 44100 -ac 1 -b:a 128k ^
http://127.0.0.1:${options.streamPort}/${this.name}`,
      (error, stdout, stderr) => {
        // 检查错误
        if (error) {
          console.error(`exec error: ${error}`)
          return
        }
        this.status = 'running'
        // 捕获输出
        console.log(`stdout: ${stdout}`)
        console.error(`stderr: ${stderr}`)
      }
    )
    this.ffmpeProcess.on('error', () => {
      this.ffmpeProcess.disconnect()
      this.ffmpeProcess = null
      this.start()
    })
    this.ffmpeProcess.on('exit', (code) => {
      // this.ffmpeProcess.disconnect()
      this.ffmpeProcess = null
      this.status = 'stoped'
    })
  }
  stop() {
    if (this.status !== 'running') {
      return
    }

    this.status = 'stoping'
    this.ffmpeProcess?.kill()
  }
}
// Websocket Server
const socketServer = new WebSocket.Server({
  port: options.websocketPort,
  perMessageDeflate: false
})
socketServer.connectionCount = 0
socketServer.on('connection', function (socket, request) {
  socketServer.connectionCount++

  console.log(
    'Websocket客户端接入: ',
    (request || socket.request).socket.remoteAddress,
    (request || socket.request).headers['user-agent'],
    '(' + socketServer.connectionCount + ' total)\n',
    request.url
  )
  const url = new URL(request.url, `http://${request.headers.host}`)
  debugger
  const channelName = request.url.split('/')?.[1]

  if (streamChannelMap.has(channelName)) {
    streamChannelMap.get(channelName).addClient(socket)
  } else {
    const channel = new StreamChannel(channelName, url.searchParams.get('rtsp'))
    channel.addClient(socket)

    streamChannelMap.set(channelName, channel)
  }

  socket.on('close', function (code, message) {
    socketServer.connectionCount--
    console.log(
      'Websocket客户端断开 (' + socketServer.connectionCount + ' total)\n'
    )
  })
})
socketServer.broadcast = function (data) {
  socketServer.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  })
}

// HTTP Server to accept incomming MPEG-TS Stream from ffmpeg
const streamServer = http.createServer(function (request, response) {
  const params = request.url.split('/')
  const channelName = params[1]

  if (!streamChannelMap.has(name)) {
    console.log(
      `推流端被强制终止: 
        request.socket.remoteAddress:request.socket.remotePort- 不存在此通道[name].\n`
    )
    response.end()
  }

  streamChannelMap.get(channelName).setStreamHttp(request)
  // if (params[0] !== options.STREAM_SECRET) {
  //   console.log(
  //     '推流端连接失败: ' +
  //       request.socket.remoteAddress +
  //       ':' +
  //       request.socket.remotePort +
  //       ' - wrong secret.\n'
  //   )
  //   response.end()
  // }

  response.connection.setTimeout(0)
  console.log(
    '推流端接入(ffmpeg): ' +
      request.socket.remoteAddress +
      ':' +
      request.socket.remotePort +
      '\n'
  )
  // request.on('data', function (data) {
  //   // socketServer.broadcast(data)
  //   if (request.socket.recording) {
  //     request.socket.recording.write(data)
  //   }
  // })
  // request.on('end', function () {
  //   console.log('close')
  //   if (request.socket.recording) {
  //     request.socket.recording.close()
  //   }
  // })

  // Record the stream to a local file?
  // if (options.recordStream) {
  //   const path = 'recordings/' + Date.now() + '.ts'
  //   request.socket.recording = fs.createWriteStream(path)
  // }
})
// Keep the socket open for streaming
streamServer.headersTimeout = 0
streamServer.listen(options.streamPort)

console.log(
  `Http Server(ffmpeg 推流地址): http://0.0.0.0:${options.streamPort}/{name}\n`,
  `WebSocket Server(jsmpeg客户端连接地址): ws://0.0.0.0:${options.websocketPort}/{name}?rtsp={rtspUrl}\n`
)
