"use client";

import { useState } from "react";
import { ExpandIcon, CloseIcon } from "./SiteSVG";

interface HideableRowProps {
	title: string;
	expand?: boolean;
	children: React.ReactNode;
};

export function Expandable({ expand = true, title, children }: HideableRowProps)
{
	const [ expandState, setExpandState ] = useState<boolean>( expand );
	const ariaExpanded = expandState ? 'true' : 'false';
	const opacity = ! expandState ? " opacity-50" : "";

	return (
		<div className={ "container flex flex-col py-spacing-sm landscape:py-spacing-sm" + opacity }>
			<div className="flex flex-row justify-between">
				<button
					type='button'
					aria-haspopup='true'
					aria-label='Open Menu'
					aria-expanded={ ariaExpanded }
					onClick={() => setExpandState(( prev ) => ! prev )}
				>
					<h3 className="text-sm leading-none">{ title }</h3>
				</button>
				<button
					type='button'
					aria-haspopup='true'
					aria-label='Open Menu'
					aria-expanded={ ariaExpanded }
					className='group'
					onClick={() => setExpandState(( prev ) => ! prev )}
				>
					<span className='sr-only'>Open main menu</span>
					<ExpandIcon className='h-5 w-5 hidden group-aria-[expanded=false]:block' fill='none' viewBox='0 0 24 24' strokeWidth='1.5' stroke='currentColor' aria-hidden='true' />
					<CloseIcon className='h-5 w-5 hidden group-aria-[expanded=true]:block' fill='none' viewBox='0 0 24 24' strokeWidth='1.5' stroke='currentColor' aria-hidden='true' />
				</button>
			</div>
			{ expandState && children }
		</div>
	);
}