module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	parserOptions: {
		ecmaVersion: 12,
	},
	rules: {
		indent: [ 'error', 'tab' ],
		'linebreak-style': [ 'error', 'unix' ],
		quotes: [ 'error', 'single' ],
		semi: [ 'error', 'always' ],
		'max-len': [ 'error', { code: 120 } ],
		'no-global-event-listener': 'disable',
	},
	ignorePatterns: [ 'docs/*.js', 'assets/scripts/*.js' ],
};
