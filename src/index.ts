/**
 * A lib to create a channel to send and receive messages
 */

export type Message = any;

/**
 * Match signal with its args
 */
export type MessageMap = [message: Message, args: any[]][]

export type Subscribers<M extends MessageMap> = Map<M[number][0], Set<(...args: M[number][1]) => any>>;

/**
 * Channel
 */
export default class Channel<M extends MessageMap> {

	static #channels: WeakMap<object, Channel<MessageMap>> = new WeakMap;

	static has(target: object) {
		return this.#channels.has(target);
	}

	static get(target: object) {
		return this.#channels.get(target)!.#subscribers;
	}

	static add(target: object) {
		this.#channels.set(target, new Channel);
	}

	#subscribers: Subscribers<M> = new Map;
	readonly tx: Tx<M> = new Tx(this.#subscribers as Subscribers<M>);
	readonly rx: Rx<M> = new Rx(this.#subscribers as Subscribers<M>);

	/**
	 * Clear subscribers
	 */
	clear() {
		this.#subscribers.clear();
	}

}

/**
 * Message Transmitter
 */
export class Tx<M extends MessageMap> {

	#subscribers: Subscribers<M>;

	constructor(subscribers: Subscribers<M>) {
		this.#subscribers = subscribers;
	}

	/**
	 * Emit a signal that provides to the signal's subscribers.
	 *
	 * Ex.: tx.send('msg', [...args])
	 * Returns true if the signal had listeners, false otherwise
	 */
	send<S extends M[number]>(msg: S[0], ...args: S[1]): boolean {
		const listeners = this.#subscribers.get(msg);
		if (listeners && listeners.size > 0)
		{
			for (const cb of listeners) cb(...args);
			return true;
		}
		return false;
	}

	/**
	 * Emit an async signal that provides to the signal's subscribers.
	 *
	 * Ex.: tx.send_async('msg', [...args])
	 * Returns Promise<true> if the event had listeners, Promise<false> otherwise
	 */
	send_async<S extends M[number]>(msg: S[0], ...args: S[1]): Promise<boolean> {
		return new Promise((resolve) =>
			setTimeout(() => resolve(this.send(msg, ...args)), 0)
		);
	}

}

/**
 * Message Receiver
 */
export class Rx<M extends MessageMap> {

	#subscribers: Subscribers<M>;

	constructor(subscribers: Subscribers<M>) {
		this.#subscribers = subscribers;
	}

	/**
	 * Subscribe on a message.
     * Returns the provided listener.
	 *
	 * Ex.: rx.on('msg', listener)
	 */
	on<S extends M[number]>(msg: S[0], listener: (...args: S[1]) => any): (...args: S[1]) => any {
		const listeners = this.#subscribers.get(msg);
		if (listeners)
			listeners.add(listener);
		else
			this.#subscribers.set(msg, new Set([listener]));

		return listener;
  	}

	/**
	 * Subscribe on a message once (subscriber will be deleted after send).
     * Returns the provided listener.
	 *
	 * Ex.: rx.once('msg', listener)
	 */
	once<S extends M[number]>(msg: S[0], listener: (...args: S[1]) => any): (...args: S[1]) => any {
		return this.on(msg, (self => function f(...args: S[1]) {
			self.off(msg, f);
			listener(...args);
		})(this))
  	}

	/**
	 * Subscribe on a signal weak (subscriber will be deleted if it will be dead).
     * Returns a WeakRef of the provided listener.
	 *
	 * Ex.: rx.onweak('msg', listener)
	 */
	onweak<S extends M[number]>(msg: S[0], listener: (...args: S[1]) => any): (...args: S[1]) => any {
		const ref = new WeakRef(listener);
		this.on(msg, (self => function f(...args: S[1]) {
			const listener = ref.deref();
			if (listener)
				listener(...args);
			else
				self.off(msg, f);
		})(this));
        return listener;
  	}

	/**
	 * Ubsubscribe listener from the message.
     * Returns true if message and listener existed, false otherwise.
	 *
	 * Ex.: rx.off('msg', listener)
	 */
	off<S extends M[number]>(msg: S[0], listener: (...args: S[1]) => any): boolean {
		return !!this.#subscribers.get(msg)?.delete(listener);
	}

}
