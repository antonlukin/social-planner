( function( ) {
	const { __, _x, _n, _nx } = wp.i18n;

	let screen = document.getElementById( 'social-planner-settings' );

	// Stop if settings element not exists.
	if ( null === screen ) {
		return;
	}

	if ( 'undefined' === typeof socialPlannerSettings ) {
		return;
	}

	let settings = socialPlannerSettings;

	// Check required settings.
	if ( ! settings.labels || ! settings.fields ) {
		return;
	}

	let wrapper = screen.querySelector( '.social-planner-wrapper' );

	/**
	 * Create network field.
	 */
	const createField = ( key, args, network ) => {
		let field = document.createElement( 'div' );
		field.classList.add( 'social-planner-field' );
		network.appendChild( field );

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
	};

	const removeNetwork = ( network ) => {
		network.remove();
	};

	/**
	 * Append empty network to list.
	 */
	const appendNetwork = ( name, label ) => {
		let network = document.createElement( 'div' );
		network.classList.add( 'social-planner-network' );
		wrapper.appendChild( network );

		// Create network heading.
		let heading = document.createElement( 'h3' );
		heading.textContent = __( 'Provider settings: ', 'social-planner' ) + label;
		network.appendChild( heading );

		// Create delete icon.
		let remover = document.createElement( 'button' );
		remover.classList.add( 'social-planner-remover', 'dashicons', 'dashicons-trash' );
		remover.setAttribute( 'type', 'button' );
		network.appendChild( remover );

		// Trigger on network remover button click.
		remover.addEventListener( 'click', ( e ) => {
			e.preventDefault();

			removeNetwork( network );
		});

		// Create helper text.
		let helper = document.createElement( 'div' );
		helper.classList.add( 'social-planner-helper' );

		if ( settings.helpers.hasOwnProperty( name ) ) {
			helper.innerHTML = settings.helpers[name];
			network.appendChild( helper );
		}

		let fields = settings.fields[name] || [];

		for ( let key in fields ) {
			createField( key, fields[ key ], network );
		}
	};

	/**
	 * Create and return main providers selector.
	 */
	const createSelector = ( wrapper ) => {
		let append = document.createElement( 'div' );
		append.classList.add( 'social-planner-append' );
		wrapper.appendChild( append );

		let select = document.createElement( 'select' );
		append.appendChild( select );

		for ( name in settings.labels ) {
			let option = document.createElement( 'option' );
			option.textContent = settings.labels[name];
			option.value = name;

			select.appendChild( option );
		}

		let button = document.createElement( 'button' );
		button.classList.add( 'button' );
		button.textContent = __( 'Add network', 'social-planner' );
		append.appendChild( button );

		// Trigger on append button click.
		button.addEventListener( 'click', ( e ) => {
			e.preventDefault();

			// Get selected option text content.
			let label = select.options[select.selectedIndex].text;

			appendNetwork( select.value, label );
		});

		return button;
	};

	let selector = createSelector( wrapper );

}() );
