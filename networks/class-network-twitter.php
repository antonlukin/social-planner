<?php
/**
 * Twitter network handler for Social Planner plugin
 *
 * @package social-planner
 * @author  Anton Lukin
 */

namespace Social_Planner;

/**
 * Twitter Social Planner class
 *
 * @since 1.0.0
 */
class Network_Twitter {
	/**
	 * Unique network slug.
	 *
	 * @var string
	 */
	const NETWORK_NAME = 'twitter';

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
		return _x( 'Twitter', 'provider label', 'social-planner' );
	}

	/**
	 * Get message limit.
	 */
	public static function get_limit() {
		/**
		 * Filter twitter message limit.
		 * Subtracting a few characters for the link and break line.
		 *
		 * @param int $limit Twitter message limit.
		 */
		return apply_filters( 'social_planner_twitter_limit', 255 );
	}

	/**
	 * Get network helper link
	 */
	public static function get_helper() {
		$helper = sprintf(
			wp_kses(
				// translators: %s is a link for current network help guide.
				__( 'Read the <a href="%s" target="_blank">help guide</a> for configuring Twitter provider.', 'social-planner' ),
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
			'api_key'       => array(
				'label'    => __( 'API key', 'social-planner' ),
				'required' => true,
			),

			'api_secret'    => array(
				'label'    => __( 'API secret key', 'social-planner' ),
				'required' => true,
			),

			'access_token'  => array(
				'label'    => __( 'Access token', 'social-planner' ),
				'required' => true,
			),

			'access_secret' => array(
				'label' => __( 'Access token secret', 'social-planner' ),
			),

			'access_secret' => array(
				'label'    => __( 'Access token secret', 'social-planner' ),
				'required' => true,
			),

			'title'         => array(
				'label' => __( 'Subtitle', 'social-planner' ),
				'hint'  => __( 'Optional field. Used as an subtitle if there are multiple Twitter providers.', 'social-planner' ),
			),

			'link'          => array(
				'label'       => __( 'Profile link', 'social-planner' ),
				'placeholder' => __( 'https://twitter.com/npv' ),
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
