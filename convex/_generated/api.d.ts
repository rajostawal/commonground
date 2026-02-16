/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activityLog from "../activityLog.js";
import type * as chores from "../chores.js";
import type * as contracts from "../contracts.js";
import type * as events from "../events.js";
import type * as expenses from "../expenses.js";
import type * as helpers from "../helpers.js";
import type * as households from "../households.js";
import type * as memberships from "../memberships.js";
import type * as messages from "../messages.js";
import type * as settlements from "../settlements.js";
import type * as shoppingItems from "../shoppingItems.js";
import type * as shoppingLists from "../shoppingLists.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activityLog: typeof activityLog;
  chores: typeof chores;
  contracts: typeof contracts;
  events: typeof events;
  expenses: typeof expenses;
  helpers: typeof helpers;
  households: typeof households;
  memberships: typeof memberships;
  messages: typeof messages;
  settlements: typeof settlements;
  shoppingItems: typeof shoppingItems;
  shoppingLists: typeof shoppingLists;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
