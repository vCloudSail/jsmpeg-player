<template>
  <div class="jsmpeg-player-toolbar">
    <button
      class="toolbar-btn play-btn"
      type="button"
      :class="paused ? 'jm-icon-video-play is-paused' : 'jm-icon-video-pause'"
      :title="paused ? '播放' : '暂停'"
      @click="handleToolbar('play')"
    ></button>
    <button
      class="toolbar-btn stop-btn jm-icon-stop"
      title="停止"
      type="button"
      @click="handleToolbar('stop')"
    ></button>
    <button
      class="toolbar-btn volume-btn"
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
      class="toolbar-btn snapshot-btn jm-icon-screenshots"
      title="截图"
      type="button"
      @click="handleToolbar('snapshot')"
    ></button>
    <button
      class="toolbar-btn recording-btn jm-icon-recording"
      type="button"
      :class="isRecording ? 'is-recording' : ''"
      :title="isRecording ? '停止录制' : '录制'"
      @click="handleToolbar('recording')"
    ></button>
    <button
      class="toolbar-btn setting-btn jm-icon-settings"
      title="设置"
      type="button"
      v-popover:popover-setting
    ></button>
    <button
      class="toolbar-btn fullscreen-btn"
      type="button"
      :class="
        flags.fullscreen ? 'jm-icon-exitfullscreen' : 'jm-icon-fullscreen'
      "
      :title="flags.fullscreen ? '取消全屏' : '全屏'"
      @click="handleToolbar('fullscreen')"
    ></button>
    <div class="popover__wrap">
      <el-popover
        popper-class="jsmpeg-player-toolbar--popover popover-setting"
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
              class="toolbar-btn jm-icon-rotate-left"
              title="向左旋转90度"
              type="button"
              @click="rotate(-90, true)"
            ></button>
            <button
              class="toolbar-btn jm-icon-rotate-right"
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
    </div>
  </div>
</template>

<script>
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
  // #endregion

  // #region 数据相关
  data() {
    return {}
  },
  computed: {
    /** @returns {string} */
    currentTimeLabel() {
      return formatTimestamp(this.playerStatus.currentTime * 1000)
    }
  },
  watch: {},
  // #endregion

  // #region 生命周期
  created() {},
  mounted() {},
  // #endregion

  methods: {
    handleToolbar(cmd, data) {
      this.$emit('command ', cmd, data)
    }
  }
}
</script>

<style lang="scss">
.jsmpeg-player-toolbar {
}
</style>
