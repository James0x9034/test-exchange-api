import axios, { type AxiosRequestConfig } from 'axios';
import * as uuid from 'uuid';
import * as querystring from 'querystring';
import { isEmpty } from 'lodash';
import { type ApiConfig } from '../../libs/RequestConfig';
import { handleHttpError, throwMatchedException } from '../../libs/Utils';
import { EXCHANGE_EXCEPTION } from './Consts';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

const API_URL = 'https://api.upbit.com';

class BaseAPI {
  private readonly apiConfig: ApiConfig;

  constructor (apiConfig: ApiConfig = {}) {
    this.apiConfig = apiConfig;
  }

  protected async makeRequest (method: string, path: string, params = {}) {
    const options: AxiosRequestConfig = {
      url: `${API_URL}${path}?${querystring.stringify(params)}`,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (method != 'GET') {
      options.data = params;
    }

    if (this.apiConfig.apiKey) {
      const sign = this.getSign(params);

      options.headers = {
        Authorization: `Bearer ${sign}`
      };
    }

    try {
      const response = await axios.request(options);

      return response.data;
    } catch (error) {
      const errorResponse = error.response;
      if (errorResponse?.data?.error) {
        const { message, name } = error.response.data.error;

        throwMatchedException(EXCHANGE_EXCEPTION, message, message, true);
        throwMatchedException(EXCHANGE_EXCEPTION, name, name);
      }

      handleHttpError(error);
    }
  }

  private getSign (params: any) {
    if (!this.apiConfig.apiKey) {
      return {};
    }

    const payload: any = {
      access_key: this.apiConfig.apiKey,
      nonce: uuid.v4()
    };

    if (!isEmpty(params)) {
      const query = querystring.stringify(params);
      const hash = crypto.createHash('sha512');
      const queryHash = hash.update(query, 'utf8').digest('hex');

      payload.query_hash = queryHash;
      payload.query_hash_alg = 'SHA512';
    }

    return jwt.sign(payload, this.apiConfig.apiSecret);
  }
}

export default BaseAPI;
