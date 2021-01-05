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
			parent.removeChild( parent.lastChild );
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
	 * @param {HTMLElement} parent Snippet DOM element.
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

		// Append choose button only for new tasks.
		if ( ! data.result.sent && ! data.schedule ) {
			poster.appendChild( choose );
		}

		// Create image object.
		const image = document.createElement( 'img' );

		// Create hidden input with attachment id.
		const attachment = document.createElement( 'input' );
		attachment.setAttribute( 'type', 'hidden' );
		attachment.setAttribute( 'name', meta + '[attachment]' );

		if ( data.task.attachment ) {
			attachment.value = data.task.attachment;
		}

		poster.appendChild( attachment );

		// Create hidden input with thumbnail image.
		const thumbnail = document.createElement( 'input' );
		thumbnail.setAttribute( 'type', 'hidden' );
		thumbnail.setAttribute( 'name', meta + '[thumbnail]' );

		if ( data.task.thumbnail ) {
			thumbnail.value = data.task.thumbnail;

			// Create image if thumbnail not empty.
			image.setAttribute( 'src', data.task.thumbnail );
			poster.appendChild( image );
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

		// Append remove button only for new tasks.
		if ( ! data.result.sent && ! data.schedule ) {
			poster.appendChild( remove );
		}

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
	 * @param {HTMLElement} parent Task DOM element.
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

		if ( data.result.sent ) {
			excerpt.setAttribute( 'readonly', 'readonly' );
		}

		if ( data.schedule ) {
			excerpt.setAttribute( 'readonly', 'readonly' );
		}

		if ( data.task.excerpt ) {
			excerpt.textContent = data.task.excerpt;
		}

		snippet.appendChild( excerpt );

		createPoster( snippet, index, data );
	};

	/**
	 * Draw task sent time.
	 *
	 * @param {HTMLElement} parent Scheduler DOM element.
	 * @param {Object} data Task params.
	 */
	const drawSentTime = ( parent, data ) => {
		const icon = document.createElement( 'span' );
		icon.classList.add( 'social-planner-calendar' );
		parent.appendChild( icon );

		const text = document.createElement( 'span' );
		text.textContent = __( 'Sent:', 'social-planner' );
		parent.appendChild( text );

		const time = document.createElement( 'strong' );
		time.textContent = data.result.sent;
		parent.appendChild( time );
	};

	/**
	 * Remove task by index.
	 *
	 * @param {string} index Unique task key.
	 */
	const removeTask = ( index ) => {
		delete config.tasks[ index ];

		// Create new tasks list.
		createTasksList();
	};

	/**
	 * Cancel task.
	 *
	 * @param {HTMLElement} parent Scheduler DOM element.
	 * @param {string} index Unique task key.
	 * @param {Function} callback Callback function.
	 */
	const cancelTask = ( parent, index, callback ) => {
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
			return showWarning( parent, __( 'Something went wrong.', 'social-planner' ) );
		};

		xhr.onload = () => {
			const response = JSON.parse( xhr.responseText );

			if ( ! response.success ) {
				return showWarning( parent, __( 'Something went wrong.', 'social-planner' ) );
			}

			// Retrun callback if exists.
			if ( typeof callback === 'function' ) {
				callback();
			}
		};

		xhr.send( formData );
	};

	/**
	 * Draw task scheduled time.
	 *
	 * @param {HTMLElement} parent Scheduler DOM element.
	 * @param {string} index Unique task key.
	 * @param {Object} data Task params.
	 */
	const drawScheduledTime = ( parent, index, data ) => {
		const icon = document.createElement( 'span' );
		icon.classList.add( 'social-planner-clock' );
		parent.appendChild( icon );

		const text = document.createElement( 'span' );
		text.textContent = __( 'Scheduled for:', 'social-planner' );
		parent.appendChild( text );

		const time = document.createElement( 'strong' );
		time.textContent = data.schedule;
		parent.appendChild( time );

		if ( ! window.FormData ) {
			return showWarning( parent, __( 'Your browser does not support the FormData feature.', 'social-planner' ) );
		}

		const cancel = document.createElement( 'button' );
		cancel.classList.add( 'button-link' );
		cancel.textContent = __( 'Cancel', 'social-planner' );

		cancel.addEventListener( 'click', ( e ) => {
			e.preventDefault();

			cancelTask( parent, index, () => {
				delete config.schedules[ index ];

				// Create new tasks list.
				createTasksList();
			} );
		} );

		parent.appendChild( cancel );
	};

	/**
	 * Create task scheduler block.
	 *
	 * @param {HTMLElement} parent Task DOM element.
	 * @param {string} index Unique task key.
	 * @param {Object} data Task params.
	 */
	const createScheduler = ( parent, index, data ) => {
		const scheduler = document.createElement( 'div' );
		scheduler.classList.add( 'social-planner-scheduler' );
		parent.appendChild( scheduler );

		// Check if task sent right away.
		if ( data.result.sent ) {
			return drawSentTime( scheduler, data );
		}

		// Don't create scheduler for already planned tasks.
		if ( data.schedule ) {
			return drawScheduledTime( scheduler, index, data );
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
				time.removeChild( time.lastChild );
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
	 * @param {HTMLElement} parent Task DOM element.
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
		checkbox.setAttribute( 'name', meta + '[preview]' );
		checkbox.value = 1;
		preview.appendChild( checkbox );

		// Create title.
		const title = document.createElement( 'span' );
		preview.appendChild( title );

		if ( data.result.sent || data.schedule ) {
			checkbox.setAttribute( 'type', 'hidden' );

			title.textContent = __( 'Preview enabled', 'social-planner' );

			if ( data.task.preview ) {
				checkbox.value = 0;

				// Set empty-preview title.
				title.textContent = __( 'Preview disabled', 'social-planner' );
			}

			return;
		}

		checkbox.setAttribute( 'type', 'checkbox' );

		if ( data.task.preview ) {
			checkbox.setAttribute( 'checked', 'checked' );
		}

		title.textContent = __( 'Disable preview', 'social-planner' );
	};

	/**
	 * Create non-publihsed target.
	 *
	 * @param {HTMLElement} parent Targets DOM element.
	 * @param {Object} provider Provider object.
	 */
	const createTargetCheckbox = ( parent, provider ) => {
		const label = document.createElement( 'label' );
		label.classList.add( 'social-planner-checkbox' );
		parent.appendChild( label );

		// Create checkbox input.
		const input = document.createElement( 'input' );
		input.setAttribute( 'type', 'checkbox' );
		label.appendChild( input );

		const span = document.createElement( 'span' );
		span.textContent = provider.label;
		label.appendChild( span );

		return input;
	};

	/**
	 * Create scheduled target.
	 *
	 * @param {HTMLElement} parent Targets DOM element.
	 * @param {Object} provider Provider object.
	 */
	const createTargetScheduled = ( parent, provider ) => {
		const label = document.createElement( 'label' );
		label.classList.add( 'social-planner-scheduled' );
		parent.appendChild( label );

		// Create checkbox input.
		const input = document.createElement( 'input' );
		input.setAttribute( 'type', 'hidden' );
		label.appendChild( input );

		const span = document.createElement( 'span' );
		span.textContent = provider.label;
		label.appendChild( span );

		return input;
	};

	/**
	 * Create target with error.
	 *
	 * @param {HTMLElement} parent Targets DOM element.
	 * @param {Object} message Link params.
	 * @param {Object} provider Provider object.
	 */
	const createTargetError = ( parent, message, provider ) => {
		const error = document.createElement( 'button' );

		error.classList.add( 'social-planner-error' );
		error.textContent = provider.label;

		error.addEventListener( 'click', ( e ) => {
			e.preventDefault();

			let extended = parent.querySelector( '.social-planner-extended' );

			if ( null !== extended ) {
				return parent.removeChild( extended );
			}

			const content = '<strong>' + __( 'Sent error:', 'social-planner' ) + '</strong>';

			extended = document.createElement( 'p' );
			extended.classList.add( 'social-planner-extended' );
			extended.textContent = message;
			extended.innerHTML = content + extended.textContent;

			parent.appendChild( extended );
		} );

		parent.appendChild( error );
	};

	/**
	 * Create target with link to sent message.
	 *
	 * @param {HTMLElement} parent Targets DOM element.
	 * @param {Object} message Link params.
	 * @param {Object} provider Provider object.
	 */
	const createTargetLink = ( parent, message, provider ) => {
		const link = document.createElement( 'a' );

		link.classList.add( 'social-planner-link' );
		link.textContent = provider.label;

		link.setAttribute( 'href', message );
		link.setAttribute( 'target', '_blank' );
		link.setAttribute( 'rel', 'noopener' );

		parent.appendChild( link );
	};

	/**
	 * Create target with sent message id.
	 *
	 * @param {HTMLElement} parent Targets DOM element.
	 * @param {Object} message Link params.
	 * @param {Object} provider Provider object.
	 */
	const createTargetInfo = ( parent, message, provider ) => {
		const info = document.createElement( 'button' );

		info.classList.add( 'social-planner-info' );
		info.textContent = provider.label;

		info.setAttribute( 'type', 'button' );

		info.addEventListener( 'click', ( e ) => {
			e.preventDefault();

			let extended = parent.querySelector( '.social-planner-extended' );

			if ( null !== extended ) {
				return parent.removeChild( extended );
			}

			const content = '<strong>' + __( 'Sent message:', 'social-planner' ) + '</strong>';

			extended = document.createElement( 'p' );
			extended.classList.add( 'social-planner-extended' );
			extended.textContent = message;
			extended.innerHTML = content + message;
			parent.appendChild( extended );
		} );

		parent.appendChild( info );
	};

	/**
	 * Create target for sent tasks.
	 *
	 * @param {HTMLElement} parent Targets DOM element.
	 * @param {string} meta Task meta prefix.
	 * @param {Object} data Task params.
	 */
	const createSentTargets = ( parent, meta, data ) => {
		const targets = data.task.targets || [];

		for ( let i = 0; i < targets.length; i++ ) {
			const key = targets[ i ];

			if ( ! config.providers[ key ] ) {
				continue;
			}

			// Get provider by key.
			const provider = config.providers[ key ];

			if ( ! provider.label ) {
				continue;
			}

			const input = document.createElement( 'input' );
			input.value = key;

			input.setAttribute( 'type', 'hidden' );
			input.setAttribute( 'name', meta + '[targets][]' );

			parent.appendChild( input );

			// If target in links list.
			if ( data.result.links && data.result.links[ key ] ) {
				const message = data.result.links[ key ];

				// Simple check if message is a link.
				if ( 'http' === message.substring( 0, 4 ) ) {
					createTargetLink( parent, message, provider );
				} else {
					createTargetInfo( parent, message, provider );
				}

				continue;
			}

			// Set default message.
			let message = __( 'The reason for this error is unknown', 'social-planner' );

			// Update message if target in errors list.
			if ( data.result.errors && data.result.errors[ key ] ) {
				message = data.result.errors[ key ];
			}

			createTargetError( parent, message, provider );
		}
	};

	/**
	 * Create target for unsent tasks.
	 *
	 * @param {HTMLElement} parent Targets DOM element.
	 * @param {string} meta Task meta prefix.
	 * @param {Object} data Task params.
	 */
	const createUnsentTargets = ( parent, meta, data ) => {
		const targets = data.task.targets || [];

		for ( const key in config.providers ) {
			const provider = config.providers[ key ];

			if ( ! provider.label ) {
				continue;
			}

			// For not scheduled tasks.
			if ( ! data.schedule ) {
				const input = createTargetCheckbox( parent, provider );

				input.setAttribute( 'name', meta + '[targets][]' );
				input.value = key;

				// Check if provider key in targets array.
				if ( targets.indexOf( key ) >= 0 ) {
					input.setAttribute( 'checked', 'checked' );
				}

				continue;
			}

			// Create hidden inputs for scheduled tasks.
			if ( targets.indexOf( key ) >= 0 ) {
				const input = createTargetScheduled( parent, provider );

				input.setAttribute( 'name', meta + '[targets][]' );
				input.value = key;
			}
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

		const meta = config.meta + '[' + index + ']';

		// Show target for sent tasks.
		if ( data.result.sent ) {
			return createSentTargets( targets, meta, data );
		}

		return createUnsentTargets( targets, meta, data );
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
	 */
	const appendTask = ( parent, index ) => {
		const data = {};

		const task = document.createElement( 'fieldset' );
		task.classList.add( 'social-planner-task' );
		parent.appendChild( task );

		data.task = {};

		// Append task data.
		if ( config.tasks && config.tasks[ index ] ) {
			data.task = config.tasks[ index ];
		}

		data.result = {};

		// Append task results.
		if ( config.results && config.results[ index ] ) {
			data.result = config.results[ index ];
		}

		data.schedule = null;

		// Append task schedule.
		if ( config.schedules && config.schedules[ index ] ) {
			data.schedule = config.schedules[ index ];
		}

		// Add element with list of targets.
		createTargets( task, index, data );

		// Create remove button.
		const remove = document.createElement( 'button' );
		remove.classList.add( 'social-planner-remove' );
		remove.setAttribute( 'type', 'button' );
		task.appendChild( remove );

		remove.addEventListener( 'click', () => {
			if ( ! data.schedule ) {
				return removeTask( index );
			}

			const scheduler = task.querySelector( '.social-planner-scheduler' );

			// Cancel this task first.
			cancelTask( scheduler, index, () => {
				return removeTask( index );
			} );
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
	 * @param {HTMLElement} list List DOM Element
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
	 * Create metabox tasks list.
	 */
	const createTasksList = () => {
		let list = metabox.querySelector( '.social-planner-list' );

		if ( null === list ) {
			list = document.createElement( 'div' );
			list.classList.add( 'social-planner-list' );
			metabox.appendChild( list );
		}

		// Clear list children.
		while ( list.firstChild ) {
			list.removeChild( list.lastChild );
		}

		// Define tasks if not yet.
		config.tasks = config.tasks || {};

		for ( const index in config.tasks ) {
			appendTask( list, index );
		}

		// Append at least one task.
		if ( ! list.hasChildNodes() ) {
			createEmptyTask( list );
		}

		return list;
	};

	/**
	 * Init metabox.
	 */
	const initMetabox = () => {
		if ( ! config.meta || ! config.providers ) {
			return showWarning( metabox, __( 'Need to configure the plugin on the settings page.', 'social-planner' ) );
		}

		const list = createTasksList();

		// Add append button.
		createAppend( list );
	};

	initMetabox();
} )();
