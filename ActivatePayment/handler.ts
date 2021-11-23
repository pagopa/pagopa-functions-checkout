import * as express from "express";

import { Context } from "@azure/functions";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";

import { flow, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { IApiClient } from "../clients/pagopa";

import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";

import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseSuccessJson,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";

import { withApiRequestWrapper } from "../utils/api";
import { getLogger, ILogger } from "../utils/logging";
import { ErrorResponses } from "../utils/responses";

import { TaskEither } from "fp-ts/lib/TaskEither";
import { PaymentActivationsPostRequest } from "../generated/pagopa-proxy/PaymentActivationsPostRequest";
import { PaymentActivationsPostResponse } from "../generated/pagopa-proxy/PaymentActivationsPostResponse";
import { PaymentProblemJson } from "../generated/pagopa-proxy/PaymentProblemJson";
import { ProblemJson } from "../generated/pagopa-proxy/ProblemJson";
import { getConfigOrThrow } from "../utils/config";
import { toErrorPagopaProxyResponse } from "../utils/pagopaProxyUtil";

import { task } from "fp-ts";
import * as E from "fp-ts/lib/Either";
import { Task } from "fp-ts/lib/Task";

const config = getConfigOrThrow();

type IActivatePaymentHandler = (
  context: Context,
  paymentRequest: PaymentActivationsPostRequest
) => Promise<
  IResponseSuccessJson<PaymentActivationsPostResponse> | ErrorResponses
>;

const TEST_RPTID =
  `${(config.TEST_ORGANIZATION_FISCAL_CODE as string) || "77777777777"}` +
  `${(config.TEST_APPLICATION_CODE as string) || "00"}` +
  `${(config.TEST_AUX_DIGIT as string) || "0"}` +
  `${(config.TEST_CHECK_DIGIT as string) || "00"}` +
  `${(config.TEST_IUV13 as string) || "0000000000000"}`;

const logPrefix = "PostActivatePaymentHandler";

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

function getPaymentHandlerTask(
  pagoPaClient: IApiClient,
  context: Context,
  paymentRequest: PaymentActivationsPostRequest
): Task<IResponseSuccessJson<PaymentActivationsPostResponse> | ErrorResponses> {
  return flow(
    E.fromPredicate(
      rptId => rptId !== TEST_RPTID,
      _ => _
    ),
    E.map(_ =>
      pipe(
        activatePaymentTask(
          getLogger(context, logPrefix, "ActivatePayment"),
          pagoPaClient,
          paymentRequest
        ),
        TE.map(myPayment => ResponseSuccessJson(myPayment)),
        TE.toUnion
      )
    ),
    E.mapLeft(_ =>
      pipe(task.of(ResponseSuccessJson({} as PaymentActivationsPostResponse)))
    ),
    E.toUnion
  )(paymentRequest.rptId);
}

export function ActivatePaymentHandler(
  pagoPaClient: IApiClient
): IActivatePaymentHandler {
  return (context, paymentRequest) => {
    return getPaymentHandlerTask(pagoPaClient, context, paymentRequest)();
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
