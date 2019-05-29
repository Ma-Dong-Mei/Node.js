// 书籍表模型

const connection = require('./lib/db')

// 获取书籍全部数据
exports.findAll = () => {
    return connection.query('SELECT sn, name, price FROM book')
}

// 查询指定数量的书籍数据
exports.findByLimit = (from, offset) => {
    return connection.query('SELECT book_id, sn, name, price FROM book LIMIT ?, ?', [from, offset])
}

// 增加新书
exports.add = (data) => {
    return connection.query('INSERT INTO book SET ?', data)
}

// 根据书籍唯一编号查询数据
exports.findBySn = (sn) => {
    return connection.query('SELECT name FROM book WHERE sn=?', sn)
}

// 根据图书 id 查找数据
exports.findByBookId = book_id => {
    return connection.query('SELECT * FROM book WHERE book_id=?', book_id)
}

// 根据一组图书 id 查找数据
exports.findByArrBookId = arr_book_id => {
    let sql = 'SELECT * FROM book WHERE book_id in (?'
    for (let i = 1; i < arr_book_id.length; i++) {
        sql += ',?'
    }
    sql += ')'
    return connection.query(sql, arr_book_id)
}

// 根据非当前图书 id 和当前图书唯一编号查找数据
exports.findByBookIdAndSn = (book_id, sn) => {
    return connection.query('SELECT name FROM book WHERE sn=? AND book_id != ?', [sn, book_id])
}

// 根据图书 id 更新数据
exports.updateByBookId = (data) => {
    return connection.query('UPDATE book SET sn=?, name=?, price=?, remark=? WHERE book_id=?', [data.sn, data.name, data.price, data.remark, data.book_id])
}

// 根据图书 id 删除数据
exports.delByBookId = book_id => {
    return connection.query('DELETE FROM book WHERE book_id=?', book_id)
}