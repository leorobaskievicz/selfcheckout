import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { ApplicationState } from '../../services/store';
import { Param } from '../../services/store/ducks/param/types';
import * as ParamActions from '../../services/store/ducks/param/actions';
import { Cart, ProductType } from '../../services/store/ducks/cart/types';
import * as CartActions from '../../services/store/ducks/cart/actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBasketShopping } from '@fortawesome/free-solid-svg-icons';
import SeloClubeCallFarmaNovo from '../Selos/SeloClubeCallFarmaNovo';
import SeloDermoNovo from '../Selos/SeloDermoNovo';
import SeloUnidades from '../Selos/SeloUnidades';
import { Diversos } from '../../services/diversos';
import './index.scss';

interface StateProps {
  param: Param;
  cart: Cart;
}

interface DispatchProps {
  setParam(param: Param): void;
  add(produ: ProductType): void;
}

interface OwnProps {
  adminh: any;
  db: any;
  item: any;
}

type Props = StateProps & DispatchProps & OwnProps;

interface MyStateProps {
  produto: any;
  desconto: number;
  precoClube: number;
  precoKitLeveMais: number;
  prepro: number;
  precoKitRemedio: number;
  temVdvd: boolean;
}

class CardProduto extends React.Component<Props> {
  state: MyStateProps = {};

  constructor(props) {
    super(props);

    this.state = {
      produto: props.item,
      desconto: 0,
      precoClube:
        props.item.PRECOCLUBE > 0 &&
        moment(props.item.INIPRECOCLUBE).format('YYYYMMDD') <= moment().format('YYYYMMDD') &&
        moment(props.item.FIMPRECOCLUBE).format('YYYYMMDD') >= moment().format('YYYYMMDD')
          ? props.item.PRECOCLUBE
          : 0.0,
      precoKitLeveMais:
        props.item.VLRPROQT > 0 &&
        moment(props.item.INIPRECOCLUBE).format('YYYYMMDD') <= moment().format('YYYYMMDD') &&
        moment(props.item.FIMPRECOCLUBE).format('YYYYMMDD') >= moment().format('YYYYMMDD')
          ? props.item.VLRPROQT
          : props.item.PRECO - props.item.PRECO * (props.item.DESCPROQT / 100),
      prepro: props.item.PREPRO > 0 && props.item.PREPRO < props.item.PRECO ? props.item.PREPRO : props.item.PRECO,
      precoKitRemedio:
        props.item.KITQTD > 0 && props.item.KITDSC > 0 ? props.item.PRECO - props.item.PRECO * (props.item.KITDSC / 100) : 0.0,
      temVdvd: props.item.VDVD === 'S' && props.item.vdvdEstoque && props.item.vdvdEstoque.length > 0,
    };
  }

  componentDidMount(): void {
    if (this.state.produto.VLRPROQT > 0) {
      if (
        moment(this.state.produto.INIPRECOCLUBE, 'YYYY-MM-DD HH:mm:ss').format('YYYYMMDD') > moment().format('YYYYMMDD') ||
        moment(this.state.produto.FIMPRECOCLUBE, 'YYYY-MM-DD HH:mm:ss').format('YYYYMMDD') < moment().format('YYYYMMDD')
      ) {
        this.setState({
          produto: {
            ...this.props.produto,
            VLRPROQT: 0,
          },
        });
      }
    }

    let auxDesconto = 0;
    let menorPreco = this.state.produto.PRECO;

    if (this.state.produto.precoClube > 0 && menorPreco > this.state.produto.precoClube) {
      menorPreco = this.state.produto.precoClube;
    }

    if (this.state.produto.precoKitLeveMais > 0 && menorPreco > this.state.produto.precoKitLeveMais) {
      menorPreco = this.state.produto.precoKitLeveMais;
    }

    if (this.state.produto.precoKitRemedio > 0 && menorPreco > this.state.produto.precoKitRemedio) {
      menorPreco = this.state.produto.precoKitRemedio;
    }

    if (this.state.produto.prepro > 0 && menorPreco > this.state.produto.prepro) {
      menorPreco = this.state.produto.prepro;
    }

    if (menorPreco < this.state.produto.PRECO) {
      auxDesconto = Number(100) - (Number(menorPreco) / Number(this.state.produto.PRECO)) * Number(100);
    }

    if (auxDesconto > 0 && auxDesconto < 100) {
      this.setState({
        desconto: Math.trunc(auxDesconto),
      });
    }
  }

