# Mongo Logger

All `console.<error/info/log/warn>` is stored in MongoDB. You also get a
convenience client side logger which shows the stored logs in the client's
console.

## Install

```sh
meteor add hansoft:logger-mongo
```

## Usage

Enable the logger server-side to start storing logs into MongoDB. Enable on
client-side to start showing logs in the client's console.

```js
// Enable with default options
Logger.enable();

Logger.disable();
```

## Options

Documentation coming soon.
