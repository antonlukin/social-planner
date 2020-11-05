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
	 * Social planner options name.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'social_planner_settings';

	/**
	 * Add hooks for settings page.
	 */
	public static function add_hooks() {
		add_action( 'admin_menu', array( __CLASS__, 'add_menu' ) );

		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_styles' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_scripts' ) );
	}

	/**
	 * Add plugin page in WordPress menu.
	 */
	public static function add_menu() {
		add_submenu_page(
			'options-general.php',
			esc_html__( 'Social Planner settings', 'social-planner' ),
			esc_html__( 'Social Planner', 'social-planner' ),
			'manage_options',
			SOCIAL_PLANNER_SLUG,
			array( __CLASS__, 'display_settings' )
		);
	}

	/**
	 * Show plugin settings
	 */
	public static function display_settings() {
		if ( ! self::is_options_screen() ) {
			return;
		}

		include_once SOCIAL_PLANNER_DIR . '/templates/settings.php';
	}

	/**
	 * Enqueue settings styles.
	 */
	public static function enqueue_styles() {
		if ( ! self::is_options_screen() ) {
			return;
		}

		wp_enqueue_style(
			'social-planner-settings',
			SOCIAL_PLANNER_URL . '/assets/styles/settings.min.css',
			array(),
			SOCIAL_PLANNER_VERSION,
			'all'
		);
	}

	/**
	 * Enqueue settings scripts.
	 */
	public static function enqueue_scripts() {
		if ( ! self::is_options_screen() ) {
			return;
		}

		$object = array();

		/**
		 * Find and append settings from each provider.
		 */
		foreach ( Core::$providers as $name => $class ) {
			if ( ! method_exists( $class, 'get_fields' ) ) {
				continue;
			}

			if ( ! method_exists( $class, 'get_label' ) ) {
				continue;
			}

			// Add required provder fields.
			$object['fields'][ $name ] = $class::get_fields();

			// Add required provider label.
			$object['labels'][ $name ] = $class::get_label();

			if ( method_exists( $class, 'get_helper' ) ) {
				$object['helpers'][ $name ] = $class::get_helper();
			}
		}

		wp_enqueue_script(
			'social-planner-settings',
			SOCIAL_PLANNER_URL . '/assets/scripts/settings.min.js',
			array( 'wp-i18n' ),
			SOCIAL_PLANNER_VERSION,
			true
		);

		wp_localize_script( 'social-planner-settings', 'socialPlannerSettings', $object );
	}

	/**
	 * Is current admin screen the plugin options screen.
	 *
	 * @return bool
	 */
	private static function is_options_screen() {
		$current_screen = get_current_screen();

		if ( $current_screen && self::SCREEN_ID === $current_screen->id ) {
			return true;
		}

		return false;
	}
}
