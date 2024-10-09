import { Reducer } from 'redux';
import { v4 as uuidv4 } from 'uuid';
import { CartState, CartTypes, ProductType } from './types';

const INITIAL_STATE: CartState = {
  data: {
    produtos: [],
    id: -1,
  },
};

const reducer: Reducer<any> = (state = INITIAL_STATE, action) => {
  const total = 0;

  switch (action.type) {
    // FUNCAO PARA ADICIONAR PRODUTO NO CARRINHO
    case CartTypes.ADD:
      let tmp = state.data.produtos;
      let achou = false;

      for (let i = 0; i < tmp.length && !achou; i++) {
        if (
          tmp[i].codigo === action.payload.data.codigo &&
          Number(tmp[i].lojaOrigem) === Number(action.payload.data.lojaOrigem) &&
          !tmp[i].pbmAutorizacao
        ) {
          achou = true;

          if (tmp[i].qtd + parseInt(action.payload.data.qtd, 10) <= tmp[i].estoque) tmp[i].qtd += parseInt(action.payload.data.qtd, 10);

          tmp[i].preco = action.payload.data.preco;

          const tmpProdu = tmp[i];

          tmp.splice(i, 1);
          tmp = [tmpProdu, ...tmp];
        }
      }

      if (achou === false) tmp = [{ ...action.payload.data, rowid: uuidv4() }, ...tmp];

      // VERIFICA QTDPROQT FAMILIA PARA CORRIGIR PRECOS
      for (let i = 0; i < tmp.length; i++) {
        let qtdFamil = 0;

        if (Number(tmp[i].cdfamil) > 0) {
          for (let j = 0; j < tmp.length; j++) {
            if (Number(tmp[j].cdfamil) > 0 && Number(tmp[i].cdfamil) === Number(tmp[j].cdfamil)) {
              qtdFamil += Number(tmp[j].qtd);
            }
          }
        }

        if (qtdFamil > 0) {
          if (tmp[i].qtdproqt > 0 && Number(tmp[i].qtdproqt) <= Number(qtdFamil)) {
            if (tmp[i].descproqt > 0) {
              const auxPreco = tmp[i].pmc - tmp[i].pmc * (tmp[i].descproqt / 100);

              if (tmp[i].preco <= 0 || tmp[i].preco > auxPreco) {
                tmp[i].preco = auxPreco;
              }
            } else if (tmp[i].vlrproqt > 0) {
              const auxPreco = tmp[i].vlrproqt;

              if (tmp[i].preco <= 0 || tmp[i].preco > auxPreco) {
                tmp[i].preco = auxPreco;
              }
            }
          }
        }
      }

      return {
        ...state,
        data: { produtos: tmp },
      };

    // FUNCAO PARA APAGAR PRODUTO NO CARRINHO
    case CartTypes.DROP:
      const { produtos } = state.data;
      const tmpDrop: Array<ProductType> = [];
      let tmpProdu: ProductType | any = null;

      for (let i = 0; i < produtos.length; i++) {
        if (produtos[i].rowid === action.payload.rowid) {
          tmpProdu = produtos[i];
        } else {
          tmpDrop.push(produtos[i]);
        }
      }

      if (!tmpProdu) {
        return false;
      }

      return {
        ...state,
        data: { produtos: tmpDrop },
      };

    // FUNCAO PARA APAGAR PRODUTO NO CARRINHO
    case CartTypes.UPDATE:
      let produtosEdit = state.data.produtos;

      for (let i = 0; i < produtosEdit.length; i++) {
        if (produtosEdit[i].rowid === action.payload.data.rowid) {
          produtosEdit[i] = { ...produtosEdit[i], ...action.payload.data };

          const tmpProduEdit = produtosEdit[i];

          produtosEdit.splice(i, 1);
          produtosEdit = [tmpProduEdit, ...produtosEdit];

          break;
        }
      }

      // VERIFICA QTDPROQT FAMILIA PARA CORRIGIR PRECOS
      for (let i = 0; i < produtosEdit.length; i++) {
        let qtdFamil = 0;

        if (Number(produtosEdit[i].cdfamil) > 0) {
          for (let j = 0; j < produtosEdit.length; j++) {
            if (Number(produtosEdit[j].cdfamil) > 0 && Number(produtosEdit[i].cdfamil) === Number(produtosEdit[j].cdfamil)) {
              qtdFamil += Number(produtosEdit[j].qtd);
            }
          }
        }

        if (qtdFamil > 0) {
          if (produtosEdit[i].qtdproqt > 0 && Number(produtosEdit[i].qtdproqt) <= Number(qtdFamil)) {
            if (produtosEdit[i].descproqt > 0) {
              const auxPreco = produtosEdit[i].pmc - produtosEdit[i].pmc * (produtosEdit[i].descproqt / 100);

              if (produtosEdit[i].preco <= 0 || produtosEdit[i].preco > auxPreco) {
                produtosEdit[i].preco = auxPreco;
              }
            } else if (produtosEdit[i].vlrproqt > 0) {
              const auxPreco = produtosEdit[i].vlrproqt;

              if (produtosEdit[i].preco <= 0 || produtosEdit[i].preco > auxPreco) {
                produtosEdit[i].preco = auxPreco;
              }
            }
          }
        }
      }

      return {
        ...state,
        data: { produtos: produtosEdit },
      };

    // LIMPA CARRINHO
    case CartTypes.CLEAN:
      return {
        ...state,
        data: { produtos: [] },
      };

    default:
      return state;
  }
};

export default reducer;
