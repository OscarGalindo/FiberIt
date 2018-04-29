import {expect} from 'chai';
import {Parallel} from "../src/Parallel";
import {Fiberit} from "../src/fiberit";

describe("parallel map", () => {
  describe("called", () => {
    describe("scatter-gathers", () => {
      const asyncFunction = (input: string, cb: Function) => setTimeout(() => cb(null, "hey"), 2);
      const parallelFunction = (element: number) => Fiberit.for(asyncFunction, "a");

      it("when passed array with values", (done) => {
        const params = [1, 2, 3];
        Fiberit.launchFiber(
          () => {
            const retVal = Parallel.map(params, parallelFunction);
            expect(retVal).to.eql(['hey', 'hey', 'hey']);
            done();
          }
        );
      });
      it("do nothing when passed empty array", (done) => {
        const params = [];
        Fiberit.launchFiber(
          () => {
            const retVal = Parallel.map(params, parallelFunction);
            expect(retVal).to.eql([]);
            done();
          }
        );
      });
      it("should work curryed", (done) => {
        const source = [1, 2, 3];
        const parallel = Parallel.withSource(source);

        Fiberit.launchFiber(
          () => {
            expect(parallel(parallelFunction)).to.eql(['hey', 'hey', 'hey']);
            done();
          });
      });
    });
  });
});
describe("some error occurs", () => {
  const asyncFunction = (input: string, cb: Function) =>
    cb(new Error("test error"));
  const parallelFunction = (element: number) => Fiberit.for(asyncFunction, "a");

  it("should throw exception", (done) => {
    const params = [1, 2, 3];
    Fiberit.launchFiber(
      () => {
        expect(() => {
          Parallel.map(params, parallelFunction);
        }).to.throw(Error);
        done();
      }
    );
  });
});

const constructTestAsyncFunction = <A, B>(lambda: (A) => B) =>
  (element: A): B =>
    Fiberit.for(
      (input: A, cb: Function) =>
        setTimeout(() => cb(null, lambda(input))
          , 2)
      , element);

describe("zipMap", () => {
  const verifyZipMap = (functs: ((element: number) => number)[], values: number[], expected: number[]) =>
    (done: Function) => {
      Fiberit.launchFiber(
        () => {
          const actual: number[] = Parallel.zipMap(functs, values);
          expect(actual).to.eql(expected);
          done();
        }
      );
    };
  describe("array of functions with array of values", () => {
    it("apply them in correspondence", (done) => {
      const functs = [
        constructTestAsyncFunction(_ => _ * 2),
        constructTestAsyncFunction(_ => _ * 3)
      ];
      const values = [1, 3];
      const expected = [2, 9];
      verifyZipMap(functs, values, expected)(done)
    });
    describe("different array length", () => {
      it("should apply just the minimum common number", (done) => {
        const functs = [
          constructTestAsyncFunction(_ => _ * 2)
        ];
        const values = [1, 3];
        const expected = [2];
        verifyZipMap(functs, values, expected)(done)
      });
    });
    describe("multiple arity functions", () => {
      it("should apply the correct values", (done) => {
        const multipleArityFunction1 = (a: number, b: number) => a + b;
        const multipleArityFunction2 = (a: number, b: number) => a * b;
        const functs = [
          multipleArityFunction1,
          multipleArityFunction2
        ];
        const values: number[][] = [[1, 2], [3, 4]];
        const expected = [3, 12];
        Fiberit.launchFiber(() => {
          const actual = Parallel.zipMapWith(functs, values);
          expect(actual).to.eql(expected);
          done();
        });
      });
    });
  });
});

describe("given a pool", () => {
  describe("when run with size 2", () => {
    it("should return 2 pools", (done) => {
      const action = (i: number, cb) => setTimeout(() => {
        return cb(null, i + 1)
      }, 50);
      const parallelFunction = (i: number) => Fiberit.for(action, i);
      Fiberit.launchFiber(() => {
        const result = Parallel.pool(5, [1, 2, 3, 4, 5, 6], parallelFunction);
        expect(result).to.deep.equal([2, 3, 4, 5, 6, 7]);
        done();
      })
    });
  });

  describe("with run functions with arity N", () => {
    it("then should run in a pool", (done) => {
      Fiberit.launchFiber(() => {
        const action = (x: number, y: number, cb) => setTimeout(() => {
          return cb(null, x + y)
        }, 50);
        const parallelFunction = (x: number, y: number) => Fiberit.for(action, x, y);
        const values = [[0, 1], [1, 2], [3, 5]];
        const result = Parallel.pool(2, values, parallelFunction, true);
        expect(result).to.deep.equal([1, 3, 8]);
        done();
      })
    });
  });
});
