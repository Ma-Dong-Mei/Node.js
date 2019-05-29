// 在线书城

const express = require('express')
const app = express()
const router = require('./router')
const bodyParser = require('body-parser')
const session = require('express-session')

// 设置模板引擎，模板文件后缀名为 .html
app.engine('html', require('express-art-template'))

// 解析 post 请求
app.use(bodyParser.urlencoded({ extended: true }))

// 使用express的session中间价
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}))

// 挂载路由
app.use(router)

app.listen(3000, () => {
    console.log('running...')
})