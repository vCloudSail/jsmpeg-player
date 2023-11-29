<template>
  <div class="jsmpeg-multipath-player flex-col">
    <div
      class="player-list flex-main"
      :split-mode="mode"
    >
      <div
        class="player__wrap"
        ref="playerWrap"
        v-for="(player, index) in players"
        v-loading="player.loading"
        draggable="true"
        :class="[
          'player-' + index,
          {
            'is-focus': focusIndex === index,
            'is-loading': player.loading
          }
        ]"
        :key="player.id"
        :tabindex="tabindex + index + 1"
        v-drag-in="($event) => handlePlayerDragIn($event, player, index)"
        @click="handlePlayerClick(player)"
        @dragover="($event) => handlePlayerDragOver($event, player, index)"
        @dragstart="($event) => handlePlayerDragOut($event, player, index)"
      >
        <jsmpeg-player
          v-if="player.url"
          ref="players"
          closeable
          default-mute
          :title="player.title"
          :url="player.url"
          :in-background="playerBackground"
          v-bind="getPlayerProps(player)"
          @close="handlePlayerClose(player)"
          @volume-change="handlePlayerVolumeChange(player, $event)"
          @no-signal="handlePlayerNoSignal(player, index)"
        ></jsmpeg-player>
      </div>
    </div>
    <div class="toolbar flex-row">
      <button
        class="jm-icon-stop"
        type="text"
        title="停止播放"
        @click="stopAllPlayer"
      >
      </button>
      <button
        class="jm-icon-muted"
        type="text"
        title="静音"
        @click="mutedAllPlayer"
      >
      </button>
      <button
        :class="isFullscreen ? 'jm-icon-exitfullscreen' : 'jm-icon-fullscreen'"
        :title="isFullscreen ? '退出全屏' : '进入全屏'"
        type="text"
        style="margin-left: auto"
        @click="toggleFullscreen"
      >
      </button>
      <button
        class="el-icon-menu"
        type="text"
        v-popover:popover-splitscreen
      >
      </button>
    </div>
    <div class="overlayers">
      <el-popover
        ref="popover-splitscreen"
        popper-class="video-monitoring-popover popover-splitscreen"
        placement="top-end"
        trigger="hover"
        :visible-arrow="false"
      >
        <div class="split-layout-container">
          <div
            class="split-layout"
            v-for="item in splitLayoutOptions"
            :key="item.mode"
            @click="changeSpitMode(item)"
          >
            <i
              class="icon"
              :class="item.icon"
            ></i>
            <div class="label"> {{ item.count }}分屏 </div>
          </div>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<script>
import { merge, remove } from 'lodash-es'
import fullscreen from '@cloudsail/jsmpeg/utils/fullscreen'
import { vDragIn } from '@/directives/drag'
import uuid from '@/utils/uuid'

const splitLayoutOptions = [
  {
    icon: 'jm-icon-splitscreen-1',
    count: 1,
    mode: '1'
  },
  {
    icon: 'jm-icon-splitscreen-4',
    count: 4,
    mode: '4'
  },
  // {
  //   icon: 'jm-icon-splitscreen-4-1',
  //   count: 4,
  //   mode: '4-1'
  // },
  {
    icon: 'jm-icon-splitscreen-6',
    count: 6,
    mode: '6'
  },
  {
    icon: 'jm-icon-splitscreen-8',
    count: 8,
    mode: '8'
  },
  {
    icon: 'jm-icon-splitscreen-9',
    count: 9,
    mode: '9'
  }
]
const defaultSplitPlayer = (id) => ({
  id: id || '',
  url: null,
  title: '',
  loading: false,
  repulishCount: 0
})

/**
 * JsmpegMultipathPlayer
 * @author lcm
 * @createTime
 * @description
 */
