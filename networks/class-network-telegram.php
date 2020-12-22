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
		if ( empty( $settings['token'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'Token parameter is not found', 'social-planner' ) );
		}

		// Get API URL using bot token from settings.
		$url = 'https://api.telegram.org/bot2' . $settings['token'];

		if ( empty( $settings['group'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'Group parameter is not found', 'social-planner' ) );
		}

		$response = self::make_request( $message, $url, $settings['group'] );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( empty( $response['body'] ) ) {
			return new WP_Error( 'sending', esc_html__( 'Empty Telegram response', 'social-planner' ) );
		}

		$response = json_decode( $response['body'] );

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

		return new WP_Error( 'sending', esc_html__( 'Unknown Telegram error', 'social-planner' ) );
	}

	/**
	 * Prepare data and send request to remote API.
	 *
	 * @param array  $message List of message args.
	 * @param string $url     Remote API URL.
	 * @param string $group   Group ID.
	 */
	private static function make_request( $message, $url, $group ) {
		$body = array(
			'parse_mode' => 'HTML',
			'chat_id'    => $group,
		);

		// Disable preview if necessary.
		if ( ! empty( $message['preview'] ) ) {
			$body['disable_web_page_preview'] = true;
		}

		// Update excerpt.
		if ( ! empty( $message['excerpt'] ) ) {
			$message['excerpt'] = preg_replace( '/\*(.+?)\*/s', '<b>$1</b>', $message['excerpt'] );
			$message['excerpt'] = preg_replace( '/_(.+?)_/s', '<i>$1</i>', $message['excerpt'] );

			if ( ! empty( $message['link'] ) ) {
				$message['excerpt'] = $message['excerpt'] . "\n\n" . $message['link'];
			}
		}

		// Create excerpt from link if it still empty.
		if ( ! empty( $message['link'] ) && empty( $message['excerpt'] ) ) {
			$message['excerpt'] = $message['link'];
		}

		if ( ! empty( $message['poster'] ) ) {
			$files = array( 'photo' => $message['poster'] );

			if ( ! empty( $message['excerpt'] ) ) {
				$body['caption'] = $message['excerpt'];
			}

			$boundary = uniqid( 'wp', true );

			// Generate multipart data body.
			$body = self::prepare_multipart_data( $body, $files, $boundary );

			// Add specific content-type header.
			$headers = array(
				'Content-Type'   => 'multipart/form-data; boundary=' . $boundary,
				'Content-Length' => strlen( $body ),
			);

			return self::send_request( $url . '/sendPhoto', $body, $headers );
		}

		if ( ! empty( $message['excerpt'] ) ) {
			$body['text'] = $message['excerpt'];

			return self::send_request( $url . '/sendMessage', $body );
		}

		return new WP_Error( 'sending', esc_html__( 'All sending parameters are empty', 'social-planner' ) );
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
		);

		if ( $headers ) {
			$args['headers'] = $headers;
		}

		return wp_remote_post( $url, $args );
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
}
