import axios from 'axios';
import { cloneDeep, isEmpty } from 'lodash';
import * as querystring from 'querystring';

import { type ApiConfig } from '../../libs/RequestConfig';
import {
  encodeHmac,
  handleHttpError,
  throwMatchedException
} from '../../libs/Utils';
import { EXCHANGE_EXCEPTION } from './Consts';

class BaseAPI {
  private readonly baseUrl: string;
  private readonly apiConfig: ApiConfig;

  constructor (baseUrl: string, apiConfig: ApiConfig = {}) {
    this.baseUrl = baseUrl;
    this.apiConfig = apiConfig;
  }

  protected async makeRequest (
    method: string,
    path: string,
    params = {},
    isPublic = false
  ): Promise<any> {
    const requestParams = this.getRequestParams(params, isPublic);
    const url = `${this.baseUrl}${path}?${querystring.stringify(
      requestParams
    )}`;
    
    try {
      const response = await axios.request({
        url,
        method,
        headers: {
          'X-MBX-APIKEY': this.apiConfig.apiKey
        }
      });

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

private handleError(error: any): void {
  const { code, msg } = error.response?.data ?? {};

  if (msg) {
    throwMatchedException(EXCHANGE_EXCEPTION, msg, msg, true);
  } 
  
  if (code) {
    throwMatchedException(EXCHANGE_EXCEPTION, `${code}`, msg);
  }
  
  handleHttpError(error);
}

  private getRequestParams (params: any, isPublic: boolean = false) {
    if (isPublic) {
      return params;
    }

    const requestParams = cloneDeep(params);
    
    requestParams.timestamp = Date.now();
    requestParams.recvWindow = 60000;

    if (this.apiConfig.apiSecret && !isEmpty(this.apiConfig)) {
      requestParams.signature = encodeHmac(
        querystring.stringify(requestParams),
        this.apiConfig.apiSecret
      );
    }

    return requestParams;
  }
}

export default BaseAPI;
