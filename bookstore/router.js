// 路由处理

const router = require('express').Router()
const Book = require('./book')
const Order = require('./order')

// 渲染书城首页
router.get('/book', (req, res) => {
    // 当前第几页
    let page = parseInt(req.query.page)
    // 默认第一页
    if (!page) page = 1
    let bookDatas = {}
    Book.findAll()
        .then(allDatas => {
            bookDatas.all = allDatas
            return Book.findByLimit((page - 1) * 4, 4)
        }, err => {
            console.log(err)
        })
        .then(limitDatas => {
            bookDatas.limit = limitDatas
            res.render('index.html', {
                // 当前页书籍数据
                books: bookDatas.limit,
                // 书籍总数
                length: bookDatas.all.length,
                // 总页数
                sumPage: Math.ceil(bookDatas.all.length / 4),
                // 当前第几页
                page: page
            })
        }, err => {
            console.log(err)
        })
})

// 渲染增加新书页面
router.get('/book/add', (req, res) => {
    res.render('add.html')
})

// 处理增加新书请求
router.post('/book/add', (req, res) => {
    let bookData = req.body
    if (bookData.remark === "") bookData.remark = null
    Book.findBySn(bookData.sn)
        .then(data => {
            // 如果输入的图书编号存在，那么需要返回重新输入
            if (data[0]) {
                res.send('图书编号必须唯一 <a href="" onclick="javascript:history.go(-1);">返回</a>')
            } else {
                return Book.add(bookData)
            }
        }, err => {
            console.log(err)
        })
        .then(data => {
            // 如果插入数据成功，那么跳转到首页
            if (data)
                res.redirect('/book')
        }, err => {
            console.log(err)
        })
})

// 渲染编辑书籍页面
router.get('/book/edit', (req, res) => {
    Book.findByBookId(parseInt(req.query.book_id))
        .then(data => {
            res.render('edit.html', {
                book: data[0],
                // 当前第几页，用于当更新数据后，跳到这一页
                page: parseInt(req.query.page)
            })
        })

})

// 处理编辑书籍请求
router.post('/book/edit', (req, res) => {
    let bookData = req.body
    if (bookData.remark === "") bookData.remark = null
    bookData.book_id = parseInt(bookData.book_id)
    // 根据非当前图书 id 和当前图书唯一编号查找数据
    Book.findByBookIdAndSn(bookData.book_id, bookData.sn)
        .then(data => {
            // 如果输入的图书编号除了当前图书，还存在一样的图书编号，那么需要返回重新输入
            if (data[0]) {
                res.send(`图书编号必须唯一 <a href="/book/edit?book_id=${bookData.book_id}&page=${bookData.page}">返回</a>`)
            } else {
                return Book.updateByBookId(bookData)
            }
        }, err => {
            console.log(err)
        })
        .then(data => {
            // 如果更新数据成功，那么跳转到首页
            if (data) {
                // 跳到指定的页数
                res.redirect(`/book?page=${bookData.page}`)
            }
        }, err => {
            console.log(err)
        })
})

// 删除图书
router.get('/book/del', (req, res) => {
    Book.delByBookId(parseInt(req.query.book_id))
        .then(data => {
            if (!!data.affectedRows) {
                res.redirect('/book')
            } else {
                res.send(`删除的图书不存在 <a href="/book">返回</a>`)
            }
        }, err => {
            console.log(err)
        })
})

// 渲染购物车页面
router.get('/cart', (req, res) => {
    let obj_book_id_arr = req.session.obj_book_id_arr || []
    if (obj_book_id_arr.length !== 0) {
        // 存放 book_id 的数组
        let arr_book_id = []
        for (let key in obj_book_id_arr) {
            arr_book_id.push(obj_book_id_arr[key].book_id)
        }
        // 根据一组图书 id 查找数据
        Book.findByArrBookId(arr_book_id)
            .then(datas => {
                res.render('shopping_cart.html', {
                    books: datas,
                    nums: obj_book_id_arr
                })
            })
    } else {
        res.send('购物车为空 <a href="/book">返回</a>')
    }
})

// 处理加入购物车请求
router.get('/book/add_cart', (req, res) => {
    // session 中数据类似：
    // req.session.obj_book_id_arr = [
    //     {
    //         book_id: 2,
    //         num: 1
    //     },
    //     {
    //         book_id: 15,
    //         num: 2
    //     }
    // ]
    req.session.obj_book_id_arr = req.session.obj_book_id_arr || []
    let obj_book_id_arr = req.session.obj_book_id_arr
    // 标记是否需要添加新图书，false 添加，true 不添加新图书但添加图书数量
    let flag = false
    // 判断判断 session 中是否已存在相同图书，返回 Boolean 类型
    flag = obj_book_id_arr.some(item => {
        if (item.book_id === parseInt(req.query.book_id)) {
            item.num++
            return true
        }
    })
    // 没有相同的图书则增加一个新图书；
    // 或者，如果 session 中没有有数据，则增加一个新图书
    if (!flag) {
        obj_book_id_arr.push({
            book_id: parseInt(req.query.book_id),
            num: 1
        })
    }
    res.redirect('/cart')
})

