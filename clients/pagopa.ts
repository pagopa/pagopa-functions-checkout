import { createClient } from "../generated/pagopa-proxy/client";
import { getConfigOrThrow } from "../utils/config";
import { fetchApi } from "./fetchApi";

const config = getConfigOrThrow();

const prodBaseUrl = config.IO_PAGOPA_PROXY_TEST_BASE_URL; // TODO : DID IT CONFIGURABLE !

export const apiClient = createClient({
  basePath: "",
  baseUrl: prodBaseUrl,
  fetchApi
});

export type IApiClient = typeof apiClient;
