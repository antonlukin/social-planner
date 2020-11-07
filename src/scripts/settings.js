( function( ) {
	const { __ } = wp.i18n;

	let screen = document.getElementById( 'social-planner-settings' );

	// Stop if settings element not exists.
	if ( null === screen ) {
		return;
	}

	if ( 'undefined' === typeof socialPlannerSettings ) {
		return;
	}

	let settings = socialPlannerSettings;

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
	 * Prepend provider to list.
	 */
	const prependProvider = ( list, network, index, data ) => {
		let provider = document.createElement( 'div' );
		provider.classList.add( 'social-planner-provider' );
		list.insertBefore( provider, list.lastChild );

		// Collapse provider if it exists.
		if ( data ) {
			provider.classList.add( 'collapsed' );
		}

		data = data || [];

		// Set list not empty class.
		list.classList.add( 'updated' );

		// Find label in settings by network.
		let label = settings.labels[network] || '';

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

		settings.helpers = settings.helpers || [];

		if ( settings.helpers.hasOwnProperty( network ) ) {
			helper.innerHTML = settings.helpers[network];
			provider.appendChild( helper );
		}

		if ( ! settings.fields ) {
			settings.fields = [];
		}

		let fields = settings.fields[network] || [];

		// Create fields.
		for ( let key in fields ) {
			let field = createField( fields[ key ], provider );

			// Find input.
			let input = field.querySelector( 'input' );

			// Create field name attribute.
			let name = '[' + network + '-' + index + '][' + key + ']';

			// Set input name attribute.
			input.setAttribute( 'name', settings.option + name );

			if ( data.hasOwnProperty( key ) ) {
				input.value = data[key];
			}
		}

		// Create delete button.
		let remover = document.createElement( 'button' );
		remover.classList.add( 'social-planner-remover' );
		remover.setAttribute( 'type', 'button' );
		remover.textContent = __( 'Delete provider', 'social-planner' );
		provider.appendChild( remover );

		// Trigger on provider remover button click.
		remover.addEventListener( 'click', ( e ) => {
			e.preventDefault();

			removeProvider( provider );
		});
	};

	/**
	 * Create and return main providers selector.
	 */
	const createSelector = ( list ) => {
		let addnew = document.createElement( 'div' );
		addnew.classList.add( 'social-planner-addnew' );
		list.appendChild( addnew );

		let select = document.createElement( 'select' );
		addnew.appendChild( select );

		for ( let network in settings.labels ) {
			let option = document.createElement( 'option' );
			option.textContent = settings.labels[network];
			option.value = network;

			select.appendChild( option );
		}

		let button = document.createElement( 'button' );
		button.classList.add( 'button' );
		button.setAttribute( 'type', 'button' );
		button.textContent = __( 'Add provider', 'social-planner' );
		addnew.appendChild( button );

		// Trigger on addnew button click.
		button.addEventListener( 'click', ( e ) => {
			e.preventDefault();

			// Generate unique provider index;
			let index = ( new Date().getTime() ).toString( 16 );

			prependProvider( list, select.value, index );
		});

	};

	/**
	 * Create submit button
	 */
	const createSubmit = ( list ) => {
		let submit = document.createElement( 'button' );
		submit.classList.add( 'social-planner-submit', 'button', 'button-primary' );
		submit.setAttribute( 'type', 'submit' );
		submit.textContent = __( 'Save changes', 'social-planner' );

		list.appendChild( submit );
	};

	const removeProvider = ( provider ) => {
		provider.remove();
	};

	/**
	 * Append settings form initial elements.
	 */
	const initProvidersForm = () => {
		let list = screen.querySelector( '.social-planner-providers' );

		// Check required settings.
		if ( ! settings.option || ! settings.labels ) {
			let message = __( 'Providers settings are not formatted correctly', 'social-planner' );

			return showWarning( list, message );
		}

		// Add list selector.
		createSelector( list );

		// Add submit list button.
		createSubmit( list );

		for ( let key in settings.providers ) {
			let match = key.match( /(.+)-(\w+)$/ ) || [];

			if ( 3 > match.length ) {
				continue;
			}

			let data = settings.providers[key];

			// Use destructuring assignment on match.
			let [ , network, index ] = match;

			prependProvider( list, network, index, data );
		}
	};

	return initProvidersForm();
}() );
