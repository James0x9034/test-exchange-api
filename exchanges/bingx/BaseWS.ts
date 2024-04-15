import {
  ApiConfig
} from '../../libs/RequestConfig';
import {
  isEmpty
} from 'lodash';
import {
  EventEmitter,
  WebSocket
} from 'ws';
import {
  BASE_API_URL,
  PING_INTERVAL_TIME,
  PING_LISTEN_KEY_INTERVAL_TIME,
  PONG_TIMEOUT_TIME,
  RESTART_SOCKET_DELAY_TIME
} from './Consts';
import * as querystring from 'querystring';
import axios, {
  Method
} from 'axios';
import * as CryptoJS from 'crypto-js';

class BaseWS extends EventEmitter {
  private messageId = 0;
  private pingListenKeyInterval: any;
  private pingInterval: any;
  private pongTimeout: any;

  protected apiConfig: ApiConfig;
  protected listenKey?: string;
  protected socket: WebSocket;

  constructor(apiConfig = {}) {
    super();

    this.apiConfig = apiConfig;

    this.messageId = 0;
    this.listenKey = undefined;

    this.socket = undefined;
    this.pingInterval = undefined;
    this.pongTimeout = undefined;
    this.pingListenKeyInterval = null;
  }

  async initConnection() {
    await this._initListenKeyIfNeeded();

    const wsUrl = this._getWsUrl();

    this.socket = new WebSocket(wsUrl);

    this.socket.on('open', () => {
      this._onOpen();
    });

    this.socket.on('close', () => {
      this.restartSocket();
    });

    this.socket.on('message', (data) => {
      this._onMessage(data);
    });

    this.socket.on('error', () => {
      this.restartSocket();
    });

    this._initPingInterval();
  }

  restartSocket() {
    this.terminate();

    setTimeout(() => {
      this.initConnection();
    }, RESTART_SOCKET_DELAY_TIME);
  }

  terminate() {
    this._clearSocketConnection();
    this._clearPingInterval();
    this._clearPongTimeout();
    this.emit('close');
  }

  private async _initListenKeyIfNeeded() {
    if (isEmpty(this.apiConfig)) {
      return;
    }

    const { listenKey } = await this._requestAPI('POST', '/openApi/user/auth/userDataStream');

    this.listenKey = listenKey;
    this._initPingListenKey();
  }

  private async _initPingListenKey() {
    if (isEmpty(this.listenKey)) {
      return;
    }

    this.pingListenKeyInterval = setInterval(async () => {
      try {
        await this._requestAPI('PUT', '/openApi/user/auth/userDataStream', {
          listenKey: this.listenKey
        });
      } catch (error) {
        this.restartSocket();
        throw error;
      }
    }, PING_LISTEN_KEY_INTERVAL_TIME);
  }

  private _initPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.socket.readyState !== WebSocket.OPEN) {
        return;
      }

      this._clearPongTimeout();
      this.socket.send('Ping');
      this._initPongTimeout();
    }, PING_INTERVAL_TIME);
  }

  private _initPongTimeout() {
    this.pongTimeout = setTimeout(() => {
      console.error('Pong timeout exceeded');

      this.restartSocket();
    }, PONG_TIMEOUT_TIME);
  }

  private _configParams(params) {
    const formattedParams = params;

    formattedParams.timestamp = new Date().getTime();

    const paramString = querystring.stringify(formattedParams);
    const sign = CryptoJS.enc.Hex.stringify(CryptoJS.HmacSHA256(paramString, this.apiConfig.apiSecret));

    formattedParams.signature = sign;

    return formattedParams;
  }

  private _clearPingInterval() {
    clearInterval(this.pingInterval);
  }

  private _clearSocketConnection() {
    if (!this.socket) {
      return;
    }

    this.socket.removeAllListeners();
    this.socket.terminate();
    this.socket = undefined;
  }

  protected async _requestAPI(method: Method, path: string, params = {}) {
    const configuredParams = this._configParams(params);
    const url = `${BASE_API_URL}${path}?${querystring.stringify(configuredParams)}`;

    const response = await axios.request({
      url,
      method,
      headers: {
        'X-BX-APIKEY': this.apiConfig.apiKey,
      },
    });

    return response.data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _onMessage(message) {
    return;
  }

  protected _onOpen() {
    this.emit('open');
  }

  protected _clearPongTimeout() {
    clearTimeout(this.pongTimeout);
  }

  protected _getWsUrl() {
    return '';
  }

  protected _subscribe(dataType) {
    const CHANNEL = {
      'id': 'id' + (++this.messageId),
      'reqType': 'sub',
      'dataType': dataType
    };
    this.socket.send(JSON.stringify(CHANNEL));
  }

  protected _unsubscribe(dataType) {
    const CHANNEL = {
      'id': 'id' + (++this.messageId),
      'reqType': 'unsub',
      'dataType': dataType
    };
    this.socket.send(JSON.stringify(CHANNEL));
  }
}

export default BaseWS;