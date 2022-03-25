<?php
/**
 * Ok.ru network handler for Social Planner plugin
 *
 * @package social-planner
 * @author  Anton Lukin
 */

namespace Social_Planner;

use WP_Error;

/**
 * Ok.ru Social Planner class
 *
 * @since 1.0.0
 */
class Network_OK {
	/**
	 * Unique network slug.
	 *
	 * @var string
	 */
	const NETWORK_NAME = 'ok';

	/**
	 * Settings helper link.
	 *
	 * @var string
	 */
	const HELPER_LINK = 'https://wpset.org/social-planner/setup/#ok';

	/**
	 * Return human-readable network label
	 */
	public static function get_label() {
		return _x( 'OK.ru', 'provider label', 'social-planner' );
	}

	/**
	 * Get network helper link
	 */
	public static function get_helper() {
		$helper = sprintf(
			wp_kses(
				// translators: %s is a link for current network help guide.
				__( 'Read the <a href="%s" target="_blank">help guide</a> for configuring OK.ru provider.', 'social-planner' ),
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
			'group'              => array(
				'label'    => __( 'Group ID', 'social-planner' ),
				'required' => true,
			),

			'app_key'            => array(
				'label'    => __( 'Application public key', 'social-planner' ),
				'required' => true,
			),

			'access_token'       => array(
				'label'    => __( 'Permanent access token', 'social-planner' ),
				'required' => true,
			),

			'session_secret_key' => array(
				'label'    => __( 'Secret session key', 'social-planner' ),
				'required' => true,
			),

			'title'              => array(
				'label' => __( 'Subtitle', 'social-planner' ),
				'hint'  => __( 'Optional field. Used as an subtitle if there are multiple OK.ru providers.', 'social-planner' ),
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
		$keys = array( 'group', 'app_key', 'access_token', 'session_secret_key' );

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

		if ( ! empty( $response->error_msg ) ) {
			return new WP_Error( 'sending', $response->error_msg );
		}

		if ( ! is_numeric( $response ) ) {
			return new WP_Error( 'sending', esc_html__( 'Unknown API error', 'social-planner' ) );
		}

		$group = sanitize_text_field( $settings['group'] );

		// Create link using post id.
		return "https://ok.ru/group/{$group}/topic/{$response}";
	}

	/**
	 * Prepare data and send request to remote API.
	 *
	 * @param array $message  Message data.
	 * @param array $settings Settings array from options.
	 */
	private static function make_request( $message, $settings ) {
		$url = 'https://api.ok.ru/fb.do';

		$attachments = array();

		if ( ! empty( $message['poster'] ) ) {
			$poster = self::upload_poster( $message['poster'], $settings, $url );

			if ( is_wp_error( $poster ) ) {
				return $poster;
			}

			$attachments[] = array(
				'type' => 'photo',
				'list' => $poster,
			);
		}

		$body = array(
			'method'          => 'mediatopic.post',
			'application_key' => $settings['app_key'],
			'gid'             => $settings['group'],
			'type'            => 'GROUP_THEME',
			'format'          => 'json',
		);

		if ( empty( $message['preview'] ) ) {
			$body['text_link_preview'] = 0;
		}

		if ( ! empty( $message['excerpt'] ) ) {
			$attachments[] = array(
				'type' => 'text',
				'text' => self::prepare_message_excerpt( $message ),
			);
		}

		$body['attachment'] = wp_json_encode( array( 'media' => $attachments ) );

		// Sign request using settings secret key.
		$body['sig'] = self::sign_request( $body, $settings['session_secret_key'] );

		// Append access token.
		$body['access_token'] = $settings['access_token'];

		return self::send_request( $url, $body );
	}

	/**
	 * Sign request.
	 *
	 * @param array  $body       Request params.
	 * @param string $secret_key Secret session key from settings.
	 */
	private static function sign_request( $body, $secret_key ) {
		$string = '';

		ksort( $body );

		foreach ( $body as $key => $value ) {
			$string = $string . $key . '=' . $value;
		}

		return md5( $string . $secret_key );
	}

	/**
	 * Upload image to OK.ru.
	 *
	 * @param string $poster   Path to local image file.
	 * @param array  $settings Settings array from options.
	 * @param string $url      API url.
	 */
	private static function upload_poster( $poster, $settings, $url ) {
		// Get server url to upload poster.
		$server = self::get_upload_server( $settings, $url );

		if ( is_wp_error( $server ) ) {
			return $server;
		}

		$images = self::upload_image( $poster, $server );

		if ( is_wp_error( $images ) ) {
			return $images;
		}

		if ( empty( $images->photos ) ) {
			return new WP_Error( 'sending', esc_html__( 'An error occurred while uploading image', 'social-planner' ) );
		}

		// We need only first image.
		foreach ( $images->photos as $id => $photo ) {
			break;
		}

		if ( empty( $photo->token ) ) {
			return new WP_Error( 'sending', esc_html__( 'An error occurred while uploading image', 'social-planner' ) );
		}

		$photos = array(
			array(
				'id' => $photo->token,
			),
		);

		return $photos;
	}

	/**
	 * Upload image to remote server.
	 *
	 * @param string $poster Path to local image file.
	 * @param string $server URL to remote server for images uploading.
	 */
	private static function upload_image( $poster, $server ) {
		$boundary = uniqid( 'wp', true );

		// Generate multipart data body.
		$body = self::prepare_multipart_data( $poster, 'pic1', $boundary );

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$headers = array(
			'Content-Type'   => 'multipart/form-data; boundary=' . $boundary,
			'Content-Length' => strlen( $body ),
			'Accept'         => 'application/json',
			'Expect'         => '',
		);

		// Try to upload photo.
		$response = self::send_request( $server, $body, $headers );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( empty( $response['body'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'Empty response while image uploading', 'social-planner' ) );
		}

		return json_decode( $response['body'], false );
	}

	/**
	 * Get OK.ru server to upload image.
	 *
	 * @param array  $settings Settings array from options.
	 * @param string $url      API url.
	 */
	private static function get_upload_server( $settings, $url ) {
		$body = array(
			'method'          => 'photosV2.getUploadUrl',
			'application_key' => $settings['app_key'],
			'format'          => 'json',
		);

		$body['sig'] = self::sign_request( $body, $settings['session_secret_key'] );

		// Append access token.
		$body['access_token'] = $settings['access_token'];

		// Try to get OK.ru upload server.
		$response = self::send_request( $url, $body );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( empty( $response['body'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'Empty API response', 'social-planner' ) );
		}

		$response = json_decode( $response['body'], false );

		if ( empty( $response->upload_url ) ) {
			return new WP_Error( 'sending', esc_html__( 'Cannot get upload server', 'social-planner' ) );
		}

		return $response->upload_url;
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

		return wp_remote_post( $url, $args );
	}
}
