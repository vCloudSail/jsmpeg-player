/*
 * @Author: lcm
 * @Date: 2022-12-27 10:48:00
 * @LastEditors: lcm
 * @LastEditTime: 2022-12-27 17:24:02
 * @Description:
 */
export class EventBus extends EventTarget {
  eventMap = {}
  constructor() {
    super()
  }
  _removeEvent(type, callback) {
    if (callback) {
      let values = this.eventMap[type]
      let index = values.findIndex((item) => {
        return item.callback === callback
      })
      if (index > -1) {
        values.splice(index, 1)
      }
    } else {
      this.eventMap[type] = null
    }
  }
  /**
   * @template {keyof import("../types/events").JSMpegEventMap} T
   * @param {T} type
   * @param {import("../types/events").JSMpegEventMap[T]} callback
   * @param {AddEventListenerOptions|boolean} options
   */
  on(type, callback, options) {
    if (!this.eventMap[type]) {
      this.eventMap[type] = [{ callback }]
    } else {
      this.eventMap[type].push({ callback })
    }

    const wrapCallback = (/** @type {CustomEvent} */ ev) => {
      callback?.(...ev.detail)
      if (options?.once) {
        this._removeEvent(type, callback)
      }
    }
    this.addEventListener(type, wrapCallback, options)
  }
  /**
   * @template {keyof import("../types/events").JSMpegEventMap} T
   * @param {T} type
   * @param {import("../types/events").JSMpegEventMap[T]} callback
   * @param {AddEventListenerOptions|boolean} options
   */
  once(type, callback, options = {}) {
    options = options ?? {}
    options.once = true

    this.on(type, callback, options)
  }
  /**
   * @template {keyof import("../types/events").JSMpegEventMap} T
   * @param {T} type
   * @param {import("../types/events").JSMpegEventMap[T]} callback
   */
  off(type, callback = null) {
    this.removeEventListener(type, callback)
    this._removeEvent(type, callback)
  }
  /**
   * @template {keyof import("../types/events").JSMpegEventMap} T
   * @param {T} type
   * @param {any} data
   */
  emit(type, ...data) {
    let event = new CustomEvent(type, {
      detail: data ?? [],
      bubbles: true,
      cancelable: true
    })
    this.dispatchEvent(event)
  }
  offAll() {
    let keys = Object.keys(this.eventMap)

    for (let key of keys) {
      this.off(key)
    }

    this.eventMap = {}
  }
}
