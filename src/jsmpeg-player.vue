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
            :text="loadingText"
          ></slot>
          <loading
            v-else
            :text="loadingText"
          ></loading
        ></div>
      </div>
      <!-- <canvas class="jsmpeg-canvas"
              ref="canvas" /> -->
      <template v-if="!loading && playerStatus.noSignal">
        <template v-if="$slots['no-signal']">
          <slot name="no-signal" />
        </template>
        <template v-else>
          <div class="no-signal-text"> {{ noSignalText }} </div></template
        >
      </template>
    </div>
    <div
      class="player-toolbar"
      v-if="withToolbar"
      :class="{ 'is-show': playerStatus.playerHover }"
      @mouseenter="handleToolbarMouseEnter"
      @mouseleave="handleToolbarMouseLeave"
    >
      <button
        class="toolbar-item play-btn"
        type="button"
        :class="paused ? 'jm-icon-video-play is-paused' : 'jm-icon-video-pause'"
        :title="paused ? '播放' : '暂停'"
        @click="handleToolbar('play')"
      ></button>
      <contextmenu class="toolbar-item">
        <button
          slot="reference"
          class="stop-btn jm-icon-stop"
          title="停止"
          type="button"
          @click="handleToolbar('stop')"
        ></button>
        <div slot="menu-item">asdasdasd</div>
      </contextmenu>
      <button
        class="toolbar-item volume-btn"
        type="button"
        title="音量"
        v-popover:popover-volume
        :class="isMuted ? 'jm-icon-muted' : 'jm-icon-volume'"
        @click="handleToolbar('mute')"
      ></button>
      <div class="progress-bar">
        <span
          v-if="showDuration"
          class="current-time"
        >
          {{ currentTimeLabel }}
        </span>
      </div>
      <!-- <button class="snapshot-btn"
              title="画中画"
              @click="requesPip">
        <i class="jm-icon-copy-document"></i>
      </button> -->
      <button
        class="toolbar-item snapshot-btn jm-icon-screenshots"
        title="截图"
        type="button"
        @click="handleToolbar('snapshot')"
      ></button>
      <button
        class="toolbar-item recording-btn jm-icon-recording"
        type="button"
        :class="playerStatus.recording ? 'is-recording' : ''"
        :title="playerStatus.recording ? '停止录制' : '录制'"
        @click="handleToolbar('recording')"
      ></button>
      <button
        class="toolbar-item setting-btn jm-icon-settings"
        title="设置"
        type="button"
        v-popover:popover-setting
      ></button>
      <button
        class="toolbar-item fullscreen-btn"
        type="button"
        :class="
          playerStatus.fullscreen
            ? 'jm-icon-fullscreen-exit'
            : 'jm-icon-fullscreen'
        "
        :title="playerStatus.fullscreen ? '取消全屏' : '全屏'"
        @click="handleToolbar('fullscreen')"
      ></button>
    </div>
    <div class="overlayers">
      <template v-if="withToolbar">
        <el-popover
          popper-class="jsmpeg-player-popover popover-setting"
          ref="popover-setting"
          trigger="hover"
          placement="top-end"
          :visible-arrow="popoverVisibleArrow"
          :append-to-body="false"
        >
          <!-- <div class="setting-item">
            <span class="label">禁用WebGL</span>
            <div class="input__wrap">
              <el-switch class="input"
                         v-model="playerSettings.disableGl">
              </el-switch>
            </div>
          </div> -->
          <!-- <div class="setting-item"
               highlight>
            <span class="label">后台播放</span>
            <div class="input__wrap">
              <el-switch class="input"
                         v-model="playerSettings.backgroudPlay"
                         @change="settingPlayer('pauseWhenHidden',!$event)">
              </el-switch>
            </div>
          </div> -->
          <div
            class="setting-item"
            highlight
          >
            <span class="label">自动拉伸</span>
            <div class="input__wrap">
              <el-switch
                class="input"
                v-model="playerSettings.autoStretch"
                @change="settingPlayer('autoStretch', $event)"
              >
              </el-switch>
            </div>
          </div>
          <div
            class="setting-item"
            highlight
          >
            <span class="label">旋转画面</span>
            <div class="input__wrap">
              <button
                class="toolbar-item jm-icon-rotate-left"
                title="向左旋转90度"
                type="button"
                @click="rotate(-90, true)"
              ></button>
              <button
                class="toolbar-item jm-icon-rotate-right"
                title="向右旋转90度"
                type="button"
                @click="rotate(90, true)"
              ></button>
            </div>
          </div>
          <!-- <div class="setting-item">
          <span class="label">test</span>
          <div class="input__wrap">
            <el-button class="input"
                       @click="player.stop(true)">
            </el-button>
          </div>
        </div> -->
        </el-popover>
        <el-popover
          popper-class="jsmpeg-player-popover popover-volume"
          ref="popover-volume"
          trigger="hover"
          placement="top"
          :visible-arrow="popoverVisibleArrow"
          :append-to-body="false"
        >
          <div class="volume-value">{{ volumePercent }}</div>
          <el-slider
            v-model="volume"
            vertical
            height="120px"
            :max="1"
            :min="0"
            :step="0.01"
            :show-tooltip="false"
            :marks="{
              0: '',
              0.5: '',
              1: ''
            }"
            @change="$emit('volume-change', volume)"
          >
          </el-slider>
        </el-popover>
      </template>
    </div>
  </div>
