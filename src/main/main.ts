/* eslint-disable prettier/prettier */
/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
// import path from 'path';
import { app, BrowserWindow, shell, ipcMain, screen, dialo, Notification } from 'electron';
const { autoUpdater } = require('electron-updater');
// import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const path = require('path');
const sqlite3 = require('sqlite3-offline-next').verbose();
const { DBFFile } = require('dbffile');
const fs = require('fs');
const ini = require('ini');
const moment = require('moment-timezone');
const ftp = require('basic-ftp');
const decompress = require('decompress');
const axios = require('axios');

require('@electron/remote/main').initialize();

require('electron-debug')();

let mainWindow = null;

let secondWindow = null;

let loadWindow = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged ? path.join(process.resourcesPath, 'assets') : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths) => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1440,
    height: 900,
    icon: getAssetPath('pilot-self.png'),
    frame: isDebug ? true : false,
    kiosk: isDebug ? false : true,
    fullscreen: true,
    autoHideMenuBar: true,
    alwaysOnTop: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  if (isDebug) {
    mainWindow.webContents.openDevTools();
  }

  require('@electron/remote/main').enable(mainWindow.webContents);

  mainWindow.loadURL(resolveHtmlPath('index.html') + '?venda');

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    mainWindow.minimize();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

const createSecondWindow = async () => {
  const displays = screen.getAllDisplays();

  const externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0;
  });

  if (!externalDisplay) {
    return true;
  }

  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged ? path.join(process.resourcesPath, 'assets') : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths) => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  if (!isDebug) {
    secondWindow = new BrowserWindow({
      show: false,
      x: !externalDisplay ? 0 : externalDisplay.bounds.x,
      y: !externalDisplay ? 0 : externalDisplay.bounds.y,
      width: 600,
      height: 1024,
      alwaysOnTop: true,

      frame: false,
      kiosk: true,
      fullscreen: true,
      autoHideMenuBar: true,

      icon: getAssetPath('pilot-self.png'),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false,
      },
    });

    // secondWindow.webContents.openDevTools();

    require('@electron/remote/main').enable(secondWindow.webContents);

    secondWindow.loadURL(resolveHtmlPath('index.html' + '?monitor'));

    secondWindow.on('ready-to-show', () => {
      if (!secondWindow) {
        throw new Error('"secondWindow" is not defined');
      }

      secondWindow.minimize();
    });

    secondWindow.on('closed', () => {
      secondWindow = null;
    });

    secondWindow.webContents.setWindowOpenHandler((edata) => {
      shell.openExternal(edata.url);
      return { action: 'deny' };
    });
  }
};

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.setPath('crashDumps', app.getPath('userData'));

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app
  .whenReady()
  .then(() => {
    ipcMain.on('verifica-atualizacao', async (event, arg) => {
      const iniLocation = path.resolve(app.getPath('userData'), require('../../package.json').iniName);
      const msgLoadLocation = path.resolve(app.getPath('userData'), 'loading_msg.txt');

      const adminh = ini.parse(fs.readFileSync(iniLocation, 'utf-8'));

      fs.appendFileSync(adminh.Parametros.LOGFILE, `Auto-Updater => Vai verificar se existe nova atualizacao\n`);

      fs.appendFileSync(adminh.Parametros.LOGFILE, `Auto-Updater => Ativando log detalhado\n`);

      autoUpdater.logger = require('electron-log');

      autoUpdater.logger.transports.file.level = 'debug';

      event.returnValue = await new Promise((resolve, reject) => {
        autoUpdater.checkForUpdatesAndNotify();

        fs.appendFileSync(adminh.Parametros.LOGFILE, `Auto-Updater => Chamou checkForUpdatesAndNotify\n`);

        autoUpdater.on('error', (err) => {
          fs.appendFileSync(adminh.Parametros.LOGFILE, `autoUpdater::error => ${JSON.stringify(err)}\n`);
          reject('Erro ao verificar atualização');
        });

        autoUpdater.on('checking-for-update', () => {
          fs.writeFileSync(msgLoadLocation, `Verificando última atualização\n`);
          fs.appendFileSync(adminh.Parametros.LOGFILE, `autoUpdater::checking-for-update\n`);
        });

        autoUpdater.on('update-available', (info) => {
          fs.writeFileSync(msgLoadLocation, `Nova atualização disponível\n`);
          fs.appendFileSync(adminh.Parametros.LOGFILE, `autoUpdater::update-available => ${JSON.stringify(info)}\n`);
        });

        autoUpdater.on('update-not-available', (info) => {
          fs.writeFileSync(msgLoadLocation, `Nenhum atualização disponível\n`);
          fs.appendFileSync(adminh.Parametros.LOGFILE, `autoUpdater::update-no-available => ${JSON.stringify(info)}\n`);
          resolve('Nenhum atualização disponível');
        });

        autoUpdater.on('download-progress', (progress) => {
          fs.writeFileSync(msgLoadLocation, `Baixando atualização... ${Math.floor(progress.percent)}%\n`);
          fs.appendFileSync(adminh.Parametros.LOGFILE, `autoUpdater::download-progress -> ${progress.percent}%\n`);
        });

        autoUpdater.on('update-downloaded', () => {
          fs.appendFileSync(adminh.Parametros.LOGFILE, `autoUpdater::update-downloaded\n`);
          fs.writeFileSync(msgLoadLocation, `Última atualização baixada com sucesso.\n`);

          new Notification({
            title: 'Atualização disponível',
            body: 'O programa irá se auto-atualizar!',
          }).show();

          resolve('Download da atualização feito com sucesso');
        });
      });
    });

    ipcMain.on('verifica-atualizacao-restart', async (event, arg) => {
      // Fecha todas as janelas, exceto a janela principal
      BrowserWindow.getAllWindows().forEach((window) => {
        if (window !== mainWindow) {
          window.close();
        }
      });

      setTimeout(() => {
        autoUpdater.quitAndInstall(false, true);
      }, 1000);
    });

    ipcMain.on('get-second-screen', async (event, arg) => {
      const displays = screen.getAllDisplays();

      const externalDisplay = displays.find((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0;
      });

      if (externalDisplay) {
        return true;
      }

      event.returnValue = false;
    });

    ipcMain.on('loading-show', async (event, arg) => {
      loadWindow = new BrowserWindow({
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          webSecurity: false,
        },
        show: true,
        width: 500,
        height: 300,
        frame: false,
      });

      require('@electron/remote/main').enable(loadWindow.webContents);

      loadWindow.loadURL(resolveHtmlPath('index.html') + '?loading');

      loadWindow.on('ready-to-show', () => {
        if (!loadWindow) {
          throw new Error('"loadWindow" is not defined');
        }

        // loadWindow.webContents.openDevTools();

        loadWindow.show();
        loadWindow.focus();
      });

      event.returnValue = true;
    });

    ipcMain.on('loading-close', async (event, arg) => {
      if (loadWindow) {
        loadWindow.close();
      }

      if (secondWindow) {
        secondWindow.show();
        secondWindow.setFullScreen(true);
      }

      if (mainWindow) {
        mainWindow.show();
        mainWindow.setFullScreen(true);
        mainWindow.focus();
      }

      event.returnValue = true;
    });

    ipcMain.on('load-produtos', async (event, arg) => {
      const iniLocation = path.resolve(app.getPath('userData'), require('../../package.json').iniName);

      const adminh = ini.parse(fs.readFileSync(iniLocation, 'utf-8'));

      fs.appendFileSync(adminh.Parametros.LOGFILE, `Load Produtos Iniciado\n`);

      let db = null;

      const result = await new Promise(async (resolve, reject) => {
        try {
          fs.appendFileSync(adminh.Parametros.LOGFILE, `Abrindo arquivo PDVPRODU.dbf\n`);

          const dfbFileProdutos = path.resolve(adminh.Parametros.PREVENDA_PASTA, 'PDVPRO.dbf');

          const dadosFile = path.resolve(adminh.Parametros.PREVENDA_PASTA, 'DADOS.ZIP');

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Conectando ao FTP\n`);

          const client = new ftp.Client();

          client.ftp.verbose = true;

          const ftpCredenciais = {
            host: adminh.Parametros.FTPENDE,
            user: `ftp${adminh.Parametros.CDFIL}`,
            password: 'metron',
            secure: false,
            port: 21,
          };

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Usando as credenciais: ${JSON.stringify(ftpCredenciais)}\n`);

          await client.access(ftpCredenciais);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `FTP Conectado\n`);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Baixando arquivo DADOS.ZIP\n`);

          await client.downloadTo(dadosFile, 'envio/DADOS.ZIP');

          if (!fs.existsSync(dadosFile)) {
            throw new Error(`Arquivo de DADOS.ZIP não localizado em ${dadosFile}`);
          }

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Download concluido\n`);

          if (fs.existsSync(dfbFileProdutos)) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `Apagando arquivos antigos\n`);
            fs.unlinkSync(dfbFileProdutos);
          }

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Descompactando\n`);

          await decompress(dadosFile, adminh.Parametros.PREVENDA_PASTA);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `DADOS.ZIP descompactado\n`);

          if (!fs.existsSync(dfbFileProdutos)) {
            throw new Error(`Arquivo de produtos.dbf não localizado em ${dfbFileProdutos}`);
          }

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Abrindo banco de dados SQLite\n`);

          const dbFile = path.resolve(app.getPath('userData'), 'callfarmadb.db');

          db = new sqlite3.Database(dbFile, (error) => {
            if (error) {
              reject(error.message);
            }
          });

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Apagando tabela Produtos\n`);

          db.exec(`DROP TABLE IF EXISTS Produtos;`);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Criando tabela Produtos\n`);

          db.exec(`
            CREATE TABLE Produtos
            (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              codigo TEXT,
              codint INTEGER NOT NULL,
              nome TEXT NOT NULL,
              preco NUMERIC NOT NULL,
              prepro NUMERIC,
              icms NUMERIC,
              ncm TEXT,
              tipo TEXT,
              tipogru INTEGER,
              grupo INTEGER,
              kitqtd INTEGER,
              kitdsc NUMERIC,
              qtdproqt INTEGER,
              descproqt NUMERIC,
              vlrproqt NUMERIC,
              cdfamil NUMERIC,
              mkt09 TEXT
            );
          `);

          db.exec(`CREATE INDEX IF NOT EXISTS "idx1" ON "Produtos" ("codigo");`);

          db.exec(`CREATE INDEX IF NOT EXISTS "idx2" ON "Produtos" ("codint");`);

          db.exec(`
            CREATE TABLE IF NOT EXISTS Venda
            (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              cpfNaNota TEXT,
              cpfClube TEXT,
              totalBruto NUMERIC,
              totalDesconto NUMERIC,
              totalLiquido NUMERIC,
              data_criado TEXT,
              cdfil INTEGER,
              cdcaixa INTEGER,
              nfce INTEGER,
              serie INTEGER,
              formapg INTEGER
            );
          `);

          db.exec(`
            CREATE TABLE IF NOT EXISTS VendaItem
            (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              vendaId INTEGER,
              produto TEXT,
              qtd INTEGER,
              valorBruto NUMERIC,
              valorDesconto NUMERIC,
              valorLiquido NUMERIC
            );
          `);

          // db.exec(`DROP TABLE IF EXISTS Pdvcai;`);

          db.exec(`
            CREATE TABLE IF NOT EXISTS Pdvcai
            (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              operador INTEGER,
              data_criado TEXT,
              trocoini NUMERIC,
              sangria NUMERIC,
              suprimento NUMERIC,
              dinheiro NUMERIC,
              cheque NUMERIC,
              chequep NUMERIC,
              cartao01 NUMERIC,
              cartao02 NUMERIC,
              funcion NUMERIC,
              cartao03 NUMERIC,
              cartao04 NUMERIC,
              totcli INTEGER,
              desconto NUMERIC,
              cupons INTEGER,
              cuponsdes INTEGER,
              gaveta INTEGER,
              horaini TEXT,
              horafim TEXT,
              cupcanc INTEGER,
              cartao NUMERIC,
              convenio NUMERIC,
              recarga NUMERIC,
              formulas NUMERIC,
              pos NUMERIC,
              pagamento NUMERIC,
              devoluc NUMERIC,
              devdinh NUMERIC,
              trocoami NUMERIC,
              giftcard NUMERIC,
              trococar NUMERIC,
              canccre NUMERIC,
              cancdeb NUMERIC,
              uber NUMERIC,
              app NUMERIC,
              cartdig NUMERIC
            );
          `);

          db.exec(`CREATE INDEX IF NOT EXISTS "Pdvcai-idx1" ON "Pdvcai" ("data");`);

          // db.exec(`DROP TABLE IF EXISTS Pdvmovfin;`);

          db.exec(`
            CREATE TABLE IF NOT EXISTS Pdvmovfin
            (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              filial NUMERIC,
              data_criado TEXT,
              operador NUMERIC,
              operacao TEXT,
              cartao TEXT,
              parcelas TEXT,
              valor NUMERIC,
              qtd NUMERIC,
              transmit TEXT
            );
          `);

          db.exec(`CREATE INDEX IF NOT EXISTS "Pdvmovfin-idx1" ON "Pdvmovfin" ("data");`);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Lendo produtos do arquivo\n`);

          const dbf = await DBFFile.open(dfbFileProdutos);

          let ctrl = 0;

          const ctrlIncrement = 500;

          const total = dbf.recordCount;

          do {
            const records = await dbf.readRecords(ctrlIncrement);

            if (!records || records.length <= 0) {
              break;
            }

            let sql = `INSERT INTO Produtos (
              codigo,
              codint,
              nome,
              preco,
              prepro,
              icms,
              ncm,
              tipo,
              tipogru,
              grupo,
              kitqtd,
              kitdsc,
              qtdproqt,
              descproqt,
              vlrproqt,
              cdfamil,
              mkt09
            ) VALUES `;

            const tmpSql = [];

            const values = [];

            for (let i = 0; i < records.length; i++) {
              tmpSql.push(` (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) `);

              values.push(records[i].CODIGO);
              values.push(records[i].CODINT);
              values.push(records[i].NOME);
              values.push(records[i].PRECO);
              values.push(records[i].PREPRO);
              values.push(records[i].ICMS);
              values.push(records[i].NCM);
              values.push(records[i].TIPO);
              values.push(records[i].TIPOGRU);
              values.push(records[i].GRUPO);
              values.push(records[i].KITQTD);
              values.push(records[i].KITDSC);
              values.push(records[i].QTDPROQT);
              values.push(records[i].DESCPROQT);
              values.push(records[i].VLRPROQT);
              values.push(records[i].CDFAMIL);
              values.push(records[i].MKT09);
            }

            sql += tmpSql.join(', ');

            db.run(sql, values, (error) => {
              if (error) {
                fs.appendFileSync(adminh.Parametros.LOGFILE, `Erro ao gravar produto no banco\n`);
                throw new Error(error.message);
              }
            });

            ctrl += ctrlIncrement;
          } while (ctrl < total);

          if (db) {
            db.close();
          }

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Finalizou processamento dos produtos\n`);

          resolve(true);
        } catch (e) {
          if (db) {
            db.close();
          }

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Abortado. ${e.message}\n`);

          reject(e.message);
        }
      });

      event.returnValue = result;
    });

    ipcMain.on('get-produto', async (event, arg) => {
      if (!arg) {
        event.returnValue = null;
      } else {
        event.returnValue = await new Promise((resolve, reject) => {
          let db = null;

          const iniLocation = path.resolve(app.getPath('userData'), require('../../package.json').iniName);

          const adminh = ini.parse(fs.readFileSync(iniLocation, 'utf-8'));

          try {
            const dbFile = path.resolve(app.getPath('userData'), 'callfarmadb.db');

            db = new sqlite3.Database(dbFile, (error) => {
              if (error) {
                reject(error.message);
              }
            });

            db.each(
              `SELECT * FROM Produtos WHERE CODIGO = ? OR CODINT = ? LIMIT 1`,
              [String(arg).padStart(13, '0'), arg],
              (err, row) => {
                if (err) {
                  reject(err);
                } else {
                  if (db) {
                    db.close();
                  }

                  fs.appendFileSync(adminh.Parametros.LOGFILE, `Achou o produto: ${JSON.stringify(row)}\n`);

                  resolve(row);
                }
              },
              () => {
                resolve(null);
              }
            );
          } catch (e) {
            if (db) {
              db.close();
            }

            reject(e.message);
          }
        });
      }
    });

    ipcMain.on('set-venda', async (event, arg) => {
      const result = await new Promise(async (resolve, reject) => {
        const iniLocation = path.resolve(app.getPath('userData'), require('../../package.json').iniName);

        const adminh = ini.parse(fs.readFileSync(iniLocation, 'utf-8'));

        try {
          const fieldDescriptors = [
            { name: 'CUPOM', type: 'N', size: 8 },
            { name: 'TRANSACAO', type: 'I', size: 2 },
            { name: 'CODIGO', type: 'C', size: 40 },
            { name: 'QTD', type: 'I', size: 8 },
            { name: 'VALOR', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'DATA', type: 'D', size: 8 },
            { name: 'HORA', type: 'C', size: 8 },
            { name: 'VENDEDOR', type: 'N', size: 6 },
            { name: 'DESCRICAO', type: 'C', size: 40 },
            { name: 'DTRECEITA', type: 'D', size: 8 },
          ];

          const nfce = Number(adminh.Parametros.ULTNFCE);

          const data = moment(arg.horarioServidor, 'YYYY-MM-DD HH:mm:ss').toDate();

          data.setHours(data.getHours() - 3);

          const hora = moment(arg.horarioServidor, 'YYYY-MM-DD HH:mm:ss').format('HH:mm:ss');

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Data Servidor: ${data}\n`);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Hora Servidor: ${hora}\n`);

          const records = [
            {
              CUPOM: nfce,
              TRANSACAO: 0,
              CODIGO: 'self',
              QTD: 0,
              VALOR: 0,
              DATA: data,
              HORA: hora,
              VENDEDOR: arg.vendedor,
              DESCRICAO: '',
              DTRECEITA: data,
            },
            {
              CUPOM: nfce,
              TRANSACAO: 1,
              CODIGO: String(arg.prevenda),
              QTD: parseInt(adminh.Parametros.CDCAIXA, 10),
              VALOR: 0,
              DATA: data,
              HORA: hora,
              VENDEDOR: arg.vendedor,
              DESCRICAO: '',
              DTRECEITA: data,
            },
          ];

          let fgHasReceita = false;

          for (let i = 0; i < arg.produtos.length; i++) {
            const produ = arg.produtos[i];

            let precoFinal = produ.pmc;

            if (Number(produ.pmc) > Number(produ.preco) && Number(produ.preco) > 0) {
              precoFinal = produ.preco;
            }

            records.push({
              CUPOM: nfce,
              TRANSACAO: 2,
              CODIGO: produ.codigo.toFixed(0),
              QTD: parseInt(produ.qtd, 10),
              VALOR: precoFinal,
              DATA: data,
              HORA: hora,
              VENDEDOR: parseInt(produ.vendedor, 10),
              DESCRICAO: String(produ.nome).substring(0, 39),
              DTRECEITA: data,
            });

            if (produ.crm && produ.dtreceita && moment(produ.dtreceita, 'DD/MM/YYYY').isValid()) {
              fgHasReceita = true;

              fs.appendFileSync(adminh.Parametros.LOGFILE, `DTRECEITA: ${moment(produ.dtreceita, 'DD/MM/YYYY').toDate()}\n`);

              records.push({
                CUPOM: nfce,
                TRANSACAO: 4,
                VENDEDOR: parseInt(produ.vendedor, 10),
                DATA: data,
                HORA: hora,
                DESCRICAO: arg.clienteNome,
                DTRECEITA: moment(produ.dtreceita, 'DD/MM/YYYY').toDate(),
                CODIGO: String(produ.crm).trim() === '' ? '9999999992' : produ.crm,
                QTD: 0,
                VALOR: 0,
              });
            }

            if (produ.lote) {
              records.push({
                CUPOM: nfce,
                TRANSACAO: 6,
                VENDEDOR: parseInt(produ.vendedor, 10),
                DATA: data,
                HORA: hora,
                CODIGO: produ.lote,
                DESCRICAO: '',
                DTRECEITA: data,
                QTD: 0,
                VALOR: 0,
              });
            }
          }

          records.push({
            CUPOM: nfce,
            TRANSACAO: 10,
            CODIGO: 'TOTAL',
            QTD: 0,
            VALOR: Number(arg.totalLiquido),
            DATA: data,
            HORA: hora,
            VENDEDOR: 0,
            DESCRICAO: '',
            DTRECEITA: data,
          });

          if (Number(arg.totalDesconto) > 0) {
            records.push({
              CUPOM: nfce,
              TRANSACAO: 10,
              CODIGO: 'X',
              QTD: 0,
              VALOR: Number(arg.totalDesconto),
              DATA: data,
              HORA: hora,
              VENDEDOR: 0,
              DESCRICAO: '',
              DTRECEITA: data,
            });
          }

          // Formas PG Caixa Silvano: { 'Dinheiro' , 'Cheque', 'Cartão Web', 'Debito', 'Credito', 'POS', 'Convenio', 'A Prazo', 'Convenio' }
          switch (parseInt(arg.formapg, 10)) {
            case 1:
              // GapConvenio := {GapRowPdv:Fieldget("EMPRESA_CONVENIO"), " ", GapRowPdv:Fieldget("CONVENIADO") , " ",0,0,0,0,0,1,0}
              records.push({
                CUPOM: nfce,
                TRANSACAO: 10,
                CODIGO:
                  Boolean(arg.appConvenio) === Boolean(true)
                    ? `APPV${String(1).padStart(2, '0')}${String(arg.appConvenioCodigo).padStart(4, '0')}${String(
                        arg.appConvenioUsuario
                      ).padStart(12, '0')}${String(0).padStart(12, '0')}`
                    : 'APPC',
                QTD: 0,
                VALOR: Number(arg.totalLiquido),
                DATA: data,
                HORA: hora,
                VENDEDOR: 0,
                DESCRICAO: '',
                DTRECEITA: data,
              });
              break;
            case 2:
            case 3:
            case 4:
              records.push({
                CUPOM: nfce,
                TRANSACAO: 10,
                CODIGO: 'C',
                QTD: 0,
                VALOR: Number(arg.totalLiquido),
                DATA: data,
                HORA: hora,
                VENDEDOR: 0,
                DESCRICAO: '',
                DTRECEITA: data,
              });
              break;
            default:
              break;
          }

          records.push({
            CUPOM: nfce,
            TRANSACAO: 50,
            CODIGO: String(adminh.Parametros.CDCAIXA),
            QTD: 0,
            VALOR: 0,
            DATA: data,
            HORA: hora,
            VENDEDOR: 0,
            DESCRICAO: '',
            DTRECEITA: data,
          });

          records.push({
            CUPOM: nfce,
            TRANSACAO: 60,
            CODIGO: arg.cpfClube || fgHasReceita ? String(arg.cpfClube) : '0',
            QTD: Number(arg.avaliacao) > Number(0) ? Number(arg.avaliacao) : 0, // -> Colocar aqui a avaliacao da venda
            VALOR: 0,
            DATA: data,
            HORA: hora,
            VENDEDOR: 1,
            DESCRICAO: '',
            DTRECEITA: data,
          });

          if (arg.cpfNaNota) {
            records.push({
              CUPOM: nfce,
              TRANSACAO: 61,
              CODIGO: String(arg.cpfNaNota),
              QTD: 0,
              VALOR: 0,
              DATA: data,
              HORA: hora,
              VENDEDOR: 0,
              DESCRICAO: '',
              DTRECEITA: data,
            });
          }

          const vendaFileName = `V${String(arg.ultvenda).padStart(7, '0')}.dbf`;

          const vendaFile = path.resolve(adminh.Parametros.TEF, vendaFileName);

          if (fs.existsSync(vendaFile)) {
            fs.unlinkSync(vendaFile);
          }

          const dbf = await DBFFile.create(vendaFile, fieldDescriptors);

          await dbf.appendRecords(records);

          const dbFile = path.resolve(app.getPath('userData'), 'callfarmadb.db');

          const db = new sqlite3.Database(dbFile, (error) => {
            if (error) {
              fs.appendFileSync(adminh.Parametros.LOGFILE, `Nao foi possive gravar venda no banco de dados local\n`);
            } else {
              const sql = `INSERT INTO Venda (
                cpfNaNota,
                cpfClube,
                totalBruto,
                totalDesconto,
                totalLiquido,
                data_criado,
                cdfil,
                cdcaixa,
                nfce,
                serie,
                formapg
              ) VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
              ) `;

              db.run(sql, [
                arg.cpfNaNota,
                arg.cpfClube,
                arg.totalBruto,
                arg.totalDesconto,
                arg.totalLiquido,
                moment().tz('America/Sao_Paulo').format('YYYY-MM-DD'),
                adminh.Parametros.CDFIL,
                adminh.Parametros.CDCAIXA,
                adminh.Parametros.ULTNFCE,
                adminh.Parametros.CDCAIXA,
                arg.formapg,
              ]);

              const sql2 = `INSERT INTO VendaItem (
                vendaId,
                produto,
                qtd,
                valorBruto,
                valorDesconto,
                valorLiquido
              ) VALUES `;

              const tmpSql2 = [];

              const values = [];

              for (let i = 0; i < arg.produtos.length; i++) {
                tmpSql2.push(' (?,?,?,?,?,?) ');

                values.push(adminh.Parametros.ULTNFCE);
                values.push(arg.produtos[i].codigo);
                values.push(arg.produtos[i].qtd);
                values.push(arg.produtos[i].pmc);
                values.push(
                  arg.produtos[i].pmc > arg.produtos[i].preco && arg.produtos[i].preco > 0 ? arg.produtos[i].pmc - arg.produtos[i].preco : 0
                );
                values.push(arg.produtos[i].preco);
              }

              db.run(`${sql2} ${tmpSql2.join(',')}`, values);
            }
          });

          const pathVendaBkp = path.resolve(adminh.Parametros.TEF, 'bkp');

          const pathVendaOnline = path.resolve(adminh.Parametros.TEF, 'online');

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Verificando pasta online e bkp\n`);

          if (!fs.existsSync(pathVendaBkp)) {
            fs.mkdirSync(pathVendaBkp);
          }

          fs.copyFileSync(vendaFile, path.resolve(pathVendaBkp, vendaFileName).replace('V', 'L'));

          if (!fs.existsSync(pathVendaOnline)) {
            fs.mkdirSync(pathVendaOnline);
          }

          fs.copyFileSync(vendaFile, path.resolve(pathVendaOnline, vendaFileName.replace('V', 'L')));

          if (fs.existsSync(vendaFile)) {
            fs.unlinkSync(vendaFile);
          }

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Tratando registros do Pdvcai SQLite\n`);

          db.get(
            `SELECT * FROM Pdvcai WHERE data_criado LIKE ? LIMIT 1`,
            [moment().tz('America/Sao_Paulo').format('YYYY-MM-DD')],
            (err, row) => {
              if (err) {
                fs.appendFileSync(adminh.Parametros.LOGFILE, `*** Problemas ao gravar registro Pdvcai no SQLite\n`);
              }

              if (!row || !row.id || typeof row === 'undefined') {
                fs.appendFileSync(adminh.Parametros.LOGFILE, `Nenhum registro localizado, vai fazer insert\n`);

                const sql3Insert = `INSERT INTO Pdvcai (
                  operador,
                  data_criado,
                  trocoini,
                  sangria,
                  suprimento,
                  dinheiro,
                  cheque,
                  chequep,
                  cartao01,
                  cartao02,
                  funcion,
                  cartao03,
                  cartao04,
                  totcli,
                  desconto,
                  cupons,
                  cuponsdes,
                  gaveta,
                  horaini,
                  horafim,
                  cupcanc,
                  cartao,
                  convenio,
                  recarga,
                  formulas,
                  pos,
                  pagamento,
                  devoluc,
                  devdinh,
                  trocoami,
                  giftcard,
                  trococar,
                  canccre,
                  cancdeb,
                  uber,
                  app,
                  cartdig
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

                db.run(sql3Insert, [
                  999,
                  moment().tz('America/Sao_Paulo').format('YYYY-MM-DD'),
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  Number(arg.formapg) === Number(3) ? arg.totalLiquido : 0,
                  0,
                  0,
                  0,
                  0,
                  1,
                  arg.totalDesconto,
                  1,
                  Number(arg.totalDesconto) > Number(0) ? 1 : 0,
                  0,
                  moment().tz('America/Sao_Paulo').format('HH:mm:ss'),
                  '',
                  0,
                  Number(arg.formapg) === Number(4) ? arg.totalLiquido : 0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  Number(arg.formapg) === Number(1) ? arg.totalLiquido : 0,
                  Number(arg.formapg) === Number(2) ? arg.totalLiquido : 0,
                ]);
              } else {
                fs.appendFileSync(adminh.Parametros.LOGFILE, `Registro localizado vai fazer Update\n`);

                const sql3Update = `UPDATE Pdvcai SET
                  CARTAO01 = ?,
                  TOTCLI = ?,
                  DESCONTO = ?,
                  CUPONS = ?,
                  CUPONSDES = ?,
                  CARTAO = ?,
                  APP = ?,
                  CARTDIG = ?
                WHERE id = ?`;

                const values3Update = [
                  row.cartao01 + (Number(arg.formapg) === Number(3) ? arg.totalLiquido : 0),
                  row.totcli + 1,
                  row.desconto + arg.totalDesconto,
                  row.cupons + 1,
                  row.cuponsdes + (Number(arg.totalDesconto) > Number(0) ? 1 : 0),
                  row.cartao + (Number(arg.formapg) === Number(4) ? arg.totalLiquido : 0),
                  row.app + (Number(arg.formapg) === Number(1) ? arg.totalLiquido : 0),
                  row.cartdig + (Number(arg.formapg) === Number(2) ? arg.totalLiquido : 0),
                  row.id,
                ];

                db.run(sql3Update, values3Update);
              }
            }
          );

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Verificando arquivo PDVCAI.dbf\n`);

          const dfbFilePdvcai = path.resolve(adminh.Parametros.TEF, 'PDVCAI.dbf');

          let dfbFilePdvcaiApagou = 0;

          do {
            try {
              if (fs.existsSync(dfbFilePdvcai)) {
                fs.unlinkSync(dfbFilePdvcai);
                dfbFilePdvcaiApagou = 3;
              }
            } catch (e) {
              dfbFilePdvcaiApagou++;
              await new Promise((resolve) => setTimeout(() => resolve(true), 200));
            }
          } while (dfbFilePdvcaiApagou < 3);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Criando PDVCAI.dbf novo\n`);

          const fieldDescriptorsPdvcai = [
            { name: 'OPERADOR', type: 'N', size: 6 },
            { name: 'DATA', type: 'D', size: 8 },
            { name: 'TROCOINI', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'SANGRIA', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'SUPRIMENTO', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'DINHEIRO', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CHEQUE', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CHEQUEP', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CARTAO01', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CARTAO02', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'FUNCION', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CARTAO03', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CARTAO04', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'TOTCLI', type: 'N', size: 6 },
            { name: 'DESCONTO', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CUPONS', type: 'N', size: 6 },
            { name: 'CUPONSDES', type: 'N', size: 6 },
            { name: 'GAVETA', type: 'N', size: 6 },
            { name: 'HORAINI', type: 'C', size: 8 },
            { name: 'HORAFIM', type: 'C', size: 8 },
            { name: 'CUPCANC', type: 'N', size: 6 },
            { name: 'CARTAO', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CONVENIO', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'RECARGA', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'FORMULAS', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'POS', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'PAGAMENTO', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'DEVOLUC', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'DEVDINH', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'TROCOAMI', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'GIFTCARD', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'TROCOCAR', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CANCCRE', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CANCDEB', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'UBER', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'APP', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CARTDIG', type: 'N', size: 12, decimalPlaces: 2 },
          ];

          const dbfPdvcai = await DBFFile.create(dfbFilePdvcai, fieldDescriptorsPdvcai);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Convertendo PDVCAI para PDVCAI.dbf\n`);

          await new Promise((resolve, reject) => {
            db.all(
              `SELECT * FROM Pdvcai WHERE data_criado IN (?,?,?,?,?,?,?)`,
              [
                moment().tz('America/Sao_Paulo').subtract(6, 'day').format('YYYY-MM-DD'),
                moment().tz('America/Sao_Paulo').subtract(5, 'day').format('YYYY-MM-DD'),
                moment().tz('America/Sao_Paulo').subtract(4, 'day').format('YYYY-MM-DD'),
                moment().tz('America/Sao_Paulo').subtract(3, 'day').format('YYYY-MM-DD'),
                moment().tz('America/Sao_Paulo').subtract(2, 'day').format('YYYY-MM-DD'),
                moment().tz('America/Sao_Paulo').subtract(1, 'day').format('YYYY-MM-DD'),
                moment().tz('America/Sao_Paulo').format('YYYY-MM-DD'),
              ],
              async (err, rows) => {
                if (err || !rows || rows.length <= 0) {
                  reject(err);
                } else {
                  const recordsDbfCai = [];

                  for (let i = 0; i < rows.length; i++) {
                    recordsDbfCai.push({
                      OPERADOR: 999,
                      DATA: moment(rows[i].data_criado, 'YYYY-MM-DD').toDate(),
                      TROCOINI: 0,
                      SANGRIA: 0,
                      SUPRIMENTO: 0,
                      DINHEIRO: 0,
                      CHEQUE: 0,
                      CHEQUEP: 0,
                      CARTAO01: Number(rows[i].cartao01),
                      CARTAO02: Number(rows[i].cartao02),
                      FUNCION: 0,
                      CARTAO03: Number(rows[i].cartao03),
                      CARTAO04: Number(rows[i].cartao04),
                      TOTCLI: Number(rows[i].totcli),
                      DESCONTO: Number(rows[i].desconto),
                      CUPONS: Number(rows[i].cupons),
                      CUPONSDES: Number(rows[i].cuponsdes),
                      GAVETA: 0,
                      HORAINI: String(rows[i].horaini),
                      HORAFIM: '',
                      CUPCANC: 0,
                      CARTAO: Number(rows[i].cartao),
                      CONVENIO: Number(rows[i].convenio),
                      RECARGA: 0,
                      FORMULAS: 0,
                      POS: Number(rows[i].pos),
                      PAGAMENTO: 0,
                      DEVOLUC: 0,
                      DEVDINH: 0,
                      TROCOAMI: 0,
                      GIFTCARD: 0,
                      TROCOCAR: 0,
                      CANCCRE: 0,
                      CANCDEB: 0,
                      UBER: 0,
                      APP: Number(rows[i].app),
                      CARTDIG: Number(rows[i].cartdig),
                    });
                  }

                  fs.appendFileSync(adminh.Parametros.LOGFILE, `Pdvcai Params: ${JSON.stringify(recordsDbfCai)}\n`);

                  if (recordsDbfCai.length > 0) {
                    try {
                      await dbfPdvcai.appendRecords(recordsDbfCai);
                    } catch (e) {
                      fs.appendFileSync(adminh.Parametros.LOGFILE, `Pdvcai Erro: ${JSON.stringify(e.message)}\n`);
                    }
                  }

                  resolve(true);
                }
              }
            );
          });

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Concluiu gravação PDVCAI.dbf\n`);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Tratando gravação da PDVMOVFIN.dbf\n`);

          let formapgPdvmovfin = '';

          if (Number(arg.formapg) === Number(1)) {
            formapgPdvmovfin = 'APP';
          } else if (Number(arg.formapg) === Number(2)) {
            formapgPdvmovfin = 'CT ';
          } else if (Number(arg.formapg) === Number(3)) {
            formapgPdvmovfin = 'DB ';
          } else if (Number(arg.formapg) === Number(4)) {
            formapgPdvmovfin = 'CR ';
          }

          // GRAVA PDVMVFIN
          db.get(
            `SELECT * FROM Pdvmovfin WHERE data_criado LIKE ? AND operacao LIKE ? AND cartao LIKE ? AND parcelas = ? LIMIT 1`,
            [moment().tz('America/Sao_Paulo').format('YYYY-MM-DD'), formapgPdvmovfin, arg.cartaoNome, arg.parcelas],
            (err, row) => {
              if (err) {
                fs.appendFileSync(adminh.Parametros.LOGFILE, `*** Problemas ao gravar registro Pdvmovfin no SQLite\n`);
              }

              if (!row || !row.id || typeof row === 'undefined') {
                fs.appendFileSync(adminh.Parametros.LOGFILE, `Nenhum registro localizado, vai fazer insert\n`);

                const sql3Insert = `INSERT INTO Pdvmovfin (
                  filial,
                  data_criado,
                  operador,
                  operacao,
                  cartao,
                  parcelas,
                  valor,
                  qtd,
                  transmit
                ) VALUES (?,?,?,?,?,?,?,?,?)`;

                db.run(sql3Insert, [
                  adminh.Parametros.CDFIL,
                  moment().tz('America/Sao_Paulo').format('YYYY-MM-DD'),
                  999,
                  formapgPdvmovfin,
                  arg.cartaoNome,
                  arg.parcelas,
                  arg.totalLiquido,
                  1,
                  'N',
                ]);
              } else {
                fs.appendFileSync(adminh.Parametros.LOGFILE, `Registro localizado vai fazer Update\n`);

                const sql4Update = `UPDATE Pdvmovfin SET
                  valor = ?,
                  qtd = ?
                WHERE id = ?`;

                const values4Update = [row.valor + arg.totalLiquido, row.qtd + 1, row.id];

                db.run(sql4Update, values4Update);
              }
            }
          );

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Verificando arquivo PDVMOVFIN.dbf\n`);

          const dfbFilePdvmovfin = path.resolve(adminh.Parametros.TEF, 'PDVMOVFIN.dbf');

          let dfbFilePdvmovfinApagou = 0;

          do {
            try {
              if (fs.existsSync(dfbFilePdvmovfin)) {
                fs.unlinkSync(dfbFilePdvmovfin);
                dfbFilePdvmovfinApagou = 3;
              }
            } catch (e) {
              dfbFilePdvmovfinApagou++;
              await new Promise((resolve) => setTimeout(() => resolve(true), 200));
            }
          } while (dfbFilePdvmovfinApagou < 3);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Criando PDVMOVFIN.dbf novo\n`);

          const fieldDescriptorsPdvmovfin = [
            { name: 'FILIAL', type: 'N', size: 3 },
            { name: 'DATA', type: 'D', size: 8 },
            { name: 'OPERADOR', type: 'N', size: 6 },
            { name: 'OPERACAO', type: 'C', size: 3 },
            { name: 'CARTAO', type: 'C', size: 30 },
            { name: 'PARCELAS', type: 'C', size: 3 },
            { name: 'VALOR', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'QTD', type: 'N', size: 6 },
            { name: 'TRANSMIT', type: 'C', size: 1 },
          ];

          const dbfPdvmovfin = await DBFFile.create(dfbFilePdvmovfin, fieldDescriptorsPdvmovfin);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Convertendo PDVMOVFIN para PDVMOVFIN.dbf\n`);

          await new Promise((resolve, reject) => {
            db.all(
              `SELECT * FROM Pdvmovfin WHERE data_criado LIKE ?`,
              [moment().tz('America/Sao_Paulo').format('YYYY-MM-DD')],
              async (err, rows) => {
                if (err || (!rows && rows.length <= 0)) {
                  fs.appendFileSync(adminh.Parametros.LOGFILE, `Erro: ${JSON.stringify(err)}\n`);

                  reject(err);
                } else {
                  const recordsDbfMovfin = [];

                  for (let i = 0; i < rows.length; i++) {
                    recordsDbfMovfin.push({
                      FILIAL: Number(rows[i].filial),
                      DATA: moment(rows[i].data_criado, 'YYYY-MM-DD').toDate(),
                      OPERADOR: 999,
                      OPERACAO: String(rows[i].operacao).padEnd(3, ' '),
                      CARTAO: String(rows[i].cartao),
                      PARCELAS: String(rows[i].parcelas),
                      VALOR: Number(rows[i].valor),
                      QTD: Number(rows[i].qtd),
                      TRANSMIT: 'N',
                    });
                  }

                  fs.appendFileSync(adminh.Parametros.LOGFILE, `Pdvmovfin Params: ${JSON.stringify(recordsDbfMovfin)}\n`);

                  if (recordsDbfMovfin.length > 0) {
                    try {
                      await dbfPdvmovfin.appendRecords(recordsDbfMovfin);
                    } catch (e) {
                      fs.appendFileSync(adminh.Parametros.LOGFILE, `Pdvmovfin Erro: ${JSON.stringify(e.message)}\n`);
                    }
                  }

                  resolve(true);
                }
              }
            );
          });

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Concluiu gravação PDVMOVFIN.dbf\n`);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Verificando arquivo PDVPGDT.dbf\n`);

          const dfbFilePdvpgdt = path.resolve(adminh.Parametros.TEF, 'PDVPGDT.dbf');

          let dbfPdvpgdt = null;

          if (!fs.existsSync(dfbFilePdvpgdt)) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `Criando PDVPGDT.dbf novo\n`);

            const fieldDescriptorsPdvpgdt = [
              { name: 'LOJA', type: 'N', size: 3 },
              { name: 'DATA', type: 'D', size: 8 },
              { name: 'HORA', type: 'C', size: 10 },
              { name: 'ORIGEM', type: 'C', size: 10 },
              { name: 'DOCUMENTO', type: 'N', size: 9 },
              { name: 'FORMAPG', type: 'C', size: 20 },
              { name: 'BANDEIRA', type: 'C', size: 40 },
              { name: 'PARCELAS', type: 'C', size: 3 },
              { name: 'VALOR', type: 'N', size: 12, decimalPlaces: 2 },
              { name: 'NSU', type: 'C', size: 80 },
              { name: 'ROTA', type: 'C', size: 80 },
              { name: 'OPERCX', type: 'N', size: 6 },
              { name: 'TID', type: 'C', size: 140 },
              { name: 'ECF', type: 'N', size: 4 },
              { name: 'PBM', type: 'C', size: 40 },
              { name: 'CODAUTOR', type: 'C', size: 40 },
            ];

            dbfPdvpgdt = await DBFFile.create(dfbFilePdvpgdt, fieldDescriptorsPdvpgdt);
          } else {
            dbfPdvpgdt = await DBFFile.open(dfbFilePdvpgdt);
          }

          let formaPgPdvpgdt = '';

          if (Number(arg.formapg) === Number(1)) {
            formaPgPdvpgdt = 'App';
          } else if (Number(arg.formapg) === Number(2)) {
            formaPgPdvpgdt = 'Pix';
          } else if (Number(arg.formapg) === Number(3)) {
            formaPgPdvpgdt = 'Debito';
          } else if (Number(arg.formapg) === Number(4)) {
            formaPgPdvpgdt = 'Credito';
          }

          try {
            await dbfPdvpgdt.appendRecords([
              {
                LOJA: Number(adminh.Parametros.CDFIL),
                DATA: moment().tz('America/Sao_Paulo').toDate(),
                HORA: moment().tz('America/Sao_Paulo').format('HH:mm:ss'),
                ORIGEM: 'Caixa-Self',
                DOCUMENTO: arg.nfce,
                FORMAPG: formaPgPdvpgdt,
                BANDEIRA: arg.cartaoNome,
                PARCELAS: String(arg.parcelas),
                VALOR: arg.totalLiquido,
                NSU: arg.cartaoNsu,
                ROTA: 'Sitef',
                OPERCX: 999,
                TID: 'N',
                ECF: Number(adminh.Parametros.CDCAIXA),
                PBM: '',
                CODAUTOR: '',
              },
            ]);
          } catch (e) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `dbfPdvpgdt Erro: ${JSON.stringify(e.message)}\n`);
          }

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Concluido PDVPGDT.dbf\n`);

          for (let i = 0; i < arg.produtos.length; i++) {
            if (Number(arg.produtos[i].prevenda) > Number(0)) {
              const pathPrevenda = path.resolve(
                adminh.Parametros.PREVENDA_PASTA,
                `C${String(arg.produtos[i].prevenda).padStart(6, '0')}.dbf`
              );

              if (fs.existsSync(pathPrevenda)) {
                fs.copyFileSync(
                  pathPrevenda,
                  path.resolve(adminh.Parametros.PREVENDA_PASTA, `X${String(arg.produtos[i].prevenda).padStart(6, '0')}.dbf`)
                );
                fs.unlinkSync(pathPrevenda);
              }
            }
          }

          if (db) {
            db.close();
          }

          resolve(true);
        } catch (e) {
          fs.appendFileSync(adminh.Parametros.LOGFILE, `*** Problemas ao gravar registro DBF da venda\n`);
          fs.appendFileSync(adminh.Parametros.LOGFILE, `${e.message}\n`);
          reject(e.message);
        }
      });

      event.returnValue = result;
    });

    ipcMain.on('set-prevenda-aberta', async (event, arg) => {
      const result = await new Promise(async (resolve, reject) => {
        const iniLocation = path.resolve(app.getPath('userData'), require('../../package.json').iniName);

        const adminh = ini.parse(fs.readFileSync(iniLocation, 'utf-8'));

        try {
          const fieldDescriptors = [
            { name: 'TIPO', type: 'C', size: 1 },
            { name: 'VEND', type: 'N', size: 6 },
            { name: 'CODIGO', type: 'N', size: 13 },
            { name: 'QUANT', type: 'N', size: 6 },
            { name: 'PRECO', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'DESC', type: 'N', size: 6, decimalPlaces: 2 },
            { name: 'CRM', type: 'C', size: 50 },
            { name: 'DATA', type: 'D', size: 8 },
            { name: 'HORA', type: 'C', size: 8 },
            { name: 'TRN', type: 'C', size: 1 },
            { name: 'EPNSU', type: 'C', size: 40 },
            { name: 'EPVLRAREC', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'FPLOGIN', type: 'C', size: 8 },
            { name: 'FPVEND', type: 'N', size: 11 },
            { name: 'FPSENHA', type: 'C', size: 8 },
            { name: 'FPSENHAV', type: 'C', size: 8 },
            { name: 'FPNSEQ', type: 'N', size: 6 },
            { name: 'FPNNSU', type: 'C', size: 19 },
            { name: 'FPVLRAR', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'FPQTDC', type: 'N', size: 6 },
            { name: 'PHAAUTEN', type: 'C', size: 40 },
            { name: 'PHAPROJETO', type: 'C', size: 40 },
            { name: 'PHACARTAO', type: 'C', size: 40 },
            { name: 'PHACPF', type: 'C', size: 20 },
            { name: 'PHANSU', type: 'C', size: 40 },
            { name: 'PHARECEBER', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'PHASUBS', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'PHMODALID', type: 'C', size: 20 },
            { name: 'PHNRDEP', type: 'N', size: 12 },
            { name: 'PHDDDCLI', type: 'N', size: 3 },
            { name: 'PHTELCLI', type: 'N', size: 12 },
            { name: 'PHRGCLI', type: 'N', size: 12 },
            { name: 'FCNRCART', type: 'C', size: 40 },
            { name: 'FCNSUADM', type: 'C', size: 40 },
            { name: 'FCID', type: 'C', size: 8 },
            { name: 'FCNRPRE', type: 'C', size: 40 },
            { name: 'FCDTRECEI', type: 'C', size: 10 },
            { name: 'FCCRM', type: 'C', size: 20 },
            { name: 'FCUFCRM', type: 'C', size: 2 },
            { name: 'FCTIPOCRM', type: 'C', size: 1 },
            { name: 'FCVLRCART', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'DTRECEITA', type: 'D', size: 8 },
            { name: 'CPFCLI', type: 'N', size: 14 },
            { name: 'NFCEDEV', type: 'N', size: 9 },
            { name: 'NFCESER', type: 'N', size: 3 },
            { name: 'NFCEFIL', type: 'N', size: 3 },
            { name: 'PREVENCIDO', type: 'N', size: 6 },
            { name: 'FORMAENT', type: 'C', size: 1 },
            { name: 'LOJAORI', type: 'N', size: 3 },
            { name: 'DTENTREGA', type: 'C', size: 10 },
            { name: 'HRENTREGA', type: 'C', size: 40 },
            { name: 'ENCOMENDA', type: 'N', size: 3 },
            { name: 'VDVD', type: 'C', size: 1 },
            { name: 'LOTE', type: 'C', size: 20 },
            { name: 'VALIDADE', type: 'C', size: 20 },
          ];

          const fileName = `C${String(arg.prevenda).padStart(6, '0')}.dbf`;

          const file = path.resolve(adminh.Parametros.PREVENDA_PASTA, fileName);

          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }

          const dbf = await DBFFile.create(file, fieldDescriptors);

          await dbf.appendRecords(arg.records);

          resolve(true);
        } catch (e) {
          fs.appendFileSync(adminh.Parametros.LOGFILE, `*** Problemas ao gravar registro DBF da pre-venda aberta no caixa\n`);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `${e.message}\n`);

          reject(new Error(e.message));
        }
      });

      event.returnValue = result;
    });

    ipcMain.on('trn-get-autorizacao', async (event, arg) => {
      const retorno = { status: false, msg: '' };

      try {
        const iniLocation = path.resolve(app.getPath('userData'), require('../../package.json').iniName);

        const CNPJ = arg.param.loja.nf_cgc;

        const adminh = ini.parse(fs.readFileSync(iniLocation, 'utf-8'));

        const dbFile = path.resolve(app.getPath('userData'), 'callfarmadb.db');

        const db = new sqlite3.Database(dbFile, (error) => {
          if (error) {
            throw new Error(error.message);
          }
        });

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRHCentre Params: ${JSON.stringify(arg)}\n`);

        const fileName = `${String(adminh.TrnCentre.Sequencia).padStart(9, '0')}_${String(adminh.Parametros.CDCAIXA).padStart(3, '0')}`;

        const trnPathBackup = path.resolve('C:/TCBKP');

        const trnPathRetorno = path.resolve('C:/TRNCENTR/RESP');

        const trnPathEnvio = path.resolve('C:/TRNCENTR/REQ');

        const trnFile = path.resolve(trnPathEnvio, fileName);

        if (fs.existsSync(`${trnFile}.001`)) {
          fs.unlinkSync(`${trnFile}.001`);
        }

        if (fs.existsSync(path.resolve(trnPathRetorno, fileName))) {
          fs.unlinkSync(path.resolve(trnPathRetorno, fileName));
        }

        if (fs.existsSync(path.resolve(trnPathBackup, `TC.tmp`))) {
          fs.unlinkSync(path.resolve(trnPathBackup, `TC.tmp`));
        }

        let trnContent = '';
        trnContent += `000-000 = 0100${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `011-000 = 800500${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `001-000 = ${String(adminh.Parametros.CDCAIXA).padStart(2, '0')}${String(arg.param.pbmCupom).padStart(
          2,
          '0'
        )}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `040-000 = ${String(arg.param.pbmOperadora).padStart(2, '0')}${String('').padStart(20, ' ')}${String.fromCharCode(
          13
        )}${String.fromCharCode(10)}`;
        trnContent += `012-000 = ${String(arg.param.pbmNsuAdm).padStart(2, '0')}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `940-000 = 003${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `942-000 = ${CNPJ}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `941-000 = ${String(adminh.Parametros.CDCAIXA).padStart(8, '0')}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `023-000 = ${moment().format('HHmmss')}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `022-000 = ${moment().format('MMDD')}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `953-000 = ${String(arg.param.pbmCartao)}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `004-000 = REA${String.fromCharCode(13)}${String.fromCharCode(10)}`;

        fs.writeFileSync(`${trnFile}.001`, trnContent);

        const mArq = path.resolve(trnPathRetorno, `${fileName}.sts`);
        const mArq1 = path.resolve(trnPathRetorno, `${fileName}.001`);
        const mArq2 = path.resolve(trnPathBackup, `TC.tmp`);

        const TCPreCaptura = [];
        let mAprovado = '';
        let mCodigo = 0;
        let mQtd = 0;
        const TcNsuAdm = 0;
        let concluiu = false;

        const produtosPbmCtrl = [];

        let time = 0;
        const maxTime = 120;

        while (time <= maxTime && !concluiu) {
          await new Promise((resolve) => setTimeout(() => resolve(true), 1000));

          time++;

          if (time >= maxTime) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Abortado por timeout\n`);
            throw new Error('163 - Autorizador não responde');
          }

          if (!fs.existsSync(mArq1)) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Abortado arquivo de retorno nao localizado\n`);
            continue;
          }

          const trnRetorno = fs.readFileSync(mArq1);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `TRHCentre leitura do arquivo: ${mArq1} Conteudo: \n${trnRetorno}\n`);

          if (!trnRetorno || trnRetorno.toString('utf8').trim() === '') {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Passo 1\n`);
            continue;
          }

          const linhas = trnRetorno.toString('utf8').split('\n');

          if (linhas.length > 0) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Verificando primeira linha: ${linhas[0]}\n`);

            if (String(linhas[0]).trim() !== '000-000 = 0110') {
              fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Passo 2\n`);
              continue;
            } else {
              fs.copyFileSync(mArq1, mArq2);
              fs.unlinkSync(mArq1);
            }
          }

          for (let i = 0; i < linhas.length; i++) {
            if (String(linhas[i]).trim() === '') {
              continue;
            }

            const tmp = String(linhas[i]).split(' = ');

            if (tmp.length !== 2) {
              throw new Error(`Linha ${i} não formatada no padrão esperado`);
            }

            const paramLinha = String(tmp.shift()).trim().replace('\r', '').replace('\n', '');
            const paramLinhaInicio = String(paramLinha).substring(0, 3);
            const valorLinha = tmp.pop();

            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Param: ${paramLinha} \n`);

            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Param Inicio: ${paramLinhaInicio} \n`);

            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Valor linha: ${valorLinha} \n`);

            if (Number(paramLinhaInicio) >= 900 && Number(paramLinhaInicio) < 919) {
              if (Number(paramLinhaInicio) === 909) {
                fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Passo 3 \n`);
                // nao faz nada
              } else {
                TCPreCaptura.push(linhas[i]);
              }
            }

            if (String(paramLinha) === '009-000') {
              mAprovado = valorLinha;
              fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre mAprovado: ${mAprovado} \n`);
            }

            if (String(paramLinha) === '902-000') {
              mCodigo = Number(valorLinha);
              fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre mCodigo: ${mCodigo} \n`);
            }

            if (String(paramLinha) === '905-000') {
              mQtd = Number(valorLinha);
              fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre mQtd: ${mQtd} \n`);
            }

            // Busca produto na prevenda aberta...
            if (Number(mCodigo) > 0) {
              let achouProdu = -1;

              fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Buscando produto... ${mCodigo} \n`);

              try {
                const resultGetProdu = await new Promise((resolve, reject) =>
                  db.each(
                    `SELECT codint,codigo,nome FROM Produtos WHERE CODIGO = ? OR CODINT = ? LIMIT 1`,
                    [String(mCodigo).padStart(13, '0'), mCodigo],
                    (err, row) => {
                      if (err) {
                        reject(err);
                      } else {
                        fs.appendFileSync(adminh.Parametros.LOGFILE, `Achou o produto: ${JSON.stringify(row)}\n`);
                        resolve(row);
                      }
                    },
                    () => {
                      resolve(null);
                    }
                  )
                );

                if (!resultGetProdu) {
                  throw new Error(`Resultado pesquisa vazio`);
                }

                for (let j = 0; j < arg.produtos.length && achouProdu === -1; j++) {
                  fs.appendFileSync(
                    adminh.Parametros.LOGFILE,
                    `TRNCentre Comparando produto ${arg.produtos[j].codigo} com ${resultGetProdu.codint} \n`
                  );

                  if (String(arg.produtos[j].codigo) === String(resultGetProdu.codint)) {
                    achouProdu = j;
                  }
                }
              } catch (e) {
                throw new Error(`Produto: ${mCodigo} não localizado na pré-venda`);
              }

              if (achouProdu <= -1) {
                fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Passo 5 \n`);
                throw new Error(`Produto: ${mCodigo} não localizado na pré-venda`);
              }

              // if (Number(arg.produtos[achouProdu].qtd) !== Number(mQtd)) {
              //   fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Passo 6 \n`);
              //   throw new Error(`A quantidade do produto: ${mCodigo} na pré-venda está diferente da PBM`);
              // }

              mCodigo = 0;
              mQtd = 0;
            }
          }

          concluiu = true;

          fs.appendFileSync(adminh.Parametros.LOGFILE, `${moment().utcOffset('-03:00').format()} | TRNCentre Aguardando 1 segundo... \n`);
        }

        if (String(mAprovado).trim() === '00' || String(mAprovado).trim() === '99') {
          retorno.status = true;
          retorno.msg = { mAprovado, TcNsuAdm, TCPreCaptura };
        } else {
          throw new Error(`Esta venda não está aprovada pela PBM!`);
        }
      } catch (e) {
        retorno.status = false;
        retorno.msg = e.message;
      }

      event.returnValue = retorno;
    });

    ipcMain.on('trn-efetiva-autorizacao', async (event, arg) => {
      const retorno = { status: false, msg: '' };

      const iniLocation = path.resolve(app.getPath('userData'), require('../../package.json').iniName);

      const adminh = ini.parse(fs.readFileSync(iniLocation, 'utf-8'));

      try {
        const CNPJ = arg.param.loja.nf_cgc;

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Efetivação - Passo 1\n`);

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Params: ${JSON.stringify(arg)}\n`);

        const fileName = `${String(adminh.TrnCentre.Sequencia).padStart(9, '0')}_${String(adminh.Parametros.CDCAIXA).padStart(3, '0')}`;

        const trnPathBackup = path.resolve('C:/TCBKP');

        const trnPathRetorno = path.resolve('C:/TRNCENTR/RESP');

        const trnPathEnvio = path.resolve('C:/TRNCENTR/REQ');

        const trnFile = path.resolve(trnPathEnvio, fileName);

        if (fs.existsSync(`${trnFile}.001`)) {
          fs.unlinkSync(`${trnFile}.001`);
        }

        if (fs.existsSync(path.resolve(trnPathRetorno, fileName))) {
          fs.unlinkSync(path.resolve(trnPathRetorno, fileName));
        }

        if (fs.existsSync(path.resolve(trnPathBackup, `TC.tmp`))) {
          fs.unlinkSync(path.resolve(trnPathBackup, `TC.tmp`));
        }

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Efetivação - Passo 2\n`);

        let trnContent = '';

        trnContent += `000-000 = 0200${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `011-000 = 800300${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `001-000 = ${String(adminh.Parametros.CDCAIXA).padStart(2, '0')}${String(arg.param.pbmCupom).padStart(
          2,
          '0'
        )}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `040-000 = ${String(arg.param.pbmOperadora).padStart(2, '0')}${String('').padStart(20, ' ')}${String.fromCharCode(
          13
        )}${String.fromCharCode(10)}`;
        trnContent += `012-000 = ${String(arg.param.pbmNsuAdm).padStart(2, '0')}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `940-000 = 003${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `942-000 = ${CNPJ}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `941-000 = ${String(adminh.Parametros.CDCAIXA).padStart(8, '0')}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `023-000 = ${moment().format('HHmmss')}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `022-000 = ${moment().format('MMDD')}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `002-000 = ${String(Number(adminh.Parametros.ULTNFCE) + 1).padStart(8, '0')}${String.fromCharCode(
          13
        )}${String.fromCharCode(10)}`;

        if (arg.param.trnCentreAux && arg.param.trnCentreAux.length > 0) {
          for (let i = 0; i < arg.param.trnCentreAux.length; i++) {
            trnContent += `${arg.param.trnCentreAux[i]}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
          }
        }

        fs.writeFileSync(`${trnFile}.001`, trnContent);

        fs.writeFileSync(`${trnFile}.bak`, trnContent);

        const mArq = path.resolve(trnPathRetorno, `${fileName}.sts`);
        const mArq1 = path.resolve(trnPathRetorno, `${fileName}.001`);
        const mArq2 = path.resolve(trnPathBackup, `TC.tmp`);

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Efetivação - Passo 3\n`);

        let concluiu = false;

        const mInd = 0;
        let mAprovado = '';
        let mProAprovado = '';
        const TCVlrLiq = 0;
        const TCDesc = 0;
        const TCValARec = 0;
        const TCLote = 0;
        let TCAutorizacao = '';
        let Msg = '';
        const TCCupom = [];

        let time = 0;
        const maxTime = 120;

        while (time <= maxTime && !concluiu) {
          fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Efetivação - Passo 4.${time}\n`);

          await new Promise((resolve) => setTimeout(() => resolve(true), 1000));

          time++;

          if (time >= maxTime) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Abortado por timeout\n`);
            throw new Error('163 - Autorizador não responde');
          }

          if (!fs.existsSync(mArq1)) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Abortado arquivo de retorno nao localizado\n`);
            continue;
          }

          const trnRetorno = fs.readFileSync(mArq1);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `TRHCentre leitura do arquivo: ${mArq1} Conteudo: \n${trnRetorno}\n`);

          if (!trnRetorno || trnRetorno.toString('utf8').trim() === '') {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Passo 1\n`);
            continue;
          }

          const linhas = trnRetorno.toString('utf8').split('\n');

          if (!linhas || linhas.length <= 0) {
            continue;
          }

          if (linhas.length > 0) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Verificando primeira linha: ${linhas[0]}\n`);

            if (String(linhas[0]).trim() !== '000-000 = 0210') {
              fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Passo 2\n`);
              continue;
            } else {
              fs.copyFileSync(mArq1, mArq2);
              fs.unlinkSync(mArq1);
            }
          }

          fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Efetivação - Passo 5\n`);

          for (let i = 0; i < linhas.length; i++) {
            if (String(linhas[i]).trim() === '') {
              continue;
            }

            const tmp = String(linhas[i]).split(' = ');

            if (tmp.length !== 2) {
              throw new Error(`Linha ${i} não formatada no padrão esperado`);
            }

            const paramLinha = String(tmp.shift()).trim().replace('\r', '').replace('\n', '');
            const paramLinhaInicio = String(paramLinha).substring(0, 3);
            const valorLinha = tmp.pop();

            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Param: ${paramLinha} \n`);

            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Param Inicio: ${paramLinhaInicio} \n`);

            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Valor linha: ${valorLinha} \n`);

            if (paramLinha === '009-000') {
              mAprovado = valorLinha;

              if (String(mAprovado).trim() === '41') {
                mAprovado = '00';
              } else if (String(mAprovado).trim() !== '00' && String(mAprovado).trim() !== '99') {
                if (fs.existsSync(mArq1)) {
                  fs.unlinkSync(mArq1);
                }
              }
            }

            if (paramLinha === '030-000') {
              Msg += valorLinha;
            }

            if (paramLinha === '013-000') {
              TCAutorizacao = valorLinha;
              Msg += `- Código da Autorização: ${TCAutorizacao}`;
            }

            if (paramLinha === '919-000') {
              mProAprovado = valorLinha;
            }

            if (paramLinhaInicio === '029') {
              TCCupom.push(valorLinha);
            }
          }

          concluiu = true;

          fs.appendFileSync(adminh.Parametros.LOGFILE, `${moment().utcOffset('-03:00').format()} | TRNCentre Aguardando 1 segundo... \n`);
        }

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Efetivação - Passo 6\n`);

        if (String(mProAprovado) === '21') {
          // if (fs.existsSync(mArq)) {
          //   fs.unlinkSync(mArq);
          // }
          if (fs.existsSync(mArq1)) {
            fs.unlinkSync(mArq1);
          }
        }

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Efetivação - Passo 7\n`);

        if (String(mAprovado).trim() !== '00' && String(mAprovado).trim() !== '99') {
          // if (fs.existsSync(mArq)) {
          //   fs.unlinkSync(mArq);
          // }
          if (fs.existsSync(mArq1)) {
            fs.unlinkSync(mArq1);
          }
        }

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Efetivação - Passo 8\n`);

        if (String(mAprovado).trim() === '00' || String(mAprovado).trim() === '99') {
          retorno.status = true;
          retorno.msg = TCCupom.join('\n');
        } else {
          throw new Error(`Esta venda não está aprovada pela PBM!`);
        }

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Sucesso: ${JSON.stringify(retorno.msg)}\n`);
      } catch (e) {
        retorno.status = false;
        retorno.msg = e.message;
        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Falha: ${JSON.stringify(e.message)}\n`);
      }

      event.returnValue = retorno;
    });

    ipcMain.on('trn-confirma-autorizacao', async (event, arg) => {
      const retorno = { status: false, msg: '' };

      const iniLocation = path.resolve(app.getPath('userData'), require('../../package.json').iniName);

      const adminh = ini.parse(fs.readFileSync(iniLocation, 'utf-8'));

      try {
        const CNPJ = arg.param.loja.nf_cgc;

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Params: ${JSON.stringify(arg)}\n`);

        const fileName = `${String(adminh.TrnCentre.Sequencia).padStart(9, '0')}_${String(adminh.Parametros.CDCAIXA).padStart(3, '0')}`;

        const trnPathBackup = path.resolve('C:/TCBKP');

        const trnPathRetorno = path.resolve('C:/TRNCENTR/RESP');

        const trnPathEnvio = path.resolve('C:/TRNCENTR/REQ');

        const trnFile = path.resolve(trnPathEnvio, fileName);

        if (fs.existsSync(`${trnFile}.001`)) {
          fs.unlinkSync(`${trnFile}.001`);
        }

        if (fs.existsSync(path.resolve(trnPathRetorno, fileName))) {
          fs.unlinkSync(path.resolve(trnPathRetorno, fileName));
        }

        if (fs.existsSync(path.resolve(trnPathBackup, `TC.tmp`))) {
          fs.unlinkSync(path.resolve(trnPathBackup, `TC.tmp`));
        }

        let trnContent = '';

        trnContent += `000-000 = 0202${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `011-000 = 800300${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `001-000 = ${String(adminh.Parametros.CDCAIXA).padStart(2, '0')}${String(arg.param.pbmCupom).padStart(
          2,
          '0'
        )}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `040-000 = ${String(arg.param.pbmOperadora).padStart(2, '0')}${String('').padStart(20, ' ')}${String.fromCharCode(
          13
        )}${String.fromCharCode(10)}`;
        trnContent += `012-000 = ${String(arg.param.pbmNsuAdm).padStart(2, '0')}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `940-000 = 003${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `942-000 = ${CNPJ}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `941-000 = ${String(adminh.Parametros.CDCAIXA).padStart(8, '0')}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `023-000 = ${moment().format('HHmmss')}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `022-000 = ${moment().format('MMDD')}${String.fromCharCode(13)}${String.fromCharCode(10)}`;

        fs.writeFileSync(`${trnFile}.001`, trnContent);

        const mArq = path.resolve(trnPathRetorno, `${fileName}.sts`);
        const mArq1 = path.resolve(trnPathRetorno, `${fileName}.001`);
        const mArq2 = path.resolve(trnPathBackup, `TC.tmp`);

        let concluiu = false;

        let time = 0;
        const maxTime = 120;

        let mAprovado = '00';

        while (time <= maxTime && !concluiu) {
          await new Promise((resolve) => setTimeout(() => resolve(true), 1000));

          time++;

          if (time >= maxTime) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Abortado por timeout\n`);
            throw new Error('163 - Autorizador não responde');
          }

          if (!fs.existsSync(mArq1)) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Abortado arquivo de retorno nao localizado\n`);
            continue;
          }

          const trnRetorno = fs.readFileSync(mArq1);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `TRHCentre leitura do arquivo: ${mArq1} Conteudo: \n${trnRetorno}\n`);

          if (!trnRetorno || trnRetorno.toString('utf8').trim() === '') {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Passo 1\n`);
            continue;
          }

          const linhas = trnRetorno.toString('utf8').split('\n');

          if (!linhas || linhas.length <= 0) {
            continue;
          }

          if (linhas.length > 0) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Verificando primeira linha: ${linhas[0]}\n`);

            if (String(linhas[0]).trim() !== '000-000 = 0202') {
              fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Passo 2\n`);
              continue;
            } else {
              fs.copyFileSync(mArq1, mArq2);
              // fs.unlinkSync(mArq1);
            }
          }

          for (let i = 0; i < linhas.length; i++) {
            if (String(linhas[i]).trim() === '') {
              continue;
            }

            const tmp = String(linhas[i]).split(' = ');

            if (tmp.length !== 2) {
              throw new Error(`Linha ${i} não formatada no padrão esperado`);
            }

            const paramLinha = String(tmp.shift()).trim().replace('\r', '').replace('\n', '');
            const paramLinhaInicio = String(paramLinha).substring(0, 3);
            const valorLinha = tmp.pop();

            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Param: ${paramLinha} \n`);

            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Param Inicio: ${paramLinhaInicio} \n`);

            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Valor linha: ${valorLinha} \n`);

            if (paramLinha === '009-000') {
              mAprovado = valorLinha;

              if (mAprovado === '41') {
                mAprovado = '00';
              } else if (mAprovado !== '00' && mAprovado !== '99') {
                if (fs.existsSync(`${trnFile}.001`)) {
                  // fs.unlinkSync(`${trnFile}.001`);
                }
              }
            }
          }

          concluiu = true;

          fs.appendFileSync(adminh.Parametros.LOGFILE, `${moment().utcOffset('-03:00').format()} | TRNCentre Aguardando 1 segundo... \n`);
        }

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre: Finalizando...\n`);

        if (String(mAprovado).trim() !== '00' && String(mAprovado).trim() !== '99') {
          fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre: Não autorizado... ${mAprovado}\n`);
          throw new Error(`Esta venda não está aprovada pela PBM!`);
        }

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre: Autorizado...\n`);

        retorno.status = true;
        retorno.msg = mAprovado;
      } catch (e) {
        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre: Não autorizado... ${e.message}\n`);
        retorno.status = false;
        retorno.msg = e.message;
      }

      event.returnValue = retorno;
    });

    ipcMain.on('trn-cancela-autorizacao', async (event, arg) => {
      const retorno = { status: false, msg: '' };

      const iniLocation = path.resolve(app.getPath('userData'), require('../../package.json').iniName);

      const adminh = ini.parse(fs.readFileSync(iniLocation, 'utf-8'));

      try {
        const CNPJ = arg.param.loja.nf_cgc;

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Cancelamento - Passo 1\n`);

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Params: ${JSON.stringify(arg)}\n`);

        const fileName = `${String(adminh.TrnCentre.Sequencia).padStart(9, '0')}_${String(adminh.Parametros.CDCAIXA).padStart(3, '0')}`;

        const trnPathBackup = path.resolve('C:/TCBKP');

        const trnPathRetorno = path.resolve('C:/TRNCENTR/RESP');

        const trnPathEnvio = path.resolve('C:/TRNCENTR/REQ');

        const trnFile = path.resolve(trnPathEnvio, fileName);

        if (fs.existsSync(`${trnFile}.001`)) {
          fs.unlinkSync(`${trnFile}.001`);
        }

        if (fs.existsSync(path.resolve(trnPathRetorno, fileName))) {
          fs.unlinkSync(path.resolve(trnPathRetorno, fileName));
        }

        if (fs.existsSync(path.resolve(trnPathBackup, `TC.tmp`))) {
          fs.unlinkSync(path.resolve(trnPathBackup, `TC.tmp`));
        }

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Cancelamento - Passo 2\n`);

        let trnContent = '';

        trnContent += `000-000 = 0420${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `011-000 = 800300${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `001-000 = ${String(adminh.Parametros.CDCAIXA).padStart(2, '0')}${String(arg.param.pbmCupom).padStart(
          2,
          '0'
        )}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `040-000 = ${String(arg.param.pbmOperadora).padStart(2, '0')}${String('').padStart(20, ' ')}${String.fromCharCode(
          13
        )}${String.fromCharCode(10)}`;
        trnContent += `012-000 = ${String(arg.param.pbmNsuAdm).padStart(2, '0')}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `940-000 = 003${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `942-000 = ${CNPJ}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `941-000 = ${String(adminh.Parametros.CDCAIXA).padStart(8, '0')}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `023-000 = ${moment().format('HHmmss')}${String.fromCharCode(13)}${String.fromCharCode(10)}`;
        trnContent += `022-000 = ${moment().format('MMDD')}${String.fromCharCode(13)}${String.fromCharCode(10)}`;

        fs.writeFileSync(`${trnFile}.001`, trnContent);

        const mArq = path.resolve(trnPathRetorno, `${fileName}.sts`);
        const mArq1 = path.resolve(trnPathRetorno, `${fileName}.001`);
        const mArq2 = path.resolve(trnPathBackup, `TC.tmp`);

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Cancelamento - Passo 3\n`);

        let concluiu = false;

        let mAprovado = '';
        let msg = '';

        let time = 0;
        const maxTime = 120;

        while (time <= maxTime && !concluiu) {
          fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Cancelamento - Passo 4.${time}\n`);

          await new Promise((resolve) => setTimeout(() => resolve(true), 1000));

          time++;

          if (time >= maxTime) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Abortado por timeout\n`);
            throw new Error('163 - Autorizador não responde');
          }

          if (!fs.existsSync(mArq1)) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Abortado arquivo de retorno nao localizado\n`);
            continue;
          }

          const trnRetorno = fs.readFileSync(mArq1);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `TRHCentre leitura do arquivo: ${mArq1} Conteudo: \n${trnRetorno}\n`);

          if (!trnRetorno || trnRetorno.toString('utf8').trim() === '') {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Passo 1\n`);
            continue;
          }

          const linhas = trnRetorno.toString('utf8').split('\n');

          if (!linhas || linhas.length <= 0) {
            continue;
          }

          if (linhas.length > 0) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Verificando primeira linha: ${linhas[0]}\n`);

            if (String(linhas[0]).trim() !== '000-000 = 0430') {
              fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Passo 2\n`);
              continue;
            } else {
              fs.copyFileSync(mArq1, mArq2);
              // fs.unlinkSync(mArq1);
            }
          }

          fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Cancelamento - Passo 5\n`);

          for (let i = 0; i < linhas.length; i++) {
            if (String(linhas[i]).trim() === '') {
              continue;
            }

            const tmp = String(linhas[i]).split(' = ');

            if (tmp.length !== 2) {
              throw new Error(`Linha ${i} não formatada no padrão esperado`);
            }

            const paramLinha = String(tmp.shift()).trim().replace('\r', '').replace('\n', '');
            const paramLinhaInicio = String(paramLinha).substring(0, 3);
            const valorLinha = tmp.pop();

            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Param: ${paramLinha} \n`);

            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Param Inicio: ${paramLinhaInicio} \n`);

            fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Valor linha: ${valorLinha} \n`);

            if (String(paramLinha) === '009-000') {
              mAprovado = valorLinha;
            }

            if (String(paramLinha) === '030-000') {
              msg += valorLinha;
            }
          }

          concluiu = true;

          fs.appendFileSync(adminh.Parametros.LOGFILE, `${moment().utcOffset('-03:00').format()} | TRNCentre Aguardando 1 segundo... \n`);
        }

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Cancelamento - Passo 6\n`);

        if (String(mAprovado).trim() === '00' || String(mAprovado).trim() === '99') {
          retorno.status = true;
          retorno.msg = mAprovado;
        } else {
          throw new Error(`Esta venda não está aprovada pela PBM!`);
        }

        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Sucesso: ${JSON.stringify(retorno.msg)}\n`);
      } catch (e) {
        retorno.status = false;
        retorno.msg = e.message;
        fs.appendFileSync(adminh.Parametros.LOGFILE, `TRNCentre Falha: ${JSON.stringify(e.message)}\n`);
      }

      event.returnValue = retorno;
    });

    ipcMain.on('fecha-aplicacao', async (event, arg) => {
      app.quit();
      event.returnValue = true;
    });

    ipcMain.on('get-printer-info', async (event, arg) => {
      if (!mainWindow) {
        event.returnValue = false;
      } else {
        const list = await mainWindow.webContents.getPrintersAsync();
        event.returnValue = list;
      }
    });

    ipcMain.on('trier-load-produtos', async (event, arg) => {
      const iniLocation = path.resolve(app.getPath('userData'), require('../../package.json').iniName);

      const adminh = ini.parse(fs.readFileSync(iniLocation, 'utf-8'));

      fs.appendFileSync(adminh.Parametros.LOGFILE, `Trier Load Produtos Iniciado\n`);

      let db = null;

      const result = await new Promise(async (resolve, reject) => {
        try {
          fs.appendFileSync(adminh.Parametros.LOGFILE, `Chamando API\n`);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Abrindo banco de dados SQLite\n`);

          const dbFile = path.resolve(app.getPath('userData'), 'callfarmadb.db');

          db = new sqlite3.Database(dbFile, (error) => {
            if (error) {
              reject(error.message);
            }
          });

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Apagando tabela Produtos\n`);

          db.exec(`DROP TABLE IF EXISTS Produtos;`);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Criando tabela Produtos\n`);

          db.exec(`
            CREATE TABLE Produtos
            (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              codigo TEXT,
              codint INTEGER NOT NULL,
              nome TEXT NOT NULL,
              preco NUMERIC NOT NULL,
              prepro NUMERIC,
              icms NUMERIC,
              ncm TEXT,
              tipo TEXT,
              tipogru INTEGER,
              grupo INTEGER,
              kitqtd INTEGER,
              kitdsc NUMERIC,
              qtdproqt INTEGER,
              descproqt NUMERIC,
              vlrproqt NUMERIC,
              cdfamil NUMERIC,
              mkt09 TEXT
            );
          `);

          db.exec(`CREATE INDEX IF NOT EXISTS "idx1" ON "Produtos" ("codigo");`);

          db.exec(`CREATE INDEX IF NOT EXISTS "idx2" ON "Produtos" ("codint");`);

          db.exec(`
            CREATE TABLE IF NOT EXISTS Venda
            (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              cpfNaNota TEXT,
              cpfClube TEXT,
              totalBruto NUMERIC,
              totalDesconto NUMERIC,
              totalLiquido NUMERIC,
              data_criado TEXT,
              cdfil INTEGER,
              cdcaixa INTEGER,
              nfce INTEGER,
              serie INTEGER,
              formapg INTEGER
            );
          `);

          db.exec(`
            CREATE TABLE IF NOT EXISTS VendaItem
            (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              vendaId INTEGER,
              produto TEXT,
              qtd INTEGER,
              valorBruto NUMERIC,
              valorDesconto NUMERIC,
              valorLiquido NUMERIC
            );
          `);

          // db.exec(`DROP TABLE IF EXISTS Pdvcai;`);

          db.exec(`
            CREATE TABLE IF NOT EXISTS Pdvcai
            (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              operador INTEGER,
              data_criado TEXT,
              trocoini NUMERIC,
              sangria NUMERIC,
              suprimento NUMERIC,
              dinheiro NUMERIC,
              cheque NUMERIC,
              chequep NUMERIC,
              cartao01 NUMERIC,
              cartao02 NUMERIC,
              funcion NUMERIC,
              cartao03 NUMERIC,
              cartao04 NUMERIC,
              totcli INTEGER,
              desconto NUMERIC,
              cupons INTEGER,
              cuponsdes INTEGER,
              gaveta INTEGER,
              horaini TEXT,
              horafim TEXT,
              cupcanc INTEGER,
              cartao NUMERIC,
              convenio NUMERIC,
              recarga NUMERIC,
              formulas NUMERIC,
              pos NUMERIC,
              pagamento NUMERIC,
              devoluc NUMERIC,
              devdinh NUMERIC,
              trocoami NUMERIC,
              giftcard NUMERIC,
              trococar NUMERIC,
              canccre NUMERIC,
              cancdeb NUMERIC,
              uber NUMERIC,
              app NUMERIC,
              cartdig NUMERIC
            );
          `);

          db.exec(`CREATE INDEX IF NOT EXISTS "Pdvcai-idx1" ON "Pdvcai" ("data");`);

          // db.exec(`DROP TABLE IF EXISTS Pdvmovfin;`);

          db.exec(`
            CREATE TABLE IF NOT EXISTS Pdvmovfin
            (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              filial NUMERIC,
              data_criado TEXT,
              operador NUMERIC,
              operacao TEXT,
              cartao TEXT,
              parcelas TEXT,
              valor NUMERIC,
              qtd NUMERIC,
              transmit TEXT
            );
          `);

          db.exec(`CREATE INDEX IF NOT EXISTS "Pdvmovfin-idx1" ON "Pdvmovfin" ("data");`);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Lendo produtos da API\n`);

          let ctrl = 0;

          const ctrlIncrement = 200;

          do {
            const link = `${adminh.Trier.URL}/rest/integracao/produto/obter-todos-v1?primeiroRegistro=${ctrl}&quantidadeRegistros=${ctrlIncrement}`;

            fs.appendFileSync(
              adminh.Parametros.LOGFILE,
              `Buscando produtos na API primeiroRegistro: ${ctrl} quantidadeRegistros: ${ctrlIncrement}\n`
            );

            let config = {
              method: 'get',
              maxBodyLength: Infinity,
              url: link,
              headers: {
                Authorization: `Bearer ${adminh.Trier.Token}`,
              },
            };

            const result = await axios.request(config);

            if (!result) {
              throw new Error('Nenhum produto econtrado');
              break;
            }

            const records = result.data;

            fs.appendFileSync(adminh.Parametros.LOGFILE, `Qtd de produtos retornados da API: ${records.length}\n`);
            // fs.appendFileSync(adminh.Parametros.LOGFILE, `Buscando produtos API: ${typeof records}\n`);
            // fs.appendFileSync(adminh.Parametros.LOGFILE, `Buscando produtos API: ${JSON.stringify(records)}\n`);

            if (!records || records.length <= 0) {
              break;
            }

            let sql = `INSERT INTO Produtos (
              codigo,
              codint,
              nome,
              preco,
              prepro,
              icms,
              ncm,
              tipo,
              tipogru,
              grupo,
              kitqtd,
              kitdsc,
              qtdproqt,
              descproqt,
              vlrproqt,
              cdfamil,
              mkt09
            ) VALUES `;

            const tmpSql = [];

            const values = [];

            for (let i = 0; i < records.length; i++) {
              if (!records[i] || !records[i].codigo) {
                continue;
              }

              tmpSql.push(` (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) `);

              values.push(String(records[i].codigoBarras));
              values.push(records[i].codigo);
              values.push(records[i].nome);
              values.push(Number(records[i].valorVenda) <= 0 ? 0 : records[i].valorVenda);
              values.push(0);
              values.push(18);
              values.push('');
              values.push('');
              values.push(0);
              values.push(records[i].codigoGrupo);
              values.push(0);
              values.push(0);
              values.push(0);
              values.push(0);
              values.push(0);
              values.push(records[i].codigoCategoria);
              values.push('');
            }

            sql += tmpSql.join(', ');

            db.run(sql, values, (error) => {
              if (error) {
                fs.appendFileSync(adminh.Parametros.LOGFILE, `Erro ao gravar produto no banco\n`);
                throw new Error(error.message);
              }
            });

            ctrl += ctrlIncrement;
          } while (true);

          if (db) {
            db.close();
          }

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Finalizou processamento dos produtos\n`);

          resolve(true);
        } catch (e) {
          if (db) {
            db.close();
          }

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Abortado. ${e.message}\n`);

          reject(e.message);
        }
      });

      event.returnValue = result;
    });

    ipcMain.on('trier-set-venda', async (event, arg) => {
      const result = await new Promise(async (resolve, reject) => {
        const iniLocation = path.resolve(app.getPath('userData'), require('../../package.json').iniName);

        const adminh = ini.parse(fs.readFileSync(iniLocation, 'utf-8'));

        try {
          const fieldDescriptors = [
            { name: 'CUPOM', type: 'N', size: 8 },
            { name: 'TRANSACAO', type: 'I', size: 2 },
            { name: 'CODIGO', type: 'C', size: 40 },
            { name: 'QTD', type: 'I', size: 8 },
            { name: 'VALOR', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'DATA', type: 'D', size: 8 },
            { name: 'HORA', type: 'C', size: 8 },
            { name: 'VENDEDOR', type: 'N', size: 6 },
            { name: 'DESCRICAO', type: 'C', size: 40 },
            { name: 'DTRECEITA', type: 'D', size: 8 },
          ];

          const nfce = Number(adminh.Parametros.ULTNFCE);

          const data = moment(arg.horarioServidor, 'YYYY-MM-DD HH:mm:ss').toDate();

          data.setHours(data.getHours() - 3);

          const hora = moment(arg.horarioServidor, 'YYYY-MM-DD HH:mm:ss').format('HH:mm:ss');

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Data Servidor: ${data}\n`);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Hora Servidor: ${hora}\n`);

          const records = [
            {
              CUPOM: nfce,
              TRANSACAO: 0,
              CODIGO: 'self',
              QTD: 0,
              VALOR: 0,
              DATA: data,
              HORA: hora,
              VENDEDOR: arg.vendedor,
              DESCRICAO: '',
              DTRECEITA: data,
            },
            {
              CUPOM: nfce,
              TRANSACAO: 1,
              CODIGO: String(arg.prevenda),
              QTD: parseInt(adminh.Parametros.CDCAIXA, 10),
              VALOR: 0,
              DATA: data,
              HORA: hora,
              VENDEDOR: arg.vendedor,
              DESCRICAO: '',
              DTRECEITA: data,
            },
          ];

          let fgHasReceita = false;

          for (let i = 0; i < arg.produtos.length; i++) {
            const produ = arg.produtos[i];

            let precoFinal = produ.pmc;

            if (Number(produ.pmc) > Number(produ.preco) && Number(produ.preco) > 0) {
              precoFinal = produ.preco;
            }

            records.push({
              CUPOM: nfce,
              TRANSACAO: 2,
              CODIGO: produ.codigo.toFixed(0),
              QTD: parseInt(produ.qtd, 10),
              VALOR: precoFinal,
              DATA: data,
              HORA: hora,
              VENDEDOR: parseInt(produ.vendedor, 10),
              DESCRICAO: String(produ.nome).substring(0, 30),
              DTRECEITA: data,
            });

            if (produ.crm && produ.dtreceita && moment(produ.dtreceita, 'DD/MM/YYYY').isValid()) {
              fgHasReceita = true;

              fs.appendFileSync(adminh.Parametros.LOGFILE, `DTRECEITA: ${moment(produ.dtreceita, 'DD/MM/YYYY').toDate()}\n`);

              records.push({
                CUPOM: nfce,
                TRANSACAO: 4,
                VENDEDOR: parseInt(produ.vendedor, 10),
                DATA: data,
                HORA: hora,
                DESCRICAO: arg.clienteNome,
                DTRECEITA: moment(produ.dtreceita, 'DD/MM/YYYY').toDate(),
                CODIGO: String(produ.crm).trim() === '' ? '9999999992' : produ.crm,
                QTD: 0,
                VALOR: 0,
              });
            }

            if (produ.lote) {
              records.push({
                CUPOM: nfce,
                TRANSACAO: 6,
                VENDEDOR: parseInt(produ.vendedor, 10),
                DATA: data,
                HORA: hora,
                CODIGO: produ.lote,
                DESCRICAO: '',
                DTRECEITA: data,
                QTD: 0,
                VALOR: 0,
              });
            }
          }

          records.push({
            CUPOM: nfce,
            TRANSACAO: 10,
            CODIGO: 'TOTAL',
            QTD: 0,
            VALOR: Number(arg.totalLiquido),
            DATA: data,
            HORA: hora,
            VENDEDOR: 0,
            DESCRICAO: '',
            DTRECEITA: data,
          });

          if (Number(arg.totalDesconto) > 0) {
            records.push({
              CUPOM: nfce,
              TRANSACAO: 10,
              CODIGO: 'X',
              QTD: 0,
              VALOR: Number(arg.totalDesconto),
              DATA: data,
              HORA: hora,
              VENDEDOR: 0,
              DESCRICAO: '',
              DTRECEITA: data,
            });
          }

          // Formas PG Caixa Silvano: { 'Dinheiro' , 'Cheque', 'Cartão Web', 'Debito', 'Credito', 'POS', 'Convenio', 'A Prazo', 'Convenio' }
          switch (parseInt(arg.formapg, 10)) {
            case 1:
              // GapConvenio := {GapRowPdv:Fieldget("EMPRESA_CONVENIO"), " ", GapRowPdv:Fieldget("CONVENIADO") , " ",0,0,0,0,0,1,0}
              records.push({
                CUPOM: nfce,
                TRANSACAO: 10,
                CODIGO:
                  Boolean(arg.appConvenio) === Boolean(true)
                    ? `APPV${String(1).padStart(2, '0')}${String(arg.appConvenioCodigo).padStart(4, '0')}${String(
                        arg.appConvenioUsuario
                      ).padStart(12, '0')}${String(0).padStart(12, '0')}`
                    : 'APPC',
                QTD: 0,
                VALOR: Number(arg.totalLiquido),
                DATA: data,
                HORA: hora,
                VENDEDOR: 0,
                DESCRICAO: '',
                DTRECEITA: data,
              });
              break;
            case 2:
            case 3:
            case 4:
              records.push({
                CUPOM: nfce,
                TRANSACAO: 10,
                CODIGO: 'C',
                QTD: 0,
                VALOR: Number(arg.totalLiquido),
                DATA: data,
                HORA: hora,
                VENDEDOR: 0,
                DESCRICAO: '',
                DTRECEITA: data,
              });
              break;
            default:
              break;
          }

          records.push({
            CUPOM: nfce,
            TRANSACAO: 50,
            CODIGO: String(adminh.Parametros.CDCAIXA),
            QTD: 0,
            VALOR: 0,
            DATA: data,
            HORA: hora,
            VENDEDOR: 0,
            DESCRICAO: '',
            DTRECEITA: data,
          });

          records.push({
            CUPOM: nfce,
            TRANSACAO: 60,
            CODIGO: arg.cpfClube || fgHasReceita ? String(arg.cpfClube) : '0',
            QTD: Number(arg.avaliacao) > Number(0) ? Number(arg.avaliacao) : 0, // -> Colocar aqui a avaliacao da venda
            VALOR: 0,
            DATA: data,
            HORA: hora,
            VENDEDOR: 1,
            DESCRICAO: '',
            DTRECEITA: data,
          });

          if (arg.cpfNaNota) {
            records.push({
              CUPOM: nfce,
              TRANSACAO: 61,
              CODIGO: String(arg.cpfNaNota),
              QTD: 0,
              VALOR: 0,
              DATA: data,
              HORA: hora,
              VENDEDOR: 0,
              DESCRICAO: '',
              DTRECEITA: data,
            });
          }

          const vendaFileName = `V${String(arg.ultvenda).padStart(7, '0')}.dbf`;

          const vendaFile = path.resolve(adminh.Parametros.TEF, vendaFileName);

          if (fs.existsSync(vendaFile)) {
            fs.unlinkSync(vendaFile);
          }

          const dbf = await DBFFile.create(vendaFile, fieldDescriptors);

          await dbf.appendRecords(records);

          const dbFile = path.resolve(app.getPath('userData'), 'callfarmadb.db');

          const db = new sqlite3.Database(dbFile, (error) => {
            if (error) {
              fs.appendFileSync(adminh.Parametros.LOGFILE, `Nao foi possive gravar venda no banco de dados local\n`);
            } else {
              const sql = `INSERT INTO Venda (
                cpfNaNota,
                cpfClube,
                totalBruto,
                totalDesconto,
                totalLiquido,
                data_criado,
                cdfil,
                cdcaixa,
                nfce,
                serie,
                formapg
              ) VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
              ) `;

              db.run(sql, [
                arg.cpfNaNota,
                arg.cpfClube,
                arg.totalBruto,
                arg.totalDesconto,
                arg.totalLiquido,
                moment().tz('America/Sao_Paulo').format('YYYY-MM-DD'),
                adminh.Parametros.CDFIL,
                adminh.Parametros.CDCAIXA,
                adminh.Parametros.ULTNFCE,
                adminh.Parametros.CDCAIXA,
                arg.formapg,
              ]);

              const sql2 = `INSERT INTO VendaItem (
                vendaId,
                produto,
                qtd,
                valorBruto,
                valorDesconto,
                valorLiquido
              ) VALUES `;

              const tmpSql2 = [];

              const values = [];

              for (let i = 0; i < arg.produtos.length; i++) {
                tmpSql2.push(' (?,?,?,?,?,?) ');

                values.push(adminh.Parametros.ULTNFCE);
                values.push(arg.produtos[i].codigo);
                values.push(arg.produtos[i].qtd);
                values.push(arg.produtos[i].pmc);
                values.push(
                  arg.produtos[i].pmc > arg.produtos[i].preco && arg.produtos[i].preco > 0 ? arg.produtos[i].pmc - arg.produtos[i].preco : 0
                );
                values.push(arg.produtos[i].preco);
              }

              db.run(`${sql2} ${tmpSql2.join(',')}`, values);
            }
          });

          const pathVendaBkp = path.resolve(adminh.Parametros.TEF, 'bkp');

          const pathVendaOnline = path.resolve(adminh.Parametros.TEF, 'online');

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Verificando pasta online e bkp\n`);

          if (!fs.existsSync(pathVendaBkp)) {
            fs.mkdirSync(pathVendaBkp);
          }

          fs.copyFileSync(vendaFile, path.resolve(pathVendaBkp, vendaFileName).replace('V', 'L'));

          if (!fs.existsSync(pathVendaOnline)) {
            fs.mkdirSync(pathVendaOnline);
          }

          fs.copyFileSync(vendaFile, path.resolve(pathVendaOnline, vendaFileName.replace('V', 'L')));

          if (fs.existsSync(vendaFile)) {
            fs.unlinkSync(vendaFile);
          }

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Tratando registros do Pdvcai SQLite\n`);

          db.get(
            `SELECT * FROM Pdvcai WHERE data_criado LIKE ? LIMIT 1`,
            [moment().tz('America/Sao_Paulo').format('YYYY-MM-DD')],
            (err, row) => {
              if (err) {
                fs.appendFileSync(adminh.Parametros.LOGFILE, `*** Problemas ao gravar registro Pdvcai no SQLite\n`);
              }

              if (!row || !row.id || typeof row === 'undefined') {
                fs.appendFileSync(adminh.Parametros.LOGFILE, `Nenhum registro localizado, vai fazer insert\n`);

                const sql3Insert = `INSERT INTO Pdvcai (
                  operador,
                  data_criado,
                  trocoini,
                  sangria,
                  suprimento,
                  dinheiro,
                  cheque,
                  chequep,
                  cartao01,
                  cartao02,
                  funcion,
                  cartao03,
                  cartao04,
                  totcli,
                  desconto,
                  cupons,
                  cuponsdes,
                  gaveta,
                  horaini,
                  horafim,
                  cupcanc,
                  cartao,
                  convenio,
                  recarga,
                  formulas,
                  pos,
                  pagamento,
                  devoluc,
                  devdinh,
                  trocoami,
                  giftcard,
                  trococar,
                  canccre,
                  cancdeb,
                  uber,
                  app,
                  cartdig
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

                db.run(sql3Insert, [
                  999,
                  moment().tz('America/Sao_Paulo').format('YYYY-MM-DD'),
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  Number(arg.formapg) === Number(3) ? arg.totalLiquido : 0,
                  0,
                  0,
                  0,
                  0,
                  1,
                  arg.totalDesconto,
                  1,
                  Number(arg.totalDesconto) > Number(0) ? 1 : 0,
                  0,
                  moment().tz('America/Sao_Paulo').format('HH:mm:ss'),
                  '',
                  0,
                  Number(arg.formapg) === Number(4) ? arg.totalLiquido : 0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  Number(arg.formapg) === Number(1) ? arg.totalLiquido : 0,
                  Number(arg.formapg) === Number(2) ? arg.totalLiquido : 0,
                ]);
              } else {
                fs.appendFileSync(adminh.Parametros.LOGFILE, `Registro localizado vai fazer Update\n`);

                const sql3Update = `UPDATE Pdvcai SET
                  CARTAO01 = ?,
                  TOTCLI = ?,
                  DESCONTO = ?,
                  CUPONS = ?,
                  CUPONSDES = ?,
                  CARTAO = ?,
                  APP = ?,
                  CARTDIG = ?
                WHERE id = ?`;

                const values3Update = [
                  row.cartao01 + (Number(arg.formapg) === Number(3) ? arg.totalLiquido : 0),
                  row.totcli + 1,
                  row.desconto + arg.totalDesconto,
                  row.cupons + 1,
                  row.cuponsdes + (Number(arg.totalDesconto) > Number(0) ? 1 : 0),
                  row.cartao + (Number(arg.formapg) === Number(4) ? arg.totalLiquido : 0),
                  row.app + (Number(arg.formapg) === Number(1) ? arg.totalLiquido : 0),
                  row.cartdig + (Number(arg.formapg) === Number(2) ? arg.totalLiquido : 0),
                  row.id,
                ];

                db.run(sql3Update, values3Update);
              }
            }
          );

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Verificando arquivo PDVCAI.dbf\n`);

          const dfbFilePdvcai = path.resolve(adminh.Parametros.TEF, 'PDVCAI.dbf');

          let dfbFilePdvcaiApagou = 0;

          do {
            try {
              if (fs.existsSync(dfbFilePdvcai)) {
                fs.unlinkSync(dfbFilePdvcai);
                dfbFilePdvcaiApagou = 3;
              }
            } catch (e) {
              await new Promise((resolve) => setTimeout(() => resolve(true), 200));
            }

            dfbFilePdvcaiApagou++;
          } while (dfbFilePdvcaiApagou < 3);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Criando PDVCAI.dbf novo\n`);

          const fieldDescriptorsPdvcai = [
            { name: 'OPERADOR', type: 'N', size: 6 },
            { name: 'DATA', type: 'D', size: 8 },
            { name: 'TROCOINI', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'SANGRIA', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'SUPRIMENTO', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'DINHEIRO', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CHEQUE', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CHEQUEP', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CARTAO01', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CARTAO02', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'FUNCION', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CARTAO03', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CARTAO04', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'TOTCLI', type: 'N', size: 6 },
            { name: 'DESCONTO', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CUPONS', type: 'N', size: 6 },
            { name: 'CUPONSDES', type: 'N', size: 6 },
            { name: 'GAVETA', type: 'N', size: 6 },
            { name: 'HORAINI', type: 'C', size: 8 },
            { name: 'HORAFIM', type: 'C', size: 8 },
            { name: 'CUPCANC', type: 'N', size: 6 },
            { name: 'CARTAO', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CONVENIO', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'RECARGA', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'FORMULAS', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'POS', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'PAGAMENTO', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'DEVOLUC', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'DEVDINH', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'TROCOAMI', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'GIFTCARD', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'TROCOCAR', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CANCCRE', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CANCDEB', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'UBER', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'APP', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'CARTDIG', type: 'N', size: 12, decimalPlaces: 2 },
          ];

          const dbfPdvcai = await DBFFile.create(dfbFilePdvcai, fieldDescriptorsPdvcai);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Convertendo PDVCAI para PDVCAI.dbf\n`);

          await new Promise((resolve, reject) => {
            db.all(
              `SELECT * FROM Pdvcai WHERE data_criado LIKE ?`,
              [moment().tz('America/Sao_Paulo').format('YYYY-MM-DD')],
              async (err, rows) => {
                if (err || !rows || rows.length <= 0) {
                  reject(err);
                } else {
                  const recordsDbfCai = [];

                  for (let i = 0; i < rows.length; i++) {
                    recordsDbfCai.push({
                      OPERADOR: 999,
                      DATA: moment(rows[i].data_criado, 'YYYY-MM-DD').toDate(),
                      TROCOINI: 0,
                      SANGRIA: 0,
                      SUPRIMENTO: 0,
                      DINHEIRO: 0,
                      CHEQUE: 0,
                      CHEQUEP: 0,
                      CARTAO01: Number(rows[i].cartao01),
                      CARTAO02: Number(rows[i].cartao02),
                      FUNCION: 0,
                      CARTAO03: Number(rows[i].cartao03),
                      CARTAO04: Number(rows[i].cartao04),
                      TOTCLI: Number(rows[i].totcli),
                      DESCONTO: Number(rows[i].desconto),
                      CUPONS: Number(rows[i].cupons),
                      CUPONSDES: Number(rows[i].cuponsdes),
                      GAVETA: 0,
                      HORAINI: String(rows[i].horaini),
                      HORAFIM: '',
                      CUPCANC: 0,
                      CARTAO: Number(rows[i].cartao),
                      CONVENIO: Number(rows[i].convenio),
                      RECARGA: 0,
                      FORMULAS: 0,
                      POS: Number(rows[i].pos),
                      PAGAMENTO: 0,
                      DEVOLUC: 0,
                      DEVDINH: 0,
                      TROCOAMI: 0,
                      GIFTCARD: 0,
                      TROCOCAR: 0,
                      CANCCRE: 0,
                      CANCDEB: 0,
                      UBER: 0,
                      APP: Number(rows[i].app),
                      CARTDIG: Number(rows[i].cartdig),
                    });
                  }

                  fs.appendFileSync(adminh.Parametros.LOGFILE, `Pdvcai Params: ${JSON.stringify(recordsDbfCai)}\n`);

                  if (recordsDbfCai.length > 0) {
                    try {
                      await dbfPdvcai.appendRecords(recordsDbfCai);
                    } catch (e) {
                      fs.appendFileSync(adminh.Parametros.LOGFILE, `Pdvcai Erro: ${JSON.stringify(e.message)}\n`);
                    }
                  }

                  resolve(true);
                }
              }
            );
          });

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Concluiu gravação PDVCAI.dbf\n`);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Tratando gravação da PDVMOVFIN.dbf\n`);

          let formapgPdvmovfin = '';

          if (Number(arg.formapg) === Number(1)) {
            formapgPdvmovfin = 'APP';
          } else if (Number(arg.formapg) === Number(2)) {
            formapgPdvmovfin = 'CT ';
          } else if (Number(arg.formapg) === Number(3)) {
            formapgPdvmovfin = 'DB ';
          } else if (Number(arg.formapg) === Number(4)) {
            formapgPdvmovfin = 'CR ';
          }

          // GRAVA PDVMVFIN
          db.get(
            `SELECT * FROM Pdvmovfin WHERE data_criado LIKE ? AND operacao LIKE ? AND cartao LIKE ? AND parcelas = ? LIMIT 1`,
            [moment().tz('America/Sao_Paulo').format('YYYY-MM-DD'), formapgPdvmovfin, arg.cartaoNome, arg.parcelas],
            (err, row) => {
              if (err) {
                fs.appendFileSync(adminh.Parametros.LOGFILE, `*** Problemas ao gravar registro Pdvmovfin no SQLite\n`);
              }

              if (!row || !row.id || typeof row === 'undefined') {
                fs.appendFileSync(adminh.Parametros.LOGFILE, `Nenhum registro localizado, vai fazer insert\n`);

                const sql3Insert = `INSERT INTO Pdvmovfin (
                  filial,
                  data_criado,
                  operador,
                  operacao,
                  cartao,
                  parcelas,
                  valor,
                  qtd,
                  transmit
                ) VALUES (?,?,?,?,?,?,?,?,?)`;

                db.run(sql3Insert, [
                  adminh.Parametros.CDFIL,
                  moment().tz('America/Sao_Paulo').format('YYYY-MM-DD'),
                  999,
                  formapgPdvmovfin,
                  arg.cartaoNome,
                  arg.parcelas,
                  arg.totalLiquido,
                  1,
                  'N',
                ]);
              } else {
                fs.appendFileSync(adminh.Parametros.LOGFILE, `Registro localizado vai fazer Update\n`);

                const sql4Update = `UPDATE Pdvmovfin SET
                  valor = ?,
                  qtd = ?
                WHERE id = ?`;

                const values4Update = [row.valor + arg.totalLiquido, row.qtd + 1, row.id];

                db.run(sql4Update, values4Update);
              }
            }
          );

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Verificando arquivo PDVMOVFIN.dbf\n`);

          const dfbFilePdvmovfin = path.resolve(adminh.Parametros.TEF, 'PDVMOVFIN.dbf');

          let dfbFilePdvmovfinApagou = 0;

          do {
            try {
              if (fs.existsSync(dfbFilePdvmovfin)) {
                fs.unlinkSync(dfbFilePdvmovfin);
                dfbFilePdvmovfinApagou = 3;
              }
            } catch (e) {
              dfbFilePdvmovfinApagou++;
              await new Promise((resolve) => setTimeout(() => resolve(true), 200));
            }
          } while (dfbFilePdvmovfinApagou < 3);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Criando PDVMOVFIN.dbf novo\n`);

          const fieldDescriptorsPdvmovfin = [
            { name: 'FILIAL', type: 'N', size: 3 },
            { name: 'DATA', type: 'D', size: 8 },
            { name: 'OPERADOR', type: 'N', size: 6 },
            { name: 'OPERACAO', type: 'C', size: 3 },
            { name: 'CARTAO', type: 'C', size: 30 },
            { name: 'PARCELAS', type: 'C', size: 3 },
            { name: 'VALOR', type: 'N', size: 12, decimalPlaces: 2 },
            { name: 'QTD', type: 'N', size: 6 },
            { name: 'TRANSMIT', type: 'C', size: 1 },
          ];

          const dbfPdvmovfin = await DBFFile.create(dfbFilePdvmovfin, fieldDescriptorsPdvmovfin);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Convertendo PDVMOVFIN para PDVMOVFIN.dbf\n`);

          await new Promise((resolve, reject) => {
            db.all(
              `SELECT * FROM Pdvmovfin WHERE data_criado LIKE ?`,
              [moment().tz('America/Sao_Paulo').format('YYYY-MM-DD')],
              async (err, rows) => {
                if (err || (!rows && rows.length <= 0)) {
                  fs.appendFileSync(adminh.Parametros.LOGFILE, `Erro: ${JSON.stringify(err)}\n`);

                  reject(err);
                } else {
                  const recordsDbfMovfin = [];

                  for (let i = 0; i < rows.length; i++) {
                    recordsDbfMovfin.push({
                      FILIAL: Number(rows[i].filial),
                      DATA: moment(rows[i].data_criado, 'YYYY-MM-DD').toDate(),
                      OPERADOR: 999,
                      OPERACAO: String(rows[i].operacao).padEnd(3, ' '),
                      CARTAO: String(rows[i].cartao),
                      PARCELAS: String(rows[i].parcelas),
                      VALOR: Number(rows[i].valor),
                      QTD: Number(rows[i].qtd),
                      TRANSMIT: 'N',
                    });
                  }

                  fs.appendFileSync(adminh.Parametros.LOGFILE, `Pdvmovfin Params: ${JSON.stringify(recordsDbfMovfin)}\n`);

                  if (recordsDbfMovfin.length > 0) {
                    try {
                      await dbfPdvmovfin.appendRecords(recordsDbfMovfin);
                    } catch (e) {
                      fs.appendFileSync(adminh.Parametros.LOGFILE, `Pdvmovfin Erro: ${JSON.stringify(e.message)}\n`);
                    }
                  }

                  resolve(true);
                }
              }
            );
          });

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Concluiu gravação PDVMOVFIN.dbf\n`);

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Verificando arquivo PDVPGDT.dbf\n`);

          const dfbFilePdvpgdt = path.resolve(adminh.Parametros.TEF, 'PDVPGDT.dbf');

          let dbfPdvpgdt = null;

          if (!fs.existsSync(dfbFilePdvpgdt)) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `Criando PDVPGDT.dbf novo\n`);

            const fieldDescriptorsPdvpgdt = [
              { name: 'LOJA', type: 'N', size: 3 },
              { name: 'DATA', type: 'D', size: 8 },
              { name: 'HORA', type: 'C', size: 10 },
              { name: 'ORIGEM', type: 'C', size: 10 },
              { name: 'DOCUMENTO', type: 'N', size: 9 },
              { name: 'FORMAPG', type: 'C', size: 20 },
              { name: 'BANDEIRA', type: 'C', size: 40 },
              { name: 'PARCELAS', type: 'C', size: 3 },
              { name: 'VALOR', type: 'N', size: 12, decimalPlaces: 2 },
              { name: 'NSU', type: 'C', size: 80 },
              { name: 'ROTA', type: 'C', size: 80 },
              { name: 'OPERCX', type: 'N', size: 6 },
              { name: 'TID', type: 'C', size: 140 },
              { name: 'ECF', type: 'N', size: 4 },
              { name: 'PBM', type: 'C', size: 40 },
              { name: 'CODAUTOR', type: 'C', size: 40 },
            ];

            dbfPdvpgdt = await DBFFile.create(dfbFilePdvpgdt, fieldDescriptorsPdvpgdt);
          } else {
            dbfPdvpgdt = await DBFFile.open(dfbFilePdvpgdt);
          }

          let formaPgPdvpgdt = '';

          if (Number(arg.formapg) === Number(1)) {
            formaPgPdvpgdt = 'App';
          } else if (Number(arg.formapg) === Number(2)) {
            formaPgPdvpgdt = 'Pix';
          } else if (Number(arg.formapg) === Number(3)) {
            formaPgPdvpgdt = 'Debito';
          } else if (Number(arg.formapg) === Number(4)) {
            formaPgPdvpgdt = 'Credito';
          }

          try {
            await dbfPdvpgdt.appendRecords([
              {
                LOJA: Number(adminh.Parametros.CDFIL),
                DATA: moment().tz('America/Sao_Paulo').toDate(),
                HORA: moment().tz('America/Sao_Paulo').format('HH:mm:ss'),
                ORIGEM: 'Caixa-Self',
                DOCUMENTO: arg.nfce,
                FORMAPG: formaPgPdvpgdt,
                BANDEIRA: arg.cartaoNome,
                PARCELAS: String(arg.parcelas),
                VALOR: arg.totalLiquido,
                NSU: arg.cartaoNsu,
                ROTA: 'Sitef',
                OPERCX: 999,
                TID: 'N',
                ECF: Number(adminh.Parametros.CDCAIXA),
                PBM: '',
                CODAUTOR: '',
              },
            ]);
          } catch (e) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `dbfPdvpgdt Erro: ${JSON.stringify(e.message)}\n`);
          }

          fs.appendFileSync(adminh.Parametros.LOGFILE, `Concluido PDVPGDT.dbf\n`);

          for (let i = 0; i < arg.produtos.length; i++) {
            if (Number(arg.produtos[i].prevenda) > Number(0)) {
              const pathPrevenda = path.resolve(
                adminh.Parametros.PREVENDA_PASTA,
                `C${String(arg.produtos[i].prevenda).padStart(6, '0')}.dbf`
              );

              if (fs.existsSync(pathPrevenda)) {
                fs.copyFileSync(
                  pathPrevenda,
                  path.resolve(adminh.Parametros.PREVENDA_PASTA, `X${String(arg.produtos[i].prevenda).padStart(6, '0')}.dbf`)
                );
                fs.unlinkSync(pathPrevenda);
              }
            }
          }

          if (db) {
            db.close();
          }

          try {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `--> Inicia transmissão da venda para Trier`);

            let itens = [];

            let totalNota = 0;

            for (let i = 0; i < arg.produtos.length; i++) {
              let desconto = 0.0;
              let preco = arg.produtos[i].pmc;

              if (arg.produtos[i].preco > 0 && arg.produtos[i].pmc > arg.produtos[i].preco) {
                desconto = arg.produtos[i].pmc - arg.produtos[i].preco;
                preco = arg.produtos[i].pmc - desconto;
              }

              totalNota += parseFloat(Number(arg.produtos[i].pmc - desconto).toFixed(2)) * arg.produtos[i].qtd;

              itens.push({
                codigoProduto: arg.produtos[i].codigo,
                nomeProduto: String(arg.produtos[i].nome).substring(0, 30),
                quantidade: arg.produtos[i].qtd,
                valorUnitario: parseFloat(Number(preco).toFixed(2)),
                valorDesconto: 0,
              });
            }

            let param = {
              numeroPedido: adminh.Parametros.ULTNFCE,
              dataPedido: moment().utcOffset('-03:00').format('YYYY-MM-DD'),
              valorTotalVenda: totalNota,
              valorFrete: 0.0,
              entrega: true,
              cliente: {
                codigo: '',
                nome: arg.cpfNaNota ? arg.nome : 'Consumidor Final',
                numeroCpfCnpj: arg.cpfNaNota ? arg.cpf : '123.456.789-10',
                numeroRGIE: '',
                sexo: 'F',
                dataNascimento: '1970-01-15',
                celular: '',
                fone: '48999999999',
                email: 'email@email.com',
              },
              enderecoEntrega: {
                logradouro: 'Rua Bonifácio',
                numero: '999',
                complemento: 'Apto 10',
                referencia: 'Prédio Cinza',
                bairro: 'Jardim Amélia',
                cidade: 'Tubarão',
                estado: 'SC',
                cep: '88704001',
              },
              pagamento: {
                pagamentoRealizado: true,
                valorParcela: totalNota,
                dataVencimento: null,
                valorDinheiro: null,
                valorTroco: null,
                numeroAutorizacao: null,
              },
              produtos: itens,
            };

            fs.appendFileSync(adminh.Parametros.LOGFILE, `--> Trier | Payload | ${JSON.stringify(param)}`);

            let config = {
              method: 'POST',
              maxBodyLength: Infinity,
              url: `${adminh.Trier.URL}/rest/integracao/venda/ecommerce/efetuar-venda-v1`,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminh.Trier.Token}`,
              },
              data: param,
            };

            const result = await axios.request(config);

            fs.appendFileSync(adminh.Parametros.LOGFILE, `--> Trier | Result | ${JSON.stringify(result.data)}`);

            if (!result.data) {
              throw new Error(result.data.message);
            }

            fs.appendFileSync(adminh.Parametros.LOGFILE, `--> Trier venda transmitida com sucesso.`);
          } catch (e) {
            fs.appendFileSync(adminh.Parametros.LOGFILE, `--> Trier uma excessão foi acionada | ${e.message}`);
          }

          resolve(true);
        } catch (e) {
          fs.appendFileSync(adminh.Parametros.LOGFILE, `*** Problemas ao gravar registro DBF da venda\n`);
          fs.appendFileSync(adminh.Parametros.LOGFILE, `${e.message}\n`);
          reject(e.message);
        }
      });

      event.returnValue = result;
    });

    createWindow();

    createSecondWindow();

    app.on('activate', () => {
      if (mainWindow === null) createWindow();
      if (secondWindow === null) createSecondWindow();
    });
  })
  .catch(console.log);
