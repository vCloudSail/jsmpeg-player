import JSMpegPlayer from './player.vue'
import JSMpegMultipathPlayer from './multipath-player.vue'

export function install(Vue) {
  if (install.installed) return

  install.installed = true

  Vue.component(JSMpegPlayer.name, JSMpegPlayer)
  Vue.component('jsmpeg-player.multipath', JSMpegMultipathPlayer)
}

const plugin = {
  install
}

let GlobalVue = null
if (typeof window !== 'undefined') {
  GlobalVue = window.Vue
} else if (typeof global !== 'undefined') {
  GlobalVue = global.Vue
}
if (GlobalVue) {
  GlobalVue.use(plugin)
}

export { JSMpegPlayer, JSMpegMultipathPlayer }
export default {
  install
}
