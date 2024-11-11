"use client";

import { usePronotronIO } from "../hooks/usePronotronIO";
import { IODispatchOptions } from '@pronotron/io';

interface PronotronIODispatcherProps extends React.ComponentProps<"span"> {
	dispatch: IODispatchOptions;
	offset?: number;
};

export function IODispatcher({ dispatch, offset, ...spanProps }: PronotronIODispatcherProps )
{
	const { ref } = usePronotronIO({ dispatch, offset });
	
	return (
		<span aria-hidden ref={ ref } { ...spanProps } />
	)
};