import Button from '@mui/material/Button';
import { withStyles } from '@mui/material/styles';

let bgColor = '#D9D9D9';
let bgHoverColor = '#B4B4B4';
const AppButton = withStyles((theme) => ({
  root: {
    height: 40,
    color: theme.palette.getContrastText(bgColor),
    backgroundColor: bgColor,
    '&:hover': {
      color: theme.palette.getContrastText(bgHoverColor),
      backgroundColor: bgHoverColor,
    },
  },
}))(Button);

export default AppButton;
