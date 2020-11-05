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

	<div class="social-planner-append">
		<?php
		printf(
			'<button class="button">%s</button>',
			esc_html__( 'Add network', 'social-planner' )
		);
		?>
	</div>

	<form class="social-planner-wrapper" method="post" action="options.php">
		<div class="social-planner-network">
			<h3>Настройка провайдера: <strong>Telegram</strong></h3>

			<button class="social-planner-remove dashicons dashicons-trash"></button>

			<div class="social-planner-option">
				<strong>Название</strong>
				<input type="text" name="label" value="">

				<small>Используется только для вашего удобства. Может быть любым.</small>
			</div>

			<div class="social-planner-option">
				<strong>Токен бота</strong>
				<input type="text" name="token" value="">
			</div>

			<div class="social-planner-option">
				<strong>ID группы или канала</strong>
				<input type="text" name="token" value="">
			</div>

			<div class="social-planner-option">
				<strong>Ссылка на канал</strong>
				<input type="text" name="entry" value="">
			</div>
		</div>

		<?php submit_button(); ?>
	</form>
</div>
