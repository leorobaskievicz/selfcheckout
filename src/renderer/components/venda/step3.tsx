import React from 'react';
import { Redirect, Link } from 'react-router-dom';
import {
  TextField,
  Button,
  Grid,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  IconButton,
  Modal,
  Box,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  CardContent,
  Card,
  CardHeader,
  CircularProgress,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronLeft, faBackspace, faMapMarkedAlt } from '@fortawesome/free-solid-svg-icons';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import swal from '@sweetalert/with-react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { ApplicationState } from '../../services/store';
import { Param } from '../../services/store/ducks/param/types';
import * as ParamActions from '../../services/store/ducks/param/actions';
import { Cart } from '../../services/store/ducks/cart/types';
import * as CartActions from '../../services/store/ducks/cart/actions';
import AppPad from '../app-pad';
import { Diversos } from '../../services/diversos';
import { grey } from '@mui/material/colors';
import Api from '../../services/api';
import ApiV2 from '../../services/apiv2';
import { ArrowBack } from '@mui/icons-material';

const AudioCaixa = '../../../assets/audio/cpf-na-nota.mp3';

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

class Step3 extends React.Component<Props> {
  inputRef: any = null;
  audioCaixa: any = null;
  api: any = null;
  apiv2: any = null;

  constructor(props) {
    super(props);

    this.inputRef = React.createRef();

    this.api = new Api();

    this.apiv2 = new ApiV2();

    this.audioCaixa = new Audio(AudioCaixa);

    this.state = {
      cpfNaNota: true,
      clubeCallFarma: true,

      modalEndereco: false,

      formNome: '',
      formNascimento: '',
      formDataconserasa: '',
      formCep: '',
      formRua: '',
      formNumero: '',
      formComplemento: '',
      formBairro: '',
      formCidade: '',
      formUf: '',
      formTelefone: '',
      isLoadingCep: false,

      formIsLoading: false,

      isSubmitting: false,
    };
  }

  async componentDidMount() {
    this.inputRef.current.focus();

    Diversos.putLog(`-> Informando CPF na nota`);

    this.audioCaixa.play();
  }

  async handleSubmitCliente(e) {
    e.preventDefault();

    if (!this.props.param.cpf || !Diversos.validateCPF(this.props.param.cpf)) {
      swal('CPF inválido', 'O CPF informado não é válido.', 'warning');
      return false;
    }

    if (!this.state.formCep) {
      swal('CEP inválido', 'O CEP informado não é válido.', 'warning');
      return false;
    }

    if (!this.state.formRua) {
      swal('Endereço inválido', 'O Endereço informado não é válido.', 'warning');
      return false;
    }

    if (!this.state.formBairro) {
      swal('Bairro inválido', 'O Bairro informado não é válido.', 'warning');
      return false;
    }

    if (!this.state.formCidade) {
      swal('Cidade inválida', 'A cidade informada não é válida.', 'warning');
      return false;
    }

    if (!this.state.formUf) {
      swal('UF inválido', 'A UF informada não é válida.', 'warning');
      return false;
    }

    if (!this.state.formTelefone) {
      swal('UF inválido', 'O Celular informado não é válido.', 'warning');
      return false;
    }

    this.setState({ isSubmitting: true });

    try {
      let clienteCodigo = 0;

      const param = {
        cpf: this.props.param.cpf,
        nome: this.state.formNome,
        nascimento: this.state.formNascimento,
        tel: this.state.formTelefone,
        cep: this.state.formCep,
        rua: this.state.formRua,
        numero: this.state.formNumero,
        complemento: this.state.formComplemento,
        bairro: this.state.formBairro,
        cidade: this.state.formCidade,
        uf: this.state.formUf,
      };

      const response1 = await this.api.post(`/Cliente/consulta`, param);

      if (response1.data.status === false || response1.data.fgConta === false) {
        if (response1.data.fgCadastro === true) {
          clienteCodigo = response1.data.cliente.codigo;

          this.setState({
            formCodigo: response1.data.cliente.codigo,
            formNome: response1.data.cliente.nome,
            formNascimento: response1.data.cliente.nascimento,
            formDataconserasa: response1.data.cliente.dataconserasa,
            // formCep: response1.data.cliente.dataconserasa,
            // formRua: response1.data.cliente.rua,
            // formNumero: response1.data.cliente.numero,
            // formComplemento: response1.data.cliente.complemento,
            // formBairro: response1.data.cliente.bairro,
            // formCidade: response1.data.cliente.cidade,
            // formUf: response1.data.cliente.uf,
          });
        } else {
          const response2 = await this.api.post('/Cliente/criaCPF', { cpf: Diversos.policia(this.props.param.cpf) });

          if (!response2.data.status) {
            throw new Error('CPF já cadastrado');
          }

          clienteCodigo = response2.data.cliente.CODIGO;

          this.setState({
            formCodigo: response2.data.cliente.CODIGO,
          });
        }
      } else {
        clienteCodigo = response1.data.cliente.codigo;

        this.setState({
          formCodigo: response1.data.cliente.codigo,
          formNome: response1.data.cliente.nome,
          formNascimento: response1.data.cliente.nascimento,
        });
      }

      const { data } = await this.apiv2.put(
        `/cliente/${clienteCodigo}`,
        param,
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImlhdCI6MTU5NjQ3NDg1Nn0.2K1SZ1d5ZYkvqZSIe8hbWa5LrSC7TB64F_XLKJ9qTow'
      );

      if (!data.status) {
        throw new Error(data.msg);
      }

      this.props.setParam({
        ...this.props.param,
        step: this.props.param.step + 1,
      });
    } catch (e) {
      swal('Ops', e.message, 'warning');
    } finally {
      this.setState({ isSubmitting: false });
    }

    return true;
  }

