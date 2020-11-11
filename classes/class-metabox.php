<?php
/**
 * Metabox class
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
class Metabox {
	/**
	 * Admin screen id.
	 *
	 * @var string
	 */
	const METABOX_ID = 'social-planner-metabox';

	/**
	 * Social planner providers options name.
	 *
	 * @var string
	 */
	const META_PROVIDERS = '_social_planner_providers';

	/**
	 * Add hooks for settings page.
	 */
	public static function add_hooks() {
		add_action( 'add_meta_boxes', array( __CLASS__, 'add_metabox' ) );

		// Add required assets and objects.
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_styles' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_scripts' ) );
	}

	/**
	 * Add plugin page in WordPress menu.
	 */
	public static function add_metabox() {
		add_meta_box(
			self::METABOX_ID,
			esc_html__( 'Social Planner', 'social-planner' ),
			array( __CLASS__, 'display_metabox' ),
			self::get_post_types(),
			'advanced'
		);
	}

	/**
	 * Show plugin settings.
	 */
	public static function display_metabox() {
		printf(
			'<p class="hide-if-js">%s</p>',
			esc_html__( 'This metabox requires JavaScript. Enable it in your browser settings, please.', 'social-planner' ),
		);

		wp_nonce_field( 'social_planner_metabox', 'social_planner_metabox_nonce' );
	}

	/**
	 * Enqueue metabox styles.
	 *
	 * @param string $hook_suffix The current admin page.
	 */
	public static function enqueue_styles( $hook_suffix ) {
		if ( ! in_array( $hook_suffix, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}

		$screen = get_current_screen();

		if ( ! in_array( $screen->post_type, self::get_post_types(), true ) ) {
			return;
		}

		wp_enqueue_style(
			'social-planner-metabox',
			SOCIAL_PLANNER_URL . '/assets/styles/metabox.min.css',
			array(),
			SOCIAL_PLANNER_VERSION,
			'all'
		);
	}

	/**
	 * Enqueue metabox scripts.
	 *
	 * @param string $hook_suffix The current admin page.
	 */
	public static function enqueue_scripts( $hook_suffix ) {
		if ( ! in_array( $hook_suffix, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}

		$screen = get_current_screen();

		if ( ! in_array( $screen->post_type, self::get_post_types(), true ) ) {
			return;
		}

		// Insert wp media scripts.
		wp_enqueue_media();

		wp_enqueue_script(
			'social-planner-metabox',
			SOCIAL_PLANNER_URL . '/assets/scripts/metabox.min.js',
			array( 'wp-i18n' ),
			SOCIAL_PLANNER_VERSION,
			true
		);

		wp_localize_script( 'social-planner-metabox', 'socialPlannerMetabox', self::create_script_object() );
	}

	/**
	 * Create scripts object to inject on settings page.
	 */
	private static function create_script_object() {
		$object = array(
			'meta' => self::META_PROVIDERS,
		);

		// Get providers settings.
		$providers = Settings::get_providers();

		foreach ( $providers as $key => $provider ) {
			// Parse index and network from provider key.
			preg_match( '/^(.+)-(\w+)$/', $key, $matches );

			if ( empty( $matches ) ) {
				continue;
			}

			// Find class by network name.
			$class = Core::$networks[ $matches[1] ];

			if ( ! method_exists( $class, 'get_label' ) ) {
				continue;
			}

			$label = $class::get_label();

			if ( $provider['title'] ) {
				$label = $label . ': ' . $provider['title'];
			}

			$object['labels'][ $key ] = esc_attr( $label );
		}

		/**
		 * Filter metabox scripts object.
		 *
		 * @param array $object Array of metabox script object.
		 */
		return apply_filters( 'social_planner_metabox_object', $object );
	}

	/**
	 * Get a array of types for which the metabox is displayed.
	 *
	 * @return array
	 */
	private static function get_post_types() {
		$post_types = get_post_types(
			array(
				'public' => true,
			)
		);

		unset( $post_types['attachment'] );

		// Make one-dimensional array.
		$post_types = array_values( $post_types );

		/**
		 * Filter metabox post types.
		 *
		 * @param array $post_types Array of post types for which the metabox is displayed.
		 */
		return apply_filters( 'social_planner_post_types', $post_types );
	}
}
