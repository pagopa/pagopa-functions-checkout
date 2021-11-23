import * as express from "express";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";

import { Context } from "@azure/functions";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";

import { flow, pipe } from "fp-ts/lib/function";
import { IApiClient } from "../clients/pagopa";

import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import { RequiredQueryParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_query_param";

import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseSuccessJson,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";

import { PaymentRequestsGetResponse } from "../generated/definitions/PaymentRequestsGetResponse";
import { withApiRequestWrapper } from "../utils/api";
import { getLogger, ILogger } from "../utils/logging";
import { ErrorResponses, ResponseErrorUnauthorized } from "../utils/responses";

import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { task } from "fp-ts";
import { Task } from "fp-ts/lib/Task";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { fetchApi } from "../clients/fetchApi";
import { PaymentProblemJson } from "../generated/pagopa-proxy/PaymentProblemJson";
import { ProblemJson } from "../generated/pagopa-proxy/ProblemJson";
import { getConfigOrThrow } from "../utils/config";
import { toErrorPagopaProxyResponse } from "../utils/pagopaProxyUtil";
import { RptIdFromString } from "../utils/RptIdFromString";

type IGetPaymentInfoHandler = (
  context: Context,
  rptId: RptIdFromString,
  recaptchaResponse: string
) => Promise<IResponseSuccessJson<PaymentRequestsGetResponse> | ErrorResponses>;

const config = getConfigOrThrow();

const TEST_RTPID = {
  organizationFiscalCode:
    (config.TEST_ORGANIZATION_FISCAL_CODE as string) || "77777777777",
  paymentNoticeNumber: {
    applicationCode: (config.TEST_APPLICATION_CODE as string) || "00",
    auxDigit: (config.TEST_AUX_DIGIT as string) || "0",
    checkDigit: (config.TEST_CHECK_DIGIT as string) || "00",
    iuv13: (config.TEST_IUV13 as string) || "0000000000000"
  }
} as RptIdFromString;

/**
 * Model for Google reCaptcha response
 */
const ResponseR = t.interface({
  challenge_ts: t.string,
  hostname: t.string,
  success: t.boolean
});

const ResponseO = t.partial({
  "error-codes": t.readonlyArray(t.string, "array of string")
});

export const ResponseRecaptcha = t.intersection(
  [ResponseR, ResponseO],
  "ResponseRecaptcha"
);

export type ResponseRecaptcha = t.TypeOf<typeof ResponseRecaptcha>;

const logPrefix = "GetPaymentInfoHandler";

const getPaymentInfoTask = (
  logger: ILogger,
  apiClient: IApiClient,
  rptId: RptIdFromString
): TaskEither<ErrorResponses, PaymentRequestsGetResponse> =>
  withApiRequestWrapper<
    PaymentRequestsGetResponse,
    ProblemJson | PaymentProblemJson
  >(
    logger,
    () =>
      apiClient.getPaymentInfo({
        rpt_id_from_string: RptIdFromString.encode(rptId)
      }),
    200,
    errorResponse =>
      toErrorPagopaProxyResponse(
        errorResponse,
        logger,
        RptIdFromString.encode(rptId)
      )
  );

export const recaptchaCheckTask = (
  recaptchaResponse: string,
  recaptchaSecret: string,
  googleHost: string = "https://www.google.com"
): TaskEither<Error, ResponseRecaptcha> =>
  pipe(
    TE.tryCatch(
      () =>
        fetchApi(`${googleHost}/recaptcha/api/siteverify`, {
          body: `secret=${recaptchaSecret}&response=${recaptchaResponse}`,
          headers: {
            // tslint:disable-next-line: no-duplicate-string
            "Content-Type": "application/x-www-form-urlencoded"
          },
          method: "POST"
        }),
      err => new Error(`Error posting recaptcha API: ${err}`)
    ),
    TE.chain(
      TE.fromPredicate<Error, Response>(
        r => r.ok,
        r => new Error(`Error returned from recaptcha API: ${r.status}`)
      )
    ),
    TE.chain(response =>
      TE.tryCatch(
        () => response.json(),
        err => new Error(`Error getting recaptcha API payload: ${err}`)
      )
    ),
    TE.chain(json =>
      TE.fromEither(
        pipe(
          ResponseRecaptcha.decode(json),
          E.mapLeft(
            errors =>
              new Error(
                `Error while decoding response from recaptcha: ${readableReport(
                  errors
                )})`
              )
          )
        )
      )
    ),
    TE.chain(
      TE.fromPredicate(
        ar => ar.success,
        _ => new Error(`Error checking recaptcha`)
      )
    )
  );

const isRegularRptId = (r: RptIdFromString) =>
  JSON.stringify(r) !== JSON.stringify(TEST_RTPID);

function GetPaymentInfoHandlerTask(
  pagoPaClient: IApiClient,
  recaptchaSecret: string,
  context: Context,
  rptId: RptIdFromString,
  recaptchaResponse: string
): Task<IResponseSuccessJson<PaymentRequestsGetResponse> | ErrorResponses> {
  return flow(
    E.fromPredicate(isRegularRptId, _ => _),
    E.map(_ =>
      pipe(
        recaptchaCheckTask(recaptchaResponse, recaptchaSecret),
        TE.mapLeft(e => ResponseErrorUnauthorized("Unauthorized", e.message)),
        TE.chain(() =>
          getPaymentInfoTask(
            getLogger(context, logPrefix, "GetPaymentInfo"),
            pagoPaClient,
            rptId
          )
        ),
        TE.map(myPayment => ResponseSuccessJson(myPayment)),
        TE.toUnion
      )
    ),
    E.mapLeft(_ =>
      task.of(
        ResponseSuccessJson({
          codiceContestoPagamento: "",
          importoSingoloVersamento: 0
        } as PaymentRequestsGetResponse)
      )
    ),
    E.toUnion
  )(rptId);
}

export function GetPaymentInfoHandler(
  pagoPaClient: IApiClient,
  recaptchaSecret: string
): IGetPaymentInfoHandler {
  return (context, rptId, recaptchaResponse) =>
    GetPaymentInfoHandlerTask(
      pagoPaClient,
      recaptchaSecret,
      context,
      rptId,
      recaptchaResponse
    )();
}

export function GetPaymentInfoCtrl(
  pagoPaClient: IApiClient,
  recaptchaSecret: string
): express.RequestHandler {
  const handler = GetPaymentInfoHandler(pagoPaClient, recaptchaSecret);
  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredParamMiddleware("rptId", RptIdFromString),
    RequiredQueryParamMiddleware("recaptchaResponse", t.string)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
}
