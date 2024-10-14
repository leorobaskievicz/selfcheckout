import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faPrint, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import swal from '@sweetalert/with-react';
import { red, green } from '@mui/material/colors';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { Grid, Button } from '@mui/material';
import path from 'path';
import fs from 'fs';
import moment from 'moment';
import { render } from 'react-dom';
import Api from '../../services/api';
import ApiV2 from '../../services/apiv2';
import { ApplicationState } from '../../services/store';
import { Param } from '../../services/store/ducks/param/types';
import * as ParamActions from '../../services/store/ducks/param/actions';
import { Cart } from '../../services/store/ducks/cart/types';
import * as CartActions from '../../services/store/ducks/cart/actions';
import { Diversos } from '../../services/diversos';
import Emoji1 from '../../../../assets/emoji-1.png';
import Emoji2 from '../../../../assets/emoji-2.png';
import Emoji3 from '../../../../assets/emoji-3.png';
import Emoji4 from '../../../../assets/emoji-4.png';
import Logo from '../../../../assets/logo-callfarma.png';
import LogoJoia from '../../../../assets/call-joinha.png';
// import CupomBelezaPromo from '../../../../assets/cupom-beleza.png';

const AudioCaixa = '../../../assets/audio/emitindo-nfe.mp3';

const AudioCaixaSucesso = '../../../assets/audio/notificacao.mp3';

const electron = require('electron');
const remote = require('@electron/remote');
const { app } = require('@electron/remote');

const { PosPrinter } = remote.require('electron-pos-printer');

interface StateProps {
  param: Param;
  cart: Cart;
}

interface DispatchProps {
  setParam(param: Param): void;
  clean(): void;
}

interface OwnProps {
  adminh: any;
  daruma: any;
}

type Props = StateProps & DispatchProps & OwnProps;

class Step5 extends React.Component<Props> {
  inputRef: any = null;

  api: any = null;

  apiv2: any = null;

  audioCaixa: any = null;

  audioCaixaSucesso: any = null;

  constructor(props) {
    super(props);

    this.inputRef = React.createRef();

    this.api = new Api();

    this.apiv2 = new ApiV2();

    this.audioCaixa = new Audio(AudioCaixa);

    this.audioCaixaSucesso = new Audio(AudioCaixaSucesso);

    this.state = {
      hasError: this.props.param.stepError,
      hasErrorMsg: this.props.param.stepErrorMsg,
      msgPrint: '',
      textoCupomControlE: '',
      avaliacao: null,
    };
  }

  componentDidMount() {
    Diversos.putLog(`-> CPF na Nota: ${this.props.param.cpfNaNota ? 'Sim' : 'Não'}`);

    Diversos.putLog(`-> CPF Clube: ${this.props.param.cpfClube ? 'Sim' : 'Não'}`);

    Diversos.putLog(`-> Retorno pagamento: ${this.props.param.stepError ? 'Recusado' : 'Sucesso'}`);

    if (this.props.param.stepError) {
      // setTimeout(() => {
      //   this.props.setParam({
      //     ...this.props.param,
      //     step: 2,
      //     stepError: false,
      //     formapgParcela: 1,
      //     formapg: 0,
      //   });
      // }, 1000 * 7.5);
    } else {
      this.audioCaixa.play();

      const prom = new Promise((resolve, reject) => {
        try {
          this.handleIni();
          resolve(true);
        } catch (e) {
          reject();
        }
      });
    }
  }

