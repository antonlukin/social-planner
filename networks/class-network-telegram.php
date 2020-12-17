<?php
/**
 * Telegram network handler for Social Planner plugin
 *
 * @package social-planner
 * @author  Anton Lukin
 */

namespace Social_Planner;

/**
 * Telegram Social Planner class
 *
 * @since 1.0.0
 */
class Network_Telegram {
	/**
	 * Unique network slug.
	 * Use latin alphanumeric characters and underscore only.
	 *
	 * @var string
	 */
	const NETWORK_NAME = 'telegram';

	/**
	 * Settings helper link.
	 *
	 * @var string
	 */
	const HELPER_LINK = 'http://example.com';

	/**
	 * Return human-readable network label
	 */
	public static function get_label() {
		return _x( 'Telegram', 'network label', 'social-planner' );
	}

	/**
	 * Get network helper link
	 */
	public static function get_helper() {
		$helper = sprintf(
			wp_kses(
				// translators: %s is a link for current network help guide.
				__( 'Read the <a href="%s" target="_blank">help guide</a> for configuring Telegram provider.', 'social-planner' ),
				array(
					'a' => array(
						'href'   => array(),
						'target' => array(),
					),
				)
			),
			esc_url( self::HELPER_LINK )
		);

		return $helper;
	}

	/**
	 * Return network required settings fields
	 */
	public static function get_fields() {
		$fields = array(
			'token' => array(
				'label'       => __( 'Bot token', 'social-planner' ),
				'placeholder' => '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
				'required'    => true,
			),

			'group' => array(
				'label'    => __( 'Channel or group ID', 'social-planner' ),
				'required' => true,
			),

			'title' => array(
				'label' => __( 'Subtitle', 'social-planner' ),
				'hint'  => __( 'Optional field. Used as an subtitle if there are multiple Telegram providers.', 'social-planner' ),
			),

			'link'  => array(
				'label'       => __( 'Public Telegram link', 'social-planner' ),
				'placeholder' => __( 'https://t.me/devup' ),
				'hint'        => __( 'Optional field. Used to display a link to a published post.', 'social-planner' ),
			),
		);

		return $fields;
	}

	/**
	 * Send message method
	 *
	 * @param array $message  Message data.
	 * @param array $settings Test.
	 */
	public static function send_message( $message, $settings ) {
	}
}
