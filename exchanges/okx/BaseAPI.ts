import { isArray, isEmpty } from 'lodash';
import axios, { AxiosRequestConfig, Method } from 'axios';
import {
  EXCHANGE_EXCEPTION,
  REST_PRODUCTION_TRADING_URL,
  ResponseCode
} from './Consts';
import {
  handleHttpError,
  serializeParams,
  throwMatchedException
} from '../../libs/Utils';
import { ExchangeError } from '../../libs/Error';
import * as CryptoJS from 'crypto-js';
import { ApiConfig } from '../../libs/RequestConfig';

class BaseAPI {
  private apiConfig: ApiConfig;

  constructor(apiConfig: ApiConfig = {}) {
    this.apiConfig = apiConfig;
  }

  protected async makeRequest(
    method: Method,
    path: string,
    params = {}
  ): Promise<any> {
    const timestamp = new Date().toISOString();
    const headers: any = {
      'Content-Type': 'application/json'
    };
    if (!isEmpty(this.apiConfig)) {
      headers['OK-ACCESS-KEY'] = this.apiConfig.apiKey;
      headers['OK-ACCESS-SIGN'] = this.generateSign(
        method,
        path,
        timestamp,
        params
      );
      headers['OK-ACCESS-TIMESTAMP'] = timestamp;
      headers['OK-ACCESS-PASSPHRASE'] = this.apiConfig.passphrase;
    }

    const requestOptions: AxiosRequestConfig = {
      url: REST_PRODUCTION_TRADING_URL + path,
      method,
      headers
    };

    if (method === 'GET') {
      requestOptions.params = params;
    } else {
      requestOptions.data = params;
    }
    
    try {
      const response = await axios.request(requestOptions);
      const { code, data, msg } = response.data;

      if (
        ![ResponseCode.OK, ResponseCode.OPERATION_PARTIALLY_SUCCEEDED].includes(
          code
        )
      ) {
        const errorResponse = isArray(data) && data.length == 1 ? data[0] : {};
        const errorCode = errorResponse.sCode || code;
        const errorMessage = errorResponse.sMsg || msg;

        throwMatchedException(EXCHANGE_EXCEPTION, errorCode, errorMessage);
      }

      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any) {
    if (error.response) {
      if (error.response.data) {
        const { msg, code } = error.response.data;

        throwMatchedException(EXCHANGE_EXCEPTION, code, msg);

        throw new ExchangeError(code);
      }

      handleHttpError(error);
    }

    throw error;
  }

  private generateSign(
    method: Method,
    path: string,
    timestamp: string,
    params = {}
  ): string {
    const signStr = `${timestamp}${method}${path}${serializeParams(
      params,
      method
    )}`;

    if (!this.apiConfig.apiSecret) return '';

    const hmacHex = CryptoJS.HmacSHA256(signStr, this.apiConfig.apiSecret);

    return CryptoJS.enc.Base64.stringify(hmacHex);
  }
}

export default BaseAPI;
