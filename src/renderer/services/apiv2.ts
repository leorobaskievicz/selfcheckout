import axios from 'axios';

const apiAxio = axios.create({
  baseURL: 'https://apiv2.callfarma.com.br:8443',
  // baseURL: 'http://127.0.0.1:3333',
});

export default class ApiV2 {
  public async get(url: string, token: any = null) {
    try {
      const headers = {};
      headers.Accept = 'application/json';
      headers.Authorization = ` Bearer ${token}`;
      headers['X-Auth-Code'] = '1';

      return apiAxio.get(url, { headers });
    } catch (e) {
      console.error('api (ERROR): ', e);
    }
  }

  public async post(url: string, body: any = null, token: any = null) {
    try {
      const headers = {};
      headers['Content-Type'] = 'application/json';
      headers.Accept = 'application/json';
      headers['X-Auth-Code'] = '1';

      headers.Authorization = ` Bearer ${token}`;

      const bodyEnd = {
        ...body,
        HTTP_X_AUTH_TOKEN:
          'fGtaUSg0Q2J8MC9XU2UxNSo4JnJ6c2JiT2hZe2JXaWMyNFVXdlZ7X3F2OG9iNDxYbG1LR3VeK0A8JD02UDtp',
      };

      return apiAxio.post(url, bodyEnd, { headers });
    } catch (e) {
      console.error('api (ERROR): ', e);
    }
  }

  public async postFormData(url: string, body: any = null, token: any = null) {
    try {
      const headers = {};
      headers['Content-Type'] = 'multipart/form-data';
      headers.Accept = 'application/json';
      headers['X-Auth-Code'] = '1';

      headers.Authorization = ` Bearer ${token}`;

      return apiAxio.post(url, body, { headers });
    } catch (e) {
      console.error('api (ERROR): ', e);
    }
  }

  public async put(url: string, body: any = null, token: any = null) {
    try {
      const headers = {};
      headers['Content-Type'] = 'application/json';
      headers.Accept = 'application/json';
      headers['X-Auth-Code'] = '1';

      headers.Authorization = ` Bearer ${token}`;

      const bodyEnd = {
        ...body,
        HTTP_X_AUTH_TOKEN:
          'fGtaUSg0Q2J8MC9XU2UxNSo4JnJ6c2JiT2hZe2JXaWMyNFVXdlZ7X3F2OG9iNDxYbG1LR3VeK0A8JD02UDtp',
      };

      return apiAxio.put(url, bodyEnd, { headers });
    } catch (e) {
      console.error('api (ERROR): ', e);
    }
  }

  public async delete(url: string, token: any = null) {
    try {
      const headers = {};
      headers.Accept = 'application/json';
      headers['X-Auth-Code'] = '1';

      headers.Authorization = ` Bearer ${token}`;

      return apiAxio.delete(url, { headers });
    } catch (e) {
      console.error('api (ERROR): ', e);
    }
  }
}
