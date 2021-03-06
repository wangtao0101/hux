import { unlockValue, lockValue } from '../../lock';
import { reactiveTrace, computedTrace } from '../../traceRef';
import { reactive } from '../../reactive';
import { stop } from '../../effect';
import { computed } from '../../computed';

describe('reactivity/traceRef', () => {
  beforeAll(() => {
    unlockValue();
  });

  afterAll(() => {
    lockValue();
  });

  it('should trigger reactive trace scheduler', () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    const fnSpy = jest.fn(() => {});

    const traceRef = reactiveTrace(original, fnSpy);

    expect(traceRef.value.foo).toBe(1);
    observed.foo++;

    expect(traceRef.value.foo).toBe(2);
    expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it('should forbid change state on component state', () => {
    const original = { foo: 1 };

    const fnSpy = jest.fn(() => {});

    const traceRef = reactiveTrace(original, fnSpy);

    expect(() => {
      // @ts-ignore
      delete traceRef.value.foo;
    }).toThrowError(
      /Cannot delete key: foo, nostate state is readonly except in corresponding reducer./
    );

    expect(() => {
      traceRef.value.foo = 2;
    }).toThrowError(
      /Cannot set key: foo, nostate state is readonly except in corresponding reducer./
    );
  });

  it('should no longer call scheduler when reactive trace effect stopped', () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    const fnSpy = jest.fn(() => {});

    const traceRef = reactiveTrace(original, fnSpy);

    expect(traceRef.value.foo).toBe(1);
    observed.foo++;

    expect(fnSpy).toHaveBeenCalledTimes(1);

    stop(traceRef.effect);

    observed.foo++;

    expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it('should trigger computed trace scheduler', () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    const cValue = computed(() => observed.foo + 1);

    const fnSpy = jest.fn(() => {});

    const traceRef = computedTrace(cValue, fnSpy);

    expect(traceRef.value).toBe(2);
    observed.foo++;

    expect(traceRef.value).toBe(3);
    expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it('should no longer call scheduler when computed trace effect stopped', () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    const cValue = computed(() => observed.foo + 1);

    const fnSpy = jest.fn(() => {});

    const traceRef = computedTrace(cValue, fnSpy);

    expect(traceRef.value).toBe(2);
    observed.foo++;

    expect(fnSpy).toHaveBeenCalledTimes(1);

    stop(traceRef.effect);

    observed.foo++;

    expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it('should trigger and forbid modify on reactive value based on trace reactive value ', () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    const fnSpy = jest.fn(() => {});

    const traceRef = reactiveTrace(original, fnSpy);

    const observed1 = reactive(traceRef.value);

    expect(observed1.foo).toBe(1);

    observed.foo++;
    expect(fnSpy).toHaveBeenCalledTimes(1);

    expect(() => {
      observed1.foo = 2;
    }).toThrowError(
      /Cannot set key: foo, nostate state is readonly except in corresponding reducer./
    );
  });

  it('should get same reactive obj', () => {
    const original = { foo: { foo: 1 } };
    const fnSpy = jest.fn(() => {});

    const traceRef = reactiveTrace(original, fnSpy);

    const proxy1 = traceRef.value.foo;
    const proxy2 = traceRef.value.foo;
    expect(proxy1 === proxy2).toBe(true);
  });

  it('should get new trace reactive obj after set new value', () => {
    const original = { foo: 1, a: { foo: 1 }, b: [1] };
    const observed = reactive(original);
    const fnSpy = jest.fn(() => {});

    const traceRef = reactiveTrace(original, fnSpy);

    const traceRef1 = reactiveTrace(original, fnSpy);
    expect(traceRef.value === traceRef1.value).toBe(true);

    observed.foo++;
    const traceRef2 = reactiveTrace(original, fnSpy);
    expect(traceRef.value === traceRef2.value).toBe(false);

    observed.a.foo++;
    const traceRef3 = reactiveTrace(original, fnSpy);
    expect(traceRef2.value === traceRef3.value).toBe(false);

    observed.b.push(2);
    const traceRef4 = reactiveTrace(original, fnSpy);
    expect(traceRef3.value === traceRef4.value).toBe(false);
  });

  it('should get new trace reactive obj after push new value for array', () => {
    const original = [{ foo: 1 }, 1];
    const observed = reactive(original);
    const fnSpy = jest.fn(() => {});

    const traceRef = reactiveTrace(original, fnSpy);

    const traceRef1 = reactiveTrace(original, fnSpy);
    expect(traceRef.value === traceRef1.value).toBe(true);

    observed.push(1);
    const traceRef2 = reactiveTrace(original, fnSpy);
    expect(traceRef.value === traceRef2.value).toBe(false);

    // @ts-ignore
    observed[0].foo++;
    const traceRef3 = reactiveTrace(original, fnSpy);
    expect(traceRef2.value === traceRef3.value).toBe(false);
  });
});
