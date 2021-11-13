/* tslint:disable: no-any */
import { Context } from "@azure/functions";

import { paymentInfo } from "../../__mocks__/mock";

process.env = {
  IO_PAGOPA_PROXY: "http://localhost:1234/api/v1",
  IO_PAY_CHALLENGE_RESUME_URL: "http://localhost:1235",
  IO_PAY_ORIGIN: "http://localhost:1234",
  IO_PAY_XPAY_REDIRECT: "http://localhost:1234",
  PAGOPA_BASE_PATH: "/",
  PAY_PORTAL_RECAPTCHA_SECRET: "SECRET"
};

import { apiClient } from "../../clients/pagopa";

import * as logger from "../../utils/logging";

import { RptIdFromString } from "italia-pagopa-commons/lib/pagopa";

import * as handlers from "../handler";

import { taskEither } from "fp-ts/lib/TaskEither";
import { ResponseRecaptcha } from "../handler";

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
  logInfo: jest.fn(),
  logUnknown: jest.fn(),
  logWarning: jest.fn()
});

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

it("should return a payment info", async () => {
  jest.spyOn(handlers, "recaptchaCheckTask").mockReturnValueOnce(
    taskEither.of({
      challenge_ts: "challenge_ts",
      hostname: "hostname",
      success: true
    } as ResponseRecaptcha)
  );

  const handler = handlers.GetPaymentInfoHandler(apiClient, "recaptchaSecret");

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

  expect(response.kind).toBe("IResponseSuccessJson");
});
