"use client";

import { useRef, useState } from "react";
import { IODispatcher } from "../hooks/IODispatcher";

import styles from "./form.module.css";

type TestScenario = {
	testCount: number;
	ioCount: number;
	topIn: boolean;
	topOut: boolean;
	bottomIn: boolean;
	bottomOut: boolean;
}

interface TestFormProps {
	runTestScenario: ( scenario: any ) => void
};

function TestForm({ runTestScenario }: TestFormProps)
{
	const testCount = useRef( 0 );
	const [ testScenario, setTestScenario ] = useState({
		ioCount: 1000,
		topIn: false,
		topOut: false,
		bottomIn: false,
		bottomOut: false,
	});

	// Handle change for numeric input
	const handleInputChange = ( event: React.ChangeEvent<HTMLInputElement> ) => {
		const { name, value } = event.target;
		setTestScenario((prev) => ({
			...prev,
			[name]: Number( value ),
		}));
	};

	// Handle change for checkbox inputs
	const handleCheckboxChange = ( event: React.ChangeEvent<HTMLInputElement> ) => {
		const { name, checked } = event.target;
		setTestScenario((prev) => ({
			...prev,
			[name]: checked,
		}));
	};

	const startTest = () => {
		testCount.current += 1;
		runTestScenario({ testCount: testCount.current, ...testScenario });
		console.log( "Starting test with scenario:", testScenario );
		// You can add more logic here to initiate the test scenario
	};

	return (
		<div className={ styles.form }>
			<h1 className="text-2xl mb-4">Test Case:</h1>
			<fieldset className="flex flex-row gap-3">
				<fieldset>
					<label htmlFor="ioCount" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">IO count</label>
					<input
						className="p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-base focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						type="number"
						min={ 100 }
						name="ioCount"
						id="ioCount"
						value={ testScenario.ioCount }
						onChange={ handleInputChange }
					/>
				</fieldset>

				<fieldset>
					<label htmlFor="countries" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select dispatch type</label>
					<select id="countries" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
						<option>Modify dom</option>
						<option>Console log</option>
						<option>Never (useful for iteration speed)</option>
					</select>
				</fieldset>

				<fieldset>
					<p>Track events</p>
					<fieldset className={ styles.checkbox }>
						<input
							type="checkbox"
							name="topIn"
							id="top-in"
							checked={ testScenario.topIn }
							onChange={ handleCheckboxChange }
						/>
						<label htmlFor="top-in">Top-in</label>
					</fieldset>
					<fieldset className={ styles.checkbox }>
						<input
							type="checkbox"
							name="topOut"
							id="top-out"
							checked={ testScenario.topOut }
							onChange={ handleCheckboxChange }
						/>
						<label htmlFor="top-out">Top-out</label>
					</fieldset>
					<fieldset className={ styles.checkbox }>
						<input
							type="checkbox"
							name="bottomIn"
							id="bottom-in"
							checked={ testScenario.bottomIn }
							onChange={ handleCheckboxChange }
						/>
						<label htmlFor="bottom-in">Bottom-in</label>
					</fieldset>
					<fieldset className={ styles.checkbox }>
						<input
							type="checkbox"
							name="bottomOut"
							id="bottom-out"
							checked={ testScenario.bottomOut }
							onChange={ handleCheckboxChange }
						/>
						<label htmlFor="bottom-out">Bottom-out</label>
					</fieldset>
				</fieldset>


			</fieldset>
			<button onClick={ startTest } className="bg-green-500 hover:bg-green-400 p-3 rounded-full transition-colors">Create IO nodes</button>
		</div>
	)
}


export default function StressTestPage()
{
	const [ testScenario, setTestScenario ] = useState<TestScenario | false>( false );

	return (
		<div className="container py-7">
			<TestForm runTestScenario={ setTestScenario } />
			{ testScenario ? ( 
				Array.from({ length: testScenario.ioCount }).map(( item, index ) => {
					return (
						<div className="flex h-[110vh] landscape:h-[90vh] relative" key={ `${ testScenario.testCount }_${ index }` }>
							<p>#{ index } Dynamic line (top-in, top-out)</p>
							<IODispatcher
								className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-green-500"
								dispatch={ dispatcher( index, testScenario.topIn, testScenario.topOut, testScenario.bottomIn, testScenario.bottomOut ) } 
							/>
							<div className="flex h-[50vh]" />
						</div>
					)
				}) 
			) : null }
		</div>
	);
}


function dispatcher( index: number, topIn: boolean, topOut: boolean, bottomIn: boolean, bottomOut: boolean )
{
	return {
		"top-in": () => console.log( `${ index }: top-in` ),
		...( topOut && { "top-out": () => console.log( `${ index }: top-out` ) } ),
		...( bottomIn && { "bottom-in": () => console.log( `${ index }: bottom-in` ) } ),
		...( bottomOut && { "bottom-out": () => console.log( `${ index }: bottom-out` ) } ),
	}
}