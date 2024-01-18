import Vue from 'vue'
import App from './App.vue'
import JsmpegPlayer from '@'
// import JsmpegPlayer from 'vue-jsmpeg-player'

import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

Vue.use(JsmpegPlayer)
Vue.use(ElementUI)

Vue.config.productionTip = false

new Vue({
  render: (h) => h(App)
}).$mount('#app')
