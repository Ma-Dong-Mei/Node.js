const os = require('os')

// 判断当前系统类型
// - Darwin是苹果系统，如果是苹果系统则使用开发者模式
const mode = os.type() === 'Darwin' ? 'dev' : 'prod'

module.exports = {
  mode, // 当前所处环境
  ...(mode === 'dev' ? require('./config.dev') : require('./config.prod'))  // 当前环境的配置
}