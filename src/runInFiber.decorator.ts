import {Fiberit} from "./fiberit";

const fibers = require('fibers');

export function runInFiber(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  return {
    value: function (...args: any[]): any {
      return fibers.current ?
        descriptor.value.apply(this, args) :
        Fiberit.launchFiber(() => descriptor.value.apply(this, args));
    }
  };
}
