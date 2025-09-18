export function SiteSVG() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 0 0" width="0" height="0" focusable="false" role="none" style={{ visibility: "hidden", position: "absolute", left: "-9999px", overflow: "hidden" }}>
			<defs>
				<symbol id="github_icon">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
				</symbol>
				<symbol id="close_icon">
					<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
				</symbol>
				<symbol id="seperator_icon">
					<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
					<path d="M5 12l14 0"></path>
					<path d="M13 18l6 -6"></path>
					<path d="M13 6l6 6"></path>
				</symbol>
				<symbol id="home_icon">
					<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
					<path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2"></path>
					<path d="M19 12h2l-9 -9l-9 9h2v7a2 2 0 0 0 2 2h5.5"></path>
					<path d="M16 19h6"></path>
					<path d="M19 16l3 3l-3 3"></path>
				</symbol>
				<symbol id="comment_icon">
					<path d="M7 8H17M7 11H17M7 14H11M3 18V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V16C21 17.1046 20.1046 18 19 18H7.66667C7.23393 18 6.81286 18.1404 6.46667 18.4L3 21V18Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
				</symbol>
				<symbol id="expand_icon">
					<g>
						<polyline points="3 17.3 3 21 6.7 21"></polyline>
						<line x1="10" x2="3.8" y1="14" y2="20.2"></line>
						<line x1="14" x2="20.2" y1="10" y2="3.8"></line>
						<polyline points="21 6.7 21 3 17.3 3"></polyline>
					</g>
				</symbol>
			</defs>
		</svg>
	)
}


export function GithubIcon( props: React.ComponentProps<"svg"> )
{
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" { ...props }>
			<use href="#github_icon" /> 
		</svg>
	)
}
export function CommentIcon( props: React.ComponentProps<"svg"> )
{
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" { ...props }>
			<use href="#comment_icon" /> 
		</svg>
	)
}

export function SeperatorIcon( props: React.ComponentProps<"svg"> )
{
	return (
		<svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" { ...props }>
			<use href="#seperator_icon" /> 
		</svg>
	)
}

export function HomeIcon( props: React.ComponentProps<"svg"> )
{
	return (
		<svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" { ...props }>
			<use href="#home_icon" /> 
		</svg>
	)
}

export function CloseIcon( props: React.ComponentProps<"svg"> )
{
	return (
		<svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" { ...props }>
			<use href="#close_icon" /> 
		</svg>
	)
}

export function ExpandIcon( props: React.ComponentProps<"svg"> )
{
	return (
		<svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" { ...props }>
			<use href="#expand_icon" /> 
		</svg>
	)
}