  private async handleIni() {
    const fgTecWorks = !this.props.adminh.Trier || !this.props.adminh.Trier.URL || !this.props.adminh.Trier.Token;

    try {
      if (fgTecWorks) {
        if (
          this.props.param.fgDaruma === true &&
          ['daruma', 'epson'].includes(String(this.props.adminh.Parametros.IMPRESSORA).toLowerCase())
        ) {
          await this.handleNFCe();
        }

        try {
          if (this.props.param.pbm && this.props.param.pbmTipo === 'trn') {
            Diversos.putLog(`-> Dados da TRN Centre: ${JSON.stringify(this.props.param)}`);

            const result = await electron.ipcRenderer.sendSync('trn-efetiva-autorizacao', {
              param: this.props.param,
              produtos: this.props.cart.produtos,
            });

            if (result.status === false) {
              throw new Error(`Nao foi possivel efetivar TRN Centre`);
            }

            this.setState({
              msgPrint: result.msg,
            });

            Diversos.putLog(`-> TRN Centre efetivado com sucesso: ${JSON.stringify(result.msg)}`);
          }
        } catch (e) {
          Diversos.putLog(`-> Falha na efetivação da PBM...`);
          Diversos.putLog(JSON.stringify(e));
          throw new Error('Não foi possível efetivar autorização de desconto com o laboratório');
        }

        try {
          if (this.props.param.pbm && this.props.param.pbmTipo === 'trn') {
            Diversos.putLog(`-> Dados da TRN Centre: ${JSON.stringify(this.props.param)}`);

            const resultConfirmaTrn = await electron.ipcRenderer.sendSync('trn-confirma-autorizacao', {
              param: this.props.param,
              produtos: this.props.cart.produtos,
            });

            if (!resultConfirmaTrn || !resultConfirmaTrn.status) {
              throw new Error(`Nao foi possivel confirmar TRN Centre`);
            }

            Diversos.putLog(`-> TRN Centre confirmado com sucesso`);
          }
        } catch (e) {
          Diversos.putLog(`-> Falha na confirmação da PBM...`);
          throw new Error('Não foi possível confirmar autorização de desconto com o laboratório');
        }

        try {
          const textoCupomControlE = await this.handleControlE();

          if (String(textoCupomControlE).trim() !== '') {
            this.setState({
              textoCupomControlE: String(textoCupomControlE).trim(),
            });
          }
        } catch (e) {
          Diversos.putLog(`-> Falha na confirmação do Control E...`);
          throw new Error('Não foi possível confirmar Control E');
        }

        if (
          this.props.param.fgDaruma === true &&
          ['daruma', 'epson'].includes(String(this.props.adminh.Parametros.IMPRESSORA).toLowerCase())
        ) {
          try {
            // BUSCA LINK DA ULTIMA NFCE
            let linkNfce = await this.handleGetLinkUltNfce();

            if (!linkNfce) {
              Diversos.putLog('Não foi possível recuperar Link da NFCe emitida');
            } else {
              if (Number(this.props.param.compreRapidoPedido) > Number(0)) {
                Diversos.putLog(`Pedido de Compra Rápida vai transmitir Link da NFCe`);

                const paramCompraRapida = {
                  pedido: this.props.param.compreRapidoPedido,
                  cliente: this.props.param.cpf,
                  status: 9,
                  convenio: this.props.param.appConvenioCodigo,
                  link: linkNfce,
                  cdfil: this.props.adminh.Parametros.CDFIL,
                  nrnfce: Number(this.props.adminh.Parametros.ULTNFCE) + 1,
                  serienfce: this.props.adminh.Parametros.CDCAIXA,
                };

                Diversos.putLog(`/Pedido/testeCompraRapidaSet: PAYLOAD : ${JSON.stringify(paramCompraRapida)}`);

                const resultCompraRapida = await this.api.post('/Pedido/testeCompraRapidaSet', paramCompraRapida);

                Diversos.putLog(`/Pedido/testeCompraRapidaSet: RESULT => ${JSON.stringify(resultCompraRapida)}`);

                // Diversos.putLog(
                //   `Retorno Compra Rápida: ${JSON.stringify(resultCompraRapida.status)} | ${JSON.stringify(resultCompraRapida.data)}`
                // );

                const paramConv = {
                  cpf: this.props.param.cpf,
                  pedido: this.props.param.compreRapidoPedido,
                  loja: this.props.adminh.Parametros.CDFIL,
                  link_sefaz: linkNfce,
                  nrnfce: Number(this.props.adminh.Parametros.ULTNFCE) + 1,
                  nrecf: this.props.adminh.Parametros.CDCAIXA,
                  cnpjnanota: this.props.param.cpfNaNota ? this.props.param.cpf : '',
                };

                Diversos.putLog(` /convenio/venda/atualiza: PAYLOAD : ${JSON.stringify(paramConv)}`);

                const resultCompraRapidaConv = await this.apiv2.put(
                  '/convenio/venda/atualiza',
                  paramConv,
                  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImlhdCI6MTY5NTc0Nzk5N30.2dymofjo9Cx1i1GfINcivkcXweTI2FKyOGu5ALOH2PY'
                );

                Diversos.putLog(` /convenio/venda/atualiza: RESULT => ${JSON.stringify(resultCompraRapidaConv)}`);
              }

              const paramApiNfce = {
                cdfil: this.props.adminh.Parametros.CDFIL,
                nrnfce: Number(this.props.adminh.Parametros.ULTNFCE) + 1,
                serienfce: this.props.adminh.Parametros.CDCAIXA,
                link: linkNfce,
                cpf: this.props.param.cpfClube ? this.props.param.cpf : '',
                cpfnanota: this.props.param.cpfNaNota ? this.props.param.cpf : '',
                valor: this.getTotal() - this.getTotalDesconto(),
                chave: '123',
                protocolo: '123',
                email: '',
                pedido: this.props.param.compreRapidoPedido,
                enviaremail: 'N',
              };

              Diversos.putLog(`/Notification/salvaNFeCaixa: PAYLOAD : ${JSON.stringify(paramApiNfce)}`);

              const sendNFCe = await this.api.post('/Notification/salvaNFeCaixa', paramApiNfce);

              Diversos.putLog(`/Notification/salvaNFeCaixa: RESULT => ${JSON.stringify(sendNFCe)}`);

              // if (!sendNFCe || sendNFCe.status !== 200 || !sendNFCe.data) {
              //   Diversos.putLog(`Problemas ao transmitir Link da NFCe emitida: ${JSON.stringify(sendNFCe.data)}`);
              // }

              // if (!sendNFCe.data.status) {
              //   Diversos.putLog(`Problemas (2) ao transmitir Link da NFCe emitida: ${JSON.stringify(sendNFCe.data)}`);
              // }

              Diversos.putLog(`Link da NFCe emitida com sucesso`);
            }
          } catch (e) {
            Diversos.putLog(`Problemas (3) ao transmitir Link da NFCe emitida: ${JSON.stringify(e.message)}`);
          }
        }

        Diversos.putLog(`- DarumaFrameWork.regAlterarValor_NFCe_Daruma: CONFIGURACAO\\ImpressaoCompleta - 1`);

        if (this.props.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\ImpressaoCompleta', '1') != 1) {
          throw new Error(`CONFIGURACAO\\ImpressaoCompleta - Error - 1`);
        }

        let nTentativaReimprime = 0;

        do {
          const reimprimeNFCe = this.props.daruma.iCFReImprimir_NFCe_Daruma('', '', '');

          if (reimprimeNFCe != 1) {
            // throw new Error(`iCFReImprimir_NFCe_Daruma - Error`);
            Diversos.putLog(`- DarumaFrameWork.iCFReImprimir_NFCe_Daruma: Tentativa: ${nTentativaReimprime}`);
          } else {
            nTentativaReimprime = 99;
          }

          nTentativaReimprime++;
        } while (nTentativaReimprime <= 3);

        if (nTentativaReimprime <= 5) {
          throw new Error(`iCFReImprimir_NFCe_Daruma - Error`);
        }

        Diversos.putLog(`- DarumaFrameWork.regAlterarValor_NFCe_Daruma: CONFIGURACAO\\ImpressaoCompleta - 3`);

        if (this.props.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\ImpressaoCompleta', '3') != 1) {
          throw new Error(`CONFIGURACAO\\ImpressaoCompleta - Error - 2`);
        }
      }

      try {
        await this.handlePrinter();
      } catch (e) {
        console.log(e.message);
      }

      if (fgTecWorks) {
        if ([2, 3, 4].includes(this.props.param.formapg)) {
          Diversos.putLog(`-> Gravação retorno para o TEF`);
          try {
            fs.writeFileSync(path.resolve(`${this.props.adminh.Parametros.TEF}/envio.txt`), `9`, 'utf8');

            Diversos.putLog(`-> Retorno TEF gravado com sucesso`);
          } catch (e) {
            Diversos.putLog(`-> Não foi possivel gravar retorno do TEF ${e.message}`);
          }
        }
      }

      setTimeout(() => this.handleFinaliza(), 1000 * 5);

      this.audioCaixa.pause();
    } catch (e) {
      Diversos.putLog(`- Houve uma exceção na finalização da venda: ${e.message}`);

      this.audioCaixa.pause();

      if (fgTecWorks) {
        switch (this.props.param.formapg) {
          case 1:
            Diversos.putLog(`-> Cancelando transação do Convênio`);

            try {
              const { data } = await this.api.post('/Pedido/sendCancelaAutorizacaoPagamentoCaixa', {
                pedido: this.props.param.compreRapidoPedido,
                cpf: this.props.param.cpfClube,
              });

              if (!data || !data.status) {
                throw new Error(data.msg);
              }

              Diversos.putLog(`-> Transação Convênio cancelada com sucesso`);
            } catch (e) {
              Diversos.putLog(`-> Não foi possível cancelar transação do Convênio: ${e.message}`);
            }
            break;
          case 2000:
            Diversos.putLog(`-> Cancelando transação do Pix`);

            try {
              const { data } = await this.api.post('/Caixa/cancelaPix', {
                txid: this.props.param.pixTxid,
                endtoendid: this.props.param.pixEndtoEnd,
                valor: this.getTotal() - this.getTotalDesconto(),
              });

              if (!data || !data.status) {
                throw new Error(data.msg);
              }

              Diversos.putLog(`-> Transação Pix cancelada com sucesso`);
            } catch (e) {
              Diversos.putLog(`-> Não foi possível cancelar transação do Pix: ${e.message}`);
            }
            break;
          case 2:
          case 3:
          case 4:
            Diversos.putLog(`-> Gravação retorno para o TEF para cancelar`);
            try {
              fs.writeFileSync(path.resolve(`${this.props.adminh.Parametros.TEF}/envio.txt`), `8`, 'utf8');

              Diversos.putLog(`-> Retorno TEF cancelado com sucesso`);
            } catch (e) {
              Diversos.putLog(`-> Não foi possivel gravar retorno do TEF ${e.message}`);
            }
            break;
          default:
            Diversos.putLog(`-> Forma de pagamento nao definida para rollback`);
            break;
        }

        await this.handleCancelaUltNFCe();
      }

      this.props.setParam({
        ...this.props.param,
        step: 5,
        stepError: true,
      });

      this.setState({
        hasError: true,
      });

      setTimeout(() => {
        this.props.setParam({
          ...this.props.param,
          step: 2,
          stepError: false,
          formapgParcela: 1,
          formapg: 0,
        });
      }, 1000 * 7.5);
    }

    return true;
  }

