import * as querystring from 'querystring';
import axios, { type AxiosRequestConfig } from 'axios';
import { isEmpty } from 'lodash';
import {
  encodeHmac,
  handleHttpError,
  throwMatchedException
} from '../../libs/Utils';
import { type ApiConfig } from '../../libs/RequestConfig';
import { BYBIT_BROKER, EXCHANGE_EXCEPTION, RET_CODE_OK } from './Consts';

const BYBIT_API_URL = 'https://api.bybit.com';
class BaseAPI {
  private readonly apiConfig: ApiConfig;

  constructor (apiConfig: ApiConfig = {}) {
    this.apiConfig = apiConfig;
  }

  async makeRequest (method: string, path: string, params = {}): Promise<any> {
    const currentTimestamp = Date.now();
    const recvWindow = 20000;
    const headers: any = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-BAPI-TIMESTAMP': currentTimestamp,
      'X-BAPI-RECV-WINDOW': recvWindow,
      'Referer': BYBIT_BROKER
    };

    if (this.apiConfig.apiKey) {
      headers['X-BAPI-API-KEY'] = this.apiConfig.apiKey;
      headers['X-BAPI-SIGN'] = this.generateSign(
        method,
        currentTimestamp,
        recvWindow,
        params
      );
    }

    const url = BYBIT_API_URL + path;
    const requestOptions: AxiosRequestConfig = {
      url,
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
      const responseData = response.data;
      const { retCode, result, retExtInfo, retMsg } = responseData;

      if (retCode !== RET_CODE_OK) {
        throwMatchedException(EXCHANGE_EXCEPTION, `${retCode}`, retMsg);
      }

      if (!isEmpty(retExtInfo)) {
        return responseData;
      }

      return result;
    } catch (error) {
      if (error.response) {
        handleHttpError(error);
      }

      throw error;
    }
  }

  private generateSign (
    method: string,
    timestamp: number,
    recvWindow: number,
    params = {}
  ): string {
    const parsedParams =
      method === 'GET' ? querystring.stringify(params) : JSON.stringify(params);
    const signStr = `${timestamp}${this.apiConfig.apiKey}${recvWindow}${parsedParams}`;

    if (!this.apiConfig.apiSecret) return '';

    return encodeHmac(signStr, this.apiConfig.apiSecret);
  }
}

export default BaseAPI;
