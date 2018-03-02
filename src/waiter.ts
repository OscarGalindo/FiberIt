import * as fibers from 'fibers';

export type NodeCallback<T> = (err: any, success: T) => void;

function isFunction(fn: Function) {
  if (typeof fn !== 'function') throw new Error('Not a function');
}

export class Waiter {
  static launchFiber(fn: Function, ...restParams: any[]): void {
    isFunction(fn);
    fibers(function () { fn.apply(null, restParams)}).run();
  }

  static for<T>(asyncFunction: Function, ...restParams: any[]): T {
    isFunction(asyncFunction);
    return Waiter.applyAndWait<null, T>(null, asyncFunction, restParams);
  }

  static forMethod<T, V>(obj: T, methodName: keyof T, ...restParams: any[]): V {
    const method = (obj as any)[methodName]; // TODO this breaks signature from method, if method return string and V is set as number, will compile.

    return Waiter.applyAndWait<T, V>(obj, method, restParams);
  }

  private static applyAndWait<T, V>(thisValue: T, fn: Function, args: any): V {
    const fiber: any = fibers.current;
    if (!fiber) throw new Error('Waiter.for method can only be called inside a Fiber.');

    const fnName = fn.name;

    const resumeCallback: NodeCallback<V> = function (err: any, data: V) {
      if (fiber.callbackAlreadyCalled) {
        throw new Error("Callback for function " + fnName + " called twice. Wait.for already resumed the execution.");
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
    fn.apply(thisValue, args);
    if (!fiber.callbackAlreadyCalled) {
      fiber.yielded = true;
      fibers.yield();
    }

    if (fiber.err) throw fiber.err;
    return fiber.data;
  }
}