  private async handleFinaliza() {
    try {
      let horarioServidor = moment().utcOffset('-03:00').format('YYYY-MM-DD HH:mm:ss');

      try {
        Diversos.putLog(`Vai sincronizar horário com o servidor`);
        const { data } = await this.apiv2.get('/parametro/horario');

        if (data && data.status) {
          Diversos.putLog(`Horário sincronizado: ${data.msg.horario}`);
          horarioServidor = moment(data.msg.horario).format('YYYY-MM-DD HH:mm:ss');
        }
      } catch (e) {
        Diversos.putLog(`Nao foi possivel sincronizar horario: ${e.message}`);
      }

      await this.gravaDbfVenda(horarioServidor);

      if (!this.props.adminh.Trier || !this.props.adminh.Trier.URL || !this.props.adminh.Trier.Token) {
        await this.gravaFinanceiro(horarioServidor);
      }

      if (this.state.avaliacao !== null) {
        this.props.clean();
        this.props.setParam({
          ...this.props.param,
          leitor: '',
          step: 1,
          vendedor: 99,
          cpf: '',
          celular: '',
          nome: '',
          formapg: 0,
          formapgParcela: 1,
          cpfNaNota: true,
          cpfClube: true,
          prevenda: '',
          stepError: false,
          bufferPrinter: '',
          appConvenio: false,
          appConvenioCodigo: '',
          appConvenioUsuario: '',
          cartaoNome: '',
          cartaoRota: '',
          cartaoNsu: '',
          cartaoAutorizacao: '',
          compreRapidoPedido: '',
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
        });
      } else {
        this.props.setParam({
          ...this.props.param,
          step: 6,
          stepError: false,
        });
      }
    } catch (e) {
      Diversos.putLog(`Nao foi possivel gravar logs das vendas: ${e.message}`);

      this.props.setParam({
        ...this.props.param,
        step: 5,
        stepError: true,
      });

      this.setState({
        hasError: true,
      });

      setTimeout(() => {
        this.props.setParam({
          ...this.props.param,
          step: 2,
          stepError: false,
          formapgParcela: 1,
          formapg: 0,
        });
      }, 1000 * 7.5);
    }

    return true;
  }

  private async handleGetLinkUltNfce() {
    Diversos.putLog(`Vai buscar Link da ultima nfce`);

    try {
      const file = path.resolve(this.props.adminh.Parametros.PASTANFCE, 'arquivoFormatado.txt');

      Diversos.putLog(`Vai ler arquivo: ${file}`);

      if (!fs.existsSync(file)) {
        throw new Error(`Arquivo ${file} nao localizado`);
      }

      Diversos.putLog(`--> Abrindo arquivo com o link`);

      const xmlRetorno = fs.readFileSync(file, 'utf-8');

      const regex = /<qrcode>(.+?)<\/qrcode>/;

      const qrcodeValue = regex.exec(xmlRetorno.toString('utf-8'));

      Diversos.putLog(`--> Retorno localizado: ${JSON.stringify(qrcodeValue)}`);

      if (!qrcodeValue || qrcodeValue.length <= 1) {
        throw new Error('Link não localizado no XML');
      }

      return String(qrcodeValue.pop()).replace('<lmodulo>4</lmodulo>', '');
    } catch (e) {
      Diversos.putLog(`Link NFCe | Error => ${e.message}`);

      return false;
    }

    // let fgHasRetornoLink = false;
    // const nameFileLinkRetorno = path.resolve(this.props.adminh.Parametros.TEF, 'retorno.txt');
    // const nameFileLink = path.resolve(this.props.adminh.Parametros.TEF, 'envio.txt');

    // if (fs.existsSync(nameFileLinkRetorno)) {
    //   fs.unlinkSync(nameFileLinkRetorno);
    // }

    // if (fs.existsSync(nameFileLink)) {
    //   fs.unlinkSync(nameFileLink);
    // }

    // fs.writeFileSync(nameFileLink, 'nfce');

    // Diversos.putLog(`Gravou inicio`);

    // let i = 0;

    // while (!fgHasRetornoLink && i < 20) {
    //   i++;

    //   Diversos.putLog(`Loop...`);

    //   if (!fs.existsSync(nameFileLinkRetorno)) {
    //     Diversos.putLog(`Link retorno => Retorno nao localizado, aguardando...`);
    //     await new Promise((resolve) => setTimeout(() => resolve(true), 5000)); // aguarda 0.5 segundo
    //     continue;
    //   }

    //   const contentRetorno = fs.readFileSync(nameFileLinkRetorno);

    //   fs.unlinkSync(nameFileLinkRetorno);

    //   Diversos.putLog(`Link retorno => ${JSON.stringify(contentRetorno)}`);

    //   return contentRetorno;
    // }
  }

