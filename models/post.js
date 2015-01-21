var mongodb = require('./db');
var markdown = require('markdown').markdown;
function Post(name, title, tags, post) {
    this.name = name;
    this.title = title;
    this.tags = tags;
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
        minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };
    // 要存入数据库的文档
    var post = {
        name: this.name,
        time: time,
        tags: this.tags,
        title: this.title,
        post: this.post,
        comments:[],     // 评论
        pv:0
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
// 获取所有的文章
Post.getAll = function (name, callback) {
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
                //解析 markdown 为 html
                docs.forEach(function (doc) {
                    doc.post = markdown.toHTML(doc.post);
                });

                callback(null, docs); // 成功！ 以数组形式返回查询的结果
            });
        });
    });
};

// 一次获取十篇文章
Post.getTen = function (name, page, callback) {
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
            // 使用 count返回特定查询的文档数 total
            collection.count(query, function (err, total) {
                // 根据 query对象查，并跳过前(page-1)*10的结果，返回之后的10个结果
                collection.find(query, {
                    skip: (page - 1) * 10,
                    limit: 10
                }).sort({
                    time: -1
                }).toArray(function (err, docs) {
                    mongodb.close();   // 始终关闭连接
                    if (err) {
                        callback(err);
                    }
                    //解析 markdown 为 html
                    docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });
                    callback(null, docs, total); // 成功！ 以数组形式返回查询的结果
                });
            });
        });
    });
};

// 获取一篇文章
Post.getOne = function (name, day, title, callback) {
    // 打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        // 查找 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 根据  用户名 发表日期 及文章名进行查询
            collection.findOne({
                // 查找条件
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {

                if (err) {
                    mongodb.close();  // 始终关闭 链接
                    return callback(err);
                }
                if (doc) {
                    collection.update({
                        "name": name,
                        "time.day": day,
                        "title": title
                    }, {
                        $inc: {
                            "pv": 1
                        }
                    }, function (err) {
                        console.log(err)
                        mongodb.close();
                        if (err) {
                            return callback(err);
                        }
                    });
                    // 将 markdown转 html
                    doc.post = markdown.toHTML(doc.post);
                    // 评论转换
                    doc.comments.forEach(function (comment) {
                        comment.comment = markdown.toHTML(comment.comment);
                    });
                }
                callback(null, doc); // 返回查询的一篇文章
            });
        });
    });
};

// 编辑文章  返回原始发表的内（markdown格式）
Post.edit = function (name, day, title, callback) {
    // 打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            mongodb.close();
            return  callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, doc);
            });
        });
    });
};

// 更新文章
Post.update = function (name, day, title, post, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 更新文章内容
            collection.update({
                // 查询条件
                "name": name,
                "time.day": day,
                "title": title
            }, {
                // 更新内容
                $set: {
                    post:post
                }
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

// 删除文章
Post.remove = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.remove({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                w: 1
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

// 存档信息
Post.getArchive = function (callback) {
    // 打开db
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        // 读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                return callback(err);
            }
            // 返回只包含 name,time,title 属性的文档组成存档数组
            collection.find({}, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

// 返回含有特定标签的所有文章
Post.getTags = function (callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            console.log(collection);

            // distinct 用来找出给定键的所有不同值
            collection.distinct('tags', function (err, docs) {
                console.log(docs);
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

// 标签
Post.getTag = function (tag, callback) {
    mongodb.open(function (err, db) {
        db.collection('posts', function (err, collection) {
            if (err) {
                return callback(err);
            }
            // 查询所有 tags 数组 内容 包含tag的文档
            // 并返回有 name,time,title 组成的数组
            collection.find({
                "tags": tag
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            })
        });
    });
};

