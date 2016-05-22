const gulp = require('gulp');
const gutil = require('gulp-util');
const connect = require('gulp-connect');
const sourcemaps = require('gulp-sourcemaps');
const babelLib = require('gulp-babel');
const concat = require('gulp-concat');
const path = require('path');
const routingConfigs = require('./build/routingConfigs');
const less = require('gulp-less');
const httpProxy = require('http-proxy');
const yargs = require('yargs');
const watchTasks = require('gulp-watch-task').env({
    gulp: gulp,
    reload: function(){
        return gulp.src('target/www/**/*.html', { read: false })
            .pipe(connect.reload());
    }
});

gulp.task('default', ['webserver', 'build', 'watch'], function(){
	gutil.log('incepe distractia');
});

const WWW_PORT = "8090";
const ENVIRONMENTS = [
    {
        alias: ['dragos'],
        protocol: 'http',
        hostName: '172.16.4.15',
        port: 8080,
    }
];

gulp.task('webserver', function(){
	gutil.log('webserver');
	connect.server({
		port: '8090',
    root: 'target/www',
		livereload: true,
    middleware: function(connect, options){
        var localGlassfishUrl = getGlassfishUrl();
        gutil.log("Server ip: "+localGlassfishUrl)
        var proxies = [
            createReverseProxy({
                context: '/flights',
                target: localGlassfishUrl,
            })
        ];

        appendEnvironmentProxies(proxies);

        return proxies;
    }
	})
});
function appendEnvironmentProxies(proxies){
    for(var i = 0; i < ENVIRONMENTS.length; ++i){
        var env = ENVIRONMENTS[i];
        proxies.push(createAuthProxy(env.protocol, env.hostName, env.port));
    }
}

function createAuthProxy(protocol, hostName, port){
    return createReverseProxy({
        context: '/' + hostName,
        stripContext: true,
        target: buildUrl(protocol, hostName, port),
    });
}

function getGlassfishUrl(){
    for(var i = 0; i < ENVIRONMENTS.length; ++i){
        var env = ENVIRONMENTS[i];

        for(var j = 0; j < env.alias.length; ++j){
            var alias = env.alias[j];

            if(yargs.argv[alias]){
                return buildUrl(env.protocol, env.hostName, env.port);
            }
        }
    }

    return 'http://localhost:8080';
}

function buildUrl(protocol, hostName, port){
    return '' + protocol + '://' + hostName + ((port) ? ':' + port : '');
}
function createReverseProxy(opts){
    var proxy = httpProxy.createProxyServer({
        changeOrigin: true,
        autoRewrite: true,
        target: opts.target
    });

    var authorizationValue = null;

    if(authorizationValue || opts.stripContext) {
        proxy.on('proxyReq', function (proxyReq, req, res, options) {
            if (opts.stripContext) {
                proxyReq.path = proxyReq.path.substring(opts.context.length);
            }

            if (authorizationValue) {
                proxyReq.setHeader('Authorization', authorizationValue);
            }
        });

        proxy.on('proxyRes', function (proxyRes, req, res) {
            if (opts.stripContext) {
                if (proxyRes.headers.location) {
                    var localBaseUrl = 'http://localhost:' + WWW_PORT;
                    if (proxyRes.headers.location.lastIndexOf(localBaseUrl, 0) === 0) {
                        proxyRes.headers.location = localBaseUrl + opts.context + proxyRes.headers.location.substring(localBaseUrl.length);
                    }
                }
            }
        });
    }

    proxy.on('error', function(e, req, res){
        gutil.log(gutil.colors.yellow('[' + opts.target + '] ' + e));

        res.writeHead(500, {
            'Content-Type': 'text/plain',
        });
    });

    return function(req, res, skip){
        if(req.url.lastIndexOf(opts.context, 0) === 0){
            proxy.web(req, res);
        }
        else{
            skip();
        }
    };
}



const buildTasks = [
	'libs-to-target',
	'libs-css-to-www',
	'html-to-www',
  'css-to-www',
	'index-to-target',
	'js-to-www'
]

gulp.task('build', buildTasks);

var HTML_TEMPLATE_PATHS = [
    'src/**/*.html',
];

watchTasks.task('html-to-www', HTML_TEMPLATE_PATHS, function (srcPaths) {
    return gulp.src(srcPaths, {base: 'src'})
        .pipe(gulp.dest('target/www'));
});

var appCssFileName = 'app' + '.css';

watchTasks.task('css-to-www', ['src/app/**/*.less', 'src/presentation/**/*.less'], function (srcPaths) {
    return gulp.src(srcPaths)
        .pipe(concat(appCssFileName))
        .pipe(less())
        .pipe(gulp.dest('target/www/css'));
});



const libsList = [
	"bower_components/jquery/dist/jquery.js",
	"bower_components/velocity/velocity.js",
	"bower_components/moment/min/moment-with-locales.js",
	"bower_components/angular/angular.js",
	"bower_components/lumx/dist/lumx.js",
	'node_modules/angular-ui-router/release/angular-ui-router.js',
  "node_modules/angular-aria/angular-aria.js",
  "node_modules/angular-animate/angular-animate.js",
  "node_modules/angular-material/angular-material.js"
]

gulp.task('libs-to-target', function() {
   gulp.src(libsList)
   .pipe(gulp.dest('target/www/libs'));
});

const CSS_LIBRARY_PATHS = [
    "bower_components/lumx/dist/lumx.css",
    "node_modules/angular-material/angular-material.css"
];

gulp.task('libs-css-to-www', function () {
    gulp.src(CSS_LIBRARY_PATHS)
   .pipe(gulp.dest('target/www/css'));
});

watchTasks.task('index-to-target', findIndexHtmlFragmentPaths(), function(fragmentPaths){
    return gulp.src(fragmentPaths)
        .pipe(concat('index.html'))
        .pipe(gulp.dest('target/www'));
});

function findIndexHtmlFragmentPaths(){
    return [
        'src/index.html',
    ];
}



const appJsFileName = 'app' + '.js';

watchTasks.task('js-to-www', findJavaScriptSourcePaths().concat(['target/src-gen/routing/routing.js']), function (srcPaths) {
    return gulp.src(srcPaths)
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(concat(appJsFileName))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('target/www/js'));
}, ['build-routing-config']);

function compileJs(srcPathGlob, dstPath){
    return gulp.src(srcPathGlob)
        .pipe(babel())
        .pipe(gulp.dest(dstPath));
}

function findJavaScriptSourcePaths(basePath) {
    basePath = basePath || 'src';

    var sourcePaths = [
        'app/app.js',
        'app/q.js',
        'app/RoutingBuilder.js'
    ];

    sourcePaths = sourcePaths.concat([
        'presentation/**/*Const.js',
        'presentation/**/*Config.js',
        'presentation/**/*Controller.js',
        'presentation/**/*Directive.js',
        'presentation/**/*Filter.js',
        'service/*.js'
    ]);

	sourcePaths.push('access/**/*Access.js');

    for(var i = 0; i < sourcePaths.length; ++i){
        var sourcePath = sourcePaths[i];

        sourcePaths[i] = path.join(basePath, sourcePath);
    }

    return sourcePaths;
}

function babel(){
    return babelLib({
        presets: ['babel-preset-es2015'],
        compact: false,
        comments: true
    });
}

gulp.task('build-routing-config', function(){
    return routingConfigs.collectRoutingConfigs('src/presentation/views')
      .then(function(routings){
          return routingConfigs.renderRoutingAngularConfig('target/src-gen/routing/routing.js', routings);
      });
});

// the watch task must be defined after all watchTask.task(...) calls.
watchTasks.watch('watch');
