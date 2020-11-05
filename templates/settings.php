<?php
/**
 * Social Planner settings page
 *
 * @package social-planner
 * @author  Anton Lukin
 */

namespace Social_Planner;

?>
<div id="social-planner-settings" class="wrap">
	<h2 class="wp-heading-inline"><?php esc_html_e( 'Social Planner Settings', 'social-planner' ); ?></h2>

	<div class="error hide-if-js">
		<p><?php esc_html_e( 'The Social Planner Settings page requires JavaScript.', 'social-planner' ); ?></p>
	</div>

	<div class="social-planner-header">
		<p><?php esc_html_e( 'General settings for auto-posting to social networks. Note that the plugin is designed for advanced users. Carefully read the instructions for configuring each provider.', 'social-planner' ); ?></p>
	</div>

	<form class="social-planner-wrapper" method="post" action="options.php">

	</form>
</div>
