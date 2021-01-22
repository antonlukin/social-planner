const gulp = require( 'gulp' );
const grunt = require( 'grunt' );
const sass = require( 'gulp-sass' );
const sassGlob = require( 'gulp-sass-glob' );
const plumber = require( 'gulp-plumber' );
const prefix = require( 'gulp-autoprefixer' );
const babel = require( 'gulp-babel' );

/**
 * Create styles file from sources/
 */
gulp.task( 'styles', ( done ) => {
	const styles = gulp
		.src( 'src/styles/*.scss' )
		.pipe( plumber() )
		.pipe(
			sassGlob( {
				allowEmpty: true,
			} )
		)
		.pipe(
			sass( {
				errLogToConsole: true,
			} )
		)
		.pipe( prefix() );

	styles.pipe( gulp.dest( 'assets/styles/' ) );

	done();
} );

/**
 * Create scripts file from sources.
 */
gulp.task( 'scripts', ( done ) => {
	const scripts = gulp
		.src( 'src/scripts/*.js' )
		.pipe( plumber() )
		.pipe(
			babel( {
				presets: [ '@babel/env' ],
			} )
		);

	scripts.pipe( gulp.dest( 'assets/scripts/' ) );

	done();
} );

/**
 * Convert readme.txt to README.md file.
 */
gulp.task( 'readme', ( done ) => {
	grunt.initConfig( {
		wp_readme_to_markdown: {
			your_target: {
				files: {
					'README.md': 'readme.txt',
				},
				options: {
					screenshot_url:
						// eslint-disable-next-line max-len
						'https://github.com/antonlukin/social-planner/blob/master/.wordpress-org/{screenshot}.png?raw=true',

					post_convert( readme ) {
						return readme.replace( new RegExp( '^(#.+?#).+? ##', 'is' ), '$1' );
					},
				},
			},
		},
	} );

	grunt.loadNpmTasks( 'grunt-wp-readme-to-markdown' );

	grunt.tasks( [ 'wp_readme_to_markdown' ], { gruntfile: false }, () => {
		done();
	} );
} );

/**
 * Watch soruces and update styles and scripts
 */
gulp.task( 'watch', () => {
	gulp.watch( './src/**/*', gulp.series( 'styles', 'scripts' ) );
} );

/**
 * Build static files
 */
gulp.task( 'build', gulp.series( 'styles', 'scripts' ) );

/**
 * Build static files and watch changes by default.
 */
gulp.task( 'default', gulp.series( 'styles', 'scripts', 'watch' ) );
