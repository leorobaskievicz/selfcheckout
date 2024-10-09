import React from 'react';
import { Button, Grid } from '@mui/material';
import { red, blue } from '@mui/material/colors';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { ApplicationState } from '../../services/store';
import { Param } from '../../services/store/ducks/param/types';
import * as ParamActions from '../../services/store/ducks/param/actions';
import * as CartActions from '../../services/store/ducks/cart/actions';

const AudioCaixa = '../../../assets/audio/confirmacao-cancelar-compra.mp3';

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

class Step7 extends React.Component<Props> {
  audioCaixa: any = null;

  constructor(props) {
    super(props);

    this.audioCaixa = new Audio(AudioCaixa);
  }

  componentDidMount(): void {
    this.audioCaixa.play();
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
            <h3>Tem certeza que deseja cancelar a compra?</h3>
            <Button
              size="large"
              variant="contained"
              sx={{
                backgroundColor: red[500],
                borderColor: red[500],
                borderSize: 2,
                color: 'white',
                mt: 2,
                height: 70,
                width: '90%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                textAlign: 'center',
              }}
              onClick={() => {
                this.audioCaixa.pause();
                this.props.setParam({ ...this.props.param, step: 8 });
              }}
            >
              Sim, quero cancelar
            </Button>
            <Button
              size="large"
              variant="outlined"
              sx={{
                backgroundColor: 'white',
                borderColor: blue[500],
                borderSize: 2,
                color: blue[500],
                mt: 2,
                height: 70,
                width: '90%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                textAlign: 'center',
              }}
              onClick={() => {
                this.audioCaixa.pause();
                this.props.setParam({ ...this.props.param, step: 2 });
              }}
            >
              Voltar a comprar
            </Button>
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

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators({ ...ParamActions, ...CartActions }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Step7);
