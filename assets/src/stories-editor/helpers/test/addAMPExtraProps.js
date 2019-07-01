/**
 * Internal dependencies
 */
import { addAMPExtraProps } from '../';

describe( 'addAMPExtraProps', () => {
	it( 'does not modify non-child blocks', () => {
		const props = addAMPExtraProps( {}, { name: 'foo/bar' }, {} );

		expect( props ).toEqual( {} );
	} );

	it( 'generates a unique ID', () => {
		const props = addAMPExtraProps( {}, { name: 'amp/amp-story-text' }, {} );

		expect( props ).toHaveProperty( 'id' );
	} );

	it( 'uses the existing anchor attribute as the ID', () => {
		const props = addAMPExtraProps( {}, { name: 'amp/amp-story-text' }, { anchor: 'foo' } );

		expect( props ).toEqual( { id: 'foo' } );
	} );

	it( 'adds a font family attribute', () => {
		const props = addAMPExtraProps( {}, { name: 'amp/amp-story-text' }, { ampFontFamily: 'Roboto' } );

		expect( props ).toMatchObject( { 'data-font-family': 'Roboto' } );
	} );

	it( 'adds inline CSS for rotation', () => {
		const props = addAMPExtraProps( {}, { name: 'amp/amp-story-text' }, { rotationAngle: 90.54321 } );

		expect( props ).toMatchObject( { style: { transform: 'rotate(90deg)' } } );
	} );
} );