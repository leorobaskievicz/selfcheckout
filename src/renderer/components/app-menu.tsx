import React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { Menu as MenuButton } from '@mui/icons-material';
import Venda from '../pages/venda';

export default function AppMenu(props) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  function handleClick(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  function handleClickOpt(page) {
    props.mainApp.routePage(page);
    handleClose();
  }

  const appButton = {
    WebkitAppRegion: 'no-drag',
  };

  return (
    <div>
      <Tooltip title="Main menu">
        <IconButton
          color="inherit"
          size="small"
          style={appButton}
          onClick={handleClick}
        >
          <MenuButton width="28" />
        </IconButton>
      </Tooltip>

      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem
          onClick={() => {
            handleClickOpt(Venda);
          }}
        >
          Início
        </MenuItem>
        {/* <MenuItem onClick={() => { handleClickOpt(BasicForm) }}>Form</MenuItem>
        <MenuItem onClick={() => { handleClickOpt(Command) }}>Execute Command</MenuItem>
        <MenuItem onClick={() => { handleClickOpt(Rest) }}>Consume Rest </MenuItem>
        <MenuItem onClick={() => { handleClickOpt(FS_Inifile) }}>File System / Ini File </MenuItem> */}
        <Divider />
        <MenuItem
          onClick={() => {
            handleClickOpt(AppAbout);
          }}
        >
          About...
        </MenuItem>
      </Menu>
    </div>
  );
}