  private async handleNFCe() {
    return new Promise((resolve, reject) => {
      let fgAbriuNFCe = false;

      Diversos.putLog(`Iniciando emissão de NFCe`);

      try {
        let i = 1;
        let fgEmitiu = false;

        const adminh = Diversos.getIni();

        let numNFCe = Number(adminh.Parametros.ULTNFCE);

        while (i <= 2 && !fgEmitiu) {
          numNFCe = Number(numNFCe) + 1;

          Diversos.putLog(`--> Vai atualizar numero da ultima nfce: ${numNFCe}`);

          if (this.props.daruma.regAlterarValor_NFCe_Daruma('IDE\\nNF', Number(numNFCe - 1).toFixed(0)) != 1) {
            Diversos.putLog('Nao foi possivel tratar ultimo numero de NFCe');
            i++;
            continue;
          }

          Diversos.putLog(`--> Abrindo nova NFCe`);

          let iAux = 0;

          do {
            iAux++;

            const tmpRetorno_aCFAbrir_NFCe_Daruma = this.props.daruma.aCFAbrir_NFCe_Daruma(
              this.props.param.cpfNaNota ? this.props.param.cpf : '',
              this.props.param.cpfNaNota && this.props.param.nome ? String(this.props.param.nome).trim() : '',
              '',
              '',
              '',
              '',
              '',
              '',
              ''
            );

            if (tmpRetorno_aCFAbrir_NFCe_Daruma == -6) {
              numNFCe++;

              if (this.props.daruma.regAlterarValor_NFCe_Daruma('IDE\\nNF', Number(numNFCe - 1).toFixed(0)) != 1) {
                Diversos.putLog('Nao foi possivel tratar ultimo numero de NFCe');
                i++;
                continue;
              }

              i++;

              continue;
            } else if (tmpRetorno_aCFAbrir_NFCe_Daruma == -130) {
              Diversos.putLog(`--> --> NFCe pendente anteriormente, cancelando...`);
              this.props.daruma.tCFCancelar_NFCe_Daruma('', '', '', '', '');
              i++;
              continue;
            } else if (tmpRetorno_aCFAbrir_NFCe_Daruma != 1) {
              i++;
              continue;
            } else {
              Diversos.putLog(`--> --> NFCe aberta com sucesso`);
              fgAbriuNFCe = true;
            }
          } while (!fgAbriuNFCe && iAux <= 2);

          Diversos.putLog(`--> Vai adicionar produtos`);

          let totalNota = 0;

          for (let i = 0; i < this.props.cart.produtos.length; i++) {
            const produ = this.props.cart.produtos[i];
            let cfop = '5102'; // 5102 ou 5405

            const subtotal = Number(produ.qtd) * Number(produ.pmc > produ.preco && produ.preco > 0 ? produ.preco : produ.pmc);

            Diversos.putLog(`--> Vai chamar aCFConfImposto_NFCe_Daruma: Item: ${i + 1}`);

            let tmpRetorno1 = 0;

            if (String(produ.tipo).toUpperCase() === 'R') {
              produ.tipo = 'S';
            }

            switch (String(produ.tipo).toUpperCase()) {
              case 'S':
                cfop = '5405';
                let aliq = produ.icms;
                let novoSubTotal = subtotal;

                if (Number(produ.tipogru) === 1) novoSubTotal -= Math.round((novoSubTotal * 10) / 100, 2);
                else if (Number(produ.tipogru) === 3) novoSubTotal -= Math.round((novoSubTotal * 25) / 100, 2);
                else if (Number(produ.tipogru) === 2) novoSubTotal -= Math.round((novoSubTotal * 30) / 100, 2);

                if (Number(aliq) <= 0) aliq = 18;

                const mPV = (novoSubTotal * aliq) / 100;
                const mPC = (novoSubTotal * 12) / 100;
                let mST = mPV - mPC;

                if (mST < 0) mST = 0;

                const mParametros = `0;60;${Number(novoSubTotal * 100)
                  .toFixed(0)
                  .padStart(4, '0')};${Number(aliq * 100)
                  .toFixed(0)
                  .padStart(4, '0')};${Number(mST * 100)
                  .toFixed(0)
                  .padStart(4, '0')};;;;;;;;${Number(mPC * 100)
                  .toFixed(0)
                  .padStart(4, '0')};`;

                tmpRetorno1 = this.props.daruma.aCFConfImposto_NFCe_Daruma('ICMS60', mParametros);
                break;
              case 'T':
                tmpRetorno1 = this.props.daruma.aCFConfImposto_NFCe_Daruma(
                  'ICMS00',
                  `0;00;1;${subtotal * 100};1900;${subtotal * 0.19 * 100};`
                );
                break;
              case 'X':
                tmpRetorno1 = this.props.daruma.aCFConfImposto_NFCe_Daruma('ICMS40', `0;40;;;`);
                break;
              default:
                tmpRetorno1 = this.props.daruma.aCFConfImposto_NFCe_Daruma('ICMS40', `0;40;;;`);
                break;
            }

            if (tmpRetorno1 != 1) {
              Diversos.putLog(`--> aCFConfImposto_NFCe_Daruma: ${tmpRetorno1}`);
              throw new Error('aCFConfImposto_NFCe_Daruma');
            }

            let frete = ``;

            if (produ.codigo > 1000000000) {
              frete = `cEAN=${produ.codigo};cEANTrib=${produ.codigo};`;
            } else {
              frete = `cEAN=SEM GTIN;cEANTrib=SEM GTIN;`;
            }

            if (String(produ.tipo).toUpperCase() === 'X' || produ.icms === 0) {
              if (String(produ.ncm).padStart(8, '0').substring(0, 4) === '3004') {
                frete += `cBenef=PR810095;`;
              } else if (String(produ.ncm).padStart(8, '0').substring(0, 4) === '4014') {
                frete += `cBenef=PR810123;`;
              } else {
                frete += `cBenef=PR810034;`;
              }
            }

            let desconto = 0.0;

            if (produ.preco > 0 && produ.pmc > produ.preco) {
              desconto = produ.pmc - produ.preco;
            }

            Diversos.putLog(
              `--> Vai chamar aCFVenderCompleto_NFCe_Daruma: Item: ${JSON.stringify({
                a: Number(produ.icms).toFixed(2),
                b: produ.qtd.toFixed(0),
                c: Number(produ.pmc - desconto).toFixed(2),
                d: 'D$',
                e: '0.00',
                f: produ.codigo.toFixed(0),
                g: String(produ.ncm).padStart(8, '0'),
                h: cfop,
                i: 'UN',
                j: produ.nome,
                k: frete,
              })} `
            );

            totalNota += parseFloat(Number(produ.pmc - desconto).toFixed(2)) * produ.qtd;

            if (
              this.props.daruma.aCFVenderCompleto_NFCe_Daruma(
                Number(produ.icms).toFixed(2),
                produ.qtd.toFixed(0),
                Number(produ.pmc - desconto).toFixed(2),
                'D$',
                '0.00',
                produ.codigo.toFixed(0),
                String(produ.ncm).padStart(8, '0'),
                cfop,
                'UN',
                produ.nome,
                frete
              ) != 1
            ) {
              throw new Error('Não foi possível adicionar item na NFCe');
            }
          }

          Diversos.putLog(`--> Vai chamar aCFTotalizar_NFCe_Daruma`);

          const retorno_aCFTotalizar_NFCe_Daruma = this.props.daruma.aCFTotalizar_NFCe_Daruma('D$', '0.00');

          if (retorno_aCFTotalizar_NFCe_Daruma != 1) {
            // throw new Error('aCFTotalizar_NFCe_Daruma');
            Diversos.putLog(`aCFTotalizar_NFCe_Daruma error ${retorno_aCFTotalizar_NFCe_Daruma}`);
            i++;
            continue;
          }

          const totalNotaStr = Number(totalNota).toFixed(2);

          switch (this.props.param.formapg) {
            case 1:
              Diversos.putLog(`--> Vai chamar aCFEfetuarPagamento_NFCe_Daruma 05 | ${totalNotaStr}`);

              const retorno_aCFEfetuarPagamento_NFCe_Daruma1 = this.props.daruma.aCFEfetuarPagamento_NFCe_Daruma('05', totalNotaStr);

              if (retorno_aCFEfetuarPagamento_NFCe_Daruma1 != 1) {
                Diversos.putLog(`retorno_aCFEfetuarPagamento_NFCe_Daruma (convenio) error ${retorno_aCFEfetuarPagamento_NFCe_Daruma1}`);
                i++;
                continue;
              }
              break;
            case 2:
              Diversos.putLog(`--> Vai chamar aCFEfetuarPagamento_NFCe_Daruma 01 | ${totalNotaStr}`);

              const retorno_aCFEfetuarPagamento_NFCe_Daruma2 = this.props.daruma.aCFEfetuarPagamento_NFCe_Daruma('01', totalNotaStr);

              if (retorno_aCFEfetuarPagamento_NFCe_Daruma2 != 1) {
                Diversos.putLog(`retorno_aCFEfetuarPagamento_NFCe_Daruma (pix) error ${retorno_aCFEfetuarPagamento_NFCe_Daruma2}`);
                i++;
                continue;
              }
              break;
            case 3:
              Diversos.putLog(
                `--> Vai chamar aCFEfetuarPagamentoCartao_NFCe_Daruma 04 | ${totalNotaStr} | 1 | 04962772000165 | 99 | ${this.props.param.cartaoAutorizacao} | `
              );

              const retorno_aCFEfetuarPagamento_NFCe_Daruma3 = this.props.daruma.aCFEfetuarPagamentoCartao_NFCe_Daruma(
                '04',
                totalNotaStr,
                '1',
                '04962772000165',
                '99',
                String(this.props.param.cartaoAutorizacao).trim(),
                ''
              );

              if (retorno_aCFEfetuarPagamento_NFCe_Daruma3 != 1) {
                Diversos.putLog(`aCFEfetuarPagamentoCartao_NFCe_Daruma (debito) error ${retorno_aCFEfetuarPagamento_NFCe_Daruma3}`);
                i++;
                continue;
              }
              break;
            case 4:
              Diversos.putLog(
                `--> Vai chamar aCFEfetuarPagamentoCartao_NFCe_Daruma 03 | ${totalNotaStr} | 1 | 04962772000165 | 99 | ${this.props.param.cartaoAutorizacao} | `
              );

              const retorno_aCFEfetuarPagamento_NFCe_Daruma4 = this.props.daruma.aCFEfetuarPagamentoCartao_NFCe_Daruma(
                '03',
                totalNotaStr,
                '1',
                '04962772000165',
                '99',
                String(this.props.param.cartaoAutorizacao).trim(),
                ''
              );

              if (retorno_aCFEfetuarPagamento_NFCe_Daruma4 != 1) {
                Diversos.putLog(`aCFEfetuarPagamentoCartao_NFCe_Daruma (credito) error ${retorno_aCFEfetuarPagamento_NFCe_Daruma4}`);
                i++;
                continue;
              }
              break;
            default:
              Diversos.putLog(`--> Vai chamar aCFEfetuarPagamento_NFCe_Daruma 01 | ${totalNotaStr}`);

              const retorno_aCFEfetuarPagamento_NFCe_Daruma = this.props.daruma.aCFEfetuarPagamento_NFCe_Daruma('01', totalNotaStr);

              if (retorno_aCFEfetuarPagamento_NFCe_Daruma != 1) {
                Diversos.putLog(`retorno_aCFEfetuarPagamento_NFCe_Daruma (default) error ${retorno_aCFEfetuarPagamento_NFCe_Daruma}`);
                i++;
                continue;
              }
              break;
          }

          Diversos.putLog(`--> Vai chamar rCFVerificarStatus_NFCe_Daruma`);

          const auxRetornoStatus = this.props.daruma.rCFVerificarStatus_NFCe_Daruma();

          Diversos.putLog(`--> rCFVerificarStatus_NFCe_Daruma: retorno => ${JSON.stringify(auxRetornoStatus)}`);

          Diversos.putLog(`--> Vai chamar tCFEncerrar_NFCe_Daruma`);

          const tmpRetornoFinalizar = this.props.daruma.tCFEncerrar_NFCe_Daruma('');

          Diversos.putLog(`--> tCFEncerrar_NFCe_Daruma | Retorno: ${tmpRetornoFinalizar}`);

          if (
            Number(tmpRetornoFinalizar) === Number(1) ||
            Number(tmpRetornoFinalizar) === Number(2) ||
            Number(tmpRetornoFinalizar) === Number(3) ||
            Number(tmpRetornoFinalizar) === Number(4) ||
            Number(tmpRetornoFinalizar) === Number(5)
          ) {
            Diversos.putLog(`NFCe emitida com sucesso...`);
          } else if (Number(tmpRetornoFinalizar) === Number(-6) || Number(tmpRetornoFinalizar) === Number(-1)) {
            i++;
            continue;
          } else if (Number(tmpRetornoFinalizar) < Number(0)) {
            Diversos.putLog(`tCFEncerrar_NFCe_Daruma ${tmpRetornoFinalizar}`);
            i++;
            continue;
          }

          // BUSCA NUMERO DA ULTIMA NFCE EMITIDA NO INVOICE
          const ptrNumUltNfe = '';

          const resultaInfoNFCeDaruma = this.props.daruma.rRetornarInformacao_NFCe_Daruma(
            'NUM',
            '0',
            '0',
            Number(this.props.adminh.Parametros.CDCAIXA).toFixed(0),
            '',
            '9',
            ptrNumUltNfe
          );

          if (resultaInfoNFCeDaruma == 1) {
            Diversos.putLog(`--> Buscando xml`);

            const xmlRetorno = fs.readFileSync(path.resolve(this.props.adminh.Parametros.PASTANFCE, 'documentosRetorno.xml'), 'utf-8');

            const regex = /<DocNumero>(.+?)<\/DocNumero>/;

            const tmpNumUltNfe = regex.exec(xmlRetorno.toString('utf-8'));

            Diversos.putLog(`--> Retorno localizado: ${JSON.stringify(tmpNumUltNfe)}`);

            const numUltNfe = Number(tmpNumUltNfe[1]);

            if (numUltNfe > numNFCe) {
              numNFCe = numUltNfe;
            }

            Diversos.putLog(`--> Numero atualizado com sucesso`);
          }

          adminh.Parametros.ULTNFCE = numNFCe;

          Diversos.putIni(adminh);

          Diversos.putLog(`NFCe emitida com sucesso, numero: ${adminh.Parametros.ULTNFCE}`);

          fgEmitiu = true;
        }

        if (!fgEmitiu) {
          throw new Error(`NFCe não emitida`);
        }

        resolve(true);
      } catch (e) {
        console.error(e.message);

        Diversos.putLog(`--> Excessao acionada para: ${e.message}. Vai cancelar.`);

        if (fgAbriuNFCe) {
          this.props.daruma.tCFCancelar_NFCe_Daruma('', '', '', '', '');
        }

        Diversos.putLog(`--> Cancelada NFCe.`);

        swal('Atenção', e.message, 'warning');

        this.setState({ hasError: true, hasErrorMsg: e.message });

        reject(e.message);
      }
    });
  }

