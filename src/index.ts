/**
 * A lib to create a channel to send and receive messages
 */

export type Message = string | number | symbol;

/**
 * Match signal with its args
 */
export type MessageMap = { [msg in Message]: any[] };

export type Subscribers<M extends MessageMap> = Map<keyof M, Set<(...args: M[keyof M]) => any>>;

/**
 * Channel
 */
export default class Channel<M extends MessageMap> {

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
	send<S extends keyof M>(msg: S, ...args: M[S]): boolean {
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
	send_async<S extends keyof M>(msg: S, ...args: M[S]): Promise<boolean> {
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
	on<S extends keyof M>(msg: S, listener: (...args: M[S]) => any): (...args: M[S]) => any {
		const listeners = this.#subscribers.get(msg);
		if (listeners)
			listeners.add(listener as (...args: M[keyof M]) => any);
		else
			this.#subscribers.set(msg, new Set([listener as (...args: M[keyof M]) => any]));

		return listener;
  	}

	/**
	 * Subscribe on a message once (subscriber will be deleted after send).
     * Returns the provided listener.
	 *
	 * Ex.: rx.once('msg', listener)
	 */
	once<S extends keyof M>(msg: S, listener: (...args: M[S]) => any): (...args: M[S]) => any {
		return this.on(msg, (self => function f(...args: M[S]) {
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
	onweak<S extends keyof M>(msg: S, listener: (...args: M[S]) => any): (...args: M[S]) => any {
		const ref = new WeakRef(listener);
		this.on(msg, (self => function f(...args: M[S]) {
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
	off<S extends keyof M>(msg: S, listener: (...args: M[S]) => any): boolean {
		return !!this.#subscribers.get(msg)?.delete(listener as (...args: M[keyof M]) => any);
	}

}