</template>

<script>
import JSMpeg from './class/jsmpeg'
import fullscreen from './class/jsmpeg/utils/fullscreen'
import { formatTimestamp } from './class/jsmpeg/utils'
import vLoading from './directives/loading'
import Loading from './components/loading.vue'
import Contextmenu from './components/contextmenu.vue'

const defaultOptions = () => ({
  /** 是否循环播放视频(仅静态文件)。默认true */
  autoplay: true,
  /** 是否解码音频。默认true */
  audio: true,
  /** 是否解码视频。默认true */
  video: true,
  /** 预览图像的URL，用来在视频播放之前作为海报显示。 */
  poster: null,
  /** 是否禁用后台播放，当web页面处于非活动状态时是否暂停播放，默认true（注意，浏览器通常会在非活动标签中限制JS） */
  pauseWhenHidden: true,
  /** 是否禁用WebGL，始终使用Canvas2D渲染器。默认false */
  disableGl: false,
  /** 是否禁用WebAssembly并始终使用JavaScript解码器。默认false */
  disableWebAssembly: false,
  /** WebGL上下文是否创建必要的“截图”。默认false */
  preserveDrawingBuffer: true,
  /** 是否以块的形式加载数据(仅静态文件)。当启用时，回放可以在完整加载源之前开始，默认true */
  progressive: true,
  /** 当不需要回放时是否推迟加载块。默认=progressive */
  throttled: true,
  /** 使用时，以字节为单位加载的块大小。默认(1 mb)1024*1024 */
  chunkSize: 1024 * 1024,
  /** 是否解码并显示视频的第一帧，一般用于设置画布大小以及使用初始帧作为"poster"图像。当使用自动播放或流媒体资源时，此参数不受影响。默认true */
  decodeFirstFrame: true,
  /** 流媒体时，以秒为单位的最大排队音频长度。（可以理解为能接受的最大音画不同步时间） */
  maxAudioLag: 0.25,
  /** 流媒体时，视频解码缓冲区的字节大小。默认的512 * 1024 (512 kb)。对于非常高的比特率，您可能需要增加此值。 */
  videoBufferSize: 1024 * 1024,
  /** 流媒体时，音频解码缓冲区的字节大小。默认的128 * 1024 (128 kb)。对于非常高的比特率，您可能需要增加此值。 */
  audioBufferSize: 256 * 1024
})

