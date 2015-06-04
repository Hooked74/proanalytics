'use strict';
var $ = {};
var gulp = require('gulp');
var async = require('async');
var merge = require('event-stream').merge;

$.size = require('gulp-size');
$.autoprefixer = require('gulp-autoprefixer');
$.cache = require('gulp-cache');
$.clean = require('gulp-clean');
$.compass = require('gulp-compass');
$.imagemin = require('gulp-imagemin');
$.mocha = require('gulp-mocha');
$.plumber = require('gulp-plumber');
$.svgmin = require('gulp-svgmin');
$.uglify = require('gulp-uglify');
$.useref = require('gulp-useref');
$.livereload = require('gulp-livereload');
$.concat = require('gulp-concat');
$.browserify = require('gulp-browserify');
$.autopolyfiller = require('gulp-autopolyfiller');
$.order = require('gulp-order');
$.rev = require('gulp-rev');
$.revReplace = require('gulp-rev-replace');
$.gulpif = require('gulp-if');
$.htmlMinifier = require('gulp-html-minifier');


var _ = {
  app: 'public',
  dist: 'dist',
  test: 'test',
  scripts: ['system', 'login', 'error']
};
var compassOptions = {
  sass: _.app + "/styles",
  logging: false,
  debug: false,
  comments: false,
  sourcemap: false,
  image: _.app + "/images",
  css: _.app + '/.tmp'
};

var mod_env = 'development';
var spawn = require('child_process').spawn;
var fs = require("fs");
var node;

//|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//| ✓ createConfig
//'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('createConfig', function () {
  /*for (var i=_.scripts.length;i--;){
    var defaultConfigPath = './' + _.app + "/config.json";
    var configPath = './' + _.app + "/scripts/" + _.scripts[i] + "/config/config.json";
    if (fs.existsSync(configPath)) continue;
    fs.createReadStream(defaultConfigPath).pipe(fs.createWriteStream(configPath, { flags: 'w+'}));
  }*/
});
//|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//| ✓ changeAppConfig:dist
//'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('changeAppConfig:dist', function () {
  var config = require('./' + _.app + "/config.json");
  for (var i = _.scripts.length; i--;) {
    var configPath = './' + _.app + "/scripts/" + _.scripts[i] + "/config/index.json";
    config[_.scripts[i]].mode_debug = false;
    fs.writeFileSync(configPath, JSON.stringify(config[_.scripts[i]]));
  }
});
//|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//| ✓ changeAppConfig:dev
//'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('changeAppConfig:dev', function () {
  var config = JSON.parse(fs.readFileSync('./' + _.app + "/config.json"));
  for (var i = _.scripts.length; i--;) {
    var configPath = './' + _.app + "/scripts/" + _.scripts[i] + "/config/index.json";
    config[_.scripts[i]].mode_debug = true;
    fs.writeFileSync(configPath, JSON.stringify(config[_.scripts[i]]));
  }
});
//|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//| ✓ mocha
//'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('mocha', function () {
  return gulp.src('test/spec/*.js').pipe($.plumber())
    .pipe($.mocha({
      reporter: 'spec',
      ui: 'bdd',
      timeout: 10000,
      grep: /(test|front)/
    }));
});

//|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//| ✓ browserify
//'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
function browserify(script, path, isDist) {
  var brwfyConfig = {
    paths: [
      'node_modules',
      'public/scripts',
      'bower_components',
      'bower_components/bootstrap-sass-official/assets/javascripts'
    ]
  };

  if (isDist !== true) brwfyConfig.debug = true;

  var brwfy = gulp.src(_.app + '/scripts/' + script + '/main.js')
    .pipe($.browserify(brwfyConfig))
    .on('prebundle', function (bundler) {
      bundler.transform({
        engine: 'lodash'
      }, 'jstify');
    });

  var polyfills = brwfy.pipe($.autopolyfiller('result_polyfill_file.js'));

  if (script === 'system') {
    var withObserve = merge(polyfills,
        gulp.src(_.app + '/scripts/libs/Object.observe.poly.js'))
      .pipe($.order([
        'result_polyfill_file.js',
        'Object.observe.poly.js'
      ]));
  }

  polyfills = withObserve ? withObserve : polyfills;

  polyfills = polyfills
    .pipe($.plumber())
    .pipe($.concat(script + '-polyfills.js'));

  if (isDist === true) polyfills = polyfills.pipe($.uglify());

  polyfills
    .pipe(gulp.dest(path))
    .pipe($.size());

  brwfy = brwfy
    .pipe($.plumber())
    .pipe($.concat(script + '.js'));

  if (isDist === true) brwfy = brwfy.pipe($.uglify());

  return brwfy
    .pipe(gulp.dest(path))
    .pipe($.size());
}

