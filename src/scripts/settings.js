/**
 * Settings script handler.
 */

( function () {
	if ( 'undefined' === typeof wp ) {
		return;
	}

	const { __ } = wp.i18n;

	// Find settings element.
	const screen = document.getElementById( 'social-planner-settings' );

	// Stop if settings element not exists.
	if ( null === screen ) {
		return;
	}

	if ( 'undefined' === typeof window.socialPlannerSettings ) {
		return;
	}

	const config = window.socialPlannerSettings;

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

		parent.appendChild( warning );
	};

	/**
	 * Create provider settings field.
	 *
	 * @param {HTMLElement} provider Parent DOM element.
	 * @param {Object} args Field settings.
	 */
	const createField = ( provider, args ) => {
		const field = document.createElement( 'div' );
		field.classList.add( 'social-planner-field' );
		provider.appendChild( field );

		const title = document.createElement( 'strong' );
		title.textContent = args.label;
		field.appendChild( title );

		const input = document.createElement( 'input' );
		input.setAttribute( 'type', 'text' );
		field.appendChild( input );

		if ( args.required ) {
			input.setAttribute( 'required', 'required' );
		}

		if ( args.placeholder ) {
			input.setAttribute( 'placeholder', args.placeholder );
		}

		const hint = document.createElement( 'small' );
		field.appendChild( hint );

		if ( args.hint ) {
			hint.innerHTML = args.hint;
		}

		return field;
	};

	/**
	 * Append provider to form.
	 *
	 * @param {HTMLElement} parent Form DOM element.
	 * @param {Object} args Provider settings object.
	 */
	const appendProvider = ( parent, args ) => {
		const provider = document.createElement( 'div' );
		provider.classList.add( 'social-planner-provider' );
		parent.insertBefore( provider, parent.lastChild );

		// Collapse provider if it exists.
		if ( args.data ) {
			provider.classList.add( 'is-collapsed' );
		}

		args.data = args.data || {};

		// Set form not empty class to show submit button.
		parent.classList.add( 'updated' );

		// Find label in config by network.
		const label = args.network.label || __( 'Provider', 'social-planner' );

		// Create provider heading.
		const heading = document.createElement( 'div' );
		heading.classList.add( 'social-planner-heading' );
		heading.textContent = label + ' ' + __( 'settings', 'social-planner' );
		provider.appendChild( heading );

		// Create heading explainer.
		const explainer = document.createElement( 'span' );
		heading.appendChild( explainer );

		if ( args.data.title ) {
			explainer.textContent = ': ' + args.data.title;
		}

		// Trigger on heading click.
		heading.addEventListener( 'click', ( e ) => {
			e.preventDefault();

			provider.classList.toggle( 'is-collapsed' );
		} );

		// Create helper text.
		const helper = document.createElement( 'div' );
		helper.classList.add( 'social-planner-helper' );

		if ( args.network.helper ) {
			helper.innerHTML = args.network.helper;
			provider.appendChild( helper );
		}

		if ( ! config.fields ) {
			config.fields = [];
		}

		const fields = args.network.fields || [];

		// Create fields.
		for ( const key in fields ) {
			const field = createField( provider, fields[ key ] );

			// Find input.
			const input = field.querySelector( 'input' );

			// Set input name attribute.
			input.setAttribute( 'name', args.name + '[' + key + ']' );

			if ( args.data[ key ] ) {
				input.value = args.data[ key ];
			}
		}

		// Create remove button.
		const remove = document.createElement( 'button' );
		remove.classList.add( 'social-planner-remove' );
		remove.setAttribute( 'type', 'button' );
		remove.textContent = __( 'Delete provider', 'social-planner' );
		provider.appendChild( remove );

		// Trigger on provider remove button click.
		remove.addEventListener( 'click', () => {
			provider.parentNode.removeChild( provider );
		} );
	};

	/**
	 * Create and return main providers selector.
	 *
	 * @param {HTMLElement} parent Form DOM element.
	 */
	const createAppend = ( parent ) => {
		const append = document.createElement( 'div' );
		append.classList.add( 'social-planner-append' );
		parent.appendChild( append );

		const select = document.createElement( 'select' );
		append.appendChild( select );

		for ( const network in config.networks ) {
			// Check if label exists.
			if ( ! config.networks[ network ].label ) {
				continue;
			}

			const option = document.createElement( 'option' );
			option.textContent = config.networks[ network ].label;
			option.value = network;

			select.appendChild( option );
		}

		const button = document.createElement( 'button' );
		button.classList.add( 'button' );
		button.setAttribute( 'type', 'button' );
		button.textContent = __( 'Add provider', 'social-planner' );

		// Trigger on append button click.
		button.addEventListener( 'click', () => {
			// Generate unique provider index;
			const index = new Date().getTime().toString( 16 );

			// Generate name using network and index.
			const name = '[' + select.value + '-' + index + ']';

			appendProvider( parent, {
				name: config.option + name,
				network: config.networks[ select.value ],
			} );
		} );

		append.appendChild( button );
	};

	/**
	 * Create submit button
	 *
	 * @param {HTMLElement} parent Form DOM element.
	 */
	const createSubmit = ( parent ) => {
		const submit = document.createElement( 'button' );
		submit.classList.add( 'social-planner-submit', 'button', 'button-primary' );
		submit.setAttribute( 'type', 'submit' );
		submit.textContent = __( 'Save changes', 'social-planner' );

		parent.appendChild( submit );
	};

	/**
	 * Append settings form initial elements.
	 */
	const initProvidersForm = () => {
		const form = screen.querySelector( '.social-planner-providers' );

		// Check required settings.
		if ( ! config.option || ! config.networks ) {
			const message = __( 'Networks settings are not formatted correctly', 'social-planner' );

			return showWarning( form, message );
		}

		config.providers = config.providers || {};

		// Add form append.
		createAppend( form );

		// Add submit form button.
		createSubmit( form );

		for ( const key in config.providers ) {
			const match = key.match( /(.+)-(\w+)$/ ) || [];

			if ( 3 > match.length ) {
				continue;
			}

			// Use destructuring assignment on match.
			const [ , network, index ] = match;

			// Check if network exists.
			if ( ! config.networks[ network ] ) {
				continue;
			}

			// Generate name using network and index.
			const name = '[' + network + '-' + index + ']';

			appendProvider( form, {
				data: config.providers[ key ],
				name: config.option + name,
				network: config.networks[ network ],
			} );
		}
	};

	initProvidersForm();
} )();
