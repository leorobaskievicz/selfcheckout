import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBarcode, faExclamationCircle, faArrowLeft, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { Button, CircularProgress, Grid, Typography, TextField, InputAdornment, IconButton, Box, Alert } from '@mui/material';
import qs from 'querystring';
import SearchIcon from '@mui/icons-material/Search';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SendIcon from '@mui/icons-material/Send';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { ApplicationState } from '../../services/store';
import { Param } from '../../services/store/ducks/param/types';
import * as ParamActions from '../../services/store/ducks/param/actions';
import { Cart } from '../../services/store/ducks/cart/types';
import * as CartActions from '../../services/store/ducks/cart/actions';
import { Diversos } from '../../services/diversos';
import ApiV2 from '../../services/apiv2';
import CardProduto from '../CardProduto';
import Logo from '../../../../assets/logo-callfarma.png';

const electron = require('electron');

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

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

class Step10 extends React.Component<Props> {
  api: any = null;
  debouncedSearch: any = null;

  constructor(props) {
    super(props);

    this.api = new ApiV2();

    this.state = {
      tela: 1,
      isLoadingReg: false,
      reg: [],
      page: 1,
      perPage: 50,
      lastPage: 1,
      total: 1,
      search: '',
      focused: false,
    };

    // Ligamos a função debouncedSearch para evitar múltiplas requisições
    this.debouncedSearch = debounce(this.buscaProdutos.bind(this), 300);
  }

  componentDidMount(): void {}

  componentWillUnmount(): void {}

  async buscaProdutos() {
    if (!this.state.search) {
      return true;
    }

    this.setState({ isLoadingReg: true });

    try {
      const paramApi = {
        page: this.state.page,
        perPage: this.state.perPage,
        orderByParam: '',
        termo: this.state.search,
        filterMarca: '',
      };

      const { data } = await this.api.get(
        `/produtos?${qs.stringify(paramApi)}`,
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImlhdCI6MTY5NTc0Nzk5N30.2dymofjo9Cx1i1GfINcivkcXweTI2FKyOGu5ALOH2PY'
      );

      if (!data.status) {
        throw new Error(data.msg);
      }

      this.setState({
        tela: 2,
        reg: data.msg.data,
        lastPage: data.msg.lastPage,
        page: data.msg.page,
        total: data.msg.total,
        perPage: data.msg.perPage,
      });
    } catch (e) {
      console.error(e.message);

      this.setState({
        tela: 2,
        reg: [],
        lastPage: 1,
        page: 1,
        total: 1,
        perPage: 1,
      });
    } finally {
      this.setState({ isLoadingReg: false });
    }

    return true;
  }

