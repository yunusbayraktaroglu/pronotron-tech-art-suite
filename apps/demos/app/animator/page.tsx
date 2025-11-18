"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePerformanceStats } from "../hooks/usePerformanceStats";
import { SingleAnimation } from "./components/SingleAnimation";
import { useForm } from "../hooks/useForm";

type TestScenario = {
	animationCount: number;
	autoPause: boolean;
	delay: number;
};

export default function AnimatorDemoPage()
{
	const { setShowStats } = usePerformanceStats();
	const [ testScenario, setTestScenario ] = useState<TestScenario | false>( false );
	const [ scenarioEpoch, setTestScenarioEpoch ] = useState( 0 );

	useEffect( () => {
		// Open performance stats on page load
		setShowStats( true );
	}, [] );

	useEffect( () => {
		// Helps to giving different keys to flush animation component
		setTestScenarioEpoch( prev => prev + 1 );
	}, [ testScenario ] );

	return (
		<div className="container">
			<AnimationStressTestForm runTestScenario={ setTestScenario } />
			{ testScenario && (
				<div className="grid grid-cols-3 landscape:grid-cols-4 gap-spacing-xs my-spacing-base">
					{ Array.from({ length: testScenario.animationCount }).map(( _item, index ) => (
						<SingleAnimation 
							key={ `${ index }_${ scenarioEpoch }` } 
							id={ `${ index }` }
							autoPause={ testScenario.autoPause }
							delay={ testScenario.delay }
						/> 
					) )}
				</div>
			) }
		</div>
	);
}

interface TestFormProps {
	runTestScenario: ( scenario: TestScenario ) => void
};

function AnimationStressTestForm({ runTestScenario }: TestFormProps)
{
	const { values, handleInputChange, handleCheckboxChange } = useForm<TestScenario>( {
		animationCount: 1000,
		autoPause: true,
		delay: 0
	} );

	// Add 50 animations on page start
	useEffect( () => {
		runTestScenario( {	
			animationCount: 50,
			autoPause: true,
			delay: 0
		} );
	}, [] );

	const handleSubmit = useCallback( ( event: React.FormEvent ) => {
        event.preventDefault();
		runTestScenario( values );
    }, [ values ] );

	return (
		<div className="form flex flex-col landscape:flex-row items-start gap-5 bg-slate-200 p-spacing-lg mt-spacing-base rounded-lg">
			<fieldset>
				<label htmlFor="animationCount">Animation count</label>
				<input
					type="number"
					min={ 100 }
					name="animationCount"
					id="animationCount"
					value={ values.animationCount }
					onChange={ handleInputChange }
				/>
			</fieldset>

			<fieldset>
				<label htmlFor="delay">Delay</label>
				<input
					type="number"
					min={ 0 }
					step={ 0.1 }
					name="delay"
					id="delay"
					value={ values.delay }
					onChange={ handleInputChange }
				/>
				<p className="text-gray-500 text-xs leading-none mt-spacing-xs">(in seconds)</p>
			</fieldset>

			<fieldset>
				<label htmlFor="autoPause">Auto Pause</label>
				<fieldset className="checkbox">
					<fieldset>
						<input 
							type="checkbox"
							name="autoPause"
							id="autoPause"
							checked={ values.autoPause }
							onChange={ handleCheckboxChange }
						/>
						<label htmlFor="autoPause">Active</label>
					</fieldset>
				</fieldset>
				<p className="text-gray-500 text-xs leading-none">(when the screen/tab is unfocused)</p>
			</fieldset>

			<button onClick={ handleSubmit } className="block text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full transition-colors landscape:ml-auto">Create Animations</button>
		</div>
	)
}