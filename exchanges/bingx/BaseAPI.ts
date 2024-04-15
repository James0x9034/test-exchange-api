import {
  ApiConfig
} from '../../libs/RequestConfig';
import {
  BASE_API_URL,
  EXCHANGE_EXCEPTION,
  SUCCESS_CODE
} from './Consts';
import * as querystring from 'querystring';
import axios from 'axios';
import {
  handleHttpError,
  throwMatchedException
} from '../../libs/Utils';
import {
  cloneDeep,
  isEmpty
} from 'lodash';
import * as JSONBigint from 'json-bigint';
import * as CryptoJS from 'crypto-js';

class BaseAPI {
  private readonly apiConfig: ApiConfig;

  constructor(apiConfig: ApiConfig) {
    this.apiConfig = apiConfig;
  }

  async makeRequest(
    method: string,
    path: string,
    params = {},
    isPublic = false,
  ): Promise<any> {
    const requestParams = this._getRequestParams(params, isPublic);
    const url = `${BASE_API_URL}${path}?${querystring.stringify(requestParams)}`;
    const response = await axios.request({
      url,
      method,
      headers: {
        'X-BX-APIKEY': this.apiConfig.apiKey,
      },
      transformResponse: (resp) => {
        return resp;
      }
    });
    const data = response.data;
    const jsonData = JSONBigint({ storeAsString: true }).parse(data);

    if (jsonData.code && jsonData.code !== SUCCESS_CODE) {
      this._handleError(jsonData);
    }

    return jsonData.data || jsonData;
  }

  private _handleError(error: any): void {
    const { code, msg } = error;

    if (code) {
      throwMatchedException(EXCHANGE_EXCEPTION, `${code}`, msg);
    }

    handleHttpError(error);
  }

  private _getRequestParams(params, isPublic) {
    if (isPublic) {
      return params;
    }

    const requestParams = cloneDeep(params);

    requestParams.timestamp = Date.now();
    requestParams.recvWindow = 60000;

    if (!isEmpty(this.apiConfig.apiKey) && !isEmpty(this.apiConfig.apiSecret)) {
      const paramString = querystring.stringify(requestParams);
      requestParams.signature = CryptoJS.enc.Hex.stringify(CryptoJS.HmacSHA256(paramString, this.apiConfig.apiSecret));
    }

    return requestParams;
  }
}

export default BaseAPI;