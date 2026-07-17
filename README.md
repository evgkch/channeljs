# channeljs
A lib to create a channel to send and receive messages

## Usage
```typescript
// Import lib
import Channel from 'channeljs';

// Define a MessageMap: an object whose keys are messages (string | number | symbol)
// and whose values are the argument tuples delivered to that message's listeners.
type Events = {
    ':click': [x: number, y: number];
};

// Create a channel
const channel = new Channel<Events>();

{
    // Subscribe. `on` returns an unsubscribe handle — no need to keep the listener around.
    const off = channel.rx.on(':click', (x: number, y: number) => { /** Your Code */ });

    // Subscribe once — auto-unsubscribes after the first send.
    // Also returns an unsubscribe handle, in case you want to cancel before it fires.
    channel.rx.once(':click', (x: number, y: number) => { /** Your Code */ });

    // Sending a ':click' with x: 10, y: 20 — all listeners above run.
    // The `once` listener is terminated afterwards.
    channel.tx.send(':click', 10, 20);

    // Unsubscribe via the handle returned by `on`.
    off();
    // Or, if you kept the listener reference, unsubscribe by reference:
    //   channel.rx.off(':click', handle);
}
// ...
// To make sure there are no leaks, call `clear` on the channel —
// it removes every subscriber.
channel.clear();
```
