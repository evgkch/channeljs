/**
 * A lib to create a channel to send and receive messages
 */
export type Message = any;
/**
 * Match signal with its args
 */
export type MessageMap = [message: Message, args: any[]][];
export type Subscribers<M extends MessageMap> = Map<M[number][0], Set<(...args: M[number][1]) => any>>;
/**
 * Channel
 */
export default class Channel<M extends MessageMap> {
    #private;
    static has(target: object): boolean;
    static get(target: object): Subscribers<MessageMap>;
    static add(target: object): void;
    readonly tx: Tx<M>;
    readonly rx: Rx<M>;
    /**
     * Clear subscribers
     */
    clear(): void;
}
/**
 * Message Transmitter
 */
export declare class Tx<M extends MessageMap> {
    #private;
    constructor(subscribers: Subscribers<M>);
    /**
     * Emit a signal that provides to the signal's subscribers.
     *
     * Ex.: tx.send('msg', [...args])
     * Returns true if the signal had listeners, false otherwise
     */
    send<S extends M[number]>(msg: S[0], ...args: S[1]): boolean;
    /**
     * Emit an async signal that provides to the signal's subscribers.
     *
     * Ex.: tx.send_async('msg', [...args])
     * Returns Promise<true> if the event had listeners, Promise<false> otherwise
     */
    send_async<S extends M[number]>(msg: S[0], ...args: S[1]): Promise<boolean>;
}
/**
 * Message Receiver
 */
export declare class Rx<M extends MessageMap> {
    #private;
    constructor(subscribers: Subscribers<M>);
    /**
     * Subscribe on a message.
     * Returns the provided listener.
     *
     * Ex.: rx.on('msg', listener)
     */
    on<S extends M[number]>(msg: S[0], listener: (...args: S[1]) => any): (...args: S[1]) => any;
    /**
     * Subscribe on a message once (subscriber will be deleted after send).
     * Returns the provided listener.
     *
     * Ex.: rx.once('msg', listener)
     */
    once<S extends M[number]>(msg: S[0], listener: (...args: S[1]) => any): (...args: S[1]) => any;
    /**
     * Subscribe on a signal weak (subscriber will be deleted if it will be dead).
     * Returns a WeakRef of the provided listener.
     *
     * Ex.: rx.onweak('msg', listener)
     */
    onweak<S extends M[number]>(msg: S[0], listener: (...args: S[1]) => any): (...args: S[1]) => any;
    /**
     * Ubsubscribe listener from the message.
     * Returns true if message and listener existed, false otherwise.
     *
     * Ex.: rx.off('msg', listener)
     */
    off<S extends M[number]>(msg: S, listener: (...args: S[1]) => any): boolean;
}
