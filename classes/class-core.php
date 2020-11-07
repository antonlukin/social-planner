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
	 * Store list of publishing networks.
	 *
	 * @var array
	 */
	public static $networks = array();

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
		self::get_networks();

		// Init settings class.
		Settings::add_hooks();
	}

	/**
	 * Parse list of networks with its name as key and class as value.
	 */
	public static function get_networks() {
		$networks = array(
			'Social_Planner\Network_Telegram' => SOCIAL_PLANNER_DIR . '/networks/class-network-telegram.php',
			'Social_Planner\Network_Twitter'  => SOCIAL_PLANNER_DIR . '/networks/class-network-twitter.php',
		);

		/**
		 * Filter publishing networks.
		 * This lets third-parties either remove networks or their own
		 *
		 * @param array $networks A key-value array with class name key and path to the file as value
		 */
		$networks = apply_filters( 'social_planner_networks', $networks );

		/**
		 * For each filtered network
		 */
		foreach ( $networks as $class => $path ) {
			include_once $path;

			/**
			 * Add class to networks list with its name as key.
			 */
			if ( defined( "$class::NETWORK_NAME" ) ) {
				self::$networks[ $class::NETWORK_NAME ] = $class;
			}
		}
	}
}
