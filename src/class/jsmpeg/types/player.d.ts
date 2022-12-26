export interface PlayerOptions {
  /** 容器元素或选择器字符串[必填] */
  contianer: HTMLElement | string
  /** 用于视频渲染的HTML画布元素。如果没有给出，渲染器将创建自己的Canvas元素。 */
  canvas?: HTMLCanvasElement
  /** 是否循环播放视频(仅静态文件)。默认true */
  autoplay?: boolean
  /** 是否解码音频。默认true */
  audio?: boolean
  /** 是否解码视频。默认true */
  video?: boolean
  /** 一个图像的URL，用来在视频播放之前作为海报显示。 */
  poster?: string
  /** 是否禁用后台播放，当TAB处于非活动状态时是否暂停播放。注意，浏览器通常会在非活动标签中限制JS。默认true */
  pauseWhenHidden?: boolean
  /** 是否禁用WebGL，始终使用Canvas2D渲染器。默认.false */
  disableGl?: boolean
  /** 是否禁用WebAssembly并始终使用JavaScript解码器。默认false */
  disableWebAssembly?: boolean
  /** WebGL上下文是否创建-必要的“截图”通过。默认false */
  preserveDrawingBuffer?: boolean
  /** 是否以块的形式加载数据(仅静态文件)。当启用时，回放可以在完整加载源之前开始 */
  progressive?: boolean
  /** 使用时，当不需要回放时是否推迟加载块。默认=progressive */
  throttled?: boolean
  /** 使用时，以字节为单位加载的块大小。默认(1 mb)1024*1024 */
  chunkSize?: number
  /** 是否解码并显示视频的第一帧。设置画布大小和使用框架作为“海报”图像很有用。这在使用或流源时没有影响。默认true */
  decodeFirstFrame?: boolean
  /** 流媒体时，以秒为单位的最大排队音频长度。 */
  maxAudioLag?: number
  /** 流媒体时，视频解码缓冲区的字节大小。默认的512 * 1024 (512 kb)。对于非常高的比特率，您可能需要增加此值。 */
  videoBufferSize?: string
  /** 流媒体时，音频解码缓冲区的字节大小。默认的128 * 1024 (128 kb)。对于非常高的比特率，您可能需要增加此值。 */
  audioBufferSize?: string
  /** 在每个解码和渲染视频帧后调用的回调 */
  onVideoDecode?: (decoder, time: number) => void
  /** 在每个解码音频帧之后调用的回调函数 */
  onAudioDecode?: (decoder, time: number) => void
  /** 每当播放开始时调用的回调 */
  onPlay?: (player: Player) => void
  /** 当回放暂停时(例如.pause()被调用或源程序结束时)调用的回调函数。 */
  onPause?: (player: Player) => void
  /** 当回放到达源端时调用的回调函数(仅在loop=false时调用) */
  onEnded?: (player: Player) => void
  /** 当没有足够的数据供回放时调用的回调 */
  onStalled?: (player: Player) => void
  /** 当源首次接收到数据时调用的回调 */
  onSourceEstablished?: (source: WSSource) => void
  /** 当源接收到所有数据时调用的回调 */
  onSourceCompleted: (source: WSSource) => void
  /** 当onSourceStreamInterrupt触发后websocket第一次接收到流时触发 */
  onSourceStreamContinue: (source: WSSource) => void
  /** 当websocket超过一定时间没有收到流时触发 */
  onSourceStreamInterrupt: (source: WSSource) => void
  /** 当websocket连接上服务端时触发 */
  onSourceConnected: (source: WSSource) => void
  /** 当websocket关闭后触发 */
  onSourceClosed: (source: WSSource) => void
  /** 当获取到分辨率时触发 */
  onResolutionDecode: (width: number, height: number) => void
}

export interface JSMpegPlayer {
  (url: string, options: PlayerOptions)
  /** 只读，是否暂停播放 */
  readonly paused: boolean
  /** 获取或设置音频音量(0-1) */
  volume: number
  /** 以秒为单位获取或设置当前播放位置 */
  currentTime: number
  startTime: number
  /** 开始播放 */
  play(): void
  /** 暂停播放 */
  pause(): void
  /** 停止回放，搜索开始 */
  stop(): void
  /** 一个视频帧的提前播放。这并不解码音频。如果没有足够的数据，则返回成功 */
  nextFrame(): void
  /** 停止播放，断开源和清理WebGL和WebAudio状态。该播放器将不能再使用。 */
  destroy(): void
  video
  source
  renderer
  wasmModule
  audioOut
  audio
}
