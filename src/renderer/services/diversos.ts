// @ts-ignore
/* eslint-disable */
import moment from 'moment';

export const Diversos = {
  getStatus: () => {
    return [
      { value: 1, label: 'Pendente' },
      { value: 2, label: 'Em análise' },
      { value: 3, label: 'Em separação / Faturamento' },
      { value: 4, label: 'Aguardando expedição' },
      { value: 5, label: 'Enviado' },
      { value: 6, label: 'Entregue' },
      { value: 7, label: 'Aguardando pagamento' },
      { value: 8, label: 'Cancelado' },
      { value: 9, label: 'Pronto para retirada' },
    ];
  },

  getFormaPg: () => {
    return [
      { value: 1, label: 'Cartão de crédito' },
      { value: 2, label: 'Boleto' },
      { value: 3, label: 'Depósito' },
      { value: 4, label: 'Dinheiro' },
      { value: 5, label: 'Pagar na entrega' },
      { value: 9, label: 'Compre+Rapido' },
      { value: 10, label: 'Pix' },
      { value: 11, label: 'Pagar na loja' },
    ];
  },

  nomeLoja: (cdfil) => {
    switch (parseInt(cdfil)) {
      case 1:
        return 'CallFarma';
      case 2:
        return 'CallFarma Hauer';
      case 3:
        return 'CallFarma Ponta Grossa';
      case 4:
        return 'CallFarma Tarumã';
      case 5:
        return 'CallFarma Campo Largo';
      case 6:
        return 'CallFarma Bacacheri';
      case 7:
        return 'CallFarma Nova Russia';
      case 8:
        return 'CallFarma Uvaranas';
      case 9:
        return 'CallFarma Araucaria';
      case 10:
        return 'CallFarma Rui Barbosa';
      case 11:
        return 'CallFarma Pinhais';
      case 12:
        return 'CallFarma Portão';
      case 13:
        return 'CallFarma Mêrces';
      case 14:
        return 'CallFarma Ecoville';
      case 15:
        return 'CallFarma Uvaranas Chafariz';
      case 16:
        return 'CallFarma Estrela';
      case 17:
        return 'CallFarma Jardim Carvalho';
      case 18:
        return 'CallFarma Santa Paula';
      default:
        return 'CallFarma';
    }
  },

  getUFs: () => {
    // CRIA LISTA DE ESTADOS
    return [
      { value: '0', label: '--' },
      { value: 'AC', label: 'Acre' },
      { value: 'AL', label: 'Alagoas' },
      { value: 'AP', label: 'Amapá' },
      { value: 'AM', label: 'Amazonas' },
      { value: 'BA', label: 'Bahia' },
      { value: 'CE', label: 'Ceará' },
      { value: 'DF', label: 'Distrito Federal' },
      { value: 'ES', label: 'Espirito Santo' },
      { value: 'GO', label: 'Goiás' },
      { value: 'MA', label: 'Maranhão' },
      { value: 'MS', label: 'Mato Grosso do Sul' },
      { value: 'MT', label: 'Mato Grosso' },
      { value: 'MG', label: 'Minas Gerais' },
      { value: 'PA', label: 'Pará' },
      { value: 'PB', label: 'Paraíba' },
      { value: 'PR', label: 'Paraná' },
      { value: 'PE', label: 'Pernambuco' },
      { value: 'PI', label: 'Piauí' },
      { value: 'RJ', label: 'Rio de Janeiro' },
      { value: 'RN', label: 'Rio Grande do Norte' },
      { value: 'RS', label: 'Rio Grande do Sul' },
      { value: 'RO', label: 'Rondônia' },
      { value: 'RR', label: 'Roraima' },
      { value: 'SC', label: 'Santa Catarina' },
      { value: 'SP', label: 'São Paulo' },
      { value: 'SE', label: 'Sergipe' },
      { value: 'TO', label: 'Tocantins' },
    ];
  },

  getSexos: () => {
    return [
      { value: 1, label: 'Masculino' },
      { value: 2, label: 'Feminino' },
      { value: 3, label: 'Não informar' },
    ];
  },

  padding_left: (s, c, n) => {
    if (!s || !c || s.length >= n) {
      return s;
    }
    const max = (n - s.length) / c.length;
    for (let i = 0; i < max; i++) {
      s = c + s;
    }
    return s;
  },

  padding_right: (s, c, n) => {
    if (!s || !c || s.length >= n) {
      return s;
    }
    const max = (n - s.length) / c.length;
    for (let i = 0; i < max; i++) {
      s += c;
    }
    return s;
  },

  getnums: (str) => {
    if (typeof str !== 'string') {
      str = str.toString();
    }

    const num = str.replace(/[^0-9]/g, '');
    return num;
  },

  convData: (data) => {
    if (data == '' || data == null) return '// ::';
    // return data[8] + data[9] + "/" + data[5] + data[6] + "/" + data[0] + data[1] + data[2] + data[3] + " " + data[11] + data[12] + ":" + data[14] + data[15] + ":" + data[17] + data[18];
    // return data.substr(8, 2) + "/" + data.substr(5, 2) + "/" + data.substr(0, 4) + "/" + data.substr(11, 2) + ":" + data.substr(14, 2) + ":" + data.substr(17, 2);

    if (data.length > 10)
      return `${data.substr(8, 2)}/${data.substr(5, 2)}/${data.substr(0, 4)} ${data.substr(11, 2)}:${data.substr(14, 2)}`;
    return `${data.substr(8, 2)}/${data.substr(5, 2)}/${data.substr(0, 4)}`;
  },

  convDataToBD: (data) => {
    if (data == '' || data == null) return '--';
    // return data[8] + data[9] + "/" + data[5] + data[6] + "/" + data[0] + data[1] + data[2] + data[3] + " " + data[11] + data[12] + ":" + data[14] + data[15] + ":" + data[17] + data[18];
    return `${data.substr(6, 4)}-${data.substr(3, 2)}-${data.substr(0, 2)}`;
  },

  number_format: (number, decimals, dec_point, thousands_sep) => {
    number = `${number}`.replace(/[^0-9+\-Ee.]/g, '');
    const n = !isFinite(+number) ? 0 : +number;
    const prec = !isFinite(+decimals) ? 0 : Math.abs(decimals);
    const sep = typeof thousands_sep === 'undefined' ? ',' : thousands_sep;
    const dec = typeof dec_point === 'undefined' ? '.' : dec_point;
    let s = [''];
    const toFixedFix = function (n, prec) {
      const k = 10 ** prec;
      return `${(Math.round(n * k) / k).toFixed(prec)}`;
    };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : `${Math.round(n)}`).split('.');
    if (s[0].length > 3) {
      s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < prec) {
      s[1] = s[1] || '';
      s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
  },

  validateEmail: (sEmail) => {
    const filter = /^[\w\-\.\+]+\@[a-zA-Z0-9\.\-]+\.[a-zA-z0-9]{2,4}$/;
    if (filter.test(sEmail)) return true;
    return false;
  },

  validateCNPJ: (sCNPJ) => {
    const cnpjValor = sCNPJ;
    let cnpj = cnpjValor.replace(/[^\d]+/g, '');
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj == '') return false;
    if (cnpj.length != 14) return false;

    // Elimina CNPJs invalidos conhecidos
    if (
      cnpj == '00000000000000' ||
      cnpj == '11111111111111' ||
      cnpj == '22222222222222' ||
      cnpj == '33333333333333' ||
      cnpj == '44444444444444' ||
      cnpj == '55555555555555' ||
      cnpj == '66666666666666' ||
      cnpj == '77777777777777' ||
      cnpj == '88888888888888' ||
      cnpj == '99999999999999'
    )
      return false;

    // Valida DVs
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    const digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (var i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado != digitos.charAt(0)) return false;

    tamanho += 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado != digitos.charAt(1)) return false;

    return true;
  },

  validateCPF: (sCPF) => {
    const cpfValor = sCPF;
    const cpf = cpfValor.replace(/[^\d]+/g, '');
    if (cpf == '') return false;
    // Elimina CPFs invalidos conhecidos
    if (
      cpf.length != 11 ||
      cpf == '00000000000' ||
      cpf == '11111111111' ||
      cpf == '22222222222' ||
      cpf == '33333333333' ||
      cpf == '44444444444' ||
      cpf == '55555555555' ||
      cpf == '66666666666' ||
      cpf == '77777777777' ||
      cpf == '88888888888' ||
      cpf == '99999999999'
    )
      return false;

    // Valida 1o digito
    let add = 0;
    for (var i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(cpf.charAt(9))) return false;
    // Valida 2o digito
    add = 0;
    for (i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(cpf.charAt(10))) return false;
    return true;
  },

  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  getIdade: (nascimento) => {
    const hoje = new Date();
    // nascimento = new Date($("#dtnascimento").val());
    let diferencaAnos = hoje.getFullYear() - nascimento.getFullYear();
    if (
      new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()) <
      new Date(hoje.getFullYear(), nascimento.getMonth(), nascimento.getDate())
    )
      diferencaAnos--;
    return diferencaAnos;
  },

  convPrecoToFloat: (preco) => {
    // let aux = preco.replace(/./g, "");
    // aux = aux.replace(/,/g, ".");
    return parseFloat(preco);
  },

  captalize: (text) => {
    return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
  },

  maskPreco: (text) => {
    const tmp = typeof text !== 'number' ? Number(text) : text;

    const aux = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(tmp);

    return aux;
  },

  maskPrecoDigit: (n) => {
    return String(n).replace(/(\d{1,3})?(,?\d{3})*(\.\d{2})+/g, '$1$2$3');
  },

  maskCPF: (text) => {
    const cpf = text.replace(/[^\d]/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  maskCNPJ: (text) => {
    const cpf = text.replace(/[^\d]/g, '');
    return cpf.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  },

  maskCEP: (text) => {
    const cpf = text.replace(/[^\d]/g, '');
    return cpf.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2-$3');
  },

  maskNascimento: (text) => {
    const tmp = text.replace(/[^\d]/g, '');
    return tmp.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
  },

  maskTelefone: (text) => {
    const tmp = text.replace(/[^\d]/g, '');
    let tmp2 = '';
    if (tmp.length >= 11) tmp2 = tmp.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else tmp2 = tmp.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return tmp2;
  },

  maskCartaoValidade: (text) => {
    return text.replace(/[^0-9]/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
  },

  maskCartaoCvv: (text) => {
    return text.replace(/[^0-9]/g, '').replace(/(\d{4})/, '$1');
  },

  maskCartaoNumero: (text) => {
    const tmp = text.replace(/[^0-9]/g, '');

    if (tmp.length === 15) {
      return tmp.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
    }
    if (tmp.length === 16) {
      return tmp.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
    }
    return tmp;
  },

  getBrandCard: (text) => {
    if (!text) return false;

    const cardnumber = text.replace(/[^0-9]+/g, '');

    const cards = {
      visa: /^4[0-9]{12}(?:[0-9]{3})/,
      mastercard: /^5[1-5][0-9]{14}/,
      diners: /^3(?:0[0-5]|[68][0-9])[0-9]{11}/,
      amex: /^3[47][0-9]{13}/,
      discover: /^6(?:011|5[0-9]{2})[0-9]{12}/,
      hipercard: /^(606282\d{10}(\d{3})?)|(3841\d{15})/,
      elo: /^((((636368)|(438935)|(504175)|(451416)|(636297))\d{0,10})|((5067)|(4576)|(4011))\d{0,12})/,
      jcb: /^(?:2131|1800|35\d{3})\d{11}/,
      aura: /^(5078\d{2})(\d{2})(\d{11})$/,
    };

    for (const flag in cards) {
      if (cards[flag].test(cardnumber)) {
        return flag;
      }
    }

    return false;
  },

  formatTelefone: (telParam) => {
    const tel = telParam.replace(/[^\d]/g, '');
    if (tel.length <= 10) return tel.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  },

  decimalAdjust: (type, value, exp) => {
    // Se exp é indefinido ou zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // Se o valor não é um número ou o exp não é inteiro...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Transformando para string
    value = value.toString().split('e');
    value = Math[type](+`${value[0]}e${value[1] ? +value[1] - exp : -exp}`);
    // Transformando de volta
    value = value.toString().split('e');
    return +`${value[0]}e${value[1] ? +value[1] + exp : exp}`;
  },

  getStatusAtendimentoQrCode: (status) => {
    switch (status) {
      case 1:
        return 'Aguardando atendimento';
      case 2:
        return 'Em atendimento';
      case 3:
        return 'Finalizado';
      case 4:
        return 'Cancelado';
      default:
        return '';
    }
  },

  getInteiro: (preco) => {
    const tmp = preco.toFixed(2);
    const tmp2 = tmp.toString();
    const tmp3 = tmp2.split('.');
    return tmp3.shift();
  },

  getDecimal: (preco) => {
    const tmp = preco.toFixed(2);
    const tmp2 = tmp.toString();
    const tmp3 = tmp2.split('.');
    return tmp3.pop();
  },

  policia: (param = null) => {
    if (!param) return '';

    if (typeof param !== 'string') param = param.toString();

    param = param.replace(/[^0-9]/g, '');
    param = param.padStart(11, '0');

    let t1 = parseInt(param.substr(0, 2));
    let t2 = parseInt(param.substr(2, 3));
    let t3 = parseInt(param.substr(5, 3));
    let t4 = parseInt(param.substr(8, 3));

    t1 *= 4;
    t1 = t1.toString();
    t2 *= 7;
    t2 = t2.toString();
    t3 *= 5;
    t3 = t3.toString();
    t4 *= 3;
    t4 = t4.toString();

    t1 = t1.padStart(4, '0');
    t2 = t2.padStart(4, '0');
    t3 = t3.padStart(4, '0');
    t4 = t4.padStart(4, '0');

    return `${t3}${t1}${t4}${t2}`;
  },

  getVdvdPrice: (produtos, pmc, grupo, marketplace08) => {
    let preco = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < produtos.length; i++) {
      if (preco > Number(produtos[i].PRECO) && Number(produtos[i].PRECO) > 0) {
        preco = Number(produtos[i].PRECO);
      }
    }

    if (preco >= Number.MAX_SAFE_INTEGER) {
      preco = pmc;
    }

    // if (marketplace08 === 'S') {
    //   preco = preco * 1.1;
    // } else {
    if (grupo === 80) preco /= 0.8;
    else if (grupo === 81) preco /= 0.6;
    else if (grupo === 82) preco /= 0.7;
    else if (grupo === 83) preco /= 0.75;
    else if (grupo === 84) preco /= 0.7;
    else if (grupo === 85) preco /= 0.93;
    else preco /= 0.7;
    // }

    if ([19, 10, 26, 28, 80, 71, 81, 20, 2, 25, 24, 15, 47, 5, 6, 27, 12, 82].includes(grupo)) {
      if (preco > pmc) {
        preco = pmc;
      }
    }

    return preco;
  },

  getSelo: (produ) => {
    const retorno = { status: false, msg: '' };

    if (produ.VDVD === 'S') {
      return retorno.msg;
    }

    let menorPreco = Number.MAX_SAFE_INTEGER;

    if (menorPreco > produ.PREPRO && produ.PREPRO > 0 && produ.PREPRO < produ.PRECO) {
      menorPreco = produ.PREPRO;
    }

    let auxPreco = produ.PRECO - produ.PRECO * (produ.KITDSC / 100);

    if (menorPreco > auxPreco && Number(produ.KITQTD) > Number(0) && Number(produ.KITDSC) > Number(0)) {
      menorPreco = auxPreco;
    }

    if (produ.QTDPROQT > 0 && (produ.VLRPROQT > 0 || produ.DESCPROQT > 0)) {
      if (menorPreco > produ.VLRPROQT && produ.VLRPROQT > 0) {
        menorPreco = produ.VLRPROQT;
      } else {
        auxPreco = produ.PRECO - produ.PRECO * (produ.DESCPROQT / 100);

        if (menorPreco > auxPreco) {
          menorPreco = produ.PRECO - produ.PRECO * (produ.DESCPROQT / 100);
        }
      }
    }

    if (
      menorPreco > produ.PRECOCLUBE &&
      produ.PRECOCLUBE &&
      produ.PRECOCLUBE > 0 &&
      moment(produ.INIPRECOCLUBE).format('YYYYMMDD') <= moment().utcOffset('-03:00').format('YYYYMMDD') &&
      moment(produ.FIMPRECOCLUBE).format('YYYYMMDD') >= moment().utcOffset('-03:00').format('YYYYMMDD') &&
      (produ.PREPRO <= 0 || produ.PREPRO > produ.PRECOCLUBE) &&
      produ.CDTIPO !== 5
    ) {
      menorPreco = produ.PRECOCLUBE;
    }

    if (
      menorPreco > produ.PRECOCLUBE &&
      produ.PRECOCLUBE &&
      produ.PRECOCLUBE > 0 &&
      moment(produ.INIPRECOCLUBE).format('YYYYMMDD') <= moment().utcOffset('-03:00').format('YYYYMMDD') &&
      moment(produ.FIMPRECOCLUBE).format('YYYYMMDD') >= moment().utcOffset('-03:00').format('YYYYMMDD') &&
      (produ.PREPRO <= 0 || produ.PREPRO > produ.PRECOCLUBE) &&
      produ.CDTIPO === 5
    ) {
      menorPreco = produ.PRECOCLUBE;
    }

    let desconto = 0;
    let auxDesconto = 0;

    if (menorPreco < produ.PRECO) {
      auxDesconto = Number(100) - (menorPreco * 100) / produ.PRECO;
    }

    if (auxDesconto > 0 && auxDesconto < 100) {
      desconto = Math.trunc(auxDesconto);
    }

    // // SELO DE % DE DESCONTO
    // if (desconto > 0) {
    //   return view.render('selo-desconto-percentual', {desconto: desconto});
    // }

    // // SELO DE CASHBACK
    // if (temCashback) {
    //   // em desenvolvimento
    // }

    // SELO DE MAIS POR MENOS QTDPROQT
    let valorFinalProQt = 0;

    if (produ.QTDPROQT > 0 && (produ.VLRPROQT > 0 || produ.DESCPROQT > 0)) {
      if (produ.DESCPROQT > 0) {
        valorFinalProQt = Number(produ.PRECO - produ.PRECO * (produ.DESCPROQT / 100)).toFixed(2);
      } else {
        valorFinalProQt = produ.VLRPROQT;
      }

      retorno.status = true;
      retorno.msg = `https://d2rll0wmre60ud.cloudfront.net/selo-kit.svg?ver=1.0&qtd=${produ.QTDPROQT}&preco=${valorFinalProQt}`;
    }

    // SELO DE KIT MEDICAMENTO
    if (
      menorPreco === produ.PRECO - produ.PRECO * (produ.KITDSC / 100) &&
      Number(produ.KITQTD) > Number(0) &&
      Number(produ.KITDSC) > Number(0)
    ) {
      retorno.status = true;
      retorno.msg = `https://d2rll0wmre60ud.cloudfront.net/selo-leve-mais-por-menos.svg?qtd=${produ.KITQTD}&preco=${menorPreco}`;
    }

    // SELO DE MARKETPLACE10
    if (produ.MARKETPLACE10 === 'S') {
      retorno.status = false;
      retorno.msg = ``;
    }

    // SELO DE MARKETPLACE08
    if (produ.MARKETPLACE08 === 'S') {
      retorno.status = false;
      retorno.msg = ``;
    }

    // SELO DE CLUBE CALLFARMA
    if (
      menorPreco === produ.PRECOCLUBE &&
      produ.PRECOCLUBE &&
      produ.PRECOCLUBE > 0 &&
      moment(produ.INIPRECOCLUBE).format('YYYYMMDD') <= moment().utcOffset('-03:00').format('YYYYMMDD') &&
      moment(produ.FIMPRECOCLUBE).format('YYYYMMDD') >= moment().utcOffset('-03:00').format('YYYYMMDD') &&
      (produ.PREPRO <= 0 || produ.PREPRO > produ.PRECOCLUBE) &&
      produ.CDTIPO !== 5
    ) {
      retorno.status = true;
      retorno.msg = `https://d2rll0wmre60ud.cloudfront.net/selo-clube.svg?qtd=1&preco=${menorPreco}`;
    }

    // SELO DE DERMO CLUBE CALLFARMA
    if (
      menorPreco === produ.PRECOCLUBE &&
      produ.PRECOCLUBE &&
      produ.PRECOCLUBE > 0 &&
      moment(produ.INIPRECOCLUBE).format('YYYYMMDD') <= moment().utcOffset('-03:00').format('YYYYMMDD') &&
      moment(produ.FIMPRECOCLUBE).format('YYYYMMDD') >= moment().utcOffset('-03:00').format('YYYYMMDD') &&
      (produ.PREPRO <= 0 || produ.PREPRO > produ.PRECOCLUBE) &&
      produ.CDTIPO === 5
    ) {
      retorno.status = true;
      retorno.msg = `https://d2rll0wmre60ud.cloudfront.net/selo-dermoclube.svg?qtd=1&preco=${menorPreco}`;
    }

    return retorno.msg;
  },

  toSeoUrl: (url) => {
    return url
      .toString() // Convert to string
      .normalize('NFD') // Change diacritics
      .replace(/-/g, '_') // Change - to _
      .replace(/[\u0300-\u036f]/g, '') // Remove illegal characters
      .replace(/\s+/g, '-') // Change whitespace to dashes
      .toLowerCase() // Change to lowercase
      .replace(/&/g, '-and-') // Replace ampersand
      .replace(/[^a-z0-9\-_]/g, '-') // Remove anything that is not a letter, number or dash
      .replace(/-+/g, '-') // Remove duplicate dashes
      .replace(/^-*/, '') // Remove starting dashes
      .replace(/-*$/, ''); // Remove trailing dashes
  },

  getTotalBruto: (produtos: any) => {
    const self = this;

    let total = 0;

    for (let i = 0; i < produtos.length; i++) {
      total += produtos[i].qtd * produtos[i].pmc;
    }

    return total;
  },

  getTotal: (produtos: any) => {
    const self = this;

    let total = 0;

    for (let i = 0; i < produtos.length; i++) {
      let precoFinal = produtos[i].pmc;

      if (produtos[i].preco > 0 && produtos[i].preco < produtos[i].pmc) {
        precoFinal = produtos[i].preco;
      }

      total += produtos[i].qtd * precoFinal;
    }

    return total;
  },

  getIni: () => {
    const remote = require('@electron/remote');
    const { app } = require('@electron/remote');
    const path = require('path');
    // const { DBFFile } = remote.require('dbffile');
    const ini = remote.require('ini');
    const fs = remote.require('fs');

    const iniLocation = path.resolve(app.getPath('userData'), require('../../../package.json').iniName);

    console.log(iniLocation);

    const iniStruct = {
      Parametros: {
        autor: 'Grupo TecWorks',
      },
    };

    if (!fs.existsSync(iniLocation)) {
      fs.writeFileSync(iniLocation, ini.stringify(iniStruct));
    }

    let adminh = ini.parse(fs.readFileSync(iniLocation, 'utf-8'));

    if (typeof adminh.Parametros.VERSAO === 'undefined' || !adminh.Parametros.VERSAO) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify(
          {
            ...adminh.Parametros,
            VERSAO: '1.0.0',
          },
          { section: 'Parametros' }
        ) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.VERSAO = '1.0.0';
    }

    if (adminh.Parametros.VERSAO !== require('../../../package.json').build.buildVersion) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify(
          {
            ...adminh.Parametros,
            VERSAO: require('../../../package.json').build.buildVersion,
          },
          { section: 'Parametros' }
        ) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.VERSAO = require('../../../package.json').build.buildVersion;
    }

    if (typeof adminh.Parametros.API_V2_URL === 'undefined' || !adminh.Parametros.API_V2_URL) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify(
          {
            ...adminh.Parametros,
            API_V2_URL: 'https://apiv2.callfarma.com.br:8443',
          },
          { section: 'Parametros' }
        ) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.API_V2_URL = 'https://apiv2.callfarma.com.br:8443';
    }

    if (typeof adminh.Parametros.API_V2_TOKEN === 'undefined' || !adminh.Parametros.API_V2_TOKEN) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify(
          {
            ...adminh.Parametros,
            API_V2_TOKEN:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImlhdCI6MTU5NjQ3NDg1Nn0.2K1SZ1d5ZYkvqZSIe8hbWa5LrSC7TB64F_XLKJ9qTow',
          },
          { section: 'Parametros' }
        ) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.API_V2_TOKEN =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImlhdCI6MTU5NjQ3NDg1Nn0.2K1SZ1d5ZYkvqZSIe8hbWa5LrSC7TB64F_XLKJ9qTow';
    }

    if (typeof adminh.Parametros.PREVENDA_PASTA === 'undefined' || !adminh.Parametros.PREVENDA_PASTA) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, PREVENDA_PASTA: 'C:/prevenda' }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.PREVENDA_PASTA = 'C:/prevenda';
    }

    if (typeof adminh.Parametros.TEF === 'undefined' || !adminh.Parametros.TEF) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, TEF: 'C:/tef' }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.TEF = 'C:/tef';
    }

    if (typeof adminh.Parametros.ULTNFCE === 'undefined' || !adminh.Parametros.ULTNFCE) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, ULTNFCE: 0 }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.ULTNFCE = 0;
    }

    if (typeof adminh.Parametros.CDCAIXA === 'undefined' || !adminh.Parametros.CDCAIXA) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, CDCAIXA: 0 }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.CDCAIXA = 0;
    }

    if (typeof adminh.Parametros.CDFIL === 'undefined' || !adminh.Parametros.CDFIL) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, CDFIL: 0 }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.CDFIL = 0;
    }

    if (
      typeof adminh.Parametros.LOGFILE === 'undefined' ||
      !adminh.Parametros.LOGFILE ||
      moment(adminh.Parametros.LOGFILE, 'YYYY-MM-DD').format('YYYYMMDD') < moment().format('YYYYMMDD')
    ) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify(
          {
            ...adminh.Parametros,
            LOGFILE: path.resolve(app.getPath('userData'), `${moment().format('YYYY-MM-DD')}.log`),
          },
          { section: 'Parametros' }
        ) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.LOGFILE = path.resolve(app.getPath('userData'), `${moment().format('YYYY-MM-DD')}.log`);
    }

    if (typeof adminh.Parametros.PASTANFCE === 'undefined' || !adminh.Parametros.PASTANFCE) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, PASTANFCE: 'C:\\RetornoNFCe\\' }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.PASTANFCE = 'C:\\RetornoNFCe\\';
    }

    if (typeof adminh.Parametros.IMPRESSORAPORTA === 'undefined' || !adminh.Parametros.IMPRESSORAPORTA) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, IMPRESSORAPORTA: 'COM4' }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.IMPRESSORAPORTA = 'COM4';
    }

    if (typeof adminh.Parametros.IMPRESSORA === 'undefined' || !adminh.Parametros.IMPRESSORA) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, IMPRESSORA: 'Daruma' }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.IMPRESSORA = 'Daruma';
    }

    if (typeof adminh.Parametros.ULTVENDA === 'undefined' || !adminh.Parametros.ULTVENDA) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, ULTVENDA: 1 }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.ULTVENDA = 1;
    }

    if (typeof adminh.Parametros.ULTFTP === 'undefined' || !adminh.Parametros.ULTFTP) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify(
          {
            ...adminh.Parametros,
            ULTFTP: moment().subtract(3, 'day').format('YYYY-MM-DD'),
          },
          { section: 'Parametros' }
        ) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.ULTFTP = moment().subtract(3, 'day').format('YYYY-MM-DD');
    }

    if (typeof adminh.Parametros.FTPENDE === 'undefined' || !adminh.Parametros.FTPENDE) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, FTPENDE: 'cb.dnsalias.com' }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.FTPENDE = 'cb.dnsalias.com';
    }

    if (typeof adminh.Parametros.PARCELAMIN === 'undefined' || !adminh.Parametros.PARCELAMIN) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, PARCELAMIN: 20 }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.PARCELAMIN = 20;
    }

    if (typeof adminh.Parametros.FGAUDITORIA === 'undefined' || !adminh.Parametros.FGAUDITORIA) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, FGAUDITORIA: 'Sim' }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.FGAUDITORIA = 'Sim';
    }

    if (typeof adminh.Parametros.FGDEV === 'undefined' || !adminh.Parametros.FGDEV) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, FGDEV: 'Nao' }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.FGDEV = 'Nao';
    }

    if (typeof adminh.Parametros.FGCONTINGENCIA === 'undefined' || !adminh.Parametros.FGCONTINGENCIA) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, FGCONTINGENCIA: 'Nao' }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.FGCONTINGENCIA = 'Nao';
    }

    if (typeof adminh.Parametros.PREVENDA_CUPOM === 'undefined' || !adminh.Parametros.PREVENDA_CUPOM) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, PREVENDA_CUPOM: __dirname }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.PREVENDA_CUPOM = __dirname;
    }

    if (typeof adminh.Parametros.PREVENDA_CUPOM_2 === 'undefined' || !adminh.Parametros.PREVENDA_CUPOM_2) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, PREVENDA_CUPOM_2: __dirname }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.PREVENDA_CUPOM_2 = __dirname;
    }

    if (typeof adminh.Parametros.FGFEIRA === 'undefined' || !adminh.Parametros.FGFEIRA) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros, FGFEIRA: __dirname }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.Parametros.FGFEIRA = 'Não';
    }

    if (typeof adminh.TrnCentre === 'undefined' || !adminh.TrnCentre) {
      fs.appendFileSync(iniLocation, '\n[TrnCentre]\nversao=1.0.0\n');
      adminh = ini.parse(fs.readFileSync(iniLocation, 'utf-8'));
    }

    if (typeof adminh.TrnCentre.Sequencia === 'undefined' || !adminh.TrnCentre.Sequencia) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, Sequencia: 0 }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.TrnCentre.Sequencia = 0;
    }

    if (typeof adminh.TrnCentre.NSU === 'undefined' || !adminh.TrnCentre.NSU) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre, NSU: '' }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier }, { section: 'Trier' })
      );
      adminh.TrnCentre.NSU = '';
    }

    if (typeof adminh.Trier === 'undefined' || !adminh.Trier) {
      fs.appendFileSync(iniLocation, '\n[Trier]\nURL=\nToken=\n');
      adminh = ini.parse(fs.readFileSync(iniLocation, 'utf-8'));
    }

    if (typeof adminh.Trier.URL === 'undefined' || !adminh.Trier.URL) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier, URL: '' }, { section: 'Trier' })
      );
      adminh.Trier.URL = '';
    }

    if (typeof adminh.Trier.Token === 'undefined' || !adminh.Trier.Token) {
      fs.writeFileSync(
        iniLocation,
        ini.stringify({ ...adminh.Parametros }, { section: 'Parametros' }) +
          ini.stringify({ ...adminh.TrnCentre }, { section: 'TrnCentre' }) +
          ini.stringify({ ...adminh.Trier, Token: '' }, { section: 'Trier' })
      );
      adminh.Trier.Token = '';
    }

    adminh = ini.parse(fs.readFileSync(iniLocation, 'utf-8'));

    return adminh;
  },

  putIni: (iniFile) => {
    const remote = require('@electron/remote');
    const { app } = require('@electron/remote');
    const path = require('path');
    const ini = remote.require('ini');
    const fs = remote.require('fs');

    const iniLocation = path.resolve(app.getPath('userData'), require('../../../package.json').iniName);

    fs.writeFileSync(iniLocation, ini.stringify(iniFile));

    return iniFile;
  },

  putLog: (texto) => {
    const remote = require('@electron/remote');
    const { app } = require('@electron/remote');
    const path = require('path');
    const ini = remote.require('ini');
    const fs = remote.require('fs');

    const iniLocation = path.resolve(app.getPath('userData'), require('../../../package.json').iniName);

    const adminh = ini.parse(fs.readFileSync(iniLocation, 'utf-8'));

    if (!texto || !adminh || !adminh.Parametros || !adminh.Parametros.LOGFILE) {
      return false;
    }

    fs.appendFileSync(adminh.Parametros.LOGFILE, `${moment().format('HH:mm:ss')} | ${texto}\n`);

    // fetch(`${adminh.Parametros.API_V2_URL}/monitor-caixa`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Accept: 'application/json',
    //     Authorization: `Bearer ${adminh.Parametros.API_V2_TOKEN}`,
    //   },
    //   redirect: 'follow', // manual, *follow, error
    //   body: JSON.stringify({
    //     cdfil: adminh.Parametros.CDFIL,
    //     cdcaixa: adminh.Parametros.CDCAIXA,
    //     status_titulo: String(texto).toLowerCase().indexOf('iniciando aplicação') > -1 ? 'ABERTO' : 'LOG',
    //     status_msg: texto,
    //   }),
    // });

    return true;
  },

  getLoadingMsg: () => {
    const remote = require('@electron/remote');
    const { app } = require('@electron/remote');
    const path = require('path');
    const fs = remote.require('fs');

    const iniLocation = path.resolve(app.getPath('userData'), 'loading_msg.txt');

    const result = fs.readFileSync(iniLocation, 'utf-8');

    return result;
  },

  putLoadingMsg: (texto) => {
    const remote = require('@electron/remote');
    const { app } = require('@electron/remote');
    const path = require('path');
    const fs = remote.require('fs');

    const iniLocation = path.resolve(app.getPath('userData'), 'loading_msg.txt');

    fs.writeFileSync(iniLocation, `${moment().format('DD/MM/YYYY HH:mm:ss')} | ${texto}\n`);

    return true;
  },

  getDb: async () => {
    // addRxPlugin(RxDBQueryBuilderPlugin);
    // addRxPlugin(RxDBUpdatePlugin);

    // Diversos.putLog(`- Abrindo banco de dados SQLite`);

    // const db = await createRxDatabase({
    //   name: 'callfarmadb',
    //   storage: getRxStorageIpcRenderer({
    //     key: 'callfarmadb',
    //     statics: getRxStorageMemory().statics,
    //     ipcRenderer,
    //   }),
    // });

    // Diversos.putLog(`- Verificando tabela de Produtos`);

    // const ProdutosSchema = {
    //   title: 'Produtos',
    //   version: 0,
    //   description: 'Tabela de Produtos',
    //   primaryKey: 'id',
    //   type: 'object',
    //   properties: {
    //     id: {
    //       type: 'string',
    //       maxLength: 100000,
    //     },
    //     codint: {
    //       type: 'string',
    //       maxLength: 20,
    //     },
    //     codigo: {
    //       type: 'string',
    //       maxLength: 20,
    //     },
    //     nome: {
    //       type: 'string',
    //       maxLength: 200,
    //     },
    //     preco: {
    //       type: 'number',
    //     },
    //     prepro: {
    //       type: 'number',
    //     },
    //     icms: {
    //       type: 'number',
    //     },
    //     tipogru: {
    //       type: 'number',
    //     },
    //     ncm: {
    //       type: 'string',
    //       maxLength: 20,
    //     },
    //     tipo: {
    //       type: 'string',
    //       maxLength: 1,
    //     },
    //   },
    //   required: ['id', 'codint', 'nome'],
    //   indexes: ['codigo', 'codint', 'nome'],
    // };

    // await db.addCollections({
    //   produtos: {
    //     schema: ProdutosSchema,
    //   },
    // });

    return null;
  },

  getPlatform: () => {
    switch (process?.platform) {
      case 'darwin':
        return 'macos';
      case 'win32':
      case 'win64':
        return 'windows';
      case 'linux':
        return 'linux';
      default:
        return 'desconhecido';
    }
    // return "macos";
  },

  hasOnlyNumbers: (str) => /^\d+$/.test(str),
};