  private async handleCancelaUltNFCe() {
    return new Promise((resolve, reject) => {
      Diversos.putLog(`Iniciando cancelamento da ultima NFCe`);

      try {
        const retorno = this.props.daruma.tCFCancelar_NFCe_Daruma('', '', '', '', '');

        Diversos.putLog(`Retorno do cancelamento da ultima NFCe: ${retorno}`);

        resolve(true);
      } catch (e) {
        Diversos.putLog(`Falha no cancelamento da ultima NFCe: ${e.message}`);
        reject(e.message);
      }
    });
  }

  private async handlePrinter() {
    Diversos.putLog(`-> Vai imprimir documento na impressora`);

    try {
      let posData = [];

      const numCupons = this.promocaoCheck();

      const numCuponsSuplementos = this.promocaoSuplementoCheck();

      const numCuponsFisherPrice = this.promocaoFisherPriceCheck();

      const numCuponsTelemaco = this.promocaoTelemacoCheck();

      const posOptions = {
        preview: false,
        margin: '0 0 0 0',
        // printerName: 'EPSON',
        // printerName: '',
        timeOutPerLine: 1100,
        pageSize: '80mm', // page size
        silent: true,
        copies: 1,
      };

      for (let i = 0; i < numCupons; i++) {
        posData = [];

        posData.push({
          type: 'text',
          value: `.`,
          style: {},
        });

        posData.push({
          type: 'text',
          value: `<img src="${this.props.adminh.Parametros.PREVENDA_CUPOM}" style="width: 275px; height: 490px; margin: 0px; padding: 0px;"/>`,
          style: {},
        });

        posData.push({
          type: 'text',
          value: `<span style="margin-left: 75px; text-transform: uppercase;">${String(this.props.param.nome).substring(0, 20)}</span>`,
          style: {
            marginTop: '-230px',
            textTrasnform: 'uppercase',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Arial',
            paddingLeft: 67,
          },
        });

        posData.push({
          type: 'text',
          value: `<span style="margin-left: 55px; text-transform: uppercase;">${this.props.param.cpf} (self)</span>`,
          style: {
            marginTop: '14px',
            textTrasnform: 'uppercase',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Arial',
          },
        });

        posData.push({
          type: 'text',
          value: `<span style="margin-left: 85px; text-transform: uppercase;">${this.props.param.celular}</span>`,
          style: {
            marginTop: '14px',
            textTrasnform: 'uppercase',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Arial',
          },
        });

        try {
          await PosPrinter.print(posData, posOptions);
          Diversos.putLog(`Imprimiu cupom(s) da promoção`);
        } catch (e) {
          Diversos.putLog(`Não imprimiu cupom(s) da promoção. Motivo: ${e}`);
        }

        await new Promise((resolve) => {
          setTimeout(() => resolve(true), 500);
        });
      }

      for (let i = 0; i < numCuponsFisherPrice; i++) {
        posData = [];

        posData.push({
          type: 'text',
          value: `.`,
          style: {},
        });

        posData.push({
          type: 'text',
          value: `<img src="${this.props.adminh.Parametros.PREVENDA_CUPOM_2}" style="width: 275px; height: 490px; margin: 0px; padding: 0px;"/>`,
          style: {},
        });

        posData.push({
          type: 'text',
          value: `<span style="margin-left: 75px; text-transform: uppercase;">${String(this.props.param.nome).substring(0, 20)}</span>`,
          style: {
            marginTop: '-230px',
            textTrasnform: 'uppercase',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Arial',
            paddingLeft: 67,
          },
        });

        posData.push({
          type: 'text',
          value: `<span style="margin-left: 55px; text-transform: uppercase;">${this.props.param.cpf} (self)</span>`,
          style: {
            marginTop: '14px',
            textTrasnform: 'uppercase',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Arial',
          },
        });

        posData.push({
          type: 'text',
          value: `<span style="margin-left: 85px; text-transform: uppercase;">${this.props.param.celular}</span>`,
          style: {
            marginTop: '14px',
            textTrasnform: 'uppercase',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Arial',
          },
        });

        try {
          await PosPrinter.print(posData, posOptions);
          Diversos.putLog(`Imprimiu cupom(s) da promoção FISHER-PRICE`);
        } catch (e) {
          Diversos.putLog(`Não imprimiu cupom(s) da promoção FISHER-PRICE. Motivo: ${e}`);
        }

        await new Promise((resolve) => {
          setTimeout(() => resolve(true), 500);
        });
      }

      const cupomTelemacoPath = path.resolve('../../../assets/cupom/cupom-telemaco-05-a-30-set.png');

      for (let i = 0; i < numCuponsTelemaco; i++) {
        posData = [];

        posData.push({
          type: 'text',
          value: `.`,
          style: {},
        });

        posData.push({
          type: 'text',
          value: `<img src="${cupomTelemacoPath}" style="width: 275px; height: 490px; margin: 0px; padding: 0px;"/>`,
          style: {},
        });

        posData.push({
          type: 'text',
          value: `<span style="margin-left: 75px; text-transform: uppercase;">${String(this.props.param.nome).substring(0, 20)}</span>`,
          style: {
            marginTop: '-230px',
            textTrasnform: 'uppercase',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Arial',
            paddingLeft: 67,
          },
        });

        posData.push({
          type: 'text',
          value: `<span style="margin-left: 55px; text-transform: uppercase;">${this.props.param.cpf} (self)</span>`,
          style: {
            marginTop: '14px',
            textTrasnform: 'uppercase',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Arial',
          },
        });

        posData.push({
          type: 'text',
          value: `<span style="margin-left: 85px; text-transform: uppercase;">${this.props.param.celular}</span>`,
          style: {
            marginTop: '14px',
            textTrasnform: 'uppercase',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Arial',
          },
        });

        try {
          await PosPrinter.print(posData, posOptions);
          Diversos.putLog(`Imprimiu cupom(s) da promoção TELEMACO`);
        } catch (e) {
          Diversos.putLog(`Não imprimiu cupom(s) da promoção TELEMACO. Motivo: ${e}`);
        }

        await new Promise((resolve) => {
          setTimeout(() => resolve(true), 500);
        });
      }

      if (this.state.msgPrint) {
        posData = [
          {
            type: 'text',
            value: `<div style="white-space: pre-line; padding: 5px;">${this.state.msgPrint}</div>`,
            style: {
              fontWeight: '400',
              textAlign: 'left',
              fontSize: '12px',
              fontFamily: 'Arial',
            },
          },
        ];

        await PosPrinter.print(posData, posOptions);
      }

      if (this.props.param.bufferPrinter) {
        posData = [
          {
            type: 'text',
            value: `<div style="white-space: pre-line; padding: 5px;">${this.props.param.bufferPrinter}</div>`,
            style: {
              fontWeight: '400',
              textAlign: 'left',
              fontSize: '12px',
              fontFamily: 'Arial',
            },
          },
        ];

        await PosPrinter.print(posData, posOptions);
      }

      Diversos.putLog(`Comprovantes impresso com sucesso`);
    } catch (e) {
      console.error(e);
      Diversos.putLog(`Comprovantes não impresso ${JSON.stringify(e)}`);
    }

    this.props.setParam({ ...this.props.param, bufferPrinter: '' });

    return true;
  }