var browserifyTaskList = [],
  browserifyTask;
for (var i = _.scripts.length; i--;) {
  browserifyTask = 'browserify:' + _.scripts[i];
  gulp.task(browserifyTask,
    browserify.bind(null, _.scripts[i], _.app + '/.tmp/scripts'));
  browserifyTaskList.push(browserifyTask);
}

gulp.task('browserify', browserifyTaskList);

//|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//| ✓ styles
//'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

function style(dir) {
  dir || (dir = "*");
  return gulp.src(_.app + '/styles/' + dir + '.{scss,sass,less}')
    .pipe($.plumber())
    .pipe($.compass(compassOptions))
    .pipe($.autoprefixer({
      browsers: ['last 4 versions', 'IE >= 8', 'Firefox ESR', 'Opera 12.1'],
      cascade: false
    }))
    .pipe(gulp.dest(_.app + '/.tmp'))
    .pipe($.size());
}

function compassDevSettings() {
  compassOptions.debug = true;
  compassOptions.logging = true;
  compassOptions.sourcemap = true;
}

for (var i = _.scripts.length; i--;) {
  gulp.task('compass:dev:' + _.scripts[i], function () {
    compassDevSettings();
    return style(_.scripts[i]);
  });
}

gulp.task('compass:dev', function () {
  compassDevSettings();
  return style();
});

gulp.task('compass:dist', function () {
  compassOptions.style = 'compressed';
  compassOptions.environment = 'production';
  return style();
});


//|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//| ✓ svg
//'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('svg:dist', function () {
  gulp.src(_.app + '/images/**/*.svg')
    .pipe($.plumber())
    .pipe($.svgmin([
      {
        collapseGroups: false
      },
      {
        moveGroupAttrsToElems: false
      },
      {
        moveElemsAttrsToGroup: false
      },
      {
        mergePaths: false
      },
      {
        removeHiddenElems: false
      }
    ]))
    .pipe(gulp.dest(_.dist + '/images'))
    .pipe($.size());

  return gulp.src([
            _.app + '/styles/fonts/**/*.svg',
            'bower_components/bootstrap-sass-official/assets/fonts/bootstrap/*.svg'
        ])
    .pipe($.plumber())
    .pipe($.svgmin([{
      removeDoctype: false
        }, {
      removeComments: false
        }]))
    .pipe(gulp.dest(_.dist + '/styles/fonts'))
    .pipe($.size());
});

//|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//| ✓ images
//'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('images:dist', function () {
  gulp.src(_.app + '/*.{png,jpg,jpeg,gif,ico}')
    .pipe($.plumber())
    .pipe($.cache($.imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest(_.dist))
    .pipe($.size());

  return gulp.src(_.app + '/images/**/*.{png,jpg,jpeg,gif,ico}')
    .pipe($.plumber())
    .pipe($.cache($.imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest(_.dist + '/images'))
    .pipe($.size());
});

//|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//| ✓ html
//'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('html', function () {
  var assets = $.useref.assets();
  gulp.src([
      _.app + '/*.{json,txt}',
      '!' + _.app + '/config.json'
    ])
    .pipe(gulp.dest(_.dist));

  gulp.src([
      _.app + '/langs/*.json'
    ])
    .pipe(gulp.dest(_.dist + "/langs"));

  gulp.src([
            _.app + '/styles/fonts/**/*.{woff,ttf,eot}',
            'bower_components/bootstrap-sass-official/assets/fonts/bootstrap/*.{woff,ttf,eot}'
        ])
    .pipe(gulp.dest(_.dist + '/styles/fonts'));
  
  gulp.src([
            _.app + '/sound/*'
        ])
    .pipe(gulp.dest(_.dist + '/sound'));

  return gulp.src([_.app + '/*.html'])
    .pipe($.plumber())
    .pipe(assets)
    .pipe($.gulpif('*.js', $.uglify()))
    .pipe($.rev())
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.revReplace({
      replaceInExtensions: ['.html'],
      canonicalUris: true
    }))
    .pipe(gulp.dest(_.dist))
    .pipe($.size());
});

