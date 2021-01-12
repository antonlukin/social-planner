<?php
/**
 * Scheduler class
 *
 * @package social-planner
 * @author  Anton Lukin
 */

namespace Social_Planner;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	die;
}

/**
 * Settings page class
 */
class Scheduler {
	/**
	 * Action hook of the event.
	 *
	 * @var string
	 */
	const SCHEDULE_HOOK = 'social_planner_event';

	/**
	 * Add required schedule hooks.
	 */
	public static function add_hooks() {
		add_action( self::SCHEDULE_HOOK, array( __CLASS__, 'start_task' ), 10, 2 );
	}

	/**
	 * Schedule tasks from metabox.
	 *
	 * @param array   $tasks   List of saintized tasks.
	 * @param WP_Post $post    Post object.
	 */
	public static function schedule_tasks( $tasks, $post ) {
		foreach ( $tasks as $key => &$task ) {
			$planned = self::get_planned_time( $task );

			// Remove all time keys from the task.
			$task = array_diff_key( $task, array_flip( array( 'date', 'hour', 'minute' ) ) );

			if ( empty( $task['targets'] ) ) {
				self::unschedule_task( $key, $post->ID );

				continue;
			}

			/**
			 * Filter post statuses that can be scheduled.
			 * You can add pending or private status here.
			 *
			 * @param array $statuses List of post statuses.
			 */
			$statuses = apply_filters( 'social_planner_post_statuses', array( 'future', 'publish' ) );

			// Unschedule and skip tasks with invalid post status.
			if ( ! in_array( $post->post_status, $statuses, true ) ) {
				self::unschedule_task( $key, $post->ID );

				continue;
			}

			if ( $planned ) {
				self::reschedule_task( $planned, $key, $post->ID );
			}

			$scheduled = self::get_scheduled_time( $key, $post->ID );

			// Get post date in UTC.
			$post_date = strtotime( $post->post_date_gmt );

			// Reschedule if the post's date is later than the task's.
			if ( $scheduled && $post_date > $scheduled ) {
				self::reschedule_task( $post_date, $key, $post->ID );
			}
		}

		return $tasks;
	}

	/**
	 * Start schedule task.
	 *
	 * @param string $key     Task key.
	 * @param int    $post_id Post ID.
	 */
	public static function start_task( $key, $post_id ) {
		$tasks = Metabox::get_tasks( $post_id );

		if ( empty( $tasks[ $key ] ) ) {
			return;
		}

		$task = $tasks[ $key ];

		// Skip empty tasks.
		if ( empty( $task['targets'] ) ) {
			return;
		}

		$results = Metabox::get_results( $post_id );

		// Skip already sent tasks.
		if ( isset( $results[ $key ]['sent'] ) ) {
			return;
		}

		$results[ $key ]['locked'] = 1;

		// We must lock the task while it is being sent.
		Metabox::update_results( $post_id, $results );

		foreach ( $task['targets'] as $target ) {
			$output = self::send_task( $task, $target, $post_id );

			if ( is_wp_error( $output ) ) {
				$results[ $key ]['errors'][ $target ] = sanitize_text_field( $output->get_error_message() );

				continue;
			}

			$results[ $key ]['links'][ $target ] = sanitize_text_field( $output );
		}

		// Remove locked after sending.
		unset( $results[ $key ]['locked'] );

		$results[ $key ]['sent'] = time();

		Metabox::update_results( $post_id, $results );
	}

	/**
	 * Get scheduled time by task arguments
	 *
	 * @param string $key     Task key.
	 * @param int    $post_id Post ID.
	 *
	 * @return int
	 */
	public static function get_scheduled_time( $key, $post_id ) {
		return wp_next_scheduled( self::SCHEDULE_HOOK, self::sanitize_args( $key, $post_id ) );
	}

