import { snakeCase, toLower } from "lodash";

export const slugify = (string: string) => {
  return toLower(snakeCase(string));
};

/**
 * Iterate through an array of promises sequentially, ensuring the order
 * is preserved.
 *
 * ```js
 * await sequential(templates, async (template) => {
 *   await doSomething(template)
 * })
 * ```
 */
export const sequential = async <A, B>(
  items: A[],
  callback: (args: A) => Promise<B>
) => {
  const accum: B[] = [];

  const reducePromises = async (previous: Promise<B>, endpoint: A) => {
    const prev = await previous;
    // initial value will be undefined
    if (prev) {
      accum.push(prev);
    }

    return callback(endpoint);
  };

  // @ts-ignore FIXME: this can be properly typed
  accum.push(await items.reduce(reducePromises, Promise.resolve()));

  return accum;
};
