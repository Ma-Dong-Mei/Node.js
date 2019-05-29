## Node + MySQL 案例实战 - 在线书城

### 数据表设计

**创建数据库**

```sql
create database bookstore;
```

**书籍表结构**

```sql
create table book (
    book_id int AUTO_INCREMENT,
    name varchar(100) not null comment '书名',
    sn varchar(100) unique not null comment '书本唯一编号',
    price decimal(5,2) not null default 0 comment '单价',
    remark varchar(100) comment '备注',
    primary key (book_id)
) comment='书籍表';
```

**订单表结构**

订单列表：

```sql
create table book_order (
    order_id varchar(50) not null comment '订单号，通过某种规则生成',
    money decimal(10,2) not null comment '订单金额',
    addr varchar(100) comment '送货地址',
    phone varchar(11) comment '联系电话',
    order_time datetime not null comment '下单时间',
    primary key (order_id)
) comment='订单列表';
```

订单详细表：

```sql
create table order_item (
    # 订单列表的外键引用，与 book_id 一起作为表的主键
    order_id varchar(50) not null comment '订单号，通过某种规则生成',
    book_id int not null comment '书籍表的外键引用',
    num int not null comment '购买数量',
    foreign key (book_id) references book(book_id) on delete cascade on update cascade,
    foreign key (order_id) references book_order(order_id) on delete cascade on update cascade
) comment='订单详细表';
```

### 设计路由

| 请求方法 | 请求路径       | get参数  | post参数                         | 说明                   |
|----------|----------------|----------|----------------------------------|------------------------|
| get      | /book          |          |                                  | 渲染书城首页           |
| get      | /book/add      |          |                                  | 渲染增加新书页面       |
| post     | /book/add      |          | sn、name、price、remark          | 处理添加新书请求       |
| get      | /book/edit     | book_id  |                                  | 渲染编辑书籍页面       |
| post     | /book/edit     |          | book_id、sn、name、price、remark | 处理编辑书籍请求       |
| get      | /book/del      | book_id  |                                  | 处理删除书籍请求       |
| get      | /book/add_cart | book_id  |                                  | 处理加入购物车请求     |
| get      | /cart          |          |                                  | 渲染购物车页面         |
| get      | /cart/del      | book_id  |                                  | 处理删除购物车商品请求 |
| post     | /cart          |          | book_id、num、addr、phone        | 处理提交订单请求       |
| get      | /order_list    |          |                                  | 渲染订单列表页面       |
| get      | /order_item    | order_id |                                  | 渲染订单明细页面       |

### 书城首页代码设计

**书籍表模型代码**

这里的 API 返回的是 Promise，方便异步编程。

```javascript
// 书籍表模型

const connection = require('./lib/db')

// 获取书籍全部数据
exports.findAll = () => {
    return connection.query('SELECT sn, name, price FROM book')
}

// 根据条件查询的书籍数据
exports.findByLimit = (from, offset) => {
    return connection.query('SELECT sn, name, price FROM book LIMIT ?, ?', [from, offset])
}
```

**获取全部书籍数据路由**

这里使用了 Promise 链式调用，这比嵌套函数更容易理解。

```javascript
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
```

**首页模板代码**

```html
<body>
    <div>
        <ul>
            <li><a href="/book">书城首页</a></li>
            <li><a href="">购物车</a></li>
            <li><a href="">订单列表</a></li>
        </ul>
    </div>
    <div>
        <h3>在线书城</h3>
        <table border="1">
            <tr>
                <th>序号</th>
                <th>编号</th>
                <th>书名</th>
                <th>价格</th>
                <th>操作</th>
            </tr>
            {{each books}}
            <tr>
                <!-- 
                    书籍序号：
                    (page - 1) * 4 + 1 代表当前页第一条书籍数据的序号；
                    (page - 1) * 4 + 1 + $index 这里加上索引就可以递增序号，从而显示后续书籍数据的序号。
                 -->
                <td>{{(page - 1) * 4 + 1 + $index}}</td>
                <td>{{$value.sn}}</td>
                <td>{{$value.name}}</td>
                <td>￥{{$value.price}}</td>
                <td>
                    <a href="">加入购物车</a>
                    <a href="">修改</a>
                    <a href="">删除</a>
                </td>
            </tr>
            {{/each}}
            <tr>
                <td colspan="5">
                    一共{{length}}条记录，当前页数：{{page}}/{{sumPage}}
                    <!-- 根据当前页是否是首页或尾页，来显示超链接 -->
                    {{if page !== 1}}
                    <a href="/book?page=1">首页</a>
                    <a href="/book?page={{page - 1}}">上一页</a>
                    {{else}}
                    <span>首页</span>
                    <span>上一页</span>
                    {{/if}}
                    {{if page !== sumPage}}
                    <a href="/book?page={{page + 1}}">下一页</a>
                    <a href="/book?page={{sumPage}}">尾页</a>
                    {{else}}
                    <span>下一页</span>
                    <span>尾页</span>
                    {{/if}}
                </td>
            </tr>
        </table>
        <a href="">增加新书</a>
    </div>
</body>
```

