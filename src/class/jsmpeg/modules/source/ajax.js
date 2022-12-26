'use strict'

export default class AjaxSource {
  /** @type {import('../../utils/event-bus').EventBus} */
  eventBus
  constructor(url, options) {
    this.url = url
    this.destination = null
    this.request = null
    this.streaming = false

    this.completed = false
    this.established = false
    this.progress = 0

    this.eventBus = options.eventBus
    this.onEstablishedCallback = options.onSourceEstablished
    this.onCompletedCallback = options.onSourceCompleted
  }

  connect(destination) {
    this.destination = destination
  }

  start() {
    this.request = new XMLHttpRequest()

    this.request.onreadystatechange = function () {
      if (
        this.request.readyState === this.request.DONE &&
        this.request.status === 200
      ) {
        this.onLoad(this.request.response)
      }
    }.bind(this)

    this.request.onprogress = this.onProgress.bind(this)
    this.request.open('GET', this.url)
    this.request.responseType = 'arraybuffer'
    this.request.send()
  }

  resume(secondsHeadroom) {
    // Nothing to do here
  }

  destroy() {
    this.request.abort()
  }

  onProgress(ev) {
    this.progress = ev.loaded / ev.total
  }

  onLoad(data) {
    this.established = true
    this.completed = true
    this.progress = 1

    if (this.onEstablishedCallback) {
      this.onEstablishedCallback(this)
      this.eventBus?.emit('source-established', this)
    }
    if (this.onCompletedCallback) {
      this.onCompletedCallback(this)
      this.eventBus?.emit('source-completed', this)
    }

    if (this.destination) {
      this.destination.write(data)
    }
  }
}