export default {
  name: 'JsmpegPlayer.Multipath',

  // #region 组件基础
  components: {},
  directives: {
    dragIn: vDragIn
  },
  props: {
    value: {
      required: true,
      type: Array
    },
    tabindex: {
      type: Number,
      default: 0
    },
    playerProps: Object
  },
  // 兼容vue3写法
  emits: ['player-click', 'player-noSignal'],
  // #endregion

  // #region 数据相关
  data() {
    return {
      mode: '1',

      playerBackground: false,
      isFullscreen: false,
      focusIndex: -1,
      isDrag: false
    }
  },
  computed: {
    /** @returns {{id:string,title:string,url:string}} */
    players() {
      return this.value
    },
    splitLayoutOptions() {
      return splitLayoutOptions
    }
  },
  watch: {
    $route: {
      handler(route) {
        if (route?.name === this.$options?.name) {
          this.playerBackground = false
        } else {
          this.playerBackground = true
        }
      },
      immediate: true
    }
  },
  // #endregion

  // #region 生命周期
  created() {},
  mounted() {
    this.changeSpitMode(splitLayoutOptions[1])
  },
  // #endregion

  methods: {
    getPlayerProps(player) {
      return merge(this.playerProps, player.props)
    },
    toggleFullscreen() {
      if (this.isFullscreen) {
        fullscreen.exit(this.$el)
      } else {
        fullscreen.request(this.$el, () => {
          this.isFullscreen = false
        })
      }
      this.isFullscreen = !this.isFullscreen
    },
    pauseAllPlayer() {
      let len = this.$refs.players?.length
      if (len > 0) {
        for (let i = 0; i < len; i++) {
          this.$refs.players[i].pause()
        }
      }
    },
    playAllPlayer() {
      let len = this.$refs.players?.length
      if (len > 0) {
        let player
        for (let i = 0; i < len; i++) {
          player = this.$refs.players[i]
          if (player.paused && player.url) {
            player.play()
          }
        }
      }
    },
    mutedAllPlayer() {
      let len = this.$refs.players?.length
      if (len > 0) {
        for (let i = 0; i < len; i++) {
          this.$refs.players[i].volume = 0
        }
      }
    },
    stopAllPlayer() {
      let len = this.players.length
      if (len > 0) {
        for (let i = 0; i < len; i++) {
          // this.players[i].id = uuid()
          this.players[i].url = ''
          this.players[i].title = ''
        }
      }
    },
    changeSpitMode(splitLayout = splitLayoutOptions[1]) {
      let length = this.value.length
      let { count, mode } = splitLayout
      if (count > 6) {
        alert('多路同屏播放超过6路会占用大量CPU性能，请谨慎使用')
      }
      if (length > splitLayout.count) {
        this.players.splice(count, length)
        for (let item of this.players) {
          if (!item.id) {
            item.id = uuid()
          }
        }
      } else if (length < count) {
        for (let i = 0; i < count - length; i++) {
          this.players.push(defaultSplitPlayer(uuid()))
        }
      }

      if (this.mode != mode) {
        this.mode = mode
      }
    },
    swapPlayer(aIndex, bIndex) {
      let temp = this.players[bIndex]

      this.players[bIndex] = this.players[aIndex]
      this.players[aIndex] = temp
    },
    addPlayer(player) {},
    removePlayer(player) {
      if (player) {
        player.url = null
        player.title = null
      }
    },
    handlePlayerClick(player) {
      if (this.isDrag) {
        this.isDrag = false
        return
      }
      this.focusIndex = this.players.indexOf(player)
      this.$emit('player-click', {
        data: player,
        instance: this.$refs.players[this.focusIndex],
        index: this.focusIndex
      })
      // console.log(this.currentFocusPlayer)
    },
    handlePlayerVolumeChange(player, volume) {
      for (const item of this.$refs.players) {
        if (item.url !== player.url) {
          item.volume = 0
        }
      }
    },
    async handlePlayerNoSignal(player, i) {
      if (this.playerBackground || player.repulishCount > 3) return

      this.$emit('player-noSignal', {
        data: player,
        instance: this.$refs.players[i],
        index: i
      })
    },
    handlePlayerClose(player) {
      this.removePlayer(player)
    },

    // #region 拖拽相关
    // 外部拖入事件
    async handlePlayerDragIn(ev, targetPlayer, index) {
      this.isDrag = true
      if (targetPlayer.loading) {
        return
      }

      let data = ev.dataTransfer.getData('text/plain')
      if (data && targetPlayer) {
        try {
          data = JSON.parse(data)
          const doSome = async () => {
            targetPlayer.loading = true
            try {
              targetPlayer.id = data.id ?? targetPlayer.id
              // const url = await cameraApi.publishMpegts(data.id)
              targetPlayer.url = data.url
              targetPlayer.title = data.title
              targetPlayer.repulishCount = 0
              this.focusIndex = this.players.indexOf(targetPlayer)
              this.$nextTick(() => {
                this.$refs.playerWrap[index].click()
                this.$refs.playerWrap[index].focus()
              })
            } catch (error) {
              this.handlePlayerClose(targetPlayer)
            }
            targetPlayer.loading = false
          }

          if (data.__inner === true) {
            // 表示是由其他播放器拖入进来的
            if (index == data.index) {
              // 拖入拖出都是自己，则跳过
              return
            }

            let fromPlayer = this.players[data.index]
            if (fromPlayer) {
              fromPlayer.id = targetPlayer.id
              fromPlayer.url = targetPlayer.url
              fromPlayer.title = targetPlayer.title

              this.$emit('player-swap', {
                sourcePlayer: fromPlayer,
                sourceIndex: data.index,
                targetPlayer,
                targetIndex: index
              })
            }
          } else if (
            data.url !== targetPlayer.url &&
            this.players.findIndex((item) => item.url === data.url) != -1
          ) {
            // this.$confirmDlg({
            //   message: this.$t('videoManage.monitoring.tips.repeatMonitoring'),
            //   successText: '',
            //   confirmCb: () => {
            //     doSome()
            //   }
            // })
            return
          }
          doSome()
        } catch (error) {}
      }
    },
    handlePlayerDragOver(ev, player, i) {
      if (player.loading) {
        ev.dataTransfer.dropEffect = 'none'
        ev.dataTransfer.effectAllowed = 'none'
      }
    },
    handlePlayerDragOut(ev, player, i) {
      if (player.url) {
        let dt = ev.dataTransfer
        ev.dataTransfer.effectAllowed = 'copy'
        dt.setData(
          'text/plain',
          JSON.stringify({
            id: player.id,
            index: i,
            title: player.title,
            url: player.url,
            // 为了区分外部和内部拖拽
            __inner: true
          })
        )
      } else {
        ev.preventDefault()
        ev.stopPropagation()
      }
    }
    // #endregion
  }
}
</script>

