/**
 * channeljs — a tiny, typed pub/sub channel.
 *
 * A `Channel<M>` is described by a `MessageMap` M: an object binding each message
 * to the argument tuple its listeners receive. The same channel is exposed through
 * two interface-typed views — `tx` to send and `rx` to subscribe.
 */
/** Binds each message to the argument tuple delivered to its listeners. */
export type MessageMap = Record<PropertyKey, any[]>;
/** A listener for one message's argument tuple. */
export type Listener<A extends any[]> = (...args: A) => void;
/** Unsubscribe handle. Returns `true` if a listener was removed, `false` if already gone. */
export type Off = () => boolean;
/** The sending side of a channel. */
export interface Tx<M extends MessageMap> {
    /** Emit a message to its subscribers. Returns `true` if it had listeners. */
    send<K extends keyof M>(msg: K, ...args: M[K]): boolean;
}
/** The receiving side of a channel. */
export interface Rx<M extends MessageMap> {
    /** Subscribe to a message. Returns an unsubscribe handle. */
    on<K extends keyof M>(msg: K, listener: Listener<M[K]>): Off;
    /** Subscribe for a single delivery, then auto-unsubscribe. Returns an unsubscribe handle. */
    once<K extends keyof M>(msg: K, listener: Listener<M[K]>): Off;
    /** Unsubscribe a listener by reference. Returns `true` if it existed. */
    off<K extends keyof M>(msg: K, listener: Listener<M[K]>): boolean;
}
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
export default class Channel<M extends MessageMap> implements Tx<M>, Rx<M> {
    #private;
    /** The sending view of this channel. */
    get tx(): Tx<M>;
    /** The receiving view of this channel. */
    get rx(): Rx<M>;
    on<K extends keyof M>(msg: K, listener: Listener<M[K]>): Off;
    once<K extends keyof M>(msg: K, listener: Listener<M[K]>): Off;
    off<K extends keyof M>(msg: K, listener: Listener<M[K]>): boolean;
    send<K extends keyof M>(msg: K, ...args: M[K]): boolean;
    /** Remove every subscriber. */
    clear(): void;
}
