// 订单模型

const connection = require('./lib/db')

// 获取订单列表全部数据
exports.findOrderListAll = () => {
    return connection.query('SELECT * FROM book_order')
}

// 根据订单号 order_id 查询订单详细数据
exports.findOrderItemByOrderId = order_id => {
    return connection.query('SELECT * FROM order_item WHERE order_id=?', order_id)
}

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