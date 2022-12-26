<template>
  <div ref="reference">
    <slot name="reference"></slot>
    <transition
      :name="transition"
      @after-enter="$emit('opened')"
      @after-leave="$emit('closed')"
    >
      <div
        class="cl-contextmenu"
        ref="contextmenu"
        v-show="visible"
        :style="bindStyle"
        @click.stop
        @mousedown.stop
        @contextmenu.prevent
      >
        <template v-if="$slots['menu-item']">
          <ul class="menu-list">
            <li
              class="menu-item"
              v-for="(item, index) of menus"
              :key="index"
            >
            </li>
          </ul>
        </template>
        <template v-else> <slot /></template>
      </div>
    </transition>
  </div>
</template>

<script>
let zIndex = 3000
function nextZIndex() {
  return zIndex++
}

/**
 * @name Contextmenu
 * @description 弹出式上下文菜单
 * @author cloudsail
 */
export default {
  name: 'Contextmenu',
  inheritAttrs: false,
  // #region 组件基础
  components: {},
  props: {
    value: Boolean,
    reference: [Element, MouseEvent, DOMRect, CustomEvent],
    // target: {
    //   type: String,
    //   default: 'parent'
    // },
    /**
     * reference: 当reference改变时
     * hover: 当鼠标处于reference上方时
     * click:
     * foucus:
     *
     */
    trigger: {
      type: String,
      default: 'hover'
    },
    transition: {
      type: String,
      default: 'el-zoom-in-top'
    },
    data: Object,
    appendToBody: {
      type: Boolean,
      default: true
    }
  },
  //#endregion

  // #region 数据
  data() {
    return {
      visible: false,
      bindStyle: {
        top: 0,
        left: 0
      },
      inputData: {},
      /** @type {HTMLElement} */
      lastReference: null,
      zIndex: null
    }
  },
  computed: {
    /** @type {boolean} */
    hasReferenceSlot() {
      return (
        (this.$slots['reference'] ?? this.$scopedSlots['reference']) != null
      )
    },
    /** @type {boolean} */
    hasContextmenuSlot() {
      return (
        (this.$slots['contextmenu']?.[0] ?? this.$scopedSlots['contextmenu']) !=
        null
      )
    }
  },
  watch: {
    data(nval) {
      this.inputData = nval
    },
    trigger(nval, oval) {
      nval && this.addTrigger(this.reference, nval)
      oval && this.removeTrigger(this.reference, oval)
    },
    reference(nval, oval) {
      nval && this.addTrigger(nval, this.trigger)
      oval && this.removeTrigger(oval, this.trigger)

      if (nval == null) {
        if (this.trigger === 'reference') {
          this.close()
        }
        return
      }

      this.update(nval)

      if (this.trigger === 'reference') {
        this.open()
      }
      this.lastReference = oval
    },
    value(nval) {
      if (nval) {
        this.open(nval)
      } else {
        this.close()
      }
    }
  },
  // #endregion

  // #region 生命周期
  mounted() {
    document.addEventListener('resize', (e) => {
      if (this.visible) {
        this.close()
        document.removeEventListener('mousedown', this.close)
      }
    })

    this.$refs['contextmenu'].style.zIndex = nextZIndex()
    if (this.appendToBody) {
      document.body.appendChild(this.$refs['contextmenu'])
    }

    if (this.hasReferenceSlot) {
      this.addTrigger(this.$el, this.trigger)
    } else {
      this.addTrigger(this.reference, this.trigger)
    }
  },
  beforeDestroy() {
    if (this.appendToBody) {
      document.body.removeChild(this.$el)
    }
  },
  // #endregion

  methods: {
    /**
     * @param {HTMLElement} reference
     * @param {'reference'|'hover'|'click'|'foucus'} trigger
     */
    addTrigger(reference, trigger) {
      if (!trigger || !reference) return

      switch (trigger) {
        case 'reference':
          break
        case 'hover':
          reference.addEventListener('mouseenter', this.open)
          reference.addEventListener('mouseleave', this.close)
          break
        case 'click':
          reference.addEventListener('click', this.toggleOpen)
          break
        case 'foucus':
          reference.addEventListener('mousedown', this.open)
          reference.addEventListener('mouseup', this.close)
          break
      }
    },
    /**
     * @param {HTMLElement} reference
     * @param {'reference'|'hover'|'click'|'foucus'} trigger
     */
    removeTrigger(reference, trigger) {
      if (!trigger || !reference) return

      switch (trigger) {
        case 'reference':
          reference.removeEventListener('mouseenter', this.open)
          reference.removeEventListener('mouseleave', this.close)
          break
        case 'hover':
          reference.removeEventListener('click', this.toggleOpen)
          break
        case 'click':
          break
        case 'foucus':
          reference.removeEventListener('mousedown', this.open)
          reference.removeEventListener('mouseup', this.close)
          break
      }
    },
    update(target) {
      if (target instanceof Element) {
        let rect = target.getBoundingClientRect()
        this.bindStyle.top = rect.top - this.getOffsetY(rect.y) + 'px'
        this.bindStyle.left =
          rect.left - this.getOffsetX(rect.x) + rect.width / 2 + 'px'
        this.bindStyle.height = rect.height + 5 + 'px'
      } else if (target instanceof MouseEvent) {
        this.bindStyle.top = target.pageY - this.getOffsetY(target.pageY) + 'px'
        this.bindStyle.left =
          target.pageX - this.getOffsetX(target.pageX) + 'px'
      }
    },
    toggleOpen() {
      if (this.visible) {
        this.close()
      } else {
        this.open()
      }
    },
    /**
     * 打开上下文菜单
     * @param {boolean|HTMLElement|Event} target
     * @param {any} data 传递给上下文菜单的缓存数据
     */
    open(target, data) {
      try {
        if (this.visible) {
          // 处理当前是打开状态的情况
          this.visible = false
          this.$nextTick(() => {
            this.open(target, data)
          })
          return
        }

        this.inputData = data == null ? {} : data
        if (target) {
          this.update(target)
        }
        document.addEventListener('mousedown', this.close, {
          once: true,
          passive: true
        })

        this.visible = true
        this.$emit('open')
        this.$emit('input', true)
      } catch (error) {
        console.error(error)
      }
    },
    close() {
      if (this.visible) {
        this.visible = false
        this.$emit('close')
        this.$emit('input', false)
      }
    },
    getOffsetX(x) {
      if (
        this.$el.clientWidth &&
        x + this.$el.clientWidth + 10 >= document.body.clientWidth
      ) {
        return this.$el.clientWidth
      }
      return 0
    },
    getOffsetY(y) {
      if (
        this.$el.clientHeight &&
        y + this.$el.clientHeight + 10 >= document.body.clientHeight
      ) {
        return this.$el.clientHeight
      }
      return 0
    }
  }
}
</script>

<style lang="scss">
.cl-contextmenu {
  position: absolute;
  background: white;
  border: 1px solid lightgray;

  border-radius: 2px;
  overflow: hidden;
  user-select: none;
  box-shadow: 0 3px 12px 3px rgba(0, 0, 0, 0.1);
}
</style>
