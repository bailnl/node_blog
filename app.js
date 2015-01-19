var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


// 配置
var settings = require('./settings');
// 路由
var routes = require('./routes/index');
// session持久化
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
// flash
var flash = require('connect-flash');
// 文件处理
var multer  = require('multer');






// ./routes/index 为入口
// var users = require('./routes/users');


var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('metro'));
// 将路由放到 ./routes/index
// app.use('/', routes);
// app.use('/users', users);


// cookie 信息存储到 mongodb 中
app.use(session({
    secret: settings.cookieSecret,  // 用于防篡改cookie
    key: settings.db,  // cookie 名字
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 30}, //30天
    store: new MongoStore({
        db: settings.db,
        host: settings.host,
        port: settings.port
    }),
    resave:false,
    saveUninitialized: true
}));
// 使用 flash
app.use(flash());
// 静态资源
app.use(express.static(path.join(__dirname, 'public')));

// 处理文件
app.use(multer({
    // 上传目录
    dest: './public/images',
    // 修改上传的文件名
    rename: function (fieldname, filename) {
        return filename;
    }
}));

// 路由控制
routes(app);





// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
module.exports = app;
