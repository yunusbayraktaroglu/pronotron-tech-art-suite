"use client";

import { useEffect, useState, useRef } from "react";
import { usePerformanceStats } from "../hooks/usePerformanceStats";
import { SingleAnimation } from "./components/SingleAnimation";

type TestScenario = {
	testCount: number;
	animationCount: number;
	timeStyle: "pausable" | "continious";
};

export default function AnimatorDemoPage()
{
	const { setIsActive } = usePerformanceStats();
	const [ testScenario, setTestScenario ] = useState<TestScenario>({
		testCount: 0,
		animationCount: 50,
		timeStyle: "pausable"
	});

	useEffect(() => {
		setIsActive( true );
	}, []);

	return (
		<div className="container">
			<AnimationStressTestForm runTestScenario={ setTestScenario } />
			<div className="grid grid-cols-3 landscape:grid-cols-4 gap-spacing-xs my-spacing-base">
				{ Array.from({ length: testScenario.animationCount }).map(( item, index ) => (
					<SingleAnimation 
						key={ `${ testScenario.testCount }_${ index }` } 
						ID={ index }
						timeStyle={ testScenario.timeStyle } 
					/> 
				) )}
			</div>
		</div>
	);
}

interface TestFormProps {
	runTestScenario: ( scenario: TestScenario ) => void
};

function AnimationStressTestForm({ runTestScenario }: TestFormProps)
{
	const testCount = useRef( 0 );
	const [ testScenario, setTestScenario ] = useState<Omit<TestScenario, "testCount">>({
		animationCount: 1000,
		timeStyle: "pausable",
	});

	const handleInputChange = ( event: React.ChangeEvent<HTMLInputElement> ) => {
		const { name, value } = event.target;
		setTestScenario(( prev ) => ({
			...prev,
			[ name ]: Number( value ),
		}));
	};

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
	};

	return (
		<div className="form flex flex-col landscape:flex-row items-start gap-5 bg-slate-200 p-spacing-lg mt-spacing-base rounded-lg">
			<fieldset>
				<label htmlFor="animationCount">Animation count</label>
				<input
					type="number"
					min={ 100 }
					name="animationCount"
					id="animationCount"
					value={ testScenario.animationCount }
					onChange={ handleInputChange }
				/>
			</fieldset>
			<fieldset>
				<label htmlFor="timeStyle">Time style</label>
				<select onChange={ handleSelectChange } name="timeStyle" id="timeStyle">
					<option value="pausable">Pausable</option>
					<option value="continious">Continious</option>
				</select>
			</fieldset>
			<button onClick={ startTest } className="block text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full transition-colors landscape:ml-auto">Create Animations</button>
		</div>
	)
}