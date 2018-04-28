import * as fibers from 'fibers';

export type NodeCallback<T> = (err: any, success: T | null) => void;

function isFunction(fn: Function) {
  if (typeof fn !== 'function') throw new Error('Not a function');
}

export class Fiberit {
  static launchFiber(fn: Function, ...restParams: any[]): any {
    isFunction(fn);
    return fibers(function () { fn.apply(null, restParams)}).run();
  }

  static for<T>(asyncFunction: Function, ...restParams: any[]): T {
    isFunction(asyncFunction);
    return Fiberit.applyAndWait<null, T>(asyncFunction, restParams);
  }

  static forMethod<T, V>(obj: T, methodName: keyof T, ...restParams: any[]): V {
    const method = (obj as any)[methodName].bind(obj); // TODO this breaks signature from method, if method return string and V is set as number, will compile.

    return Fiberit.applyAndWait<T, V>(method, restParams);
  }

  static forPromise<T, V>(obj: T, methodName: keyof T, ...restParams: any[]): V {
    const promise: Promise<V> = (obj as any)[methodName].apply(obj, restParams); // TODO this breaks signature from method, if method return string and V is set as number, will compile.

    return Fiberit.applyAndWaitPromise<V>(promise);
  }

  private static applyAndWait<T, V>(fn: Function, args: any): V {
    const fiber: any = fibers.current;
    if (!fiber) throw new Error('Async method can only be called inside a Fiber.');

    const fnName = fn.name;

    const resumeCallback: NodeCallback<V> = function (err: any, data: V) {
      if (fiber.callbackAlreadyCalled) {
        throw new Error("Callback for function " + fnName + " called twice. Fiberit already resumed the execution.");
      }
      fiber.callbackAlreadyCalled = true;
      fiber.err = err;
      fiber.data = data;
      if (!fiber.yielded) {
        return;
      }
      else {
        fiber.run();
      }
    };

    args.push(resumeCallback);

    fiber.callbackAlreadyCalled = false;
    fiber.yielded = false;
    fn.apply(null, args);
    if (!fiber.callbackAlreadyCalled) {
      fiber.yielded = true;
      fibers.yield();
    }

    if (fiber.err) throw fiber.err;
    return fiber.data;
  }

  private static applyAndWaitPromise<V>(promise: Promise<V>): V {
    const promiseCallback = (cb: NodeCallback<V>) => {
      promise
        .then(data => {
          cb(null, data);
        })
        .catch(error => {
          cb(error, null);
        });
    };

    return this.for(promiseCallback);
  }
}
