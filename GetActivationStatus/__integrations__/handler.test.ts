/* tslint:disable */
import { Context } from "@azure/functions";

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

import * as handlers from "../handler";

import { CodiceContestoPagamento } from "../../generated/definitions/CodiceContestoPagamento";

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

it("should return a payment info after activation", async () => {
  const handler = handlers.GetActivationStatusHandler(apiClient);

  const response = await handler(
    context,
    "6f69d150541e11ebb70c7b05c53756dd" as CodiceContestoPagamento
  );

  expect(response.kind).toBe("IResponseSuccessJson");
});
