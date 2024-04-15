/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  EventEmitter
} from 'events';
import {
  type ApiConfig
} from '../../libs/RequestConfig';
import OKXMainSocketConnection from './MainSocketConnection';
import OKXBusinessSocketConnection from './BusinessSocketConnection';
import {
  KlineConfig
} from 'exchanges/binance/RequestParams';

class BaseWS extends EventEmitter {
  private readonly apiConfig: ApiConfig;
  private mainSocketConnection: OKXMainSocketConnection;
  private businessSocketConnection: OKXBusinessSocketConnection;

  constructor(apiConfig = {}) {
    super();

    this.apiConfig = apiConfig;
    this.mainSocketConnection = undefined;
    this.businessSocketConnection = undefined;
  }

  async initConnection() {
    this._initMainSocketConnection();
    this._initBusinessSocketConnection();
  }

  subscribeKlineChannels(symbolConfigs: KlineConfig[]) {
    this.businessSocketConnection.subscribeKlineChannels(symbolConfigs);
  }

  subscribePriceChannels(symbols: string[]) {
    this.mainSocketConnection.subscribePriceChannels(symbols);
  }

  subscribeOrderbookChannels(symbols: string[], level: number = 5) {
    this.mainSocketConnection.subscribeOrderbookChannels(symbols, level);
  }

  subscribeKlineChannel(symbol: string, interval: string) {
    this.businessSocketConnection.subscribeKlineChannel(symbol, interval);
  }

  subscribePriceChannel(symbol: string) {
    this.mainSocketConnection.subscribePriceChannel(symbol);
  }

  subscribeOrderbookChannel(symbol: string, level: number = 5) {
    this.mainSocketConnection.subscribeOrderbookChannel(symbol, level);
  }

  subscribeOrderChannel(instType: string) {
    this.mainSocketConnection.subscribeOrderChannel(instType);
  }

  subscribeBalanceChannel() {
    this.mainSocketConnection.subscribeBalanceChannel();
  }

  restartSocket() {
    this.mainSocketConnection.restartSocket();
    this.businessSocketConnection.restartSocket();
  }

  terminate() {
    if (this.mainSocketConnection) {
      this.mainSocketConnection.removeAllListeners();
      this.mainSocketConnection.terminate();
      this.mainSocketConnection = undefined;
    }

    if (this.businessSocketConnection) {
      this.businessSocketConnection.removeAllListeners();
      this.businessSocketConnection.terminate();
      this.businessSocketConnection = undefined;
    }

    this.emit('close');

    setTimeout(() => {
      this.initConnection();
    }, 5000);
  }

  // Implement
  protected onAuthenticated(code: any) {}

  protected onOrderUpdated(orderMessage: any, instrumentType: any) {}

  private _initMainSocketConnection() {
    this.mainSocketConnection = new OKXMainSocketConnection(this.apiConfig);

    this.mainSocketConnection.on('open', () => {
      this.onSocketOpenned();
    });

    this.mainSocketConnection.on('close', () => {
      this.terminate();
    });

    this.mainSocketConnection.on('authenticated', code => {
      return this.onAuthenticated(code);
    });

    this.mainSocketConnection.on('priceUpdated', price => {
      this.emit('priceUpdated', price);
    });

    this.mainSocketConnection.on('orderbookUpdated', orderbook => {
      this.emit('orderbookUpdated', orderbook);
    });

    this.mainSocketConnection.on('balanceUpdated', balance => {
      this.emit('balanceUpdated', balance);
    });

    this.mainSocketConnection.on('orderUpdated', (order, instrumentType) => {
      this.onOrderUpdated(order, instrumentType);
    });

    this.mainSocketConnection.initConnection();
  }

  private _initBusinessSocketConnection() {
    this.businessSocketConnection = new OKXBusinessSocketConnection();

    this.businessSocketConnection.on('open', () => {
      this.onSocketOpenned();
    });

    this.businessSocketConnection.on('close', () => {
      this.terminate();
    });

    this.businessSocketConnection.on('klineUpdated', (kline) => {
      this.emit('klineUpdated', kline);
    });

    this.businessSocketConnection.initConnection();
  }

  private onSocketOpenned() {
    if (
      !this.mainSocketConnection.isOpen() ||
      !this.businessSocketConnection.isOpen()
    ) {
      return;
    }

    this.emit('open');
  }
}

export default BaseWS;