	/**
	 * Cancel task scheduling.
	 *
	 * @param string $key     Task key.
	 * @param int    $post_id Post ID.
	 */
	public static function unschedule_task( $key, $post_id ) {
		$scheduled = self::get_scheduled_time( $key, $post_id );

		if ( $scheduled ) {
			wp_unschedule_event( $scheduled, self::SCHEDULE_HOOK, self::sanitize_args( $key, $post_id ) );
		}
	}

	/**
	 * Reschedule task or create new one.
	 *
	 * @param int    $planned Timestamp for when to next run the event.
	 * @param string $key     Task key.
	 * @param int    $post_id Post ID.
	 */
	public static function reschedule_task( $planned, $key, $post_id ) {
		$scheduled = self::get_scheduled_time( $key, $post_id );

		if ( $scheduled ) {
			wp_unschedule_event( $scheduled, self::SCHEDULE_HOOK, self::sanitize_args( $key, $post_id ) );
		}

		// No reason to plan in the past.
		$planned = max( time(), $planned );

		wp_schedule_single_event( $planned, self::SCHEDULE_HOOK, self::sanitize_args( $key, $post_id ) );
	}

	/**
	 * Set the time in UTC at which the user planned to publish.
	 *
	 * @param array $task The task settings.
	 */
	private static function get_planned_time( $task ) {
		if ( empty( $task['date'] ) ) {
			return false;
		}

		if ( 'now' === $task['date'] ) {
			return time();
		}

		if ( isset( $task['hour'], $task['minute'] ) ) {
			$year  = substr( $task['date'], 0, 4 );
			$month = substr( $task['date'], 5, 2 );
			$day   = substr( $task['date'], 8, 2 );

			$format = '%04d-%02d-%02d %02d:%02d:00';

			// Create date in mysql format to check it below.
			$planned = sprintf( $format, $year, $month, $day, $task['hour'], $task['minute'] );

			if ( wp_checkdate( $month, $day, $year, $planned ) ) {
				return get_gmt_from_date( $planned, 'U' );
			}
		}

		return false;
	}

	/**
	 * Send scheduled task.
	 *
	 * @param array  $task    Scheduled task data.
	 * @param string $target  Target provider name.
	 * @param int    $post_id Post ID.
	 */
	private static function send_task( $task, $target, $post_id ) {
		$providers = Settings::get_providers();

		if ( ! isset( $providers[ $target ] ) ) {
			return new WP_Error( 'config', esc_html__( 'Provider settings not found', 'social-planner' ) );
		}

		$class = Core::get_network_class( $target );

		if ( ! method_exists( $class, 'send_message' ) ) {
			return new WP_Error( 'config', esc_html__( 'Sending method is missed', 'social-planner' ) );
		}

		$message = array();

		if ( ! empty( $task['excerpt'] ) ) {
			$message['excerpt'] = wp_specialchars_decode( $task['excerpt'] );
		}

		if ( ! empty( $task['attachment'] ) ) {
			$message['poster'] = get_attached_file( $task['attachment'] );
		}

		if ( ! empty( $task['preview'] ) ) {
			$message['preview'] = true;
		}

		// Current post ID permalink.
		$message['link'] = esc_url( get_permalink( $post_id ) );

		// Add post ID to message array to leave filtering right before sending.
		$message['post_id'] = $post_id;

		/**
		 * Filter sending message array.
		 *
		 * @param array  $message Sending message data.
		 * @param string $target  Target provider name.
		 * @param array  $task    Scheduled task data.
		 */
		$message = apply_filters( 'social_poster_prepare_message', $message, $target, $task );

		return $class::send_message( $message, $providers[ $target ] );
	}

	/**
	 * Sanitize scheduled args.
	 * This method exists for casting uniform variable types.
	 *
	 * @param string $key     Task key.
	 * @param int    $post_id Post ID.
	 *
	 * @return array
	 */
	private static function sanitize_args( $key, $post_id ) {
		return array( (string) $key, (int) $post_id );
	}
}
