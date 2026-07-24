import { describe, it, expect } from '@jest/globals';
import Channel, { type MessageMap } from '../src/index.js';

function rig<M extends MessageMap>() {
    const ch = new Channel<M>();
    const log: unknown[] = [];
    return { ch, log };
}

describe('send', () => {
    it('returns false when there are no listeners', () => {
        const { ch } = rig<{ m: [n: number] }>();
        expect(ch.tx.send('m', 1)).toBe(false);
    });

    it('delivers args to a listener and returns true', () => {
        const { ch, log } = rig<{ click: [x: number, y: number] }>();
        ch.rx.on('click', (x, y) => log.push(`${x},${y}`));
        expect(ch.tx.send('click', 10, 20)).toBe(true);
        expect(log).toEqual(['10,20']);
    });

    it('calls multiple listeners in subscription order', () => {
        const { ch, log } = rig<{ m: [] }>();
        ch.rx.on('m', () => log.push('a'));
        ch.rx.on('m', () => log.push('b'));
        ch.rx.on('m', () => log.push('c'));
        ch.tx.send('m');
        expect(log).toEqual(['a', 'b', 'c']);
    });

    it('isolates listeners by message', () => {
        const { ch, log } = rig<{ a: []; b: [] }>();
        ch.rx.on('a', () => log.push('a'));
        ch.rx.on('b', () => log.push('b'));
        ch.tx.send('a');
        expect(log).toEqual(['a']);
    });

    it('supports symbol and number messages', () => {
        const { ch, log } = rig<Record<PropertyKey, [v: number]>>();
        const s = Symbol('s');
        ch.rx.on(s, v => log.push(`sym:${v}`));
        ch.rx.on(42, v => log.push(`num:${v}`));
        ch.tx.send(s, 1);
        ch.tx.send(42, 2);
        expect(log).toEqual(['sym:1', 'num:2']);
    });
});

describe('on / off', () => {
    it('returns an unsubscribe handle from on', () => {
        const { ch, log } = rig<{ m: [v: string] }>();
        const off = ch.rx.on('m', v => log.push(v));
        ch.tx.send('m', 'a');
        expect(off()).toBe(true);          // removed
        expect(off()).toBe(false);         // already gone
        ch.tx.send('m', 'b');              // no listener
        expect(log).toEqual(['a']);
    });

    it('unsubscribes by reference via off', () => {
        const { ch, log } = rig<{ m: [v: string] }>();
        const h = (v: string) => log.push(v);
        ch.rx.on('m', h);
        expect(ch.rx.off('m', h)).toBe(true);
        expect(ch.rx.off('m', h)).toBe(false);
        ch.tx.send('m', 'x');
        expect(log).toEqual([]);
    });

    it('does not add the same listener twice', () => {
        const { ch, log } = rig<{ m: [] }>();
        const h = () => log.push('x');
        ch.rx.on('m', h);
        ch.rx.on('m', h);
        ch.tx.send('m');
        expect(log).toEqual(['x']);
    });
});

describe('has', () => {
    it('is false when a message has no subscribers', () => {
        const { ch } = rig<{ m: [] }>();
        expect(ch.tx.has('m')).toBe(false);
    });

    it('is true while a listener is subscribed, false after it unsubscribes', () => {
        const { ch } = rig<{ m: [] }>();
        const off = ch.rx.on('m', () => {});
        expect(ch.tx.has('m')).toBe(true);
        off();
        expect(ch.tx.has('m')).toBe(false);   // emptied Set still reads as absent
    });

    it('goes false after a once listener has fired', () => {
        const { ch } = rig<{ m: [] }>();
        ch.rx.once('m', () => {});
        expect(ch.tx.has('m')).toBe(true);
        ch.tx.send('m');
        expect(ch.tx.has('m')).toBe(false);
    });

    it('isolates presence by message', () => {
        const { ch } = rig<{ a: []; b: [] }>();
        ch.rx.on('a', () => {});
        expect(ch.tx.has('a')).toBe(true);
        expect(ch.tx.has('b')).toBe(false);
    });

    it('is false after clear', () => {
        const { ch } = rig<{ m: [] }>();
        ch.rx.on('m', () => {});
        ch.clear();
        expect(ch.tx.has('m')).toBe(false);
    });
});

describe('once', () => {
    it('fires exactly once', () => {
        const { ch, log } = rig<{ m: [v: number] }>();
        ch.rx.once('m', v => log.push(v));
        expect(ch.tx.send('m', 1)).toBe(true);
        expect(ch.tx.send('m', 2)).toBe(false);   // already auto-unsubscribed
        expect(log).toEqual([1]);
    });

    it('can be cancelled before it fires', () => {
        const { ch, log } = rig<{ m: [v: number] }>();
        const off = ch.rx.once('m', v => log.push(v));
        expect(off()).toBe(true);
        ch.tx.send('m', 1);
        expect(log).toEqual([]);
    });
});

describe('clear', () => {
    it('removes every subscriber', () => {
        const { ch, log } = rig<{ a: []; b: [] }>();
        ch.rx.on('a', () => log.push('a'));
        ch.rx.on('b', () => log.push('b'));
        ch.clear();
        expect(ch.tx.send('a')).toBe(false);
        expect(ch.tx.send('b')).toBe(false);
        expect(log).toEqual([]);
    });
});

describe('dispatch snapshot semantics', () => {
    it('does not fire a listener subscribed during the same send', () => {
        const { ch, log } = rig<{ m: [] }>();
        // two listeners so send takes the snapshot path
        ch.rx.on('m', () => log.push('first'));
        ch.rx.on('m', () => {
            log.push('outer');
            ch.rx.on('m', () => log.push('inner'));
        });
        ch.tx.send('m');
        expect(log).toEqual(['first', 'outer']);          // inner added but not fired now
        ch.tx.send('m');
        expect(log).toEqual(['first', 'outer', 'first', 'outer', 'inner']);
    });

    it('delivers to listeners present when the send started', () => {
        const { ch, log } = rig<{ m: [] }>();
        let offB = () => false;
        ch.rx.on('m', () => { log.push('a'); offB(); });   // unsubscribes B mid-send
        offB = ch.rx.on('m', () => log.push('b'));
        ch.tx.send('m');
        // B was subscribed when the send started, so it still fires this time;
        // the unsubscribe only takes effect from the next send.
        expect(log).toEqual(['a', 'b']);
        ch.tx.send('m');
        expect(log).toEqual(['a', 'b', 'a']);             // B gone now
    });
});
