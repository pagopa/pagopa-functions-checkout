import * as express from "express";

import { Context } from "@azure/functions";
import { ContextMiddleware } from "io-functions-commons/dist/src/utils/middlewares/context_middleware";

import { identity } from "fp-ts/lib/function";
import { IApiClient } from "../clients/pagopa";

import { RequiredBodyPayloadMiddleware } from "io-functions-commons/dist/src/utils/middlewares/required_body_payload";

import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseSuccessJson,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { withApiRequestWrapper } from "../utils/api";
import { getLogger, ILogger } from "../utils/logging";
import { ErrorResponses } from "../utils/responses";

import { fromPredicate as eitherFromPredicate } from "fp-ts/lib/Either";
import { task, Task } from "fp-ts/lib/Task";
import { PaymentActivationsPostRequest } from "../generated/pagopa-proxy/PaymentActivationsPostRequest";
import { PaymentActivationsPostResponse } from "../generated/pagopa-proxy/PaymentActivationsPostResponse";
import { PaymentProblemJson } from "../generated/pagopa-proxy/PaymentProblemJson";
import { ProblemJson } from "../generated/pagopa-proxy/ProblemJson";
import { RptId } from "../generated/pagopa-proxy/RptId";
import { toErrorPagopaProxyResponse } from "../utils/pagopaProxyUtil";

import { TaskEither } from "fp-ts/lib/TaskEither";
import { getConfigOrThrow } from "../utils/config";

type IActivatePaymentHandler = (
  context: Context,
  paymentRequest: PaymentActivationsPostRequest
) => Promise<
  IResponseSuccessJson<PaymentActivationsPostResponse> | ErrorResponses
>;

const logPrefix = "PostActivatePaymentHandler";

const config = getConfigOrThrow();

const TEST_RPTID = (`${(config.TEST_ORGANIZATION_FISCAL_CODE as string) ||
  "77777777777"}` +
  `${(config.TEST_APPLICATION_CODE as string) || "00"}` +
  `${(config.TEST_AUX_DIGIT as string) || "0"}` +
  `${(config.TEST_CHECK_DIGIT as string) || "00"}` +
  `${(config.TEST_IUV13 as string) || "0000000000000"}`) as RptId;

const activatePaymentTask = (
  logger: ILogger,
  apiClient: IApiClient,
  paymentRequest: PaymentActivationsPostRequest
): TaskEither<ErrorResponses, PaymentActivationsPostResponse> =>
  withApiRequestWrapper<
    PaymentActivationsPostResponse,
    ProblemJson | PaymentProblemJson
  >(
    logger,
    () => apiClient.activatePayment({ body: paymentRequest }),
    200,
    errorResponse =>
      toErrorPagopaProxyResponse(errorResponse, logger, paymentRequest.rptId)
  );

function getActivatePaymentHandlerTask(
  pagoPaClient: IApiClient,
  context: Context,
  paymentRequest: PaymentActivationsPostRequest
): Task<IResponseSuccessJson<PaymentActivationsPostResponse> | ErrorResponses> {
  return eitherFromPredicate(
    rptId => rptId !== TEST_RPTID,
    _ => _
  )(paymentRequest.rptId).fold(
    () => task.of(ResponseSuccessJson({} as PaymentActivationsPostResponse)),
    () =>
      activatePaymentTask(
        getLogger(context, logPrefix, "ActivatePayment"),
        pagoPaClient,
        paymentRequest
      )
        .map(myPayment => ResponseSuccessJson(myPayment))
        .fold<
          IResponseSuccessJson<PaymentActivationsPostResponse> | ErrorResponses
        >(identity, identity)
  );
}

export function ActivatePaymentHandler(
  pagoPaClient: IApiClient
): IActivatePaymentHandler {
  return (context, paymentRequest) => {
    return getActivatePaymentHandlerTask(
      pagoPaClient,
      context,
      paymentRequest
    ).run();
  };
}

export function ActivatePaymentCtrl(
  pagoPaClient: IApiClient
): express.RequestHandler {
  const handler = ActivatePaymentHandler(pagoPaClient);
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredBodyPayloadMiddleware(PaymentActivationsPostRequest)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
}
