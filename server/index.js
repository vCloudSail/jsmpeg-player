// Use the websocket-relay to serve a raw MPEG-TS over WebSockets. You can use
// ffmpeg to feed the relay. ffmpeg -> websocket-relay -> browser
// Example:
// node websocket-relay yoursecret 8081 8082
// ffmpeg -i <some input> -f mpegts http://localhost:8081/yoursecret

const fs = require('fs'),
  http = require('http'),
  WebSocket = require('ws'),
  os = require('os')
const StreamChannel = require('./stream-channel')

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

// Websocket Server
const socketServer = new WebSocket.Server({
  port: options.websocketPort,
  perMessageDeflate: false
})
socketServer.connectionCount = 0
socketServer.on('connection', function (socket, request) {
  socketServer.connectionCount++

  const url = new URL(request.url, request.headers.origin)

  const pathArr = url.pathname.split('/')
  const channelName = pathArr[1]

  console.log(
    `Websocket客户端接入(${channelName}): \n`,
    (request || socket.request).socket.remoteAddress,
    (request || socket.request).headers['user-agent'],
    '(' + socketServer.connectionCount + ' total)\n'
  )
  if (!channelName) {
    console.log('Websocket客户端未指定通道名称，强制关闭连接')
    return socket.close()
  }

  if (streamChannelMap.has(channelName)) {
    streamChannelMap.get(channelName).addClient(socket)
  } else {
    const params = {}
    url.searchParams.forEach((value, key) => {
      params[key] = value
    })
    const channel = new StreamChannel({
      name: channelName,
      source: url.searchParams.get('source'),
      timeout: url.searchParams.get('timeout'),
      maxClient: url.searchParams.get('maxClient'),
      ffmpegOptions: {
        resolution: url.searchParams.get('resolution'),
        bitrate: url.searchParams.get('bitrate')
      },
      serverOptions: options
    })
    channel.addClient(socket)

    streamChannelMap.set(channelName, channel)
  }

  socket.on('close', function (code, message) {
    socketServer.connectionCount--
    console.log(`Websocket客户端接断开(${channelName})`)
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

  console.log(
    `推流端接入(${channelName}): ` +
      request.socket.remoteAddress +
      ':' +
      request.socket.remotePort +
      '\n'
  )
  if (!streamChannelMap.has(channelName)) {
    // console.log(
    //   `推流端被强制终止(${request.socket.remoteAddress}:${request.socket.remotePort}) - 不存在此通道[${channelName}].\n`
    // )
    // response.end()
    return
  }

  streamChannelMap.get(channelName).acceptIncomingMessage(request)

  response.connection.setTimeout(0)
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

const ipList = []
const networkInterfaces = os.networkInterfaces()
Object.entries(networkInterfaces).forEach((value) => {
  const ip = value[1].find((item) => item.family === 'IPv4')
  ipList.push(ip.address)
})

console.log(
  `Http Server(ffmpeg 推流地址): \r\n  ${ipList
    .map((ip) => `http://${ip}:${options.streamPort}/{channelName}`)
    .join('\r\n  ')}`
)
console.log(
  `WebSocket Server(jsmpeg客户端连接地址): \r\n  ${ipList
    .map(
      (ip) =>
        `ws://${ip}:${options.streamPort}/{channelName}?source={sourceUrl}`
    )
    .join('\r\n  ')}`
)

streamServer.headersTimeout = 0
streamServer.listen(options.streamPort)
