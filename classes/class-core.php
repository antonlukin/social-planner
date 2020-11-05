<?php
/**
 * Core plugin class for Social Planner
 *
 * @package social-planner
 * @author  Anton Lukin
 */

namespace Social_Planner;

if ( ! defined( 'ABSPATH' ) ) {
	die;
}

/**
 * Social Planner Core class
 */
class Core {
	/**
	 * Store list of publishing providers.
	 *
	 * @var array
	 */
	public static $providers = array();

	/**
	 * Entry point of core class.
	 */
	public static function add_hooks() {
		add_action( 'init', array( __CLASS__, 'init_classes' ) );
	}

	/**
	 * Init required plugin classes.
	 */
	public static function init_classes() {
		self::get_providers();

		// Init settings class.
		Settings::add_hooks();
	}

	/**
	 * Parse list of providers with its name as key and class as value.
	 */
	public static function get_providers() {
		$providers = array(
			'Social_Planner\Provider_Telegram' => SOCIAL_PLANNER_DIR . '/providers/class-provider-telegram.php',
			'Social_Planner\Provider_Twitter'  => SOCIAL_PLANNER_DIR . '/providers/class-provider-twitter.php',
		);

		/**
		 * Filter publishing providers.
		 * This lets third-parties either remove providers or their own
		 *
		 * @param array $providers A key-value array with class name key and path to the file as value
		 */
		$providers = apply_filters( 'social_planner_providers', $providers );

		/**
		 * For each filtered provider
		 */
		foreach ( $providers as $class => $path ) {
			include_once $path;

			/**
			 * Add class to providers list with its name as key.
			 */
			if ( defined( "$class::PROVIDER_NAME" ) ) {
				self::$providers[ $class::PROVIDER_NAME ] = $class;
			}
		}
	}
}
