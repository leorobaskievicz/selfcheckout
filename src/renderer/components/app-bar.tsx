import React from 'react';
import IconButton from '@mui/material/IconButton';
import Close from '@mui/icons-material/Close';
import Minimize from '@mui/icons-material/Minimize';
import CropSquare from '@mui/icons-material/CropSquare';
import FilterNone from '@mui/icons-material/FilterNone';

import AppMenu from './app-menu';

// Capture Electron Main Window
const remote = require('@electron/remote');

const window = remote.getCurrentWindow();

export default class AppBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      maximizeIcon: <CropSquare />,
      mainApp: props.mainApp,
    };
  }

  // Click event on the [Maximize] button
  private maximizeButton() {
    if (window.isMaximized()) window.restore();
    else window.maximize();
  }

  private componentDidMount() {
    // Main window resize event
    // I control here the change of the [Maximize] icon
    window.addListener('resize', () => {
      if (window.isMaximized()) this.setState({ maximizeIcon: <FilterNone /> });
      else this.setState({ maximizeIcon: <CropSquare /> });
    });
  }

  render() {
    // Styles
    const appBarStyle = {
      WebkitAppRegion: 'drag',
      zIndex: 1000,
      maxHeight: 20,
      padding: 6,
      paddingTop: 10,
      paddingBottom: 10,
      height: 100,
      color: '#f5f5f5',
      backgroundColor: '#494440',
      display: 'flex',
      alignItems: 'center',
      userSelect: 'none',
    };
    const appButton = {
      WebkitAppRegion: 'no-drag',
    };
    const appH1 = {
      flexGrow: 1,
      margin: 0,
      marginLeft: 6,
      fontSize: 20,
    };

    return (
      <div style={appBarStyle}>
        <AppMenu mainApp={this.state.mainApp} />
        <h1 style={appH1}>Reactron</h1>

        <IconButton
          color="inherit"
          size="small"
          style={appButton}
          onClick={() => {
            window.minimize();
          }}
        >
          <Minimize />
        </IconButton>
        <IconButton
          color="inherit"
          size="small"
          style={appButton}
          onClick={() => {
            this.maximizeButton();
          }}
        >
          {this.state.maximizeIcon}
        </IconButton>
        <IconButton
          color="inherit"
          size="small"
          style={appButton}
          onClick={() => {
            window.close();
          }}
        >
          <Close />
        </IconButton>
      </div>
    );
  }
}
