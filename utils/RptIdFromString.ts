/**
 * Typescript (io-ts) types related to PagoPA.
 */
import {
  OrganizationFiscalCode,
  PatternString
} from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

// MIN_AMOUNT_DIGITS is 2 by specs. We amend this since several QRCodes have been encoded using only 1 digit
// see https://www.pivotaltracker.com/story/show/174004231
export const MIN_AMOUNT_DIGITS = 1;
export const MAX_AMOUNT_DIGITS = 10;
export const CENTS_IN_ONE_EURO = 100;
export const AmountInEuroCents = PatternString(
  `^[0-9]{${MIN_AMOUNT_DIGITS},${MAX_AMOUNT_DIGITS}}$`
);
export type AmountInEuroCents = t.TypeOf<typeof AmountInEuroCents>;

const PAYMENT_NOTICE_NUMBER_LENGTH = 18;
const ORGANIZATION_FISCAL_CODE_LENGTH = 11;

const RPT_ID_LENGTH =
  PAYMENT_NOTICE_NUMBER_LENGTH + ORGANIZATION_FISCAL_CODE_LENGTH;

export type AuxDigit = "0" | "1" | "2" | "3";

export const ApplicationCode = PatternString("[0-9]{2}");
export type ApplicationCode = t.TypeOf<typeof ApplicationCode>;

export const SegregationCode = PatternString("[0-9]{2}");
export type SegregationCode = t.TypeOf<typeof SegregationCode>;

export const IUV13 = PatternString("[0-9]{13}");
export type IUV13 = t.TypeOf<typeof IUV13>;

export const IUV15 = PatternString("[0-9]{15}");
export type IUV15 = t.TypeOf<typeof IUV15>;

export const IUV17 = PatternString("[0-9]{17}");
export type IUV17 = t.TypeOf<typeof IUV17>;

export const IUV = t.union([IUV13, IUV15, IUV17]);
export type IUV = t.TypeOf<typeof IUV>;

export const CheckDigit = PatternString("[0-9]{2}");
export type CheckDigit = t.TypeOf<typeof CheckDigit>;

// PaymentNoticeNumber (NumeroAvviso) may assume one between this 4 shapes:
//
//  | Aux | Application Code | Codice segregazione | IUV | Check digit |
//  |:---:|:----------------:|:-------------------:|:---:|:-----------:|
//  |  0  |         x        |                     |  13 |      x      |
//  |  1  |                  |                     |  17 |             |
//  |  2  |                  |                     |  15 |      x      |
//  |  3  |                  |          x          |  13 |      x      |

// See https://pagopa-specifichepagamenti.readthedocs.io/it/latest/_docs/Capitolo7.html#il-numero-avviso-e-larchivio-dei-pagamenti-in-attesa

export const PaymentNoticeNumber0 = t.interface({
  applicationCode: ApplicationCode,
  auxDigit: t.literal("0"),
  checkDigit: CheckDigit,
  iuv13: IUV13
});
export type PaymentNoticeNumber0 = t.TypeOf<typeof PaymentNoticeNumber0>;

export const PaymentNoticeNumber1 = t.interface({
  auxDigit: t.literal("1"),
  iuv17: IUV17
});
export type PaymentNoticeNumber1 = t.TypeOf<typeof PaymentNoticeNumber1>;

export const PaymentNoticeNumber2 = t.interface({
  auxDigit: t.literal("2"),
  checkDigit: CheckDigit,
  iuv15: IUV15
});
export type PaymentNoticeNumber2 = t.TypeOf<typeof PaymentNoticeNumber2>;

export const PaymentNoticeNumber3 = t.interface({
  auxDigit: t.literal("3"),
  checkDigit: CheckDigit,
  iuv13: IUV13,
  segregationCode: SegregationCode
});
export type PaymentNoticeNumber3 = t.TypeOf<typeof PaymentNoticeNumber3>;

// <aux digit (1n)>[<application code> (2n)]<codice IUV (15|17n)>
export const PaymentNoticeNumber = t.taggedUnion("auxDigit", [
  PaymentNoticeNumber0,
  PaymentNoticeNumber1,
  PaymentNoticeNumber2,
  PaymentNoticeNumber3
]);

export type PaymentNoticeNumber = t.TypeOf<typeof PaymentNoticeNumber>;

/**
 * Private convenience method,
 * use PaymentNoticeNumberFromString.encode() instead.
 */
function paymentNoticeNumberToString(
  paymentNoticeNumber: PaymentNoticeNumber
): string {
  return [
    paymentNoticeNumber.auxDigit,
    paymentNoticeNumber.auxDigit === "0"
      ? paymentNoticeNumber.applicationCode
      : "",
    paymentNoticeNumber.auxDigit === "3"
      ? paymentNoticeNumber.segregationCode
      : "",
    paymentNoticeNumber.auxDigit === "0"
      ? paymentNoticeNumber.iuv13
      : paymentNoticeNumber.auxDigit === "1"
      ? paymentNoticeNumber.iuv17
      : paymentNoticeNumber.auxDigit === "2"
      ? paymentNoticeNumber.iuv15
      : paymentNoticeNumber.auxDigit === "3"
      ? paymentNoticeNumber.iuv13
      : "",
    paymentNoticeNumber.auxDigit !== "1" ? paymentNoticeNumber.checkDigit : ""
  ].join("");
}

