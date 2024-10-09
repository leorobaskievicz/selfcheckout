import React from 'react';
import { Button, Grid } from '@mui/material';
import { red, blue } from '@mui/material/colors';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import swal from 'sweetalert';
import { ApplicationState } from '../../services/store';
import { Param } from '../../services/store/ducks/param/types';
import * as ParamActions from '../../services/store/ducks/param/actions';
import { Cart } from '../../services/store/ducks/cart/types';
import * as CartActions from '../../services/store/ducks/cart/actions';
import { Diversos } from '../../services/diversos';
import Api from '../../services/api';

const electron = require('electron');

const AudioCaixa = '../../../assets/audio/aguarde-cancelar-compra.mp3';

interface StateProps {
  param: Param;
}

interface DispatchProps {
  setParam(param: Param): void;
  clean(): void;
}

interface OwnProps {
  adminh: any;
  db: any;
}

type Props = StateProps & DispatchProps & OwnProps;

class Step8 extends React.Component<Props> {
  inputRef: any = null;

  api: any = null;

  audioCaixa: any = null;

  constructor(props) {
    super(props);

    this.inputRef = React.createRef();

    this.api = new Api();

    this.audioCaixa = new Audio(AudioCaixa);

    this.state = {
      leitor: null,
    };
  }

  async componentDidMount(): void {
    this.audioCaixa.play();

    Diversos.putLog(`-- Cliente deseja abandonar venda. Disparando notificação`);

    this.inputRef.current.focus();

    if (this.state.leitor && this.state.leitor.trim() !== '') {
      this.handlerOnKeyDown({ key: 'Enter' });
    }

    this.handleSendNotification();
  }

  private handlerOnKeyDown(event) {
    if (event.key === 'Enter') {
      if (!this.state.leitor) {
        this.setState({ leitor: '' });

        swal('Atenção', 'Posicione o QR Code em frente ao leitor', 'warning');

        return false;
      }

      this.handleCancelaTrn();

      this.handleCancela();
    }

    return true;
  }

  private handlerOnChange(event) {
    this.setState({
      leitor: event.target.value,
    });
  }

  private async handleSendNotification() {
    let cpfCliente = '000.000.000-00';

    if (this.props.param.cpf) {
      cpfCliente = this.props.param.cpf;
    }

    try {
      await this.api.post(`/Notification/ajudaCompraRapida`, {
        cliente: cpfCliente,
        loja: this.props.adminh.Parametros.CDFIL,
        pedido: this.props.adminh.Parametros.ULTVENDA,
        tipo: 1,
      });
    } catch (e) {
      Diversos.putLog(`Problemas ao enviar notificacao de cancelamento de venda: ${e.message}`);

      console.error(e.message);

      swal('Ops', 'Não conseguimos chamar o gerente para cancelar a venda.', 'warning');
    }
  }

  private async handleCancela() {
    this.audioCaixa.pause();
    // this.state.leitor ===
    // `www.abandonavenda${this.props.adminh.Parametros.ULTVENDA}.com.br`

    Diversos.putLog(`Leu o codigo: ${String(this.state.leitor).trim().toLowerCase()} para cancelamento do item.`);

    if (String(this.state.leitor).trim().toLowerCase().indexOf('www.abandonavenda') > -1) {
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
      this.setState({ leitor: '' });
      swal('Ops', 'QR Code inválido.', 'warning');
    }
  }

  private async handleCancelaTrn() {
    try {
      if (this.props.param.pbm && this.props.param.pbmTipo === 'trn') {
        Diversos.putLog(`-> Dados da TRN Centre: ${JSON.stringify(this.props.param)}`);

        const resultCancelaTrn = await electron.ipcRenderer.sendSync('trn-cancela-autorizacao', {
          param: this.props.param,
          produtos: this.props.cart.produtos,
        });

        if (!resultCancelaTrn || !resultCancelaTrn.status) {
          throw new Error(`Nao foi possivel cancelar TRN Centre`);
        }

        Diversos.putLog(`-> TRN Centre cancelado com sucesso`);
      }
    } catch (e) {
      Diversos.putLog(`-> Falha no cancelamento da PBM...`);
      throw new Error('Não foi possível cancelar autorização de desconto com o laboratório');
    }
  }

  render() {
    return (
      <Grid
        container
        sx={{
          height: '100vh',
          width: '100vw',
          flex: 1,
          // backgroundColor: green[400],
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
          <div className="tela-finalizacao tela-cancelamento">
            <h2>Aguarde</h2>
            <h4>o atendente para cancelar sua compra</h4>
          </div>
        </Grid>

        <input
          ref={this.inputRef}
          name="leitor"
          value={this.state.leitor}
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

export default connect(mapStateToProps, mapDispatchToProps)(Step8);
