'use strict'

export default class FetchSource {
  /** @type {import('../../utils/event-bus').EventBus} */
  eventBus
  constructor(url, options) {
    this.url = url
    this.destination = null
    this.request = null
    this.streaming = true

    this.completed = false
    this.established = false
    this.progress = 0
    this.aborted = false

    this.eventBus = options.eventBus
    this.onEstablishedCallback = options.onSourceEstablished
    this.onCompletedCallback = options.onSourceCompleted
  }

  connect(destination) {
    this.destination = destination
  }

  start() {
    let params = {
      method: 'GET',
      headers: new Headers(),
      keepAlive: 'default'
    }

    self
      .fetch(this.url, params)
      .then(
        function (res) {
          if (res.ok && res.status >= 200 && res.status <= 299) {
            this.progress = 1
            this.established = true
            return this.pump(res.body.getReader())
          } else {
            //error
          }
        }.bind(this)
      )
      .catch(function (err) {
        throw err
      })
  }

  pump(reader) {
    return reader
      .read()
      .then(
        function (result) {
          if (result.done) {
            this.completed = true
          } else {
            if (this.aborted) {
              return reader.cancel()
            }

            if (this.destination) {
              this.destination.write(result.value.buffer)
            }

            return this.pump(reader)
          }
        }.bind(this)
      )
      .catch(function (err) {
        throw err
      })
  }

  resume(secondsHeadroom) {
    // Nothing to do here
  }

  abort() {
    this.aborted = true
  }
}
