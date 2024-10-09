import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import Webcam from 'react-webcam';
import Logo from '../../../assets/logo-callfarma.png';
import { ApplicationState } from '../services/store';
import { Diversos } from '../services/diversos';
import { Param } from '../services/store/ducks/param/types';
import * as ParamActions from '../services/store/ducks/param/actions';
import * as CartActions from '../services/store/ducks/cart/actions';

interface StateProps {
  param: Param;
}

interface DispatchProps {
  setParam(param: Param): void;
  clean(): void;
}

interface OwnProps {}

type Props = StateProps & DispatchProps & OwnProps;

class Monitor extends React.Component<Props> {
  webcamRef = React.createRef();
  mediaRecorderRef = React.createRef();

  state = {
    screenHeight: 850,
    screenWidth: 600,
    fgGravando: false,
    recordedChunks: [],
  };

  constructor(props: Props) {
    super(props);
  }

  private handleStartGravacao() {
    Diversos.putLog('*** Iniciando gravação da venda...');

    this.mediaRecorderRef.current = new MediaRecorder(this.webcamRef.current.stream, {
      mimeType: 'video/webm',
    });

    this.mediaRecorderRef.current.addEventListener('dataavailable', this.handleDataAvailable);

    this.mediaRecorderRef.current.start();
  }

  private handleDataAvailable({ data }) {
    if (data.size > 0) {
      this.setState({ recordedChunks: this.state.recordedChunks.concat(data) });
    }
  }

  private handleStopGravacao() {
    Diversos.putLog('*** Fim da gravação da venda...');

    this.mediaRecorderRef.current.stop();

    const blob = new Blob(this.state.recordedChunks, {
      type: 'video/webm',
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    document.body.appendChild(a);

    a.style = 'display: none';

    a.href = url;

    a.download = 'react-webcam-stream-capture.webm';

    a.click();

    window.URL.revokeObjectURL(url);

    this.setState({ recordedChunks: [] });
  }

  render() {
    if (Number(this.props.param.step) === Number(2) && this.state.fgGravando === false) {
      this.setState({ fgGravando: true }, this.handleStartGravacao.bind(this));
    } else if (Number(this.props.param.step) === Number(1) && this.state.fgGravando === true) {
      this.setState({ fgGravando: false }, this.handleStopGravacao.bind(this));
    }

    return (
      <div className="main-window">
        <div
          className="main-body"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            color: 'white',
          }}
        >
          <div
            className="main-header"
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <img src={Logo} alt="Logo" className="header-logo" style={{ width: 'auto', height: 150 }} />
          </div>
          <div className="main-body" style={{ width: '100vw', height: 874 }}>
            <div id="my_camera">
              <Webcam
                audio={false}
                height={this.state.screenHeight}
                width={this.state.screenWidth - 20}
                style={{
                  borderRadius: 10,
                  height: this.state.screenHeight,
                  width: this.state.screenWidth - 20,
                  left: 10,
                  right: 10,
                  objectFit: 'fill',
                  position: 'absolute',
                  borderWidth: 4,
                  borderColor: '#e9a447',
                  borderStyle: 'solid',
                }}
              />
            </div>
          </div>
          {this.state.fgGravando ? <div style={{ width: 4, height: 4, color: 'red', borderRadius: 8, marginTop: 10 }} /> : null}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: ApplicationState) => ({
  param: state.param.data,
});

const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators({ ...ParamActions, ...CartActions }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Monitor);
