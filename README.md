# channeljs
A lib to create a channel to send and receive messages

## Usage
```typescript
// Import lib
import Channel from '/channeljs';

// Define a Message Map that will be implemented to a Channel:
// keys of the Map are messages (may be string, number or symbol);
// value is an array of arguments that will be provided to the listeners.
type MessageMap = {
    ':click': [x: number, y: number]
};

// Create a channel
const channel = new Channel<MessageMap>();

{
    // Create a handle listener
    const handle = (x: number, y: number) => { /** Your Code */ };
    // Subscribe on message by handle
    channel.rx.on(':click', handle);

    // Subscribe on message by handle.
    // Your subsctibtion will be terminated after the message will be sent.
    // Do not need a reason to store your listeners
    channel.rx.once(':click', (x: number, y: number) => { /** Your Code */ });

    // Subscribe on message using lambda function and store it in some var
    // Don not forget to store your lambda if you need to unsubscribe it
    const lambda = channel.rx.on(':click', (x: number, y: number) => { /** Your Code */ });

    // Subscribe on message thought the weak ref.
    // Your subsctibtion will be alive while the ref is alive
    const ref = channel.rx.onweak(':click', (x: number, y: number) => { /** Your Code */ });

    // Sending a ':click' message with x: 10, y: 20
    // After sending all listeners above will be work.
    // The second listener (that used 'once') will be terminated
    channel.tx.send(':click', 10, 20);

    // Deleting the first listener
    channel.rx.off(':click', handle);
}
// ...
// After a while (but not immediately) your 'ref' will be expired.
// Sending a new message execute only the third listener 'lambda',
// because the 'ref' listener terminated.
channel.tx.send(':click', 20, 30);

// But you you lost your 'lambda' listener cause we out of the scope.
// To make sure that we have no leaks call 'clear' at channel.
// It guarantees that all subscribers will be removed
channel.clear();
```
