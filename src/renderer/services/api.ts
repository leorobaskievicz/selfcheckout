import axios from 'axios';

const apiAxio = axios.create({
  baseURL: 'https://api.callfarma.com.br',
});

export default class Api {
  private API_KEY: string =
    'fGtaUSg0Q2J8MC9XU2UxNSo4JnJ6c2JiT2hZe2JXaWMyNFVXdlZ7X3F2OG9iNDxYbG1LR3VeK0A8JD02UDtp';

  private password: string = 'YWRtOmxlb0AxOTkz';

  public async get(url: string) {
    try {
      return apiAxio.get(`${url}`, {
        headers: {
          'X-Auth-token': this.API_KEY,
          Authorization: ` Basic ${this.password}`,
        },
      });
    } catch (e) {
      console.error('api (ERROR): ', e);
    }

    return true;
  }

  public async post(url: string, body: any = null) {
    try {
      const bodyEnd = {
        ...body,
        HTTP_X_AUTH_TOKEN:
          'fGtaUSg0Q2J8MC9XU2UxNSo4JnJ6c2JiT2hZe2JXaWMyNFVXdlZ7X3F2OG9iNDxYbG1LR3VeK0A8JD02UDtp',
      };

      return apiAxio.post(`${url}`, bodyEnd, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Auth-token': this.API_KEY,
          Authorization: ` Basic ${this.password}`,
        },
      });
    } catch (e) {
      console.error('api (ERROR): ', e);
    }

    return true;
  }
}
