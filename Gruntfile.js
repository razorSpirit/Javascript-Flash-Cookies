/*jshint node: true, browser: false*/
"use strict";
module.exports = function(grunt) {
    var _ = require('lodash');

    function browserVersions(browser, min, max) {
        return _.map(_.range(min, max), function(v) {
            return {
                browserName: browser,
                version: v
            };
        });
    }

    function browserPlatforms(browsers, platforms) {
        return _.flatten(_.map(browsers, function(browser) {
            return _.map(platforms, function(p) {
                return {
                    browserName: browser,
                    platform: p
                };
            });
        }));

    }

    var scripts = ["*.js", "src/*.js", "tests/spec/*.js"];

    grunt.loadNpmTasks('grunt-saucelabs');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-newer');

    // Project configuration.
    grunt.initConfig({

        uglify: {
            options: {
                mangle: false
            },
            swfstore: {
                files: {
                    'dist/swfstore.min.js': ['src/swfstore.js']
                }
            }
        },

        "jsbeautifier": {
            "rewrite": {
                src: scripts
            },
            "verify": {
                src: scripts,
                options: {
                    mode: "VERIFY_ONLY"
                }
            }
        },

        "jshint": {
            options: {
                jshintrc: true
            },
            scripts: scripts
        },

        swf: {
            options: {
                "flex-sdk-path": './flex-sdk'
            },
            'dist/storage.swf': 'src/Storage.as'
        },

        connect: {
            // runs the server for the duration of the test. 
            uses_defaults: {
                options: {
                    port: 8000,
                    base: './'
                }
            },
            test: {
                options: {}
            },
            serve: {
                options: {
                    keepalive: true
                }
            }
        },

        'saucelabs-jasmine': {
            all: {
                options: {
                    username: 'jsfc', // if not provided it'll default to ENV SAUCE_USERNAME
                    key: '53b0264d-afb9-449c-8dfc-94eff9593511', // if not provided it'll default to ENV SAUCE_ACCESS_KEY
                    urls: ['http://127.0.0.1:8000/tests/SpecRunner.html'],
                    build: process.env.TRAVIS_JOB_ID,
                    concurrency: 3, //'Number of concurrent browsers to test against. Will default to the number of overall browsers specified. Check your plan (free: 2, OSS: 3) and make sure you have got sufficient Sauce Labs concurrency.',
                    detailedError: true, //'false (default) / true; if true log detailed test results when a test error occurs',
                    testname: 'SwfStore',
                    sauceConfig: {
                        // https://docs.saucelabs.com/reference/test-configuration/
                        'video-upload-on-pass': false
                    },
                    // https://saucelabs.com/platforms
                    browsers: browserVersions('internet explorer', 6, 11) // browser, start version, end version
                        .concat(browserVersions('safari', 7, 8))
                        // there's a bug with running the chrome tests on sauce labs
                        // for some reason, the test result is requested *immediately*, before the tests have executed
                        .concat(browserPlatforms([/*'chrome',*/ 'firefox'], ['OS X 10.10', 'Windows 8.1', 'linux']))
                        .concat([{
                            browserName: 'opera'
                        }])
                }
            }
        }
    });




    grunt.registerTask('test', ['jshint', 'jsbeautifier:verify', 'connect:test', 'saucelabs-jasmine']);
    grunt.registerTask('build', ['newer:uglify', 'newer:swf']);
    grunt.registerTask('force-build', ['uglify', 'swf']);
    grunt.registerTask('beautify', ['jsbeautifier:rewrite']);
    grunt.registerTask('pre-commit', ['jshint', 'jsbeautifier:verify', 'build']);

};