  componentWillUnmount(): void {}

  async handleAddCart(produ) {
    let precoOriginal = produ.PRECO;

    if (
      // [14].includes(parseInt(produ.GRUPO)) &&
      produ.PREPRO < produ.PRECO &&
      produ.PREPRO > 0
    ) {
      precoOriginal = produ.PREPRO;
    }

    this.props.add({
      codigo: produ.CODIGO,
      nome: produ.NOMEFINAL ? produ.NOMEFINAL : produ.NOME,
      pmc: produ.PRECO,
      preco: produ.PREPRO,
      qtd: 1,
      foto: produ.PATH,
      icms: produ.ICMS,
      ncm: produ.NCM,
      tipo: produ.TIPO,
      tipogru: produ.TIPOGRU,
      grupo: produ.GRUPO,
      kitqtd: produ.KITQTD,
      kitdsc: produ.KITDSC,
      qtdproqt: produ.QTDPROQT,
      descproqt: produ.DESCPROQT,
      vlrproqt: produ.VLRPROQT,
      prevenda: 0,
      crm: '',
      dtreceita: '',
      lote: '',
      cdfamil: produ.CDFAMIL,
      mkt09: produ.MKT09,
      lojaOrigem: 13,
      vdvd: 'N',
      vendedor: '',
      formaEnt: '',
    });

    this.props.setParam({
      ...this.props.param,
      controlE_DtEntrega: moment().utcOffset('-03:00').add(10, 'days').format('DD/MM/YYYY'),
      controlE_HrEntrega: '19:00:00',
      controlE_formaent: 'c',
    });

    let precoFinal = produ.PRECO;

    if (
      Number(produ.PREPRO) > 0 &&
      Number(produ.PREPRO) < Number(produ.PRECO) &&
      moment(produ.INIPRO, 'YYYY-MM-DD HH:mm:ss').isValid() &&
      moment(produ.INIPRO, 'YYYY-MM-DD HH:mm:ss').isSameOrBefore(moment().utcOffset('-03:00')) &&
      moment(produ.FIMPRO, 'YYYY-MM-DD HH:mm:ss').isValid() &&
      moment(produ.FIMPRO, 'YYYY-MM-DD HH:mm:ss').isSameOrAfter(moment().utcOffset('-03:00'))
    ) {
      precoFinal = produ.PREPRO;
    }
  }

  checkAdded() {
    let total = 0;
    let achou = false;

    if (!this.state.produto || !this.state.produto.CODIGO) return total;

    for (let i = 0; i < this.props.cart.produtos.length && !achou; i++) {
      if (this.props.cart.produtos[i].codigo === this.state.produto.CODIGO) {
        total += this.props.cart.produtos[i].qtd;
        achou = true;
      }
    }

    return total;
  }