export default {
  name: 'jsmpeg-player',
  inheritAttrs: false,

  // #region 组件基础
  props: {
    url: String,
    title: String,
    options: {
      type: Object,
      default: defaultOptions
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
    popoverVisibleArrow: {
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
  directives: { vLoading },
  components: { Loading, Contextmenu },
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
        noSignal: null,
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
    /** @returns {number} */
    volumePercent() {
      return parseInt(this.volume * 100)
    },
    /** @returns {string} */
    currentTimeLabel() {
      return formatTimestamp(this.playerStatus.currentTime * 1000)
    },
    /** @returns {boolean} */
    isMuted() {
      return this.volume === 0
    },
    /** @returns {string} */
    recordingDurationLabel() {
      return formatTimestamp(this.playerStatus.recordingDuration)
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

      if (this.url == null || this.url == '') {
        this.player = null
      } else {
        this.initPlayer()
      }
    },
    options: {
      deep: true,
      handler() {
        this.destroyPlayer()
        this.initPlayer()
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
          if (!tab.$el?.contains(this.$el)) {
            this.intoBackground()
            this.$emit('update:inBackground', true)
          }
        } catch (error) {}
      })
    }
    window.addEventListener('unload', () => {
      this.destroyPlayer()
    })

    this.init()

    this.syncTimer = setInterval(() => {
      if (this.player) {
        this.playerStatus.currentTime = this.player.currentTime
      }
    }, 1000)
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
      this.$emit('player-loaded', player)

      // #region 原生事件
      player.on('video-decode', ({ detail = [] } = {}) => {
        // console.log('[JSMpegPlayer] 事件触发 -> 视频帧解码')

        // this.playerStatus.currentTime = player.currentTime
        this.$emit('video-decode', ...detail)
      })
      player.on('audio-decode', ({ detail = [] } = {}) => {
        // console.log('[JSMpegPlayer] 事件触发 -> 音频帧解码')

        this.$emit('audio-decode', ...detail)
      })
      player.on('play', ({ detail = [] } = {}) => {
        console.log('[JSMpegPlayer] 事件触发 -> 播放开始')

        this.playerStatus.playing = player.isPlaying
        this.playerStatus.paused = player.paused
        this.loading = false
        this.$emit('play', player)
      })
      player.on('pause', ({ detail = [] } = {}) => {
        console.log('[JSMpegPlayer] 事件触发 -> 播放暂停')

        this.playerStatus.playing = player.isPlaying
        this.playerStatus.paused = player.paused
        this.loading = false
        console.log('onPause')
        this.$emit('pause', player)
      })
      player.on('stalled', ({ detail = [] } = {}) => {
        console.log('[JSMpegPlayer] 事件触发 -> 播放停滞')

        this.playerStatus.playing = player.isPlaying
        this.playerStatus.paused = player.paused
        this.$emit('stalled', player)
      })
      player.on('ended', ({ detail = [] } = {}) => {
        console.log('[JSMpegPlayer] 事件触发 -> 播放结束')

        this.playerStatus.currentTime = player.currentTime
        this.playerStatus.playing = player.isPlaying
        this.playerStatus.paused = player.paused
        this.$emit('ended', player)
      })
      player.on('source-established', ({ detail = [] } = {}) => {
        console.log('[JSMpegPlayer] 事件触发 -> 源通道建立')

        this.playerStatus.noSignal = false
        this.loading = false
        clearTimeout(this.timers.noSignal)
        this.timers.noSignal = null

        this.$emit('source-established', ...detail)
      })
      player.on('source-completed', ({ detail = [] } = {}) => {
        console.log('[JSMpegPlayer] 事件触发 -> 源播放完成')

        console.log('onSourceCompleted')
        this.$emit('source-completed', ...detail)
      })
      // #endregion

      // #region 扩展事件
      player.on('resolution-decode', ({ detail = [] } = {}) => {
        console.log('[JSMpegPlayer] 事件触发 -> 分辨率解码')

        this.playerStatus.gotResolution = true
        this.settingPlayer('autoStretch', this.playerSettings.autoStretch)
        this.$emit('resolution-decode', ...detail)
      })

      // #region 录制相关
      player.on('recording-start', ({ detail = [] } = {}) => {
        // console.log('[JSMpegPlayer] 事件触发 -> 录制器tick')

        this.playerStatus.recording = player.recorder.running
        this.$emit('recording-start', ...detail)
      })
      player.on('recording-pause', ({ detail = [] } = {}) => {
        // console.log('[JSMpegPlayer] 事件触发 -> 录制器tick')
        this.$emit('recording-pause', ...detail)
      })
      player.on('recording-continue', ({ detail = [] } = {}) => {
        // console.log('[JSMpegPlayer] 事件触发 -> 录制器tick')
        this.$emit('recording-continue', ...detail)
      })
      player.on('recording-end', ({ detail = [] } = {}) => {
        // console.log('[JSMpegPlayer] 事件触发 -> 录制器tick')
        this.playerStatus.recording = player.recorder.running
        this.$emit('recording-end', ...detail)
      })
      player.on('recording-tick', ({ detail = [] } = {}) => {
        // console.log('[JSMpegPlayer] 事件触发 -> 录制器tick')
        this.playerStatus.recordingDuration = player.recorder.duration
        this.$emit('recording-tick', ...detail)
      })
      player.on('recording-data', ({ detail = [] } = {}) => {
        // console.log('[JSMpegPlayer] 事件触发 -> 录制器tick')
        this.$emit('recording-data', ...detail)
      })
      // #endregion

      player.on('source-connected', ({ detail = [] } = {}) => {
        console.log('[JSMpegPlayer] 事件触发 -> 源连接')

        clearTimeout(this.timers.noSignal)
        this.loading = true
        this.playerStatus.noSignal = false
        this.$emit('source-connected', ...detail)
      })
      player.on('source-interrupt', ({ detail = [] } = {}) => {
        console.log('[JSMpegPlayer] 事件触发 -> 源传输中断')

        this.loading = true
        clearTimeout(this.timers.noSignal)

        this.timers.noSignal = setTimeout(this.handleNoSignal, 15000)
        this.$emit('source-interrupt', ...detail)
      })
      player.on('source-continue', ({ detail = [] } = {}) => {
        console.log('[JSMpegPlayer] 事件触发 -> 源传输恢复/继续')

        clearTimeout(this.timers.noSignal)
        this.timers.noSignal = null
        this.loading = false
        this.playerStatus.noSignal = false
        this.$emit('source-continue', ...detail)
      })
      player.on('source-closed', ({ detail = [] } = {}) => {
        console.log('[JSMpegPlayer] 事件触发 -> 源关闭')

        clearTimeout(this.timers.noSignal)
        this.$emit('source-closed', ...detail)
        this.handleNoSignal()
      })
      // #endregion

      this.player = player

      this.playerSettings.backgroudPlay = !this.options.pauseWhenHidden

      if (this.defaultMute) {
        this.volume = 0
      }

      this.timers.noSignal = setTimeout(this.handleNoSignal, 15000)

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
        this.player?.stopRecording(this.title)
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

    handleToolbar(cmd) {
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
