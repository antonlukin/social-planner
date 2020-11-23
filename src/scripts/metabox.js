( function () {
	if ( 'undefined' === typeof wp ) {
		return;
	}

	const { __ } = wp.i18n;

	const metabox = document.querySelector(
		'#social-planner-metabox > .inside'
	);

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
	 * @param {string} message Error text message.
	 */
	const showWarning = ( message ) => {
		const warning = document.createElement( 'p' );
		warning.classList.add( 'social-planner-warning' );
		warning.textContent = message;

		metabox.appendChild( warning );
	};

	/**
	 * Return current time in H:i format.
	 */
	const getClientTime = () => {
		const time = {};
		const date = new Date();

		const hour = date.getHours();
		time.hour = ( '0' + hour ).slice( -2 );

		const minute = date.getMinutes();
		time.minute = ( '0' + minute ).slice( -2 );

		return time;
	};

	/**
	 * Parse datetime string.
	 *
	 * @param {string} parent Parent element.
	 * @param {Object} args Field settings.
	 */
	const createTime = ( parent, args ) => {
		const time = getClientTime();

		if ( config.time ) {
			const match = config.time.split( /:/ );

			time.hour = match[ 0 ];
			time.minute = match[ 1 ];
		}

		const hour = document.createElement( 'input' );
		hour.setAttribute( 'type', 'text' );
		hour.setAttribute( 'name', args.name + '[hour]' );
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

		const minute = document.createElement( 'input' );
		minute.setAttribute( 'type', 'text' );
		minute.setAttribute( 'name', args.name + '[minute]' );
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
	 * @param {Object} args Field settings.
	 */
	const createPoster = ( parent, args ) => {
		if ( ! wp.media ) {
			return;
		}

		const poster = document.createElement( 'figure' );
		poster.classList.add( 'social-planner-poster' );
		parent.appendChild( poster );

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
		attachment.setAttribute( 'name', args.name + '[attachment]' );

		if ( args.data.attachment ) {
			attachment.value = args.data.attachment;
		}

		poster.appendChild( attachment );

		// Create hidden input with thumbnail image.
		const thumbnail = document.createElement( 'input' );
		thumbnail.setAttribute( 'type', 'hidden' );
		thumbnail.setAttribute( 'name', args.name + '[thumbnail]' );

		if ( args.data.thumbnail ) {
			thumbnail.value = args.data.thumbnail;

			// Create image if thumbnail not empty.
			image.setAttribute( 'src', args.data.thumbnail );
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
				const selection = frame
					.state()
					.get( 'selection' )
					.first()
					.toJSON();

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
	 * @param {Object} args Field settings.
	 */
	const createSnippet = ( parent, args ) => {
		const snippet = document.createElement( 'div' );
		snippet.classList.add( 'social-planner-snippet' );
		parent.appendChild( snippet );

		const excerpt = document.createElement( 'textarea' );
		excerpt.classList.add( 'social-planner-excerpt' );
		excerpt.setAttribute(
			'placeholder',
			__( 'Social networks summary', 'social-planner' )
		);
		excerpt.setAttribute( 'name', args.name + '[excerpt]' );

		if ( args.data.excerpt ) {
			excerpt.textContent = args.data.excerpt;
		}

		snippet.appendChild( excerpt );

		createPoster( snippet, args );
	};

	/**
	 * Create task delay block.
	 *
	 * @param {HTMLElement} parent Parent DOM element.
	 * @param {Object} args Field settings.
	 */
	const createScheduler = ( parent, args ) => {
		const scheduler = document.createElement( 'div' );
		scheduler.classList.add( 'social-planner-scheduler' );
		parent.appendChild( scheduler );

		// Create delay select.
		const delay = document.createElement( 'select' );
		delay.setAttribute( 'name', args.name + '[delay]' );
		scheduler.appendChild( delay );

		const time = document.createElement( 'div' );
		time.classList.add( 'social-planner-time' );
		scheduler.appendChild( time );

		createTime( time, args );

		// Create default option
		createOption(
			delay,
			__( 'Do not send automatically', 'social-planner' )
		);

		// Create non-calendar option
		createOption(
			delay,
			__( 'Send immediately', 'social-planner' ),
			'now'
		);

		config.calendar = config.calendar || {};

		for ( const name in config.calendar ) {
			createOption( delay, config.calendar[ name ], name );
		}

		delay.addEventListener( 'change', () => {
			time.classList.remove( 'is-visible' );

			// Show time only if the date.
			if ( delay.value && delay.value !== 'now' ) {
				time.classList.add( 'is-visible' );
			}
		} );
	};

	/**
	 * Create preview setting element.
	 *
	 * @param {HTMLElement} parent Parent DOM element.
	 * @param {Object} args Field settings.
	 */
	const createPreview = ( parent, args ) => {
		const preview = document.createElement( 'label' );
		preview.classList.add( 'social-planner-preview' );
		parent.appendChild( preview );

		const checkbox = document.createElement( 'input' );
		checkbox.setAttribute( 'type', 'checkbox' );
		checkbox.setAttribute( 'name', args.name + '[preview]' );
		checkbox.value = 1;

		if ( args.data.preview ) {
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
	 * @param {Object} args Settings object.
	 */
	const createTargetCheck = ( parent, args ) => {
		// Loop through availble providers.
		for ( const key in config.providers ) {
			const provider = config.providers[ key ];

			if ( ! provider.label ) {
				continue;
			}

			const check = document.createElement( 'label' );
			check.classList.add( 'social-planner-check' );
			parent.append( check );

			const input = document.createElement( 'input' );
			input.setAttribute( 'type', 'checkbox' );
			input.setAttribute( 'name', args.name + '[targets][]' );
			input.value = key;

			const targets = args.data.targets || [];

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
	 * @param {Object} args Task settings object.
	 */
	const createTargets = ( parent, args ) => {
		const targets = document.createElement( 'div' );
		targets.classList.add( 'social-planner-targets' );
		parent.appendChild( targets );

		if ( config.errors ) {
			return;
		}

		if ( config.sent ) {
			return;
		}

		createTargetCheck( targets, args );
	};

	/**
	 * Generate new index and create empty task.
	 *
	 * @param {HTMLElement} parent List DOM element.
	 */
	const createEmptyTask = ( parent ) => {
		// Generate unique task index;
		const index = new Date().getTime().toString( 16 );

		appendTask( parent, {
			name: config.meta + '[' + index + ']',
		} );
	};

	/**
	 * Append task.
	 *
	 * @param {HTMLElement} parent List DOM element.
	 * @param {Object} args Task settings object.
	 */
	const appendTask = ( parent, args ) => {
		const task = document.createElement( 'div' );
		task.classList.add( 'social-planner-task' );
		parent.appendChild( task );

		args.data = args.data || {};

		// Add element with list of targets.
		createTargets( task, args );

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
		createSnippet( task, args );

		// Add advanced settings element
		createPreview( task, args );

		// Add scheduler element
		createScheduler( task, args );
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
				__(
					'You need to configure providers on the plugin settings page.',
					'social-planner'
				)
			);
		}

		config.tasks = config.tasks || {};

		// Add append button.
		createAppend( list );

		for ( const index in config.tasks ) {
			appendTask( list, {
				data: config.tasks[ index ],
				name: config.meta + '[' + index + ']',
			} );
		}

		// Append at least one task.
		if ( ! list.hasChildNodes() ) {
			createEmptyTask( list );
		}
	};

	initMetabox();
} )();
