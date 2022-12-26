import { Now } from '../../utils'
import BitBuffer from '../buffer'
import BaseDecoder from './decoder'

export default class MPEG1WASM extends BaseDecoder {
  options = null
  /** 分辨率 */
  resolution = {
    width: 0,
    height: 0
  }
  constructor(options) {
    super(options)

    this.onDecodeCallback = options.onVideoDecode
    this.module = options.wasmModule

    this.bufferSize = options.videoBufferSize || 512 * 1024
    this.bufferMode = options.streaming
      ? BitBuffer.MODE.EVICT
      : BitBuffer.MODE.EXPAND

    this.decodeFirstFrame = options.decodeFirstFrame !== false
    this.hasSequenceHeader = false
    this.options = options
  }

  initializeWasmDecoder() {
    if (!this.module.instance) {
      console.warn('JSMpeg: WASM module not compiled yet')
      return
    }

    this.instance = this.module.instance
    this.functions = this.module.instance.exports
    this.decoder = this.functions._mpeg1_decoder_create(
      this.bufferSize,
      this.bufferMode
    )
  }

  destroy() {
    if (!this.decoder) {
      return
    }
    this.functions._mpeg1_decoder_destroy(this.decoder)
  }

  bufferGetIndex() {
    if (!this.decoder) {
      return
    }
    return this.functions._mpeg1_decoder_get_index(this.decoder)
  }

  bufferSetIndex(index) {
    if (!this.decoder) {
      return
    }
    this.functions._mpeg1_decoder_set_index(this.decoder, index)
  }

  bufferWrite(buffers) {
    if (!this.decoder) {
      this.initializeWasmDecoder()
    }

    let totalLength = 0
    for (let i = 0; i < buffers.length; i++) {
      totalLength += buffers[i].length
    }

    let ptr = this.functions._mpeg1_decoder_get_write_ptr(
      this.decoder,
      totalLength
    )
    for (let i = 0; i < buffers.length; i++) {
      this.instance.heapU8.set(buffers[i], ptr)
      ptr += buffers[i].length
    }

    this.functions._mpeg1_decoder_did_write(this.decoder, totalLength)
    return totalLength
  }

  write(pts, buffers) {
    super.write(pts, buffers)

    if (
      !this.hasSequenceHeader &&
      this.functions._mpeg1_decoder_has_sequence_header(this.decoder)
    ) {
      this.loadSequnceHeader()
    }
  }

  loadSequnceHeader() {
    this.hasSequenceHeader = true
    this.frameRate = this.functions._mpeg1_decoder_get_frame_rate(this.decoder)
    this.codedSize = this.functions._mpeg1_decoder_get_coded_size(this.decoder)

    if (this.destination) {
      let w = this.functions._mpeg1_decoder_get_width(this.decoder)
      let h = this.functions._mpeg1_decoder_get_height(this.decoder)
      this.destination.resize(w, h)
      this.resolution.width = w
      this.resolution.height = h
      this.options.onResolutionDecode?.(w, h)
    }

    if (this.decodeFirstFrame) {
      this.decode()
    }
  }

  decode() {
    let startTime = Now()

    if (!this.decoder) {
      return false
    }

    let didDecode = this.functions._mpeg1_decoder_decode(this.decoder)
    if (!didDecode) {
      return false
    }

    // Invoke decode callbacks
    if (this.destination) {
      let ptrY = this.functions._mpeg1_decoder_get_y_ptr(this.decoder),
        ptrCr = this.functions._mpeg1_decoder_get_cr_ptr(this.decoder),
        ptrCb = this.functions._mpeg1_decoder_get_cb_ptr(this.decoder)

      let dy = this.instance.heapU8.subarray(ptrY, ptrY + this.codedSize)
      let dcr = this.instance.heapU8.subarray(
        ptrCr,
        ptrCr + (this.codedSize >> 2)
      )
      let dcb = this.instance.heapU8.subarray(
        ptrCb,
        ptrCb + (this.codedSize >> 2)
      )

      this.destination.render(dy, dcr, dcb, false)
    }

    this.advanceDecodedTime(1 / this.frameRate)

    let elapsedTime = Now() - startTime
    this.onDecodeCallback?.(this, elapsedTime)
    this.eventBus?.emit('video-decode', this, elapsedTime)

    return true
  }
}
