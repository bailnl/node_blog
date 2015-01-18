var mongodb = require('./db');
function Post(name, title, post) {
    this.name = name;
    this.title = title;
    this.post = post;
}
module.exports = Post;
Post.prototype.save = function (callback) {
    var date = new Date();
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + '-' + (date.getMonth() + 1),
        day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
        minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' +
            date.getHours() + ':' + date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
    };
    // 要存入数据库的文档
    var post = {
        name: this.name,
        time: time,
        title: this.title,
        post: this.post
    };
    // 打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close(); // 错误，关闭连接
                return callback(err);
            }
            // 将文档插入 posts 集合
            collection.insert(post, {
                safe: true
            }, function (err) {
                mongodb.close(); // 关闭连接
                if (err) {
                    return callback(err); // 失败
                }
                callback(null); // 返回  err 为 null
            });
        });
    });
};
Post.get = function (name, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            callback(err);
        }
        // 读取posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(rtt);
            }
            // 用于查询
            var query = {};
            if (name) {
                query.name = name;
            }
            // 根据 query 对象 查询文章
            collection.find(query).sort({
                time: -1  // 按时间倒序
            }).toArray(function (err, docs) {
                mongodb.close();   // 始终关闭连接
                if (err) {
                    callback(err);
                }
                callback(null, docs); // 成功！ 以数组形式返回查询的结果
            });
        });
    });
};