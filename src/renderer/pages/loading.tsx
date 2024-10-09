import React from 'react';
import { Diversos } from '../services/diversos';

const electron = require('electron');

const remote = require('@electron/remote');

interface StateProps {}

interface DispatchProps {}

interface OwnProps {}

type Props = StateProps & DispatchProps & OwnProps;

export default class Loading extends React.Component<Props> {
  timer: any = null;

  state = {
    message: 'Iniciando aplicação, por favor aguarde...',
  };

  constructor(props: Props) {
    super(props);
  }

  componentDidMount(): void {
    this.timer = setInterval(this.getMessage.bind(this), 1000); // 1 segundo
  }

  componentWillUnmount(): void {
    clearInterval(this.timer);
    this.timer = null;
  }

  private getMessage() {
    const msg = Diversos.getLoadingMsg();
    console.log(msg);
    this.setState({ message: msg });
  }

  render() {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 500,
          height: 300,
          backgroundColor: '#0376b3',
          borderWidth: 5,
          borderColor: 'red',
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
        }}
      >
        <img src="logo-callfarma.png" style={{ width: 250, height: 'auto' }} />
        <h3 style={{ fontSize: 20, fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 500, color: 'white', textAlign: 'center' }}>{this.state.message}</h3>
        <div className="loader"></div>
      </div>
    );
  }
}
