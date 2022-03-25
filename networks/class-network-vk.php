<?php
/**
 * VK.com network handler for Social Planner plugin
 *
 * @package social-planner
 * @author  Anton Lukin
 */

namespace Social_Planner;

use WP_Error;

/**
 * VK.com Social Planner class
 *
 * @since 1.0.0
 */
class Network_VK {
	/**
	 * Unique network slug.
	 *
	 * @var string
	 */
	const NETWORK_NAME = 'vk';

	/**
	 * Settings helper link.
	 *
	 * @var string
	 */
	const HELPER_LINK = 'https://wpset.org/social-planner/setup/#vk';

	/**
	 * Return human-readable network label
	 */
	public static function get_label() {
		return _x( 'VK.com', 'provider label', 'social-planner' );
	}

	/**
	 * Get network helper link
	 */
	public static function get_helper() {
		$helper = sprintf(
			wp_kses(
				// translators: %s is a link for current network help guide.
				__( 'Read the <a href="%s" target="_blank">help guide</a> for configuring VK.com provider.', 'social-planner' ),
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
				'label'    => __( 'Access token', 'social-planner' ),
				'required' => true,
			),

			'group' => array(
				'label'    => __( 'Community or profile ID', 'social-planner' ),
				'required' => true,
				'hint'     => __( 'Use a negative value to designate a community ID.', 'social-planner' ),
			),

			'title' => array(
				'label' => __( 'Subtitle', 'social-planner' ),
				'hint'  => __( 'Optional field. Used as an subtitle if there are multiple VK.com providers.', 'social-planner' ),
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

		if ( empty( $settings['group'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'Group parameter is not found', 'social-planner' ) );
		}

		$response = self::make_request( $message, $settings );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( empty( $response['body'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'Empty API response', 'social-planner' ) );
		}

		$response = json_decode( $response['body'], false );

		if ( ! empty( $response->response->post_id ) ) {
			$group = sanitize_text_field( $settings['group'] );

			// Create link using post id.
			return "https://vk.com/wall{$group}_{$response->response->post_id}";
		}

		if ( ! empty( $response->error->error_msg ) ) {
			return new WP_Error( 'sending', $response->error->error_msg );
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
		$version = '5.126';

		$attachments = array();

		if ( ! empty( $message['poster'] ) ) {
			$poster = self::upload_poster( $message['poster'], $settings, $version );

			if ( is_wp_error( $poster ) ) {
				return $poster;
			}

			$attachments[] = 'photo' . $poster;
		}

		if ( ! empty( $message['preview'] ) && ! empty( $message['link'] ) ) {
			$attachments[] = $message['link'];
		}

		$body = array(
			'access_token' => $settings['token'],
			'owner_id'     => $settings['group'],
			'v'            => $version,
			'from_group'   => 1,
			'message'      => self::prepare_message_excerpt( $message ),
			'attachments'  => implode( ',', $attachments ),
		);

		$url = 'https://api.vk.com/method/wall.post';

		// Publish message.
		return self::send_request( $url, $body );
	}

	/**
	 * Upload image to VK.com wall.
	 *
	 * @param string $poster   Path to local image file.
	 * @param array  $settings Settings array from options.
	 * @param string $version  API version secret.
	 */
	private static function upload_poster( $poster, $settings, $version ) {
		$body = array(
			'access_token' => $settings['token'],
			'group_id'     => absint( $settings['group'] ),
			'v'            => $version,
		);

		// Get server url to upload poster.
		$server = self::get_upload_server( $body );

		if ( is_wp_error( $server ) ) {
			return $server;
		}

		$options = self::upload_image( $poster, $server, $body );

		if ( is_wp_error( $options ) ) {
			return $options;
		}

		$url = 'https://api.vk.com/method/photos.saveWallPhoto';

		// Save image to VK.com wall.
		$response = self::send_request( $url, array_merge( $body, $options ) );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( empty( $response['body'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'Empty API response', 'social-planner' ) );
		}

		$response = json_decode( $response['body'], false );

		if ( empty( $response->response[0] ) ) {
			return new WP_Error( 'sending', esc_html__( 'An error occurred while saving image', 'social-planner' ) );
		}

		$response = $response->response[0];

		if ( empty( $response->owner_id ) || empty( $response->id ) ) {
			return new WP_Error( 'sending', esc_html__( 'An error occurred while saving image', 'social-planner' ) );
		}

		return $response->owner_id . '_' . $response->id;
	}

	/**
	 * Upload image to remote server.
	 *
	 * @param string $poster Path to local image file.
	 * @param string $server URL to remote server for images uploading.
	 * @param array  $body   List of request params.
	 */
	private static function upload_image( $poster, $server, $body ) {
		$boundary = uniqid( 'wp', true );

		// Generate multipart data body.
		$body = self::prepare_multipart_data( $body, array( 'photo' => $poster ), $boundary );

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$headers = array(
			'Content-Type'   => 'multipart/form-data; boundary=' . $boundary,
			'Content-Length' => strlen( $body ),
		);

		// Try to upload photo.
		$response = self::send_request( $server, $body, $headers );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( empty( $response['body'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'Empty API response', 'social-planner' ) );
		}

		return json_decode( $response['body'], true );
	}

	/**
	 * Get VK.com server to upload image.
	 *
	 * @param array $body List of request params.
	 */
	private static function get_upload_server( $body ) {
		$url = 'https://api.vk.com/method/photos.getWallUploadServer';

		// Try to get VK wall upload server.
		$response = self::send_request( $url, $body );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( empty( $response['body'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'Empty API response', 'social-planner' ) );
		}

		$response = json_decode( $response['body'], false );

		if ( empty( $response->response->upload_url ) ) {
			return new WP_Error( 'sending', esc_html__( 'Cannot get upload server', 'social-planner' ) );
		}

		return $response->response->upload_url;
	}

	/**
	 * Create multipart data.
	 *
	 * @param array  $data     List of default query params.
	 * @param array  $files    List of files.
	 * @param string $boundary Boundary delimiter.
	 */
	private static function prepare_multipart_data( $data, $files, $boundary ) {
		$body = array();

		foreach ( $data as $key => $value ) {
			$body[] = "--$boundary";
			$body[] = "Content-Disposition: form-data; name=\"$key\"";
			$body[] = "\r\n" . $value;
		}

		foreach ( $files as $name => $filename ) {
			$file = basename( $filename );
			$type = wp_check_filetype( $filename )['type'];

			// phpcs:ignore WordPress.WP.AlternativeFunctions
			$content = file_get_contents( $filename );

			if ( false === $content ) {
				return new WP_Error( 'sending', esc_html__( 'Cannot read poster file' ) );
			}

			$body[] = "--$boundary";
			$body[] = "Content-Disposition: form-data; name=\"$name\"; filename=\"$file\"";
			$body[] = "Content-Type: $type";
			$body[] = "\r\n" . $content;
		}

		// Add final boundary.
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
