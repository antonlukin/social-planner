const gulp = require( 'gulp' );
const sass = require( 'gulp-sass' );
const sassGlob = require( 'gulp-sass-glob' );
const plumber = require( 'gulp-plumber' );
const prefix = require( 'gulp-autoprefixer' );
const babel = require( 'gulp-babel' );

const path = {
	source: './src/',
	assets: './assets/',
};

gulp.task( 'styles', ( done ) => {
	const styles = gulp
		.src( [ path.source + '/styles/*.scss' ] )
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

	styles.pipe( gulp.dest( path.assets + '/styles/' ) );

	done();
} );

gulp.task( 'scripts', ( done ) => {
	const scripts = gulp
		.src( path.source + '/scripts/*.js' )
		.pipe( plumber() )
		.pipe(
			babel( {
				presets: [ '@babel/env' ],
			} )
		);

	scripts.pipe( gulp.dest( path.assets + '/scripts/' ) );

	done();
} );

gulp.task( 'watch', () => {
	gulp.watch( './src/**/*', gulp.series( 'styles', 'scripts' ) );
} );

gulp.task( 'build', ( done ) => {
	gulp.parallel( 'styles', 'scripts' );

	done();
} );

gulp.task( 'default', gulp.parallel( 'styles', 'scripts', 'watch' ) );
