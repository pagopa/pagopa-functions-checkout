import * as express from "express";
import * as winston from "winston";

import { Context } from "@azure/functions";

import createAzureFunctionHandler from "@pagopa/express-azure-functions/dist/src/createAzureFunctionsHandler";
import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { AzureContextTransport } from "@pagopa/io-functions-commons/dist/src/utils/logging";
import { setAppContext } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { getConfigOrThrow } from "../utils/config";

const config = getConfigOrThrow();

// tslint:disable-next-line: no-let
let logger: Context["log"] | undefined;
const contextTransport = new AzureContextTransport(() => logger, {
  level: "debug"
});
winston.add(contextTransport);

// Setup Express
const app = express();

secureExpressApp(app);

// Add express route
app.get("/api/v1/transactions/xpay/verification/:id", (req, res) => {
  res.set("Content-Type", "text/html");
  const i = req.originalUrl.indexOf("?");
  const queryParams = req.originalUrl.slice(i + 1);

  res.redirect(
    `${config.IO_PAY_XPAY_REDIRECT}?` +
      queryParams
        .replace("_id_", req.params.id)
        .replace("_resumeType_", "xpayVerification")
        .replace("_queryParams_", queryParams)
  );
});

const azureFunctionHandler = createAzureFunctionHandler(app);

// Binds the express app to an Azure Function handler
function httpStart(context: Context): void {
  logger = context.log;
  setAppContext(app, context);
  azureFunctionHandler(context);
}

export default httpStart;
