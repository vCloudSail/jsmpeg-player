const fullscreen = {
  get element() {
    return (
      document.fullscreenElement ??
      document.msFullscreenElement ??
      document.mozFullScreenElement ??
      document.webkitFullscreenElement ??
      null
    )
  },
  /**
   *
   * @param {HTMLElement} el
   * @param {()=>void} exitCb
   */
  request(el, exitCb) {
    if (el instanceof HTMLElement) {
      const cb = (ev) => {
        console.log('fullscreen -> resize ', ev)
        el.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
        if (!this.element) {
          exitCb?.()
          window.removeEventListener('resize', cb)
          console.log('此元素请求的全屏已退出', el)
        }
      }
      window.addEventListener('resize', cb, false)

      const requestMethod =
        el.requestFullScreen ?? //W3C
        el.webkitRequestFullScreen ?? //FireFox
        el.mozRequestFullScreen ?? //Chrome等
        el.msRequestFullScreen //IE11
      requestMethod?.call(el)
    }
  },
  exit(el) {
    if (!this.isFullscreen()) return

    const exitMethod =
      document.exitFullscreen ?? //W3C
      document.mozCancelFullScreen ?? //FireFox
      document.webkitCancelFullScreen ?? //Chrome等
      document.msExiFullscreen //IE11
    exitMethod?.call(document)
  },

  isFullscreen() {
    return this.element != null
  }
}

export default fullscreen
