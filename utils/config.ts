/**
 * Config module
 *
 * Single point of access for the application configuration. Handles validation on required environment variables.
 * The configuration is evaluate eagerly at the first access to the module. The module exposes convenient methods to access such value.
 */

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import * as E from "fp-ts/lib/Either";

import * as t from "io-ts";

import { readableReport } from "@pagopa/ts-commons/lib/reporters";

import { pipe } from "fp-ts/lib/function";

// global app configuration
export const IConfigR = t.interface({
  IO_PAGOPA_PROXY: NonEmptyString,
  IO_PAY_CHALLENGE_RESUME_URL: NonEmptyString,
  IO_PAY_ORIGIN: NonEmptyString,
  IO_PAY_XPAY_REDIRECT: NonEmptyString,
  PAGOPA_BASE_PATH: NonEmptyString,
  PAY_PORTAL_RECAPTCHA_SECRET: NonEmptyString
});

export const IConfigO = t.partial({
  TEST_APPLICATION_CODE: t.string,
  TEST_AUX_DIGIT: t.string,
  TEST_CHECK_DIGIT: t.string,
  TEST_IUV13: t.string,
  TEST_ORGANIZATION_FISCAL_CODE: t.string
});

export const IConfig = t.intersection([IConfigR, IConfigO], "IConfig");

export type IConfig = t.TypeOf<typeof IConfig>;

// No need to re-evaluate this object for each call
const errorOrConfig: t.Validation<IConfig> = IConfig.decode({
  ...process.env
});

/**
 * Read the application configuration and check for invalid values.
 * Configuration is eagerly evalued when the application starts.
 *
 * @returns either the configuration values or a list of validation errors
 */
export function getConfig(): t.Validation<IConfig> {
  return errorOrConfig;
}

/**
 * Read the application configuration and check for invalid values.
 * If the application is not valid, raises an exception.
 *
 * @returns the configuration values
 * @throws validation errors found while parsing the application configuration
 */
export function getConfigOrThrow(): IConfig {
  return pipe(
    errorOrConfig,
    E.getOrElse(errors => {
      throw new Error(`Invalid configuration: ${readableReport(errors)}`);
    })
  );
}
