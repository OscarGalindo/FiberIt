# Fiberit

This is just a copy of the wait.for implementation of [luciotato/Wait.for](https://github.com/luciotato/waitfor) but in Typescript.

> Sequential programming for node.js, end of callback hell.
 > Simple, straightforward abstraction over [Fibers](https://github.com/laverdet/node-fibers).
> 
> By using **wait.for**, you can call any nodejs standard async function in sequential/Sync mode, waiting for result data, 
> without blocking node's event loop (thanks to fibers)
> 
> A nodejs standard async function is a function in which the last parameter is a callback: function(err,data)
> 
> Advantages:
> * Avoid callback hell / pyramid of doom
> * Simpler, sequential programming when required, without blocking node's event loop (thanks to fibers)
> * Simpler, try-catch exception programming. (default callback handler is: if (err) throw err; else return data)
> * You can also launch multiple parallel non-concurrent fibers.
> * No multi-threaded debugging nightmares, only one fiber running at a given time (thanks to fibers)
> * Can use any node-standard async function with callback(err,data) as last parameter.
> * Plays along with node programming style. Write your async functions with callback(err,data), but use them in sequential/SYNC mode when required.
> * Plays along with node cluster. You design for one thread/processor, then scale with cluster on multicores.


## Install

With [npm](https://npmjs.org/) installed, run

    $ npm install --save fiberit

## Usage

```js
import {Fiberit} from 'fiberit';

const someAsyncFunction = (param: number) => setTimeout(() => param * 2, 100);

Fiberit.launchFiber(() => {
  const result = Fiberit.for(someAsyncFunction, 5);
  console.log(result); // 10
})
```

## API

### `Fiberit.launchFiber(fn)`

Calls the function inside a fiber.

#### fn

*Required*<br>
Type: `Function`

Function to run inside the fiber


### `Fiberit.for(asyncFunction, params)`

Calls the function inside a fiber.

#### asyncFunction

*Required*<br>
Type: `Function`

Async function with node-style callback

#### params

Type: `any`

N parameters that will be passed to the asyncFunction

### `Fiberit.forMethod(object, method, params)`

Calls the function inside a fiber.

#### object

*Required*<br>
Type: `Object`

Object that has the method that will be called inside the fiber

#### method

*Required*<br>
Type: `String`

Method of the object with node-style callback

#### params

Type: `any`

N parameters that will be passed to the object.method


### `Fiberit.forPromise(object, method, params)`

Calls the function inside a fiber.

#### object

*Required*<br>
Type: `Object`

Object that has the method that will be called inside the fiber

#### method

*Required*<br>
Type: `String`

Method of the object which return a Promise

#### params

Type: `any`

N parameters that will be passed to the object.method