  renderTela() {
    switch (this.state.tela) {
      case 2:
        return (
          <>
            {this.state.reg.length <= 0 ? (
              <>
                <Grid
                  item
                  xs={12}
                  style={{
                    height: 'calc(calc(100vh) - 170px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                  sx={{
                    mt: 5,
                  }}
                >
                  {!this.state.search ? (
                    <>
                      <SearchIcon sx={{ width: 300, height: 300, color: 'white' }} />
                      <Typography sx={{ color: 'white', fontSize: '1.8rem', fontWeight: '600', textAlign: 'center', mt: 3 }}>
                        Informe acima o que deseja procurar.
                      </Typography>
                    </>
                  ) : (
                    <>
                      <SentimentDissatisfiedIcon sx={{ width: 300, height: 300, color: 'white' }} />
                      <Typography sx={{ color: 'white', fontSize: '1.8rem', fontWeight: '600', textAlign: 'center', mt: 3 }}>
                        Nenhum produto localizado para pesquisa {this.state.search}.
                      </Typography>
                    </>
                  )}
                </Grid>
              </>
            ) : (
              <>
                <Grid
                  item
                  xs={12}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                  sx={{
                    mt: 5,
                  }}
                >
                  <Typography sx={{ fontFamily: 'Roboto', fontSize: '1.7rem', fontWeight: '700', color: 'white' }}>
                    Produtos encontrados:
                  </Typography>
                </Grid>
                <Grid
                  item
                  xs={12}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    overflowX: 'hidden',
                    height: 'calc(calc(100vh) - 200px)',
                    overflowY: 'scroll',
                  }}
                  sx={{
                    mt: 1,
                    pb: 5,
                  }}
                >
                  {this.state.reg.map((row, idx) => (
                    <CardProduto item={row} />
                  ))}
                </Grid>
              </>
            )}
          </>
        );
        break;
      default:
        return (
          <>
            <Grid
              item
              xs={12}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
              sx={{
                mt: 5,
              }}
            >
              <Typography sx={{ fontFamily: 'Roboto', fontSize: '1.7rem', fontWeight: '700', color: 'white' }}>
                Seleciona uma marca
              </Typography>
            </Grid>
            <Grid
              item
              xs={12}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'nowrap',
              }}
            >
              <Button
                size="large"
                variant="contained"
                sx={{
                  width: 300,
                  height: 200,
                  m: 3,
                  p: 5,
                  bgcolor: 'white',
                  borderRadius: 5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' },
                }}
                onClick={() => this.setState({ search: 'mili' }, this.buscaProdutos.bind(this))}
              >
                <img src={require('../../../../assets/mili.png')} alt="Marca: Mili" style={{ width: '90%', height: 'auto' }} />
              </Button>

              <Button
                size="large"
                variant="contained"
                sx={{
                  width: 300,
                  height: 200,
                  m: 3,
                  p: 5,
                  bgcolor: 'white',
                  borderRadius: 5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' },
                }}
                onClick={() => this.setState({ search: 'pampers' }, this.buscaProdutos.bind(this))}
              >
                <img src={require('../../../../assets/pampers.png')} alt="Marca: Mili" style={{ width: '90%', height: 'auto' }} />
              </Button>

              <Button
                size="large"
                variant="contained"
                sx={{
                  width: 300,
                  height: 200,
                  m: 3,
                  p: 5,
                  bgcolor: 'white',
                  borderRadius: 5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' },
                }}
                onClick={() => this.setState({ search: 'mamypoko' }, this.buscaProdutos.bind(this))}
              >
                <img src={require('../../../../assets/mamypoko.png')} alt="Marca: Mili" style={{ width: '90%', height: 'auto' }} />
              </Button>
            </Grid>
            <Grid
              item
              xs={12}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'nowrap',
              }}
            >
              <Button
                size="large"
                variant="contained"
                sx={{
                  width: 300,
                  height: 200,
                  m: 3,
                  p: 5,
                  bgcolor: 'white',
                  borderRadius: 5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' },
                }}
                onClick={() => this.setState({ search: 'babysec' }, this.buscaProdutos.bind(this))}
              >
                <img src={require('../../../../assets/babysec.png')} alt="Marca: Mili" style={{ width: '90%', height: 'auto' }} />
              </Button>

              <Button
                size="large"
                variant="contained"
                sx={{
                  width: 300,
                  height: 200,
                  m: 3,
                  p: 5,
                  bgcolor: 'white',
                  borderRadius: 5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' },
                }}
                onClick={() => this.setState({ search: 'huggies' }, this.buscaProdutos.bind(this))}
              >
                <img src={require('../../../../assets/huggies.png')} alt="Marca: Mili" style={{ width: '90%', height: 'auto' }} />
              </Button>

              <Button
                size="large"
                variant="contained"
                sx={{
                  width: 300,
                  height: 200,
                  m: 3,
                  p: 5,
                  bgcolor: 'white',
                  borderRadius: 5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' },
                }}
                onClick={() => this.setState({ tela: 2, search: '' }, document.getElementById('search').focus())}
              >
                <Typography sx={{ color: '#0376b3', fontWeight: '700', fontFamily: 'Roboto', fontSize: '2.0rem', letterSpacing: '-0.5px' }}>
                  Ver outros{'\n'}produtos
                </Typography>
              </Button>
            </Grid>
          </>
        );
        break;
    }
  }

  renderIsLoading() {
    return (
      <Grid
        item
        xs={12}
        style={{
          height: 'calc(100vh - 200px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'nowrap',
        }}
      >
        <CircularProgress size={150} sx={{ color: 'white' }} />
        <Typography sx={{ fontSize: '1.5rem', fontWeight: '500', color: 'white', textAlign: 'center', mt: 8 }}>
          Pesquisando produtos, por favor aguarde...
        </Typography>
      </Grid>
    );
  }

  render() {
    return (
      <>
        <div
          // className="main-header"
          style={{
            width: 'calc(calc(100vw) - 35px)',
            height: 170,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0px 1rem',
          }}
        >
          <Button
            variant="outlined"
            size="large"
            sx={{
              px: 5,
              py: 1,
              color: 'white',
              fontSize: '1.3rem',
              borderColor: 'white',
              borderWidth: 2,
              borderStyle: 'solid',
            }}
            onClick={() => {
              if (this.state.tela === 1) {
                this.props.setParam({
                  ...this.props.param,
                  step: 1,
                });
              } else {
                this.setState({
                  tela: this.state.tela - 1,
                });
              }
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: 10 }} />
            Voltar
          </Button>
          <img src={Logo} alt="Logo" className="header-logo" />

          <Box
            component="form"
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: this.state.focused ? '600px' : '300px', // Altera a largura no foco
              transition: 'all 0.3s ease-in-out', // Efeito de transição suave
              backgroundColor: 'white',
              borderRadius: '50px', // Arredondado
              padding: '4px',
            }}
            onFocus={() => this.setState({ focused: true })}
            onBlur={() => this.setState({ focused: false })}
          >
            <TextField
              id="search"
              variant="standard"
              placeholder="Pesquisar..."
              InputProps={{
                disableUnderline: true, // Remove a linha underline
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              inputProps={{
                sx: {
                  fontSize: '1.8rem',
                  fontWeight: '500',
                  color: 'primary.dark',

                  '&::placeholder': {
                    fontSize: '1.0rem',
                    fontWeight: '500',
                    color: 'grey.500',
                  },
                },
              }}
              sx={{
                flex: 1,
                borderRadius: '50px',
                backgroundColor: 'white',
                paddingLeft: '10px',
              }}
              value={this.state.search}
              onChange={(event) => {
                const searchTerm = event.target.value;
                this.setState({ search: searchTerm });
                this.debouncedSearch(searchTerm);
              }}
            />
            <IconButton type="button" sx={{ marginLeft: '8px' }} color="primary" onClick={this.buscaProdutos.bind(this)}>
              <SendIcon />
            </IconButton>
          </Box>
          {this.props.cart.produtos.length > 0 ? (
            <Button
              variant="contained"
              size="large"
              sx={{
                px: 7,
                py: 2,
                color: 'white',
                bgcolor: 'success.light',
                fontSize: '1.3rem',
                '&:hover': {
                  bgcolor: 'success.main',
                },
              }}
              onClick={() =>
                this.props.setParam({
                  ...this.props.param,
                  step: 2,
                })
              }
            >
              <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: 10 }} />
              Finalizar Compra
            </Button>
          ) : null}
        </div>
        <div className="main-body has-header">
          <Grid container>{this.state.isLoadingReg ? this.renderIsLoading() : this.renderTela()}</Grid>;
        </div>
      </>
    );
  }
}

const mapStateToProps = (state: ApplicationState) => ({
  param: state.param.data,
  cart: state.cart.data,
});

const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators({ ...ParamActions, ...CartActions }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Step10);
