var mongodb = require('./db');
var crypto = require('crypto');
function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}
module.exports = User;
// 存储用户信息
User.prototype.save = function (callback) {
    // 创建一个md5的Hash对象
    var md5 = crypto.createHash('md5');
    // 通过提供的数据更新哈希对象
    // 计算传入的所有数据的摘要值 返回 hex(十六进制)
    var email_MD5 = md5.update(this.email.toLowerCase()).digest('hex');
    var head  = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";


    // 要存入数据库的用户文档
    var user = {
        name: this.name,
        password: this.password,
        email: this.email,
        head: head
    };
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err); // 错误， 返回err信息
        }
        // 读取 users 集合
        db.collection('users', function (err, collection) {
            if (err) {
                mongodb.close();    // 关闭数据库链接
                return callback(err);  // 错误， 返回err信息
            }
            // 将用户数据插入 users 集合
            collection.insert(user, {
                safe: true
            }, function (err, user) {
                mongodb.close(); // 无论如何都要关闭
                if (err) {
                    return callback(err); // 错误，返回err信息
                }
                callback(null, user[0]); // 成功！ err 为null , 并返回存储后的用户文档
            });
        });
    });
};
// 读取用户信息
User.get = function (name, callback) {
    // 打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('users', function (err, collection) {
            if (err) {
                mongodb.close();       // 关闭连接
                return callback(err);    // 返回错误信息
            }
            // 查找用户名 (name key) 为 name 一个文档
            collection.findOne({
                name: name     // 根据 name 查找
            }, function (err, user) {
                mongodb.close(); // 始终关闭连接
                if (err) {
                    callback(err); // 失败  返回 err 信息
                }
                callback(null, user); // 成功 返回查询的用户信息
            });
        });
    });
};




