<?php
/**
 * Linkedin network handler for Social Planner plugin
 *
 * @package social-planner
 * @author  Anton Lukin
 */

namespace Social_Planner;

use WP_Error;

/**
 * Linkedin Social Planner class
 *
 * @since 1.3.0
 */
class Network_Linkedin {
	/**
	 * Unique network slug.
	 * Use latin alphanumeric characters and underscore only.
	 *
	 * @var string
	 */
	const NETWORK_NAME = 'linkedin';

	/**
	 * Settings helper link.
	 *
	 * @var string
	 */
	const HELPER_LINK = 'https://wpset.org/social-planner/setup/#linkedin';

	/**
	 * Return human-readable network label
	 */
	public static function get_label() {
		return _x( 'Linkedin', 'network label', 'social-planner' );
	}

	/**
	 * Get network helper link
	 */
	public static function get_helper() {
		$helper = sprintf(
			wp_kses(
				// translators: %s is a link for current network help guide.
				__( 'Read the <a href="%s" target="_blank">help guide</a> for configuring Linkedin provider.', 'social-planner' ),
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
				'label'       => __( 'Authorization Token', 'social-planner' ),
				'placeholder' => 'AQXuGEPT_Age7Htmp_Z6iR0-ExAqZmr2y7Htmp4pAqZmr2yG5RbtUZGBNYxmGp0J',
				'required'    => true,
			),

			'urn'   => array(
				'label'       => __( 'String-based URN', 'social-planner' ),
				'placeholder' => 'urn:li:organization:93249193',
				'required'    => true,
			),

			'title' => array(
				'label' => __( 'Subtitle', 'social-planner' ),
				'hint'  => __( 'Optional field. Used as an subtitle if there are multiple Linkedin providers.', 'social-planner' ),
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
		if ( empty( $settings['token'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'Token parameter is empty', 'social-planner' ) );
		}

		if ( empty( $settings['urn'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'URN parameter is not found', 'social-planner' ) );
		}

		$response = self::make_request( $message, $settings );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( empty( $response['body'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'Empty API response', 'social-planner' ) );
		}

		$response = json_decode( $response['body'], false );

		if ( ! empty( $response->activity ) ) {
			return 'https://www.linkedin.com/feed/update/' . $response->activity;
		}

		if ( ! empty( $response->message ) ) {
			return new WP_Error( 'sending', $response->message );
		}

		return new WP_Error( 'sending', esc_html__( 'Unknown API error', 'social-planner' ) );
	}

	/**
	 * Prepare data and send request to remote API.
	 *
	 * @param array  $message  List of message args.
	 * @param string $settings Settings array from options.
	 */
	private static function make_request( $message, $settings ) {
		$entities = array();

		if ( ! empty( $message['preview'] ) && ! empty( $message['link'] ) ) {
			$entities['entityLocation'] = $message['link'];
		}

		if ( ! empty( $message['poster'] ) ) {
			$entities['thumbnails'] = array(
				array(
					'resolvedUrl' => $message['poster'],
				),
			);
		}

		$body = array(
			'distribution' => array(
				'linkedInDistributionTarget' => array(
					'visibleToGuest' => true,
				),
			),
			'owner'        => $settings['urn'],
			'text'         => array(
				'text' => self::prepare_message_excerpt( $message ),
			),
		);

		if ( ! empty( $entities ) ) {
			$body['content'] = array(
				'contentEntities' => array( $entities ),
				'title'           => wp_strip_all_tags( get_the_title( $message['post_id'] ) ),
				'description'     => '',
			);
		}

		$headers = array(
			'Content-Type'  => 'application/json',
			'Authorization' => 'Bearer ' . $settings['token'],
		);

		$url = 'https://api.linkedin.com/v2/shares';

		/**
		 * Filter request body arguments using message data.
		 *
		 * @param string $body    Request body arguments.
		 * @param array  $message Message data.
		 * @param string $network Network name.
		 * @param string $url     Remote API URL.
		 *
		 * @since 1.3.0
		 */
		$body = apply_filters( 'social_planner_filter_request_body', wp_json_encode( $body ), $message, self::NETWORK_NAME, $url );

		return self::send_request( $url, $body, $headers );
	}

	/**
	 * Prepare message excerpt.
	 *
	 * @param array $message List of message args.
	 */
	private static function prepare_message_excerpt( $message ) {
		$excerpt = array();

		if ( ! empty( $message['excerpt'] ) ) {
			$excerpt[] = $message['excerpt'];
		}

		if ( ! empty( $message['link'] ) ) {
			$excerpt[] = $message['link'];
		}

		$excerpt = implode( "\n\n", $excerpt );

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
	 * Send request to remote server.
	 *
	 * @param string $url     Remote API URL.
	 * @param array  $body    Request body.
	 * @param array  $headers Optional. Request headers.
	 */
	private static function send_request( $url, $body, $headers = null ) {
		$args = array(
			'user-agent' => 'social-planner/' . SOCIAL_PLANNER_VERSION,
			'body'       => $body,
			'timeout'    => 15,
		);

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
		 * @since 1.3.0
		 */
		$args = apply_filters( 'social_planner_before_request', $args, $url, self::NETWORK_NAME );

		return wp_remote_post( $url, $args );
	}
}
