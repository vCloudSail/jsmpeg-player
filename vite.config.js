import { Terser, defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite'
import path from 'node:path'

import viteRequireTransform from 'vite-plugin-require-transform'

import rollupCommonjs from '@rollup/plugin-commonjs'
import { visualizer as rollupVisualizer } from 'rollup-plugin-visualizer'

import vue2 from '@vitejs/plugin-vue2'
import vue2Jsx from '@vitejs/plugin-vue2-jsx'

import Components from 'unplugin-vue-components/vite'
import { ElementUiResolver } from 'unplugin-vue-components/resolvers'
import viteLibCss from 'vite-plugin-libcss'

import pkg from './package.json'

const resolve = (_path) => {
  return path.resolve(__dirname, _path)
}

const libName = 'vue-jsmpeg-player'

export default defineConfig(({ mode, ssrBuild, command }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: './',
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

      viteLibCss(),

      viteRequireTransform({
        fileRegex: /^(?!.*node_modules).*\.(js|jsx|vue|ts|tsx)$/
      }),

      // 打包分析插件建议放到最后
      rollupVisualizer({
        emitFile: false,
        filename: 'report.html', //分析图生成的文件名
        open: false //如果存在本地服务端口，将在打包后自动展示
      })
    ],
    build: {
      // #region terser
      minify: 'terser',
      terserOptions: {
        compress: {
          dead_code: true,
          drop_console: false,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.dir', 'console.time', 'console.timeEnd']
        }
      },
      // #endregion
      lib: {
        entry: './src/index.js',
        name: libName,
        fileName: 'index'
      },
      rollupOptions: {
        external: [
          // 'element-ui',
          'vue'
        ],
        output: [
          {
            globals: {
              vue: 'Vue'
            },
            format: 'esm'
            // preserveModules: true, // 保留模块结构
            // preserveModulesRoot: 'src' // 将保留的模块放在根级别的此路径下
          },
          {
            globals: {
              vue: 'Vue'
            },
            format: 'umd',
            name: libName,
            exports: 'named'
          }
          // {
          //   globals: {
          //     // 'element-ui': 'ELEMENT',
          //     vue: 'Vue'
          //   },
          //   format: 'cjs',
          //   exports: 'named'
          // }
        ]
      }
    }
  }
})
