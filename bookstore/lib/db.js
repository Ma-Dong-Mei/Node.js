// 连接数据库
// - 并返回一个数据库连接对象，该对象是一个Promise，用于简化异步处理

const mysql = require('mysql');
// 由于异步操作需要不断写回调函数，代码严重冗余，而且阅读困难，
// 所以我们可以使用 co-mysql 简化数据库的异步操作。
const coMysql = require('co-mysql');

// 引入数据库配置
const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASS,
    DB_NAME,
    SOCKET_PATH
} = require('../config')

// 创建数据库连接池
const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    port: DB_PORT,
    socketPath: SOCKET_PATH
});

// 此步将connection.query方法改写为返回一个Promise
const connection = coMysql(pool);

module.exports = connection;