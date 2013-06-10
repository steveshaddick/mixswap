'use strict';

module.exports = function(grunt) {

  var ASSET_PATH = "mixswap/static";
  var SRC_PATH = 'src';

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    
    compass: {
      d: {
        options: {
          sassDir: SRC_PATH + '/scss/',
          cssDir: ASSET_PATH + '/css',
          imagesDir: ASSET_PATH + '/img',
          outputStyle: 'compressed',
          environment: 'production'
        }
      }
    },

    uglify: {
        dev: {
          options: {
            preserveComments: 'some',
            compress: false,
            beautify: true
          },
          files: {
            '<%= ASSET_PATH %>/js/plugins.min.js' : [
            ],
            '<%= ASSET_PATH %>/js/Main.min.js': [
              'js/Main.js'
            ]
          }
        },
        prod: {
          options: {
            preserveComments: 'some'
          },
          files: {
            '<%= ASSET_PATH %>/js/plugins.min.js' : [
            ],
            '<%= ASSET_PATH %>/js/Main.min.js': [
              'js/Main.js'
            ]
          }
        }
      },
    watch: {
      styles: {
        files: SRC_PATH + 'scss/*.scss',
        tasks: ['compass'],
        options: {
          interrupt: true
        }
      },
      scripts: {
        files: SRC_PATH + 'js/**/*.js',
        tasks: ['uglify:dev'],
        options: {
          interrupt: true
        }
      }
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-compass');

  // Default task.
  grunt.registerTask('default', ['watch']);
  grunt.registerTask('prod', ['compass', 'uglify:prod']);

};
