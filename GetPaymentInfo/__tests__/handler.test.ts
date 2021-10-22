/* tslint:disable: no-any */
import { Context } from "@azure/functions";

import { paymentInfo } from "../../__mocks__/mock";

// should be HERE !!!!
process.env = {
  IO_PAGOPA_PROXY_PROD_BASE_URL: "http://localhost:7071/api/v1",
  IO_PAGOPA_PROXY_TEST_BASE_URL: "http://localhost:7071/api/v1",
  PAGOPA_BASE_PATH: "NonEmptyString",
  IO_PAY_XPAY_REDIRECT: "http://localhost"
};

import { left, right } from "fp-ts/lib/Either";

import * as logger from "../../utils/logging";

import { PaymentRequestsGetResponse } from "../../generated/definitions/PaymentRequestsGetResponse";

import { RptIdFromString } from "italia-pagopa-commons/lib/pagopa";

import * as handlers from "../handler";

import { taskEither } from "fp-ts/lib/TaskEither";
import { ResponseRecaptcha } from "../handler";

import * as fetch from "../../clients/fetchApi";

const context = ({
  bindings: {},
  log: {
    // tslint:disable-next-line: no-console
    error: jest.fn().mockImplementation(console.log),
    // tslint:disable-next-line: no-console
    info: jest.fn().mockImplementation(console.log),
    // tslint:disable-next-line: no-console
    verbose: jest.fn().mockImplementation(console.log),
    // tslint:disable-next-line: no-console
    warn: jest.fn().mockImplementation(console.log)
  }
} as any) as Context;

// use to mock getLogger
jest.spyOn(logger, "getLogger").mockReturnValueOnce({
  logErrors: jest.fn(),
  logUnknown: jest.fn()
});

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

it("should return a payment info KO response", async () => {
  jest.spyOn(handlers, "recaptchaCheckTask").mockReturnValueOnce(
    taskEither.of({
      challenge_ts: "challenge_ts",
      hostname: "hostname",
      success: true
    } as ResponseRecaptcha)
  );

  const apiClientMock = {
    getPaymentInfo: jest.fn(_ => {
      return Promise.resolve(
        left({
          status: 400,
          value: {
            type: paymentInfo.messageReceivedNOK
          }
        })
      );
    })
  };

  const handler = handlers.GetPaymentInfoHandler(
    apiClientMock as any,
    "recaptchaSecret"
  );

  const response = await handler(
    context,
    {
      organizationFiscalCode: paymentInfo.organizationFiscalCode,
      paymentNoticeNumber: {
        applicationCode: paymentInfo.applicationCode,
        auxDigit: paymentInfo.auxDigit,
        checkDigit: paymentInfo.checkDigit,
        iuv13: paymentInfo.iuv13
      }
    } as RptIdFromString,
    "recaptchaResponse"
  );

  expect(response.kind).toBe("IResponseErrorInternal");
});

it("should return a payment info OK response PaymentRequestsGetResponse", async () => {
  jest.spyOn(handlers, "recaptchaCheckTask").mockReturnValueOnce(
    taskEither.of({
      challenge_ts: "challenge_ts",
      hostname: "hostname",
      success: true
    } as ResponseRecaptcha)
  );

  const apiClientMock = {
    getPaymentInfo: jest.fn(_ => {
      return Promise.resolve(
        right({
          status: 200,
          value: {
            importoSingoloVersamento: paymentInfo.importoSingoloVersamento,
            codiceContestoPagamento: paymentInfo.codiceContestoPagamento,
            ibanAccredito: paymentInfo.ibanAccredito,
            causaleVersamento: paymentInfo.causaleVersamento
          } as PaymentRequestsGetResponse
        })
      );
    })
  };

  const handler = handlers.GetPaymentInfoHandler(
    apiClientMock as any,
    "captchaSecret"
  );

  const response = await handler(
    context,
    {
      organizationFiscalCode: paymentInfo.organizationFiscalCode,
      paymentNoticeNumber: {
        applicationCode: paymentInfo.applicationCode,
        auxDigit: paymentInfo.auxDigit,
        checkDigit: paymentInfo.checkDigit,
        iuv13: paymentInfo.iuv13
      }
    } as RptIdFromString,
    "captchaResponse"
  );

  expect(response.kind).toBe("IResponseSuccessJson");
});

