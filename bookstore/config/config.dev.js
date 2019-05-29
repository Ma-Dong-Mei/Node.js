const path = require('path')

module.exports = {
  // 数据库配置
  DB_HOST: 'localhost',
  DB_PORT: 8889,
  DB_USER: 'root',
  DB_PASS: '123456',
  DB_NAME: 'bookstore',
  SOCKET_PATH: '/Applications/MAMP/tmp/mysql/mysql.sock',

  // HTTP端口
  HTTP_PORT: 3000,
  // 静态文件绝对路径
  HTTP_ROOT: path.resolve(__dirname, '../public'),
  HTTP_UPLOAD: path.resolve(__dirname, '../public/upload')
}