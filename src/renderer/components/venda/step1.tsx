import React from 'react';
import swal from '@sweetalert/with-react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { Button, Grid } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { ApplicationState } from '../../services/store';
import { Param } from '../../services/store/ducks/param/types';
import * as ParamActions from '../../services/store/ducks/param/actions';
import { Cart } from '../../services/store/ducks/cart/types';
import * as CartActions from '../../services/store/ducks/cart/actions';
// import IconeScanner from '../../../../assets/icone-scanner.svg';
import IconeScanner from '../../../../assets/leitor-caixa.gif';

import { Diversos } from '../../services/diversos';

const electron = require('electron');

interface StateProps {
  param: Param;
  cart: Cart;
}

interface DispatchProps {
  setParam(param: Param): void;
}

interface OwnProps {
  adminh: any;
  db: any;
}

type Props = StateProps & DispatchProps & OwnProps;

class Step1 extends React.Component<Props> {
  inputRef: any = null;

  timer: any = null;

  constructor(props) {
    super(props);

    this.inputRef = React.createRef();

    this.state = {};
  }

  componentDidMount(): void {
    this.inputRef.current.focus();

    this.props.setParam({
      ...this.props.param,
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
  }

  componentWillUnmount(): void {
    clearInterval(this.timer);
    this.timer = null;
  }

  private handlerOnKeyDown(event) {
    if (event.key === 'Enter') {
      if (!this.props.param.leitor) {
        swal('Atenção', 'Passe a pré-venda ou o produto no leitor para iniciar sua compra.', 'warning');

        return false;
      }

      Diversos.putLog(``);
      Diversos.putLog(`======================================================`);
      Diversos.putLog(``);
      Diversos.putLog(`-> Iniciando nova venda`);

      this.props.setParam({
        ...this.props.param,
        step: 2,
      });
    }

    return true;
  }

  private handlerOnChange(event) {
    this.props.setParam({
      ...this.props.param,
      leitor: event.target.value,
    });
  }

  render() {
    return (
      <Grid container>
        <Grid
          item
          xs={6}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <h1>Olá</h1>
          <h3>
            Para começar, <strong>escaneie</strong> sua <strong>pré-venda</strong> ou o <strong>código de barras</strong> do produto
          </h3>
          {this.props.adminh.Parametros.FGFEIRA === 'Sim' ? (
            <>
              <p className="opcao-step-1">OU</p>
              <Button
                size="large"
                color="primary"
                variant="contained"
                sx={{
                  mt: 3,
                  px: 3,
                  py: 2,
                  bgcolor: '#e9a447',
                  color: '#ffff',
                  fontSize: '1.3rem',
                  '&:hover': {
                    bgcolor: '#8d632d',
                  },
                }}
                onClick={() =>
                  this.props.setParam({
                    ...this.props.param,
                    step: 10,
                  })
                }
              >
                <LocalShippingIcon sx={{ mr: 1 }} />
                Comprar para entrega
              </Button>
            </>
          ) : null}
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
        <Grid
          item
          xs={6}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <img src={IconeScanner} className="barcode-icon" alt="Scanner icone" style={{ width: '100%', height: 'auto', marginTop: -60 }} />
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

export default connect(mapStateToProps, mapDispatchToProps)(Step1);
