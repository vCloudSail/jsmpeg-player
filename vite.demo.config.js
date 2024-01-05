import { Terser, defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite'
import path from 'node:path'

import viteRequireTransform from 'vite-plugin-require-transform'

import rollupCommonjs from '@rollup/plugin-commonjs'
import { visualizer as rollupVisualizer } from 'rollup-plugin-visualizer'

import vue2 from '@vitejs/plugin-vue2'
import vue2Jsx from '@vitejs/plugin-vue2-jsx'

import Components from 'unplugin-vue-components/vite'
import { ElementUiResolver } from 'unplugin-vue-components/resolvers'

import pkg from './package.json'

const resolve = (_path) => {
  return path.resolve(__dirname, _path)
}

const libName = 'vue-jsmpeg-player'

export default defineConfig(({ mode, ssrBuild, command }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: './',
    publicDir: './demo/public',
    server: {
      // 配置为0.0.0.0，vite会自动监听当前机器的所有ip地址，这样就可以通过局域网访问了
      host: '0.0.0.0',
      port: 10321,
      https: false,
      open: true,
      cors: true,
      headers: {
        'X-Frame-Options': 'ALLOWALL'
      },
      proxy: {
        '/api': {
          target: 'http://jsonplaceholder.typicode.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    resolve: {
      alias: [
        {
          find: '@', // 别名
          replacement: resolve('src') // 别名对应的路径
        },
        {
          find: '@cloudsail/jsmpeg', // 别名
          replacement: resolve('src/jsmpeg/src') // 别名对应地址
        }
      ]
    },
    plugins: [
      Components({
        dts: false,
        resolvers: [ElementUiResolver({ importStyle: true })]
      }),

      rollupCommonjs(),

      vue2(),
      vue2Jsx(),

      viteRequireTransform({
        fileRegex: /^(?!.*node_modules).*\.(js|jsx|vue|ts|tsx)$/
      }),

      // 打包分析插件建议放到最后
      rollupVisualizer({
        emitFile: false,
        filename: 'report.html', //分析图生成的文件名
        open: true //如果存在本地服务端口，将在打包后自动展示
      })
    ],
    build: {
      // #region terser
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false,
          drop_debugger: true,
          pure_funcs: [
            'console.log',
            'console.dir',
            'console.time',
            'console.timeEnd'
          ]
        }
      }
      // #endregion
    }
  }
})
