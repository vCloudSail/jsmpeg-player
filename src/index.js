import JsmpegPlayer from './player.vue'
import JsmpegPlayerScreen from './components/screen.vue'

export function install(Vue) {
  if (install.installed) return

  install.installed = true

  Vue.component(JsmpegPlayer.name, JsmpegPlayer)
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

JsmpegPlayer.install = install

export { JsmpegPlayerScreen }
export default JsmpegPlayer
