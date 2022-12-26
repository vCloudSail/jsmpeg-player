import { Now } from '../../utils'
import BitBuffer from '../buffer'
import BaseDecoder from './decoder'

export default class MP2WASM extends BaseDecoder {
  constructor(options) {
    super(options)

    this.onDecodeCallback = options.onAudioDecode

    this.module = options.wasmModule

    this.bufferSize = options.audioBufferSize || 128 * 1024
    this.bufferMode = options.streaming
      ? BitBuffer.MODE.EVICT
      : BitBuffer.MODE.EXPAND

    this.sampleRate = 0
  }

  initializeWasmDecoder() {
    if (!this.module.instance) {
      console.warn('JSMpeg: WASM module not compiled yet')
      return
    }
    this.instance = this.module.instance
    this.functions = this.module.instance.exports
    this.decoder = this.functions._mp2_decoder_create(
      this.bufferSize,
      this.bufferMode
    )
  }

  destroy() {
    if (!this.decoder) {
      return
    }
    this.functions._mp2_decoder_destroy(this.decoder)
  }

  bufferGetIndex() {
    if (!this.decoder) {
      return
    }
    return this.functions._mp2_decoder_get_index(this.decoder)
  }

  bufferSetIndex(index) {
    if (!this.decoder) {
      return
    }
    this.functions._mp2_decoder_set_index(this.decoder, index)
  }

  bufferWrite(buffers) {
    if (!this.decoder) {
      this.initializeWasmDecoder()
    }

    let totalLength = 0
    for (let i = 0; i < buffers.length; i++) {
      totalLength += buffers[i].length
    }

    let ptr = this.functions._mp2_decoder_get_write_ptr(
      this.decoder,
      totalLength
    )
    for (let i = 0; i < buffers.length; i++) {
      this.instance.heapU8.set(buffers[i], ptr)
      ptr += buffers[i].length
    }

    this.functions._mp2_decoder_did_write(this.decoder, totalLength)
    return totalLength
  }

  decode() {
    let startTime = Now()

    if (!this.decoder) {
      return false
    }

    let decodedBytes = this.functions._mp2_decoder_decode(this.decoder)
    if (decodedBytes === 0) {
      return false
    }

    if (!this.sampleRate) {
      this.sampleRate = this.functions._mp2_decoder_get_sample_rate(
        this.decoder
      )
    }

    if (this.destination) {
      // Create a Float32 View into the modules output channel data
      let leftPtr = this.functions._mp2_decoder_get_left_channel_ptr(
          this.decoder
        ),
        rightPtr = this.functions._mp2_decoder_get_right_channel_ptr(
          this.decoder
        )

      let leftOffset = leftPtr / Float32Array.BYTES_PER_ELEMENT,
        rightOffset = rightPtr / Float32Array.BYTES_PER_ELEMENT

      let left = this.instance.heapF32.subarray(
          leftOffset,
          leftOffset + MP2WASM.SAMPLES_PER_FRAME
        ),
        right = this.instance.heapF32.subarray(
          rightOffset,
          rightOffset + MP2WASM.SAMPLES_PER_FRAME
        )

      this.destination.play(this.sampleRate, left, right)
    }

    this.advanceDecodedTime(MP2WASM.SAMPLES_PER_FRAME / this.sampleRate)

    let elapsedTime = Now() - startTime
    this.onDecodeCallback?.(this, elapsedTime)
    this.eventBus?.emit('audio-decode', this, elapsedTime)

    return true
  }

  getCurrentTime() {
    let enqueuedTime = this.destination ? this.destination.enqueuedTime : 0
    return this.decodedTime - enqueuedTime
  }

  static SAMPLES_PER_FRAME = 1152
}
