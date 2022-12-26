// node路径模块
const path = require('path')

const { defineConfig } = require('@vue/cli-service')

function resolve(dir) {
  return path.join(__dirname, dir)
}

const isProduction = process.env.NODE_ENV === 'production'

module.exports = defineConfig({
  publicPath: './',
  outputDir: 'dist',
  assetsDir: 'static',
  lintOnSave: false,
  productionSourceMap: false,
  transpileDependencies: true,
  runtimeCompiler: process.env.NODE_ENV === 'development',
  devServer: {
    hot: true,
    host: 'localhost',
    port: 10321,
    open: true
    // https: true,
  },
  configureWebpack() {
    return {
      entry: isProduction ? './src/index.js' : './demo/main.js',
      resolve: {
        // externals: [ '.js', '.ts', '.vue', '.json' ],
        alias: {
          '@': resolve('src')
        }
      },
      output: {
        libraryExport: 'default'
      }
    }
  },
  chainWebpack(config) {
    config.when(process.env.NODE_ENV === 'development', (config) => {
      config.devtool('cheap-module-source-map')
    })

    config.when(process.env.NODE_ENV === 'production', (config) => {
      // 移除console
      // https://www.cnblogs.com/WNpursue/p/13745831.html
      config.optimization.minimizer('terser').tap((options) => {
        // https://blog.csdn.net/qq_21567385/article/details/107645477
        options[0].terserOptions.compress.drop_console = false
        options[0].terserOptions.compress.drop_debugger = true
        options[0].terserOptions.compress.pure_funcs = [
          'console.log',
          'console.dir',
          'console.time',
          'console.timeEnd'
        ]
        return options
      })
    })
  }
})
