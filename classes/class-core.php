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
	private static $networks = array();

	/**
	 * Entry point of core class.
	 */
	public static function add_hooks() {
		add_action( 'init', array( __CLASS__, 'init_networks' ) );
		add_action( 'plugins_loaded', array( __CLASS__, 'load_textdomain' ) );

		// Init settings class.
		Settings::add_hooks();

		// Init metabox class.
		Metabox::add_hooks();

		// Init scheduler class.
		Scheduler::add_hooks();

		// Init dashboard class.
		Dashboard::add_hooks();
	}

	/**
	 * Load i18n files.
	 */
	public static function load_textdomain() {
		load_plugin_textdomain(
			'social-planner',
			false,
			dirname( plugin_basename( SOCIAL_PLANNER_FILE ) ) . '/languages/'
		);
	}

	/**
	 * Parse list of networks with its name as key and class as value.
	 */
	public static function init_networks() {
		$networks = array(
			'Social_Planner\Network_Telegram' => SOCIAL_PLANNER_DIR . '/networks/class-network-telegram.php',
			'Social_Planner\Network_Twitter'  => SOCIAL_PLANNER_DIR . '/networks/class-network-twitter.php',
			'Social_Planner\Network_VK'       => SOCIAL_PLANNER_DIR . '/networks/class-network-vk.php',
			'Social_Planner\Network_Facebook' => SOCIAL_PLANNER_DIR . '/networks/class-network-facebook.php',
		);

		/**
		 * Filter publishing networks.
		 * This lets third-parties either remove networks or their own
		 *
		 * @param array $networks A key-value array with class name key and path to the file as value
		 */
		$networks = apply_filters( 'social_planner_networks', $networks );

		/**
		 * For each filtered network try to include its class.
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

	/**
	 * Public method to get list of availible networks
	 */
	public static function get_networks() {
		return self::$networks;
	}

	/**
	 * Helper method to get network class by provider.
	 * Parse network by provider key and return proper class.
	 *
	 * @param string $key Provider key.
	 */
	public static function get_network_class( $key ) {
		$networks = self::$networks;

		// Parse index and network from provider key.
		preg_match( '/^(.+)-(\w+)$/', $key, $matches );

		if ( empty( $networks[ $matches[1] ] ) ) {
			return null;
		}

		return $networks[ $matches[1] ];
	}

	/**
	 * Helper method to get network label by class.
	 *
	 * @param string $class Network class name.
	 */
	public static function get_network_label( $class ) {
		// Just to avoid fatal errors.
		if ( ! defined( "$class::NETWORK_NAME" ) ) {
			return __( 'Untitled', 'social-planner' );
		}

		$label = $class::NETWORK_NAME;

		if ( method_exists( $class, 'get_label' ) ) {
			$label = $class::get_label();
		}

		/**
		 * Filters scheduled and sent datetime format.
		 *
		 * @param string $format Datetime format.
		 */
		return apply_filters( 'social_planner_network_label', $label );
	}

	/**
	 * Default datetime format for tasks.
	 */
	public static function time_format() {
		$format = get_option( 'date_format' ) . ' ' . get_option( 'time_format' );

		/**
		 * Filters scheduled and sent datetime format.
		 *
		 * @param string $format Datetime format.
		 */
		return apply_filters( 'social_planner_time_format', $format );
	}
}
