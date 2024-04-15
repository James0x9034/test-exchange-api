import axios, { type AxiosInstance, type Method } from 'axios';

import { encryptSignature, parseJsonString } from './Utils';
import { type ApiConfig } from '../../libs/RequestConfig';
import { handleHttpError, throwMatchedException } from '../../libs/Utils';
import { BITGET_BROKER, EXCHANGE_EXCEPTION, SUCCESS_CODE } from './Consts';

const BITGET_API_URL = 'https://api.bitget.com';
class BaseAPI {
  protected axiosInstance: AxiosInstance;
  protected signer: any;

  constructor({ apiKey, apiSecret, passphrase }: ApiConfig) {
    this.axiosInstance = axios.create({
      baseURL: BITGET_API_URL
    });

    this.axiosInstance.interceptors.request.use((data) => {
      if (data.data) {
        data.data = parseJsonString(data.data);
      }

      return data;
    });

    this.axiosInstance.interceptors.response.use(
      (data) => {
        const response = data.data;

        if ('code' in response && response.code !== SUCCESS_CODE) {
          throwMatchedException(
            EXCHANGE_EXCEPTION,
            response.code,
            response.msg
          );
        }

        if (response.data) {
          return response.data;
        }

        return response;
      },
      (error) => {
        if (error.response?.data) {
          const { code, msg } = error.response.data;

          throwMatchedException(EXCHANGE_EXCEPTION, code, msg);
        }

        handleHttpError(error);
      }
    );

    this.signer = this.initSigner(apiKey, apiSecret, passphrase);
  }

  private initSigner(apiKey: string, apiSecret: string, passphrase: string) {
    return (
      method: Method,
      url: string,
      params: any = null,
      locale = 'en-US'
    ) => {
      const timestamp = Date.now();
      const signString = encryptSignature(
        method,
        url,
        params,
        timestamp,
        apiSecret
      );

      return {
        'ACCESS-SIGN': signString,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-KEY': apiKey,
        'ACCESS-PASSPHRASE': passphrase,
        'Content-Type': 'application/json',
        'X-CHANNEL-API-CODE': BITGET_BROKER,
        Cookie: 'locale=' + locale,
        locale
      };
    };
  }
}
export default BaseAPI;
