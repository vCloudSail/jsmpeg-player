export interface ServerOptions {
  streamPort: number
  websocketPort: number
  recordStream: boolean
}

export interface StreamChannelOptions {
  name: string
  source: string
  maxClient: number
  timeout: number
  ffmpegOptions: {
    resolution: string
    bitrate: string
  }
  serverOptions: ServerOptions
}
