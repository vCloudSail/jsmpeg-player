export function Now() {
  return window.performance
    ? window.performance.now() / 1000
    : Date.now() / 1000
}

export function Fill(array, value) {
  if (array.fill) {
    array.fill(value)
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = value
    }
  }
}

export function Base64ToArrayBuffer(base64) {
  let binary = window.atob(base64)
  let length = binary.length
  let bytes = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 *
 * @param {object} param
 * @param {string|object|Array} param.data 数据，传入后url参数将被忽略
 * @param {string} param.url 文件下载地址
 * @param {string} param.name 文件名称
 * @param {string} param.mimeType 文件mime类型
 * @returns
 */
export function download(blob, name = 'JSMpeg_' + Date.now(), mimeType = '') {
  if (!blob) return

  const a = document.createElement('a')
  a.style.display = 'none'
  a.download = name
  if (typeof blob === 'string') {
    a.href = blob
  } else {
    blob =
      blob instanceof Blob
        ? blob
        : new Blob(blob instanceof Array ? blob : [blob], {
            type: mimeType
          })
    a.href = URL.createObjectURL(blob)
  }

  setTimeout(() => {
    a.click()
  }, 0)
  setTimeout(() => {
    a.remove()
  }, 1)

  if (blob instanceof Blob) {
    setTimeout(() => {
      URL.revokeObjectURL(blob)
    }, 1000)
  }
}

/**
 *
 * @param {number} num
 * @param {number} len
 * @returns
 */
function prefixPadZero(num, len = 2) {
  return (num + '').padStart(len, '0')
}

/**
 * 格式化时间戳(毫秒)为时分秒
 * @param {number} timestamp
 * @param {boolean} showMs
 * @returns
 */
export function formatTimestamp(timestamp, showMs) {
  let minutes = parseInt(timestamp / 1000),
    seconds = parseInt(minutes / 60),
    hours = parseInt(seconds / 60)

  let result
  if (hours < 1) {
    result = `${prefixPadZero(seconds % 60)}:${prefixPadZero(minutes % 60)}`
  }
  if (hours >= 1) {
    result = `${prefixPadZero(hours % 24)}:${prefixPadZero(
      seconds % 60
    )}:${prefixPadZero(minutes % 60)}`
  }

  if (showMs) {
    result += `:${prefixPadZero(timestamp % 1000, 3)}`
  }

  return result
}