### 新增图书代码设计

**书籍表模型代码**

```javascript
// 增加新书
exports.add = (data) => {
    return connection.query('INSERT INTO book SET ?', data)
}

// 根据书籍唯一编号查询数据
exports.findBySn = (sn) => {
    return connection.query('SELECT name FROM book WHERE sn=?', sn)
}
```

**新增图书路由**

```javascript
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
```

**新增图书模板**

```html
<body>
    <div>
        <ul>
            <li><a href="/book">书城首页</a></li>
            <li><a href="">购物车</a></li>
            <li><a href="">订单列表</a></li>
        </ul>
    </div>
    <div>
        <h3>增加新书</h3>
        <form action="/book/add" method="post">
            <table border="1">
                <tr>
                    <td>编号</td>
                    <td>
                        <input type="text" name="sn" required id="">
                    </td>
                </tr>
                <tr>
                    <td>名称</td>
                    <td>
                        <input type="text" required name="name" id="">
                    </td>
                </tr>
                <tr>
                    <td>价格</td>
                    <td>
                        <input type="text" required name="price" id="">
                    </td>
                </tr>
                <tr>
                    <td>备注</td>
                    <td>
                        <textarea name="remark" id="" cols="30" rows="10"></textarea>
                    </td>
                </tr>
                <tr>
                    <td colspan="2">
                        <input type="submit" value="提交">
                    </td>
                </tr>
            </table>
        </form>
    </div>
</body>
```

### 编辑图书代码设计

**书籍表模型代码**

```javascript
// 根据图书 id 查找数据
exports.findByBookId = book_id => {
    return connection.query('SELECT * FROM book WHERE book_id=?', book_id)
}

// 根据非当前图书 id 和当前图书唯一编号查找数据
exports.findByBookIdAndSn = (book_id, sn) => {
    return connection.query('SELECT name FROM book WHERE sn=? AND book_id != ?', [sn, book_id])
}

// 根据图书 id 更新数据
exports.updateByBookId = (data) => {
    return connection.query('UPDATE book SET sn=?, name=?, price=?, remark=? WHERE book_id=?', [data.sn, data.name, data.price, data.remark, data.book_id])
}
```

**编辑图书路由**

```javascript
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
```

**编辑图书模板**

```html
<body>
    <div>
        <ul>
            <li><a href="/book">书城首页</a></li>
            <li><a href="">购物车</a></li>
            <li><a href="">订单列表</a></li>
        </ul>
    </div>
    <div>
        <h3>编辑书籍</h3>
        <form action="/book/edit" method="post">
            <input type="hidden" value="{{book.book_id}}" name="book_id" id="">
            <!-- 当前第几页，用于当更新数据后，跳到这一页 -->
            <input type="hidden" value="{{page}}" name="page" id="">
            <table border="1">
                <tr>
                    <td>编号</td>
                    <td>
                        <input type="text" name="sn" value="{{book.sn}}" id="">
                    </td>
                </tr>
                <tr>
                    <td>名称</td>
                    <td>
                        <input type="text" name="name" value="{{book.name}}" id="">
                    </td>
                </tr>
                <tr>
                    <td>价格</td>
                    <td>
                        <input type="text" name="price" value="{{book.price}}" id="">
                    </td>
                </tr>
                <tr>
                    <td>备注</td>
                    <td>
                        <textarea name="remark" id="" cols="30" rows="10">{{book.remark}}</textarea>
                    </td>
                </tr>
                <tr>
                    <td colspan="2">
                        <input type="submit" value="提交">
                    </td>
                </tr>
            </table>
        </form>
    </div>
</body>
```

