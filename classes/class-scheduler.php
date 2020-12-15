<?php
/**
 * Scheduler class
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
			// Get task planned time in GMT from metabox.
			$planned = self::get_planned_time( $task );

			// Remove all time keys from the task.
			$task = array_diff_key( $task, array_flip( array( 'date', 'hour', 'minute' ) ) );

			// Unschedule and skip tasks with empty targets.
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
