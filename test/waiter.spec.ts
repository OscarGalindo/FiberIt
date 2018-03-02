import {expect} from 'chai';
import {NodeCallback, Waiter} from "../src/waiter";
import * as fibers from "fibers";

describe("given waiter", () => {
  describe("when launch fiber", () => {
    it("then should create a fiber", (done) => {
      Waiter.launchFiber(() => {
        expect(fibers.current).to.not.null;
        done();
      });
    });
  });

  describe("when wait for an async function", () => {
    it("then should yield execution", (done) => {
      Waiter.launchFiber(() => {
        const theNumber: number = Waiter.for<number>(asynFunction, 5);
        expect(theNumber).to.equal(10);
        done();
      });
    });
  });

  describe("when wait for method property", () => {
    it("then should yield execution", (done) => {
      Waiter.launchFiber(() => {
        const sut = new TestAsyncMethodClass();
        const theNumber = Waiter.forMethod<TestAsyncMethodClass, number>(sut, 'someAsyncMethod', 5);
        expect(theNumber).to.equal(10);
        done();
      });
    });
  });
});


function asynFunction(someNumber: number, cb: Function) {
  setTimeout(() => cb(null, someNumber * 2), 500);
}

class TestAsyncMethodClass {
  someAsyncMethod(someNumber: number, cb: NodeCallback<number>) {
    setTimeout(() => cb(null, someNumber * 2), 500);
  }
}
