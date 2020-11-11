( function( ) {
	if ( 'undefined' === typeof wp ) {
		return;
	}

	const { __ } = wp.i18n;

	let metabox = document.querySelector( '#social-planner-metabox > .inside' );

	// Stop if settings element not exists.
	if ( null === metabox ) {
		return;
	}

	if ( 'undefined' === typeof socialPlannerMetabox ) {
		return;
	}

	let config = socialPlannerMetabox;

	/**
	 * Show warning message.
	 */
	const showWarning = ( message ) => {
		let warning = document.createElement( 'p' );
		warning.classList.add( 'social-planner-warning' );
		warning.textContent = message;

		metabox.appendChild( warning );
	};

	/**
	 * Create task snippet poster
	 */
	const createPoster = ( snippet ) => {
		if ( ! wp.media ) {
			return;
		}

		let poster = document.createElement( 'figure' );
		poster.classList.add( 'social-planner-poster' );
		snippet.appendChild( poster );

		let input = document.createElement( 'input' );
		input.setAttribute( 'type', 'hidden' );
		poster.appendChild( input );

		// Create image object.
		let image = document.createElement( 'img' );

		let choose = document.createElement( 'button' );
		choose.classList.add( 'choose' );
		choose.setAttribute( 'type', 'button' );
		choose.textContent = '+';
		poster.appendChild( choose );

		// Choose button listener.
		choose.addEventListener( 'click', () => {
			let frame = wp.media({
				title: __( 'Choose poster image', 'social-planner' ),
				multiple: false
			});

			frame.on( 'select', () => {
				var selection = frame.state().get( 'selection' ).first().toJSON();

				// Set hidden inputs values
				input.value = selection.id;

				// Set thumbnail as selection if exists
				if ( 'undefined' !== typeof selection.sizes.thumbnail ) {
					selection = selection.sizes.thumbnail;
				}

				image.setAttribute( 'src', selection.url );

				// Insert image.
				poster.insertBefore( image, choose );
			});

			frame.open();
		});

		let remove = document.createElement( 'button' );
		remove.classList.add( 'remove' );
		remove.setAttribute( 'type', 'button' );
		poster.appendChild( remove );

		// Remove button listener.
		remove.addEventListener( 'click', ( e ) => {
			e.stopPropagation();

			input.value = '';

			// Remove image.
			poster.removeChild( image );
		});

		return poster;
	};

	/**
	 * Create task snippet.
	 */
	const createSnippet = ( task ) => {
		let snippet = document.createElement( 'div' );
		snippet.classList.add( 'social-planner-snippet' );
		task.appendChild( snippet );

		let excerpt = document.createElement( 'textarea' );
		excerpt.classList.add( 'social-planner-excerpt' );
		excerpt.setAttribute( 'placeholder', __( 'Social networks summary', 'social-planner' ) );
		snippet.appendChild( excerpt );

		let poster = createPoster( snippet );

		return snippet;
	};

	/**
	 * Create non-publihsed target.
	 */
	const createTargetCheck = ( key, label, targets ) => {
		let check = document.createElement( 'label' );
		check.classList.add( 'social-planner-check' );
		targets.append( check );

		let input = document.createElement( 'input' );
		input.setAttribute( 'type', 'checkbox' );
		check.appendChild( input );

		let span = document.createElement( 'span' );
		span.textContent = label;
		check.appendChild( span );
	};

	/**
	 * Append task.
	 */
	const appendTask = ( list ) => {
		let task = document.createElement( 'div' );
		task.classList.add( 'social-planner-task' );
		list.appendChild( task );

		let targets = document.createElement( 'div' );
		targets.classList.add( 'social-planner-targets' );
		task.appendChild( targets );

		for ( let key in config.labels ) {
			createTargetCheck( key, config.labels[key], targets );
		}

		let remove = document.createElement( 'button' );
		remove.classList.add( 'social-planner-remove' );
		remove.setAttribute( 'type', 'button' );
		task.appendChild( remove );

		remove.addEventListener( 'click', () => {
			list.removeChild( task );

			// Show at least one task.
			if ( 1 > list.children.length ) {
				appendTask( list );
			}
		});

		let snippet = createSnippet( task );
	};

	/**
	 * Create tasks list.
	 */
	const initMetabox = () => {
		let list = document.createElement( 'div' );
		list.classList.add( 'social-planner-list' );
		metabox.appendChild( list );

		let append = document.createElement( 'button' );
		append.classList.add( 'social-planner-append', 'button' );
		append.setAttribute( 'type', 'button' );
		append.textContent = __( 'Add task', 'social-planner' );

		append.addEventListener( 'click', () => {
			appendTask( list );
		});

		metabox.appendChild( append );

		// TODO: Remove.
		appendTask( list );
	};

	if ( ! config.labels ) {
		return showWarning( __( 'You need to configure providers on the plugin settings page.', 'social-planner' ) );
	}

	initMetabox();
}() );
