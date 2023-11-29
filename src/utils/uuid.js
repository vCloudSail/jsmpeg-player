/**
 *
 * @param {number} mode 生成模式0-3
 * @param {object} params 参数,只有模式3有用
 * @param {number} params.radix 基数
 * @param {number} params.len 长度
 * @returns {string}
 */
function uuid(mode = 0, params) {
  let result = ''
  switch (mode) {
    case 0:
      let s = []
      let hexDigits = '0123456789abcdef'
      for (let i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
      }
      s[14] = '4' // bits 12-15 of the time_hi_and_version field to 0010
      s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1) // bits 6-7 of the clock_seq_hi_and_reserved to 01
      s[8] = s[13] = s[18] = s[23] = '-'

      result = s.join('')
      return result
    case 1:
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    case 2:
      function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
      }
      result = S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4()
      return result
    case 3:
      let { radix, len } = params
      let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
      let i = 0
      result = []
      radix = radix || chars.length

      if (len) {
        // Compact form
        for (i = 0; i < len; i++) result[i] = chars[0 | (Math.random() * radix)]
      } else {
        // rfc4122, version 4 form
        let r

        // rfc4122 requires these characters
        result[8] = result[13] = result[18] = result[23] = '-'
        result[14] = '4'

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
          if (!result[i]) {
            r = 0 | (Math.random() * 16)
            result[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r]
          }
        }
      }

      return result.join('')
    default:
      return result
  }
}

export default uuid
