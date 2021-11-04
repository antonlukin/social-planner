<?php
/**
 * Twitter network handler for Social Planner plugin
 *
 * @package social-planner
 * @author  Anton Lukin
 */

namespace Social_Planner;

use WP_Error;

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
	const HELPER_LINK = 'https://wpget.org/social-planner/setup/#twitter';

	/**
	 * Return human-readable network label
	 */
	public static function get_label() {
		return _x( 'Twitter', 'provider label', 'social-planner' );
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
			'consumer_key'    => array(
				'label'    => __( 'Consumer API key', 'social-planner' ),
				'required' => true,
			),

			'consumer_secret' => array(
				'label'    => __( 'Consumer API secret key', 'social-planner' ),
				'required' => true,
			),

			'access_token'    => array(
				'label'    => __( 'Access token', 'social-planner' ),
				'required' => true,
			),

			'access_secret'   => array(
				'label'    => __( 'Access token secret', 'social-planner' ),
				'required' => true,
			),

			'title'           => array(
				'label' => __( 'Subtitle', 'social-planner' ),
				'hint'  => __( 'Optional field. Used as an subtitle if there are multiple Twitter providers.', 'social-planner' ),
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
		$keys = array( 'consumer_key', 'consumer_secret', 'access_token', 'access_secret' );

		foreach ( $keys as $key ) {
			if ( empty( $settings[ $key ] ) ) {
				return new WP_Error( 'sending', esc_html__( 'Parameter is empty: ', 'social-planner' ) . $key );
			}
		}

		$response = self::make_request( $message, $settings );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( empty( $response['body'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'Empty API response', 'social-planner' ) );
		}

		$response = json_decode( $response['body'], false );

		if ( ! empty( $response->id ) ) {
			$output = $response->id;

			// Create link if chat username exists.
			if ( ! empty( $response->user->screen_name ) ) {
				$output = "https://twitter.com/{$response->user->screen_name}/status/{$output}";
			}

			return $output;
		}

		if ( ! empty( $response->errors[0]->message ) ) {
			return new WP_Error( 'sending', $response->errors[0]->message );
		}

		return new WP_Error( 'sending', esc_html__( 'Unknown API error', 'social-planner' ) );
	}

	/**
	 * Prepare data and send request to remote API.
	 *
	 * @param array $message  Message data.
	 * @param array $settings Settings array from options.
	 */
	private static function make_request( $message, $settings ) {
		$body = array(
			'status' => self::prepare_message_excerpt( $message ),
		);

		$oauth = array(
			'oauth_consumer_key'     => $settings['consumer_key'],
			'oauth_token'            => $settings['access_token'],
			'oauth_nonce'            => uniqid(),
			'oauth_signature_method' => 'HMAC-SHA1',
			'oauth_timestamp'        => time(),
			'oauth_version'          => '1.0',
		);

		$secret = rawurlencode( $settings['consumer_secret'] ) . '&' . rawurlencode( $settings['access_secret'] );

		if ( ! empty( $message['poster'] ) ) {
			$poster = self::upload_poster( $message['poster'], $oauth, $secret );

			if ( is_wp_error( $poster ) ) {
				return $poster;
			}

			$body['media_ids'] = $poster;
		}

		$url = 'https://api.twitter.com/1.1/statuses/update.json';

		// Generate OAuth signature.
		$oauth['oauth_signature'] = self::get_oauth_signature( $url, $secret, $oauth + $body );

		$headers = array(
			'Accept'        => 'application/json',
			'Authorization' => self::build_oauth_header( $oauth ),
			'Expect'        => '',
		);

		return self::send_request( $url, $body, $headers );
	}

	/**
	 * Upload image to Twitter.
	 *
	 * @param string $poster Path to local image file.
	 * @param array  $oauth  Prepared OAuth fields array.
	 * @param string $secret $secret Generated secret.
	 */
	private static function upload_poster( $poster, $oauth, $secret ) {
		$url = 'https://upload.twitter.com/1.1/media/upload.json';

		// Generate OAuth signature.
		$oauth['oauth_signature'] = self::get_oauth_signature( $url, $secret, $oauth );

		$boundary = uniqid( 'wp', true );

		$body = self::prepare_multipart_data( $poster, 'media', $boundary );

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$headers = array(
			'Content-Type'   => 'multipart/form-data; boundary=' . $boundary,
			'Content-Length' => strlen( $body ),
			'Accept'         => 'application/json',
			'Authorization'  => self::build_oauth_header( $oauth ),
			'Expect'         => '',
		);

		$response = self::send_request( $url, $body, $headers );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( empty( $response['body'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'Empty API response', 'social-planner' ) );
		}

		$response = json_decode( $response['body'], false );

		if ( empty( $response->media_id_string ) ) {
			return new WP_Error( 'sending', esc_html__( 'An error occurred while uploading image', 'social-planner' ) );
		}

		return $response->media_id_string;
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

		return wp_remote_post( $url, $args );
	}

	/**
	 * Create multipart data.
	 *
	 * @param string $path     Path to local file.
	 * @param string $name     Name of body parameter.
	 * @param string $boundary Boundary delimiter.
	 */
	private static function prepare_multipart_data( $path, $name, $boundary ) {
		$file = basename( $path );
		$type = wp_check_filetype( $path )['type'];

		// phpcs:ignore WordPress.WP.AlternativeFunctions
		$content = file_get_contents( $path );

		if ( false === $content ) {
			return new WP_Error( 'sending', esc_html__( 'Cannot read poster file', 'social-planner' ) );
		}

		$body[] = "--$boundary";
		$body[] = "Content-Disposition: form-data; name=\"$name\"; filename=\"$file\"";
		$body[] = "Content-Type: $type";
		$body[] = "\r\n" . $content;
		$body[] = "--$boundary--\r\n";

		return implode( "\r\n", $body );
	}

	/**
	 * Create status from message object.
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
	 * Generate OAuth signature.
	 *
	 * @param string $url API endpoint.
	 * @param string $secret Generated secret.
	 * @param array  $fields List of query arguments.
	 */
	private static function get_oauth_signature( $url, $secret, $fields ) {
		ksort( $fields );

		$values = array();

		foreach ( $fields as $key => $value ) {
			$values[] = "$key=" . rawurlencode( $value );
		}

		$base = 'POST&' . rawurlencode( $url ) . '&' . rawurlencode( implode( '&', $values ) );

		// phpcs:ignore
		return base64_encode( hash_hmac( 'sha1', $base, $secret, true ) );
	}

	/**
	 * Build OAuth header.
	 *
	 * @param array $fields List of header arguments.
	 */
	private static function build_oauth_header( $fields ) {
		$values = array();

		foreach ( $fields as $key => $value ) {
			$values[] = $key . '="' . rawurlencode( $value ) . '"';
		}

		return 'OAuth ' . implode( ', ', $values );
	}
}