  private async handleControlE() {
    Diversos.putLog('Verificando Control + E');

    if (
      !this.props.param.controlE_DtEntrega ||
      !moment(this.props.param.controlE_DtEntrega, 'DD/MM/YYYY').isValid() ||
      !this.props.param.controlE_HrEntrega
    ) {
      Diversos.putLog('Venda sem Control + E');
      return '';
    }

    Diversos.putLog('Control + E transmitindo...');

    try {
      const param = {
        filial: this.props.adminh.Parametros.CDFIL,
        caixa: this.props.adminh.Parametros.CDCAIXA,
        nrnota: this.props.adminh.Parametros.ULTNFCE,
        vendedor: this.props.param.vendedor,
        cliente: this.props.param.cpf,
        prevenda: this.props.param.prevenda,
        dtentrega: this.props.param.controlE_DtEntrega,
        hrentrega: this.props.param.controlE_HrEntrega,
        tpentrega: this.props.param.controlE_formaent,
        produtos: this.props.cart.produtos,
      };

      Diversos.putLog(`Control + E | Payload: ${JSON.stringify(param)}`);

      const { data, status } = await this.apiv2.post(
        '/selfcheckout/controlE',
        param,
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImlhdCI6MTY5NTc0Nzk5N30.2dymofjo9Cx1i1GfINcivkcXweTI2FKyOGu5ALOH2PY'
      );

      Diversos.putLog(`Control + | Retorno Status: ${status} | Retorno Data: ${JSON.stringify(data)}`);

      if (!data || !data.status) {
        throw new Error(data.msg);
      }

      Diversos.putLog('Control + E retorno com sucesso');

      const posOptions = {
        preview: false,
        margin: '0 0 0 0',
        // printerName: 'EPSON',
        // printerName: '',
        timeOutPerLine: 1100,
        pageSize: '80mm', // page size
        silent: true,
        copies: 1,
      };

      const posData = [
        {
          type: 'text',
          value: `<div style="white-space: pre-line; padding: 5px;">${data.texto}</div>`,
          style: {
            fontWeight: '400',
            textAlign: 'left',
            fontSize: '12px',
            fontFamily: 'Arial',
          },
        },
      ];

      await PosPrinter.print(posData, posOptions);

      return data.texto;
    } catch (e) {
      Diversos.putLog(`Problemas ao gravar Control + E: ${e.message}`);
      return false;
    }
  }

