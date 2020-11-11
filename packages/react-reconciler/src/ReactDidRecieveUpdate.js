/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

let _didReceiveUpdate: boolean = false;

export function markWorkInProgressReceivedUpdate() {
  _didReceiveUpdate = true;
}

export function clearWorkInProgressReceivedUpdate() {
  _didReceiveUpdate = false;
}

export function didReceiveUpdate(): boolean {
  return _didReceiveUpdate;
}