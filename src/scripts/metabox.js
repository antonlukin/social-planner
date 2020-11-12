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

		// Create hidden input with attachment id.
		const input = document.createElement( 'input' );
		input.setAttribute( 'type', 'hidden' );
		input.setAttribute( 'name', args.name + '[attachment]' );
		poster.appendChild( input );

		// Create choose button.
		const choose = document.createElement( 'button' );
		choose.classList.add( 'choose' );
		choose.setAttribute( 'type', 'button' );
		choose.textContent = '+';
		poster.appendChild( choose );

		// Create image object.
		const image = document.createElement( 'img' );

		// Choose button listener.
		choose.addEventListener( 'click', () => {
			const frame = wp.media( {
				title: __( 'Choose poster image', 'social-planner' ),
				multiple: false,
			} );

			frame.on( 'select', () => {
				let selection = frame
					.state()
					.get( 'selection' )
					.first()
					.toJSON();

				// Set hidden inputs values
				input.value = selection.id;

				// Set thumbnail as selection if exists
				if ( 'undefined' !== typeof selection.sizes.thumbnail ) {
					selection = selection.sizes.thumbnail;
				}

				image.setAttribute( 'src', selection.url );
				poster.insertBefore( image, choose );
			} );

			frame.open();
		} );

		// Create revemo button.
		const remove = document.createElement( 'button' );
		remove.classList.add( 'remove' );
		remove.setAttribute( 'type', 'button' );
		poster.appendChild( remove );

		// Remove button listener.
		remove.addEventListener( 'click', ( e ) => {
			e.stopPropagation();

			poster.removeChild( image );
			input.value = '';
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
		snippet.appendChild( excerpt );

		createPoster( snippet, args );
	};

	/**
	 * Create non-publihsed target.
	 *
	 * @param {HTMLElement} parent Parent DOM element.
	 * @param {string} label Target label.
	 */
	const createTargetCheck = ( parent, label ) => {
		const check = document.createElement( 'label' );
		check.classList.add( 'social-planner-check' );
		parent.append( check );

		const input = document.createElement( 'input' );
		input.setAttribute( 'type', 'checkbox' );
		check.appendChild( input );

		const span = document.createElement( 'span' );
		span.textContent = label;
		check.appendChild( span );

		return check;
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

		const targets = document.createElement( 'div' );
		targets.classList.add( 'social-planner-targets' );
		task.appendChild( targets );

		for ( const key in config.providers ) {
			const provider = config.providers[ key ];

			if ( ! provider.label ) {
				continue;
			}

			const check = createTargetCheck( targets, provider.label );

			const input = check.querySelector( 'input' );
			input.setAttribute( 'name', args.name + '[targets][]' );
			input.value = key;
		}

		const remove = document.createElement( 'button' );
		remove.classList.add( 'social-planner-remove' );
		remove.setAttribute( 'type', 'button' );
		task.appendChild( remove );

		remove.addEventListener( 'click', () => {
			parent.removeChild( task );
		} );

		createSnippet( task, args );
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
			// Generate unique task index;
			const index = new Date().getTime().toString( 16 );

			appendTask( list, {
				name: config.meta + '[' + index + ']',
			} );
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
		createAppend( metabox );

		for ( const index in config.tasks ) {
			appendTask( list, {
				data: config.tasks[ index ],
				name: config.meta + '[' + index + ']',
			} );
		}
	};

	initMetabox();
} )();
