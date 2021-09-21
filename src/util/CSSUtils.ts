import _ from "lodash";

export function cx(
  ...args: ReadonlyArray<
    string | null | undefined | Record<string, boolean | undefined>
  >
) {
  const results: string[] = [];
  for (const arg of args) {
    if (typeof arg === "string") {
      results.push(arg);
    } else if (arg !== null && arg !== undefined) {
      for (const entry in arg) {
        if (arg[entry]) {
          results.push(entry);
        }
      }
    }
  }
  return results.join(" ");
}

type CMArg<CS extends Record<string, string>> =
  | keyof CS
  | Partial<Record<keyof CS, boolean>>;

export function cm<CS extends Record<string, string>>(
  classes: CS,
  ...args: ReadonlyArray<CMArg<CS>>
): string {
  const resultParts: string[] = [];
  for (const arg of args) {
    if (typeof arg === "string") {
      resultParts.push(classes[arg]);
    } else {
      _.forEach(arg as Partial<Record<keyof CS, boolean>>, (value, key) => {
        if (value) {
          resultParts.push(classes[key]);
        }
      });
    }
  }
  return resultParts.join(" ");
}
