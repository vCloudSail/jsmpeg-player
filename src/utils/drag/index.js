import './style.css'

/**
 *
 * @param {Function} func
 * @param  {any} arrArgs
 * @returns
 */
export function callbackToAsync(func) {
  return new Promise((resolve, reject) => {
    func(function () {
      resolve(...arguments)
    })
  })
}

const classNames = {
  root: 'v-drag',
  dragenter: 'is-dragenter',
  dragleave: 'is-dragleave'
}

const cancelDefault = (e) => {
  e.preventDefault()
  e.stopPropagation()
}

/**
 * @param {DragEvent|DataTransfer} evOrDataTransfer
 * @returns
 */
export async function parseDataTransferData(evOrDataTransfer) {
  const dataTransfer =
    evOrDataTransfer instanceof DragEvent
      ? evOrDataTransfer.dataTransfer
      : evOrDataTransfer instanceof DataTransfer
      ? evOrDataTransfer
      : null

  if (!dataTransfer) {
    return []
  }

  const dragData = []
  for (let i = 0; i < dataTransfer.items.length; i++) {
    const item = dataTransfer.items[i]
    if (item.kind === 'string') {
      dragData.push(
        await callbackToAsync((cb) => {
          item.getAsString(cb)
        })
      )
    } else if (item.kind === 'file') {
      if (item.type === '') {
        // 文件夹
        // let Entry = (item.getAsEntry ?? item.webkitGetAsEntry)()
        // debugger
        let entry = (item.webkitGetAsEntry || item.getAsEntry)()

        if (entry.isDirectory) {
          dragData.push(entry)
        } else if (entry.isFile) {
          dragData.push(item.getAsFile())
        }
      } else {
        dragData.push(item.getAsFile())
      }
    }
  }

  return dragData
}

// #region DragIn

/**
 * @typedef {(ev:DragEvent) => void} DragInCallback
 */

/**
 * @typedef DragInOptions
 * @property {DragInCallback} callback
 */
/**
 * 使元素支持拖入内容，并触发绑定事件
 * @param {HTMLElement} el
 * @param {DragInOptions} options
 */
export function dragInBind(el, { callback } = {}) {
  if (!el || !(el instanceof HTMLElement) || el.__dragin__?.bind) {
    return
  }

  const data = { bind: true }
  data.callback = callback
  el.__dragin__ = data

  el.classList.add(classNames.root)
  el.setAttribute('draggable', 'true')

  /**
   *
   * @param {DragEvent} ev
   */
  function handleDragenter(ev) {
    // if (ev.target === el) {
    //   return
    // }

    cancelDefault(ev)
    el.classList.add(classNames.dragenter)
  }
  /**
   *
   * @param {DragEvent} ev
   */
  function handleDragleave(ev) {
    cancelDefault(ev)
    if (!el.__dragin__) {
      cancelDefault(ev)
    }
    el.classList.remove(classNames.dragenter)
  }
  /**
   *
   * @param {DragEvent} ev
   */
  function handleDragover(ev) {
    // if (ev.target === el) {
    //   return
    // }
    cancelDefault(ev)
    if (!el.classList.contains(classNames.dragenter)) {
      el.classList.add(classNames.dragenter)
    }
  }

  /**
   *
   * @param {DragEvent} ev
   */
  function handleDrop(ev) {
    cancelDefault(ev)
    el.classList.remove(classNames.dragenter)

    el.__dragin__.callback?.(ev)
  }

  el.addEventListener('dragenter', handleDragenter)
  el.addEventListener('dragleave', handleDragleave)
  el.addEventListener('dragover', handleDragover)
  el.addEventListener('drop', handleDrop)

  data.handles = [handleDragenter, handleDragleave, handleDragover, handleDrop]
}

/**
 * 使元素支持拖入内容，并触发绑定事件
 * @param {HTMLElement} el
 */
export function dragInUpdate(el, { callback } = {}) {
  if (!el || !(el instanceof Element)) {
    return
  }
  
  el.__dragin__.callback = callback
  el.classList.add(classNames.root)
}

/**
 * 使元素支持拖入内容，并触发绑定事件
 * @param {HTMLElement} el
 */
export function dragInUnBind(el) {
  if (!el || !(el instanceof Element) || el.__dragin__?.bind !== true) {
    return
  }

  el.classList.remove(classNames.root)
  el.removeAttribute('draggable')

  el.removeEventListener('dragenter', el.__dragin__?.handles[0])
  el.removeEventListener('dragleave', el.__dragin__?.handles[1])
  el.removeEventListener('dragover', el.__dragin__?.handles[2])
  el.removeEventListener('drop', el.__dragin__?.handles[3])

  delete el.__dragin__
}

export const dragIn = {
  bind: dragInBind,
  update: dragInUpdate,
  unbind: dragInUnBind
}

// #endregion
