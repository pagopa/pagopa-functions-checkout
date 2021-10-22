import {
  fromLeft,
  TaskEither,
  taskEither,
  tryCatch
} from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { IResponseType } from "italia-ts-commons/lib/requests";
import { ILogger } from "./logging";
import {
  ErrorResponses,
  toDefaultResponseErrorInternal,
  toErrorServerResponse
} from "./responses";

export const withApiRequestWrapper = <T, V>(
  logger: ILogger,
  apiCallWithParams: () => Promise<
    t.Validation<IResponseType<number, T | V, never>>
  >,
  successStatusCode: 200 | 201 | 202 = 200,
  errorServerHandler: <S extends number>(
    response: IResponseType<S, V>
  ) => ErrorResponses = toErrorServerResponse
): TaskEither<ErrorResponses, T> =>
  tryCatch(
    () => apiCallWithParams(),
    errs => {
      logger.logUnknown(errs);
      return toDefaultResponseErrorInternal(errs);
    }
  ).foldTaskEither(
    err => fromLeft(err),
    errorOrResponse =>
      errorOrResponse.fold(
        errs => {
          logger.logErrors(errs);
          return fromLeft(toDefaultResponseErrorInternal(errs));
        },
        responseType =>
          responseType.status !== successStatusCode
            ? fromLeft(
                errorServerHandler(responseType as IResponseType<number, V>)
              )
            : taskEither.of(responseType.value as T)
      )
  );
