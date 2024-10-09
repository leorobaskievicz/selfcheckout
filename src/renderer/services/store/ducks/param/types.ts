/**
 * ACTIONS TYPES
 */
export enum ParamTypes {
  SET_PARAM = '@param/SET_PARAM',
}

/**
 * Data types
 */
export interface Param {
  mode: string;
  leitor: string;
  step: number;
  vendedor: number;
  cpf: string;
  celular?: string;
  nome?: string;
  formapg: number;
  cpfNaNota: boolean;
  cpfClube: boolean;
  prevenda: string;
  stepError: boolean;
  stepErrorMsg?: string;
  formapgParcela: number;
  fgOffline: boolean;
  produtos: Array<any>;
  bufferPrinter?: any;
  logVenda: number;
  fgDaruma: boolean;
  appConvenio: boolean;
  appConvenioCodigo: string;
  appConvenioUsuario: string;
  cartaoNome: string;
  cartaoRota: string;
  cartaoNsu: string;
  cartaoAutorizacao: string;
  pixTxid: string;
  pixEndtoEnd: string;
  compreRapidoPedido: string;
  exclusaoItemNome: string;
  exclusaoItemCodigo: number;
  loja: any;
  avaliacao?: number;
  pbm: boolean;
  pbmTipo?: string;
  pbmCupom?: string;
  pbmNsu?: string;
  pbmNsuAdm?: string;
  pbmOperadora?: string;
  pbmAutorizacao?: string;
  pbmCartao?: string;
  pbmSubsidio?: string;
  pbmAutorizacaoPg?: string;
  pbmValorPg?: string;
  pbmDescTotal?: string;
  trnCentreAux?: any;
  controlE_formaent?: string;
  controlE_DtEntrega?: any;
  controlE_HrEntrega?: any;
}

/**
 * State types
 */
export interface ParamState {
  readonly data: Param;
}
