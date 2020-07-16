import { dangerText } from "./utils/theme";

export const chain = async (
  cmds: ((ctx: any, next: any, options: any) => Promise<void>)[],
  options: any
) => {
  let ctx = {};

  const next = async (middlewareIndex: number) => {
    if (middlewareIndex >= cmds.length) {
      process.exit(0);
    }
    try {
      await cmds[middlewareIndex](
        ctx,
        () => next(middlewareIndex + 1),
        options || {}
      );
    } catch (err) {
      console.error(`  ${dangerText(err)}`);
      process.exit(1);
    }
  };

  if (cmds.length > 0) {
    await next(0);
  }
};
