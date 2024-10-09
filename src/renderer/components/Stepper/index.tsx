import React, { Component } from 'react';
import './index.scss';
import { CircularProgress } from '@mui/material';
import { faArrowDown, faArrowRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import QRCode from 'qrcode.react';
import QRCode from 'react-qr-code';
// import CompreRapidoLogo from '../../../../assets/compre-rapido-iphone.png';
import CompreRapidoLogo from '../../../../assets/celular-tela-convenio.png';
import IconeMaquininha from '../../../../assets/icone-maquininha.png';

// Step
function Step(props) {
  return (
    <div className={`Stepper__step ${props.active ? 'is-active' : ''} ${props.complete ? 'is-complete' : ''}`}>
      <div className="Stepper__indicator">
        <span className="Stepper__info">{props.indicator}</span>
      </div>
      <div className="Stepper__label" style={{ fontSize: 22, fontWeight: 500, fontFamily: 'Fira Sans' }}>
        {props.title}
      </div>
      <div className="Stepper__panel">{props.children}</div>
    </div>
  );
}

// Overlay
function Stepper(props) {
  return (
    <div className={`Stepper ${props.isVertical ? 'Stepper--vertical' : ''} ${props.isInline ? 'Stepper--inline' : ''}`}>
      {props.children}
    </div>
  );
}

export default class MyStepper extends Component<any> {
  render() {
    return (
      <div className="my-stepper-content">
        {this.props.formapg === 1 ? (
          <>
            <img src={CompreRapidoLogo} alt="Compre Rapido Logo" />
            <Stepper isVertical>
              <Step
                indicator="1"
                title="Abra seu app Compra e faça login com seu CPF"
                active={this.props.step === 1}
                complete={this.props.step > 1}
              >
                <div className="Content">
                  <button>Prev</button>
                  <button>Next</button>
                </div>
              </Step>
              <Step
                indicator="2"
                title="Aceite a notificação de compra recebida no seu app"
                active={this.props.step === 2}
                complete={this.props.step > 2}
              >
                <div className="Content">
                  <button>Prev</button>
                  <button>Next</button>
                </div>
              </Step>
              <Step
                indicator="3"
                title="Aguarde a mensagem de conclusão do pagamento"
                active={this.props.step === 3}
                complete={this.props.step > 3}
              >
                <div className="Content">
                  <button>Prev</button>
                  <button>Next</button>
                </div>
              </Step>
            </Stepper>
          </>
        ) : this.props.formapg === 2000 ? (
          <>
            {this.props.step === 1 ? (
              <CircularProgress size="4rem" sx={{ mb: 2 }} />
            ) : this.props.pix ? (
              <QRCode
                value={this.props.pix.qrcode}
                style={{
                  width: 300,
                  height: 300,
                  color: 'black',
                  marginBottom: 20,
                }}
              />
            ) : null}
            {/* <img src={CompreRapidoLogo} alt="Compre Rapido Logo" /> */}
            <Stepper isVertical>
              <Step
                indicator="1"
                title="Gerando QR Code do Pix para pagamento, por favor aguarde..."
                active={this.props.step === 1}
                complete={this.props.step > 1}
              >
                <div className="Content">
                  <button>Prev</button>
                  <button>Next</button>
                </div>
              </Step>
              <Step
                indicator="2"
                title="Leia o QR Code acima no app do seu banco"
                active={this.props.step === 2}
                complete={this.props.step > 2}
              >
                <div className="Content">
                  <button>Prev</button>
                  <button>Next</button>
                </div>
              </Step>
              <Step
                indicator="3"
                title="Confirme os dados e valores e confirme o pagamento"
                active={this.props.step === 3}
                complete={this.props.step > 3}
              >
                <div className="Content">
                  <button>Prev</button>
                  <button>Next</button>
                </div>
              </Step>
              <Step
                indicator="4"
                title="Confirmando pagamento, por favor aguarde..."
                active={this.props.step === 4}
                complete={this.props.step > 4}
              >
                <div className="Content">
                  <button>Prev</button>
                  <button>Next</button>
                </div>
              </Step>
              <Step indicator="4" title="Pagamento confirmado!" active={this.props.step === 4} complete={this.props.step > 4}>
                <div className="Content">
                  <button>Prev</button>
                  <button>Next</button>
                </div>
              </Step>
            </Stepper>
          </>
        ) : this.props.formapg === 2 && Boolean(this.props.qrcodeEmTela) === Boolean(true) ? (
          <>
            {!this.props.qrcode || String(this.props.qrcode).trim() === '' || Boolean(this.props.qrcodeCanceling) === Boolean(true) ? (
              <CircularProgress color="primary" size={40} />
            ) : (
              <div style={{ background: 'white', padding: 16, width: 300, height: 300 }}>
                <QRCode
                  value={this.props.qrcode}
                  viewBox={`0 0 256 256`}
                  size={256}
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                />
              </div>
            )}

            {!this.props.qrcode || String(this.props.qrcode).trim() === '' ? (
              <div className="label-pgto-cartao">
                Gerando QR Code para pagamento...
                <br />
                <p>&nbsp;</p>
                <p>&nbsp;</p>
                <p style={{ textAlign: 'center', fontSize: 18, fontWeight: '500', color: '#0376b3' }}>{this.props.mensagem}</p>
                <p>&nbsp;</p>
              </div>
            ) : Boolean(this.props.qrcodeCanceling) === Boolean(true) ? (
              <div className="label-pgto-cartao">
                Cancelando QR Code de pagamento
                <br />
                <p>&nbsp;</p>
                <p>&nbsp;</p>
                <p style={{ textAlign: 'center', fontSize: 18, fontWeight: '500', color: '#0376b3' }}>{this.props.mensagem}</p>
                <p>&nbsp;</p>
              </div>
            ) : (
              <div className="label-pgto-cartao">
                Escaneie o QR Code para pagamento
                <br />
                <p>&nbsp;</p>
                <p>&nbsp;</p>
                <p style={{ textAlign: 'center', fontSize: 18, fontWeight: '500', color: '#0376b3' }}>{this.props.mensagem}</p>
                <p>&nbsp;</p>
              </div>
            )}
          </>
        ) : (this.props.formapg === 2 && Boolean(this.props.qrcodeEmTela) === Boolean(false)) ||
          this.props.formapg === 3 ||
          this.props.formapg === 4 ? (
          <>
            <img src={IconeMaquininha} alt="Icone PinPad Logo" style={{ width: 200, height: 'auto' }} />
            <div className="label-pgto-cartao">
              Siga as instruções na leitora de cartão
              <br />
              <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 72 }} />
              <p>&nbsp;</p>
              <p>&nbsp;</p>
              <p style={{ textAlign: 'center', fontSize: 18, fontWeight: '500', color: '#0376b3' }}>{this.props.mensagem}</p>
              <p>&nbsp;</p>
            </div>
          </>
        ) : (
          <Stepper isVertical>
            <Step
              indicator="1"
              title="Siga as instruções na leitora do cartão"
              active={this.props.step === 1}
              complete={this.props.step > 1}
            >
              <div className="Content">
                <button>Prev</button>
                <button>Next</button>
              </div>
            </Step>
          </Stepper>
        )}
      </div>
    );
  }
}
