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

const AudioCaixa = '../../../assets/audio/aguarde-exclusao-item.mp3';

interface StateProps {
  param: Param;
  cart: Cart;
}

interface DispatchProps {
  setParam(param: Param): void;
  drop(rowid: string): void;
}

interface OwnProps {
  adminh: any;
  db: any;
}

type Props = StateProps & DispatchProps & OwnProps;

class Step92 extends React.Component<Props> {
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

    Diversos.putLog(`-- Cliente deseja excluir o produto ${this.props.param.exclusaoItemNome}. Disparando notificação`);

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
      Diversos.putLog(`Problemas ao enviar notificacao de exclusao do item: ${e.message}`);

      console.error(e.message);

      swal('Ops', 'Não conseguimos chamar o gerente para excluir o item.', 'warning');
    }
  }

  private async handleCancela() {
    this.audioCaixa.pause();
    // this.state.leitor ===
    // `www.abandonavenda${this.props.adminh.Parametros.ULTVENDA}.com.br`

    // swal('DEBUG', String(this.state.leitor).trim().toLowerCase(), 'warning');

    Diversos.putLog(`Leu o codigo: ${String(this.state.leitor).trim().toLowerCase()} para cancelamento do item.`);

    if (String(this.state.leitor).trim().toLowerCase().indexOf('www.abandonavenda') > -1) {
      for (let i = 0; i < this.props.cart.produtos.length; i++) {
        if (Number(this.props.cart.produtos[i].codigo) === Number(this.props.param.exclusaoItemCodigo)) {
          this.setState({ leitor: '' });
          this.props.drop(this.props.cart.produtos[i].rowid);
          this.props.setParam({
            ...this.props.param,
            step: 2,
          });
          break;
        }
      }
    } else {
      this.setState({ leitor: '' });
      swal('Ops', 'QR Code inválido.', 'warning');
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
            <h4>o atendente para excluir o item</h4>
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

export default connect(mapStateToProps, mapDispatchToProps)(Step92);
