/* tslint:disable: no-any */
import { Context } from "@azure/functions";

import { paymentInfo } from "../../__mocks__/mock";

import { GetActivationStatusHandler } from "../handler";

// should be HERE !!!!
process.env = {
  IO_PAGOPA_PROXY_PROD_BASE_URL: "http://localhost:7071/api/v1",
  IO_PAGOPA_PROXY_TEST_BASE_URL: "http://localhost:7071/api/v1",
  PAGOPA_BASE_PATH: "NonEmptyString",
  IO_PAY_XPAY_REDIRECT: "http://localhost"
};
// debug("ENV", process.env);

import { apiClient } from "../../clients/pagopa";

import { fromEither, fromLeft } from "fp-ts/lib/TaskEither";
import {
  ResponseErrorNotFound,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { left, right } from "fp-ts/lib/Either";

import * as logger from "../../utils/logging";

import { PaymentActivationsGetResponse } from "../../generated/definitions/PaymentActivationsGetResponse";
import { CodiceContestoPagamento } from "../../generated/pagopa-proxy/CodiceContestoPagamento";

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

// const codiceContestoPagamento: string = "P8GWJBJ5JWR";
// const codiceContestoPagamentoWrong: string = "12345678901234567890123456789012";

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
  const apiClientMock = {
    getActivationStatus: jest.fn(_ => {
      return Promise.resolve(
        left({
          status: 400,
          value: {
            type: "example error message"
          }
        })
      );
    })
  };

  const handler = GetActivationStatusHandler(apiClientMock as any);

  const response = await handler(
    context,
    paymentInfo.codiceContestoPagamentoWrong as CodiceContestoPagamento
  );

  expect(response.kind).toBe("IResponseErrorInternal");
});

it("should return a payment info OK response PaymentActivationsGetResponse", async () => {
  const apiClientMock = {
    getActivationStatus: jest.fn(_ => {
      return Promise.resolve(
        right({
          status: 200,
          value: {
            idPagamento: paymentInfo.codiceContestoPagamento
          } as PaymentActivationsGetResponse
        })
      );
    })
  };

  const handler = GetActivationStatusHandler(apiClientMock as any);

  const response = await handler(
    context,
    "12345678901234567890123456789012" as CodiceContestoPagamento
  );

  expect(response.kind).toBe("IResponseSuccessJson");
});
