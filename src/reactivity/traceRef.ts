import { ReactiveEffectType, effect, ReactiveEffect } from './effect';
import { NOOP } from '../utils';
import { toReactive } from './reactive';
import { Ref, UnwrapRef } from './ref';
import { ComputedRef } from './computed';

export interface TraceRef<T = any> extends Ref<T> {
  readonly effect: ReactiveEffect<T>;
  readonly value: UnwrapRef<T>;
}

const schedulerMap = new WeakMap<any, any>();

export function reactiveTrace<T>(target: T, scheduler: () => void): TraceRef<T> {
  let runner = schedulerMap.get(scheduler);

  if (runner == null) {
    runner = effect(NOOP, {
      lazy: true,
      // mark effect as trace effect so that it gets low priority during trigger
      type: ReactiveEffectType.TRACE,
      scheduler: () => {
        scheduler();
      },
    });
    schedulerMap.set(scheduler, runner);
  }

  const value = toReactive(target, null, runner);

  return {
    _isReactiveTraceRef: true,
    // expose effect so trace ref can be stopped
    effect: runner,
    value,
  } as any;
}

export function isReactiveTrace(r: any) {
  return r ? r._isReactiveTraceRef === true : false;
}

export function computedTrace<T>(computedRef: ComputedRef, scheduler: () => void): TraceRef<T> {
  const runner = effect(NOOP, {
    lazy: true,
    // mark effect as trace effect so that it gets low priority during trigger
    type: ReactiveEffectType.TRACE,
    scheduler: () => {
      scheduler();
    },
  });

  return {
    _isComputedTraceRef: true,
    // expose effect so trace ref can be stopped
    effect: runner,
    get value() {
      const value = computedRef.value;
      const childRunner = computedRef.effect;
      for (let i = 0; i < childRunner.deps.length; i++) {
        const dep = childRunner.deps[i];
        if (!dep.has(runner)) {
          dep.add(runner);
          runner.deps.push(dep);
        }
      }
      return value;
    },
  } as any;
}

export function isComputedTrace(r: any) {
  return r ? r._isComputedTraceRef === true : false;
}
