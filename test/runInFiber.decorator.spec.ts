import {expect} from 'chai';
import {runInFiber} from "../src/runInFiber.decorator";
import {Fiberit, NodeCallback} from "../src/fiberit";

class DecoratorTestClass {
  withoutDecorator(param: number, cb: NodeCallback<any>) {
    this.someAsyncMethod(param, cb);
  }

  @runInFiber
  withDecorator(param: number, cb: NodeCallback<any>) {
    const someValue = Fiberit.for<number>(this.someAsyncMethod, param);
    const otherValue = Fiberit.for<number>(this.someAsyncMethod, param * 2);

    cb(null, someValue + otherValue);
  }

  private someAsyncMethod(param: number, cb: NodeCallback<any>) {
    setTimeout(() => cb(null, param + param), 1000);
  }
}

describe("given runInFiber decorator", function () {
  this.timeout(5000);

  const sut = new DecoratorTestClass();
  describe("when call a method out of a fiber", () => {
    it("then should throw", (done) => {
      const notInsideFiber = () => Fiberit.for(sut.withoutDecorator, 5);
      expect(notInsideFiber).to.throw('Async method can only be called inside a Fiber.');
      done();
    });
  });

  describe("when called a method out of a fiber", () => {
    it("then should create a new fiber", (done) => {
      sut.withDecorator(5, (err, sucess) => {
        expect(sucess).to.equal(30);
        done();
      });
    });
  });

  describe("when called a method inside a fiber", () => {
    it("then should use the current fiber", (done) => {
      Fiberit.launchFiber(() => {
        sut.withDecorator(5, (err, sucess) => {
          expect(sucess).to.equal(30);
          done();
        });
      })
    });
  });
});
