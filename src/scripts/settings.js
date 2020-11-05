( function( ) {
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

	/**
	 * Create and return main providers selector.
	 */
	createSelector = () => {
		let selector = document.createElement( 'select' );

		for ( name in settings.labels ) {
			let option = document.createElement( 'option' );
			option.textContent = settings.labels[name];
			option.value = name;

			selector.appendChild( option );
		}

		let append = screen.querySelector( '.social-planner-append' );
		append.appendChild( selector );

		return selector;
	};

	let selector = createSelector();


}() );
