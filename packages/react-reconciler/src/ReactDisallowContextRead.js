/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

let isContextReadDisallowed: boolean = false;

export function enterDisallowedContextReadInDEV(): void {
  isContextReadDisallowed = true;
}

export function exitDisallowedContextReadInDEV(): void {
  isContextReadDisallowed = false;
}

export function isDisallowedContextReadInDEV(): boolean {
  return isContextReadDisallowed;
}
