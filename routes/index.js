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
module.exports = function (app) {
    // 主页
    app.get('/', function (req, res) {
        Post.get(null, function (err, posts) {
            if (err) {
                posts = [];
            }
            res.render('index', {
                title: '主页',
                user: req.session.user,
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
        User.get(req.body.name, function (err, user) {
            // 用户不存在
            if (err) {
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
        // 新建一个 post
        var post = new Post(currentUser.name, req.body.title, req.body.post);
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


    // 退出
    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功！');
        res.redirect('/');
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