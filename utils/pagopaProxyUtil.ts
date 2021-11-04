import { IResponseType } from "italia-ts-commons/lib/requests";
import {
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorTooManyRequests,
  ResponseErrorValidation
} from "italia-ts-commons/lib/responses";
import { PaymentProblemJson } from "../generated/pagopa-proxy/PaymentProblemJson";
import { ILogger } from "./logging";
import {
  ErrorResponses,
  ResponseErrorUnauthorized,
  unhandledResponseStatus
} from "./responses";

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
      return PaymentProblemJson.decode(response.value).fold<ErrorResponses>(
        error => {
          logger.logWarning(error);
          return ResponseErrorInternal("Generic Error");
        },
        result => {
          const detail = result.detail_v2 ? result.detail_v2 : result.detail;
          logger.logInfo(`pagoPA proxy [rptId: ${rptId}, detail: ${detail}]`);
          return ResponseErrorValidation("Validation Error", detail);
        }
      );
    default:
      return unhandledResponseStatus(response.status);
  }
};
