import { useState, useCallback, ChangeEvent } from "react";

// The generic type T will represent the shape of your form state
interface UseFormResult<T>
{
	values: T;
	handleInputChange: ( event: ChangeEvent<HTMLInputElement> ) => void;
	handleCheckboxChange: ( event: ChangeEvent<HTMLInputElement> ) => void;
	handleSelectChange: ( event: ChangeEvent<HTMLSelectElement> ) => void;
	resetForm: () => void;
	setValues: ( newValues: T ) => void;
};

/**
 * A custom hook to manage form state and handlers.
 * 
 * @param initialState - The initial state object for the form.
 * @returns An object containing form values and change handlers.
 */
export function useForm<T extends Record<string, any>>( initialState: T ): UseFormResult<T>
{
	const [ values, setValues ] = useState<T>( initialState );

	// General handler for text, number (as string), email, etc.
	const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		const { name, value, type } = event.target;
		setValues(( prev ) => {
			let newValue: any = value;
			if ( type === 'number' ){
				newValue = value === '' ? null : Number( value );
			}
			return { ...prev, [ name ]: newValue };
		});
	}, []);

	// Handler specifically for checkbox inputs
	const handleCheckboxChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		const { name, checked } = event.target;
		setValues(( prev ) => ({
			...prev,
			[ name ]: checked, // Checkboxes typically map to boolean state
		}));
	}, []);

	// Handler specifically for <select> elements
	const handleSelectChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
		const { name, value } = event.target;
		setValues((prev) => ({
			...prev,
			[name]: value, // Select values are typically strings
		}));
	}, []);

	// Function to reset the form state to the initial state
	const resetForm = useCallback(() => {
		setValues( initialState );
	}, [ initialState ] );

	return {
		values,
		handleInputChange,
		handleCheckboxChange,
		handleSelectChange,
		resetForm,
		setValues
	};
}