/**
 * WordPress dependencies
 */
import { createContext, useEffect, useState, useRef, useCallback, useMemo, useContext } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { useError } from '../../utils/use-error';
import { Options } from '../../components/options-context-provider';

export const User = createContext();

/**
 * Context provider user data.
 *
 * @param {Object} props Component props.
 * @param {?any} props.children Component children.
 * @param {string} props.userOptionDeveloperTools The key of the option to use from the settings endpoint.
 * @param {string} props.userRestEndpoint REST endpoint to retrieve options.
 */
export function UserContextProvider( { children, userOptionDeveloperTools, userRestEndpoint } ) {
	const { originalOptions, fetchingOptions } = useContext( Options );
	const [ fetchingUser, setFetchingUser ] = useState( false );
	const [ developerToolsOption, setDeveloperToolsOption ] = useState( null );
	const [ originalDeveloperToolsOption, setOriginalDeveloperToolsOption ] = useState( null );
	const [ savingDeveloperToolsOption, setSavingDeveloperToolsOption ] = useState( false );
	const [ didSaveDeveloperToolsOption, setDidSaveDeveloperToolsOption ] = useState( false );
	const { setError } = useError();

	// This component sets state inside async functions. Use this ref to prevent state updates after unmount.
	const hasUnmounted = useRef( false );
	useEffect( () => () => {
		hasUnmounted.current = true;
	}, [] );

	const hasDeveloperToolsOptionChange = useMemo(
		() => null !== developerToolsOption && developerToolsOption !== originalDeveloperToolsOption,
		[ developerToolsOption, originalDeveloperToolsOption ],
	);
	/**
	 * Fetch user options on mount.
	 */
	useEffect( () => {
		if ( fetchingOptions ) {
			return;
		}

		if ( ! originalOptions.plugin_configured ) {
			setOriginalDeveloperToolsOption( null );
			setDeveloperToolsOption( null );
			return;
		}

		if ( ! userRestEndpoint || fetchingUser || null !== originalDeveloperToolsOption ) {
			return;
		}

		/**
		 * Fetches user data from the REST endpoint for the current user.
		 */
		( async () => {
			setFetchingUser( true );

			try {
				const fetchedUser = await apiFetch( { url: userRestEndpoint } );

				if ( true === hasUnmounted.current ) {
					return;
				}

				setOriginalDeveloperToolsOption( fetchedUser[ userOptionDeveloperTools ] );
				setDeveloperToolsOption( fetchedUser[ userOptionDeveloperTools ] );
			} catch ( e ) {
				setError( e );
				return;
			}

			setFetchingUser( false );
		} )();
	}, [ fetchingOptions, fetchingUser, originalDeveloperToolsOption, originalOptions.plugin_configured, setError, userOptionDeveloperTools, userRestEndpoint ] );

	/**
	 * Sends the option back to the REST endpoint to be saved.
	 */
	const saveDeveloperToolsOption = useCallback( async () => {
		if ( ! hasDeveloperToolsOptionChange ) {
			return;
		}

		setSavingDeveloperToolsOption( true );

		try {
			const fetchedUser = await apiFetch( { method: 'post', url: userRestEndpoint, data: { [ userOptionDeveloperTools ]: developerToolsOption } } );

			if ( true === hasUnmounted.current ) {
				return;
			}

			setOriginalDeveloperToolsOption( fetchedUser[ userOptionDeveloperTools ] );
			setDeveloperToolsOption( fetchedUser[ userOptionDeveloperTools ] );
		} catch ( e ) {
			setError( e );
			return;
		}

		setDidSaveDeveloperToolsOption( true );
		setSavingDeveloperToolsOption( false );
	}, [ hasDeveloperToolsOptionChange, developerToolsOption, setError, userOptionDeveloperTools, userRestEndpoint ] );

	return (
		<User.Provider
			value={
				{
					developerToolsOption,
					fetchingUser,
					didSaveDeveloperToolsOption,
					hasDeveloperToolsOptionChange,
					originalDeveloperToolsOption,
					saveDeveloperToolsOption,
					savingDeveloperToolsOption,
					setDeveloperToolsOption,
				}
			}
		>
			{ children }
		</User.Provider>
	);
}

UserContextProvider.propTypes = {
	children: PropTypes.any,
	userOptionDeveloperTools: PropTypes.string.isRequired,
	userRestEndpoint: PropTypes.string.isRequired,
};
