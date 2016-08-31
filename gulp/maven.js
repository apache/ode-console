'use strict';

var gulp = require('gulp'),
    maven = require('maven-deploy'),
    config = require('../maven-config.json');

//install on local maven repo
gulp.task('install', function() {
    maven.config(config);
    return maven.install();
});

//Snapshot release to Apache, used by CI server
gulp.task('snapshot', function() {
    maven.config(config);
    return maven.deploy('apache-snapshot-repo',true);
});

//Actual release to Apache repo
gulp.task('release', function() {
    maven.config(config);
    return maven.deploy('apache-release-repo');
});