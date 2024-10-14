import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { Grid, IconButton, ButtonGroup, Button, CircularProgress } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBarcode, faExclamationCircle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import swal from '@sweetalert/with-react';
import moment from 'moment';
import console from 'console';
import { ApplicationState } from '../services/store';
import { Param } from '../services/store/ducks/param/types';
import * as ParamActions from '../services/store/ducks/param/actions';
import * as CartActions from '../services/store/ducks/cart/actions';
import Logo from '../../../assets/logo-callfarma.png';
import FlagBrasil from '../../../assets/flag-brasil.png';
import FlagIngles from '../../../assets/flag-ingles.png';
import FlagEspanhol from '../../../assets/flag-espanhol.png';
import Step1 from '../components/venda/step1';
import Step2 from '../components/venda/step2';
import Step3 from '../components/venda/step3';
import Step4 from '../components/venda/step4';
import Step5 from '../components/venda/step5';
import Step6 from '../components/venda/step6';
import Step7 from '../components/venda/step7';
import Step8 from '../components/venda/step8';
import Step9 from '../components/venda/step9-1';
import Step92 from '../components/venda/step9-2';
import Step10 from '../components/venda/step10';
import { Diversos } from '../services/diversos';
import ApiV2 from '../services/apiv2';
import PilotSelf from '../../../assets/pilot-self.png';

const electron = require('electron');

const remote = require('@electron/remote');

const { app } = require('@electron/remote');

const fs = remote.require('fs');
const path = require('path');
const { exec } = remote.require('child_process');

const koffi = remote.require('koffi');
const child = remote.require('child_process').execFile;

interface StateProps {
  param: Param;
}

interface DispatchProps {
  setParam(param: Param): void;
  clean(): void;
}

interface OwnProps {}

type Props = StateProps & DispatchProps & OwnProps;

class Venda extends React.Component<Props> {
  adminh: any = null;

  daruma: any = null;

  epson: any = null;

  db: any = null;

  apiv2: any = null;

