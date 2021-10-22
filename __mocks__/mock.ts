import { PaymentActivationsPostRequest } from "../generated/pagopa-proxy/PaymentActivationsPostRequest";

export const paymentInfo = {
  iuv13: "1234567890123",
  iuv15: "123456789012345",
  iuv17: "12345678901234567",
  checkDigit: "12",
  segregationCode: "12",
  applicationCode: "12",
  organizationFiscalCode: "12345678901",
  auxDigit: "0",
  importoSingoloVersamento: 100,
  codiceContestoPagamento: "5ae4e3a051c111ebb015abe7e7394a7d",
  ibanAccredito: "IT47L0300203280645139156879",
  causaleVersamento: "Causale versamento mock",
  codiceContestoPagamentoWrong: "12345678901234567890123456789012",
  messageReceivedNOK: "example error message"
};

export const validPaymentActivationsRequest = {
  codiceContestoPagamento: "6f69d150541e11ebb70c7b05c53756dd",
  importoSingoloVersamento: 1100,
  rptId: "01199250158002720356519484501"
} as PaymentActivationsPostRequest;

export const invalidPaymentActivationsRequest = {
  importoSingoloVersamento: 1100
} as PaymentActivationsPostRequest;
