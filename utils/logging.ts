import { Context } from "@azure/functions";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { Errors } from "io-ts";

export const getLogger = (
  context: Context,
  logPrefix: string,
  name: string
) => {
  return {
    logErrors: (errs: Errors) => {
      return context.log.error(
        `${logPrefix}|${name}|ERROR=${errorsToReadableMessages(errs)}`
      );
    },
    logInfo: (errs: string) =>
      context.log.info(`${logPrefix}|${name}|INFO=${errs}`),
    logUnknown: (errs: unknown) =>
      context.log.error(
        `${logPrefix}|${name}|UNKNOWN_ERROR=${JSON.stringify(errs)}`
      ),
    logWarning: (errs: unknown) =>
      context.log.warn(
        `${logPrefix}|${name}|UNKNOWN_ERROR=${JSON.stringify(errs)}`
      )
  };
};

export type ILogger = ReturnType<typeof getLogger>;
