/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  EventEmitter
} from 'events';
import {
  WebSocket
} from 'ws';
import {
  encryptSignature,
  parseJsonString
} from './Utils';
import {
  type ApiConfig
} from '../../libs/RequestConfig';
import {
  type FormattedKline
} from '../../libs/ResponseConfig';
import type WsInterface from '../../libs/BaseInterfaces/WsInterface';
import {
  type SnapshotOrderbook,
  type WsKlineData,
  type WsTradeData
} from './ResponseData';
import {
  KlineConfig
} from 'exchanges/binance/RequestParams';

const RESTART_SOCKET_DELAY_TIME = 5000;
const PING_INTERVAL_TIME = 30000;
const PONG_TIMEOUT_TIME = 10000;

class BaseWS extends EventEmitter implements WsInterface {
  protected baseUrl: string;
  protected apiConfig: ApiConfig;

  private socket: WebSocket | undefined | null;
  private pingInterval: any;
  private pongTimeout: any;

  constructor (baseUrl: string, apiConfig: ApiConfig = {}) {
    super();

    this.baseUrl = baseUrl;
    this.apiConfig = apiConfig;

    this.socket = null;
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
    this.socket = new WebSocket(this.baseUrl);

    this.socket.on('open', () => {
      this.onOpen();
    });

    this.socket.on('close', (code, reason) => {
      this.restartSocket();
    });

    this.socket.on('message', (data, isBinary) => {
      const parsedMessage = isBinary ? data : data.toString();
      this.onMessage(parsedMessage);
    });

    this.socket.on('error', (err) => {
      this.restartSocket();
    });
  }

  terminate () {
    this.clearSocketConnection();
    this.clearPingInterval();
    this.clearPongTimeout();
    this.emit('close');
  }

  restartSocket () {
    this.terminate();

    setTimeout(() => {
      this.initConnection();
    }, RESTART_SOCKET_DELAY_TIME);
  }

  private loginForprotectedChannelIfNeed () {
    if (Object.keys(this.apiConfig).length === 0) {
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    if (this.apiConfig.apiSecret) {
      const sign = encryptSignature(
        'GET',
        '/user/verify',
        null,
        timestamp,
        this.apiConfig.apiSecret
      );

      this.send({
        op: 'login',
        args: [
          {
            apiKey: this.apiConfig.apiKey,
            passphrase: this.apiConfig.passphrase,
            timestamp: timestamp.toString(),
            sign
          }
        ]
      });
    }
  }

  private initPingInterval () {
    this.pingInterval = setInterval(() => {
      if (this.socket?.readyState !== WebSocket.OPEN) {
        return;
      }

      this.clearPongTimeout();
      this.send('ping');
      this.initPongTimeout();
    }, PING_INTERVAL_TIME);
  }

  private initPongTimeout () {
    this.pongTimeout = setTimeout(() => {
      this.restartSocket();
    }, PONG_TIMEOUT_TIME);
  }

  private clearSocketConnection () {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.terminate();
      this.socket = undefined;
    }
  }

  private clearPingInterval () {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }

  protected clearPongTimeout () {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
    }
  }

  protected send (message: any) {
    if (!this.socket) {
      throw new Error('Socket is not open');
    }

    if (typeof message !== 'string') {
      message = parseJsonString(message);
    }

    this.socket.send(message);
  }

  protected onOpen () {
    this.emit('open');
    this.initPingInterval();
    this.loginForprotectedChannelIfNeed();
  }

  protected onMessage (message: any) {

  }

  protected formatKline (kline: WsKlineData): FormattedKline {
    return {
      openTime: kline[0],
      open: kline[1],
      high: kline[2],
      low: kline[3],
      close: kline[4],
      baseVolume: kline[5]
    };
  }

  protected formatTrade (trade: WsTradeData) {
    return {
      price: trade[1],
      timestamp: trade[0]
    };
  }

  protected formatOrderbook (orderbook: SnapshotOrderbook[]) {
    return orderbook.map((item) => {
      return {
        price: item[0],
        quantity: item[1]
      };
    });
  }
}

export default BaseWS;