  timerCheckImpressora: any = null;

  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      produtosTotal: 0,
      produtosProc: 0,
      fgSecondScreen: false,
      statusImp: true,
      statusNet: true,
    };

    this.apiv2 = new ApiV2();

    this.adminh = Diversos.getIni();
  }

  async componentDidMount() {
    await electron.ipcRenderer.sendSync('loading-show');

    Diversos.putLog(`- Iniciando Aplicação !!!`);
    Diversos.putLoadingMsg(`- Iniciando Aplicação !!!`);

    Diversos.putLoadingMsg(`Verificando novas atualizações do programa.`);

    let fgAtualizando = false;

    // try {
    //   const resultAtualizador = await electron.ipcRenderer.sendSync('verifica-atualizacao');

    //   if (resultAtualizador === 'Download da atualização feito com sucesso') {
    //     fgAtualizando = true;
    //     swal('Nova versão disponível.', 'O programa irá se auto atualizar, um momento...', 'info');
    //     electron.ipcRenderer.sendSync('verifica-atualizacao-restart', {});
    //   }
    // } catch (e) {
    //   Diversos.putLoadingMsg(`Falha ao verificação atualização (auto-updater) => ${JSON.stringify(e.message)}`);
    // }

    if (!fgAtualizando) {
      this.db = await Diversos.getDb();

      window.addEventListener('online', this.updateOnlineStatus.bind(this));
      window.addEventListener('offline', this.updateOnlineStatus.bind(this));

      this.updateOnlineStatus();

      this.props.clean();

      this.props.setParam({
        ...this.props.param,
        leitor: '',
        step: 1,
        vendedor: 1,
        cpf: '',
        celular: '',
        nome: '',
        formapg: 0,
        cpfNaNota: true,
        cpfClube: true,
        prevenda: '',
        loja: null,
      });

      if (this.props.param.step > 1) {
        this.props.setParam({ ...this.props.param, step: 1 });
      }

      if (this.adminh.Trier && this.adminh.Trier.URL && this.adminh.Trier.Token) {
        /*
          INTEGRAÇAO COM TRIER SISTEMAS
          ==================================
        */
        Diversos.putLoadingMsg(`Atualizando produtos da Trier`);

        await this.loadProdutosLocal(false);
      } else {
        /*
          INTEGRAÇAO COM TECWORKS SISTEMAS
          ==================================
        */

        if (String(this.adminh.Parametros.FGDEV).toLowerCase() !== 'sim') {
          Diversos.putLoadingMsg(`Ativando TEF`);

          const executablePath = path.resolve(this.adminh.Parametros.TEF, 'SERVERTEF.exe');

          child(executablePath, (err, data) => {
            if (err) {
              console.error(err);
            }
          });

          Diversos.putLoadingMsg(`Ativando processador de vendas`);
          const executablePathServerest = path.resolve(this.adminh.Parametros.TEF, 'SERVEREST.exe');

          child(executablePathServerest, (err, data) => {
            if (err) {
              console.error(err);
            }
          });
        }

        Diversos.putLoadingMsg(`Carregando dados da loja`);
        await this.getLoja();

        Diversos.putLoadingMsg(`Atualizando produtos`);
        await this.loadProdutosLocal(true);
      }

      // Diversos.putLoadingMsg(`Habilitando modo kioski`);

      // setTimeout(() => {
      //   exec('taskkill /f /im explorer.exe', (error, stdout, stderr) => {
      //     if (error) {
      //       console.error(`Erro ao executar o comando: ${error.message}`);
      //       return;
      //     }

      //     if (stderr) {
      //       console.error(`Erro no comando: ${stderr}`);
      //       return;
      //     }

      //     console.log(`Saída do comando: ${stdout}`);
      //   });
      // }, 1000 * 5); // atrasa 5 segundo

      Diversos.putLoadingMsg(`Inicialização concluída com sucesso`);

      await electron.ipcRenderer.sendSync('loading-close');
    }
  }

  async componentWillUnmount(): void {
    if (this.timerCheckImpressora !== null) {
      clearInterval(this.timerCheckImpressora);
      this.timerCheckImpressora = null;
    }
  }

  private handleInitConfigDaruma() {
    const GapAtivarAuditoria = this.adminh.Parametros.FGAUDITORIA === 'Sim';

    Diversos.putLog(`- handleInitConfigDaruma::paramLoja => ${JSON.stringify(this.props.param.loja)}`);

    const getLoja = this.props.param.loja;

    const cdcaixa = this.adminh.Parametros.CDCAIXA;

    try {
      Diversos.putLog(`- Verifica se impressora é Daruma para chamar Spool`);

      if (String(this.adminh.Parametros.IMPRESSORA).toLowerCase() === 'daruma') {
        const executablePath = path.resolve(this.adminh.Parametros.PREVENDA_PASTA, 'Spool_DLL.exe');

        child(executablePath, (err, data) => {
          if (err) {
            console.error(err);
          }
        });
      }

      Diversos.putLog(`- Carregando DLL DarumaFrameWork`);

      const DarumaFramework = koffi.load(path.resolve(this.adminh.Parametros.PASTANFCE, 'DarumaFrameWork.dll'));

      this.daruma = {
        iCFReImprimir_NFCe_Daruma: DarumaFramework.func('iCFReImprimir_NFCe_Daruma', 'int', ['str', 'str', 'str']),
        rCFVerificarStatus_NFCe_Daruma: DarumaFramework.func('rCFVerificarStatus_NFCe_Daruma', 'int', []),
        rNumDocsContingencia_NFCe_Daruma: DarumaFramework.func('rNumDocsContingencia_NFCe_Daruma', 'int', []),
        tEnviarContingenciaOffline_NFCe_Daruma: DarumaFramework.func('tEnviarContingenciaOffline_NFCe_Daruma', 'int', ['int']),
        rRetornarInformacao_NFCe_Daruma: DarumaFramework.func('rRetornarInformacao_NFCe_Daruma', 'int', [
          'str',
          'str',
          'str',
          'str',
          'str',
          'str',
          'str',
        ]),
        regAlterarValor_NFCe_Daruma: DarumaFramework.func('regAlterarValor_NFCe_Daruma', 'int', ['str', 'str']),
        regAlterarValor_Daruma: DarumaFramework.func('regAlterarValor_Daruma', 'int', ['str', 'str']),
        rStatusImpressora_NFCe_Daruma: DarumaFramework.func('rStatusImpressora_NFCe_Daruma', 'int', []),
        aCFVenderCompleto_NFCe_Daruma: DarumaFramework.func('aCFVenderCompleto_NFCe_Daruma', 'int', [
          'str',
          'str',
          'str',
          'str',
          'str',
          'str',
          'str',
          'str',
          'str',
          'str',
          'str',
        ]),
        aCFConfICMS40_NFCe_Daruma: DarumaFramework.func('aCFConfICMS40_NFCe_Daruma', 'int', ['str', 'str', 'str', 'str']),
        aCFConfICMS00_NFCe_Daruma: DarumaFramework.func('aCFConfICMS00_NFCe_Daruma', 'int', ['str', 'str', 'str', 'str']),
        aCFAbrir_NFCe_Daruma: DarumaFramework.func('aCFAbrir_NFCe_Daruma', 'int', [
          'str',
          'str',
          'str',
          'str',
          'str',
          'str',
          'str',
          'str',
          'str',
        ]),
        aCFTotalizar_NFCe_Daruma: DarumaFramework.func('aCFTotalizar_NFCe_Daruma', 'int', ['str', 'str']),
        aCFEfetuarPagamento_NFCe_Daruma: DarumaFramework.func('aCFEfetuarPagamento_NFCe_Daruma', 'int', ['str', 'str']),
        aCFEfetuarPagamentoCartao_NFCe_Daruma: DarumaFramework.func('aCFEfetuarPagamentoCartao_NFCe_Daruma', 'int', [
          'str',
          'str',
          'str',
          'str',
          'str',
          'str',
          'str',
        ]),
        tCFEncerrar_NFCe_Daruma: DarumaFramework.func('tCFEncerrar_NFCe_Daruma', 'int', ['str']),
        tCFCancelar_NFCe_Daruma: DarumaFramework.func('tCFCancelar_NFCe_Daruma', 'int', ['str', 'str', 'str', 'str', 'str']),
        aCFConfImposto_NFCe_Daruma: DarumaFramework.func('aCFConfImposto_NFCe_Daruma', 'int', ['str', 'str']),
        rURLQrcode_NFCe_Daruma: DarumaFramework.func('rURLQrcode_NFCe_Daruma', 'int', ['str']),
        eEmiteOffline_NFCe_Daruma: DarumaFramework.func('eEmiteOffline_NFCe_Daruma', 'int', ['str']),
      };

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: START\\LocalArquivos`);

      if (this.daruma.regAlterarValor_Daruma('START\\LocalArquivos', this.adminh.Parametros.PASTANFCE) != 1) {
        throw new Error(`START\\LocalArquivos - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: START\\LocalArquivosRelatorios`);

      if (this.daruma.regAlterarValor_Daruma('START\\LocalArquivosRelatorios', this.adminh.Parametros.PASTANFCE) != 1) {
        throw new Error(`START\\LocalArquivosRelatorios - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: START\\PathBibliotecasAuxiliares`);

      if (this.daruma.regAlterarValor_Daruma('START\\PathBibliotecasAuxiliares', this.adminh.Parametros.PASTANFCE) != 1) {
        throw new Error(`START\\PathBibliotecasAuxiliares - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: START\\Produto`);

      if (this.daruma.regAlterarValor_Daruma('START\\Produto', 'NFCE') != 1) {
        throw new Error(`START\\Produto - Error`);
      }

      if (GapAtivarAuditoria) {
        Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: CONFIGURACAO\\HabilitarAuditoria`);

        if (this.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\HabilitarAuditoria', '1') != 1) {
          throw new Error(`CONFIGURACAO\\HabilitarAuditoria - Error`);
        }

        Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: NFCE\\Auditoria`);

        if (this.daruma.regAlterarValor_Daruma('NFCE\\Auditoria', '1') != 1) {
          throw new Error(`NFCE\\Auditoria - Error`);
        }

        Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: DUAL\\Auditoria`);

        if (this.daruma.regAlterarValor_Daruma('DUAL\\Auditoria', '1') != 1) {
          throw new Error(`DUAL\\Auditoria - Error`);
        }
      } else {
        if (this.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\HabilitarAuditoria', '0') != 1) {
          throw new Error(`CONFIGURACAO\\HabilitarAuditoria - Error`);
        }

        if (this.daruma.regAlterarValor_Daruma('NFCE\\Auditoria', '0') != 1) {
          throw new Error(`NFCE\\Auditoria - Error`);
        }

        if (this.daruma.regAlterarValor_Daruma('DUAL\\Auditoria', '0') != 1) {
          throw new Error(`DUAL\\Auditoria - Error`);
        }
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: CONFIGURACAO\\EmpPK`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\EmpPK', 'aQ3FJKTGiYLsHQ5sYWXVrQ==') != 1) {
        throw new Error(`CONFIGURACAO\\EmpPK - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: CONFIGURACAO\\TokenSefaz`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\TokenSefaz', 'FQPZBSSLYBOCKHXTJGJQYONE3VMVVNW4KCTA') != 1) {
        throw new Error(`CONFIGURACAO\\TokenSefaz - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: CONFIGURACAO\\TipoAmbiente`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\TipoAmbiente', '1') != 1) {
        throw new Error(`CONFIGURACAO\\TipoAmbiente - Error`);
      }

      // Diversos.putLog(`- DarumaFrameWork.regAlterarValor_NFCe_Daruma: CONFIGURACAO\\ImpressaoCompleta`);

      // if (this.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\ImpressaoCompleta', '3') != 1) {
      //   throw new Error(`CONFIGURACAO\\ImpressaoCompleta - Error`);
      // }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_NFCe_Daruma: CONFIGURACAO\\ImpressaoCompleta`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\ImpressaoCompleta', '3') != 1) {
        throw new Error(`CONFIGURACAO\\ImpressaoCompleta - Error`);
      }

      Diversos.putLog(
        `- DarumaFrameWork.regAlterarValor_Daruma: CONFIGURACAO\\EmpCK => ${
          getLoja && getLoja.empck ? getLoja.empck : 'wgShSZ2jrQwxa/uZdEDnjEgbLFik2FyC'
        }`
      );

      if (this.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\EmpCK', String(getLoja.empck).trim()) != 1) {
        throw new Error(`CONFIGURACAO\\EmpCK - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: CONFIGURACAO\\VersaoQRCode`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\VersaoQRCode', '2') != 1) {
        throw new Error(`CONFIGURACAO\\VersaoQRCode - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: CONFIGURACAO\\NT\\VersaoNT`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\NT\\VersaoNT', '400') != 1) {
        throw new Error(`CONFIGURACAO\\NT\\VersaoNT - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: URLS\\PR\\Homologacao`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('URLS\\PR\\Homologacao', 'http://www.fazenda.pr.gov.br/nfce/qrcode') != 1) {
        throw new Error(`URLS\\PR\\Homologacao - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: URLS\\PR\\Producao`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('URLS\\PR\\Producao', 'http://www.fazenda.pr.gov.br/nfce/qrcode') != 1) {
        throw new Error(`URLS\\PR\\Producao - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: URLS\\PR\\ChaveConsultaHomologacao`);

      if (
        this.daruma.regAlterarValor_NFCe_Daruma('URLS\\PR\\ChaveConsultaHomologacao', 'http://www.fazenda.pr.gov.br/nfce/consulta') != 1
      ) {
        throw new Error(`URLS\\PR\\ChaveConsultaHomologacao - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: URLS\\PR\\ChaveConsultaProducao`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('URLS\\PR\\ChaveConsultaProducao', 'http://www.fazenda.pr.gov.br/nfce/consulta') != 1) {
        throw new Error(`URLS\\PR\\ChaveConsultaProducao - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: CONFIGURACAO\\TIMEZONESERVIDOR\\Utilizar`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\TIMEZONESERVIDOR\\Utilizar', '0') != 1) {
        throw new Error(`CONFIGURACAO\\TIMEZONESERVIDOR\\Utilizar - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: CONFIGURACAO\\TIMEZONESERVIDOR\\Valor`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\TIMEZONESERVIDOR\\Valor', '2') != 1) {
        throw new Error(`CONFIGURACAO\\TIMEZONESERVIDOR\\Valor - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: CONFIGURACAO\\AjustarValorFPgto`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\AjustarValorFPgto', '1') != 1) {
        throw new Error(`CONFIGURACAO\\AjustarValorFPgto - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: CONFIGURACAO\\ImpSegundaViaContingencia`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\ImpSegundaViaContingencia', '0') != 1) {
        throw new Error(`CONFIGURACAO\\ImpSegundaViaContingencia - Error`);
      }

      let marcaImpressora = '0'; // Daruma - 0, Epson - 1, Bematech - 2

      if (String(this.adminh.Parametros.IMPRESSORA).toLowerCase() === 'epson') {
        marcaImpressora = '1';
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: NFCE\\IMPRESSORA\\MarcaImpressora`);

      if (this.daruma.regAlterarValor_Daruma('NFCE\\IMPRESSORA\\MarcaImpressora', marcaImpressora) != 1) {
        throw new Error(`NFCE\\IMPRESSORA\\MarcaImpressora - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: DUAL\\MarcaImpressora`);

      if (this.daruma.regAlterarValor_Daruma('DUAL\\MarcaImpressora', marcaImpressora) != 1) {
        throw new Error(`DUAL\\MarcaImpressora - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: NFCE\\LEIDOIMPOSTO\\Habilitar`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('NFCE\\LEIDOIMPOSTO\\Habilitar', '1') != 1) {
        throw new Error(`NFCE\\LEIDOIMPOSTO\\Habilitar - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: NFCE\\MSGPROMOCIONAL\\Imprimir`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('NFCE\\MSGPROMOCIONAL\\Imprimir', '1') != 1) {
        throw new Error(`NFCE\\MSGPROMOCIONAL\\Imprimir - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: NFCE\\MSGPROMOCIONAL\\QuebrarLinha`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('NFCE\\MSGPROMOCIONAL\\QuebrarLinha', '1') != 1) {
        throw new Error(`NFCE\\MSGPROMOCIONAL\\QuebrarLinha - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: NFCE\\MSGPROMOCIONAL\\Titulo`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('NFCE\\MSGPROMOCIONAL\\Titulo', '') != 1) {
        throw new Error(`NFCE\\MSGPROMOCIONAL\\Titulo - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: EMIT\\CNPJ`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('EMIT\\CNPJ', getLoja.nf_cgc) != 1) {
        throw new Error(`EMIT\\CNPJ - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma:EMIT\\xNome`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('EMIT\\xNome', getLoja.gRazaoSocial) != 1) {
        throw new Error(`EMIT\\xNome - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma:EMIT\\ENDEREMIT\\xLgr`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('EMIT\\ENDEREMIT\\xLgr', getLoja.nf_end) != 1) {
        throw new Error(`EMIT\\ENDEREMIT\\xLgr - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma:EMIT\\ENDEREMIT\\Nro`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('EMIT\\ENDEREMIT\\Nro', Number(getLoja.nf_nrend).toFixed(0)) != 1) {
        throw new Error(`EMIT\\ENDEREMIT\\Nro - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma:EMIT\\ENDEREMIT\\xBairro`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('EMIT\\ENDEREMIT\\xBairro', getLoja.nf_Bai) != 1) {
        throw new Error(`EMIT\\ENDEREMIT\\xBairro - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma:EMIT\\ENDEREMIT\\cMun`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('EMIT\\ENDEREMIT\\cMun', Number(getLoja.nf_codmun).toFixed(0)) != 1) {
        throw new Error(`EMIT\\ENDEREMIT\\cMun - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma:EMIT\\ENDEREMIT\\xMun`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('EMIT\\ENDEREMIT\\xMun', getLoja.nf_cid) != 1) {
        throw new Error(`EMIT\\ENDEREMIT\\xMun - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma:EMIT\\ENDEREMIT\\UF`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('EMIT\\ENDEREMIT\\UF', getLoja.nf_uf) != 1) {
        throw new Error(`EMIT\\ENDEREMIT\\UF - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma:EMIT\\ENDEREMIT\\CEP`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('EMIT\\ENDEREMIT\\CEP', Number(getLoja.nf_cep).toFixed(0)) != 1) {
        throw new Error(`EMIT\\ENDEREMIT\\CEP - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma:EMIT\\UE`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('EMIT\\IE', getLoja.nf_ins) != 1) {
        throw new Error(`EMIT\\IE - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma:EMIT\\Fone`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('EMIT\\Fone', getLoja.nf_fon) != 1) {
        throw new Error(`EMIT\\Fone - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: INFRESPTEC\\CNPJ`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('INFRESPTEC\\CNPJ', '00991896000118') != 1) {
        throw new Error(`INFRESPTEC\\CNPJ - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: INFRESPTEC\\xContato`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('INFRESPTEC\\xContato', 'SILVANO APARECIDO ROBASKIEVICZ') != 1) {
        throw new Error(`INFRESPTEC\\xContato - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: INFRESPTEC\\email`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('INFRESPTEC\\email', 'silvano@tecworks.com.br') != 1) {
        throw new Error(`INFRESPTEC\\email - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: INFRESPTEC\\fone`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('INFRESPTEC\\fone', '4132464533') != 1) {
        throw new Error(`INFRESPTEC\\fone - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: IDE\\cMunFG`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('IDE\\cMunFG', Number(getLoja.nf_codmun).toFixed(0)) != 1) {
        throw new Error(`IDE\\cMunFG - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: IDE\\cUF`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('IDE\\cUF', '41') != 1) {
        throw new Error(`IDE\\cUF - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: NFCE\\Logotipo`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('NFCE\\Logotipo', 'T') != 1) {
        throw new Error(`NFCE\\Logotipo - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: EMIT\\CRT`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('EMIT\\CRT', '3') != 1) {
        throw new Error(`EMIT\\CRT - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: NFCE\\SepararCtgOfflineRejeitado`);

      if (
        this.daruma.regAlterarValor_Daruma(
          'NFCE\\SepararCtgOfflineRejeitado',
          path.resolve(this.adminh.Parametros.PASTANFCE, 'Rejeitadas')
        ) != 1
      ) {
        throw new Error(`NFCE\\SepararCtgOfflineRejeitado - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: NFCE\\AvisoContingencia`);

      if (this.daruma.regAlterarValor_Daruma('NFCE\\AvisoContingencia', '2') != 1) {
        throw new Error(`NFCE\\AvisoContingencia - Error`);
      }

      let portaImpressora = 'COM4';

      if (this.adminh.Parametros.IMPRESSORAPORTA) {
        portaImpressora = this.adminh.Parametros.IMPRESSORAPORTA;
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: NFCE\\IMPRESSORA\\PortaComunicacao`);

      if (this.daruma.regAlterarValor_Daruma('NFCE\\IMPRESSORA\\PortaComunicacao', portaImpressora) != 1) {
        throw new Error(`NFCE\\IMPRESSORA\\PortaComunicacao - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: NFCE\\IMPRESSORA\\ComunicacaoUSB`);

      if (this.daruma.regAlterarValor_Daruma('NFCE\\IMPRESSORA\\ComunicacaoUSB', marcaImpressora === '0' ? '1' : '0') != 1) {
        throw new Error(`NFCE\\IMPRESSORA\\ComunicacaoUSB - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: DUAL\\PortaComunicacao`);

      if (this.daruma.regAlterarValor_Daruma('DUAL\\PortaComunicacao', portaImpressora) !== 1) {
        throw new Error(`DUAL\\PortaComunicacao - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: DUAL\\ComunicacaoUSB`);

      if (this.daruma.regAlterarValor_Daruma('DUAL\\ComunicacaoUSB', marcaImpressora === '0' ? '1' : '0') != 1) {
        throw new Error(`DUAL\\ComunicacaoUSB - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: DUAL\\ControleAutomatico`);

      if (this.daruma.regAlterarValor_Daruma('DUAL\\ControleAutomatico', '1') !== 1) {
        throw new Error(`DUAL\\ControleAutomatico - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: DUAL\\EncontrarDUAL`);

      if (this.daruma.regAlterarValor_Daruma('DUAL\\EncontrarDUAL', '0') != 1) {
        throw new Error(`DUAL\\EncontrarDUAL - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: NFCE\\AvisoContingencia`);

      if (this.daruma.regAlterarValor_Daruma('NFCE\\AvisoContingencia', '2') != 1) {
        throw new Error(`NFCE\\AvisoContingencia - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: NFCE\\AjustarDataHora`);

      if (this.daruma.regAlterarValor_Daruma('NFCE\\AjustarDataHora', '1') != 1) {
        throw new Error(`NFCE\\AjustarDataHora - Error`);
      } // 1

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: NFCE\\EncontrarImpressora`);

      if (this.daruma.regAlterarValor_Daruma('NFCE\\EncontrarImpressora', '0') !== 1) {
        throw new Error(`NFCE\\EncontrarImpressora - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: NFCE\\IMPRESSORA\\ComunicacaoUSB`);

      if (this.daruma.regAlterarValor_Daruma('NFCE\\IMPRESSORA\\ComunicacaoUSB', '1') != 1) {
        throw new Error(`NFCE\\IMPRESSORA\\ComunicacaoUSB - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: NFCE\\IMPRESSORA\\ControleAutomatico`);

      if (this.daruma.regAlterarValor_Daruma('NFCE\\IMPRESSORA\\ControleAutomatico', '1') != 1) {
        throw new Error(`NFCE\\IMPRESSORA\\ControleAutomatico - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: CONFIGURACAO\\ImprimeDescAcrescItem`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('CONFIGURACAO\\ImprimeDescAcrescItem', '2') != 1) {
        throw new Error(`CONFIGURACAO\\ImprimeDescAcrescItem - Error`);
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: IDE\\Serie`);

      if (this.daruma.regAlterarValor_NFCe_Daruma('IDE\\Serie', Number(cdcaixa).toFixed(0)) != 1) {
        throw new Error(`IDE\\Serie - Error`);
      }

      const fgContingencia =
        String(this.adminh.Parametros.FGCONTINGENCIA).toLowerCase() === 'sim' ||
        Boolean(this.props.param.loja.contingencia) === Boolean(true);
      // const fgContingencia = true;

      if (fgContingencia) {
        Diversos.putLog(`- DarumaFrameWork.eEmiteOffline_NFCe_Daruma: Ativando contingencia Offline`);

        this.daruma.eEmiteOffline_NFCe_Daruma('1');
        // this.daruma.regAlterarValor_Daruma('NFCE\\AvisoContingencia', '2');
        // this.daruma.regAlterarValor_Daruma('NFCE\\EmissaoCtg', '2');
        // this.daruma.regAlterarValor_Daruma('NFCE\\EntradaCtg', '1');
        // this.daruma.regAlterarValor_Daruma('NFCE\\TempoCtg', '0');
        // this.daruma.regAlterarValor_Daruma('NFCE\\TimeOutWS', '1');
      } else {
        Diversos.putLog(`- DarumaFrameWork.eEmiteOffline_NFCe_Daruma: Desativando contingencia Offline`);

        this.daruma.eEmiteOffline_NFCe_Daruma('0');

        Diversos.putLog(`--> Verificando NFCe em contingência`);

        const numContigencia = this.daruma.rNumDocsContingencia_NFCe_Daruma();

        if (Number(numContigencia) > Number(0)) {
          Diversos.putLog(`--> Existem ${numContigencia} nfce com contingência, retransmitindo...`);

          if (this.daruma.tEnviarContingenciaOffline_NFCe_Daruma(0) != 1) {
            Diversos.putLog(`--> Não foi possível transmitir NFCe em contingência`);
          } else {
            Diversos.putLog(`--> NFCe em contingência transmitidas com sucesso`);
          }
        }
      }

      Diversos.putLog(`- DarumaFrameWork.regAlterarValor_Daruma: Ajustando ultimo numero de NFCe`);

      Diversos.putLog(`--> Verificando ultimo numero de NFCe emitida`);
      const ptrNumUltNfe = '';

      const resultaInfoNFCeDaruma = this.daruma.rRetornarInformacao_NFCe_Daruma(
        'NUM',
        '0',
        '0',
        Number(this.adminh.Parametros.CDCAIXA).toFixed(0),
        '',
        '9',
        ptrNumUltNfe
      );

      Diversos.putLog(`--> Passo 1: ${JSON.stringify(ptrNumUltNfe)}`);

      Diversos.putLog(`--> Chamou funcao de ultima NFCe emitida`);

      if (resultaInfoNFCeDaruma == 1) {
        Diversos.putLog(`--> Buscando xml`);

        const xmlRetorno = fs.readFileSync(path.resolve(this.adminh.Parametros.PASTANFCE, 'documentosRetorno.xml'), 'utf-8');

        const regex = /<DocNumero>(.+?)<\/DocNumero>/;

        const tmpNumUltNfe = regex.exec(xmlRetorno.toString('utf-8'));

        Diversos.putLog(`--> Retorno localizado: ${JSON.stringify(tmpNumUltNfe)}`);

        if (!tmpNumUltNfe) {
          throw new Error('Não foi possível capturar último número de NFCe emitida');
        }

        const numUltNfe = Number(tmpNumUltNfe[1]);

        const numUltNfeLocal = Number(this.adminh.Parametros.ULTNFCE);

        if (numUltNfeLocal < numUltNfe) {
          Diversos.putIni({
            ...this.adminh,
            Parametros: { ...this.adminh.Parametros, ULTNFCE: numUltNfe },
          });
        }

        Diversos.putLog(`--> Numero atualizado com sucesso`);
      }

      Diversos.putLog(`--> Concluiu inicializacao Daruma`);

      this.props.setParam({ ...this.props.param, fgDaruma: true });

      this.handleInitCheckPrint();

      return true;
    } catch (e) {
      console.error(e.message);

      Diversos.putLog(`- DarumaFrameWork falha na inicialização: ${e.message}`);

      swal('Entre em contato com o suporte!', e.message, 'warning').then(() => {
        Diversos.putLog(`- Exibiu mensagem de chamada ao suporte e fechou a aplicacao`);
        electron.ipcRenderer.sendSync('fecha-aplicacao', {});
      });

      this.props.setParam({ ...this.props.param, fgDaruma: false });

      return false;
    }
  }

  private handleInitCheckPrint() {
    Diversos.putLog(`--> Ativando monitoramento da impressora`);

    if (['epson'].includes(String(this.adminh.Parametros.IMPRESSORA).trim().toLowerCase())) {
      Diversos.putLog(`Vai ler DLL na pasta: ${path.resolve(this.adminh.Parametros.PASTANFCE, 'InterfaceEpsonNF.dll')}`);

      const EpsonFramework = koffi.load(path.resolve(this.adminh.Parametros.PASTANFCE, 'InterfaceEpsonNF.dll'));

      this.epson = {
        IniciaPorta: EpsonFramework.func('IniciaPorta', 'int', ['str']),
        FechaPorta: EpsonFramework.func('FechaPorta', 'int', []),
        ImprimeTexto: EpsonFramework.func('ImprimeTexto', 'int', ['str']),
        Le_Status: EpsonFramework.func('Le_Status', 'int', []),
        Habilita_Log: EpsonFramework.func('Habilita_Log', 'int', ['int', 'str']),
      };

      this.timerCheckImpressora = setInterval(async () => {
        if (this.props.param.step <= 3) {
          const retornoImpressora = await this.checkStatusImpressora(String(this.adminh.Parametros.IMPRESSORA).trim().toLowerCase());
          this.setState({ statusImp: retornoImpressora });
        } else {
          this.setState({ statusImp: true });
        }
      }, 1000 * 5);
    } else {
      Diversos.putLog(`--> Marca da impressora não homologada para monitoramento`);
    }
  }

  private async getLoja() {
    try {
      const { data } = await this.apiv2.get(`/loja/${this.adminh.Parametros.CDFIL}`, this.adminh.Parametros.API_V2_TOKEN);

      if (!data.status) {
        throw new Error(data.msg);
      }

      this.props.setParam({
        ...this.props.param,
        loja: {
          nf_cgc: Diversos.getnums(data.msg.CGC),
          gRazaoSocial: data.msg.NOME,
          nf_end: data.msg.ENDER,
          nf_nrend: data.msg.NREND,
          nf_Bai: data.msg.BAIRRO,
          nf_cid: data.msg.CIDADE,
          nf_uf: data.msg.UF,
          nf_codmun: data.msg.CODMUN,
          nf_cep: Diversos.getnums(data.msg.CEP),
          nf_ins: Diversos.getnums(data.msg.INSEST),
          nf_fon: Diversos.getnums(data.msg.FONE),
          empck: String(data.msg.EMPCK).trim(),
          contingencia: String(data.msg.TEFNFCE).trim().toLowerCase() === 'c',
        },
      });

      Diversos.putLog(
        `Dados da loja: (${this.adminh.Parametros.CDFIL}) ${data.msg.CGC} - ${data.msg.NOME} carregados com sucesso. EMPCK: ${
          data.msg.EMPCK
        } | TEFNFCE: ${String(data.msg.TEFNFCE).trim()}`
      );
    } catch (e) {
      Diversos.putLog(`Problemas ao carregar dados da loja: ${e.message}`);

      swal('Entre em contato com o suporte!', e.message, 'warning').then(() => {
        Diversos.putLog(`- Exibiu mensagem de chamada ao suporte e fechou a aplicacao`);
        electron.ipcRenderer.sendSync('fecha-aplicacao', {});
      });
    }
  }

  private async loadProdutosLocal(fgTecWorks = true) {
    if (
      this.adminh.Parametros.ULTFTP &&
      moment(this.adminh.Parametros.ULTFTP, 'YYYY-MM-DD').isValid() &&
      moment(this.adminh.Parametros.ULTFTP, 'YYYY-MM-DD').format('YYYYMMDD') >= moment().format('YYYYMMDD')
    ) {
      if (
        fgTecWorks &&
        ['daruma', 'epson'].includes(String(this.adminh.Parametros.IMPRESSORA).toLowerCase()) &&
        String(this.adminh.Parametros.FGDEV).toLowerCase() !== 'sim'
      ) {
        Diversos.putLoadingMsg(`Carregando DarumaFramework`);

        this.handleInitConfigDaruma();
      }

      this.setState({ isLoading: false });
      return true;
    }

    this.setState({ isLoading: true });

    try {
      Diversos.putLog(`- Vai carregar produtos`);

      Diversos.putLoadingMsg(`Pesquisando produtos...`);

      if (fgTecWorks) await electron.ipcRenderer.sendSync('load-produtos');
      else await electron.ipcRenderer.sendSync('trier-load-produtos');

      Diversos.putLoadingMsg(`Concluiu pesquisa dos produtos`);

      Diversos.putLog(`- Finalizou carregamento dos produtos`);

      this.adminh = Diversos.putIni({
        ...this.adminh,
        Parametros: {
          ...this.adminh.Parametros,
          ULTFTP: moment().format('YYYY-MM-DD'),
        },
      });

      Diversos.putLog(`- Atualizou data da ultima atualização do FTP`);

      this.setState({ isLoading: false });
    } catch (e) {
      Diversos.putLog(`- Falha ao carregar produtos: ${e.message}`);
      Diversos.putLoadingMsg(`- Falha ao carregar produtos: ${e.message}`);
      console.log(e.message);
      this.setState({ isLoading: false });

      swal('Entre em contato com o suporte!', e.message, 'warning').then(() => {
        Diversos.putLog(`- Exibiu mensagem de chamada ao suporte e fechou a aplicacao`);
        electron.ipcRenderer.sendSync('fecha-aplicacao', {});
      });
    }

    if (
      fgTecWorks &&
      ['daruma', 'epson'].includes(String(this.adminh.Parametros.IMPRESSORA).toLowerCase()) &&
      String(this.adminh.Parametros.FGDEV).toLowerCase() !== 'sim'
    ) {
      this.handleInitConfigDaruma();
    }

    return true;
  }

  private updateOnlineStatus() {
    if (navigator.onLine) {
      this.props.setParam({ ...this.props.param, fgOffline: true });
      this.setState({ statusNet: true });
    } else {
      this.props.setParam({ ...this.props.param, fgOffline: false });
      this.setState({ statusNet: false });
    }
  }

  private async checkStatusImpressora(marca) {
    try {
      let count = 0;

      do {
        count++;

        let retorno = null;

        switch (marca) {
          case 'epson':
            Diversos.putLoadingMsg(`Ativando monitoramento da Epson`);
            // Diversos.putLog('Epson - Inicia Comunicação');

            const retornoEpsonIniciaPorta = this.epson.IniciaPorta('USB');

            // Diversos.putLog(`Retorno: Epson Inicia Porta: ${retornoEpsonIniciaPorta}`);

            if (Number(retornoEpsonIniciaPorta) !== Number(1)) {
              throw new Error('Falha de comunicação com a impressora. Avise o suporte técnico.');
            }

            // Diversos.putLog('Habilitando logs Epson');

            const retornoEpson = this.epson.Habilita_Log(0, path.resolve(this.adminh.Parametros.PASTANFCE));

            // Diversos.putLog(`Retorno: logs Epson: ${retornoEpson}`);

            retorno = this.epson.Le_Status();

            // Diversos.putLog(`Verificando impressora caixa: ${this.adminh.Parametros.CDCAIXA} | Retorno: ${retorno}`);

            if (Number(retorno) === Number(5)) {
              // Diversos.putLog('Epson - Fecha Comunicação');

              this.epson.FechaPorta();

              throw new Error('Impressora com pouco papel');
            }

            if (Number(retorno) === Number(9)) {
              // Diversos.putLog('Epson - Fecha Comunicação');

              this.epson.FechaPorta();

              throw new Error('Impressora com a tampa aberta');
            }

            if (Number(retorno) === Number(32)) {
              // Diversos.putLog('Epson - Fecha Comunicação');

              this.epson.FechaPorta();

              throw new Error('Impressora sem papel');
            }

            if (Number(retorno) === Number(24)) {
              // Diversos.putLog('Epson - Fecha Comunicação');

              this.epson.FechaPorta();

              return true;
            }

            // Diversos.putLog('Epson - Fecha Comunicação');

            this.epson.FechaPorta();

            break;
          case 'daruma':
            Diversos.putLoadingMsg(`Ativando monitoramento da Daruma`);

            retorno = this.daruma.rStatusImpressora_NFCe_Daruma();

            Diversos.putLog(`Verificando impressora caixa: ${this.adminh.Parametros.CDCAIXA} | Retorno: ${retorno}`);

            if (Number(retorno) === Number(-49)) {
              throw new Error('Impressora com pouco papel');
            }

            if (Number(retorno) === Number(-51)) {
              throw new Error('Impressora sem papel');
            }

            if (Number(retorno) === Number(1)) {
              return true;
            }
            break;
          default:
            return true;
        }

        await new Promise((resolve) => {
          setTimeout(() => resolve(true), 1000 * 2);
        });
      } while (count <= 3);

      throw new Error('Problemas de comunicação com a impressora');
    } catch (e) {
      return e.message;
    }
  }

  private renderStep() {
    const self = this;

    switch (self.props.param.step) {
      case 1:
        return (
          <>
            <div className="main-header">
              <IconButton>
                <FontAwesomeIcon icon={faExclamationCircle} className="icon-help text-white" />
              </IconButton>

              <img src={Logo} alt="Logo" className="header-logo" />

              <ButtonGroup variant="text">
                <Button>
                  <img src={FlagBrasil} className="flag" alt="FlagBrasil" />
                </Button>
              </ButtonGroup>
            </div>
            <div className="main-body has-header">
              <Step1 adminh={this.adminh} db={this.db} />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                position: 'fixed',
                bottom: 2,
                right: 2,
              }}
            >
              <img src={PilotSelf} alt="Logo Pilot Self" style={{ width: 120, height: 'auto', marginBottom: 5, marginRight: 5 }} />
              <span style={{ fontSize: 12, color: '#000611' }}>{this.adminh.Parametros.VERSAO}</span>
            </div>
          </>
        );
      case 2:
        return (
          <div className="main-body">
            <Step2 adminh={this.adminh} db={this.db} />
          </div>
        );
      case 3:
        return (
          <div className="main-body">
            <Step3 adminh={this.adminh} db={this.db} />
          </div>
        );
      case 4:
        return (
          <div className="main-body">
            <Step4 adminh={this.adminh} db={this.db} />
          </div>
        );
      case 5:
        return (
          <div className="main-body">
            <Step5 adminh={this.adminh} db={this.db} daruma={this.daruma} />
          </div>
        );
      case 6:
        return (
          <div className="main-body">
            <Step6 adminh={this.adminh} db={this.db} />
          </div>
        );
      case 7:
        return (
          <div className="main-body">
            <Step7 adminh={this.adminh} db={this.db} />
          </div>
        );
      case 8:
        return (
          <div className="main-body">
            <Step8 adminh={this.adminh} db={this.db} />
          </div>
        );
      case 9:
        return (
          <div className="main-body">
            <Step9 adminh={this.adminh} db={this.db} />
          </div>
        );
      case 9.2:
        return (
          <div className="main-body">
            <Step92 adminh={this.adminh} db={this.db} />
          </div>
        );
      case 10:
        return <Step10 adminh={this.adminh} db={this.db} />;
      default:
        return <span />;
    }
  }

  render() {
    return (
      <div className="main-window">
        {/* eslint-disable */}
        {this.state.isLoading ? (
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
            <CircularProgress size={120} color="inherit" />
            <h3 style={{ fontSize: 22, fontWeight: 500, color: 'white' }}>Atualizando produtos, por favor aguarde...</h3>
          </div>
        ) : this.state.statusImp !== true ? (
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
              backgroundColor: '#d9534f',
              textAlign: 'center',
            }}
          >
            <FontAwesomeIcon icon={faExclamationCircle} fontSize={18} color="white" style={{ fontSize: 18, color: 'white' }} />
            <h1 style={{ fontSize: 26, fontWeight: 500, color: 'white', marginTop: 50, marginBottom: 15 }}>
              Atenção, necessário a presença do gerente da loja.
            </h1>
            <h3 style={{ fontSize: 18, fontWeight: 400, color: 'white' }}>{this.state.statusImp}</h3>
          </div>
        ) : this.state.statusNet !== true ? (
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
              backgroundColor: '#d9534f',
              textAlign: 'center',
            }}
          >
            <FontAwesomeIcon
              icon={faExclamationCircle}
              fontSize={18}
              color="white"
              style={{ fontSize: 18, color: 'white', width: 75, height: 75 }}
            />
            <h1 style={{ fontSize: 26, fontWeight: 500, color: 'white', marginTop: 50, marginBottom: 15 }}>
              Atenção, necessário a presença do gerente da loja.
            </h1>
            <h3 style={{ fontSize: 18, fontWeight: 400, color: 'white' }}>Sem conexão com internet ativa.</h3>
          </div>
        ) : (
          this.renderStep()
        )}
        {/* eslint-enable */}
      </div>
    );
  }
}

const mapStateToProps = (state: ApplicationState) => ({
  param: state.param.data,
});

const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators({ ...ParamActions, ...CartActions }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Venda);
