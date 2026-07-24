# channeljs

A tiny, typed pub/sub channel: one `Channel<M>` is defined by a MessageMap and opened from two sides — `tx` to send, `rx` to subscribe.

| | |
|---|---|
| Version | 1.1.0 |
| Format | ESM only (`"type": "module"`) |
| Dependencies | none |
| License | MIT |

## Install

```bash
npm install @evgkch/channeljs
```

## Quick start

```typescript
import Channel from '@evgkch/channeljs';

// A MessageMap: keys are events, values are the listener argument tuples.
type Events = {
    ':click': [x: number, y: number];
    ':close': [];
};

const channel = new Channel<Events>();

// `on` returns an unsubscribe handle — no need to keep the listener around.
const off = channel.rx.on(':click', (x: number, y: number) => {
    console.log(`click at ${x}, ${y}`);
});

// Send — the listener above receives (10, 20).
channel.tx.send(':click', 10, 20);

off();             // unsubscribe
channel.clear();   // or drop every subscriber at once
```

## Concepts

| Term | What it is |
|---|---|
| **MessageMap** | An object: a key is a message (`string \| number \| symbol`), its value is the argument tuple its listeners receive. E.g. `{ ':click': [x: number, y: number] }`. |
| **Channel`<M>`** | The pub/sub channel itself, parameterized by a MessageMap `M`. Holds subscribers per message. |
| **`tx`** | The sending side (`Tx<M>`): `send`, `has`. |
| **`rx`** | The receiving side (`Rx<M>`): `on`, `once`, `off`. |
| **Off** | An unsubscribe handle `() => boolean`; returns `true` if a listener was removed. |

## API

### `channel.tx` — sending

| Method | Signature | Returns |
|---|---|---|
| `send` | `send(msg, ...args)` | `true` if the message had listeners |
| `has` | `has(msg)` | `true` if the message currently has any subscribers |

`has` is a cheap pre-send check — use it to avoid building an expensive payload no one is listening for.

### `channel.rx` — subscribing

| Method | Signature | Returns |
|---|---|---|
| `on` | `on(msg, listener)` | an `Off` handle |
| `once` | `once(msg, listener)` | an `Off` handle (auto-unsubscribes after the first delivery) |
| `off` | `off(msg, listener)` | `true` if the listener existed |

### `channel` — lifecycle

| Member | Description |
|---|---|
| `tx` / `rx` | the two sides of the channel |
| `clear()` | remove every subscriber (guards against leaks) |

## Delivery semantics

- **The recipient set is fixed for the duration of a send.** If a handler subscribes or unsubscribes a listener during delivery, the current `send` won't see it — the change takes effect from the next `send`.
- **No duplicate listeners.** Subscribing the same listener reference twice registers it once.