it("should return Error if recaptcha check fails - recaptchaCheckTask", async () => {
  jest.spyOn(fetch, "fetchApi").mockReturnValueOnce(
    Promise.resolve({
      ok: false,
      status: 500
    } as Response)
  );

  const result = await handlers
    .recaptchaCheckTask("recaptchaResponse", "recaptchaSecret")
    .run();

  expect(result.isLeft()).toBe(true);
});

it("should return Error if there is a network error - recaptchaCheckTask", async () => {
  jest.spyOn(fetch, "fetchApi").mockReturnValueOnce(Promise.reject());

  const result = await handlers
    .recaptchaCheckTask("recaptchaResponse", "recaptchaSecret")
    .run();

  expect(result.isLeft()).toBe(true);
});

it("should return Error if the json response is invalid  - recaptchaCheckTask", async () => {
  jest.spyOn(fetch, "fetchApi").mockReturnValueOnce(
    Promise.resolve({
      json: () => Promise.reject(),
      ok: true,
      status: 200
    } as Response)
  );

  const result = await handlers
    .recaptchaCheckTask("recaptchaResponse", "recaptchaSecret")
    .run();

  expect(result.isLeft()).toBe(true);
});

it("should return IResponseErrorValidation response when pagopa proxy return 500 with PAYMENT_ONGOING", async () => {
  jest.spyOn(handlers, "recaptchaCheckTask").mockReturnValueOnce(
    taskEither.of({
      challenge_ts: "challenge_ts",
      hostname: "hostname",
      success: true
    } as ResponseRecaptcha)
  );

  const apiClientMock = {
    getPaymentInfo: jest.fn(_ => {
      return Promise.resolve(
        right({
          status: 500,
          value: {
            detail: "PAYMENT_ONGOING",
            detail_v2: "PAA_PAGAMENTO_IN_CORSO"
          }
        })
      );
    })
  };

  const handler = handlers.GetPaymentInfoHandler(
    apiClientMock as any,
    "recaptchaSecret"
  );

  const response = await handler(
    context,
    {
      organizationFiscalCode: paymentInfo.organizationFiscalCode,
      paymentNoticeNumber: {
        applicationCode: paymentInfo.applicationCode,
        auxDigit: paymentInfo.auxDigit,
        checkDigit: paymentInfo.checkDigit,
        iuv13: paymentInfo.iuv13
      }
    } as RptIdFromString,
    "recaptchaResponse"
  );

  expect(response.kind).toBe("IResponseErrorValidation");
});

it("should return IResponseErrorInternal response when pagopa proxy return 500 without details", async () => {
  jest.spyOn(handlers, "recaptchaCheckTask").mockReturnValueOnce(
    taskEither.of({
      challenge_ts: "challenge_ts",
      hostname: "hostname",
      success: true
    } as ResponseRecaptcha)
  );

  const apiClientMock = {
    getPaymentInfo: jest.fn(_ => {
      return Promise.resolve(
        right({
          status: 500
        })
      );
    })
  };

  const handler = handlers.GetPaymentInfoHandler(
    apiClientMock as any,
    "recaptchaSecret"
  );

  const response = await handler(
    context,
    {
      organizationFiscalCode: paymentInfo.organizationFiscalCode,
      paymentNoticeNumber: {
        applicationCode: paymentInfo.applicationCode,
        auxDigit: paymentInfo.auxDigit,
        checkDigit: paymentInfo.checkDigit,
        iuv13: paymentInfo.iuv13
      }
    } as RptIdFromString,
    "recaptchaResponse"
  );

  expect(response.kind).toBe("IResponseErrorInternal");
});