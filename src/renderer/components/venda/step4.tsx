import React from 'react';
import { Redirect, Link } from 'react-router-dom';
import { TextField, Button, Grid, CircularProgress } from '@mui/material';
import { red } from '@mui/material/colors';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faSpinner, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import swal from '@sweetalert/with-react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import path from 'path';
import Api from '../../services/api';
import ApiV2 from '../../services/apiv2';
import { ApplicationState } from '../../services/store';
import { Param } from '../../services/store/ducks/param/types';
import * as ParamActions from '../../services/store/ducks/param/actions';
import { Cart } from '../../services/store/ducks/cart/types';
import * as CartActions from '../../services/store/ducks/cart/actions';
import { Diversos } from '../../services/diversos';
import CashbackLogo from '../../../../assets/cashback-logo.png';
import MyStepper from '../Stepper';

const AudioCaixa = '../../../assets/audio/instrucoes-pagamento.mp3';

const fs = require('fs');
const remote = require('@electron/remote');

const ini = remote.require('ini');

interface StateProps {
  param: Param;
  cart: Cart;
}

interface DispatchProps {
  setParam(param: Param): void;
  getTotal(): number;
  getTotalFinal(): number;
}

interface OwnProps {
  adminh: any;
  db: any;
}

type Props = StateProps & DispatchProps & OwnProps;

class Step4 extends React.Component<Props> {
  api: any = null;

  apiv2: any = null;

  state: any = {};

  audioCaixa: any = null;

  constructor(props) {
    super(props);

    this.api = new Api();

    this.apiv2 = new ApiV2();

    this.inputRef = React.createRef();

    this.audioCaixa = new Audio(AudioCaixa);

    this.state = {
      formaPgStep: 1,
      fgProcessing: false,
      pix: {},
      formapgStep: null,
      fgCanceling: false,
      tefMensagem: '',
      qrcode: '',
      caixaIni: null,
    };
  }

  async componentDidMount() {
    if (!this.props.adminh.Trier || !this.props.adminh.Trier.URL || !this.props.adminh.Trier.Token) {
      try {
        Diversos.putLog(`-> Vai tratar cadastro do cliente`);

        await this.handleCadastro();
      } catch (e) {
        Diversos.putLog(`-> Problemas ao tratar cadastro do cliente: ${e.message}`);
      }

      try {
        const fileCaixaIni = path.resolve(`${this.props.adminh.Parametros.TEF}/CAIXA.INI`);

        if (fs.existsSync(fileCaixaIni)) {
          let caixaIni = ini.parse(fs.readFileSync(fileCaixaIni, 'utf-8'));
          this.setState({ caixaIni: caixaIni });
        }
      } catch (e) {
        Diversos.putLog(`-> Não foi possível ler c:/tef/caixa.ini: ${e.message}`);
      }
    }

    Diversos.putLog(`-> Forma de Pagamento: ${this.props.param.formapg} selecionada. Perguntando sobre CPF na Nota e Clube`);

    this.audioCaixa.play();

    setTimeout(() => this.handleFormaPg(), 500);
  }

  private async handleCadastro() {
    if (!this.props.param.cpfClube && !this.props.param.cpfNaNota) {
      return true;
    }

    if (!Diversos.validateCPF(this.props.param.cpf)) {
      return true;
    }

    try {
      const { data } = await this.api.post(`/Cliente/consulta`, {
        cpf: this.props.param.cpf,
      });

      if (data.status === false || data.fgConta === false) {
        if (data.fgCadastro === true) {
          this.props.setParam({
            ...this.props.param,
            nome: data.cliente.nome,
            celular: Diversos.maskTelefone(data.cliente.telefone1),
          });
        } else {
          const response2 = await this.api.post('/Cliente/criaCPF', {
            cpf: Diversos.policia(this.props.param.cpf),
          });

          if (!response2.data.status) {
            throw new Error('CPF já cadastrado');
          }

          this.props.setParam({
            ...this.props.param,
            nome: response2.data.cliente.NOME,
            celular: '',
          });
        }
      } else if (data.status === true) {
        this.props.setParam({
          ...this.props.param,
          nome: data.cliente.nome,
          celular: Diversos.maskTelefone(data.cliente.telefone1),
        });
      }
    } catch (e) {
      Diversos.putLog(`Erro ao tratar cadastro do cliente: ${e.message}`);
    }

    return true;
  }

