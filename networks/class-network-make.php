<?php
/**
 * Make network handler for Social Planner plugin
 *
 * @package social-planner
 * @author  Lautaro Linquimán
 */

namespace Social_Planner;

use WP_Error;

/**
 * Make Social Planner class
 *
 * @since 1.4.0
 */
class Network_Make {
	/**
	 * Unique network slug.
	 *
	 * @var string
	 */
	const NETWORK_NAME = 'make';

	/**
	 * Settings helper link.
	 *
	 * @var string
	 */
	const HELPER_LINK = 'https://wpset.org/social-planner/setup/#make';

	/**
	 * Return human-readable network label.
	 */
	public static function get_label() {
		return _x( 'Make', 'provider label', 'social-planner' );
	}

	/**
	 * Get network helper link
	 */
	public static function get_helper() {
		$helper = sprintf(
			wp_kses(
				// translators: %s is a link for current network help guide.
				__( 'Read the <a href="%s" target="_blank">help guide</a> for configuring Make provider.', 'social-planner' ),
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
			'webhook_url' => array(
				'label'    => __( 'WebHook URL', 'social-planner' ),
				'required' => true,
			),

			'title' => array(
				'label' => __( 'Subtitle', 'social-planner' ),
				'hint'  => __( 'Optional field. Used as an subtitle if there are multiple Make providers.', 'social-planner' ),
			),
		);

		return $fields;
	}

	/**
	 * Send message method
	 *
	 * @param array $message  Message data.
	 * @param array $settings Settings array from options.
	 */
	public static function send_message( $message, $settings ) {
		if ( empty( $settings['webhook_url'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'WebHook URL parameter is not found', 'social-planner' ) );
		}


		$response = self::make_request( $message, $settings['webhook_url'] );

		if($response["response"]["code"] == 200) {
			return true;
		}

		return new WP_Error( 'sending', esc_html__( 'API return error: ', 'social-planner' ).$response->code );
	}

	/**
	 * Prepare message excerpt.
	 *
	 * @param array $message List of message args.
	 */
	private static function prepare_message_excerpt( $message ) {
		$excerpt = "";

		if ( ! empty( $message['excerpt'] ) ) {
			$excerpt = $message['excerpt'];
		}

		/**
		 * Filter message excerpt right before sending.
		 *
		 * @param string $excerpt Message excerpt.
		 * @param array  $message Original message array.
		 * @param string $network Network name.
		 */
		return apply_filters( 'social_planner_prepare_excerpt', $excerpt, $message, self::NETWORK_NAME );
	}

	/**
	 * Prepare data and send request to remote API.
	 *
	 * @param array  $message Message data.
	 * @param string $path    Remote API URL path.
	 * @param string $token   Access token from settings.
	 */
	protected static function make_request( $message, $webhook_url ) {
		$body = array();
		
		$url = $webhook_url;
		$excerpt = self::prepare_message_excerpt( $message );
		
		if ( empty( $excerpt ) && empty( $message['poster_id']) ) {
			return new WP_Error( 'sending', esc_html__( 'Excerpt and poster are both empty', 'social-planner' ) );
		}

		if ( ! empty( $message['poster_id'] ) ) {
			$body["image_url"] = wp_get_attachment_url($message['poster_id']);
		}


		$body['content'] = $excerpt;

		/**
		 * Filter request body arguments using message data.
		 *
		 * @param string $body    Request body arguments.
		 * @param array  $message Message data.
		 * @param string $network Network name.
		 * @param string $url     Remote API URL.
		 *
		 * @since 1.1.12
		 * @version 1.3.0
		 */
		$body = apply_filters( 'social_planner_filter_request_body', $body, $message, self::NETWORK_NAME, $url );
		return self::send_request( $url, $body );
	}

	/**
	 * Send request to remote server.
	 *
	 * @param string $url     Remote API URL.
	 * @param array  $body    Request body.
	 * @param array  $headers Optional. Request headers.
	 */
	private static function send_request( $url, $body, $headers = null ) {
		$args = array(
			'user-agent' => 'social-planner/' . SOCIAL_PLANNER_VERSION,
			'body' 		=> $body,
		);

		// array_merge($args, $body);
		
		if ( $headers ) {
			$args['headers'] = $headers;
		}



		/**
		 * Filter request arguments right before sending.
		 *
		 * @param string $args    Request arguments.
		 * @param array  $url     URL to retrieve.
		 * @param string $network Network name.
		 *
		 * @since 1.1.12
		 */
		$args = apply_filters( 'social_planner_before_request', $args, $url, self::NETWORK_NAME );

		return wp_remote_post( $url, $args );
	}
}
