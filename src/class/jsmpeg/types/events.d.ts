import BaseDecoder from '../modules/decoder/decoder'
import MP2 from '../modules/decoder/mp2'
import MP2WASM from '../modules/decoder/mp2-wasm'
import MPEG1 from '../modules/decoder/mpeg1'
import MPEG1WASM from '../modules/decoder/mpeg1-wasm'
import Player from '../modules/player'
import Recorder from '../modules/recorder'
import AjaxSource from '../modules/source/ajax'
import AjaxProgressiveSource from '../modules/source/ajax-progressive'
import WSSource from '../modules/source/websocket'

export interface JSMpegEventMap {
  /**
   * 视频帧解码事件
   *
   * 当成功解码视频帧时触发
   * @origin onVideoDecode
   */
  'video-decode': (decoder: MPEG1 | MPEG1WASM, elapsedTime: number) => void
  /**
   * 音频帧解码事件
   *
   * 当成功解码音频帧时触发
   * @origin onAudioDecode
   */
  'audio-decode': (decoder: MP2 | MP2WASM, elapsedTime: number) => void
  // #region 原生事件
  /**
   * 播放开始事件
   * @origin onPlay
   */
  play: (player: Player) => void
  /**
   * 播放暂停事件
   * @origin onPause
   */
  pause: (player: Player) => void
  /**
   * 播放停滞事件
   *
   * 当接收到的数据不足以播放下一帧时触发
   * @origin onStalled
   */
  stalled: (player: Player) => void
  /**
   * 播放结束事件
   * @origin onEnded
   */
  ended: (player: Player) => void
  /**
   * 源通道建立事件
   *
   * 当source第一次收到数据包时触发
   * @origin onSourceEstablished
   */
  'source-established': (source: AjaxSource | AjaxProgressiveSource) => void
  /**
   * 源播放完成事件
   *
   * 当source收到所有数据时触发（即最后一个数据包）
   * @origin onSourceCompleted
   */
  'source-completed': (source: AjaxSource | AjaxProgressiveSource) => void
  // #endregion

  // #region 扩展事件
  /**
   * 源连接事件（仅websocket）
   *
   * 当websocket连接上服务端时触发
   */
  'source-connected': (source: WSSource) => void
  /**
   * 源传输中断事件（仅websocket）
   *
   * 当websocket超过一定时间（5s）没有收到流时触发
   */
  'source-interrupt': (source: WSSource) => void
  /**
   * 源传输恢复/继续事件（仅websocket）
   *
   * 当传输中断事件触发后websocket第一次接收到流时触发
   */
  'source-continue': (source: WSSource) => void
  /**
   * 源关闭事件（仅websocket）
   *
   * 当websocket关闭后触发
   */
  'source-closed': (source: WSSource) => void
  /**
   * 分辨率解码事件
   *
   * 当获取到视频分辨率时触发发
   */
  'resolution-decode': (
    decoder: MPEG1 | MPEG1WASM,
    resolution: { width: number; height: number }
  ) => void

  /**
   * 录制开始事件
   *
   */
  'recording-start': () => void
  /**
   * 录制结束事件
   *
   */
  'recording-end': (data: Array<ArrayBuffer | Blob>) => void
  /**
   * 录制暂停事件
   *
   */
  'recording-pause': () => void
  /**
   * 录制继续事件
   *
   */
  'recording-continue': () => void
  /**
   * 录制中事件
   *
   * 每隔500毫秒触发一次，参数为录制时间
   */
  'recording-tick': (duration: number) => void
  /**
   * 录制中数据写入
   */
  'recording-data': (data: Blob | ArrayBuffer) => void
  // #endregion
}