  getMenorPreco() {
    let menorPreco = Number.MAX_SAFE_INTEGER;

    if (
      menorPreco > this.state.produto.PRECO &&
      this.state.produto.VDVD === 'S' &&
      this.state.produto.vdvdEstoque &&
      this.state.produto.vdvdEstoque.length > 0
    ) {
      menorPreco = this.state.produto.PRECO;
    }

    if (menorPreco > this.state.produto.PREPRO && this.state.produto.PREPRO > 0 && this.state.produto.PREPRO < this.state.produto.PRECO) {
      menorPreco = this.state.produto.PREPRO;
    }

    let auxPreco = this.state.produto.PRECO - this.state.produto.PRECO * (this.state.produto.KITDSC / 100);

    if (
      menorPreco > auxPreco &&
      this.state.produto.VDVD !== 'S' &&
      Number(this.state.produto.KITQTD) > Number(0) &&
      Number(this.state.produto.KITDSC) > Number(0)
    ) {
      menorPreco = auxPreco;
    }

    if (
      this.state.produto.VDVD !== 'S' &&
      this.state.produto.QTDPROQT > 0 &&
      (this.state.produto.VLRPROQT > 0 || this.state.produto.DESCPROQT > 0)
    ) {
      if (menorPreco > this.state.produto.VLRPROQT && this.state.produto.VLRPROQT > 0) {
        menorPreco = this.state.produto.VLRPROQT;
      } else {
        auxPreco = this.state.produto.PRECO - this.state.produto.PRECO * (this.state.produto.DESCPROQT / 100);

        if (menorPreco > auxPreco) {
          menorPreco = this.state.produto.PRECO - this.state.produto.PRECO * (this.state.produto.DESCPROQT / 100);
        }
      }
    }

    if (
      menorPreco > this.state.produto.PRECOCLUBE &&
      this.state.produto.VDVD !== 'S' &&
      this.state.produto.PRECOCLUBE &&
      this.state.produto.PRECOCLUBE > 0 &&
      moment(this.state.produto.INIPRECOCLUBE).format('YYYYMMDD') <= moment().format('YYYYMMDD') &&
      moment(this.state.produto.FIMPRECOCLUBE).format('YYYYMMDD') >= moment().format('YYYYMMDD') &&
      (this.state.produto.PREPRO <= 0 || this.state.produto.PREPRO > this.state.produto.PRECOCLUBE) &&
      this.state.produto.CDTIPO !== 5
    ) {
      menorPreco = this.state.produto.PRECOCLUBE;
    }

    if (
      menorPreco > this.state.produto.PRECOCLUBE &&
      this.state.produto.VDVD !== 'S' &&
      this.state.produto.PRECOCLUBE &&
      this.state.produto.PRECOCLUBE > 0 &&
      moment(this.state.produto.INIPRECOCLUBE).format('YYYYMMDD') <= moment().format('YYYYMMDD') &&
      moment(this.state.produto.FIMPRECOCLUBE).format('YYYYMMDD') >= moment().format('YYYYMMDD') &&
      (this.state.produto.PREPRO <= 0 || this.state.produto.PREPRO > this.state.produto.PRECOCLUBE) &&
      this.state.produto.CDTIPO === 5
    ) {
      menorPreco = this.state.produto.PRECOCLUBE;
    }

    return menorPreco;
  }

