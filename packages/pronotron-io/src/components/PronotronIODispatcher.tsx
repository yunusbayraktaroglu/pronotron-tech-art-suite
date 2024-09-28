"use client";

import { usePronotronIO } from "../hooks/usePronotronIO";
import { IODispatchOptions, IODispatchOptionsWithRetry } from '../../types/global';

interface PronotronIODispatcherProps extends React.ComponentProps<"span"> {
	dispatch: IODispatchOptions | IODispatchOptionsWithRetry;
};

export function PronotronIODispatcher({ dispatch, ...spanProps }: PronotronIODispatcherProps )
{
	const { ref } = usePronotronIO({ dispatch });
	
	return (
		<span aria-hidden ref={ ref } { ...spanProps } />
	)
};