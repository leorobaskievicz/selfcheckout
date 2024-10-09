import { Reducer } from 'redux';
import { ParamState, ParamTypes } from './types';
// import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';
declare let document: any;

const INITIAL_STATE: ParamState = {
  data: {
    mode: 'dark',
    leitor: '',
    step: 1,
    vendedor: 99,
    cpf: '',
    celular: '',
    nome: '',
    formapg: 0,
    cpfNaNota: true,
    cpfClube: true,
    prevenda: '',
    stepError: false,
    stepErrorMsg: '',
    formapgParcela: 1,
    fgOffline: true,
    produtos: [],
    bufferPrinter: '',
    logVenda: 0,
    fgDaruma: false,
    appConvenio: false,
    appConvenioCodigo: '',
    appConvenioUsuario: '',
    pixTxid: '',
    pixEndtoEnd: '',
    compreRapidoPedido: '',
    exclusaoItemNome: '',
    exclusaoItemCodigo: 0,
    loja: null,
    avaliacao: 0,
    pbm: false,
    pbmTipo: '',
    pbmCupom: '',
    pbmNsu: '',
    pbmNsuAdm: '',
    pbmOperadora: '',
    pbmAutorizacao: '',
    pbmCartao: '',
    pbmSubsidio: '',
    pbmAutorizacaoPg: '',
    pbmValorPg: '',
    pbmDescTotal: '',
    trnCentreAux: [],
    controlE_formaent: '',
    controlE_DtEntrega: '',
    controlE_HrEntrega: '',
  },
};

const reducer: Reducer<ParamState> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ParamTypes.SET_PARAM:
      return { ...state, data: action.payload.data };
    default:
      return state;
  }
};

export default reducer;