  private async handleFormaPg() {
    if (this.props.param.step === 4 && !this.state.fgProcessing) {
      switch (this.state.formaPgStep) {
        case 1:
          switch (this.props.param.formapg) {
            // TRATA CONVENIO
            case 1:
              let ultCompreRapido = 1;

              if (this.props.adminh.Parametros.ULTCOMPRERAPIDO) {
                ultCompreRapido = this.props.adminh.Parametros.ULTCOMPRERAPIDO;
              }

              const tmpProdutos = [];

              for (let i = 0; i < this.props.cart.produtos.length; i++) {
                let tmpPreco = this.props.cart.produtos[i].pmc;

                if (this.props.cart.produtos[i].preco > 0 && this.props.cart.produtos[i].preco < tmpPreco) {
                  tmpPreco = this.props.cart.produtos[i].preco;
                }

                tmpProdutos.push({
                  produto: this.props.cart.produtos[i].codigo,
                  qtd: this.props.cart.produtos[i].qtd,
                  valor: tmpPreco,
                });
              }

              const param = {
                cpf: this.props.param.cpf,
                valor: this.getTotal(),
                loja: this.props.adminh.Parametros.CDFIL,
                nrnfce: this.props.adminh.Parametros.CDCAIXA,
                produtos: tmpProdutos,
                prepedido: ultCompreRapido,
              };

              try {
                const { data } = await this.api.post(`/Pedido/compraRapidaNovo`, param);

                if (!data.status) {
                  throw new Error(data.msg);
                }

                this.setState({
                  formaPgStep: 2,
                });

                let hasRetorno = false;

                do {
                  const paramLeitura = {
                    cpf: this.props.param.cpf,
                    pedido: data.pedido,
                  };

                  try {
                    const response1 = await this.api.post(`/Pedido/compraRapidaBusca`, paramLeitura);

                    if (!response1.data.status) {
                      throw new Error(data.msg);
                    }

                    this.setState({
                      formaPgStep: 3,
                    });

                    if (parseInt(response1.data.pedido.status, 10) === 3) {
                      hasRetorno = true;
                      let appConvenio = false;
                      let appConvenioCodigo = '';
                      let appConvenioUsuario = '';

                      if (String(response1.data.pedido.formapg).toLowerCase() === 'v') {
                        appConvenio = true;
                        appConvenioCodigo = response1.data.pedido.empresa_convenio;
                        appConvenioUsuario = response1.data.pedido.conveniado;
                      }

                      this.props.setParam({
                        ...this.props.param,
                        step: 5,
                        appConvenio,
                        appConvenioCodigo,
                        appConvenioUsuario,
                        compreRapidoPedido: response1.data.pedido.pedido,
                      });
                    } else if (parseInt(response1.data.pedido.status, 10) === 8) {
                      hasRetorno = true;
                      this.props.setParam({
                        ...this.props.param,
                        step: 5,
                        stepError: true,
                        compreRapidoPedido: '',
                      });
                    } else if (parseInt(response1.data.pedido.status, 10) > 3) {
                      hasRetorno = true;
                      this.props.setParam({
                        ...this.props.param,
                        step: 5,
                        stepError: true,
                        compreRapidoPedido: '',
                      });
                    }
                  } catch (e) {
                    console.error(e);
                  }

                  if (!hasRetorno) {
                    await new Promise((resolve) => setTimeout(resolve, 1000 * 5));
                  }
                } while (!hasRetorno);
              } catch (e) {
                console.error(e.message);
              }

              break;
            // TRATA PIX VIA WEB
            case 2000:
              const paramPix = {
                cpf: this.props.param.cpf,
                valor: this.getTotal(),
                cdfil: this.props.adminh.Parametros.CDFIL,
                cdcaixa: this.props.adminh.Parametros.CDCAIXA,
              };

              try {
                const { data } = await this.apiv2.post(`/caixa/pix`, paramPix, this.props.adminh.Parametros.API_V2_TOKEN);

                if (!data.status) {
                  throw new Error(data.msg);
                }

                this.setState({
                  formaPgStep: 2,
                });

                let hasRetorno = false;

                do {
                  try {
                    const response1 = await this.apiv2.get(`/caixa/pix/${data.msg.id}`, this.props.adminh.Parametros.API_V2_TOKEN);

                    if (!response1.data.status) {
                      throw new Error(data.msg);
                    }

                    this.setState({
                      formaPgStep: 3,
                      pix: data.msg,
                    });

                    if (response1.data.msg.status === 'CONCLUIDA') {
                      hasRetorno = true;
                      this.props.setParam({
                        ...this.props.param,
                        step: 5,
                        pixTxid: response1.data.msg.txid,
                        pixEndtoEnd: response1.data.msg.endtoendid,
                      });
                    } else if (response1.data.msg.status === 'CANCELADO') {
                      hasRetorno = true;

                      this.props.setParam({
                        ...this.props.param,
                        step: 5,
                        stepError: true,
                        pixTxid: '',
                        pixEndtoEnd: '',
                      });
                    }
                  } catch (e) {
                    console.error(e);
                  }

                  if (!hasRetorno) {
                    await new Promise((resolve) => setTimeout(resolve, 1000 * 5));
                  }
                } while (!hasRetorno);
              } catch (e) {
                console.error(e.message);
                swal(`Atenção`, 'Não foi possível gerar QR Code para pagamento, por favor tente novamente.', 'warning');
                this.props.setParam({
                  ...this.props.param,
                  step: 3,
                  stepError: false,
                  pixTxid: '',
                  pixEndtoEnd: '',
                });
              }

              break;
            // TRATA DEBITO, CREDITO e PIX VIA TEF
            case 2:
            case 3:
            case 4:
              this.setState({
                fgProcessing: true,
                formapgStep: 'Siga as instruções abaixo',
              });

              if (this.props.adminh.Trier && this.props.adminh.Trier.URL && this.props.adminh.Trier.Token) {
                setTimeout(() => {
                  this.props.setParam({
                    ...this.props.param,
                    bufferPrinter: '*** EM HOMOLOGAÇÃO ***',
                    cartaoNome: 'Teste',
                    cartaoRota: 'Trier',
                    cartaoNsu: '123',
                    cartaoAutorizacao: '456',
                    step: 5,
                    stepError: false,
                  });
                }, 1000 * 3);
              } else {
                let param1 = 0; // 1 - credito, 2- debito, 3- pix, 8 - cancela transação, 9 - confirma transação

                if (this.props.param.formapg === 3) param1 = 2; // debito
                else if (this.props.param.formapg === 4) param1 = 1; // credito
                else param1 = 3; // pix

                const param2 = this.getTotal(); // valor transação * 100 15 digitos
                const param3 = 123; // 9 digitos numero da nfe
                const param4 = Number(this.props.param.formapgParcela) > 0 ? this.props.param.formapgParcela : 1; // numero de parcelas 2 digitos

                Diversos.putLog(`Vai gravar dados para o TEF... Forma Pg.: ${param1} | Valor: ${param2} | Parcela: ${param4}`);

                // VERIFICA SE EXISTE CANCELATEF.TXT PARA LIMPAR
                if (fs.existsSync(path.resolve(`${this.props.adminh.Parametros.TEF}/cancelatef.txt`))) {
                  fs.unlinkSync(path.resolve(`${this.props.adminh.Parametros.TEF}/cancelatef.txt`));
                }

                // VERIFICA SE EXISTE RETORNO.TXT PARA LIMPAR
                if (fs.existsSync(path.resolve(`${this.props.adminh.Parametros.TEF}/retorno.txt`))) {
                  fs.unlinkSync(path.resolve(`${this.props.adminh.Parametros.TEF}/retorno.txt`));
                }

                // VERIFICA SE EXISTE ENVIO.TXT PARA LIMPAR
                if (fs.existsSync(path.resolve(`${this.props.adminh.Parametros.TEF}/envio.txt`))) {
                  fs.unlinkSync(path.resolve(`${this.props.adminh.Parametros.TEF}/envio.txt`));
                }

                // VERIFICA SE EXISTE MENSAGEM
                if (fs.existsSync(path.resolve(`${this.props.adminh.Parametros.TEF}/mensagem.txt`))) {
                  fs.unlinkSync(path.resolve(`${this.props.adminh.Parametros.TEF}/mensagem.txt`));
                  this.setState({ tefMensagem: '' });
                }

                // VERIFICA SE EXISTE QRCODE
                if (
                  this.state.caixaIni &&
                  this.state.caixaIni.TEF &&
                  String(this.state.caixaIni.TEF.QRCodeEmTela).trim().toLowerCase() === 's'
                ) {
                  if (fs.existsSync(path.resolve(`${this.props.adminh.Parametros.TEF}/qrcode.txt`))) {
                    fs.unlinkSync(path.resolve(`${this.props.adminh.Parametros.TEF}/qrcode.txt`));
                    this.setState({ qrcode: '' });
                  }
                }

                // GRAVA ARQUIVO PARA O SERVER TEF INICIAR A TRANSACAO
                try {
                  fs.writeFileSync(
                    path.resolve(`${this.props.adminh.Parametros.TEF}/envio.txt`),
                    `${param1}${String(Math.round(Number(param2) * 100)).padStart(15, '0')}${String(param3).padStart(9, '0')}${String(
                      param4
                    ).padStart(2, '0')}`,
                    'utf8'
                  );
                } catch (e) {
                  console.error(e.message);
                  swal('Atenção', `Não foi possível iniciar transação do cartão. ${e.message}`, 'warning');
                  this.setState({ fgProcessing: false });
                  return false;
                }

                let hasRetorno = false;

                do {
                  if (
                    this.state.caixaIni &&
                    this.state.caixaIni.TEF &&
                    String(this.state.caixaIni.TEF.QRCodeEmTela).trim().toLowerCase() === 's'
                  ) {
                    if (this.props.param.formapg === 2) {
                      if (fs.existsSync(path.resolve(`${this.props.adminh.Parametros.TEF}/qrcode.txt`))) {
                        const qrcode = fs.readFileSync(path.resolve(`${this.props.adminh.Parametros.TEF}/qrcode.txt`), {
                          encoding: 'utf8',
                          flag: 'r',
                        });

                        let tmpQrCode = String(qrcode).trim();

                        tmpQrCode = tmpQrCode.substring(0, tmpQrCode.length - 1);

                        this.setState({ qrcode: `${tmpQrCode}` });
                      } else {
                        console.log('qrcode.txt não existe ');
                      }
                    }
                  }

                  if (fs.existsSync(path.resolve(`${this.props.adminh.Parametros.TEF}/mensagem.txt`))) {
                    const mensagem = fs.readFileSync(path.resolve(`${this.props.adminh.Parametros.TEF}/mensagem.txt`), {
                      encoding: 'utf8',
                      flag: 'r',
                    });

                    this.setState({ tefMensagem: mensagem });
                  }

                  if (fs.existsSync(path.resolve(`${this.props.adminh.Parametros.TEF}/retorno.txt`))) {
                    this.setState({
                      formapgStep: 'Processando pagamento, aguarde...',
                    });

                    const retornoFile = fs.readFileSync(path.resolve(`${this.props.adminh.Parametros.TEF}/retorno.txt`), {
                      encoding: 'utf8',
                      flag: 'r',
                    });

                    if (String(retornoFile).trim() !== '') {
                      fs.unlinkSync(path.resolve(`${this.props.adminh.Parametros.TEF}/retorno.txt`));

                      hasRetorno = true;

                      const tmpRetornoFile = retornoFile.split('\n');

                      if (String(tmpRetornoFile[0]).toUpperCase().indexOf('NOK') > -1) {
                        if (fs.existsSync(path.resolve(`${this.props.adminh.Parametros.TEF}/envio.txt`))) {
                          fs.unlinkSync(path.resolve(`${this.props.adminh.Parametros.TEF}/envio.txt`));
                        }

                        if (this.state.fgCanceling) {
                          this.setState(
                            {
                              fgCanceling: false,
                            },
                            () => {
                              this.props.setParam({
                                ...this.props.param,
                                step: 2,
                                stepError: false,
                                stepErrorMsg: this.state.tefMensagem,
                              });
                            }
                          );
                        } else {
                          this.props.setParam({
                            ...this.props.param,
                            // step: 5,
                            step: 2,
                            stepError: true,
                            stepErrorMsg: this.state.tefMensagem,
                          });
                        }

                        if (fs.existsSync(path.resolve(`${this.props.adminh.Parametros.TEF}/mensagem.txt`))) {
                          fs.unlinkSync(path.resolve(`${this.props.adminh.Parametros.TEF}/mensagem.txt`));
                          this.setState({ tefMensagem: '' });
                        }
                      } else {
                        const dadosTransacao = tmpRetornoFile[1];

                        Diversos.putLog(`Capturando retorno do TEF: ${dadosTransacao}`);

                        const tmpRetornoTef = dadosTransacao.split(';');

                        this.props.setParam({
                          ...this.props.param,
                          bufferPrinter: String(Array.from(tmpRetornoFile.slice(2)).join('\n')).toString(),
                          cartaoNome: tmpRetornoTef[0],
                          cartaoRota: tmpRetornoTef[2],
                          cartaoNsu: tmpRetornoTef[3],
                          cartaoAutorizacao: tmpRetornoTef[4],
                          step: 5,
                          stepError: false,
                        });

                        if (fs.existsSync(path.resolve(`${this.props.adminh.Parametros.TEF}/mensagem.txt`))) {
                          fs.unlinkSync(path.resolve(`${this.props.adminh.Parametros.TEF}/mensagem.txt`));
                          this.setState({ tefMensagem: '' });
                        }
                      }
                    }
                  }

                  if (!hasRetorno) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                  }
                } while (!hasRetorno);
              }

              this.setState({ fgProcessing: false });
              break;

            default:
              this.setState({ formaPgStep: 9 });
              break;
          }
          break;
        default:
          this.setState({ formaPgStep: 9 });
          break;
      }
    }

