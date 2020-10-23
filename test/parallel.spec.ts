import {expect} from 'chai';
import {Parallel} from "../src";
import {Fiberit, NodeCallback} from "../src";
import {Done} from "mocha";

describe("parallel map", () => {
  describe("called", () => {
    describe("scatter-gathers", () => {
      const asyncFunction = (input: number, cb: Function) => setTimeout(() => cb(null, input * 2), 2);
      const parallelFunction: (element: number) => number = (element: number) => Fiberit.for<number>(asyncFunction, element);

      it("when passed array with values", (done: Done) => {
        const params = [1, 2, 3];
        Fiberit.launchFiber(
          () => {
            const results = Parallel.map(params, parallelFunction);
            expect(results).to.eql([2, 4, 6]);
            done();
          }
        );
      });
      it("do nothing when passed empty array", (done: Done) => {
        const params: any[] = [];
        Fiberit.launchFiber(
          () => {
            const retVal = Parallel.map(params, parallelFunction);
            expect(retVal).to.eql([]);
            done();
          }
        );
      });
      it("should work with data", (done: Done) => {
        const source = [1, 2, 3];
        const parallel = Parallel.withData(source);

        Fiberit.launchFiber(() => {
          expect(parallel(parallelFunction)).to.eql([2, 4, 6]);
          done();
        });
      });
    });
  });
});

describe("some error occurs", () => {
  const asyncFunction = (input: number, cb: Function) => cb(new Error(`error ${input}`));
  const parallelFunction = (element: number) => Fiberit.for(asyncFunction, element);

  it("should throw exception", (done: Done) => {
    const params = [1, 2, 3];
    Fiberit.launchFiber(() => {
      const expectedToThrowOnExecute = () => Parallel.map(params, parallelFunction);
      expect(expectedToThrowOnExecute).to.throw(/error 1/);
      done();
    });
  });
});

const constructTestAsyncFunction = <A, B>(lambda: (...e: A[]) => B) => (element: A): B =>
  Fiberit.for((input: A, cb: Function) => setTimeout(() => cb(null, lambda(input)), 2), element);

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
    it("apply them in correspondence", (done: Done) => {
      const functs = [
        constructTestAsyncFunction((_: number) => _ * 2),
        constructTestAsyncFunction((_: number) => _ * 3)
      ];
      const values = [1, 3];
      const expected = [2, 9];
      verifyZipMap(functs, values, expected)(done)
    });
    describe("different array length", () => {
      it("should apply just the minimum common number", (done: Done) => {
        const functs = [
          constructTestAsyncFunction((_: number) => _ * 2)
        ];
        const values = [1, 3];
        const expected = [2];
        verifyZipMap(functs, values, expected)(done)
      });
    });
    describe("multiple arity functions", () => {
      it("should apply the correct values", (done: Done) => {
        const multipleArityFunction1 = (a: number, b: number): number => a + b;
        const multipleArityFunction2 = (a: number, b: number, c: number): number => a * b * c;
        const functs = [
          multipleArityFunction1,
          multipleArityFunction2
        ];
        const values: number[][] = [[1, 2], [3, 4, 5]];
        const expected = [3, 60];
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
  describe("when run unary function", () => {
    it("should return value", (done: Done) => {
      const parallelFunction = constructTestAsyncFunction((_: number) => _ * 2);
      Fiberit.launchFiber(() => {
        const values = [1, 2, 3, 4, 5, 6];
        const result = Parallel.pool(5, values, parallelFunction);
        expect(result).to.deep.equal([2, 4, 6, 8, 10, 12]);
        done();
      })
    });
  });

  describe("when run functions with arity N", () => {
    it("then should run in a pool", (done: Done) => {
      Fiberit.launchFiber(() => {
        const action = (x: number, y: number, cb: NodeCallback<number>) => setTimeout(() => cb(null, x + y), 50);
        const parallelFunction = (x: number, y: number) => Fiberit.for(action, x, y);
        const values = [[0, 1], [1, 2], [3, 5]];
        const result = Parallel.poolWith(2, values, parallelFunction);
        expect(result).to.deep.equal([1, 3, 8]);
        done();
      })
    });
  });
});
