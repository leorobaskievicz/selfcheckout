import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { HashRouter as Router, Route, Redirect } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { store, persistor } from './services/store';
import AppBar from './components/app-bar';
import Venda from './pages/venda';
import Monitor from './pages/monitor';
import Loading from './pages/loading';
import './App.scss';

const electron = require('electron');

export default class App extends React.Component {
  constructor(props) {
    super(props);
  }

  static Views() {
    return {
      venda: <Venda />,
      monitor: <Monitor />,
      loading: <Loading />,
    };
  }

  static View(props) {
    let name = window.location.search.substr(1);

    if (name.includes('=')) {
      name = name.slice(0, name.includes('='));
    }

    let view = App.Views()[name];

    if (!view) {
      throw new Error(`View ${name} is undefined`);
    }

    return view;
  }

  render() {
    return (
      <Provider store={store}>
        {/* <Dialog fullScreen={Boolean('true')} open={Boolean('true')}>
          <DialogTitle style={{ padding: 0 }}>
            <AppBar mainApp={this} />
          </DialogTitle> */}

        {/* <DialogContent
            className="mainContent"
            style={{
              padding: 0,
              overflow: 'hidden',
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
            }}
          > */}
        <Router>
          <Route path="/" component={App.View} />
        </Router>
        {/* </DialogContent> */}
        {/* </Dialog> */}
      </Provider>
    );
  }
}
