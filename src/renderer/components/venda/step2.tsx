import React from 'react';
import { Button, ButtonGroup, Alert, CircularProgress, Grid } from '@mui/material';
import { red, green } from '@mui/material/colors';
import swal from '@sweetalert/with-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBarcode,
  faBasketShopping,
  faMinusCircle,
  faPlusCircle,
  faTrash,
  faExclamationCircle,
  faCreditCard,
  faMobilePhone,
  faQrcode,
  faCreditCardAlt,
  faMobileAndroidAlt,
  faArrowLeft,
  faArrowDown,
  faArrowUp,
} from '@fortawesome/free-solid-svg-icons';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { render } from 'react-dom';
import { ApplicationState } from '../../services/store';
import { Param } from '../../services/store/ducks/param/types';
import * as ParamActions from '../../services/store/ducks/param/actions';
import { Cart, ProductType } from '../../services/store/ducks/cart/types';
import * as CartActions from '../../services/store/ducks/cart/actions';
import IconeScanner from '../../../../assets/leitor-caixa.gif';
import ProdutoSemImagem from '../../../../assets/produto-sem-imagem.png';
import ApiV2 from '../../services/apiv2';
import { Diversos } from '../../services/diversos';

const AudioPasso1ComPrevenda = '../../../assets/audio/passo-1-com-prevenda.mp3';
const AudioPasso1SemPrevenda = '../../../assets/audio/passo-1-sem-prevenda.mp3';

const electron = require('electron');

const remote = require('@electron/remote');

const { DBFFile } = remote.require('dbffile');
const fs = remote.require('fs');
const path = require('path');

interface StateProps {
  param: Param;
  cart: Cart;
}

interface DispatchProps {
  setParam(param: Param): void;
  add(produ: ProductType): void;
  update(produ: ProductType): void;
  drop(rowid: string): void;
  clean(): void;
}

interface OwnProps {
  adminh: any;
  db: any;
}

type Props = StateProps & DispatchProps & OwnProps;

class Step2 extends React.Component<Props> {
  apiv2: any = null;

  inputRef: any = null;

  audioPasso1SemPrevenda: any = null;

  audioPasso1ComPrevenda: any = null;

  constructor(props) {
    super(props);

    this.inputRef = React.createRef();

    this.apiv2 = new ApiV2();

    this.audioPasso1SemPrevenda = new Audio(AudioPasso1SemPrevenda);
    this.audioPasso1ComPrevenda = new Audio(AudioPasso1ComPrevenda);

    this.state = {
      preVendaCpf: '',
      fgProdutoNovoDestaque: 0,
      ehPrimeiraVez: true,
      isLoadingProdutos: false,
      formaPg: 0,
      parcelamento: [
        {
          title: 'A vista',
          parcela: 1,
        },
        {
          title: '2x',
          parcela: 2,
        },
        {
          title: '3x',
          parcela: 3,
        },
        {
          title: 'Cartão Qualidade',
          parcela: 999,
        },
      ],
    };
  }

  async componentDidMount(): void {
    this.inputRef.current.focus();

    if (this.props.param.leitor && this.props.param.leitor.trim() !== '') {
      this.handlerOnKeyDown({ key: 'Enter' });
    }

    if (this.props.param.stepError === true) {
      swal('Ops! Algo deu errado...', `Por favor tente novamente. ${this.props.param.stepErrorMsg}`, 'warning').then(() => {
        this.props.setParam({
          ...this.props.param,
          stepError: false,
          stepErrorMsg: '',
        });
      });
    }
  }

  private handlerOnKeyDown(event) {
    if (event.key === 'Enter') {
      if (!this.props.param.leitor) {
        swal('Atenção', 'Passe a pré-venda ou o produto no leitor para iniciar sua compra.', 'warning');

        return false;
      }

      if (!Diversos.hasOnlyNumbers(this.props.param.leitor)) {
        this.setState({ isLoadingProdutos: false });

        this.props.setParam({
          ...this.props.param,
          leitor: '',
        });

        return false;
      }

      const tmpLeitor = parseInt(this.props.param.leitor, 10);

      Diversos.putLog(`-> Tratando leitor: ${tmpLeitor}`);

      Diversos.putLog(
        `-> Vai verificar pre-venda: ${this.props.adminh.Parametros.PREVENDA_PASTA}/C${String(tmpLeitor).padStart(6, '0')}.dbf`
      );

      let pathPreVenda = this.props.adminh.Parametros.PREVENDA_PASTA;

      if (pathPreVenda[0] === '/' && pathPreVenda[1] !== '/') {
        pathPreVenda = `//${pathPreVenda}`;
      }

      Diversos.putLog(`-> pre-venda: ${pathPreVenda}`);

      if (!fs.existsSync(path.resolve(`${pathPreVenda}/C${String(tmpLeitor).padStart(6, '0')}.dbf`))) {
        Diversos.putLog(`-> Pesquisando produto: ${this.props.param.leitor}`);
        this.getProdu(this.props.param.leitor);
        Diversos.putLog(`-> Caixa em status de aguardando leitor novamente (após ler produto)`);
      } else {
        Diversos.putLog(`-> Pesquisando pré-venda: ${this.props.param.leitor}`);
        this.getPreVenda(tmpLeitor);
        Diversos.putLog(`-> Caixa em status de aguardando leitor novamente (após ler pré-venda)`);
      }
    }

    return true;
  }

