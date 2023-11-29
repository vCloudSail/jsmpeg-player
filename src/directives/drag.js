import { dragIn } from '@/utils/drag'

/**
 * @type {import('vue').DirectiveOptions}
 * @description 使元素支持拖入文件，并触发绑定事件
 * @author cloudsail
 */
const vDragIn = {
  bind(el, binding, vnode) {},
  inserted(el, binding, vnode) {
    dragIn.bind(el, {
      callback: binding.value
    })
  },
  update(el, binding, vnode) {
    dragIn.update(el, {
      callback: binding.value
    })
  },
  unbind(el, binding, vnode) {
    dragIn.unbind(el)
  }
}

export { vDragIn }
