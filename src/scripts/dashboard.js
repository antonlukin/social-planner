/**
 * Dashboard script handler.
 */

( function () {
	if ( 'undefined' === typeof wp ) {
		return;
	}

	const { __ } = wp.i18n;

	// Find dashboard element.
	const dashboard = document.querySelector( '#social-planner-dashboard > .inside' );

	// Stop if settings element not exists.
	if ( null === dashboard ) {
		return;
	}

	if ( 'undefined' === typeof window.socialPlannerDashboard ) {
		return;
	}

	const config = window.socialPlannerDashboard || {};

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
	 * Create scheduled task header.
	 *
	 * @param {Object} data Task data from config.
	 */
	const createTaskHeader = ( data ) => {
		const header = document.createElement( 'div' );
		header.classList.add( 'social-planner-header' );

		if ( data.scheduled ) {
			const scheduled = document.createElement( 'strong' );
			scheduled.textContent = data.scheduled;

			header.appendChild( scheduled );
		}

		if ( data.postlink && data.editlink ) {
			const link = document.createElement( 'a' );
			link.setAttribute( 'href', data.editlink );

			link.textContent = data.postlink;
			header.appendChild( link );
		}

		return header;
	};

	/**
	 * Create scheduled task content.
	 *
	 * @param {Object} data Task data from config.
	 */
	const createTaskContent = ( data ) => {
		const content = document.createElement( 'div' );
		content.classList.add( 'social-planner-content' );

		if ( data.excerpt ) {
			const excerpt = document.createElement( 'div' );
			excerpt.classList.add( 'social-planner-excerpt' );
			excerpt.innerHTML = data.excerpt;

			content.appendChild( excerpt );
		}

		if ( data.thumbnail ) {
			const thumbnail = document.createElement( 'img' );
			thumbnail.classList.add( 'social-planner-thumbnail' );
			thumbnail.setAttribute( 'src', data.thumbnail );

			content.appendChild( thumbnail );
		}

		return content;
	};

	/**
	 * Create scheduled task targets.
	 *
	 * @param {Object} data Task data from config.
	 */
	const createTaskTargets = ( data ) => {
		const targets = document.createElement( 'div' );
		targets.classList.add( 'social-planner-targets' );

		data.networks = data.networks || [];

		for ( let i = 0; i < data.networks.length; i++ ) {
			const network = document.createElement( 'span' );
			network.classList.add( 'social-planner-network' );
			network.textContent = data.networks[ i ];

			targets.appendChild( network );
		}

		return targets;
	};

	/**
	 * Create scheduled task.
	 *
	 * @param {Object} data Task data from config.
	 */
	const createTask = ( data ) => {
		const task = document.createElement( 'div' );
		task.classList.add( 'social-planner-task' );

		const header = createTaskHeader( data );
		task.appendChild( header );

		const content = createTaskContent( data );
		task.appendChild( content );

		const targets = createTaskTargets( data );
		task.appendChild( targets );

		return task;
	};

	/**
	 * Init dashboard.
	 */
	const initDashboard = () => {
		if ( ! config.tasks ) {
			return showWarning( dashboard, __( 'Nothing planned.', 'social-planner' ) );
		}

		config.tasks = config.tasks || [];

		const list = document.createElement( 'div' );
		list.classList.add( 'social-planner-list' );
		dashboard.appendChild( list );

		for ( let i = 0; i < config.tasks.length; i++ ) {
			const task = createTask( config.tasks[ i ] );

			list.appendChild( task );
		}
	};

	initDashboard();
} )();
