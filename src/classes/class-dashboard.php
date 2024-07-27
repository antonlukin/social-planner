<?php
/**
 * Dashboard class
 *
 * @package social-planner
 * @author  Anton Lukin
 */

namespace Social_Planner;

if ( ! defined( 'ABSPATH' ) ) {
	die;
}

/**
 * Dashboard page class
 */
class Dashboard {
	/**
	 * Dashboard widget ID.
	 *
	 * @var string
	 */
	const DASHBOARD_ID = 'social-planner-dashboard';

	/**
	 * Add hooks for settings page.
	 */
	public static function add_hooks() {
		// Add dashboard widget with scheduled tasks.
		add_action( 'wp_dashboard_setup', array( __CLASS__, 'add_dashboard_widget' ) );
	}

	/**
	 * Add dashboard widget with scheduled tasks
	 */
	public static function add_dashboard_widget() {
		/**
		 * Easy way to hide dashboard.
		 *
		 * @param bool $hide_dashboard Set true to hide dashboard.
		 */
		$hide_dashboard = apply_filters( 'social_planner_hide_dashboard', false );

		if ( $hide_dashboard ) {
			return;
		}

		wp_add_dashboard_widget(
			self::DASHBOARD_ID,
			esc_html__( 'Social Planner', 'knife-theme' ),
			array( __CLASS__, 'display_widget' )
		);

		// Add required assets and objects.
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_styles' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_scripts' ) );
	}

	/**
	 * Display dashboard widget.
	 */
	public static function display_widget() {
		/**
		 * Fires before dashboard widget displaying.
		 */
		do_action( 'social_planner_dashboard_before' );

		printf(
			'<p class="hide-if-js">%s</p>',
			esc_html__( 'This dashboard requires JavaScript. Enable it in your browser settings, please.', 'social-planner' )
		);
	}

	/**
	 * Enqueue dashboard styles.
	 *
	 * @param string $hook_suffix The current admin page.
	 */
	public static function enqueue_styles( $hook_suffix ) {
		if ( 'index.php' !== $hook_suffix ) {
			return;
		}

		wp_enqueue_style(
			'social-planner-dashboard',
			SOCIAL_PLANNER_URL . '/assets/styles/dashboard.css',
			array(),
			SOCIAL_PLANNER_VERSION,
			'all'
		);
	}

	/**
	 * Enqueue dashboard scripts.
	 *
	 * @param string $hook_suffix The current admin page.
	 */
	public static function enqueue_scripts( $hook_suffix ) {
		if ( 'index.php' !== $hook_suffix ) {
			return;
		}

		wp_enqueue_script(
			'social-planner-dashboard',
			SOCIAL_PLANNER_URL . '/assets/scripts/dashboard.js',
			array( 'wp-i18n' ),
			SOCIAL_PLANNER_VERSION,
			true
		);

		wp_set_script_translations(
			'social-planner-dashboard',
			'social-planner',
			plugin_dir_path( SOCIAL_PLANNER_FILE ) . 'languages'
		);

		wp_localize_script( 'social-planner-dashboard', 'socialPlannerDashboard', self::create_script_object() );
	}

	/**
	 * Create scripts object to inject dashboard options.
	 *
	 * @return array
	 */
	private static function create_script_object() {
		$object = array(
			'tasks' => self::prepare_tasks(),
		);

		/**
		 * Filter dashboard scripts object.
		 *
		 * @param array $object Array of dashboard script object.
		 */
		return apply_filters( 'social_planner_dashboard_object', $object );
	}

	/**
	 * Prepare tasks to show them in dashboard.
	 *
	 * @return array
	 */
	private static function prepare_tasks() {
		$prepared = array();

		// Get scheduled tasks from cron option.
		$tasks = self::get_scheduled_tasks();

		foreach ( $tasks as $task ) {
			$key = $task['key'];

			// Get all tasks for certain post id to find scheduled task data.
			$data = Metabox::get_tasks( $task['post_id'] );

			if ( empty( $data[ $key ] ) ) {
				continue;
			}

			$prepared[] = self::compose_task( $task, $data[ $key ] );
		}

		return $prepared;
	}

	/**
	 * Compose and filter scheduled task object.
	 *
	 * @param array $task Scheduled task object from cron list.
	 * @param array $data Task data from post meta.
	 *
	 * @return array
	 */
	private static function compose_task( $task, $data ) {
		$prepared = array(
			'postlink'  => esc_url( get_permalink( $task['post_id'] ) ),
			'editlink'  => get_edit_post_link( $task['post_id'], '' ),
			'scheduled' => wp_date( Core::time_format(), $task['timestamp'] ),
		);

		if ( ! empty( $data['excerpt'] ) ) {
			$prepared['excerpt'] = wp_kses_post( wpautop( $data['excerpt'] ) );
		}

		if ( ! empty( $data['thumbnail'] ) ) {
			$prepared['thumbnail'] = esc_url( $data['thumbnail'] );
		}

		$prepared['networks'] = self::get_task_networks( $data['targets'] );

		return $prepared;
	}

	/**
	 * Helper method to get task networks labels.
	 *
	 * @param array $targets List of task targets.
	 *
	 * @return array
	 */
	private static function get_task_networks( $targets ) {
		$networks = array();

		// Get all providers from settings.
		$providers = Settings::get_providers();

		foreach ( $targets as $target ) {
			$class = Core::get_network_class( $target );

			// Get network label by class.
			$label = Core::get_network_label( $class );

			if ( ! empty( $providers[ $target ]['title'] ) ) {
				$label = $label . ': ' . $providers[ $target ]['title'];
			}

			$networks[] = $label;
		}

		return $networks;
	}

	/**
	 * Get scheduled tasks from cron option.
	 *
	 * @return array
	 */
	private static function get_scheduled_tasks() {
		$tasks = array();

		// Get all crons jobs.
		$crons = (array) _get_cron_array();

		foreach ( $crons as $timestamp => $events ) {
			$hook = Scheduler::SCHEDULE_HOOK;

			foreach ( $events as $id => $event ) {
				if ( $hook !== $id ) {
					continue;
				}

				foreach ( $event as $key => $task ) {
					if ( empty( $task['args'] ) || count( $task['args'] ) < 2 ) {
						continue;
					}

					$tasks[] = array(
						'timestamp' => $timestamp,
						'key'       => $task['args'][0],
						'post_id'   => $task['args'][1],
					);
				}
			}
		}

		return $tasks;
	}
}
