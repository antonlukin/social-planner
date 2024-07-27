<?php
/**
 * Settings page class
 *
 * @package social-planner
 * @author  Anton Lukin
 */

namespace Social_Planner;

if ( ! defined( 'ABSPATH' ) ) {
	die;
}

/**
 * Settings page class
 */
class Settings {
	/**
	 * Admin screen id.
	 *
	 * @var string
	 */
	const SCREEN_ID = 'settings_page_social-planner';

	/**
	 * Settings page.
	 *
	 * @var string
	 */
	const PAGE = 'social-planner';

	/**
	 * Social Planner providers options group.
	 *
	 * @var string
	 */
	const GROUP_PROVIDERS = 'social_planner_providers';

	/**
	 * Social Planner providers options name.
	 *
	 * @var string
	 */
	const OPTION_PROVIDERS = 'social_planner_providers';

	/**
	 * Add hooks for settings page.
	 */
	public static function add_hooks() {
		add_action( 'admin_menu', array( __CLASS__, 'add_menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'init_settings' ) );

		// Add settings link to plugins list.
		add_filter( 'plugin_action_links', array( __CLASS__, 'add_settings_link' ), 10, 2 );

		// Sanitize options before save.
		add_action( 'pre_update_option', array( __CLASS__, 'sanitize_option' ), 10, 2 );
	}

	/**
	 * Add settings link to plugins list.
	 *
	 * @param array  $actions     An array of plugin action links.
	 * @param string $plugin_file Path to the plugin file relative to the plugins directory.
	 */
	public static function add_settings_link( $actions, $plugin_file ) {
		$actions = (array) $actions;

		if ( plugin_basename( SOCIAL_PLANNER_FILE ) === $plugin_file ) {
			$actions[] = sprintf(
				'<a href="%s">%s</a>',
				admin_url( 'options-general.php?page=' . self::PAGE ),
				__( 'Settings', 'social-planner' )
			);
		}

		return $actions;
	}

	/**
	 * Add plugin settings page in WordPress menu.
	 */
	public static function add_menu() {
		/**
		 * Easy way to hide settings page.
		 *
		 * @param bool $hide_settings Set true to hide settings page.
		 */
		$hide_settings = apply_filters( 'social_planner_hide_settings', false );

		if ( $hide_settings ) {
			return;
		}

		add_submenu_page(
			'options-general.php',
			esc_html__( 'Social Planner settings', 'social-planner' ),
			esc_html__( 'Social Planner', 'social-planner' ),
			'manage_options',
			SOCIAL_PLANNER_SLUG,
			array( __CLASS__, 'display_settings' )
		);

		// Add required assets and objects.
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_styles' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_scripts' ) );
	}

	/**
	 * Show plugin settings.
	 */
	public static function display_settings() {
		if ( ! self::is_settings_screen() ) {
			return;
		}

		include_once SOCIAL_PLANNER_DIR . '/templates/settings.php';
	}

	/**
	 * Init settings page.
	 */
	public static function init_settings() {
		register_setting( self::GROUP_PROVIDERS, self::OPTION_PROVIDERS );
	}

	/**
	 * Enqueue settings styles.
	 */
	public static function enqueue_styles() {
		if ( ! self::is_settings_screen() ) {
			return;
		}

		wp_enqueue_style(
			'social-planner-settings',
			SOCIAL_PLANNER_URL . '/styles/settings.css',
			array(),
			SOCIAL_PLANNER_VERSION,
			'all'
		);
	}

	/**
	 * Enqueue settings scripts.
	 */
	public static function enqueue_scripts() {
		if ( ! self::is_settings_screen() ) {
			return;
		}

		wp_enqueue_script(
			'social-planner-settings',
			SOCIAL_PLANNER_URL . '/scripts/settings.js',
			array( 'wp-i18n' ),
			SOCIAL_PLANNER_VERSION,
			true
		);

		wp_set_script_translations(
			'social-planner-settings',
			'social-planner',
			plugin_dir_path( SOCIAL_PLANNER_FILE ) . 'languages'
		);

		wp_localize_script( 'social-planner-settings', 'socialPlannerSettings', self::create_script_object() );
	}

	/**
	 * Get options from database.
	 */
	public static function get_providers() {
		$providers = get_option( self::OPTION_PROVIDERS, array() );

		// Users can override providers settings with constant.
		if ( defined( 'SOCIAL_PLANNER_PROVIDERS' ) ) {
			$providers = SOCIAL_PLANNER_PROVIDERS;
		}

		/**
		 * Filter list of providers from options.
		 *
		 * @param array $providers List of provders options.
		 */
		return apply_filters( 'social_planner_get_providers', $providers );
	}

	/**
	 * Create scripts object to inject on settings page.
	 */
	private static function create_script_object() {
		$object = array(
			'option' => self::OPTION_PROVIDERS,
		);

		$networks = Core::get_networks();

		foreach ( $networks as $name => $class ) {
			$network = array();

			// Get network label by class.
			$network['label'] = Core::get_network_label( $class );

			if ( method_exists( $class, 'get_fields' ) ) {
				$network['fields'] = $class::get_fields();
			}

			if ( method_exists( $class, 'get_helper' ) ) {
				$network['helper'] = $class::get_helper();
			}

			$object['networks'][ $name ] = $network;
		}

		$object['providers'] = self::get_providers();

		/**
		 * Filter settings script object.
		 *
		 * @param array $object Array of settings script object.
		 */
		return apply_filters( 'social_planner_settings_object', $object );
	}

	/**
	 * Filters an option before its value is (maybe) serialized and updated.
	 *
	 * @param mixed  $value The new, unserialized option value.
	 * @param string $name  Option name.
	 * @return array
	 */
	public static function sanitize_option( $value, $name ) {
		if ( self::OPTION_PROVIDERS !== $name ) {
			return $value;
		}

		$sanitized = array();

		foreach ( $value as $key => $field ) {
			$key = sanitize_key( $key );

			// Sanitize values.
			$sanitized[ $key ] = array_map( 'sanitize_text_field', $field );
		}

		return $sanitized;
	}

	/**
	 * Is current admin screen the plugin options screen.
	 *
	 * @return bool
	 */
	private static function is_settings_screen() {
		$current_screen = get_current_screen();

		if ( $current_screen && self::SCREEN_ID === $current_screen->id ) {
			return true;
		}

		return false;
	}
}
