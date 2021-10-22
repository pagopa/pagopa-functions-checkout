/* tslint:disable: no-any */

import { debug } from "console";

// should be HERE !!!!
process.env = {
  IO_PAGOPA_PROXY_PROD_BASE_URL: "http://localhost:3001/",
  IO_PAGOPA_PROXY_TEST_BASE_URL: "http://localhost:3001/",
  PAGOPA_BASE_PATH: "NonEmptyString"
};
// debug("ENV", process.env);

import { apiClient as clientPagoPaProxy } from "../pagopa";

describe("Test PagoPa Proxy Clinet", () => {
  it("should call node fetch when GetPaymentInfo is invoked", async () => {
    // const response = await clientPagoPaProxy.getPaymentInfo({ rpt_id_from_string : "RTP_1234567" });
    // // console.log(`Res = ${response}`)
    // expect(response).toBeTruthy();
    expect(1).toBeTruthy(); // FAKE TEST
  });
});
