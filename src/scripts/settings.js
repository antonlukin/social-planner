( function( ) {
	if ( 'undefined' === typeof wp ) {
		return;
	}

	const { __ } = wp.i18n;

	let screen = document.getElementById( 'social-planner-settings' );

	// Stop if settings element not exists.
	if ( null === screen ) {
		return;
	}

	if ( 'undefined' === typeof socialPlannerSettings ) {
		return;
	}

	let config = socialPlannerSettings;

	/**
	 * Show warning message.
	 */
	const showWarning = ( parent, message ) => {
		let warning = document.createElement( 'p' );
		warning.classList.add( 'social-planner-warning' );
		warning.textContent = message;

		parent.appendChild( warning );
	};

	/**
	 * Create provider settings field.
	 */
	const createField = ( args, provider ) => {
		let field = document.createElement( 'div' );
		field.classList.add( 'social-planner-field' );
		provider.appendChild( field );

		let title = document.createElement( 'strong' );
		title.textContent = args.label;
		field.appendChild( title );

		let input = document.createElement( 'input' );
		input.setAttribute( 'type', 'text' );
		field.appendChild( input );

		if ( args.required ) {
			input.setAttribute( 'required', 'required' );
		}

		if ( args.placeholder ) {
			input.setAttribute( 'placeholder', args.placeholder );
		}

		let hint = document.createElement( 'small' );
		field.appendChild( hint );

		if ( args.hint ) {
			hint.innerHTML = args.hint;
		}

		return field;
	};

	/**
	 * Append provider to form.
	 */
	const appendProvider = ( form, network, index, data ) => {
		let provider = document.createElement( 'div' );
		provider.classList.add( 'social-planner-provider' );
		form.insertBefore( provider, form.lastChild );

		// Collapse provider if it exists.
		if ( data ) {
			provider.classList.add( 'collapsed' );
		}

		data = data || [];

		// Set form not empty class.
		form.classList.add( 'updated' );

		// Find label in config by network.
		let label = config.labels[network] || '';

		// Create provider heading.
		let heading = document.createElement( 'div' );
		heading.classList.add( 'social-planner-heading' );
		heading.textContent = label + ' ' + __( 'settings', 'social-planner' );
		provider.appendChild( heading );

		// Create heading explainer.
		let explainer = document.createElement( 'span' );
		heading.appendChild( explainer );

		if ( data.title ) {
			explainer.textContent = ': ' + data.title;
		}

		// Trigger on heading click.
		heading.addEventListener( 'click', ( e ) => {
			e.preventDefault();

			provider.classList.toggle( 'collapsed' );
		});

		// Create helper text.
		let helper = document.createElement( 'div' );
		helper.classList.add( 'social-planner-helper' );

		config.helpers = config.helpers || [];

		if ( config.helpers.hasOwnProperty( network ) ) {
			helper.innerHTML = config.helpers[network];
			provider.appendChild( helper );
		}

		if ( ! config.fields ) {
			config.fields = [];
		}

		let fields = config.fields[network] || [];

		// Create fields.
		for ( let key in fields ) {
			let field = createField( fields[ key ], provider );

			// Find input.
			let input = field.querySelector( 'input' );

			// Create field name attribute.
			let name = '[' + network + '-' + index + '][' + key + ']';

			// Set input name attribute.
			input.setAttribute( 'name', config.option + name );

			if ( data.hasOwnProperty( key ) ) {
				input.value = data[key];
			}
		}

		// Create remove button.
		let remove = document.createElement( 'button' );
		remove.classList.add( 'social-planner-remove' );
		remove.setAttribute( 'type', 'button' );
		remove.textContent = __( 'Delete provider', 'social-planner' );
		provider.appendChild( remove );

		// Trigger on provider remove button click.
		remove.addEventListener( 'click', ( e ) => {
			e.preventDefault();

			removeProvider( provider );
		});
	};

	/**
	 * Create and return main providers selector.
	 */
	const createAppend = ( form ) => {
		let append = document.createElement( 'div' );
		append.classList.add( 'social-planner-append' );
		form.appendChild( append );

		let select = document.createElement( 'select' );
		append.appendChild( select );

		for ( let network in config.labels ) {
			let option = document.createElement( 'option' );
			option.textContent = config.labels[network];
			option.value = network;

			select.appendChild( option );
		}

		let button = document.createElement( 'button' );
		button.classList.add( 'button' );
		button.setAttribute( 'type', 'button' );
		button.textContent = __( 'Add provider', 'social-planner' );

		// Trigger on append button click.
		button.addEventListener( 'click', () => {

			// Generate unique provider index;
			let index = ( new Date().getTime() ).toString( 16 );

			appendProvider( form, select.value, index );
		});

		append.appendChild( button );
	};

	/**
	 * Create submit button
	 */
	const createSubmit = ( form ) => {
		let submit = document.createElement( 'button' );
		submit.classList.add( 'social-planner-submit', 'button', 'button-primary' );
		submit.setAttribute( 'type', 'submit' );
		submit.textContent = __( 'Save changes', 'social-planner' );

		form.appendChild( submit );
	};

	const removeProvider = ( provider ) => {
		provider.parentNode.removeChild( provder );
	};

	/**
	 * Append settings form initial elements.
	 */
	const initProvidersForm = () => {
		let form = screen.querySelector( '.social-planner-providers' );

		// Check required settings.
		if ( ! config.option || ! config.labels ) {
			let message = __( 'Providers settings are not formatted correctly', 'social-planner' );

			return showWarning( form, message );
		}

		// Add form append.
		createAppend( form );

		// Add submit form button.
		createSubmit( form );

		for ( let key in config.providers ) {
			let match = key.match( /(.+)-(\w+)$/ ) || [];

			if ( 3 > match.length ) {
				continue;
			}

			let data = config.providers[key];

			// Use destructuring assignment on match.
			let [ , network, index ] = match;

			appendProvider( form, network, index, data );
		}
	};

	initProvidersForm();
}() );
