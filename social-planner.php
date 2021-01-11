<?php
/**
 * Plugin Name: Social Planner
 * Plugin URI: https://github.com/antonlukin/social-planner
 * Description: This plugin automatically publishes posts from your blog to your social media accounts on Facebook, Twitter, VK.com, Telegram.
 * Author: Anton Lukin
 * Author URI: https://lukin.me
 * Requires at least: 5.3
 * Tested up to: 5.5
 * Version: 1.0.0
 *
 * Text Domain: social-planner
 * Domain Path: /languages/
 *
 * @package social-planner
 * @author  Anton Lukin
 */

namespace Social_Planner;

/**
 * If this file is called directly, abort.
 */
if ( ! defined( 'ABSPATH' ) ) {
	die;
}

/**
 * Plugin version.
 */
define( 'SOCIAL_PLANNER_VERSION', '1.0.0' );

/**
 * Plugin admin menu slug.
 */
define( 'SOCIAL_PLANNER_SLUG', 'social-planner' );

/**
 * Main plugin file.
 */
define( 'SOCIAL_PLANNER_FILE', __FILE__ );

/**
 * Shortcut constant to the path of this file.
 */
define( 'SOCIAL_PLANNER_DIR', dirname( __FILE__ ) );

/**
 * Plugin dir url.
 */
define( 'SOCIAL_PLANNER_URL', untrailingslashit( plugin_dir_url( __FILE__ ) ) );

/**
 * Include the core plugin class.
 */
require_once SOCIAL_PLANNER_DIR . '/classes/class-core.php';

/**
 * Include settings handler.
 */
require_once SOCIAL_PLANNER_DIR . '/classes/class-settings.php';

/**
 * Include scheduler class.
 */
require_once SOCIAL_PLANNER_DIR . '/classes/class-scheduler.php';

/**
 * Include metabox handler.
 */
require_once SOCIAL_PLANNER_DIR . '/classes/class-metabox.php';

/**
 * Include dashboard handler.
 */
require_once SOCIAL_PLANNER_DIR . '/classes/class-dashboard.php';

/**
 * Start with core plugin method.
 */
Core::add_hooks();
