import { Terser, defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite'

const resolve = (_path) => {
  return path.resolve(__dirname, _path)
}

const libName = 'vue-jsmpeg-player'

export default defineConfig(({ mode, ssrBuild, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  console.log(mode)
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
              // 'element-ui': 'ELEMENT',
              vue: 'Vue'
            },
            format: 'es'
            // preserveModules: true, // 保留模块结构
            // preserveModulesRoot: 'src' // 将保留的模块放在根级别的此路径下
          },
          {
            globals: {
              // 'element-ui': 'ELEMENT',
              vue: 'Vue'
            },
            format: 'umd',
            name: libName,
            exports: 'named'
          },
          {
            globals: {
              // 'element-ui': 'ELEMENT',
              vue: 'Vue'
            },
            format: 'cjs',
            exports: 'named'
          }
        ]
      }
    }
  }
})
