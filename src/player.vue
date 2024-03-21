<template>
  <div
    class="jsmpeg-player"
    @mouseenter="handlePlayerMouseEnter"
    @mouseleave="handlePlayerMouseLeave"
  >
    <div
      class="player-header"
      :class="{ 'is-show': showTitle }"
    >
      <slot
        v-if="$slots.title"
        name="title"
      />
      <span
        v-else-if="displayTitle"
        class="player-title"
        :title="displayTitle"
      >
        {{ displayTitle }}
      </span>
      <div
        class="recording-tips"
        v-if="playerStatus.recording"
      >
        <div class="recording-icon" />
        REC <template v-if="showTitle"> {{ recordingDurationLabel }} </template>
      </div>
      <button
        v-if="showCloseBtn"
        class="close-btn jm-icon-close"
        type="button"
        title="关闭"
        @click="$emit('close')"
      ></button>
    </div>
    <div
      class="player-main"
      ref="player-main"
      @mousemove.passive="handleCanvasMouseMove"
      @click="handleCanvasClick"
      @dblclick="toggleFullscreen"
    >
      <div
        class="player-loading-mask"
        v-show="loading"
      >
        <div class="player-loading">
          <slot
            v-if="hasLoadingSlot"
            name="loading"
          ></slot>
          <loading
            v-else
            :text="loadingText"
          ></loading
        ></div>
      </div>
      <!-- <canvas class="jsmpeg-canvas"
              ref="canvas" /> -->

      <div
        class="no-signal-mask"
        v-if="!loading && playerStatus.noSignal"
      >
        <template v-if="$slots['no-signal']">
          <slot name="no-signal" />
        </template>
        <template v-else>
          <div class="no-signal-text"> {{ noSignalText }} </div>
        </template>
      </div>
    </div>
    <player-toolbar
      v-if="withToolbar"
      @command="handleToolbar"
      @mouseenter.native="handleToolbarMouseEnter"
      @mouseleave.native="handleToolbarMouseLeave"
    ></player-toolbar>
  </div>
</template>

<script>
import JSMpeg from '@cloudsail/jsmpeg/index'
import fullscreen from '@cloudsail/jsmpeg/utils/fullscreen'
import { formatTimestamp } from '@cloudsail/jsmpeg/utils'

import Loading from './components/loading.vue'
import PlayerToolbar from './components/toolbar.vue'
// import Contextmenu from './components/contextmenu.vue'