  private handlerOnChange(event) {
    this.props.setParam({
      ...this.props.param,
      step: 2,
      leitor: event.target.value,
    });
  }

  private handlePlusProduto(idx) {
    const self = this;

    const { produtos } = self.props.cart;

    produtos[idx].qtd += 1;

    if (produtos[idx].kitqtd > 0 && produtos[idx].kitqtd <= produtos[idx].qtd && produtos[idx].kitdsc > 0) {
      const auxPreco = produtos[idx].pmc - produtos[idx].pmc * (produtos[idx].kitdsc / 100);

      if (produtos[idx].preco <= 0 || produtos[idx].preco > auxPreco) {
        produtos[idx].preco = auxPreco;
      }
    }

    if (produtos[idx].qtdproqt > 0 && produtos[idx].qtdproqt <= produtos[idx].qtd) {
      if (produtos[idx].descproqt > 0) {
        const auxPreco = produtos[idx].pmc - produtos[idx].pmc * (produtos[idx].descproqt / 100);

        if (produtos[idx].preco <= 0 || produtos[idx].preco > auxPreco) {
          produtos[idx].preco = auxPreco;
        }
      } else if (produtos[idx].vlrproqt > 0) {
        const auxPreco = produtos[idx].vlrproqt;

        if (produtos[idx].preco <= 0 || produtos[idx].preco > auxPreco) {
          produtos[idx].preco = auxPreco;
        }
      }
    }

    Diversos.putLog(`-> Atualizando quantidade do item: ${JSON.stringify(produtos[idx])}`);

    self.props.update(produtos[idx]);
  }

  private handleDropProduto(idx) {
    Diversos.putLog(`-> Solicitado cancelamento do item: ${this.props.cart.produtos[idx].nome}`);

    if (this.props.adminh.Parametros.FGFEIRA === 'Sim') {
      this.props.drop(this.props.cart.produtos[idx].rowid);
    } else {
      this.props.setParam({
        ...this.props.param,
        exclusaoItemCodigo: this.props.cart.produtos[idx].codigo,
        exclusaoItemNome: this.props.cart.produtos[idx].nome,
        step: 9,
      });
    }
  }

  private handleFormaPg(formaPg: number, parcela = null) {
    Diversos.putLog(`-> Formapg selecionada: ${formaPg} ${parcela}`);

    this.audioPasso1ComPrevenda.pause();
    this.audioPasso1SemPrevenda.pause();

    this.props.setParam({
      ...this.props.param,
      cpf: this.state.preVendaCpf,
      formapg: formaPg,
      formapgParcela: !parcela ? 1 : parcela,
      step: 3,
      stepError: false,
    });
  }

  private handleCancelaVenda() {
    Diversos.putLog(`-> Solicitado cancelamento geral da venda`);

    if (this.props.adminh.Parametros.FGFEIRA === 'Sim') {
      this.props.clean();

      this.props.setParam({
        ...this.props.param,
        leitor: '',
        step: 1,
        vendedor: 1,
        cpf: '',
        celular: '',
        nome: '',
        formapg: 0,
        formapgParcela: 1,
        cpfNaNota: true,
        cpfClube: true,
        prevenda: '',
        stepError: false,
        stepErrorMsg: '',
        bufferPrinter: '',
        appConvenio: false,
        appConvenioCodigo: '',
        appConvenioUsuario: '',
        cartaoNome: '',
        cartaoRota: '',
        cartaoNsu: '',
        cartaoAutorizacao: '',
        compreRapidoPedido: '',
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
      });
    } else {
      this.props.setParam({ ...this.props.param, step: 7 });
    }
  }