gulp.task('htmlRoot', ['html'], function () {
  return gulp.src([_.dist + '/*.html'])
    .pipe($.htmlMinifier({
      removeComments: true,
      collapseWhitespace: true,
      minifyJS: true,
      minifyCSS: true
    }))
    .pipe(gulp.dest(_.dist))
    .pipe($.size());
});

//|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//| ✓ clean
//'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
function clean(otherDir) {
  var dir = [_.app + '/.tmp'];
  if (otherDir) dir = dir.concat(otherDir);
  return gulp.src(dir, {
    read: false
  }).pipe($.clean());
}

gulp.task('clean:dist', function () {
  return clean(_.dist);
});

gulp.task('clean:dev', function () {
  return clean();
});

//|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//| ✓ watch
//'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('watch', function () {
  // Watch for changes in `app` dir
  $.livereload.listen();
  gulp.watch([
      '*.js',
      '!gulpfile.js',
      'back-end/**/*.{js,json,xml,sql}'
  ], function () {
    gulp.start('noderestart');
  });

  gulp.watch([_.app + '/config.json'], ['changeAppConfig:dev']);

  gulp.watch('gulpfile.js', function () {
    node.kill();
    process.exit(0);
  });

  gulp.watch([
    _.app + '/*.{html,txt}',
    _.app + '/.tmp/styles/*.css',
    _.app + '/images/**/*.{png,jpg,jpeg,gif,ico}'
  ]).on('change', $.livereload.changed);

  // Watch style files
  gulp.watch([
    _.app + '/styles/error/*.{sass,scss}',
    _.app + '/styles/error.{sass,scss}'
  ], ['compass:dev:error']);
  gulp.watch([
    _.app + '/styles/system/*.{sass,scss}',
    _.app + '/styles/system.{sass,scss}'
  ], ['compass:dev:system']);
  gulp.watch([
    _.app + '/styles/home/*.{sass,scss}',
    _.app + '/styles/home.{sass,scss}'
  ], ['compass:dev:home']);
  gulp.watch([
    _.app + '/styles/login/*.{sass,scss}',
    _.app + '/styles/login.{sass,scss}'
  ], ['compass:dev:login']);
  gulp.watch([
    _.app + '/styles/beyond/*.{sass,scss}',
    _.app + '/styles/fonts/*.{sass,scss}'
  ], ['compass:dev']);

  for (var i = _.scripts.length; i--;) {
    gulp.watch(
      _.app + '/scripts/' + _.scripts[i] + '/**/*.{js,tpl,html,json}',
      function (inc) {
        async.series([
          function (callback) {
            gulp.start('browserify:' + _.scripts[inc], function () {
              callback(null);
            });
          }
          ], function () {
          $.livereload.changed();
        });
      }.bind(null, i));
  }
});

//|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//| ✓ server
//'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

gulp.task('noderestart', function () {
  if (node) node.kill();
  node = spawn('node', ['multi-server.js'], {
    stdio: 'inherit',
    env: {
      NODE_ENV: mod_env
    }
  });
  node.on('error', function (err) { console.log(err); });
  node.on('close', function (code) {
    if (code === 8) {
      console.log('Error detected, waiting for changes...');
    }
  });
});

gulp.task('server:dev', ['browserify', 'compass:dev'], function () {
  mod_env = 'development';
  gulp.start('noderestart', 'watch');
});

gulp.task('server:dist', function () {
  mod_env = 'production';
  gulp.start('noderestart');
});

gulp.task('server:test', function () {
  mod_env = 'test';
  gulp.start('noderestart');
});


//|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//| ✓ development
//'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

gulp.task('development', ['clean:dev', 'changeAppConfig:dev'], function () {
  gulp.start('server:dev');
});

//|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//| ✓ test
//'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
gulp.task('test', ['server:test'], function () {
  gulp.start('mocha');
});

//|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//| ✓ production
//'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

gulp.task('build', [
    'browserify',
    'compass:dist',
    'images:dist',
    'svg:dist'
], function () {
  gulp.start('htmlRoot', 'server:dist');
});

gulp.task('default', ['clean:dist', 'changeAppConfig:dist'], function () {
  gulp.start('build');
});