// 处理删除购物车商品请求
router.get('/cart/del', (req, res) => {
    req.session.obj_book_id_arr = req.session.obj_book_id_arr || []
    let obj_book_id_arr = req.session.obj_book_id_arr
    // 遍历 session 存储的图书 id 数组，根据请求的图书 id 来删除数组元素
    obj_book_id_arr.forEach((item, index) => {
        if (item.book_id === parseInt(req.query.book_id)) {
            obj_book_id_arr.splice(index, 1)
        }
    })
    res.redirect('/cart')
})

// 渲染订单列表页面
router.get('/order_list', (req, res) => {
    Order.findOrderListAll()
        .then(datas => {
            // 日期时间格式化
            datas.forEach(item => {
                // 获取日期时间
                let d = item.order_time
                let year = d.getFullYear()
                let month = d.getMonth()
                month = month >= 10 ? month : 0 + month.toString()
                let date = d.getDate()
                date = date >= 10 ? date : 0 + date.toString()
                let hours = d.getHours()
                hours = hours >= 10 ? hours : 0 + hours.toString()
                let minutes = d.getMinutes()
                minutes = minutes >= 10 ? minutes : 0 + minutes.toString()
                let seconds = d.getSeconds()
                seconds = seconds >= 10 ? seconds : 0 + seconds.toString()

                item.order_time = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`
            })
            res.render('order_list.html', {
                order_list: datas
            })
        })
})

// 渲染订单明细页面
router.get('/order_item', (req, res) => {
    // 存储数据的临时对象
    let temp_obj = {}
    Order.findOrderItemByOrderId(req.query.order_id)
        .then(datas => {
            // 根据 order_id 查询出的订单详细数据
            temp_obj.item = datas
            // 存储一组 book_id 的数组
            let arr_book_id = []
            datas.forEach(item => {
                arr_book_id.push(item.book_id)
            })
            return Book.findByArrBookId(arr_book_id)
        })
        .then(datas => {
            // 根据一组 book_id 查询出的图书数据
            temp_obj.book_datas = datas
            res.render('order_item.html', {
                order_item: temp_obj.item,
                book_datas: temp_obj.book_datas
            })
        })
})

// 处理提交订单请求
router.post('/cart', (req, res) => {
    // req.body 数据类似：
    // {
    //     arr_book_id: ['2', '4', '14'],
    //     arr_num: ['1', '1', '2'],
    //     money: '241',
    //     addr: '上海',
    //     phone: '183'
    // }

    // 用于存储转换后的请求数据
    let req_obj = {}
    // 这里先赋值一个空数组，否则下面会报错
    req_obj.arr_book_id_num = []
    // 遍历请求的数据，转成如下：
    // {
    //     "arr_book_id_num": [
    //         { "book_id": "2", "num": "1" },
    //         { "book_id": "4", "num": "1" },
    //         { "book_id": "14", "num": "2" }
    //     ],
    //     "addr": "上海",
    //     "phone": "183",
    //      ...
    // }
    req.body.arr_book_id.forEach((item, index) => {
        // 这里先赋值一个空对象，否则下面会报错
        req_obj.arr_book_id_num[index] = {}
        req_obj.arr_book_id_num[index].book_id = item
        req_obj.arr_book_id_num[index].num = req.body.arr_num[index]
    })
    // 获取当前日期时间
    let d = new Date()
    let year = d.getFullYear()
    let month = d.getMonth()
    month = month >= 10 ? month : 0 + month.toString()
    let date = d.getDate()
    date = date >= 10 ? date : 0 + date.toString()
    let hours = d.getHours()
    hours = hours >= 10 ? hours : 0 + hours.toString()
    let minutes = d.getMinutes()
    minutes = minutes >= 10 ? minutes : 0 + minutes.toString()
    let seconds = d.getSeconds()
    seconds = seconds >= 10 ? seconds : 0 + seconds.toString()

    // 拼接时间
    req_obj.order_time = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`
    req_obj.order_id = `${year}${month}${date}${hours}${minutes}${seconds}${Math.round(Math.random() * 1000)}`
    req_obj.money = req.body.money
    req_obj.addr = req.body.addr
    req_obj.phone = req.body.phone

    // 存储到订单详细表中的数据
    let arr_item = []
    req_obj.arr_book_id_num.forEach((item, index) => {
        arr_item[index] = []
        arr_item[index].push(req_obj.order_id, item.book_id, item.num)
    })

    // 把数据添加到订单列表和订单详细表中
    Order.addOrderList(req_obj)
        .then(data => {
            if (!!data.affectedRows) {
                return Order.addOrderItem(arr_item)
            } else {
                res.send('插入失败')
            }
        }, err => {
            console.log(err)
        })
        .then(data => {
            if (!!data.affectedRows) {
                // 清空购物车
                req.session.obj_book_id_arr = []
                res.redirect('/order_list')
            } else {
                res.send('插入失败')
            }
        }, err => {
            console.log(err)
        })
})

module.exports = router