/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {SuspenseHydrationCallbacks} from './ReactInternalTypes';
import type {FiberRoot} from './ReactInternalTypes';
import type {RootTag} from './ReactRootTags';
import type {
  Container,
} from './ReactFiberHostConfig';
import type {ReactNodeList} from 'shared/ReactTypes';
import type {Lane} from './ReactFiberLane';

import {get as getInstance} from 'shared/ReactInstanceMap';
import {
  ClassComponent,
} from './ReactWorkTags';
import getComponentName from 'shared/getComponentName';
import {enableSchedulingProfiler} from 'shared/ReactFeatureFlags';
import {
  findCurrentUnmaskedContext,
  processChildContext,
  emptyContextObject,
  isContextProvider as isLegacyContextProvider,
} from './ReactFiberContext.new';
import {createFiberRoot} from './ReactFiberRoot.new';
import {onScheduleRoot} from './ReactFiberDevToolsHook.new';
import {
  requestEventTime,
  requestUpdateLane,
  scheduleUpdateOnFiber,
  warnIfNotScopedWithMatchingAct,
  warnIfUnmockedScheduler,
} from './ReactFiberWork.new';
import {createUpdate, enqueueUpdate} from './ReactUpdateQueue.new';
import {
  isRendering as ReactCurrentFiberIsRendering,
  current as ReactCurrentFiberCurrent,
} from './ReactCurrentFiber';
import {markRenderScheduled} from './SchedulingProfiler';

type OpaqueRoot = FiberRoot;

let didWarnAboutNestedUpdates;

if (__DEV__) {
  didWarnAboutNestedUpdates = false;
}

function getContextForSubtree(
  parentComponent: ?React$Component<any, any>,
): Object {
  if (!parentComponent) {
    return emptyContextObject;
  }

  const fiber = getInstance(parentComponent);
  const parentContext = findCurrentUnmaskedContext(fiber);

  if (fiber.tag === ClassComponent) {
    const Component = fiber.type;
    if (isLegacyContextProvider(Component)) {
      return processChildContext(fiber, Component, parentContext);
    }
  }

  return parentContext;
}

export function createContainer(
  containerInfo: Container,
  tag: RootTag,
  hydrate: boolean,
  hydrationCallbacks: null | SuspenseHydrationCallbacks,
): OpaqueRoot {
  return createFiberRoot(containerInfo, tag, hydrate, hydrationCallbacks);
}

export function updateContainer(
  element: ReactNodeList,
  container: OpaqueRoot,
  parentComponent: ?React$Component<any, any>,
  callback: ?Function,
): Lane {
  if (__DEV__) {
    onScheduleRoot(container, element);
  }
  const current = container.current;
  const eventTime = requestEventTime();
  if (__DEV__) {
    // $FlowExpectedError - jest isn't a global, and isn't recognized outside of tests
    if ('undefined' !== typeof jest) {
      warnIfUnmockedScheduler(current);
      warnIfNotScopedWithMatchingAct(current);
    }
  }
  const lane = requestUpdateLane(current);

  if (enableSchedulingProfiler) {
    markRenderScheduled(lane);
  }

  const context = getContextForSubtree(parentComponent);
  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }

  if (__DEV__) {
    if (
      ReactCurrentFiberIsRendering &&
      ReactCurrentFiberCurrent !== null &&
      !didWarnAboutNestedUpdates
    ) {
      didWarnAboutNestedUpdates = true;
      console.error(
        'Render methods should be a pure function of props and state; ' +
          'triggering nested component updates from render is not allowed. ' +
          'If necessary, trigger nested updates in componentDidUpdate.\n\n' +
          'Check the render method of %s.',
        getComponentName(ReactCurrentFiberCurrent.type) || 'Unknown',
      );
    }
  }

  const update = createUpdate(eventTime, lane);
  // Caution: React DevTools currently depends on this property
  // being called "element".
  update.payload = {element};

  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    if (__DEV__) {
      if (typeof callback !== 'function') {
        console.error(
          'render(...): Expected the last optional `callback` argument to be a ' +
            'function. Instead received: %s.',
          callback,
        );
      }
    }
    update.callback = callback;
  }

  enqueueUpdate(current, update);
  scheduleUpdateOnFiber(current, lane, eventTime);

  return lane;
}
