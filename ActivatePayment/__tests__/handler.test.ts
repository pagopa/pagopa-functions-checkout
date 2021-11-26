/* tslint:disable */
import { Context } from "@azure/functions";
import { right } from "fp-ts/lib/Either";

import { ActivatePaymentHandler } from "../handler";

import {
  invalidPaymentActivationsRequest,
  validPaymentActivationsRequest
} from "../../__mocks__/mock";
import { IConfig } from "../../utils/config";

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

const config = {
  PAGOPA_BASE_PATH: "NonEmptyString",
  IO_PAY_XPAY_REDIRECT: "http://localhost",
  IO_PAY_CHALLENGE_RESUME_URL: "NonEmptyString",
  IO_PAY_ORIGIN: "NonEmptyString",
  PAY_PORTAL_RECAPTCHA_SECRET: "NonEmptyString",
  IO_PAGOPA_PROXY: "NonEmptyString"
} as IConfig;

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

it("should return a PaymentActivationsPostResponse if the activation is successful", async () => {
  const apiClientMock = {
    activatePayment: jest.fn(_ => {
      return Promise.resolve(
        right({
          status: 200,
          value: {
            causaleVersamento: "Retta asilo [demo]",
            codiceContestoPagamento: "6f69d150541e11ebb70c7b05c53756dd",
            enteBeneficiario: {
              denominazioneBeneficiario: "Comune di Milano",
              identificativoUnivocoBeneficiario: "01199250158"
            },
            ibanAccredito: "IT21Q0760101600000000546200",
            importoSingoloVersamento: 1100
          }
        })
      );
    })
  };

  const handler = ActivatePaymentHandler(apiClientMock as any, config);

  const response = await handler(context, validPaymentActivationsRequest);

  expect(response.kind).toBe("IResponseSuccessJson");
});

it("should return a payment KO response if the activation is not successful", async () => {
  const apiClientMock = {
    activatePayment: jest.fn(_ => {
      return Promise.resolve(
        right({
          status: 500
        })
      );
    })
  };

  const handler = ActivatePaymentHandler(apiClientMock as any, config);

  const response = await handler(context, invalidPaymentActivationsRequest);

  expect(response.kind).toBe("IResponseErrorInternal");
});
