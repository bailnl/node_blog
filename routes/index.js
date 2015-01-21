// var express = require('express');
// var router = express.Router();
/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });
//module.exports = router;
var crypto = require('crypto');
var User = require('../models/user');
var Post = require('../models/post');
var Comment = require('../models/comment');
module.exports = function (app) {
    // 主页
    app.get('/', function (req, res) {
        var page = req.query.p ? parseInt(req.query.p) : 1;
        Post.getTen(null, page, function (err, posts, total) {
            if (err) {
                posts = [];
            }
            res.render('index', {
                title: '主页',
                user: req.session.user,
                page:page,
                isFirstPage: (page - 1) == 0,
                // (page - 1) * 10  之前的数量
                // posts.length 当前的数量
                isLastPage: ((page - 1) * 10 + posts.length) == total,
                posts: posts,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });


    // 注册
    app.get('/reg', checkNotLogin);
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: '注册',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/reg', checkNotLogin);
    app.post('/reg', function (req, res) {
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'];
        // 检验用户两次输入的密码是否一致
        if (password_re != password) {
            req.flash('err', '两次输入的密码不一致！');
        }
        // 生成密码的 md5 值
        var md5 = crypto.createHash('md5');
        password = md5.update(password).digest('hex');
        var newUser = new User({
            name: name,
            password: password,
            email: req.body.email
        });
        // 获取用户信息
        User.get(newUser.name, function (err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/'); //  错误 返回首页
            }
            // 用户存在
            if (user) {
                req.flash('error', '用户已存在！');  // 用户已存在 返回注册页
                return res.redirect('/reg');
            }
            // 如果不存在则新增用户
            newUser.save(function (err, user) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg'); // 注册失败返回注册页
                }
                req.session.user = user; // 用户信息存入session
                req.flash('success', '注册成功！');
                res.redirect('/');  // 注册成功后返回主页
            });
        });
    });


    // 登陆
    app.get('/login', checkNotLogin);
    app.get('/login', function (req, res) {
        res.render('login', {
            title: '登陆',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/login', checkNotLogin);
    app.post('/login', function (req, res) {
        // 生成密码的 md5 值
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        // console.log('password', password);

        User.get(req.body.name, function (err, user) {
            // 用户不存在
            if (err || user == null) {
                req.flash('error', '用户不存在！');
                return res.redirect('/login');
            }

            // 密码错误
            if (user.password != password) {
                req.flash('error', '密码错误！');
                return res.redirect('/login');
            }
            // 用户密码都匹配后，将用户信息存入 session
            req.session.user = user;
            req.flash('success', '登陆成功！');
            res.redirect('/');
        });
    });


    // 文章
    app.get('/post', checkLogin);
    app.get('/post', function (req, res) {
        res.render('post', {
            title: "发表",
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()

        });
    });
    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        // 获取当前用户
        var currentUser = req.session.user;
        // 获取 tag
        var tags = [req.body.tag1, req.body.tag2, req.body.tag3];
        // 新建一个 post
        var post = new Post(currentUser.name, req.body.title, tags, req.body.post);
        // 将 post 存入 db中
        post.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发布成功！');
            res.redirect('/'); // 发表成功之后跳转到首页
        });
    });

    // 上传
    app.get('/upload',checkLogin);
    app.get('/upload', function (req, res) {
        res.render('upload', {
            title: '文件上传',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/upload', function (req, res) {
        req.flash('success', "文件上传成功！");
        res.redirect('/upload');
    });


    // 用户页面
    app.get('/u/:name', function (req, res) {
        var page = req.query.p ? parseInt(req.query.p) : 1;
        User.get(req.params.name, function (err, user) {
            if (!user) {
                req.flash('err', '用户不存在！');
                return res.redirect('/'); // 用户不存在则跳转到主页
            }
            // 返回该用户所有的文章
            Post.getTen(req.params.name, function (err, posts,total) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    posts: posts,
                    page:page,
                    isFirstPage: (page - 1) == 0,
                    // (page - 1) * 10  之前的数量
                    // posts.length 当前的数量
                    isLastPage: ((page - 1) * 10 + posts.length) == total,

                    user: req.session.user,
                    success: req.flash("success").toString(),
                    error: req.flash("error").toString()
                })
            });
        });
    });


    // 文章页面
    app.get('/u/:name/:day/:title', function (req,res) {
        Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
            if (err) {
                console.log(err);
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('article',{
                title:req.params.title,
                post:post,
                user: req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        });
    });
    app.post('/u/:name/:day/:title', function (req, res) {
        var date = new Date();
        var time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var comment = {
            name: req.body.name,
            email: req.body.email,
            website: req.body.website,
            time: time,
            comment: req.body.content
        };
        // 创建一个留言
        var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
        // 保存到 db 中
        newComment.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', "留言成功");
            res.redirect('back'); // 返回文章页
        });
    });


    // 编辑文章
    app.get('/edit/:name/:day/:title', checkLogin);
    app.get('/edit/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            res.render('edit', {
                title: "编辑",
                post:post,
                user:req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });


    // 更新文章
    app.post("/edit/:name/:day/:title", checkLogin);
    app.post("/edit/:name/:day/:title", function (req, res) {
        var currentUser = req.session.user;
        Post.update(currentUser.name,req.params.day,req.params.title,req.body.post, function (err) {
            // 拼接文章页url
            var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
            if (err) {
                req.flash('error', err);
                return res.redirect(url); //返回文章页
            }
            req.flash('success', "更新成功！");
            res.redirect(url); // 返回文章页

        });
    });


    // 删除文章
    app.get('/remove/:name/:day/:title', checkLogin);
    app.get('/remove/:name/:day/:title', function (req,res) {
        var currentUser = req.session.user;
        Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '删除成功！');
            return res.redirect('/');
        });
    });


    // 存档
    app.get('/archive', function (req,res) {
        Post.getArchive(function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('archive', {
                title: "存档",
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    // 标签
    app.get('/tags', function (req, res) {
        Post.getTags(function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tags',{
                title:'标签',
                posts:posts,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        });
    });

    // 标签
    app.get('/tags/:tag', function (req, res) {
        Post.getTag(req.params.tag,function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tag',{
                title:'TAG:' + req.params.tag,
                posts:posts,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        });
    });

    // 搜索
    app.get('/search', function (req, res) {
        Post.search(req.query.keyword, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('search',{
                title:"SEARCH:" + req.query.keyword,
                posts:posts,
                user:req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        });
    });

    // 友情链接
    app.get('/links', function (req, res) {
        res.render('links', {
            title: '友情链接',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    // 退出
    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功！');
        res.redirect('/');
    });


    app.use(function (req, res) {
        res.render("404");
    });


    // 检测是否 未登陆
    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', '未登陆');
            return res.redirect('/login');
        }
        // 交给下一个中间件
        next();
    }

    // 检测是否 已登陆
    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '已登陆！');
            return res.redirect('back'); // 返回之前的页面
        }
        // 交给下一个中间件
        next();
    }
};