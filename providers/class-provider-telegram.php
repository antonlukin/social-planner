<?php
/**
 * Telegram provider for Social Planner plugin
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
class Provider_Telegram {
	/**
	 * Unique provider slug.
	 *
	 * @var string
	 */
	const PROVIDER_NAME = 'telegram';

	/**
	 * Settings helper link.
	 *
	 * @var string
	 */
	const HELPER_LINK = 'http://example.com';

	/**
	 * Return human-readable provider label
	 */
	public static function get_label() {
		return _x( 'Telegram', 'provider label', 'social-planner' );
	}

	/**
	 * Get provider helper link
	 */
	public static function get_helper() {
		$helper = sprintf(
			wp_kses(
				// translators: %s is a link for current provider help guide.
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
	 * Return provider required settings fields
	 */
	public static function get_fields() {
		$fields = array(
			'title' => array(
				'label' => __( 'Title', 'social-planner' ),
				'hint'  => __( 'Used only for your convenience. It can be anything.', 'social-planner' ),
			),

			'token' => array(
				'label'       => __( 'Bot token', 'social-planner' ),
				'placeholder' => '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
			),

			'group' => array(
				'label' => __( 'Channel or group ID', 'social-planner' ),
			),

			'link'  => array(
				'label'       => __( 'Channel link', 'social-planner' ),
				'placeholder' => __( 'https:/t.me/devup' ),
				'hint'        => __( 'Optional field. Used to show link to published entry.', 'social-planner' ),
			),
		);

		return $fields;
	}

	/**
	 * Send message method
	 *
	 * @param array  $message Message data.
	 * @param array  $options Test.
	 * @param string $poster Optional test.
	 */
	public static function send_message( $message, $options, $poster = null ) {
		return '';
	}
}