### 删除图书代码设计

**书籍表模型代码**

```javascript
// 根据图书 id 删除数据
exports.delByBookId = book_id => {
    return connection.query('DELETE FROM book WHERE book_id=?', book_id)
}
```

**删除图书路由**

```javascript
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
```

**删除图书模板**

```html
<tr>
    <th>序号</th>
    <th>编号</th>
    <th>书名</th>
    <th>价格</th>
    <th>操作</th>
</tr>
{{each books}}
<tr>
    <!-- 
        书籍序号：
        (page - 1) * 4 + 1 代表当前页第一条书籍数据的序号；
        (page - 1) * 4 + 1 + $index 这里加上索引就可以递增序号，从而显示后续书籍数据的序号。
        -->
    <td>{{(page - 1) * 4 + 1 + $index}}</td>
    <td>{{$value.sn}}</td>
    <td>{{$value.name}}</td>
    <td>￥{{$value.price}}</td>
    <td>
        <a href="">加入购物车</a>
        <a href="/book/edit?book_id={{$value.book_id}}&page={{page}}">修改</a>
        <a href="/book/del?book_id={{$value.book_id}}">删除</a>
    </td>
</tr>
{{/each}}
```

### 购物车代码设计

**书籍表模型代码**

```javascript
// 根据一组图书 id 查找数据
exports.findByArrBookId = arr_book_id => {
    let sql = 'SELECT * FROM book WHERE book_id in (?'
    for (let i = 1; i < arr_book_id.length; i++) {
        sql += ',?'
    }
    sql += ')'
    return connection.query(sql, arr_book_id)
}
```

**购物车路由**

```javascript
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
```

**购物车模板**

```html
<h3>购物车</h3>
<table border="1">
    <tr>
        <th>序号</th>
        <th>数量</th>
        <th>书名</th>
        <th>价格</th>
        <th>操作</th>
    </tr>
    {{each books}}
    <tr>
        {{set val = $value}}
        <td>{{$index + 1}}</td>
        {{each nums}}
        <!-- 这里一定要注意“===”不能写成“=” -->
        {{if $value.book_id === val.book_id}}
        <td>{{$value.num}}</td>
        <td>{{val.name}}</td>
        <td>{{val.price * $value.num}}</td>
        {{/if}}
        {{/each}}
        <td>
            <a href="">删除</a>
        </td>
    </tr>
    {{/each}}
</table>
```

### 订单列表代码设计

**订单模型代码**

```javascript
// 获取订单列表全部数据
exports.findOrderListAll = () => {
    return connection.query('SELECT * FROM book_order')
}
```

**订单列表路由**

```javascript
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
```

**订单列表模板**

```html
<body>
    <div>
        <ul>
            <li><a href="/book">书城首页</a></li>
            <li><a href="/cart">购物车</a></li>
            <li><a href="/order_list">订单列表</a></li>
        </ul>
    </div>
    <div>
        <h3>订单列表</h3>
        <table border="1">
            <tr>
                <th>序号</th>
                <th>订单编号</th>
                <th>下单时间</th>
                <th>金额</th>
                <th>收货地址</th>
                <th>电话</th>
                <th>操作</th>
            </tr>
            {{each order_list}}
            <tr>
                <td>{{$index + 1}}</td>
                <td>{{$value.order_id}}</td>
                <td>{{$value.order_time}}</td>
                <td>￥{{$value.money}}</td>
                <td>{{$value.addr}}</td>
                <td>{{$value.phone}}</td>
                <td>
                    <a href="/order_item?order_id={{$value.order_id}}">查看订单明细</a>
                </td>
            </tr>
            {{/each}}
            <tr>
                <td colspan="7">
                    一共2条记录，当前页数：1/1
                    <a href="">首页</a>
                    <a href="">上一页</a>
                    <a href="">下一页</a>
                    <a href="">尾页</a>
                </td>
            </tr>
        </table>
    </div>
</body>
```

### 订单详细表代码设计

**订单模型代码**

```javascript
// 根据订单号 order_id 查询订单详细数据
exports.findOrderItemByOrderId = order_id => {
    return connection.query('SELECT * FROM order_item WHERE order_id=?', order_id)
}
```

**订单详细表路由**

```javascript
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
```

**订单详细表模板**

