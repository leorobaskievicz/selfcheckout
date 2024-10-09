/**
 * ACTIONS TYPES
 */
export enum CartTypes {
  ADD = '@repositories/ADD',
  DROP = '@repositories/DROP',
  UPDATE = '@repositories/UPDATE',
  CLEAN = '@repositories/CLEAN',
}

export interface ProductType {
  rowid?: string;
  codigo: number;
  nome: string;
  pmc: number;
  preco: number; // Este pr´co pode variar entre pmc, preco, prepro, preco clube, preco kit, preco promocional
  qtd: number;
  foto?: string;
  tipo?: string;
  tipogru?: string;
  grupo?: string;
  ncm?: string;
  icms?: number;
  kitqtd: number;
  kitdsc: number;
  qtdproqt: number;
  descproqt: number;
  vlrproqt: number;
  prevenda: number;
  crm?: string | null;
  dtreceita?: string | null;
  lote?: string | null;
  cdfamil?: number;
  mkt09?: string;
  lojaOrigem?: number;
  vdvd?: string;
  vendedor?: string;
  formaEnt?: string;
}

/**
 * Data types
 */
export interface Cart {
  produtos: Array<ProductType>;
  id?: number;
}

/**
 * State types
 */
export interface CartState {
  readonly data: Cart;
}
