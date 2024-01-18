<template>
  <div
    class="player-toolbar"
    :class="{ 'is-show': player?.playerStatus.playerHover }"
  >
    <button
      class="toolbar-item play-btn"
      type="button"
      :class="player.paused ? 'jm-icon-video-play is-paused' : 'jm-icon-video-pause'"
      :title="player?.paused ? '播放' : '暂停'"
      @click="handleToolbar('play')"
    ></button>
    <button
      class="toolbar-item stop-btn jm-icon-stop"
      title="停止"
      type="button"
      @click="handleToolbar('stop')"
    ></button>
    <button
      class="toolbar-item volume-btn"
      type="button"
      title="音量"
      v-popover:popover-volume
      :class="player?.isMuted ? 'jm-icon-muted' : 'jm-icon-volume'"
      @click="handleToolbar('mute')"
    ></button>
    <div class="progress-bar">
      <span
        v-if="player.showDuration"
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
      :class="player?.playerStatus.recording ? 'is-recording' : ''"
      :title="player?.playerStatus.recording ? '停止录制' : '录制'"
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
      :class="player.playerStatus.fullscreen ? 'jm-icon-fullscreen-exit' : 'jm-icon-fullscreen'"
      :title="player.playerStatus.fullscreen ? '取消全屏' : '全屏'"
      @click="handleToolbar('fullscreen')"
    ></button>
    <div class="overlayers">
      <el-popover
        popper-class="jsmpeg-player-popover popover-setting"
        ref="popover-setting"
        trigger="hover"
        placement="top-end"
        :visible-arrow="false"
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
              v-model="player.playerSettings.autoStretch"
              @change="player.settingPlayer('autoStretch', $event)"
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
              @click="handleToolbar('rotate', -90, true)"
            ></button>
            <button
              class="toolbar-item jm-icon-rotate-right"
              title="向右旋转90度"
              type="button"
              @click="handleToolbar('rotate', 90, true)"
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
        :visible-arrow="false"
        :append-to-body="false"
      >
        <div class="volume-value">{{ volumePercent }}</div>
        <el-slider
          v-model="player.volume"
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
          @change="$emit('volume-change', player.volume)"
        >
        </el-slider>
      </el-popover>
    </div>
  </div>
</template>

<script>
import { formatTimestamp } from '@cloudsail/jsmpeg/utils'

/**
 * jsmpeg-player-toolbar
 * @author cloudsail
 * @createTime
 * @description
 */
export default {
  name: 'jsmpeg-player-toolbar',

  // #region 组件基础
  components: {},
  props: {
    playerStatus: Object
  },
  inject: {
    player: {
      default: null
    }
  },
  // #endregion

  // #region 数据相关
  data() {
    return {}
  },
  computed: {
    /** @returns {string} */
    currentTimeLabel() {
      return formatTimestamp(this.player.playerStatus.currentTime * 1000)
    },
    /** @returns {number} */
    volumePercent() {
      return parseInt(this.player.volume * 100)
    }
  },
  watch: {},
  // #endregion

  // #region 生命周期
  created() {},
  mounted() {},
  // #endregion

  methods: {
    handleToolbar(cmd, ...data) {
      this.$emit('command', cmd, ...data)
    }
  }
}
</script>

<style lang="scss">
.jsmpeg-player-toolbar {
}
</style>
