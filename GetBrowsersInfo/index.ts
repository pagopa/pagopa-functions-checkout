import * as express from "express";
import * as winston from "winston";

import { Context } from "@azure/functions";

import { secureExpressApp } from "io-functions-commons/dist/src/utils/express";
import { AzureContextTransport } from "io-functions-commons/dist/src/utils/logging";
import { setAppContext } from "io-functions-commons/dist/src/utils/middlewares/context_middleware";
import createAzureFunctionHandler from "io-functions-express/dist/src/createAzureFunctionsHandler";
import { BrowserInfoResponse } from "../generated/definitions/BrowserInfoResponse";

// tslint:disable-next-line: no-let
let logger: Context["log"] | undefined;
const contextTransport = new AzureContextTransport(() => logger, {
  level: "debug"
});
winston.add(contextTransport);

// Setup Express
const app = express();

secureExpressApp(app);

app.set("trust proxy", true);

// Add express route
app.get("/api/v1/browsers/current/info", (req, res) => {
  res.set("Content-Type", "application/json");

  const browserInfo = {
    accept: req.get("Accept"),
    ip: req.ip,
    useragent: req.get("User-Agent")
  };
  logger?.info(`X-Forwarded-Host: ${req.get("X-Forwarded-Host")}`);
  logger?.info(`clientIp (req.ip) : ${req.ip}`);
  return BrowserInfoResponse.decode(browserInfo).fold(
    _ => res.sendStatus(400),
    browserInfoResult => res.send(browserInfoResult)
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
