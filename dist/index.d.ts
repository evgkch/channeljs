/**
 * A lib to create a channel to send and receive messages
 */
export declare type Message = string | number | symbol;
/**
 * Match signal with its args
 */
export declare type MessageMap = {
    [msg in Message]: any[];
};
export declare type Channel<M extends MessageMap> = Map<keyof M, Set<(...args: M[keyof M]) => any>>;
export declare function channel<M extends MessageMap>(): {
    ch: Channel<M>;
    tx: Tx<M>;
    rx: Rx<M>;
};
/**
 * Message Transmitter
 */
export declare class Tx<M extends MessageMap> {
    #private;
    constructor(channel: Channel<M>);
    /**
     * Emit a signal that provides to the signal's subscribers.
     *
     * Ex.: tx.send('msg', [...args])
     * Returns true if the signal had listeners, false otherwise
     */
    send<S extends keyof M>(msg: S, ...args: M[S]): boolean;
    /**
     * Emit an async signal that provides to the signal's subscribers.
     *
     * Ex.: tx.send_async('msg', [...args])
     * Returns Promise<true> if the event had listeners, Promise<false> otherwise
     */
    send_async<S extends keyof M>(signal: S, ...args: M[S]): Promise<boolean>;
}
/**
 * Message Receiver
 */
export declare class Rx<M extends MessageMap> {
    #private;
    constructor(channel: Channel<M>);
    /**
     * Subscribe on a message.
     * Returns the provided listener.
     *
     * Ex.: rx.on('msg', listener)
     */
    on<S extends keyof M>(msg: S, listener: (...args: M[S]) => any): (...args: M[S]) => any;
    /**
     * Subscribe on a message once (subscriber will be deleted after send).
     * Returns the provided listener.
     *
     * Ex.: rx.once('msg', listener)
     */
    once<S extends keyof M>(msg: S, listener: (...args: M[S]) => any): (...args: M[S]) => any;
    /**
     * Subscribe on a signal weak (subscriber will be deleted if it will be dead).
     * Returns a WeakRef of the provided listener.
     *
     * Ex.: rx.onweak('msg', listener)
     */
    onweak<S extends keyof M>(msg: S, listener: (...args: M[S]) => any): WeakRef<(...args: M[S]) => any>;
    /**
     * Ubsubscribe listener from the message.
     * Returns true if message and listener existed, false otherwise.
     *
     * Ex.: rx.off('msg', listener)
     */
    off<S extends keyof M>(msg: S, listener: (...args: M[S]) => any): boolean;
}