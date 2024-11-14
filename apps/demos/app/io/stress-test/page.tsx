"use client";

import { useRef, useState } from "react";
import { IODispatcher } from "../hooks/usePronotronIO";
import { IODispatchOptions, IONodeOptions } from '@pronotron/io';

import styles from "./form.module.css";

type TestScenario = {
	testCount: number;
	inViewport: boolean,
	ioCount: number;
	topIn: boolean;
	topOut: boolean;
	bottomIn: boolean;
	bottomOut: boolean;
	dispatchType: "modify_dom" | "console_log" | "never",
	onFastForward: IODispatchOptions[ "onFastForward" ],
};

interface TestFormProps {
	runTestScenario: ( scenario: any ) => void
};

function TestForm({ runTestScenario }: TestFormProps)
{
	const testCount = useRef( 0 );
	const [ testScenario, setTestScenario ] = useState<Omit<TestScenario, "testCount">>({
		ioCount: 1000,
		dispatchType: "modify_dom",
		inViewport: false,
		topIn: false,
		topOut: false,
		bottomIn: false,
		bottomOut: false,
		onFastForward: "skip_both",
	});

	// Handle change for numeric input
	const handleInputChange = ( event: React.ChangeEvent<HTMLInputElement> ) => {
		const { name, value } = event.target;
		setTestScenario(( prev ) => ({
			...prev,
			[ name ]: Number( value ),
		}));
	};

	// Handle change for checkbox inputs
	const handleCheckboxChange = ( event: React.ChangeEvent<HTMLInputElement> ) => {
		const { name, checked } = event.target;
		setTestScenario(( prev ) => ({
			...prev,
			[ name ]: checked,
		}));
	};

	// Handle change for numeric input
	const handleSelectChange = ( event: React.ChangeEvent<HTMLSelectElement> ) => {
		const { name, value } = event.target;
		setTestScenario(( prev ) => ({
			...prev,
			[ name ]: value,
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
					<label htmlFor="dispatch-type" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select dispatch type</label>
					<select onChange={ handleSelectChange } name="dispatchType" id="dispatch-type" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
						<option value="modify_dom">Modify dom</option>
						<option value="console_log">Console log</option>
						<option value="never">Never (useful for iteration speed)</option>
					</select>
				</fieldset>

				<fieldset>
					<label htmlFor="fast-forward" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select fast-forward type</label>
					<select onChange={ handleSelectChange } name="onFastForward" id="fast-forward" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
						<option value="skip_both">Skip both (default)</option>
						<option value="execute_both">Execute both events</option>
						<option value="execute_last">Execute last event</option>
					</select>
				</fieldset>

				<fieldset>
					<p>Track events</p>
					<fieldset className={ styles.checkbox }>
						<input
							type="checkbox"
							name="inViewport"
							id="in-viewport"
							checked={ testScenario.inViewport }
							onChange={ handleCheckboxChange }
						/>
						<label htmlFor="in-viewport">In viewport</label>
					</fieldset>
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

			<div className="flex h-[30vh]" />

			{ testScenario ? ( 
				Array.from({ length: testScenario.ioCount }).map(( item, index ) => {

					const { dispatchType, inViewport, topIn, topOut, bottomIn, bottomOut, onFastForward } = testScenario;

					switch( dispatchType ){
						case "modify_dom": 
							return (
								<NodManipulator 
									key={ `${ testScenario.testCount }_${ index }` }
									index={ index } 
									inViewport={ inViewport }
									topIn={ topIn } 
									topOut={ topOut }
									bottomIn={ bottomIn } 
									bottomOut={ bottomOut }
									onFastForward={ onFastForward } 
								/>
							)
						case "console_log": 
							return (
								<IODispatcher
									key={ `${ testScenario.testCount }_${ index }` }
									className={ `bg-green-500 my-[120vh]` }
									offset={ 0 }
									//@ts-expect-error - At least 1 event is required
									dispatch={ logDispatcher({ index, inViewport, topIn, topOut, bottomIn, bottomOut, onFastForward }) }
								>
									<p className="text-center">{ index }</p>
								</IODispatcher>
							)
						case "never": 
							return (
								<IODispatcher 
									key={ `${ testScenario.testCount }_${ index }` }
									className={ `bg-green-500 my-[120vh]` }
									offset={ 0 }
									//@ts-expect-error - At least 1 event is required
									dispatch={ emptyDispatcher({ inViewport, topIn, topOut, bottomIn, bottomOut, onFastForward }) }
								>
									<p className="text-center">{ index }</p>
								</IODispatcher>
							);
					}
				}) 
			) : null }

		</div>
	);
}





interface logDispatcherProps {
	index: number,
	inViewport: boolean;
	topIn: boolean;
	topOut: boolean;
	bottomIn: boolean;
	bottomOut: boolean;
	onFastForward: IODispatchOptions[ "onFastForward" ];
}

function logDispatcher({ index, inViewport, topIn, topOut, bottomIn, bottomOut, onFastForward }: logDispatcherProps )
{
	return {
		...( inViewport && { onInViewport: ( normalizedPosition: number ) => console.log( `${ index }: Normalized position: ${ normalizedPosition }` ) } ),
		...( topIn && { onTopIn: () => console.log( `${ index }: top-in` ) } ),
		...( topOut && { onTopOut: () => console.log( `${ index }: top-out` ) } ),
		...( bottomIn && { onBottomIn: () => console.log( `${ index }: bottom-in` ) } ),
		...( bottomOut && { onBottomOut: () => console.log( `${ index }: bottom-out` ) } ),
		onFastForward
	}
}

function emptyDispatcher({ inViewport, topIn, topOut, bottomIn, bottomOut, onFastForward }: logDispatcherProps )
{
	return {
		...( inViewport && { onInViewport: () => {} } ),
		...( topIn && { onTopIn: () => {} } ),
		...( topOut && { onTopOut: () => {} } ),
		...( bottomIn && { onBottomIn: () => {} } ),
		...( bottomOut && { onBottomOut: () => {} } ),
		onFastForward
	}
}



function NodManipulator({ index, inViewport, topIn, topOut, bottomIn, bottomOut, onFastForward }: logDispatcherProps )
{
	const [ pos, setPos ] = useState( 0 );
	const [ state, setState ] = useState<false | string>( false );

	return (
		<div className="my-[120vh] text-center">
			<p>#{ index }, State: { state ? state : null }</p>
			<IODispatcher 
				className={ `bg-green-500 my-5` }
				offset={ 0 }
				//@ts-expect-error - At least 1 event is required
				dispatch={{
					...( inViewport === true && { onInViewport: ( normalizedPosition: number ) => setPos( normalizedPosition ) } ),
					...( topIn === true && { onTopIn: () => setState( "Top-in" ) } ),
					...( topOut === true && { onTopOut: () => setState( "Top-out" ) } ),
					...( bottomIn === true && { onBottomIn: () => setState( "Bottom-in" ) } ),
					...( bottomOut === true && { onBottomOut: () => setState( "Bottom-out" ) } ),
					onFastForward
				}}
			>
				<p>#{ index }, Normalized Position: { pos }</p>
			</IODispatcher>
			<p>#{ index }, State: { state ? state : null }</p>
		</div>
	)
}
