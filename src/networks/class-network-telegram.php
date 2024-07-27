<?php
/**
 * Telegram network handler for Social Planner plugin
 *
 * @package social-planner
 * @author  Anton Lukin
 */

namespace Social_Planner;

use WP_Error;

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
	const HELPER_LINK = 'https://wpset.org/social-planner/setup/#telegram';

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

		// Get API URL using bot token from settings.
		$path = 'https://api.telegram.org/bot' . $settings['token'];

		if ( empty( $settings['group'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'Group parameter is not found', 'social-planner' ) );
		}

		$response = self::make_request( $message, $path, $settings['group'] );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( empty( $response['body'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'Empty API response', 'social-planner' ) );
		}

		$response = json_decode( $response['body'], false );

		if ( ! empty( $response->result->message_id ) ) {
			$result = $response->result;

			// Set message id as output.
			$output = $result->message_id;

			// Create link if chat username exists.
			if ( ! empty( $result->chat->username ) ) {
				$output = "https://t.me/{$result->chat->username}/{$output}";
			}

			return $output;
		}

		if ( ! empty( $response->description ) ) {
			return new WP_Error( 'sending', $response->description );
		}

		return new WP_Error( 'sending', esc_html__( 'Unknown API error', 'social-planner' ) );
	}

	/**
	 * Prepare data and send request to remote API.
	 *
	 * @param array  $message List of message args.
	 * @param string $path    Remote API URL path.
	 * @param string $group   Group ID.
	 */
	private static function make_request( $message, $path, $group ) {
		$body = array(
			'parse_mode' => 'HTML',
			'chat_id'    => $group,
		);

		if ( empty( $message['preview'] ) ) {
			$body['disable_web_page_preview'] = true;
		}

		$excerpt = self::prepare_message_excerpt( $message );

		if ( ! empty( $message['poster'] ) ) {
			return self::send_poster( $message['poster'], $path, $excerpt, $body );
		}

		if ( empty( $excerpt ) ) {
			return new WP_Error( 'sending', esc_html__( 'Excerpt and poster are both empty', 'social-planner' ) );
		}

		$body['text'] = $excerpt;

		// Set url for message request.
		$url = $path . '/sendMessage';

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
	 * Send poster with caption to Telegram.
	 *
	 * @param string $poster  Path to local image file.
	 * @param string $path    Remote API URL path.
	 * @param string $excerpt Prepared caption for poster.
	 * @param array  $body    Prepared body array.
	 */
	private static function send_poster( $poster, $path, $excerpt, $body ) {
		$boundary = uniqid( 'wp', true );

		if ( ! empty( $excerpt ) ) {
			$body['caption'] = $excerpt;
		}

		// Generate multipart data body.
		$body = self::prepare_multipart_data( $body, array( 'photo' => $poster ), $boundary );

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$headers = array(
			'Content-Type'   => 'multipart/form-data; boundary=' . $boundary,
			'Content-Length' => strlen( $body ),
		);

		$url = $path . '/sendPhoto';

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
		$body = apply_filters( 'social_planner_filter_request_body', $body, $message, self::NETWORK_NAME, $url );

		return self::send_request( $url, $body, $headers );
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
			$message['excerpt'] = preg_replace( '/\*(.+?)\*/s', '<b>$1</b>', $message['excerpt'] );
			$message['excerpt'] = preg_replace( '/_(.+?)_/s', '<i>$1</i>', $message['excerpt'] );

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
		 * @since 1.1.12
		 */
		$args = apply_filters( 'social_planner_before_request', $args, $url, self::NETWORK_NAME );

		return wp_remote_post( $url, $args );
	}
}
