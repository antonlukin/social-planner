const gulp = require( 'gulp' );
const sass = require( 'gulp-sass' );
const cleanCss = require( 'gulp-clean-css' );
const sassGlob = require( 'gulp-sass-glob' );
const plumber = require( 'gulp-plumber' );
const prefix = require( 'gulp-autoprefixer' );
const uglify = require( 'gulp-uglify' );
const rename = require( 'gulp-rename' );
const babel = require( 'gulp-babel' );

const path = {
	source: './src/',
	assets: './assets/'
};

gulp.task( 'styles', ( done ) => {
	let styles = gulp.src([ path.source + '/styles/*.scss' ])
		.pipe( plumber() )
		.pipe( sassGlob({
			allowEmpty: true
		}) )
		.pipe( sass({
			errLogToConsole: true
		}) )
		.pipe( prefix() );

	styles
		.pipe( cleanCss({
			compatibility: 'ie9'
		}) )
		.pipe( rename( ( file ) => {
			file.basename = file.basename;
			file.extname = '.min.css';
		}) )
		.pipe( gulp.dest( path.assets + '/styles/' ) );

	styles
		.pipe( gulp.dest( path.assets + '/styles/' ) );

	done();
});

gulp.task( 'scripts', ( done ) => {
	let scripts = gulp.src( path.source + '/scripts/*.js' )
		.pipe( plumber() )
		.pipe( babel({
			presets: [ '@babel/env' ]
		}) );

	scripts
		.pipe( uglify() )
		.pipe( rename( ( file ) => {
			file.basename = file.basename;
			file.extname = '.min.js';
		}) )
		.pipe( gulp.dest( path.assets + '/scripts/' ) );

	scripts
		.pipe( gulp.dest( path.assets + '/scripts/' ) );

	done();
});

gulp.task( 'watch', () => {
	gulp.watch( './src/**/*', gulp.series( 'styles', 'scripts' ) );
});

gulp.task( 'build', ( done ) => {
	gulp.parallel( 'styles', 'scripts' );

	done();
});


gulp.task( 'default', gulp.parallel( 'styles', 'scripts', 'watch' ) );
