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
				'label' => __( 'Название', 'social-planner' ),
				'hint'  => __( 'Используется только для вашего удобства. Может быть любым.', 'social-planner' ),
			),

			'token' => array(
				'label'       => __( 'Токен бота', 'social-planner' ),
				'placeholder' => '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
			),

			'group' => array(
				'label' => __( 'ID группы или канала', 'social-planner' ),
			),

			'link'  => array(
				'label' => __( 'Ссылка на канал', 'social-planner' ),
				'hint'  => __( 'Необязательное поле. Используется для формирования ссылки на сообщение.', 'social-planner' ),
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
