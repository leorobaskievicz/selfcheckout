import React from 'react';
import { Grid } from '@mui/material';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { ApplicationState } from '../../services/store';
import { Param } from '../../services/store/ducks/param/types';
import * as ParamActions from '../../services/store/ducks/param/actions';
import { Cart } from '../../services/store/ducks/cart/types';
import * as CartActions from '../../services/store/ducks/cart/actions';
import Logo from '../../../../assets/logo-callfarma.png';
import LogoJoia from '../../../../assets/call-joinha.png';
import { Diversos } from '../../services/diversos';

const AudioCaixa = '../../../assets/audio/notificacao.mp3';

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

class Step6 extends React.Component<Props> {
  inputRef: any = null;

  audioCaixa: any = null;

  constructor(props) {
    super(props);

    this.inputRef = React.createRef();

    this.audioCaixa = new Audio(AudioCaixa);

    this.state = {};
  }

  async componentDidMount() {
    this.audioCaixa.play();

    setTimeout(() => {
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
    }, 1000 * 3);
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
}

const mapStateToProps = (state: ApplicationState) => ({
  param: state.param.data,
  cart: state.cart.data,
});

const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators({ ...ParamActions, ...CartActions }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Step6);
