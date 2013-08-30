module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-angular-templates');

	grunt.initConfig({
		concat: {
			options: {separator: ';'},
			js: {
				src: [
					'app/lib/angular-route.js',
					'app/lib/curry.js',
					'app/lib/rb_util.js',
					'app/lib/rb_ui.js',
					'app/js/**/*.js',
					'.build/templates.js'
				],
				dest: '.build/app.js'
			},
			dev: {
				src: ['app/lib/angular.js', '.build/app.js'],
				dest: '.build/app.js'
			},
			prod: {
				src: ['app/lib/angular.min.js', '.build/app.js'],
				dest: '.build/app.js'
			}
		},
		uglify: {
			js: {
				options: {
					report: 'min'
				},
				files: {
					'.build/app.js': '.build/app.js'
				}
			}
		},
		less: {
			dev: {
				files: {
					'public/css/app.css': 'app/css/app.less'
				}
			},
			prod: {
				options: { yuicompess: true },
				files: {
					'public/css/app.css': 'app/css/app.less'
				}
			}
		},
		copy: {
			app: {
				files: [{src: ['.build/app.js'], dest: 'public/js/app.js'}]
			},
			index: {
				options: {processContent: processIndex},
				files: [{src: ['app/index.html'], dest: 'public/index.html'}]
			}
		},
		ngtemplates: {
			'drop': {
				options: {
					base: 'app/views'
				},
				src: ['app/views/**/*.html'],
				dest: '.build/templates.js'
			}
		},
		watch: {
			files: [
				'app/index.html',
				'app/views/**/**/*.html',
				'app/js/**/*.js',
				'app/lib/**/*.js',
				'app/css/**/*.css',
				'app/css/**/*.less'
			],
			tasks: 'default'
		}
	});

	grunt.registerTask('default', [
		'less:dev', 'ngtemplates', 'concat:js', 'concat:dev', 'copy'
	]);

	grunt.registerTask('prod', [
		'less:prod', 'ngtemplates', 'concat:js', 'uglify', 'concat:prod', 'copy'
	]);

	function processIndex(content, srcPath) {
		var ts = Date.now();
		return content.replace(/##TIMESTAMP##/g, ts);
	}

};
