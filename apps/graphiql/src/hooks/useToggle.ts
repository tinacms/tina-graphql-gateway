import { useMachine } from "@xstate/react";
import { Machine, assign, Interpreter, State } from "xstate";

interface ToggleStateSchema {
  states: {
    closed: {
      states: {
        closing: {};
        closed: {};
      };
    };
    opened: {
      states: {
        opening: {};
        opened: {};
      };
    };
  };
}
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
type ToggleEvent = { type: "TOGGLE" } | { type: "CLOSE" } | { type: "OPEN" };
type ToggleState =
  | {
      value: "closed";
      context: any;
    }
  | {
      value: "opened" | "opened.opening" | "opened.opened";
      context: any;
    };

const toggleMachine = Machine<ToggleContext, ToggleStateSchema, ToggleEvent>(
  {
    id: "toggle",
    initial: "closed",
    entry: "assignInitial",
    states: {
      closed: {
        on: { TOGGLE: "opened", OPEN: "opened" },
        initial: "closing",
        entry: "assignClosed",
        states: {
          closing: {
            invoke: {
              src: async () => sleep(300),
              onDone: {
                target: "closed",
              },
            },
          },
          closed: { type: "final" },
        },
      },
      opened: {
        on: { TOGGLE: "closed", CLOSE: "closed" },
        initial: "opening",
        entry: "assignOpened",
        states: {
          opening: {
            invoke: {
              src: async () => sleep(300),
              onDone: {
                target: "opened",
              },
            },
          },
          opened: {
            type: "final",
          },
        },
      },
    },
  },
  {
    actions: {
      assignInitial: assign((context, event) => {
        const classes: { [key: string]: string } = {};
        Object.keys(context.properties).map((item) => {
          classes[item] = context.properties[item]?.className || "";
        });

        return {
          ...context,
          classes,
        };
      }),
      assignClosed: assign((context, event) => {
        const classes: { [key: string]: string } = {};
        Object.keys(context.properties)
          .filter((item) => item !== "classes")
          .map((item) => {
            classes[item] =
              context.properties[item]?.className +
                " " +
                context.properties[item]?.closed?.className || "";
          });

        return {
          ...context,
          classes,
        };
      }),
      assignOpened: assign((context, event) => {
        const classes: { [key: string]: string } = {};
        Object.keys(context.properties)
          .filter((item) => item !== "classes")
          .map((item) => {
            classes[item] =
              context.properties[item].className +
                " " +
                context.properties[item]?.opened?.className || "";
          });

        return {
          ...context,
          classes,
        };
      }),
    },
  }
);

type InnerToggleContext = {
  className?: string;
  opened?: {
    className?: string;
    opening?: { className: string };
    opened?: { className: string };
  };
  closed?: {
    className?: string;
    closing?: { className: string };
    closed?: { className: string };
  };
};
type InnerToggleReturn = {
  [key: string]: string | undefined;
};

type ToggleContext = {
  classes: {
    outerClasses?: string;
    overlayClasses?: string;
    closeButton?: string;
    menuClasses?: string;
  };
  className: string;
  properties: {
    [key: string]: InnerToggleContext;
  };
};

export const useToggleMachine = (classObject: {
  [key: string]: InnerToggleContext;
}): [
  State<ToggleContext, ToggleEvent, any, ToggleState>,
  // @ts-ignore
  Interpreter<ToggleContext, any, ToggleEvent, ToggleState>["send"],
  InnerToggleReturn
] => {
  const [state, send] = useMachine<ToggleContext, ToggleEvent, ToggleState>(
    toggleMachine,
    {
      context: {
        properties: classObject,
      },
    }
  );

  const classNames = state.context.classes;

  return [state, send, classNames];
};