  private async getProdu(
    codigoParam,
    qtdParam = null,
    preco = null,
    desconto = null,
    prevenda = null,
    crm = null,
    dtreceita = null,
    lote = null,
    lojaOrigem = null,
    vdvd = null,
    vendedor = null,
    formaEnt = null
  ) {
    const self = this;

    self.audioPasso1ComPrevenda.pause();
    self.audioPasso1SemPrevenda.pause();

    const qtd = !qtdParam ? 1 : Number(qtdParam);

    const codigo = Diversos.getnums(codigoParam);

    self.setState({ isLoadingProdutos: true });

    if (this.props.adminh && this.props.adminh.Parametros && this.props.adminh.Parametros.PREVENDA_PASTA) {
      try {
        let fgAchouPesquisa = false;

        const produ = await electron.ipcRenderer.sendSync('get-produto', codigo);

        if (produ && produ.codint) {
          fgAchouPesquisa = true;

          const { produtos } = self.props.cart;

          let fgAchou = false;

          for (let j = 0; j < produtos.length && !fgAchou; j++) {
            if (
              (String(produtos[j].codigo) === String(produ.codigo) || String(produtos[j].codigo) === String(produ.codint)) &&
              Number(produtos[j].lojaOrigem) === Number(lojaOrigem)
            ) {
              fgAchou = true;

              if (!qtd) {
                produtos[j].qtd += 1;
              } else {
                produtos[j].qtd += qtd;
              }

              if (produtos[j].kitqtd > 0 && produtos[j].kitqtd <= produtos[j].qtd && produtos[j].kitdsc > 0) {
                const auxPreco = produtos[j].pmc - produtos[j].pmc * (produtos[j].kitdsc / 100);

                if (produtos[j].preco <= 0 || produtos[j].preco > auxPreco) {
                  produtos[j].preco = auxPreco;
                }
              }

              let qtdFamil = 0;

              Diversos.putLog(`-> Vai verificar familia do produto: ${produtos[j].codigo} | Familia: ${produtos[j].cdfamil}`);

              // VERIFICA FAMILIA QTDPROQT
              if (produtos[j].qtdproqt > 0) {
                for (let p = 0; p < produtos.length; p++) {
                  if (
                    Number(produtos[p].cdfamil) > 0 &&
                    Number(produtos[j].cdfamil) > 0 &&
                    Number(produtos[p].cdfamil) === Number(produtos[j].cdfamil)
                  ) {
                    qtdFamil += Number(produtos[p].qtd);

                    Diversos.putLog(`-> Encontrou outro produto da mesma familia: ${produtos[p].codigo}`);
                  }
                }
              }

              qtdFamil += produtos[j].qtd;

              Diversos.putLog(`-> Qtd. Familia: ${qtdFamil}`);

              if (
                produtos[j].qtdproqt > 0 &&
                (produtos[j].qtdproqt <= produtos[j].qtd || (produtos[j].qtdproqt <= qtdFamil && qtdFamil > 0))
              ) {
                if (produtos[j].descproqt > 0) {
                  const auxPreco = produtos[j].pmc - produtos[j].pmc * (produtos[j].descproqt / 100);

                  if (produtos[j].preco <= 0 || produtos[j].preco > auxPreco) {
                    produtos[j].preco = auxPreco;
                  }
                } else if (produtos[j].vlrproqt > 0) {
                  const auxPreco = produtos[j].vlrproqt;

                  if (produtos[j].preco <= 0 || produtos[j].preco > auxPreco) {
                    produtos[j].preco = auxPreco;
                  }
                }
              }

              self.setState({ fgProdutoNovoDestaque: produtos[j].codigo }, () => {
                setTimeout(() => self.setState({ fgProdutoNovoDestaque: 0 }), 1000 * 5);
              });

              self.props.update(produtos[j]);

              if (this.hasPrevenda() || Number(prevenda) > Number(0)) {
                this.audioPasso1SemPrevenda.play();
              } else {
                this.audioPasso1ComPrevenda.play();
              }
            }
          }

          if (!fgAchou) {
            if (preco && preco > 0) {
              if (desconto && desconto > 0) {
                produ.prepro = preco - preco * (desconto / 100);
                produ.preco = preco;
              } else {
                produ.prepro = preco;
              }
            }

            if (produ.kitqtd > 0 && produ.kitqtd <= qtd && produ.kitdsc > 0) {
              const auxPreco = produ.preco - produ.preco * (produ.kitdsc / 100);

              if (produ.prepro <= 0 || produ.prepro > auxPreco) {
                produ.prepro = auxPreco;
              }
            }

            let qtdFamil = 0;

            Diversos.putLog(`-> Vai verificar familia do produto: ${produ.codigo} | Familia: ${produ.cdfamil}`);

            // VERIFICA FAMILIA QTDPROQT
            if (produ.qtdproqt > 0) {
              for (let p = 0; p < produtos.length; p++) {
                if (Number(produtos[p].cdfamil) > 0 && Number(produ.cdfamil) > 0 && Number(produtos[p].cdfamil) === Number(produ.cdfamil)) {
                  qtdFamil += Number(produtos[p].qtd);

                  Diversos.putLog(`-> Encontrou outro produto da mesma familia: ${produtos[p].codigo}`);
                }
              }
            }

            Diversos.putLog(`-> Qtd. Familia: ${qtdFamil}`);

            if (produ.qtdproqt > 0 && (produ.qtdproqt <= qtd || (produ.qtdproqt <= qtdFamil && qtdFamil > 0))) {
              if (produ.descproqt > 0) {
                const auxPreco = produ.preco - produ.preco * (produ.descproqt / 100);

                if (produ.prepro <= 0 || produ.prepro > auxPreco) {
                  produ.prepro = auxPreco;
                }
              } else if (produ.vlrproqt > 0) {
                const auxPreco = produ.vlrproqt;

                if (produ.prepro <= 0 || produ.prepro > auxPreco) {
                  produ.prepro = auxPreco;
                }
              }
            }

            qtdFamil += produ.qtd;

            self.props.add({
              codigo: produ.codint,
              nome: produ.nome,
              pmc: produ.preco,
              preco: produ.prepro,
              qtd,
              foto: ProdutoSemImagem,
              icms: produ.icms,
              ncm: produ.ncm,
              tipo: produ.tipo,
              tipogru: produ.tipogru,
              grupo: produ.grupo,
              kitqtd: produ.kitqtd,
              kitdsc: produ.kitdsc,
              qtdproqt: produ.qtdproqt,
              descproqt: produ.descproqt,
              vlrproqt: produ.vlrproqt,
              prevenda: Number(prevenda) > Number(0) ? prevenda : 0,
              crm,
              dtreceita,
              lote,
              cdfamil: produ.cdfamil,
              mkt09: produ.mkt09,
              lojaOrigem: Number(lojaOrigem) > 0 ? lojaOrigem : 0,
              vdvd: String(vdvd).trim() !== '' ? vdvd : produ.vdvd,
              vendedor: Number(vendedor) > Number(0) ? vendedor : '',
              formaEnt: String(formaEnt).trim() !== '' ? formaEnt : '',
            });

            self.setState({ fgProdutoNovoDestaque: produ.codint }, () => {
              setTimeout(() => self.setState({ fgProdutoNovoDestaque: 0 }), 1000 * 5);
            });

            if (this.hasPrevenda() || Number(prevenda) > Number(0)) {
              this.audioPasso1SemPrevenda.play();
            } else {
              this.audioPasso1ComPrevenda.play();
            }
          }
        }

        if (!fgAchouPesquisa) {
          throw new Error(`Produto não localizado localmente`);
        }

        self.setState({ isLoadingProdutos: false });

        self.props.setParam({
          ...this.props.param,
          leitor: '',
        });

        return true;
      } catch (e) {
        Diversos.putLog(`-> Problemas ao procurar produto: ${e.message}`);
        console.error(e.message);
      }

      if (this.hasPrevenda() || Number(prevenda) > Number(0)) {
        this.audioPasso1SemPrevenda.play();
      } else {
        this.audioPasso1ComPrevenda.play();
      }
    }

    Diversos.putLog(`-> Nenhum produto localizado: ${self.props.param.leitor}`);

    swal('Ops', `Produto ${this.props.param.leitor} não localizado`, 'warning');

    self.setState({ isLoadingProdutos: false });

    self.props.setParam({
      ...this.props.param,
      leitor: '',
    });
    return false;
  }

