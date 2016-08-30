'use strict';

var gulp = require('gulp');

var $ = require('gulp-load-plugins')();

var wiredep = require('wiredep');
var karma = require('karma');

function runTests(configuration) {
  var Server = karma.Server;

  var server = new Server(configuration, function(exitCode) {
        console.log('Karma has exited with ' + exitCode)
        process.exit(exitCode)
    });

  server.on('browser_register', function (browser) {
    console.log('A new browser was registered')
  });

 return server.start();
}

gulp.task('test', function() {
  var bowerDeps = wiredep({
    directory: 'bower_components',
    exclude: ['bootstrap-sass-official'],
    dependencies: true,
    devDependencies: true
  });

  var testFiles = bowerDeps.js.concat([
    'src/app/**/*.js','src/components/**/*.js'
  ]);

  return runTests({configFile: __dirname + '/../karma.conf.js', files: testFiles})
});
