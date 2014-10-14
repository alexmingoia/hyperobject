/*!
 * hyperobject
 * https://github.com/alexmingoia/hyperobject
 */

'use strict';

var gulp = require('gulp');
var Browserify = require('browserify');
var buffer = require('vinyl-buffer');
var coveralls = require('gulp-coveralls');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var instrument = require('gulp-instrument');
var fs = require('fs');
var source = require('vinyl-source-stream');
var spawn = require('child_process').spawn;
var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var jsdoc2md = require('jsdoc-to-markdown');

gulp.task('jshint', function () {
  return gulp.src(['lib/**/*.js', 'test/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

gulp.task('wrap-umd', function() {
  var bundler = new Browserify({
    standalone: 'hyperobject'
  });

  bundler.add('./lib/hyperobject.js');
  bundler.exclude('../lib-cov/hyperobject');

  return bundler.bundle()
    .pipe(source('hyperobject.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('browserify-tests', function() {
  var bundler = new Browserify();

  bundler.add('./test/hyperobject.js');
  bundler.exclude('../lib-cov/hyperobject');

  return bundler.bundle()
    .pipe(source('tests.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('mocha-phantomjs', ['browserify-tests'], function() {
  return gulp.src('test/hyperobject.html')
    .pipe(mochaPhantomJS({
      mocha: {
        timeout: 6000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'spec'
      }
    }));
});

gulp.task('test', ['mocha-phantomjs'], function () {
  return gulp.src('dist/tests.js').pipe(clean());
});

gulp.task('instrument', function() {
  return gulp.src('lib/**/*.js')
    .pipe(instrument())
    .pipe(gulp.dest('lib-cov'));
});

gulp.task('docs', function(done) {
  jsdoc2md.render('./lib/*.js', {
    template: './lib/readme.hbs'
  })
  .on('error', done)
  .on('end', done)
  .pipe(fs.createWriteStream('README.md'))
});

gulp.task('coverage', ['instrument'], function() {
  process.env.JSCOV = true;
  return spawn('./node_modules/gulp-mocha-phantomjs/node_modules/mocha-phantomjs/node_modules/mocha/bin/mocha', [
    'test', '--reporter', 'html-cov'
  ]).stdout
    .pipe(source('coverage.html'))
    .pipe(gulp.dest('./'));
});

gulp.task('coveralls', ['instrument'], function(done) {
  if (!process.env.COVERALLS_REPO_TOKEN) {
    return done(new Error("No COVERALLS_REPO_TOKEN set."));
  }

  process.env.JSCOV=1;

  var err = '';

  var mocha = spawn('node_modules/gulp-mocha-phantomjs/node_modules/mocha-phantomjs/node_modules/mocha/bin/mocha', [
    'test', '--reporter', 'mocha-lcov-reporter'
  ]);

  mocha.stderr.on('data', function(chunk) {
    err += chunk;
  });

  mocha.stdout
    .pipe(source('lcov.json'))
    .pipe(buffer())
    .pipe(coveralls());

  mocha.on('close', function(code) {
    if (code) {
      if (err) return done(new Error(err));

      return done(new Error(
        "Failed to send lcov data to coveralls."
      ));
    }

    done();
  });
});

gulp.task('watch', ['jshint', 'test'], function () {
  gulp.watch(['lib/**/*.js', 'test/**/*.js'], ['jshint', 'test']);
});

gulp.task('clean', function() {
  return gulp.src(['lib-cov', 'coverage.html', 'npm-debug.log']).pipe(clean());
});

gulp.task('default', ['watch']);
