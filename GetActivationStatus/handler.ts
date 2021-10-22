import * as express from "express";

import { Context } from "@azure/functions";
import { ContextMiddleware } from "io-functions-commons/dist/src/utils/middlewares/context_middleware";

import { identity } from "fp-ts/lib/function";
import { IApiClient } from "../clients/pagopa";

import { RequiredParamMiddleware } from "io-functions-commons/dist/src/utils/middlewares/required_param";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseSuccessJson,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { PaymentActivationsGetResponse } from "../generated/definitions/PaymentActivationsGetResponse";
import { withApiRequestWrapper } from "../utils/api";
import { getLogger, ILogger } from "../utils/logging";
import { ErrorResponses } from "../utils/responses";

import { TaskEither } from "fp-ts/lib/TaskEither";
import { CodiceContestoPagamento } from "../generated/definitions/CodiceContestoPagamento";
import { PaymentProblemJson } from "../generated/pagopa-proxy/PaymentProblemJson";
import { ProblemJson } from "../generated/pagopa-proxy/ProblemJson";
import { toErrorPagopaProxyResponse } from "../utils/pagopaProxyUtil";

type IGetActivationStatusHandler = (
  context: Context,
  codiceContestoPagamento: CodiceContestoPagamento
) => Promise<
  IResponseSuccessJson<PaymentActivationsGetResponse> | ErrorResponses
>;

const logPrefix = "GetActivationStatusHandler";

const GetActivationStatusTask = (
  logger: ILogger,
  apiClient: IApiClient,
  codiceContestoPagamento: CodiceContestoPagamento
): TaskEither<ErrorResponses, PaymentActivationsGetResponse> =>
  withApiRequestWrapper<
    PaymentActivationsGetResponse,
    ProblemJson | PaymentProblemJson
  >(
    logger,
    () =>
      apiClient.getActivationStatus({
        codice_contesto_pagamento: codiceContestoPagamento
      }),
    200,
    toErrorPagopaProxyResponse
  );

export function GetActivationStatusHandler(
  pagoPaClient: IApiClient
): IGetActivationStatusHandler {
  return (context, codiceContestoPagamento) => {
    return GetActivationStatusTask(
      getLogger(context, logPrefix, "GetActivationStatus"),
      pagoPaClient,
      codiceContestoPagamento
    )
      .map(myPayment => ResponseSuccessJson(myPayment))
      .fold<
        IResponseSuccessJson<PaymentActivationsGetResponse> | ErrorResponses
      >(identity, identity)
      .run();
  };
}

export function GetActivationStatusCtrl(
  pagoPaClient: IApiClient
): express.RequestHandler {
  const handler = GetActivationStatusHandler(pagoPaClient);
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredParamMiddleware("codiceContestoPagamento", CodiceContestoPagamento)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
}
