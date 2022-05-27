/**
 * A lib to create a channel to send and receive messages
 */
export default class Channel {
    #subscribers = new Map;
    tx = new Tx(this.#subscribers);
    rx = new Rx(this.#subscribers);
    /**
     * Getting all signals
     */
    get messages() {
        return Array.from(this.#subscribers.keys());
    }
    /**
     * Clear all subsribers
     */
    clear() {
        this.#subscribers.clear();
    }
}
/**
 * Message Transmitter
 */
export class Tx {
    #subscribers;
    constructor(subscribers) {
        this.#subscribers = subscribers;
    }
    /**
     * Emit a signal that provides to the signal's subscribers.
     *
     * Ex.: tx.send('msg', [...args])
     * Returns true if the signal had listeners, false otherwise
     */
    send(msg, ...args) {
        const listeners = this.#subscribers.get(msg);
        if (listeners && listeners.size > 0) {
            for (const cb of listeners)
                cb(...args);
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
    send_async(signal, ...args) {
        return new Promise(resolve => setTimeout(() => resolve(this.send(signal, ...args)), 0));
    }
}
/**
 * Message Receiver
 */
export class Rx {
    #subscribers;
    constructor(subscribers) {
        this.#subscribers = subscribers;
    }
    /**
     * Subscribe on a message.
     * Returns the provided listener.
     *
     * Ex.: rx.on('msg', listener)
     */
    on(msg, listener) {
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
    once(msg, listener) {
        return this.on(msg, (self => function f(...args) {
            self.off(msg, f);
            listener(...args);
        })(this));
    }
    /**
     * Subscribe on a signal weak (subscriber will be deleted if it will be dead).
     * Returns a WeakRef of the provided listener.
     *
     * Ex.: rx.onweak('msg', listener)
     */
    onweak(msg, listener) {
        const ref = new WeakRef(listener);
        this.on(msg, (self => function f(...args) {
            const listener = ref.deref();
            if (listener)
                listener(...args);
            else
                self.off(msg, f);
        })(this));
        return ref;
    }
    /**
     * Ubsubscribe listener from the message.
     * Returns true if message and listener existed, false otherwise.
     *
     * Ex.: rx.off('msg', listener)
     */
    off(msg, listener) {
        return !!this.#subscribers.get(msg)?.delete(listener);
    }
    /**
     * Ubsubscribe all listeners from the message.
     * Returns true if message existed, false otherwise.
     *
     * Ex.: rx.off_all('msg')
     */
    off_all(msg) {
        return this.#subscribers.delete(msg);
    }
}
