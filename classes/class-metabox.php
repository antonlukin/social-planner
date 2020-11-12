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
	 * Metabox nonce field
	 */
	const METABOX_NONCE = 'social_planner_metabox_nonce';

	/**
	 * Add hooks for settings page.
	 */
	public static function add_hooks() {
		add_action( 'add_meta_boxes', array( __CLASS__, 'add_metabox' ) );

		// Add required assets and objects.
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_styles' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_scripts' ) );

		// Save metabox.
		add_action( 'save_post', array( __CLASS__, 'save_metabox' ), 10, 2 );
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

		wp_nonce_field( 'metabox', self::METABOX_NONCE );
	}

	/**
	 * Save metabox fields.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object.
	 */
	public static function save_metabox( $post_id, $post ) {
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		if ( empty( $_POST[ self::METABOX_NONCE ] ) ) {
			return;
		}

		if ( ! wp_verify_nonce( sanitize_key( $_POST[ self::METABOX_NONCE ] ), 'metabox' ) ) {
			return;
		}

		if ( empty( $_REQUEST[ self::META_PROVIDERS ] ) ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$items = $_REQUEST[ self::META_PROVIDERS ];

		// Update post meta.
		update_post_meta( $post_id, self::META_PROVIDERS, $items );
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
		global $post;

		$object = array(
			'meta' => self::META_PROVIDERS,
		);

		// Append tasks from post meta to object.
		$object['tasks'] = get_post_meta( $post->ID, self::META_PROVIDERS, true );

		// Get providers settings.
		$settings = Settings::get_providers();

		foreach ( $settings as $key => $setting ) {
			$provider = array();

			// Parse index and network from provider key.
			preg_match( '/^(.+)-(\w+)$/', $key, $matches );

			if ( empty( $matches ) ) {
				continue;
			}

			// Find class by network name.
			$class = Core::$networks[ $matches[1] ];

			// Append provider label.
			if ( method_exists( $class, 'get_label' ) ) {
				$label = $class::get_label();

				if ( $setting['title'] ) {
					$label = $label . ': ' . $setting['title'];
				}

				$provider['label'] = esc_attr( $label );
			}

			// Append message limit.
			if ( method_exists( $class, 'get_limit' ) ) {
				$provider['limit'] = absint( $class::get_limit() );
			}

			$object['providers'][ $key ] = $provider;
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
