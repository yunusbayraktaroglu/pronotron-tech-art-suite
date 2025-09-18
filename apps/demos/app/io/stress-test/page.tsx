"use client";

import { useRef, useState } from "react";
import { IOVerticalOptions } from '@pronotron/io';
import { IODispatcher } from "../components/IODispatcher";

type TestScenario = {
	testCount: number;
	inViewport: boolean,
	ioCount: number;
	topEnter: boolean;
	topExit: boolean;
	bottomEnter: boolean;
	bottomExit: boolean;
	dispatchType: "modify_dom" | "console_log" | "never",
	onFastForward: IOVerticalOptions[ "dispatch" ][ "onFastForward" ],
};

export default function StressTestPage()
{
	const [ testScenario, setTestScenario ] = useState<TestScenario | false>( false );

	return (
		<div className="container mb-spacing-3xl">

			<div className="bg-slate-200 p-spacing-lg rounded-lg">
				{ testScenario ? (
					<p className="text-green-800 mb-5">Created { testScenario.ioCount } node. Scroll down to see effects. Check starts for performance.</p>
				) : null}
				<TestForm runTestScenario={ setTestScenario } />
			</div>

			{ testScenario ? ( 
				Array.from({ length: testScenario.ioCount }).map(( item, index ) => {

					const { dispatchType, inViewport, topEnter, topExit, bottomEnter, bottomExit, onFastForward } = testScenario;

					switch( dispatchType ){
						case "modify_dom": 
							return (
								<DomManipulator 
									key={ `${ testScenario.testCount }_${ index }` }
									index={ index } 
									inViewport={ inViewport }
									topEnter={ topEnter } 
									topExit={ topExit }
									bottomEnter={ bottomEnter } 
									bottomExit={ bottomExit }
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
									dispatch={ logDispatcher({ index, inViewport, topEnter, topExit, bottomEnter, bottomExit, onFastForward }) }
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
									dispatch={ emptyDispatcher({ inViewport, topEnter, topExit, bottomEnter, bottomExit, onFastForward }) }
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

interface TestFormProps {
	runTestScenario: ( scenario: TestScenario ) => void
};

function TestForm({ runTestScenario }: TestFormProps)
{
	const testCount = useRef( 0 );

	const [ warning, setWarning ] = useState( "" );
	const [ testScenario, setTestScenario ] = useState<Omit<TestScenario, "testCount">>({
		ioCount: 1000,
		dispatchType: "modify_dom",
		inViewport: true,
		topEnter: true,
		topExit: true,
		bottomEnter: true,
		bottomExit: true,
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
		const { inViewport, topEnter, topExit, bottomEnter, bottomExit } = testScenario;
		if ( ! inViewport && ! topEnter && ! topExit && ! bottomEnter && ! bottomExit ){
			setWarning( "Please select at least 1 event" );
			return;
		}
		testCount.current += 1;
		runTestScenario({ testCount: testCount.current, ...testScenario });
		setWarning( "" );
	};

	return (
		<div className="form">

			{ warning && <p className="text-red-500 mb-spacing-sm">{ warning }</p> }
			
			<fieldset className="flex flex-col landscape:flex-row justify-between items-start gap-5">

				<fieldset className="grid grid-rows-1 grid-cols-1 landscape:grid-cols-4 landscape:grid-rows-1 gap-5">

					<fieldset>
						<label htmlFor="ioCount">IO Node count</label>
						<input
							className="w-full"
							type="number"
							min={ 100 }
							name="ioCount"
							id="ioCount"
							value={ testScenario.ioCount }
							onChange={ handleInputChange }
						/>
					</fieldset>

					<fieldset>
						<label htmlFor="dispatch-type">Dispatch type</label>
						<select onChange={ handleSelectChange } name="dispatchType" id="dispatch-type" className="w-full">
							<option value="modify_dom">Modify dom</option>
							<option value="console_log">Console log</option>
							<option value="never">Never (useful for iteration speed)</option>
						</select>
					</fieldset>

					<fieldset>
						<label htmlFor="fast-forward">Fast-forward behavior</label>
						<select onChange={ handleSelectChange } name="onFastForward" id="fast-forward" className="w-full">
							<option value="skip_both">Skip both (default)</option>
							<option value="execute_both">Execute both events</option>
							<option value="execute_last">Execute last event</option>
						</select>
					</fieldset>

					<fieldset>
						<label>Track events</label>
						<fieldset className="checkbox">
							<fieldset>
								<input
									type="checkbox"
									name="inViewport"
									id="in-viewport"
									checked={ testScenario.inViewport }
									onChange={ handleCheckboxChange }
								/>
								<label htmlFor="in-viewport">In viewport</label>
							</fieldset>
							<fieldset>
								<input
									type="checkbox"
									name="topEnter"
									id="top-enter"
									checked={ testScenario.topEnter }
									onChange={ handleCheckboxChange }
								/>
								<label htmlFor="top-enter">Top-enter</label>
							</fieldset>
							<fieldset>
								<input
									type="checkbox"
									name="topExit"
									id="top-exit"
									checked={ testScenario.topExit }
									onChange={ handleCheckboxChange }
								/>
								<label htmlFor="top-exit">Top-exit</label>
							</fieldset>
							<fieldset>
								<input
									type="checkbox"
									name="bottomEnter"
									id="bottom-enter"
									checked={ testScenario.bottomEnter }
									onChange={ handleCheckboxChange }
								/>
								<label htmlFor="bottom-enter">Bottom-enter</label>
							</fieldset>
							<fieldset>
								<input
									type="checkbox"
									name="bottomExit"
									id="bottom-exit"
									checked={ testScenario.bottomExit }
									onChange={ handleCheckboxChange }
								/>
								<label htmlFor="bottom-exit">Bottom-exit</label>
							</fieldset>
						</fieldset>
					</fieldset>

				</fieldset>

				<button onClick={ startTest } className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-colors">Create IO nodes</button>

			</fieldset>

		</div>
	)
}

interface logDispatcherProps {
	index: number,
	inViewport: boolean;
	topEnter: boolean;
	topExit: boolean;
	bottomEnter: boolean;
	bottomExit: boolean;
	onFastForward: IOVerticalOptions[ "dispatch" ][ "onFastForward" ],
}

function logDispatcher({ index, inViewport, topEnter, topExit, bottomEnter, bottomExit, onFastForward }: logDispatcherProps )
{
	return {
		...( inViewport && { onInViewport: ( normalizedPosition: number ) => console.log( `${ index }: Normalized position: ${ normalizedPosition }` ) } ),
		...( topEnter && { onTopEnter: () => console.log( `${ index }: top-enter` ) } ),
		...( topExit && { onTopExit: () => console.log( `${ index }: top-exit` ) } ),
		...( bottomEnter && { onBottomEnter: () => console.log( `${ index }: bottom-enter` ) } ),
		...( bottomExit && { onBottomExit: () => console.log( `${ index }: bottom-exit` ) } ),
		onFastForward
	}
}

function emptyDispatcher({ inViewport, topEnter, topExit, bottomEnter, bottomExit, onFastForward }: logDispatcherProps )
{
	return {
		...( inViewport && { onInViewport: () => {} } ),
		...( topEnter && { onTopEnter: () => {} } ),
		...( topExit && { onTopExit: () => {} } ),
		...( bottomEnter && { onBottomEnter: () => {} } ),
		...( bottomExit && { onBottomExit: () => {} } ),
		onFastForward
	}
}

function DomManipulator({ index, inViewport, topEnter, topExit, bottomEnter, bottomExit, onFastForward }: logDispatcherProps )
{
	const [ pos, setPos ] = useState<number>( 0 );
	const [ state, setState ] = useState<false | string>( false );

	return (
		<div className="my-[120vh] text-center">
			<p><strong>#{ index }:</strong> Last recorded event: { state ? state : null }</p>
			<IODispatcher 
				className={ `bg-green-500 my-5 py-2` }
				offset={ 0 }
				//@ts-expect-error - At least 1 event is required
				dispatch={{
					...( inViewport === true && { onInViewport: ( normalizedPosition: number ) => setPos( normalizedPosition ) } ),
					...( topEnter === true && { onTopEnter: () => setState( "Top-enter" ) } ),
					...( topExit === true && { onTopExit: () => setState( "Top-exit" ) } ),
					...( bottomEnter === true && { onBottomEnter: () => setState( "Bottom-enter" ) } ),
					...( bottomExit === true && { onBottomExit: () => setState( "Bottom-exit" ) } ),
					onFastForward
				}}
			>
				<p>Normalized Position: { pos.toFixed( 2 ) }</p>
			</IODispatcher>
			<p><strong>#{ index }:</strong> Last recorded event: { state ? state : null }</p>
		</div>
	)
}
