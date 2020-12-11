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
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object.
	 */
	public static function schedule_tasks( $tasks, $post_id, $post ) {
		foreach ( $tasks as $key => &$task ) {
			$args = array( $key, $post_id );

			// Check if the task already scheduled.
			$scheduled = wp_next_scheduled( self::SCHEDULE_HOOK, $args );

			// Get task planned time in GMT from metabox.
			$planned = self::get_planned_time( $task );

			// Remove all time keys from the task.
			$task = array_diff_key( $task, array_flip( array( 'date', 'hour', 'minute' ) ) );

			// Unschedule and skip tasks with empty targets.
			if ( empty( $task['targets'] ) ) {

				if ( $scheduled ) {
					wp_unschedule_event( $scheduled, self::SCHEDULE_HOOK, $args );
				}

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

				if ( $scheduled ) {
					wp_unschedule_event( $scheduled, self::SCHEDULE_HOOK, $args );
				}

				continue;
			}

			$post_date = strtotime( $post->post_date_gmt );

			// Reschedule if the post's date is later than the task's.
			if ( $scheduled ) {

				if ( $post_date > $scheduled ) {
					wp_unschedule_event( $scheduled, self::SCHEDULE_HOOK, $args );

					// Set schedule timestamp as new post date.
					wp_schedule_single_event( $post_date, self::SCHEDULE_HOOK, $args );
				}

				continue;
			}

			// Schedule new tasks.
			if ( $planned ) {
				$planned = max( time(), $planned );

				if ( $post_date > $planned ) {
					$planned = $post_date;
				}

				wp_schedule_single_event( $planned, self::SCHEDULE_HOOK, $args );
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
		$args = array( $key, $post_id );

		// Check if task with args aready scheduled.
		return wp_next_scheduled( self::SCHEDULE_HOOK, $args );
	}

	/**
	 * Set the time in UTC at which the user planned to publish.
	 *
	 * @param array $task The task settings.
	 */
	public static function get_planned_time( $task ) {
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
}