```html
<body>
    <div>
        <ul>
            <li><a href="/book">书城首页</a></li>
            <li><a href="/cart">购物车</a></li>
            <li><a href="/order_list">订单列表</a></li>
        </ul>
    </div>
    <div>
        <h3>订单明细</h3>
        <table border="1">
            <tr>
                <th>序号</th>
                <th>订单编号</th>
                <th>书名</th>
                <th>单价</th>
                <th>数量</th>
                <th>小记</th>
            </tr>
            <!-- 总金额 -->
            {{set total = 0}}
            {{each order_item}}
            <tr>
                {{set val = $value}}
                <td>{{$index + 1}}</td>
                <td>{{$value.order_id}}</td>
                {{each book_datas}}
                <!-- 如果图书 id 一样，那么就可以正确显示相对应的数据 -->
                {{if val.book_id === $value.book_id}}
                <td>{{$value.name}}</td>
                <td>￥{{$value.price}}</td>
                <td>{{val.num}}件</td>
                <td>{{val.num * $value.price}}</td>
                <!-- 叠加金额 -->
                <td style="display: none">{{ total += val.num * $value.price}}</td>
                {{/if}}
                {{/each}}
            </tr>
            {{/each}}
            <tr>
                <td colspan="6">订单合计：￥{{total}}元</td>
            </tr>
        </table>
    </div>
</body>
```

### 提交订单代码设计

**订单模型代码**

```javascript
// 添加订单列表数据
exports.addOrderList = req_obj => {
    return connection.query('INSERT INTO book_order VALUES (?, ?, ?, ?, ?)', [req_obj.order_id, req_obj.money, req_obj.addr, req_obj.phone, req_obj.order_time])
}

// 添加订单详细数据
exports.addOrderItem = (arr_item) => {
    // arr_item = [
    //     [order_id,book_id,num],
    //     [order_id,book_id,num]
    // ]
    let sql = 'INSERT INTO order_item (order_id, book_id, num) VALUES (?)'
    for (let i = 1; i < arr_item.length; i++) {
        sql += ' ,(?)'
    }
    return connection.query(sql, arr_item)
}
```

**提交订单路由**

```javascript
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
```

**提交订单模板**

```html
<body>
    <div>
        <ul>
            <li><a href="/book">书城首页</a></li>
            <li><a href="/cart">购物车</a></li>
            <li><a href="/order_list">订单列表</a></li>
        </ul>
    </div>
    <div>
        <h3>购物车</h3>
        <table border="1">
            <tr>
                <th>序号</th>
                <th>数量</th>
                <th>书名</th>
                <th>价格</th>
                <th>操作</th>
            </tr>
            <!-- 总金额 -->
            {{set total = 0}}
            {{each books}}
            <tr>
                {{set val = $value}}
                <td>{{$index + 1}}</td>
                {{each nums}}
                <!-- 这里一定要注意“===”不能写成“=” -->
                {{if val.book_id === $value.book_id}}
                <td>{{$value.num}}</td>
                <td>{{val.name}}</td>
                <td>{{val.price * $value.num}}</td>
                <!-- 叠加金额 -->
                <td style="display: none">{{ total += val.price * $value.num}}</td>
                {{/if}}
                {{/each}}
                <td>
                    <a href="/cart/del?book_id={{val.book_id}}">删除</a>
                </td>
            </tr>
            {{/each}}
        </table>
        <form action="/cart" method="post">
            {{each books}}
            <div>
                {{set val = $value}}
                图书id：<input type="text" value="{{val.book_id}}" name="arr_book_id" id="">
                {{each nums}}
                {{if val.book_id === $value.book_id}}
                数量：<input type="text" value="{{$value.num}}" name="arr_num" id="">
                {{/if}}
                {{/each}}
            </div>
            {{/each}}
            总金额：<input type="text" name="money" value="{{total}}" id="">
            <table border="1">
                <tr>
                    <td>送货地址</td>
                    <td>
                        <input type="text" name="addr" id="">
                    </td>
                </tr>
                <tr>
                    <td>联系电话</td>
                    <td>
                        <input type="text" name="phone" id="">
                    </td>
                </tr>
                <tr>
                    <td colspan="2">
                        <input type="submit" value="提交订单" id="">
                        <a href="">清空购物车</a>
                    </td>
                </tr>
            </table>
        </form>
    </div>
</body>
```