  async getCep() {
    if (!this.state.formCep || Diversos.getnums(this.state.formCep).length !== 8) {
      return false;
    }

    this.setState({ isLoadingCep: true });

    try {
      const { data } = await this.apiv2.post(
        `/frete/cep`,
        { cep: Diversos.getnums(this.state.formCep) },
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImlhdCI6MTU5NjQ3NDg1Nn0.2K1SZ1d5ZYkvqZSIe8hbWa5LrSC7TB64F_XLKJ9qTow'
      );

      if (!data.status) {
        throw new Error(data.msg);
      }

      this.setState({
        formRua: data.msg.logradouro,
        formBairro: data.msg.bairro,
        formCidade: data.msg.localidade,
        formUf: data.msg.uf,
      });

      document.getElementById('formNumero')?.focus();
    } catch (e) {
      swal('Ops', e.message, 'warning');
    } finally {
      this.setState({ isLoadingCep: false });
    }

    return true;
  }

  async handleModalEndereco() {
    this.setState({ modalEndereco: true, formIsLoading: true });

    try {
      const param = { cpf: this.props.param.cpf };

      const response1 = await this.api.post(`/Cliente/consulta`, param);

      if (response1.data.status === true || response1.data.fgConta === true || response1.data.fgCadastro === false) {
        this.setState({
          formCodigo: response1.data.cliente.codigo,
          formNome: response1.data.cliente.nome,
          formNascimento: response1.data.cliente.nascimento,
          formDataconserasa: response1.data.cliente.dataconserasa,
          formTelefone: Diversos.maskTelefone(response1.data.cliente.telefone1),
          formCep: response1.data.cliente.cep,
          formRua: response1.data.cliente.rua,
          formNumero: response1.data.cliente.numero,
          formComplemento: response1.data.cliente.complemento,
          formBairro: response1.data.cliente.bairro,
          formCidade: response1.data.cliente.cidade,
          formUf: response1.data.cliente.uf,
        });
      }
    } catch (e) {
      Diversos.putLog(`handleModalEndereco: ERROR | ${e.message}`);
    } finally {
      this.setState({ modalEndereco: true, formIsLoading: false });
    }
  }

  renderModalEndereco() {
    const style = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 500,
      bgcolor: 'background.paper',
      border: '0px solid #000',
      boxShadow: 24,
      p: 4,
    };

