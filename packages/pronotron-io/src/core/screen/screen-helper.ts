
export class ViewportHelper
{
	/**
	 * Total scroll user can do
	 */
	_totalPossibleScroll!: number;
	/**
	 * Height of the visible portion (viewport)
	 */
	_screenHeight!: number;
	/**
	 * Total height of the page content
	 */
	_totalPageHeight!: number;

	public calculate(): void
	{
		this._screenHeight = window.innerHeight;
		this._totalPageHeight = document.documentElement.scrollHeight;
		this._totalPossibleScroll = this._totalPageHeight - this._screenHeight;
	}
}