export default {
  name: 'jsmpeg-player',
  inheritAttrs: false,

  // #region 组件基础
  props: {
    url: String,
    title: String,
    options: {
      type: Object,
      default: () => ({})
    },
    /** 是否可关闭（单击关闭按钮，仅抛出事件） */
    closeable: Boolean,
    /** 是否处于后台，如el-tabs的切换，路由的切换等 */
    inBackground: Boolean,
    /** 是否现实持续播放时间 */
    showDuration: {
      type: Boolean,
      default: true
    },
    /** 默认静音 */
    defaultMute: {
      type: Boolean,
      default: true
    },
    /** 是否需要工具栏 */
    withToolbar: {
      type: Boolean,
      default: true
    },
    noSignalText: {
      type: String,
      default: '无信号'
    },
    loadingText: {
      type: String,
      default: '拼命加载中'
    }
  },
  directives: {},
  components: { Loading, PlayerToolbar },
  inject: {
    /** @returns {any} */
    rootTabs: {
      default: ''
    }
  },
  provide() {
    return {
      player: this
    }
  },
  emits: ['no-signal', 'muted', 'close', 'volume-change', 'update:inBackground'],
  // #endregion

  // #region 数据相关
  data() {
    return {
      loading: false,
      lastVolume: 0,
      syncTimer: null,
      playerStatus: {
        /**
         * 是否处于无信号状态
         * 1. 当流中断事件触发后，15秒后还没有收到ws消息
         * 2. ws关闭事件触发
         */
        noSignal: false,
        /** 是否已获取到视频分辨率 */
        gotResolution: false,
        /** 是否鼠标悬停在播放器内部 */
        playerHover: false,
        /** 是否处于全屏播放 */
        fullscreen: false,
        //
        playing: false,
        backgroud: false,
        currentTime: 0,
        recording: false,
        recordingDuration: 0,
        volume: 0,
        paused: true
      },
      playerSettings: {
        disableGl: false,
        /** canvas旋转角度 */
        rotationAngle: 0,
        /** 后台播放 */
        backgroudPlay: false,
        /** 自动拉伸 */
        autoStretch: false
      },
      timers: {
        noSignal: {
          start(cb) {
            if (this.timer) return

            this.timer = setTimeout(cb, 15000)
          },
          restart(cb) {
            clearTimeout(this.timer)
            this.timers.noSignal = setTimeout(cb, 15000)
          },
          stop() {
            clearTimeout(this.timer)
            this.timer = null
          },
          timer: null
        },
        canvasMouseMove: null
      }
    }
  },
  computed: {
    /** @returns {string} */
    displayTitle() {
      return this.title || this.url
    },
    /** @returns {boolean} */
    paused() {
      return this.playerStatus?.paused ?? true
    },
    /** @returns {number} */
    volume: {
      /** @returns {number} */
      set(val) {
        if (!this.player) return

        let volume
        if (val >= 1) {
          volume = 1
        } else if (val <= 0) {
          volume = 0
        } else {
          volume = val
        }

        if (volume === 0) {
          this.$emit('muted')
        }
        this.playerStatus.volume = this.player.volume = volume
      },
      /** @returns {number} */
      get() {
        return this.playerStatus.volume
      }
    },
    /** @returns {boolean} */
    isMuted() {
      return this.volume === 0
    },
    /** @returns {string} */
    recordingDurationLabel() {
      return formatTimestamp(this.playerStatus.recordingDuration * 1000)
    },
    /** @returns {boolean} */
    showCloseBtn() {
      return this.closeable && !this.playerStatus.fullscreen
    },
    /** @returns {boolean} */
    showTitle() {
      return this.playerStatus.playerHover
    },

    /** @returns {boolean} */
    hasLoadingSlot() {
      return this.$slots['loading'] || this.$scopedSlots['loading']
    }
  },
  watch: {
    url(nval) {
      // this.rotate(0)
      // if (this.player) {
      //   this.player.setUrl(nval)
      // } else {
      //   this.initPlayer()
      // }
      this.player?.destroy()
      this.player = null

      if (this.url != null && this.url !== '') {
        this.play()
      }
    },
    options: {
      deep: true,
      handler() {
        this.destroyPlayer()
        this.play()
      }
    },
    inBackground(nval) {
      if (nval) {
        this.intoBackground()
      } else {
        this.intoFront()
      }
    }
  },
  // #endregion

  // #region 生命周期
  mounted() {
    if (this.rootTabs) {
      this.rootTabs.$on('tab-click', (tab) => {
        try {
          // 处理el-tabs切换标签时，进入后台播放
          if (tab.$el?.contains(this.$el)) {
            this.intoFront()
            this.$emit('update:inBackground', false)
          } else {
            this.intoBackground()
            this.$emit('update:inBackground', true)
          }
        } catch (error) {}
      })
    }
    window.addEventListener('unload', () => {
      this.destroyPlayer()
    })

    this.play()

    this.syncTimer = setInterval(() => {
      if (this.player) {
        this.playerStatus.currentTime = this.player.currentTime
      }
    }, 500)
  },
  beforeDestroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }
    this.destroyPlayer()
  },
  // #endregion

  methods: {
    init() {
      this.initPlayer()
    },

    initPlayer() {
      if (!this.url) return

      this.loading = true
      let player = new JSMpeg.Player(this.url, {
        contianer: this.$refs['player-main'],
        ...this.options
      })

      if (this.inBackground) {
        this.intoBackground()
      }

      this.$emit('player-loaded', player)
      let events = Object.keys(this.$listeners)

      for (let event of events) {
        player.on(event, () => {
          this.$emit(event, ...arguments)
        })
      }
      // #region 原生事件
      // player.on('video-decode', () => {
      //   // console.log('[JSMpegPlayer] 事件触发 -> 视频帧解码')

      // })
      // player.on('audio-decode', () => {
      //   // console.log('[JSMpegPlayer] 事件触发 -> 音频帧解码')

      // })
      player.on('play', () => {
        console.log('[JSMpegPlayer] 事件触发 -> 播放开始')

        this.playerStatus.playing = player.isPlaying
        this.playerStatus.paused = player.paused
        this.loading = false
      })
      player.on('pause', (arg) => {
        console.log('[JSMpegPlayer] 事件触发 -> 播放暂停')

        this.playerStatus.playing = player.isPlaying
        this.playerStatus.paused = player.paused
        this.loading = false
        console.log('onPause')
      })
      player.on('stalled', () => {
        console.log('[JSMpegPlayer] 事件触发 -> 播放停滞')

        this.playerStatus.playing = player.isPlaying
        this.playerStatus.paused = player.paused
      })
      player.on('ended', () => {
        console.log('[JSMpegPlayer] 事件触发 -> 播放结束')

        this.playerStatus.currentTime = player.currentTime
        this.playerStatus.playing = player.isPlaying
        this.playerStatus.paused = player.paused
      })
      player.on('source-established', () => {
        console.log('[JSMpegPlayer] 事件触发 -> 源通道建立')

        this.playerStatus.noSignal = false
        this.loading = false

        this.timers.noSignal.stop()
      })
      // player.on('source-completed', () => {
      //   console.log('[JSMpegPlayer] 事件触发 -> 源播放完成')

      //   console.log('onSourceCompleted')
      //   this.$emit('source-completed', ...arguments)
      // })
      // #endregion

      // #region 扩展事件
      player.on('resolution-decode', () => {
        console.log('[JSMpegPlayer] 事件触发 -> 分辨率解码')

        this.playerStatus.gotResolution = true
        this.settingPlayer('autoStretch', this.playerSettings.autoStretch)
      })

      // #region 录制相关
      player.on('recording-start', () => {
        // console.log('[JSMpegPlayer] 事件触发 -> 录制器tick')

        this.playerStatus.recording = player.recorder.running
      })
      player.on('recording-pause', () => {
        // console.log('[JSMpegPlayer] 事件触发 -> 录制器tick')
      })
      player.on('recording-continue', () => {
        // console.log('[JSMpegPlayer] 事件触发 -> 录制器tick')
      })
      player.on('recording-end', () => {
        // console.log('[JSMpegPlayer] 事件触发 -> 录制器tick')
        this.playerStatus.recording = player.recorder.running
      })
      player.on('recording-tick', () => {
        // console.log('[JSMpegPlayer] 事件触发 -> 录制器tick')
        this.playerStatus.recordingDuration = player.recorder.duration
      })
      player.on('recording-data', () => {
        // console.log('[JSMpegPlayer] 事件触发 -> 录制器tick')
      })
      // #endregion

      player.on('source-connected', () => {
        console.log('[JSMpegPlayer] 事件触发 -> 源连接')

        this.timers.noSignal.stop()

        this.playerStatus.noSignal = false
        this.loading = true
      })
      player.on('source-interrupt', () => {
        console.log('[JSMpegPlayer] 事件触发 -> 源传输中断')

        this.loading = true

        this.timers.noSignal.start(this.handleNoSignal)
      })
      player.on('source-continue', () => {
        console.log('[JSMpegPlayer] 事件触发 -> 源传输恢复/继续')

        this.timers.noSignal.stop()

        this.loading = false
        this.playerStatus.noSignal = false
      })
      player.on('source-closed', () => {
        console.log('[JSMpegPlayer] 事件触发 -> 源关闭')

        this.timers.noSignal.stop()
        this.handleNoSignal()
      })
      // #endregion

      this.player = player

      this.playerSettings.backgroudPlay = !this.options.pauseWhenHidden

      if (this.defaultMute) {
        this.volume = 0
      }

      for (const key in this.playerSettings) {
        this.settingPlayer(key, this.playerSettings[key])
      }

      console.log('player', player)
    },

    // #region 方法
    /** 旋转 */
    rotate(angle, append = false) {
      this.player.rotate(angle, append)
    },
    /**
     * 进入画中画模式
     * @deprecated 未实现
     */
    requesPip() {
      // if (!document.pictureInPictureElement) {
      //   this.$refs.canvas.requestPictureInPicture()
      // }
    },
    /**
     * 退出画中画模式
     * @deprecated 未实现
     */
    exitPip() {
      // document.exitPictureInPicture()
    },
    /**
     * 切换全屏模式
     */
    toggleFullscreen() {
      if (this.playerStatus.fullscreen) {
        fullscreen.exit(this.$el)
      } else {
        fullscreen.request(this.$el, () => {
          this.playerStatus.fullscreen = false
        })
      }
      this.playerStatus.fullscreen = !this.playerStatus.fullscreen
    },
    /**
     * 切换播放模式
     */
    togglePlay() {
      if (this.paused) {
        this.play()
      } else {
        this.pause()
      }
    },
    play() {
      if (!this.url) return

      this.loading = true
      if (!this.player) {
        this.initPlayer()
      }
      this.player?.play()
      this.timers.noSignal.start(this.handleNoSignal)
    },
    pause() {
      this.player?.pause()
    },
    intoFront() {
      this.player?.intoFront()
    },
    intoBackground() {
      this.player?.intoBackground()
    },
    stop(clear) {
      this.player?.stop(clear)
    },
    nextFrame() {
      this.player?.nextFrame()
    },
    destroyPlayer() {
      this.stop()
      this.player?.destroy()
      this.player = null
    },
    mute() {
      this.lastVolume = this.volume
      this.volume = 0
    },
    toggleMute() {
      if (this.isMuted) {
        this.volume = this.lastVolume ? this.lastVolume : 1
      } else {
        this.mute()
      }
      this.$emit('volume-change', this.volume)
    },
    /** 截图 */
    snapshot() {
      this.player?.snapshot(this.displayTitle)
    },
    toggleRecording() {
      if (this.player?.isRecording) {
        this.player?.stopRecording(this.title || this.url)
      } else {
        this.player?.startRecording('auto')
      }
    },

    /**
     * @param
     */
    settingPlayer(optionName, value) {
      if (!this.player) return

      switch (optionName) {
        case 'autoStretch':
          if (!this.playerStatus.gotResolution) return

          const canvas = this.player.canvas
          if (value) {
            if (canvas.width > canvas.height) {
              canvas.style.width = '100%'
            } else {
              canvas.style.height = '100%'
            }
          } else {
            canvas.style.width = ''
            canvas.style.height = ''
          }

          break
        default:
          this.player?.setOption(optionName, value)
          break
      }
    },
    // #endregion

    handleToolbar(cmd, ...args) {
      if (!this.player) return

      switch (cmd) {
        case 'play':
          this.togglePlay()
          break
        case 'stop':
          this.stop()
          break
        case 'mute':
          this.toggleMute()
          break
        case 'rotate':
          this.rotate(...args)
          break
        case 'snapshot':
          this.snapshot()
          break
        case 'recording':
          this.toggleRecording()
          break
        case 'fullscreen':
          this.toggleFullscreen()
          break
      }
    },
    handleNoSignal() {
      this.timers.noSignal.stop()
      this.playerStatus.noSignal = true
      this.loading = false
      this.stop()
      this.$emit('no-signal')
    },
    handlePlayerMouseEnter() {
      this.playerStatus.playerHover = true
    },
    handleCanvasMouseMove() {
      this.playerStatus.playerHover = true
      clearTimeout(this.timers.canvasMouseMove)
      this.timers.canvasMouseMove = setTimeout(() => {
        this.playerStatus.playerHover = false
      }, 3000)
    },
    handlePlayerMouseLeave() {
      clearTimeout(this.timers.canvasMouseMove)
      this.playerStatus.playerHover = false
    },
    handleCanvasClick() {},
    handleToolbarMouseEnter() {
      this.playerStatus.playerHover = true
      clearTimeout(this.timers.canvasMouseMove)
    },
    handleToolbarMouseLeave() {}
  }
}
</script>

<style lang="scss" src="./styles/index.scss"></style>
