"use client";

import { useRef, useState } from "react";
import { IODispatcher } from "../hooks/IODispatcher";

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
		ioCount: 100,
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
		<div>
			<h1>Test Case:</h1>
			<fieldset>
				<label>IO count</label>
				<input
					type="number"
					min={10}
					name="ioCount"
					value={ testScenario.ioCount }
					onChange={ handleInputChange }
				/>
			</fieldset>
			<fieldset>
				<p>Track events</p>
				<fieldset>
					<input
						type="checkbox"
						name="topIn"
						id="top-in"
						checked={ testScenario.topIn }
						onChange={ handleCheckboxChange }
					/>
					<label htmlFor="top-in">Top-in</label>
				</fieldset>
				<fieldset>
					<input
						type="checkbox"
						name="topOut"
						id="top-out"
						checked={ testScenario.topOut }
						onChange={ handleCheckboxChange }
					/>
					<label htmlFor="top-out">Top-out</label>
				</fieldset>
				<fieldset>
					<input
						type="checkbox"
						name="bottomIn"
						id="bottom-in"
						checked={ testScenario.bottomIn }
						onChange={ handleCheckboxChange }
					/>
					<label htmlFor="bottom-in">Bottom-in</label>
				</fieldset>
				<fieldset>
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
			<button onClick={ startTest }>Start</button>
		</div>
	)
}


export default function PerformanceTest()
{
	const [ testScenario, setTestScenario ] = useState<TestScenario | false>( false );

	return (
		<div>
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