    return true;
  }

  private getTotalBruto() {
    let total = 0.0;

    for (let i = 0; i < this.props.cart.produtos.length; i++) {
      const preco = this.props.cart.produtos[i].pmc;

      total += Number(this.props.cart.produtos[i].qtd) * Number(preco);
    }

    return total;
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

  render() {
    return (
      <Grid container sx={{ height: '100vh', width: '100vw', flex: 1 }}>
        <Grid
          item
          xs={4}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          <div className="tela-pagamento-resumo">
            <p>
              TOTAL: <span>{Diversos.maskPreco(this.getTotalBruto())}</span>
            </p>
            <hr />
            <p>
              Você economizou: <span>{Diversos.maskPreco(this.getTotalBruto() - this.getTotal())}</span>
            </p>
            <hr />
            <p>
              <img src={CashbackLogo} alt="CashBack" /> <span>R$ 0,00</span>
            </p>
            <hr />
            <p>
              TOTAL COM DESCONTO
              <span>{Diversos.maskPreco(this.getTotal())}</span>
            </p>
          </div>
          {![3, 4].includes(this.props.param.formapg) ? (
            <Button
              disabled={this.state.fgCanceling}
              variant="text"
              fullWidth
              size="medium"
              className="btn-back"
              sx={{ mt: 2, color: 'white', textAlign: 'left', alignItems: 'center', justifyContent: 'center' }}
              onClick={async () => {
                if (fs.existsSync(path.resolve(`${this.props.adminh.Parametros.TEF}/envio.txt`))) {
                  fs.unlinkSync(path.resolve(`${this.props.adminh.Parametros.TEF}/envio.txt`));
                }

                if (fs.existsSync(path.resolve(`${this.props.adminh.Parametros.TEF}/retorno.txt`))) {
                  fs.unlinkSync(path.resolve(`${this.props.adminh.Parametros.TEF}/retorno.txt`));
                }

                if (Number(this.props.param.formapg) === Number(2)) {
                  this.setState({ fgCanceling: true });

                  const pixCancelaFile = path.resolve(`${this.props.adminh.Parametros.TEF}/cancelatef.txt`);

                  if (fs.existsSync(pixCancelaFile)) {
                    fs.unlinkSync(pixCancelaFile);
                  }

                  fs.writeFileSync(pixCancelaFile, '1');
                } else {
                  this.props.setParam({ ...this.props.param, step: 3 });
                }
              }}
            >
              {this.state.fgCanceling ? (
                <p style={{ color: 'white' }}>
                  <CircularProgress color="inherit" size={50} />
                </p>
              ) : (
                <>
                  <FontAwesomeIcon icon={faChevronLeft} style={{ marginRight: 15 }} />
                  Mudar
                  <br />
                  forma de pagamento
                </>
              )}
            </Button>
          ) : null}
        </Grid>

        <Grid
          item
          xs={8}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          <div className="tela-pagamento-instrucao">
            <MyStepper
              step={this.state.formaPgStep}
              formapg={this.props.param.formapg}
              pix={this.state.pix}
              msgStep={this.state.formapgStep}
              mensagem={this.state.tefMensagem}
              qrcode={this.state.qrcode}
              qrcodeCanceling={this.state.fgCanceling}
              qrcodeEmTela={
                this.state.caixaIni && this.state.caixaIni.TEF && String(this.state.caixaIni.TEF.QRCodeEmTela).trim().toLowerCase() === 's'
              }
            />
          </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(Step4);