  private getTotalDesconto() {
    let total = 0.0;

    for (let i = 0; i < this.props.cart.produtos.length; i++) {
      if (Number(this.props.cart.produtos[i].preco) > 0 && this.props.cart.produtos[i].preco < this.props.cart.produtos[i].pmc) {
        const desconto = this.props.cart.produtos[i].pmc - this.props.cart.produtos[i].preco;

        if (desconto > 0) {
          total += Number(this.props.cart.produtos[i].qtd) * Number(desconto);
        }
      }
    }

    return total;
  }

  private getTotal() {
    let total = 0.0;

    for (let i = 0; i < this.props.cart.produtos.length; i++) {
      const preco = this.props.cart.produtos[i].pmc;

      // if (
      //   Number(this.props.cart.produtos[i].preco) > 0 &&
      //   Number(this.props.cart.produtos[i].preco) < preco
      // ) {
      //   preco = this.props.cart.produtos[i].preco;
      // }

      total += Number(this.props.cart.produtos[i].qtd) * Number(preco);
    }

    return total;
  }

  private async gravaDbfVenda(horarioServidor: any) {
    try {
      Diversos.putLog(`-> Inicio gravação logvenda no DBF`);

      const adminh = Diversos.getIni();

      const ultvenda = parseInt(adminh.Parametros.ULTVENDA, 10) + 1;

      Diversos.putIni({
        ...adminh,
        Parametros: {
          ...adminh.Parametros,
          ULTVENDA: ultvenda,
        },
      });

      const paramVenda = {
        ultvenda,
        horarioServidor,
        clienteNome: this.props.param.nome,
        vendedor: this.props.param.vendedor,
        prevenda: this.props.param.prevenda,
        produtos: this.props.cart.produtos,
        cpfNaNota: Diversos.getnums(this.props.param.cpfNaNota),
        cpfClube: Diversos.getnums(this.props.param.cpfClube),
        totalBruto: parseFloat(Number(this.getTotal()).toFixed(2)),
        totalDesconto: parseFloat(Number(this.getTotalDesconto()).toFixed(2)),
        totalLiquido: parseFloat(Number(this.getTotal() - this.getTotalDesconto()).toFixed(2)),
        formapg: this.props.param.formapg,
        appConvenio: this.props.param.appConvenio,
        appConvenioCodigo: this.props.param.appConvenioCodigo,
        appConvenioUsuario: this.props.param.appConvenioUsuario,
        cartaoNome: this.props.param.cartaoNome,
        cartaoNsu: this.props.param.cartaoNsu,
        parcelas: this.props.param.formapgParcela,
        avaliacao: this.props.param.avaliacao,
      };

      if (!this.props.adminh.Trier || !this.props.adminh.Trier.URL || !this.props.adminh.Trier.Token) {
        await electron.ipcRenderer.sendSync('set-venda', paramVenda);
      } else {
        Diversos.putLog(`-> Transmitindo venda para Trier`);
        await electron.ipcRenderer.sendSync('trier-set-venda', paramVenda);
        Diversos.putLog(`-> Finalizou Trier`);
      }

      Diversos.putLog(`-> Terminou gravação logvenda no DBF`);
    } catch (e) {
      console.error(e.message);

      Diversos.putLog(`-> Gravação DBF da venda Falhou ****** ${e.message}`);
    }

    return true;
  }