  private async getPreVenda(prevenda) {
    const self = this;

    let fgPrevendaJaLancada = false;

    for (let i = 0; i < this.props.cart.produtos.length && !fgPrevendaJaLancada; i++) {
      if (Number(this.props.cart.produtos[i].prevenda) > Number(0)) {
        if (Number(this.props.cart.produtos[i].prevenda) === Number(prevenda)) {
          fgPrevendaJaLancada = true;
        }
      }
    }

    if (fgPrevendaJaLancada) {
      swal('Atenção', `A pré-venda de número ${prevenda} já foi lançada na compra.`, 'info');
      return false;
    }

    self.setState({ isLoadingProdutos: true });

    try {
      const mydbf = await DBFFile.open(
        path.resolve(this.props.adminh.Parametros.PREVENDA_PASTA, `C${String(prevenda).padStart(6, '0')}.dbf`)
      );

      let hasPbm = '';

      const records = await mydbf.readRecords(mydbf.recordCount);

      const tmpParam = this.props.param;

      /* eslint-disable */
      for (let i = 0; i < records.length; i++) {
        const record = records[i];

        Diversos.putLog(`-> Pré-venda: ${prevenda} Linha: ${JSON.stringify(record)}`);

        switch (record.TIPO) {
          case 'C':
            tmpParam.vendedor = record.VEND;

            records[i].DESC = parseInt(this.props.adminh.Parametros.CDCAIXA, 10);

            if (String(record.TRN).toUpperCase() === 'W') {
              swal('Atenção', 'Para este tipo de compra por favor utilize o caixa convencional ao lado.', 'info');
              return true;
            } else if (
              String(record.TRN).toUpperCase() === 'H' || // Farma Link
              String(record.TRN).toUpperCase() === 'F' || // Funcional Card
              String(record.EPNSU).trim() !== '' // Epharma
            ) {
              swal('Atenção', 'Para compras com desconto de laboratório (pbm) por favor utilize o caixa convencional ao lado.', 'info');
              return true;
            } else if (String(record.TRN).toUpperCase() === 'P') {
              swal('Atenção', 'Para compras com Farmácia Popular por favor utilize o caixa convencional ao lado.', 'info');
              return true;
            } else if (String(record.TRN).toUpperCase() === 'S') {
              Diversos.putLog(`-> Detectado PBM do tipo TRN`);

              // TRN Centre
              tmpParam.pbm = true;
              tmpParam.pbmTipo = 'trn';
              hasPbm = 'trn';
            }
            break;
          case 'I':
            if (String(record.FORMAENT).trim() === 'C') {
              tmpParam.controlE_formaent = String(record.FORMAENT).trim().toUpperCase();
            }

            await self.getProdu(
              record.CODIGO,
              record.QUANT,
              record.PRECO,
              record.DESC,
              parseInt(prevenda, 10),
              record.CRM,
              record.DTRECEITA,
              record.LOTE,
              record.LOJAORI,
              record.VDVD,
              record.VEND,
              String(record.FORMAENT).trim().toUpperCase()
            );
            break;
          case 'Y':
            switch (parseInt(record.CODIGO, 10)) {
              case 1:
                tmpParam.nome = record.CRM;
                break;
              case 2:
                tmpParam.celular = Diversos.maskTelefone(record.CRM);
                break;
              case 6:
                this.setState({
                  preVendaCpf: Diversos.maskCPF(String(Diversos.getnums(record.CRM)).padStart(11, '0')),
                });
                break;
              default:
                break;
            }
            break;
          case 'T':
            if (Number(record.CODIGO) >= 20 && Number(record.CODIGO) < 90) {
              if (String(record.CRM).trim() !== 'ZZZZZZ') {
                tmpParam.pbmCupom = String(record.CRM).trim();
              }
            } else if (Number(record.CODIGO) === Number(1)) {
              tmpParam.pbmCupom = String(record.CRM).trim();
            } else if (Number(record.CODIGO) === Number(2)) {
              tmpParam.pbmNsuAdm = String(record.CRM).trim();
            } else if (Number(record.CODIGO) === Number(3)) {
              tmpParam.pbmOperadora = String(record.CRM).trim();
            } else if (Number(record.CODIGO) === Number(5)) {
              tmpParam.pbmAutorizacao = String(record.CRM).trim();
            } else if (Number(record.CODIGO) === Number(6)) {
              tmpParam.pbmCartao = String(record.CRM).trim();
            } else if (Number(record.CODIGO) === Number(90)) {
              tmpParam.pbmSubsidio = Number(record.PRECO).toFixed(2);
            } else if (Number(record.CODIGO) === Number(91)) {
              tmpParam.pbmAutorizacaoPg = String(record.CRM).trim();
            } else if (Number(record.CODIGO) === Number(93)) {
              tmpParam.pbmValorPg = Number(record.PRECO).toFixed(2);
            } else if (Number(record.CODIGO) === Number(99)) {
              tmpParam.pbmDescTotal = Number(record.PRECO).toFixed(2);
            }
            break;
          case 'F':
            tmpParam.controlE_DtEntrega = record.DTENTREGA;
            tmpParam.controlE_HrEntrega = record.HRENTREGA;
            break;
          default:
            break;
        }
      }
      /* eslint-enable */

      this.props.setParam(tmpParam);

      if (records && records.length > 0) {
        await electron.ipcRenderer.sendSync('set-prevenda-aberta', {
          prevenda,
          records,
        });
      }

      Diversos.putLog(`-> Concluiu leitura da pré-venda`);

      Diversos.putLog(`-> PBM: ${hasPbm} - ${JSON.stringify(this.props.param)}`);

      // Verifica se pre-venda possui TRN Centre para fazer tratamento
      if ((this.props.param.pbm && this.props.param.pbmTipo === 'trn') || hasPbm === 'hasPbm') {
        Diversos.putLog(`-> Autorizando transação TRN Centre...`);

        try {
          const result = await electron.ipcRenderer.sendSync('trn-get-autorizacao', {
            param: this.props.param,
            produtos: this.props.cart.produtos,
          });

          if (!result.status) {
            throw new Error(result.msg);
          }

          tmpParam.step = 3;
          tmpParam.trnCentreAux = result.msg.TCPreCaptura ? [...result.msg.TCPreCaptura] : [];
        } catch (e) {
          swal('Ops', e.message, 'warning');
          Diversos.putLog(`-> TRN Centre | trn-get-autorizacao (error): ${e.message}`);
        }
      }

      this.props.setParam(tmpParam);
    } catch (e) {
      Diversos.putLog(`-> Problema na leitura da pré-venda: ${e.message}`);
      // console.error(e.message);
    } finally {
      self.setState({ isLoadingProdutos: false });
      self.props.setParam({
        ...this.props.param,
        leitor: '',
      });
    }
  }

