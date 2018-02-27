import * as fibers from 'fibers';

export type NodeCallback = (err: any, success: any) => void;

function isFunction(fn: Function) {
  if (typeof fn !== 'function') throw new Error('Not a function');
}

export class Waiter {
  static launchFiber(fn: Function, ...restParams: any[]): void {
    isFunction(fn);
    fibers(function () { fn.apply(null, restParams)}).run();
  }

  static for(asyncFunction: Function, ...restParams: any[]): void {
    isFunction(asyncFunction);
    return Waiter.applyAndWait(null, asyncFunction, restParams);
  }

  static forMethod<T>(obj: T, methodName: string, ...restParams: any[]): void {
    const method = (obj as any)[methodName];

    return Waiter.applyAndWait(obj, method, restParams);
  }

  private static applyAndWait(thisValue: any, fn: Function, args: any): void {
    const fiber: any = fibers.current;
    if (!fiber) throw new Error('Waiter.for method can only be called inside a Fiber.');

    const fnName = fn.name;

    const resumeCallback: NodeCallback = function (err: any, data: any) {
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