  private async gravaFinanceiro(horarioServidor: any) {
    try {
      Diversos.putLog(`-> Inicio gravação tabelão do financeiro`);

      const adminh = Diversos.getIni();

      const ultvenda = adminh.Parametros.ULTVENDA;

      let formapgLabel = '';
      let formapgPaymentId = '';
      let formapgRota = '';

      switch (this.props.param.formapg) {
        case 1:
          formapgLabel = 'Compre+Rap';
          formapgRota = 'Compre+Rap';
          formapgPaymentId = this.props.param.compreRapidoPedido;
          break;
        case 2000:
          formapgLabel = 'Pix';
          formapgRota = 'Sicoob';
          formapgPaymentId = this.props.param.pixTxid;
          break;
        case 2:
          formapgLabel = 'Pix';
          formapgRota = this.props.param.cartaoRota;
          formapgPaymentId = this.props.param.cartaoAutorizacao;
          break;
        case 3:
          formapgLabel = 'Debito';
          formapgRota = this.props.param.cartaoRota;
          formapgPaymentId = this.props.param.cartaoAutorizacao;
          break;
        case 4:
          formapgLabel = 'Credito';
          formapgRota = this.props.param.cartaoRota;
          formapgPaymentId = this.props.param.cartaoAutorizacao;
          break;
        default:
          formapgLabel = 'Indefinido';
          formapgPaymentId = '';
          break;
      }

      const param = {
        LOJA: adminh.Parametros.CDFIL,
        DATA: moment(horarioServidor, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD'),
        HORA: moment(horarioServidor, 'YYYY-MM-DD HH:mm:ss').format('HH:mm:ss'),
        ORIGEM: 'SELF',
        DOCUMENTO: ultvenda,
        FORMAPG: formapgLabel,
        BANDEIRA: this.props.param.cartaoNome, // badeira
        PARCELAS: this.props.param.formapgParcela,
        VALOR: parseFloat(Number(this.getTotal() - this.getTotalDesconto()).toFixed(2)),
        NSU: this.props.param.cartaoNsu,
        ROTA: formapgRota,
        OPERCX: '999', // operador de caixa
        TID: '',
        ECF: adminh.Parametros.CDCAIXA, // ECF
        PBM: '', // PBM
        STATUS_SITE: 'F',
        PAYMENTID: formapgPaymentId,
        NRAUTORIZACAO: this.props.param.cartaoAutorizacao,
      };

      const { data } = await this.apiv2.post(`/financeiro`, param, adminh.Parametros.API_V2_TOKEN);

      if (!data.status) {
        throw new Error(data.msg);
      }

      Diversos.putLog(`-> Tabela do financeiro gravada com sucesso`);
    } catch (e) {
      Diversos.putLog(`-> Não foi possível gravar na tabela do financeiro: ${e.message}`);

      return false;
    }

    return true;
  }

  private promocaoCheck() {
    let auxTotal = 0;
    Diversos.putLog('Vai verificar promoção para imprimir cupom');
    if (moment().utcOffset('-03:00').format('YYYYMMDD') < '20240130' || moment().utcOffset('-03:00').format('YYYYMMDD') > '20240331') {
      Diversos.putLog('Fora da validade da promoção');
      return 0;
    }

    for (let i = 0; i < this.props.cart.produtos.length; i++) {
      if (Number(this.props.cart.produtos[i].grupo) === Number(46)) {
        let precoFinal = Number(this.props.cart.produtos[i].pmc);

        if (this.props.cart.produtos[i].preco && Number(this.props.cart.produtos[i].pmc) > Number(0)) {
          precoFinal = Number(this.props.cart.produtos[i].preco);
        }

        auxTotal += Number(this.props.cart.produtos[i].qtd) * precoFinal;
      }
    }

    const totalCupom = Math.floor(auxTotal / 40);

    Diversos.putLog(`Total de cupons calculados: ${totalCupom}`);

    return totalCupom;
  }

  private promocaoSuplementoCheck() {
    let auxTotal = 0;
    Diversos.putLog('Vai verificar promoção SUPLEMENTOS MKT09 para imprimir cupom');
    if (moment().utcOffset('-03:00').format('YYYYMMDD') < '20240401' || moment().utcOffset('-03:00').format('YYYYMMDD') > '20240430') {
      Diversos.putLog('Fora da validade da promoção');
      return 0;
    }

    for (let i = 0; i < this.props.cart.produtos.length; i++) {
      if (String(this.props.cart.produtos[i].mkt09).toUpperCase() === 'S') {
        let precoFinal = Number(this.props.cart.produtos[i].pmc);

        if (this.props.cart.produtos[i].preco && Number(this.props.cart.produtos[i].pmc) > Number(0)) {
          precoFinal = Number(this.props.cart.produtos[i].preco);
        }

        auxTotal += Number(this.props.cart.produtos[i].qtd) * precoFinal;
      }
    }

    const totalCupom = Math.floor(auxTotal / 40);

    Diversos.putLog(`Total de cupons calculados: ${totalCupom}`);

    return totalCupom;
  }

  private promocaoFisherPriceCheck() {
    Diversos.putLog('Vai verificar promoção FISHER-PRICE para imprimir cupom');

    if (moment().utcOffset('-03:00').format('YYYYMMDD') < '20240208' || moment().utcOffset('-03:00').format('YYYYMMDD') > '20240331') {
      Diversos.putLog('Fora da validade da promoção FISHER-PRICE');
      return 0;
    }

    for (let i = 0; i < this.props.cart.produtos.length; i++) {
      if ([60067, 60065, 60064, 59131, 59132, 59130, 59129].includes(this.props.cart.produtos[i].codigo)) {
        Diversos.putLog(`Achou um produto ${this.props.cart.produtos[i].codigo} da promoção, vai liberar cupom.`);
        return 1;
      }
    }

    return 0;
  }

  private promocaoTelemacoCheck() {
    let auxTotal = 0;

    Diversos.putLog('Vai verificar promoção de Telemaco para imprimir cupom');

    if (Number(this.props.adminh.Parametros.CDFIL) !== Number(32)) {
      Diversos.putLog('Cupom somente para loja Telemaco');
      return 0;
    }

    if (moment().utcOffset('-03:00').format('YYYYMMDD') < '20240905' || moment().utcOffset('-03:00').format('YYYYMMDD') > '20240930') {
      Diversos.putLog('Fora da validade da promoção');
      return 0;
    }

    for (let i = 0; i < this.props.cart.produtos.length; i++) {
      if (![1, 2, 3].includes(Number(this.props.cart.produtos[i].tipogru))) {
        let precoFinal = Number(this.props.cart.produtos[i].pmc);

        if (this.props.cart.produtos[i].preco && Number(this.props.cart.produtos[i].pmc) > Number(0)) {
          precoFinal = Number(this.props.cart.produtos[i].preco);
        }

        auxTotal += Number(this.props.cart.produtos[i].qtd) * precoFinal;
      }
    }

    const totalCupom = Math.floor(auxTotal / 50);

    Diversos.putLog(`Total de cupons calculados: ${totalCupom}`);

    return totalCupom;
  }

  private handleAvaliacao(nota = 0) {
    this.props.setParam({
      ...this.props.param,
      avaliacao: nota,
    });

    this.setState({ avaliacao: nota });

    this.audioCaixaSucesso.play();
  }

  render() {
    if (this.state.avaliacao !== null) {
      return (
        <Grid
          container
          sx={{
            height: '100vh',
            width: '100vw',
            flex: 1,
          }}
        >
          <Grid
            item
            xs={12}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div className="tela-finalizacao">
              <img src={Logo} alt="CallFarma Logo" />

              <div className="rodape">
                <div className="sucesso">
                  <img src={LogoJoia} alt="CallFarma Joia" />
                </div>
                <div className="impressao">
                  Obrigado!
                  <span>Por comprar conosco, volte sempre!</span>
                </div>
              </div>
            </div>
          </Grid>
        </Grid>
      );
    }

    return (
      <Grid
        container
        sx={{
          height: '100vh',
          width: '100vw',
          flex: 1,
          backgroundColor: this.state.hasError ? '#0376b3' : green[400],
          // backgroundColor: this.state.hasError ? red[400] : green[400],
        }}
      >
        <Grid
          item
          xs={12}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!this.state.hasError ? (
            <div className="tela-aguardando-cupom">
              <h3>AVALIE SUA EXPERIÊNCIA</h3>
              <div className="emojis">
                <button
                  type="button"
                  onClick={() => this.handleAvaliacao(1)}
                  className={this.props.param.avaliacao === 1 ? 'emoji-selected' : ''}
                >
                  <img src={Emoji1} alt="emoji-1" />
                  <h4>PÉSSIMA</h4>
                </button>
                <button
                  type="button"
                  onClick={() => this.handleAvaliacao(2)}
                  className={this.props.param.avaliacao === 2 ? 'emoji-selected' : ''}
                >
                  <img src={Emoji2} alt="emoji-2" />
                  <h4>RUIM</h4>
                </button>
                <button
                  type="button"
                  onClick={() => this.handleAvaliacao(3)}
                  className={this.props.param.avaliacao === 3 ? 'emoji-selected' : ''}
                >
                  <img src={Emoji3} alt="emoji-3" />
                  <h4>BOA</h4>
                </button>
                <button
                  type="button"
                  onClick={() => this.handleAvaliacao(4)}
                  className={this.props.param.avaliacao === 4 ? 'emoji-selected' : ''}
                >
                  <img src={Emoji4} alt="emoji-4" />
                  <h4>ÓTIMA</h4>
                </button>
              </div>

              <div className="rodape">
                <div
                  className="sucesso"
                  onClick={() =>
                    this.props.setParam({
                      ...this.props.param,
                      avaliacao: 0,
                    })
                  }
                >
                  <FontAwesomeIcon icon={faCheckCircle} />
                  Compra Efetivada
                </div>
                <div className="impressao">
                  Aguarde a impressão do cupom fiscal
                  <FontAwesomeIcon icon={faPrint} />
                </div>
              </div>
            </div>
          ) : (
            <div className="tela-aguardando-cupom">
              <div
                className="rodape"
                style={{
                  flexDirection: 'column',
                  backgroundColor: 'white',
                  borderRadius: 15,
                  padding: 40,
                }}
              >
                <div
                  className="error-amigavel"
                  onClick={() => {
                    this.props.setParam({
                      ...this.props.param,
                      step: 2,
                      stepError: false,
                    });
                  }}
                >
                  <FontAwesomeIcon icon={faTimesCircle} />
                  OPS! <br /> algo deu errado...
                </div>
                <div className="impressao-amigavel" style={{ marginTop: 20 }}>
                  {this.state.hasErrorMsg ? this.state.hasErrorMsg : `Por favor tente novamente`}
                </div>
                <div>
                  <Button
                    color="primary"
                    size="large"
                    variant="contained"
                    sx={{
                      color: 'white',
                      mt: 2,
                      height: 70,
                      width: 350,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem',
                    }}
                    onClick={() => {
                      this.props.setParam({
                        ...this.props.param,
                        step: 2,
                        stepError: false,
                        stepErrorMsg: '',
                        formapgParcela: 1,
                        formapg: 0,
                      });
                    }}
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Grid>
      </Grid>
    );
  }
}

const mapStateToProps = (state: ApplicationState) => ({
  param: state.param.data,
  cart: state.cart.data,
});

const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators({ ...ParamActions, ...CartActions }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Step5);