  private getTotal() {
    let total = 0.0;

    for (let i = 0; i < this.props.cart.produtos.length; i++) {
      let preco = this.props.cart.produtos[i].pmc;

      if (Number(this.props.cart.produtos[i].preco) > 0 && Number(this.props.cart.produtos[i].preco) < preco) {
        preco = this.props.cart.produtos[i].preco;
      }

      total += Number(this.props.cart.produtos[i].qtd) * Number(preco);
    }

    return total;
  }

  private hasPrevenda() {
    for (let i = 0; i < this.props.cart.produtos.length; i++) {
      if (Number(this.props.cart.produtos[i].prevenda) > Number(0)) {
        return true;
      }
    }

    return false;
  }

  render() {
    return (
      <Grid container>
        <Grid
          item
          xs={8}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
        >
          <h2>
            <FontAwesomeIcon icon={faBasketShopping} className="title-icon" />
            {this.props.param && this.props.param.nome
              ? `Olá ${Diversos.captalize(String(this.props.param.nome.split(' ')[0]).toLowerCase())}, sua compra`
              : 'Sua compra'}
          </h2>
          <div className="cart">
            <div className="cart-body">
              {/* eslint-disable no-nested-ternary */}
              {this.state.isLoadingProdutos ? (
                <CircularProgress size={48} sx={{ color: 'white' }} />
              ) : this.props.cart.produtos.length <= 0 ? (
                <div className="cart-product" key={0}>
                  <Alert severity="info" sx={{ flex: 1 }}>
                    Nenhum produto adicionado a cesta de compras
                  </Alert>
                </div>
              ) : (
                this.props.cart.produtos.map((row, idx) => (
                  <div
                    className={`cart-product ${Number(this.state.fgProdutoNovoDestaque) === Number(row.codigo) ? 'bg-destaque' : ''}`}
                    key={idx}
                  >
                    <img src={row.foto} className="cart-product-img" />
                    <div className="cart-product-detail">
                      <h3>{row.nome}</h3>
                      <div className="cart-product-subdetail">
                        <div className="cart-product-subdetail-qtd">
                          <ButtonGroup variant="text" size="large">
                            {/* <Button
                              className="cart-product-subdetail-qtd-minus"
                              onClick={() => this.handleMinusProduto(idx)}
                            >
                              <FontAwesomeIcon
                                icon={faMinusCircle}
                                className="cart-product-subdetail-qtd-minus-icon"
                              />
                            </Button> */}
                            <Button className="cart-product-subdetail-qtd">{row.qtd} un</Button>
                            {Number(row.prevenda) <= Number(0) ? (
                              <Button className="cart-product-subdetail-qtd-plus" onClick={() => this.handlePlusProduto(idx)}>
                                <FontAwesomeIcon icon={faPlusCircle} className="cart-product-subdetail-qtd-plus-icon" />
                              </Button>
                            ) : null}
                          </ButtonGroup>
                        </div>
                        <div className="cart-product-subdetail-price">
                          {row.preco > 0 && row.preco < row.pmc ? (
                            <>
                              <span>De: {Diversos.maskPreco(row.pmc)}</span>
                              Por: {Diversos.maskPreco(row.preco)}
                            </>
                          ) : (
                            `Por: ${Diversos.maskPreco(row.pmc)}`
                          )}
                        </div>
                        <div className="cart-product-subdetail-drop">
                          {Number(row.prevenda) > Number(0) ? (
                            <Button
                              variant="text"
                              size="large"
                              className="cart-product-subdetail-drop-btn"
                              onClick={() => null}
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span>Item de pré-venda</span>
                            </Button>
                          ) : (
                            <Button
                              variant="text"
                              size="large"
                              className="cart-product-subdetail-drop-btn"
                              onClick={() => this.handleDropProduto(idx)}
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} className="cart-product-subdetail-drop-btn-icon" />
                              <br />
                              <span>Solicitar Exclusão</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {/* eslint-enable no-nested-ternary */}
            </div>
            <div className="cart-comands">
              <Button
                variant="text"
                size="large"
                onClick={() => {
                  const elem = document.getElementsByClassName('cart-body');
                  let scrollFator = elem[0].scrollTop - 35;

                  if (scrollFator < 0) {
                    scrollFator = 0;
                  }

                  if (elem && elem.length > 0) {
                    elem[0].scrollTo({
                      top: scrollFator,
                      behavior: 'smooth',
                    });
                  }
                }}
              >
                <FontAwesomeIcon icon={faArrowUp} style={{ color: 'white', fontSize: 30 }} />
              </Button>
              <Button
                variant="text"
                size="large"
                onClick={() => {
                  const elem = document.getElementsByClassName('cart-body');
                  let scrollFator = elem[0].scrollTop + 35;

                  if (scrollFator > elem[0].scrollHeight) {
                    scrollFator = elem[0].scrollHeight;
                  }

                  if (elem && elem.length > 0) {
                    elem[0].scrollTo({
                      top: scrollFator,
                      behavior: 'smooth',
                    });
                  }
                }}
              >
                <FontAwesomeIcon icon={faArrowDown} style={{ color: 'white', fontSize: 30 }} />
              </Button>
            </div>
          </div>
          <div className="aviso">
            <FontAwesomeIcon icon={faExclamationCircle} className="aviso-left-icon" />
            <p className="aviso-text">
              Para <strong>adicionar</strong> mais produtos <strong>escaneie</strong> o <strong>código de barras</strong>
            </p>
            {/* <FontAwesomeIcon icon={faBarcode} className="aviso-right-icon" /> */}
            <img src={IconeScanner} className="aviso-right-icon" alt="Scanner icone" />
          </div>
        </Grid>
        <Grid
          item
          // xs={4}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: 'white',
            position: 'fixed',
            overflow: 'hidden',
            right: 0,
            top: 0,
            bottom: 0,
          }}
          className="right-bar"
        >
          <h3>
            <FontAwesomeIcon icon={faBasketShopping} />
            Resumo da compra
          </h3>
          <div className="resumo">
            <h3>{this.props.cart.produtos.reduce((prev, curr) => prev + curr.qtd, 0)} iten(s) adicionado(s)</h3>
            <hr />
            <p>
              TOTAL: <span>{Diversos.maskPreco(this.getTotal())}</span>
            </p>
          </div>
          <Button
            size="medium"
            variant="contained"
            sx={{
              borderColor: red[500],
              borderSize: 2,
              bgcolor: red[500],
              color: 'white',
              mt: 2,
              width: '90%',
            }}
            onClick={this.handleCancelaVenda.bind(this)}
          >
            Cancelar Compra
          </Button>

          <h3>
            <FontAwesomeIcon icon={faCreditCard} />
            Forma de pagamento
          </h3>
          {/* eslint-disable no-nested-ternary */}
          {this.state.formaPg === 0 ? (
            <>
              {!this.props.adminh.Trier.URL || !this.props.adminh.Trier.Token ? (
                <Button
                  color="success"
                  size="large"
                  variant="contained"
                  sx={{
                    backgroundColor: green[500],
                    borderColor: green[500],
                    borderSize: 2,
                    color: 'white',
                    mt: 2,
                    height: 70,
                    width: '90%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '1.3rem',
                  }}
                  onClick={this.handleFormaPg.bind(this, 1, 1)}
                >
                  <FontAwesomeIcon icon={faMobileAndroidAlt} />
                  Empresa Conveniada
                  {/* <div className="btn-pagamento-cashback ">
                  <span>Ganhe R$ 3,00 em</span>
                  <img
                    src={CashbackLogo}
                    style={{ width: 'auto', height: 20 }}
                    alt="Cashback Logo"
                  />
                </div> */}
                  <div />
                </Button>
              ) : null}
              <Button
                color="success"
                size="large"
                variant="contained"
                sx={{
                  backgroundColor: green[500],
                  borderColor: green[500],
                  borderSize: 2,
                  color: 'white',
                  mt: 2,
                  height: 70,
                  width: '90%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '1.3rem',
                }}
                onClick={this.handleFormaPg.bind(this, 2, 1)}
              >
                <FontAwesomeIcon icon={faQrcode} />
                Pix
                {/* <div className="btn-pagamento-cashback ">
                  <span>Ganhe R$ 3,00 em</span>
                  <img
                    src={CashbackLogo}
                    style={{ width: 'auto', height: 20 }}
                    alt="Cashback Logo"
                  />
                </div> */}
                <div />
              </Button>
              <Button
                color="success"
                size="large"
                variant="contained"
                sx={{
                  backgroundColor: green[500],
                  borderColor: green[500],
                  borderSize: 2,
                  color: 'white',
                  mt: 2,
                  height: 70,
                  width: '90%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '1.3rem',
                }}
                onClick={this.handleFormaPg.bind(this, 3, 1)}
              >
                <FontAwesomeIcon icon={faCreditCardAlt} />
                Cartão de Débito
                <div />
              </Button>
              <Button
                color="success"
                size="large"
                variant="contained"
                sx={{
                  backgroundColor: green[500],
                  borderColor: green[500],
                  borderSize: 2,
                  color: 'white',
                  mt: 2,
                  height: 70,
                  width: '90%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '1.3rem',
                }}
                // onClick={this.handleFormaPg.bind(this, 4)}
                onClick={() => {
                  const parcelaMinima =
                    this.props.adminh && this.props.adminh.Parametros && this.props.adminh.Parametros.PARCELAMIN
                      ? this.props.adminh.Parametros.PARCELAMIN
                      : 10;

                  if (this.getTotal() <= Number(parcelaMinima)) {
                    this.handleFormaPg(4, 1);
                  } else if (!this.state.parcelamento || this.state.parcelamento.length <= 1) {
                    this.handleFormaPg(4, 1);
                  } else {
                    this.setState({ formaPg: 4 });
                  }
                }}
              >
                <FontAwesomeIcon icon={faCreditCard} />
                Cartão de Crédito
                <div />
              </Button>
            </>
          ) : this.state.formaPg === 4 ? (
            <>
              {this.state.parcelamento.map((q) =>
                Number(this.getTotal() / q.parcela) >
                  Number(
                    this.props.adminh && this.props.adminh.Parametros && this.props.adminh.Parametros.PARCELAMIN
                      ? this.props.adminh.Parametros.PARCELAMIN
                      : 10
                  ) || Number(q.parcela) <= Number(1) ? (
                  <Button
                    color="success"
                    size="medium"
                    variant={Number(q.parcela) <= Number(1) ? 'contained' : 'outlined'}
                    sx={{
                      backgroundColor: Number(q.parcela) <= Number(1) ? green[500] : 'white',
                      borderColor: green[500],
                      borderSize: 2,
                      color: Number(q.parcela) <= Number(1) ? 'white' : green[500],
                      mt: 2,
                      height: 70,
                      width: '90%',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '1.3rem',
                    }}
                    onClick={this.handleFormaPg.bind(this, 4, q.parcela < 999 ? q.parcela : 1)}
                  >
                    <div />
                    {q.title}
                    <div>{q.parcela < 999 ? <span>{Diversos.maskPreco(this.getTotal() / q.parcela)}</span> : <span />}</div>
                  </Button>
                ) : null
              )}
              <Button
                size="small"
                variant="text"
                sx={{
                  backgroundColor: 'white',
                  borderSize: 0,
                  color: 'dark',
                  mt: 2,
                  height: 40,
                  width: '90%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '1.3rem',
                }}
                onClick={() => this.setState({ formaPg: 0 })}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Voltar
                <div />
              </Button>
            </>
          ) : null}

          {this.props.adminh.Parametros.FGFEIRA === 'Sim' ? (
            <Button
              size="small"
              variant="text"
              sx={{
                backgroundColor: 'white',
                borderSize: 0,
                color: 'dark',
                mt: 2,
                height: 40,
                width: '90%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '1.3rem',
              }}
              onClick={() => this.props.setParam({ ...this.props.param, step: 10 })}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Voltar
              <div />
            </Button>
          ) : null}
          {/* eslint-enable no-nested-ternary */}
        </Grid>

        <input
          ref={this.inputRef}
          name="leitor"
          value={this.props.param.leitor}
          onChange={this.handlerOnChange.bind(this)}
          onKeyDown={this.handlerOnKeyDown.bind(this)}
          onBlur={() => this.inputRef.current.focus()}
          style={{
            height: 0,
            width: 0,
            border: 'none',
            backgroundColor: 'transparent',
            outline: 'none',
          }}
        />
      </Grid>
    );
  }
}

const mapStateToProps = (state: ApplicationState) => ({
  param: state.param.data,
  cart: state.cart.data,
});

const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators({ ...ParamActions, ...CartActions }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Step2);
