/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from 'axios';
import {
  EventEmitter
} from 'events';
import {
  isEmpty
} from 'lodash';
import {
  type Data,
  type ErrorEvent,
  WebSocket
} from 'ws';
import {
  type ApiConfig
} from '../../libs/RequestConfig';
import {
  WsFormattedTrade,
  type FormattedKline,
  type FormattedOrderbook,
} from '../../libs/ResponseConfig';
import {
  type OrderbookToBeUpdated,
  type WsKlineData,
  type WsTradeData
} from './ResponseData';
import type WsInterface from '../../libs/BaseInterfaces/WsInterface';
import * as querystring from 'querystring';
import {
  KlineConfig
} from './RequestParams';

const PING_LISTENKEY_INTERVAL_TIME = 1800000;
const PING_INTERVAL_TIME = 60000;
const PONG_TIMEOUT_TIME = 10000;
const RESTART_SOCKET_DELAY_TIME = 5000;

class BaseWS extends EventEmitter implements WsInterface {
  private messageId = 0;
  private socket: WebSocket;
  private pingListenKeyInterval: any;
  private pingInterval: any;
  private pongTimeout: any;

  protected apiConfig: ApiConfig;
  protected listenKey?: string;

  constructor (apiConfig: ApiConfig) {
    super();

    this.apiConfig = apiConfig;

    this.messageId = 0;
    this.listenKey = undefined;
    this.socket = null;

    this.pingListenKeyInterval = null;
    this.pingInterval = undefined;
    this.pongTimeout = undefined;
  }

  subscribePriceChannels (symbols: string[]) {
    throw new Error('Method not implemented.');
  }

  subscribeKlineChannels (symbolConfigs: KlineConfig[]) {
    throw new Error('Method not implemented.');
  }

  subscribeOrderbookChannels (symbols: string[], level: number) {
    throw new Error('Method not implemented.');
  }

  subscribePriceChannel (symbol: string) {
    throw new Error('Method not implemented.');
  }

  subscribeKlineChannel (symbol: string, interval: string) {
    throw new Error('Method not implemented.');
  }

  subscribeOrderbookChannel (symbol: string, level: number) {
    throw new Error('Method not implemented.');
  }

  async initConnection () {
    await this.initListenKeyIfNeed();

    const wsUrl = this.getWsUrl();

    this.socket = new WebSocket(wsUrl);

    this.socket.on('open', () => {
      this.onOpen();
    });

    this.socket.on('close', (code, reason) => {
      this.restartSocket();
    });

    this.socket.on('message', (data) => {
      this.onMessage(data);
    });

    this.socket.on('ping', () => {
      this.socket.pong();
    });

    this.socket.on('pong', () => {
      this.clearPongTimeout();
    });

    this.socket.on('error', (err: ErrorEvent) => {
      this.restartSocket();
    });
  }

  restartSocket () {
    this.terminate();

    setTimeout(() => {
      this.initConnection();
    }, RESTART_SOCKET_DELAY_TIME);
  }

  terminate () {
    this.clearSocketConnection();
    this.clearPingListenKeyInterval();
    this.clearPingInterval();
    this.clearPongTimeout();
    this.emit('close');
  }

  private async initListenKeyIfNeed () {
    if (isEmpty(this.apiConfig)) {
      return;
    }

    const { listenKey } = await this.requestAPI('POST', this.getListenKeyUri());

    this.listenKey = listenKey;
    this.initPingListenKey();
  }

  private initPingListenKey () {
    if (isEmpty(this.listenKey)) {
      return;
    }

    this.pingListenKeyInterval = setInterval(async () => {
      try {
        await this.requestAPI('PUT', this.getListenKeyUri(), {
          listenKey: this.listenKey
        });
      } catch (error) {
        this.restartSocket();
        throw error;
      }
    }, PING_LISTENKEY_INTERVAL_TIME);
  }

  private initPingInterval () {
    this.pingInterval = setInterval(() => {
      if (this.socket.readyState !== WebSocket.OPEN) {
        return;
      }

      this.clearPongTimeout();
      this.socket.ping();
      this.initPongTimeout();
    }, PING_INTERVAL_TIME);
  }

  private initPongTimeout () {
    this.pongTimeout = setTimeout(() => {
      this.restartSocket();
    }, PONG_TIMEOUT_TIME);
  }

  private async requestAPI (method: string, url: string, params = {}) {
    if (!isEmpty(params)) {
      url = `${url}?${querystring.stringify(params)}`;
    }

    const response = await axios.request({
      url,
      method,
      baseURL: this.getApiUrl(),
      headers: {
        'X-MBX-APIKEY': this.apiConfig.apiKey
      }
    });

    return response.data;
  }

  private clearSocketConnection () {
    if (!this.socket) {
      return;
    }

    this.socket.removeAllListeners();
    this.socket.terminate();
    this.socket = null;
  }

  private clearPingListenKeyInterval () {
    if (this.pingListenKeyInterval) {
      clearInterval(this.pingListenKeyInterval);
    }
  }

  private clearPingInterval () {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }

  private clearPongTimeout () {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
    }
  }

  protected onOpen () {
    this.emit('open');
    this.initPingInterval();
  }

  protected onMessage (message: Data) {

  }

  protected getWsUrl (): string {
    return '';
  }

  protected getApiUrl (): string {
    return '';
  }

  protected getListenKeyUri (): string {
    return '';
  }

  protected subscribe (params: string[]) {
    this.socket.send(
      JSON.stringify({
        method: 'SUBSCRIBE',
        params,
        id: ++this.messageId
      })
    );
  }

  protected unsubscribe (params: string[]) {
    this.socket.send(
      JSON.stringify({
        method: 'UNSUBSCRIBE',
        params,
        id: ++this.messageId
      })
    );
  }

  protected formatKline (kline: WsKlineData): FormattedKline {
    return {
      openTime: kline.t,
      symbol: kline.s,
      interval: kline.i,
      open: kline.o,
      close: kline.c,
      high: kline.h,
      low: kline.l,
      baseVolume: kline.v,
      quoteVolume: kline.q,
      closeTime: kline.T
    };
  }

  protected formatTrade (trade: WsTradeData): WsFormattedTrade {
    return {
      symbol: trade.s,
      price: trade.p,
      timestamp: trade.T
    };
  }

  protected formatOrderbook (
    orderbook: OrderbookToBeUpdated
  ): FormattedOrderbook[] {
    return orderbook.map((item) => {
      return {
        price: item[0],
        quantity: item[1]
      };
    });
  }
}

export default BaseWS;
