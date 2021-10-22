import { toErrorPagopaProxyResponse } from "../pagopaProxyUtil";
import { ErrorResponses } from "../responses";

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

describe("pagopaProxyUtil", () => {
  it("should return IResponseErrorValidation if detail exists in error response", () => {
    const error: ErrorResponses = toErrorPagopaProxyResponse({
      headers: {},
      status: 500,
      value: {
        detail: "PAYMENT_DUPLICATED",
        detail_v2: "PAA_PAGAMENTO_DUPLICATO"
      }
    });

    expect(error.kind).toBe("IResponseErrorValidation");
  });

  it("should return IResponseErrorInternal if detail does not exists in error response", () => {
    const error: ErrorResponses = toErrorPagopaProxyResponse({
      headers: {},
      status: 500,
      value: {}
    });

    expect(error.kind).toBe("IResponseErrorInternal");
  });

  it("should return IResponseErrorUnauthorized if response status is 401 ", () => {
    const error401: ErrorResponses = toErrorPagopaProxyResponse({
      headers: {},
      status: 401,
      value: {}
    });

    expect(error401.kind).toBe("IResponseErrorUnauthorized");
  });

  it("should return IResponseErrorUnauthorized if response status is 403", () => {
    const error403: ErrorResponses = toErrorPagopaProxyResponse({
      headers: {},
      status: 403,
      value: {}
    });

    expect(error403.kind).toBe("IResponseErrorForbiddenNotAuthorized");
  });

  it("should return ResponseErrorNotFound if response status is 404", () => {
    const error404: ErrorResponses = toErrorPagopaProxyResponse({
      headers: {},
      status: 404,
      value: {}
    });

    expect(error404.kind).toBe("IResponseErrorNotFound");
  });

  it("should return ResponseErrorNotFound if response status is 429", () => {
    const error429: ErrorResponses = toErrorPagopaProxyResponse({
      headers: {},
      status: 429,
      value: {}
    });

    expect(error429.kind).toBe("IResponseErrorTooManyRequests");
  });

  it("should return IResponseErrorInternal if response status is not handle", () => {
    const error503: ErrorResponses = toErrorPagopaProxyResponse({
      headers: {},
      status: 503,
      value: {}
    });

    expect(error503.kind).toBe("IResponseErrorInternal");
  });
});