    return (
      <Modal
        open={this.state.modalEndereco}
        onClose={() => this.setState({ modalEndereco: false })}
        aria-labelledby="modal-address-title"
        aria-describedby="modal-address-description"
      >
        <Card sx={style}>
          <CardHeader
            title={
              <Typography variant="h4" sx={{ fontSize: '1.2rem', fontWeight: '500', fontFamily: 'Roboto', color: 'primary.main' }}>
                Endereço de Entrega
              </Typography>
            }
            avatar={<LocationOnIcon sx={{ fontSize: '1.2rem', fontWeight: '500', fontFamily: 'Roboto', color: 'primary.main' }} />}
          />
          <CardContent sx={{ p: 0 }}>
            <form noValidate autoComplete="off" onSubmit={this.handleSubmitCliente.bind(this)}>
              <Grid container spacing={1}>
                {this.state.formIsLoading ? (
                  <Grid item xs={12}>
                    <Typography variant="h4" sx={{ fontSize: '1.3rem', fontWeight: '500', color: 'primary.main', textAlign: 'center' }}>
                      <CircularProgress size={40} color="primary" />
                      <br />
                      Pesquisando CPF...
                    </Typography>
                  </Grid>
                ) : null}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Celular"
                    margin="dense"
                    variant="outlined"
                    required
                    id="formTelefone"
                    name="formTelefone"
                    value={this.state.formTelefone}
                    onChange={(event) => this.setState({ formTelefone: Diversos.maskTelefone(Diversos.getnums(event.target.value)) })}
                    disabled={this.state.isSubmitting || this.state.formIsLoading || this.state.isLoadingCep}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="CEP"
                    margin="dense"
                    variant="outlined"
                    required
                    id="formCep"
                    name="formCep"
                    value={this.state.formCep}
                    onChange={(event) =>
                      this.setState({ formCep: Diversos.maskCEP(Diversos.getnums(event.target.value)) }, () => this.getCep())
                    }
                    helperText={
                      this.state.isLoadingCep ? (
                        <>
                          <CircularProgress size={12} />
                          <span>Pesquisando endereço, por favor aguarde...</span>
                        </>
                      ) : null
                    }
                    disabled={this.state.isSubmitting || this.state.formIsLoading || this.state.isLoadingCep}
                  />
                </Grid>
                <Grid item xs={6} />
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Endereço"
                    margin="dense"
                    variant="outlined"
                    required
                    id="formRua"
                    name="formRua"
                    value={this.state.formRua}
                    onChange={(event) => this.setState({ formRua: event.target.value })}
                    disabled={this.state.isSubmitting || this.state.formIsLoading || this.state.isLoadingCep}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Número"
                    margin="dense"
                    variant="outlined"
                    required
                    id="formNumero"
                    name="formNumero"
                    value={this.state.formNumero}
                    onChange={(event) => this.setState({ formNumero: event.target.value })}
                    disabled={this.state.isSubmitting || this.state.formIsLoading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Complemento"
                    margin="dense"
                    variant="outlined"
                    id="formComplemento"
                    name="formComplemento"
                    value={this.state.formComplemento}
                    onChange={(event) => this.setState({ formComplemento: event.target.value })}
                    disabled={this.state.isSubmitting || this.state.formIsLoading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bairro"
                    margin="dense"
                    variant="outlined"
                    required
                    id="formBairro"
                    name="formBairro"
                    value={this.state.formBairro}
                    onChange={(event) => this.setState({ formBairro: event.target.value })}
                    disabled={this.state.isSubmitting || this.state.formIsLoading || this.state.isLoadingCep}
                  />
                </Grid>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Cidade"
                    margin="dense"
                    variant="outlined"
                    required
                    id="formCidade"
                    name="formCidade"
                    value={this.state.formCidade}
                    onChange={(event) => this.setState({ formCidade: event.target.value })}
                    disabled={this.state.isSubmitting || this.state.formIsLoading || this.state.isLoadingCep}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl
                    fullWidth
                    margin="dense"
                    required
                    disabled={this.state.isSubmitting || this.state.formIsLoading || this.state.isLoadingCep}
                  >
                    <InputLabel id="select-estado-label">Estado</InputLabel>
                    <Select
                      labelId="select-estado-label"
                      id="select-estado"
                      value={this.state.formUf}
                      label="Estado"
                      onChange={(event) => this.setState({ formUf: event.target.value })}
                      disabled={this.state.isSubmitting || this.state.formIsLoading || this.state.isLoadingCep}
                    >
                      {Diversos.getUFs().map((row, index) => (
                        <MenuItem key={`uf-${row.value}`} value={row.value}>
                          {row.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    type="button"
                    onClick={() => this.setState({ modalEndereco: false })}
                    sx={{ ml: 0.5, borderColor: grey[500], color: grey[500] }}
                    variant="outlined"
                    disabled={this.state.isSubmitting || this.state.formIsLoading || this.state.isLoadingCep}
                  >
                    <CloseIcon sx={{ mr: 0.5 }} />
                    Cancelar
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    type="submit"
                    sx={{ mr: 0.5 }}
                    disabled={this.state.isSubmitting || this.state.formIsLoading || this.state.isLoadingCep}
                  >
                    {this.state.isSubmitting ? (
                      <>
                        <CircularProgress size={26} />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <SaveIcon sx={{ mr: 0.5 }} />
                        Salvar
                      </>
                    )}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Modal>
    );
  }

  render() {
    return (
      <Grid container>
        <Grid
          item
          xs={12}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          {this.props.adminh.Parametros.FGFEIRA === 'Sim' ? <h2>Informe seu CPF abaixo</h2> : <h2>Deseja inserir CPF ou CNPJ na nota?</h2>}
          <TextField
            autoFocus
            name="cpfNaNota"
            value={this.props.param.cpf}
            onChange={(event) =>
              this.props.setParam({
                ...this.props.param,
                cpf: Diversos.validateCPF(event.target.value)
                  ? Diversos.maskCPF(event.target.value)
                  : Diversos.maskCNPJ(event.target.value),
              })
            }
            fullWidth
            variant="standard"
            type="tel"
            sx={{
              width: '90%',
            }}
            inputRef={this.inputRef}
            inputProps={{
              maxLength: 14,
              style: {
                fontSize: '3rem',
                textAlign: 'center',
                backgroundColor: 'white',
                borderBottom: 'none',
                borderRadius: 70,
                fontFamily: 'Roboto',
                fontWeight: 700,
                marginTop: 20,
              },
            }}
            InputProps={{
              endAdornment: (
                <Button
                  size="large"
                  onClick={() =>
                    this.props.setParam({
                      ...this.props.param,
                      cpf: this.props.param.cpf.substring(0, this.props.param.cpf.length - 1),
                    })
                  }
                  sx={{
                    mt: 1,
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FontAwesomeIcon icon={faBackspace} sx={{ color: 'white', fontSize: 32 }} />
                  <br />
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: '1.2rem',
                      color: 'white',
                    }}
                  >
                    Apagar
                  </span>
                </Button>
              ),
            }}
          />
        </Grid>
        <Grid
          item
          xs={7}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppPad
            handler={(props) =>
              Diversos.getnums(props).length <= 11 &&
              this.props.setParam({
                ...this.props.param,
                cpf: `${Diversos.validateCPF(props) ? Diversos.maskCPF(props) : Diversos.maskCNPJ(props)}`,
              })
            }
            value={this.props.param.cpf}
          />
        </Grid>
        <Grid
          item
          xs={5}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
        >
          {this.props.adminh.Parametros.FGFEIRA !== 'Sim' ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <Button
                style={{ width: '100%', marginTop: 5 }}
                variant="contained"
                fullWidth
                size="large"
                className="btn-submit"
                onClick={() => {
                  this.audioCaixa.pause();

                  if (this.props.param.formapg === 1 && !Diversos.validateCPF(this.props.param.cpf)) {
                    swal('Atenção', 'Obrigatório informar CPF para forma de pagamento App Compre Rápido', 'warning');
                    return false;
                  }

                  if (
                    String(this.props.param.cpf).trim() === '' ||
                    (!Diversos.validateCPF(this.props.param.cpf) && !Diversos.validateCNPJ(this.props.param.cpf))
                  ) {
                    swal('Atenção', 'O CPF informado não é válido.', 'warning');
                    return false;
                  }

                  // if (
                  //   !this.props.param.cpf ||
                  //   String(this.props.param.cpf).trim() === '' ||
                  //   !Diversos.validateCPF(this.props.param.cpf)
                  // ) {
                  //   this.props.setParam({
                  //     ...this.props.param,
                  //     cpfClube: false,
                  //     cpfNaNota: false,
                  //   });

                  //   this.setState({
                  //     clubeCallFarma: false,
                  //     cpfNaNota: false,
                  //   });
                  // }

                  this.props.setParam({
                    ...this.props.param,
                    step: 4,
                  });
                }}
              >
                Avançar com {Diversos.validateCNPJ(this.props.param.cpf) ? 'CNPJ' : 'CPF'}
                <FontAwesomeIcon icon={faChevronRight} />
              </Button>
              <FormControl component="fieldset" sx={{ my: 4 }}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={this.state.clubeCallFarma}
                        onChange={() =>
                          this.setState(
                            {
                              clubeCallFarma: !this.state.clubeCallFarma,
                            },
                            () =>
                              this.props.setParam({
                                ...this.props.param,
                                cpfClube: this.state.clubeCallFarma,
                              })
                          )
                        }
                        name="clubeCallFarma"
                        sx={{
                          '& .MuiSvgIcon-root': {
                            fontSize: '3rem',
                            color: 'white',
                          },
                        }}
                      />
                    }
                    label={
                      <p className="checkbox-label">
                        Clube CallFarma
                        <small>(Benefícios e CashBack)</small>
                      </p>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={this.state.cpfNaNota}
                        onChange={() =>
                          this.setState({ cpfNaNota: !this.state.cpfNaNota }, () =>
                            this.props.setParam({
                              ...this.props.param,
                              cpfNaNota: this.state.cpfNaNota,
                            })
                          )
                        }
                        name="cpfNaNota"
                        sx={{
                          '& .MuiSvgIcon-root': {
                            fontSize: '3rem',
                            color: 'white',
                          },
                        }}
                      />
                    }
                    label={<p className="checkbox-label">CPF/CNPJ na Nota</p>}
                  />
                </FormGroup>
              </FormControl>
              {Number(this.props.param.formapg) > Number(1) ? (
                <Button
                  style={{ width: '100%', paddingVertical: 10, marginTop: 5 }}
                  variant="contained"
                  fullWidth
                  size="large"
                  className="btn-submit"
                  onClick={() => {
                    this.audioCaixa.pause();

                    this.props.setParam({
                      ...this.props.param,
                      cpfClube: false,
                      cpfNaNota: false,
                      step: 4,
                    });
                  }}
                >
                  Avançar sem CPF
                  <FontAwesomeIcon icon={faChevronRight} />
                </Button>
              ) : null}

              <Button
                variant="text"
                fullWidth
                size="medium"
                className="btn-back"
                onClick={() => this.props.setParam({ ...this.props.param, step: 2 })}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
                Continuar comprando
              </Button>
            </div>
          ) : (
            <>
              <Button
                style={{
                  width: '100%',
                  paddingVertical: 10,
                  marginTop: 15,
                  marginBottom: 15,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                variant="contained"
                fullWidth
                size="large"
                sx={{ bgcolor: '#5cb85c', py: 3, '&:hover': { bgcolor: '#276927' } }}
                onClick={() => {
                  if (!this.props.param.cpf || !Diversos.validateCPF(this.props.param.cpf)) {
                    swal('Necessário informar o CPF', 'Para continuarmos informe o CPF', 'info');
                  } else {
                    this.handleModalEndereco();
                    // this.setState({ modalEndereco: true });
                  }
                }}
              >
                <LocationOnIcon sx={{ mr: 0.3, fontSize: '3rem' }} />
                <Typography sx={{ fontSize: '1.3rem', fontWeight: '700', fontFamily: 'Roboto', color: 'white' }}>
                  Informar Endereço de Entrega e Continuar
                </Typography>
              </Button>
              <Button
                style={{
                  width: '100%',
                  paddingVertical: 10,
                  marginTop: 15,
                  marginBottom: 15,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                variant="outlined"
                fullWidth
                size="large"
                sx={{ bgcolor: 'transparent', borderColor: 'white', color: 'white', py: 1.5 }}
                onClick={() => this.props.setParam({ ...this.props.param, step: this.props.param.step - 1 })}
              >
                <ArrowBack sx={{ mr: 0.3, fontSize: '3rem' }} />
                <Typography sx={{ fontSize: '1.3rem', fontWeight: '700', fontFamily: 'Roboto', color: 'white' }}>Voltar</Typography>
              </Button>
            </>
          )}
        </Grid>

        {this.renderModalEndereco()}
      </Grid>
    );
  }
}

const mapStateToProps = (state: ApplicationState) => ({
  param: state.param.data,
  cart: state.cart.data,
});

const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators({ ...ParamActions, ...CartActions }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Step3);
