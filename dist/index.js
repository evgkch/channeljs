/**
 * channeljs — a tiny, typed pub/sub channel.
 *
 * A `Channel<M>` is described by a `MessageMap` M: an object binding each message
 * to the argument tuple its listeners receive. The same channel is exposed through
 * two interface-typed views — `tx` to send and `rx` to subscribe.
 */
/**
 * A typed pub/sub channel.
 *
 * ```ts
 * const ch = new Channel<{ ':click': [x: number, y: number] }>();
 * const off = ch.rx.on(':click', (x, y) => {});
 * ch.tx.send(':click', 10, 20);
 * off();
 * ```
 */
export default class Channel {
    #subscribers = new Map();
    /** The sending view of this channel. */
    get tx() {
        return this;
    }
    /** The receiving view of this channel. */
    get rx() {
        return this;
    }
    on(msg, listener) {
        const listeners = this.#subscribers.get(msg);
        if (listeners)
            listeners.add(listener);
        else
            this.#subscribers.set(msg, new Set([listener]));
        return () => this.off(msg, listener);
    }
    once(msg, listener) {
        const off = this.on(msg, (...args) => {
            off();
            listener(...args);
        });
        return off;
    }
    off(msg, listener) {
        return this.#subscribers.get(msg)?.delete(listener) ?? false;
    }
    send(msg, ...args) {
        const listeners = this.#subscribers.get(msg);
        if (!listeners || listeners.size === 0)
            return false;
        // Snapshot: a listener may (un)subscribe during dispatch — iterate a copy
        // so this send sees a stable set.
        for (const listener of [...listeners])
            listener(...args);
        return true;
    }
    /** Remove every subscriber. */
    clear() {
        this.#subscribers.clear();
    }
}