/**
 * Decodes a string into a valid PaymentNoticeNumber (NumeroAvviso).
 *
 *    const paymentNotice = PaymentNoticeNumberFromString.decode(
 *      "244012345678901200")
 *
 * will decode a PaymentNoticeNumber (NumeroAvviso) into its parts
 * according to the AuxDigit field value.
 *
 * To convert a PaymentNoticeNumber into a string:
 *
 *    PaymentNoticeNumber.decode({
 *      auxDigit: "2",
 *      checkDigit: "44",
 *      iuv15: "012345678901200"
 *    }).map(PaymentNoticeNumberFromString.encode)
 *
 */
export const PaymentNoticeNumberFromString = new t.Type<
  PaymentNoticeNumber,
  string
>(
  "PaymentNoticeNumberFromString",
  PaymentNoticeNumber.is,
  (v, c) =>
    PaymentNoticeNumber.is(v)
      ? t.success(v)
      : pipe(
          t.string.validate(v, c),
          E.chain(s => {
            if (s.length !== PAYMENT_NOTICE_NUMBER_LENGTH) {
              return t.failure(s, c);
            }
            switch (s[0]) {
              case "0": {
                const [
                  ,
                  auxDigit,
                  applicationCode,
                  iuv13,
                  checkDigit
                ] = (s.match(/^(\d{1})(\d{2})(\d{13})(\d{2})$/) ||
                  []) as ReadonlyArray<string | undefined>;

                return PaymentNoticeNumber0.decode({
                  applicationCode,
                  auxDigit,
                  checkDigit,
                  iuv13
                });
              }
              case "1": {
                // tslint:disable-next-line:no-dead-store
                const [, auxDigit, iuv17, ..._] = (s.match(
                  /^(\d{1})(\d{17})$/
                ) || []) as ReadonlyArray<string | undefined>;
                return PaymentNoticeNumber1.decode({
                  auxDigit,
                  iuv17
                });
              }
              case "2": {
                // tslint:disable-next-line:no-dead-store
                const [, auxDigit, iuv15, checkDigit, ..._] = (s.match(
                  /^(\d{1})(\d{15})(\d{2})$/
                ) || []) as ReadonlyArray<string | undefined>;
                return PaymentNoticeNumber2.decode({
                  auxDigit,
                  checkDigit,
                  iuv15
                });
              }
              case "3": {
                // tslint:disable-next-line:no-dead-store
                const [
                  ,
                  auxDigit,
                  segregationCode,
                  iuv13,
                  checkDigit
                ] = (s.match(/^(\d{1})(\d{2})(\d{13})(\d{2})$/) ||
                  []) as ReadonlyArray<string | undefined>;
                return PaymentNoticeNumber3.decode({
                  auxDigit,
                  checkDigit,
                  iuv13,
                  segregationCode
                });
              }
              default:
                return t.failure(s, c);
            }
          })
        ),
  paymentNoticeNumberToString
);

export type PaymentNoticeNumberFromString = t.TypeOf<
  typeof PaymentNoticeNumberFromString
>;

/**
 * Private convenience method,
 * use RptIdFromString.encode() instead.
 */
function rptIdToString(rptId: RptId): string {
  return [
    rptId.organizationFiscalCode,
    PaymentNoticeNumberFromString.encode(rptId.paymentNoticeNumber)
  ].join("");
}

/**
 * The id used for the PagoPA RPT requests
 */
export const RptId = t.interface({
  organizationFiscalCode: OrganizationFiscalCode,
  paymentNoticeNumber: PaymentNoticeNumberFromString
});
export type RptId = t.TypeOf<typeof RptId>;

export const RptIdFromString = new t.Type<RptId, string>(
  "RptIdFromString",
  RptId.is,
  (v, c) =>
    RptId.is(v)
      ? t.success(v)
      : pipe(
          t.string.validate(v, c),
          E.chain(s => {
            if (s.length !== RPT_ID_LENGTH) {
              return t.failure(s, c);
            }
            const [
              ,
              organizationFiscalCode,
              paymentNoticeNumber,
              // tslint:disable-next-line:no-dead-store
              ..._
            ] = (s.match(/^(\d{11})(\d{18})$/) || []) as ReadonlyArray<
              string | undefined
            >;
            return RptId.decode({
              organizationFiscalCode,
              paymentNoticeNumber
            });
          })
        ),
  rptIdToString
);

export type RptIdFromString = t.TypeOf<typeof RptIdFromString>;
