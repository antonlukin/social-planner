/**
 * Metabox script handler.
 */
/* global ajaxurl:true */

( function () {
	if ( 'undefined' === typeof wp ) {
		return;
	}

	const { __ } = wp.i18n;

	const metabox = document.querySelector( '#social-planner-metabox > .inside' );

	// Stop if settings element not exists.
	if ( null === metabox ) {
		return;
	}

	if ( 'undefined' === typeof window.socialPlannerMetabox ) {
		return;
	}

	const config = window.socialPlannerMetabox;

	/**
	 * Show warning message.
	 *
	 * @param {HTMLElement} parent Parent DOM element.
	 * @param {string} message Error text message.
	 */
	const showWarning = ( parent, message ) => {
		const warning = document.createElement( 'p' );
		warning.classList.add( 'social-planner-warning' );
		warning.textContent = message;

		while ( parent.firstChild ) {
			parent.removeChild( parent.firstChild );
		}

		parent.appendChild( warning );
	};

	/**
	 * Return Date object with server timezone.
	 *
	 * @param {number} timestamp Optional timestamp.
	 */
	const getServerDate = ( timestamp ) => {
		timestamp = timestamp || Date.now();

		// Set default config offset.
		config.offset = parseInt( config.offset ) || 0;

		// Get client timezone offset.
		const timezone = new Date().getTimezoneOffset();

		// Get UTC timestamp with timezone offset.
		const UTC = Date.now() + timezone * 60 * 1000;

		// Update timestamp with server offset.
		timestamp = new Date( UTC + config.offset * 1000 );

		// Get date using server timestamp.
		return new Date( timestamp );
	};

	/**
	 * Parse datetime string.
	 *
	 * @param {HTMLElement} parent Parent element.
	 * @param {string} index Unique task key.
	 */
	const createTime = ( parent, index ) => {
		const date = getServerDate();

		const time = {
			hour: ( '0' + date.getHours() ).slice( -2 ),
			minute: ( '0' + date.getMinutes() ).slice( -2 ),
		};

		const meta = config.meta + '[' + index + ']';

		// Create hour input.
		const hour = document.createElement( 'input' );
		hour.setAttribute( 'type', 'text' );
		hour.setAttribute( 'name', meta + '[hour]' );
		hour.value = time.hour;
		parent.appendChild( hour );

		hour.addEventListener( 'change', () => {
			if ( ! hour.value.match( /^\d+$/ ) ) {
				return ( hour.value = time.hour );
			}

			hour.value = ( '0' + parseInt( hour.value ) ).slice( -2 );

			if ( hour.value > 23 || hour.value < 0 ) {
				return ( hour.value = time.hour );
			}

			time.hour = hour.value;
		} );

		const colon = document.createElement( 'span' );
		colon.textContent = ':';
		parent.appendChild( colon );

		// Create minute input.
		const minute = document.createElement( 'input' );
		minute.setAttribute( 'type', 'text' );
		minute.setAttribute( 'name', meta + '[minute]' );
		minute.value = time.minute;
		parent.appendChild( minute );

		minute.addEventListener( 'change', () => {
			if ( ! minute.value.match( /^\d+$/ ) ) {
				return ( minute.value = time.minute );
			}

			minute.value = ( '0' + minute.value ).slice( -2 );

			if ( minute.value > 59 || minute.value < 0 ) {
				return ( minute.value = time.minute );
			}

			time.minute = minute.value;
		} );
	};

	/**
	 * Helper to create option inside select box
	 *
	 * @param {HTMLElement} select Parent select element.
	 * @param {string} content Option text content.
	 * @param {string} value Optional option value.
	 */
	const createOption = ( select, content, value ) => {
		const option = document.createElement( 'option' );
		option.textContent = content;
		option.value = value || '';
		select.appendChild( option );

		return option;
	};

	/**
	 * Create task snippet poster.
	 *
	 * @param {HTMLElement} parent Parent DOM element.
	 * @param {string} index Unique task key.
	 * @param {Object} data Task params.
	 */
	const createPoster = ( parent, index, data ) => {
		if ( ! wp.media ) {
			return;
		}

		const poster = document.createElement( 'figure' );
		poster.classList.add( 'social-planner-poster' );
		parent.appendChild( poster );

		const meta = config.meta + '[' + index + ']';

		// Create choose button.
		const choose = document.createElement( 'button' );
		choose.classList.add( 'choose' );
		choose.setAttribute( 'type', 'button' );
		choose.textContent = '+';
		poster.appendChild( choose );

		// Create image object.
		const image = document.createElement( 'img' );

		// Create hidden input with attachment id.
		const attachment = document.createElement( 'input' );
		attachment.setAttribute( 'type', 'hidden' );
		attachment.setAttribute( 'name', meta + '[attachment]' );

		if ( data.attachment ) {
			attachment.value = data.attachment;
		}

		poster.appendChild( attachment );

		// Create hidden input with thumbnail image.
		const thumbnail = document.createElement( 'input' );
		thumbnail.setAttribute( 'type', 'hidden' );
		thumbnail.setAttribute( 'name', meta + '[thumbnail]' );

		if ( data.thumbnail ) {
			thumbnail.value = data.thumbnail;

			// Create image if thumbnail not empty.
			image.setAttribute( 'src', data.thumbnail );
			poster.insertBefore( image, choose );
		}

		poster.appendChild( thumbnail );

		// Choose button listener.
		choose.addEventListener( 'click', () => {
			const frame = wp.media( {
				title: __( 'Choose poster image', 'social-planner' ),
				multiple: false,
			} );

			frame.on( 'select', () => {
				const selection = frame.state().get( 'selection' ).first().toJSON();

				let url = selection.url;

				// Set attachment id value.
				attachment.value = selection.id;

				// Set thumbnail as selection if exists
				if ( 'undefined' !== typeof selection.sizes.thumbnail ) {
					url = selection.sizes.thumbnail.url;
				}

				thumbnail.value = url;
				image.setAttribute( 'src', url );

				if ( ! image.parentNode ) {
					poster.insertBefore( image, choose );
				}
			} );

			frame.open();
		} );

		// Create remove button.
		const remove = document.createElement( 'button' );
		remove.classList.add( 'remove' );
		remove.setAttribute( 'type', 'button' );
		poster.appendChild( remove );

		// Remove button listener.
		remove.addEventListener( 'click', ( e ) => {
			e.stopPropagation();

			// Clear hidden inputs values.
			attachment.value = '';
			thumbnail.value = '';

			poster.removeChild( image );
		} );

		return poster;
	};

	/**
	 * Create task snippet poster.
	 *
	 * @param {HTMLElement} parent Parent DOM element.
	 * @param {string} index Unique task key.
	 * @param {Object} data Task params.
	 */
	const createSnippet = ( parent, index, data ) => {
		const snippet = document.createElement( 'div' );
		snippet.classList.add( 'social-planner-snippet' );
		parent.appendChild( snippet );

		const meta = config.meta + '[' + index + ']';

		// Create excerpt textrea.
		const excerpt = document.createElement( 'textarea' );
		excerpt.classList.add( 'social-planner-excerpt' );
		excerpt.setAttribute( 'placeholder', __( 'Social networks summary', 'social-planner' ) );
		excerpt.setAttribute( 'name', meta + '[excerpt]' );

		if ( data.excerpt ) {
			excerpt.textContent = data.excerpt;
		}

		snippet.appendChild( excerpt );

		createPoster( snippet, index, data );
	};

	/**
	 *
	 * @param {HTMLElement} parent Parent DOM element.
	 * @param {string} index Unique task key.
	 * @param {Object} data Task params.
	 */
	const blockScheduler = ( parent, index, data ) => {
		const icon = document.createElement( 'span' );
		icon.classList.add( 'social-planner-clock' );
		parent.appendChild( icon );

		const text = document.createElement( 'span' );
		text.textContent = __( 'Scheduled for:', 'social-planner' );
		parent.appendChild( text );

		const time = document.createElement( 'strong' );
		time.textContent = data.scheduled;
		parent.appendChild( time );

		if ( ! window.FormData ) {
			return showWarning( parent, __( 'Your browser does not support the FormData feature.', 'social-planner' ) );
		}

		const cancel = document.createElement( 'button' );
		cancel.classList.add( 'button-link' );
		cancel.textContent = __( 'Cancel', 'social-planner' );

		cancel.addEventListener( 'click', ( e ) => {
			e.preventDefault();

			if ( ! config.action || ! config.nonce ) {
				return showWarning( parent, __( 'Incorrect configuration of metbox options.', 'social-planner' ) );
			}

			const postID = document.getElementById( 'post_ID' );

			if ( null === postID ) {
				return showWarning( parent, __( 'Post ID element is not defined.', 'social-planner' ) );
			}

			// Show the spinner.
			const spinner = document.createElement( 'span' );
			spinner.classList.add( 'spinner', 'is-active' );
			parent.appendChild( spinner );

			const formData = new window.FormData();

			// This parameter reflects the action that we send to the server.
			formData.append( 'handler', 'cancel' );

			formData.append( 'action', config.action );
			formData.append( 'nonce', config.nonce );

			// Append current post id and task key.
			formData.append( 'post', postID.value );
			formData.append( 'key', index );

			const xhr = new XMLHttpRequest();
			xhr.open( 'POST', ajaxurl );

			xhr.onerror = () => {
				return showWarning( parent, __( 'Something wrong with request.', 'social-planner' ) );
			};

			xhr.onload = () => {
				// const response = JSON.parse( xhr.response );

				delete data.scheduled;
				parent.innerHTML = '';
				createScheduler( parent.parentNode, index, data );
			};

			xhr.send( formData );
		} );

		parent.appendChild( cancel );
	};

	/**
	 * Create task delay block.
	 *
	 * @param {HTMLElement} parent Parent DOM element.
	 * @param {string} index Unique task key.
	 * @param {Object} data Task params.
	 */
	const createScheduler = ( parent, index, data ) => {
		const scheduler = document.createElement( 'div' );
		scheduler.classList.add( 'social-planner-scheduler' );
		parent.appendChild( scheduler );

		// Don't create scheduler for already planned tasks.
		if ( data.scheduled ) {
			return blockScheduler( scheduler, index, data );
		}

		const meta = config.meta + '[' + index + ']';

		// Create delay select.
		const date = document.createElement( 'select' );
		date.setAttribute( 'name', meta + '[date]' );
		scheduler.appendChild( date );

		const time = document.createElement( 'div' );
		time.classList.add( 'social-planner-time' );
		scheduler.appendChild( time );

		// Create default option.
		createOption( date, __( 'Do not send automatically', 'social-planner' ) );

		// Create send immediately option.
		createOption( date, __( 'Publish immediately', 'social-planner' ), 'now' );

		config.calendar = config.calendar || {};

		for ( const name in config.calendar ) {
			createOption( date, config.calendar[ name ], name );
		}

		date.addEventListener( 'change', () => {
			// Remove time element children.
			while ( time.firstChild ) {
				time.removeChild( time.firstChild );
			}

			// Show time only if the date.
			if ( date.value && date.value !== 'now' ) {
				createTime( time, index );
			}
		} );
	};

	/**
	 * Create preview setting element.
	 *
	 * @param {HTMLElement} parent Parent DOM element.
	 * @param {string} index Unique task key.
	 * @param {Object} data Task params.
	 */
	const createPreview = ( parent, index, data ) => {
		const preview = document.createElement( 'label' );
		preview.classList.add( 'social-planner-preview' );
		parent.appendChild( preview );

		const meta = config.meta + '[' + index + ']';

		// Create preview checkbox.
		const checkbox = document.createElement( 'input' );
		checkbox.setAttribute( 'type', 'checkbox' );
		checkbox.setAttribute( 'name', meta + '[preview]' );
		checkbox.value = 1;

		if ( data.preview ) {
			checkbox.setAttribute( 'checked', 'checked' );
		}

		preview.appendChild( checkbox );

		const title = document.createElement( 'span' );
		title.textContent = __( 'Do not generate preview', 'social-planner' );
		preview.appendChild( title );
	};

	/**
	 * Create non-publihsed target.
	 *
	 * @param {HTMLElement} parent Parent DOM element.
	 * @param {string} index Unique task key.
	 * @param {Object} data Task params.
	 */
	const createTargetCheck = ( parent, index, data ) => {
		// Loop through availble providers.
		for ( const key in config.providers ) {
			const provider = config.providers[ key ];

			if ( ! provider.label ) {
				continue;
			}

			const check = document.createElement( 'label' );
			check.classList.add( 'social-planner-check' );
			parent.append( check );

			const meta = config.meta + '[' + index + ']';

			// Create checkbox input.
			const input = document.createElement( 'input' );
			input.setAttribute( 'type', 'checkbox' );
			input.setAttribute( 'name', meta + '[targets][]' );
			input.value = key;

			const targets = data.targets || [];

			if ( targets && targets.indexOf( key ) > -1 ) {
				input.setAttribute( 'checked', 'checked' );
			}

			check.appendChild( input );

			const span = document.createElement( 'span' );
			span.textContent = provider.label;
			check.appendChild( span );
		}
	};

	/**
	 * Create targets element.
	 *
	 * @param {HTMLElement} parent Task DOM element.
	 * @param {string} index Unique task key.
	 * @param {Object} data Task params.
	 */
	const createTargets = ( parent, index, data ) => {
		const targets = document.createElement( 'div' );
		targets.classList.add( 'social-planner-targets' );
		parent.appendChild( targets );

		if ( config.errors ) {
			return;
		}

		if ( config.sent ) {
			return;
		}

		createTargetCheck( targets, index, data );
	};

	/**
	 * Generate new index and create empty task.
	 *
	 * @param {HTMLElement} parent List DOM element.
	 */
	const createEmptyTask = ( parent ) => {
		// Generate unique task index from timestamp.
		const index = new Date().getTime().toString( 36 );

		appendTask( parent, index );
	};

	/**
	 * Append task.
	 *
	 * @param {HTMLElement} parent List DOM element.
	 * @param {string} index Unique task key.
	 * @param {Object} data Task params.
	 */
	const appendTask = ( parent, index, data ) => {
		const task = document.createElement( 'fieldset' );
		task.classList.add( 'social-planner-task' );
		parent.appendChild( task );

		data = data || {};

		// Add element with list of targets.
		createTargets( task, index, data );

		const remove = document.createElement( 'button' );
		remove.classList.add( 'social-planner-remove' );
		remove.setAttribute( 'type', 'button' );
		task.appendChild( remove );

		remove.addEventListener( 'click', () => {
			parent.removeChild( task );

			if ( ! parent.hasChildNodes() ) {
				createEmptyTask( parent );
			}
		} );

		// Add snippet element.
		createSnippet( task, index, data );

		// Add advanced settings element.
		createPreview( task, index, data );

		// Add scheduler element.
		createScheduler( task, index, data );
	};

	/**
	 * Create button to append new task.
	 *
	 * @param {HTMLElement} list Parent DOM Element
	 */
	const createAppend = ( list ) => {
		const append = document.createElement( 'button' );
		append.classList.add( 'social-planner-append', 'button' );

		append.setAttribute( 'type', 'button' );
		append.textContent = __( 'Add task', 'social-planner' );

		append.addEventListener( 'click', () => {
			createEmptyTask( list );
		} );

		metabox.appendChild( append );
	};

	/**
	 * Create tasks list.
	 */
	const initMetabox = () => {
		const list = document.createElement( 'div' );
		list.classList.add( 'social-planner-list' );
		metabox.appendChild( list );

		if ( ! config.meta || ! config.providers ) {
			return showWarning(
				metabox,
				__( 'You need to configure providers on the plugin settings page.', 'social-planner' )
			);
		}

		config.tasks = config.tasks || {};

		// Add append button.
		createAppend( list );

		// List of index/datetime scheduled tasks.
		const schedules = config.schedules || {};

		for ( const index in config.tasks ) {
			const data = config.tasks[ index ];

			if ( schedules[ index ] ) {
				data.scheduled = schedules[ index ];
			}

			appendTask( list, index, data );
		}

		// Append at least one task.
		if ( ! list.hasChildNodes() ) {
			createEmptyTask( list );
		}
	};

	initMetabox();
} )();
