type Movement = "top-in" | "top-out" | "bottom-in" | "bottom-out";

interface IOHolderProps extends React.ComponentProps<"span"> {
	pronotron: Partial<Record<Movement, {
		retry?: number;
		payload: () => void;
	}>>;
};

/**
 * Creates a HTML component that collected by IOManager
 */
export function IOHolder({ pronotron, ...spanProps }: IOHolderProps)
{
	return (
		<span
			aria-hidden 
			data-pronotron-io
			ref={( el ) => {
				if ( el ){
					//@ts-expect-error
					el.pronotron = pronotron;
				}
			}}
			{ ...spanProps }
		/>
	)
}