  render() {
    const qtdCesta = this.checkAdded();
    return (
      <>
        <a href="#" target="_self" className={`box-produto ${qtdCesta > 0 ? 'has-product-cart' : ''}`}>
          {this.state.desconto > 0 && ![14].includes(parseInt(this.state.produto.GRUPO)) && (
            <div className="card-produto-selo-desconto">
              <i className="fas fa-arrow-down mr-1"></i>
              {this.state.desconto}%
            </div>
          )}

          <div className="card-header">
            {qtdCesta > 0 && (
              <span
                className="selo-qtd-cesta"
                onClick={(event) => {
                  event.preventDefault();
                  if (
                    (this.state.produto.ESTOQUE > 1 && this.state.produto.CDTIPO > 3) ||
                    (this.state.produto.ESTOQUE > 0 && this.state.produto.CDTIPO <= 3)
                  )
                    this.handleAddCart(this.state.produto);
                }}
              >
                {qtdCesta}
                <FontAwesomeIcon fontSize={14} color="#f2af47" icon={faBasketShopping} />
              </span>
            )}
            <p className="id"></p>

            {/* {navigator.share && (
              <i
                className="fas fa-share-alt share"
                onClick={(event) => share(event)}
              ></i>
            )} */}
          </div>
          {this.state.temVdvd ? (
            this.state.produto.vdvdEstoque && this.state.produto.vdvdEstoque[0] && this.state.produto.vdvdEstoque[0].sceforne ? (
              <small className="temVdvdHelperText">
                Prazo de entrega +
                {this.state.produto.vdvdEstoque[0].sceforne.PRAENT <= 0 ? '2' : this.state.produto.vdvdEstoque[0].sceforne.PRAENT} dias
                úteis
              </small>
            ) : (
              <small className="temVdvdHelperText">Prazo de entrega +2 dias úteis</small>
            )
          ) : null}
          <div className="img-area">
            <img
              className="produto-solo"
              alt="Imagem do Produto sozinho"
              src={!this.state.produto.PATHTHUMBNAIL ? this.state.produto.PATH : this.state.produto.PATHTHUMBNAIL}
              onClick={() => null}
              style={{
                width: 240,
                height: 240,
              }}
            />

            {this.state.produto.LINKPBM ? (
              <div className="selo-desclab">
                <p>+ Desconto do laboratório</p>
              </div>
            ) : this.state.temVdvd ? (
              <div className="selo-desclab">
                <i className="fas fa-handshake mr-1" style={{ fontSize: 10 }}></i>
                <p style={{ fontSize: 10 }}>Venda via centro de distribuição</p>
              </div>
            ) : (
              <></>
            )}
          </div>
          <p className="nome">{this.state.produto.NOMEFINAL.toLowerCase()}</p>
          <div className="info-area">
            {this.state.temVdvd || this.getMenorPreco() >= this.state.produto.PRECO ? (
              <div className="valor-area">
                <p className="txt-preco">R${Diversos.getInteiro(this.state.produto.PRECO)}</p>
                <div className="valor">
                  <p className="valor-menor bottom">,{Diversos.getDecimal(this.state.produto.PRECO)}</p>
                  <p className="valor-menor">cada</p>
                </div>
              </div>
            ) : (
              <>
                {this.getMenorPreco() === this.state.prepro &&
                  this.state.produto.PRECO &&
                  this.state.produto.PRECO > this.state.prepro &&
                  ![14].includes(parseInt(this.state.produto.GRUPO)) && (
                    <>
                      <div className="de-por">
                        <p className="info-card-prod">De</p>
                        <p className="valor-de amarelo">R$ {Diversos.number_format(this.state.produto.PRECO, 2, ',', '')} </p>
                        <p className="info-card-prod">por</p>
                      </div>
                    </>
                  )}

                {Number(this.state.produto.TIPOPBM) > 0 &&
                Number(this.state.produto.PRECOPBM) > 0 &&
                Number(this.state.produto.PRECOPBM) < this.state.prepro &&
                this.state.prepro > 0 ? (
                  <div className="valor-area valor-area-pbm">
                    <p>
                      até R$ {Diversos.maskPreco(this.state.produto.PRECOPBM)}
                      <br />
                      <small>no desconto do laboratório</small>
                    </p>
                  </div>
                ) : this.state.produto.CDTIPO !== 5 ? (
                  <div className="valor-area">
                    <p className="txt-preco">R${Diversos.getInteiro(this.state.prepro)}</p>
                    <div className="valor">
                      <p className="valor-menor bottom">,{Diversos.getDecimal(this.state.prepro)}</p>
                      <p className="valor-menor">cada</p>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
          {this.getMenorPreco() === this.state.precoKitRemedio &&
          this.state.produto.KITQTD &&
          this.state.produto.KITQTD > 0 &&
          this.state.produto.KITDSC &&
          this.state.produto.KITDSC > 0 &&
          this.state.precoKitRemedio < this.state.prepro ? (
            <>
              <div className="selo-unidades">
                <SeloUnidades
                  qtd={this.state.produto.KITQTD}
                  preco={Diversos.getInteiro(this.state.precoKitRemedio)}
                  decimal={Diversos.getDecimal(this.state.precoKitRemedio)}
                />
              </div>
            </>
          ) : this.state.produto.QTDPROQT &&
            this.getMenorPreco() === this.state.precoKitLeveMais &&
            this.state.produto.ESTOQUE > this.state.produto.QTDPROQT &&
            this.state.produto.QTDPROQT > 0 &&
            this.state.precoKitLeveMais &&
            this.state.precoKitLeveMais > 0 &&
            this.state.precoKitLeveMais < this.state.prepro ? (
            <div className="selo-unidades">
              <SeloUnidades
                qtd={this.state.produto.QTDPROQT}
                preco={Diversos.getInteiro(this.state.precoKitLeveMais)}
                decimal={Diversos.getDecimal(this.state.precoKitLeveMais)}
              />
            </div>
          ) : this.getMenorPreco() === this.state.precoClube &&
            this.state.precoClube &&
            this.state.precoClube > 0 &&
            (this.state.prepro <= 0 || this.state.prepro > this.state.precoClube) &&
            this.state.produto.CDTIPO !== 5 ? (
            <div className="promo-area selo-clube-promo-area">
              <SeloClubeCallFarmaNovo
                preco={Diversos.getInteiro(this.state.precoClube)}
                decimal={Diversos.getDecimal(this.state.precoClube)}
              />
            </div>
          ) : this.getMenorPreco() === this.state.precoClube &&
            this.state.precoClube &&
            this.state.precoClube > 0 &&
            (this.state.prepro <= 0 || this.state.prepro > this.state.precoClube) &&
            this.state.produto.CDTIPO === 5 ? (
            <div className="promo-area selo-clube-promo-area">
              <SeloDermoNovo preco={Diversos.getInteiro(this.state.precoClube)} decimal={Diversos.getDecimal(this.state.precoClube)} />
            </div>
          ) : this.getMenorPreco() === this.state.prepro &&
            this.state.prepro &&
            this.state.prepro > 0 &&
            this.state.prepro < this.state.produto.PRECO &&
            this.state.produto.CDTIPO === 5 ? (
            <div className="promo-area selo-clube-promo-area">
              <SeloDermoNovo preco={Diversos.getInteiro(this.state.prepro)} decimal={Diversos.getDecimal(this.state.prepro)} />
            </div>
          ) : (
            <></>
          )}

          {this.state.produto && this.state.produto.FGCONTROL && this.state.produto.FGCONTROL.toLowerCase() === 's' && (
            <span className="text-danger" style={{ fontSize: 12 }}>
              <i className="fas fa-exclamation-triangle mr-1" style={{ fontSize: 12 }}></i>
              Obrigatório retenção de receita
            </span>
          )}

          {this.state.produto.GRUPO === 17 ? (
            <a
              href={`/produto/${this.state.produto.CODIGO}-${Diversos.toSeoUrl(this.state.produto.NOMEFINAL)}`}
              target="_self"
              className="btn-cart btn-cart-indisponivel"
            >
              <p className="indisponivel">Saiba mais</p>
            </a>
          ) : this.state.produto.ESTOQUE > 0 ? (
            <div
              className="btn btn-cart"
              onClick={(event) => {
                event.preventDefault();
                this.handleAddCart(this.state.produto);
              }}
            >
              Comprar
              {qtdCesta > 0 ? (
                <span>
                  <FontAwesomeIcon icon={faBasketShopping} />
                  {qtdCesta || ''}
                </span>
              ) : null}
            </div>
          ) : null}
        </a>
      </>
    );
  }
}

const mapStateToProps = (state: ApplicationState) => ({
  param: state.param.data,
  cart: state.cart.data,
});

const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators({ ...ParamActions, ...CartActions }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(CardProduto);
