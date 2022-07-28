'use strict'
export default class BitBuffer {
  /** @type {Uint8Array} */
  bytes
  /** @type {number} */
  byteLength
  /** @type {1|2} */
  mode
  /** @type {number} */
  index
  constructor(bufferOrLength, mode = BitBuffer.MODE.EXPAND) {
    if (typeof bufferOrLength === 'object') {
      this.bytes =
        bufferOrLength instanceof Uint8Array
          ? bufferOrLength
          : new Uint8Array(bufferOrLength)

      this.byteLength = this.bytes.length
    } else {
      this.bytes = new Uint8Array(bufferOrLength || 1024 * 1024)
      this.byteLength = 0
    }

    this.mode = mode
    this.index = 0
  }

  resize(size) {
    let newBytes = new Uint8Array(size)
    if (this.byteLength !== 0) {
      this.byteLength = Math.min(this.byteLength, size)
      newBytes.set(this.bytes, 0, this.byteLength)
    }
    this.bytes = newBytes
    this.index = Math.min(this.index, this.byteLength << 3)
  }

  evict(sizeNeeded) {
    let bytePos = this.index >> 3,
      available = this.bytes.length - this.byteLength

    // If the current index is the write position, we can simply reset both
    // to 0. Also reset (and throw away yet unread data) if we won't be able
    // to fit the new data in even after a normal eviction.
    if (
      this.index === this.byteLength << 3 ||
      sizeNeeded > available + bytePos // emergency evac
    ) {
      this.byteLength = 0
      this.index = 0
      return
    } else if (bytePos === 0) {
      // Nothing read yet - we can't evict anything
      return
    }

    // Some browsers don't support copyWithin() yet - we may have to do
    // it manually using set and a subarray
    if (this.bytes.copyWithin) {
      this.bytes.copyWithin(0, bytePos, this.byteLength)
    } else {
      this.bytes.set(this.bytes.subarray(bytePos, this.byteLength))
    }

    this.byteLength = this.byteLength - bytePos
    this.index -= bytePos << 3
    return
  }

  write(buffers) {
    let isArrayOfBuffers = typeof buffers[0] === 'object',
      totalLength = 0,
      available = this.bytes.length - this.byteLength

    // Calculate total byte length
    if (isArrayOfBuffers) {
      let totalLength = 0
      for (let i = 0; i < buffers.length; i++) {
        totalLength += buffers[i].byteLength
      }
    } else {
      totalLength = buffers.byteLength
    }

    // Do we need to resize or evict?
    if (totalLength > available) {
      if (this.mode === BitBuffer.MODE.EXPAND) {
        let newSize = Math.max(this.bytes.length * 2, totalLength - available)
        this.resize(newSize)
      } else {
        this.evict(totalLength)
      }
    }

    if (isArrayOfBuffers) {
      for (let i = 0; i < buffers.length; i++) {
        this.appendSingleBuffer(buffers[i])
      }
    } else {
      this.appendSingleBuffer(buffers)
    }

    return totalLength
  }

  appendSingleBuffer(buffer) {
    buffer = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)

    this.bytes.set(buffer, this.byteLength)
    this.byteLength += buffer.length
  }

  findNextStartCode() {
    for (let i = (this.index + 7) >> 3; i < this.byteLength; i++) {
      if (
        this.bytes[i] == 0x00 &&
        this.bytes[i + 1] == 0x00 &&
        this.bytes[i + 2] == 0x01
      ) {
        this.index = (i + 4) << 3
        return this.bytes[i + 3]
      }
    }
    this.index = this.byteLength << 3
    return -1
  }

  findStartCode(code) {
    let current = 0
    while (true) {
      current = this.findNextStartCode()
      if (current === code || current === -1) {
        return current
      }
    }
    return -1
  }

  nextBytesAreStartCode() {
    let i = (this.index + 7) >> 3
    return (
      i >= this.byteLength ||
      (this.bytes[i] == 0x00 &&
        this.bytes[i + 1] == 0x00 &&
        this.bytes[i + 2] == 0x01)
    )
  }

  peek(count) {
    let offset = this.index
    let value = 0
    while (count) {
      let currentByte = this.bytes[offset >> 3],
        remaining = 8 - (offset & 7), // remaining bits in byte
        read = remaining < count ? remaining : count, // bits in this run
        shift = remaining - read,
        mask = 0xff >> (8 - read)

      value = (value << read) | ((currentByte & (mask << shift)) >> shift)

      offset += read
      count -= read
    }

    return value
  }

  read(count) {
    let value = this.peek(count)
    this.index += count
    return value
  }

  skip(count) {
    return (this.index += count)
  }

  rewind(count) {
    this.index = Math.max(this.index - count, 0)
  }

  has(count) {
    return (this.byteLength << 3) - this.index >= count
  }

  static MODE = {
    EVICT: 1,
    EXPAND: 2
  }
}