<style lang="scss">
.jsmpeg-multipath-player {
  width: 100%;
  height: 100%;
  overflow: hidden;
  .player-list {
    display: grid;
    border: 1px solid gray;
    // row-gap: 1px;
    // column-gap: 1px;
    background-color: white;
    overflow: hidden;
    &[split-mode='1'] {
      grid-template-columns: repeat(1, 1fr);
      grid-template-rows: repeat(1, 1fr);
      // grid-template-areas: 'a';
    }
    &[split-mode='4'] {
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
    }
    &[split-mode='4-1'] {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      .player__wrap:first-child {
        grid-row: 1 / 4;
        grid-column: 1 / 3;
      }
    }
    &[split-mode='6'] {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      .player__wrap:first-child {
        grid-row: 1 / 3;
        grid-column: 1 / 3;
      }
    }
    &[split-mode='8'] {
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(4, 1fr);
      .player__wrap:first-child {
        grid-row: 1 / 4;
        grid-column: 1 / 4;
      }
    }
    &[split-mode='9'] {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
    }
    .player__wrap {
      display: flex;
      background-color: #606166;
      border: 1px solid gray;
      position: relative;
      transition: 0.28s border-color, 0.46s box-shadow;
      overflow: hidden;

      .jsmpeg-player {
        flex: 1 1 auto;
      }
      &.is-focus {
        border-color: red;
        // box-shadow: 0 0 5px 0 red;
      }
      &.is-loading {
        cursor: no-drop !important;
      }
    }
  }
  > .toolbar {
    height: 40px;
    background-color: #2e3136;
    padding: 0 10px;

    > button {
      color: lightgray;
      background: transparent;
      font-size: 24px;
      outline: none;
      border: none;
      transition: 0.28s color;
      cursor: pointer;
      &:hover {
        color: #409eff;
      }
    }
  }
}

.video-monitoring-popover {
  border: none !important;
  &.popover-splitscreen {
    max-width: 300px;
    background-color: #2e3136;
    .split-layout-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      // display: grid;
      // grid-template-columns: repeat(auto-fill, 50px);
      // grid-auto-rows: repeat(auto-fill, 80px);
      .split-layout {
        width: 50px;
        display: flex;
        flex-direction: column;
        text-align: center;
        justify-content: center;
        align-items: center;
        color: lightgray;
        transition: 0.28s color;
        cursor: pointer;
        padding: 5px;
        .icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
        .label {
          width: 100%;
          margin-top: 5px;
          line-height: normal;
          font-size: 12px;
        }
        &:hover {
          color: #409eff;
        }
        // & + .split-layout {
        //   margin-left: 10px;
        // }
      }
    }
  }
}
</style>
