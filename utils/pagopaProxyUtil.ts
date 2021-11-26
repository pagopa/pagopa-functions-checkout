import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import {
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorTooManyRequests,
  ResponseErrorValidation
} from "@pagopa/ts-commons/lib/responses";
import { pipe } from "fp-ts/lib/function";
import { PaymentProblemJson } from "../generated/pagopa-proxy/PaymentProblemJson";
import { ILogger } from "./logging";
import {
  ErrorResponses,
  ResponseErrorUnauthorized,
  unhandledResponseStatus
} from "./responses";

import * as E from "fp-ts/lib/Either";
import { Errors } from "io-ts";
import { PaymentFaultV2Enum } from "../generated/pagopa-proxy/PaymentFaultV2";

export const toErrorPagopaProxyResponse = <S extends number, T>(
  response: IResponseType<S, T>,
  logger: ILogger,
  rptId?: string
) => {
  switch (response.status) {
    case 401:
      return ResponseErrorUnauthorized("Unauthorized", "Unauthorized");
    case 403:
      return ResponseErrorForbiddenNotAuthorized;
    case 404:
      return ResponseErrorNotFound("Not found", "Resource not found");
    case 429:
      return ResponseErrorTooManyRequests("Too many requests");
    case 500:
      return pipe(
        PaymentProblemJson.decode(response.value),
        E.fold<Errors, PaymentProblemJson, ErrorResponses>(
          error => {
            logger.logWarning(error);
            return ResponseErrorInternal("Generic Error");
          },
          result => {
            const detail = result.detail_v2 ? result.detail_v2 : result.detail;
            logger.logInfo(`pagoPA proxy [rptId: ${rptId}, detail: ${detail}]`);
            return detail === PaymentFaultV2Enum.GENERIC_ERROR
              ? ResponseErrorInternal("Generic Error")
              : ResponseErrorValidation("Validation Error", detail);
          }
        )
      );

    default:
      return unhandledResponseStatus(response.status);
  }
};
