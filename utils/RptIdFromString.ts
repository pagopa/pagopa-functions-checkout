import { IPatternStringTag } from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

export declare const RptId: t.TypeC<{
  organizationFiscalCode: t.Type<
    // tslint:disable-next-line:no-duplicate-string
    string & IPatternStringTag<"^[0-9]{11}$">,
    string & IPatternStringTag<"^[0-9]{11}$">,
    unknown
  >;
  paymentNoticeNumber: t.Type<
    // tslint:disable-next-line:max-union-size
    | {
        applicationCode: string & IPatternStringTag<"[0-9]{2}">;
        auxDigit: "0";
        checkDigit: string & IPatternStringTag<"[0-9]{2}">;
        iuv13: string & IPatternStringTag<"[0-9]{13}">;
      }
    | {
        auxDigit: "1";
        iuv17: string & IPatternStringTag<"[0-9]{17}">;
      }
    | {
        auxDigit: "2";
        checkDigit: string & IPatternStringTag<"[0-9]{2}">;
        iuv15: string & IPatternStringTag<"[0-9]{15}">;
      }
    | {
        auxDigit: "3";
        checkDigit: string & IPatternStringTag<"[0-9]{2}">;
        iuv13: string & IPatternStringTag<"[0-9]{13}">;
        segregationCode: string & IPatternStringTag<"[0-9]{2}">;
      },
    string,
    unknown
  >;
}>;
export declare type RptId = t.TypeOf<typeof RptId>;
export declare const RptIdFromString: t.Type<
  {
    organizationFiscalCode: string & IPatternStringTag<"^[0-9]{11}$">;
    paymentNoticeNumber: // tslint:disable-next-line:max-union-size
    | {
          applicationCode: string & IPatternStringTag<"[0-9]{2}">;
          auxDigit: "0";
          checkDigit: string & IPatternStringTag<"[0-9]{2}">;
          iuv13: string & IPatternStringTag<"[0-9]{13}">;
        }
      | {
          auxDigit: "1";
          iuv17: string & IPatternStringTag<"[0-9]{17}">;
        }
      | {
          auxDigit: "2";
          checkDigit: string & IPatternStringTag<"[0-9]{2}">;
          iuv15: string & IPatternStringTag<"[0-9]{15}">;
        }
      | {
          auxDigit: "3";
          checkDigit: string & IPatternStringTag<"[0-9]{2}">;
          iuv13: string & IPatternStringTag<"[0-9]{13}">;
          segregationCode: string & IPatternStringTag<"[0-9]{2}">;
        };
  },
  string,
  unknown
>;
export declare type RptIdFromString = t.TypeOf<typeof RptIdFromString>;
