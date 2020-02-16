/**
 * Allows one to flip between a "front" and "back" object
 */
export class Flipper<T> {
	private sides: Array<T>

	/**
	 *
	 * @param front The object to start with (i.e. the first one to be returned from flip())
	 * @param back  The object ot end with (i.e. the second to be returned from flip())
	 */
	constructor(front: T, back: T) {
		this.sides = [front, back];
	}

	/**
	 * Flip front and back, then return what was currently the "front"
	 */
	flip(): T {
		const current = this.peekFront();
		this.sides.reverse();

		return current;
	}

	/**
	 * Peek the front without flipping.
	 */
	peekFront(): T {
		return this.sides[0];
	}

	/**
	 * Peek the back without flipping.
	 */
	peekBack(): T {
		return this.sides[1];
	}
}
