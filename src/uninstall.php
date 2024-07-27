<?php
/**
 * Remove all plugin data on unistall
 *
 * @package social-planner
 * @author  Anton Lukin
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Delete providers option.
delete_option( 'social_planner_providers' );

// Delete all tasks post meta.
delete_metadata( 'post', 0, '_social_planner_tasks', '', true );

// Delete all results post meta.
delete_metadata( 'post', 0, '_social_planner_results', '', true );
