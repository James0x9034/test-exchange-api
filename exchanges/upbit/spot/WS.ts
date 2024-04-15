/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  EventEmitter
} from 'events';
import {
  WebSocket
} from 'ws';
import {
  isEmpty,
  isString
} from 'lodash';
import {
  v4 as uuidv4
} from 'uuid';
import * as jwt from 'jsonwebtoken';
import {
  type ApiConfig
} from '../../../libs/RequestConfig';
import UpbitSpotAPI from './API';
import type WsInterface from '../../../libs/BaseInterfaces/WsInterface';
import {
  type JwtPayload,
  type SubscribeParams
} from '../RequestParams';
import {
  generateUUID
} from '../../../libs/Utils';
import {
  type OrderbookResponseData,
  type PrivateTrade,
  type TradeResponseData
} from '../ResponseData';
import {
  ExchangeMode,
  OrderbookType
} from '../../../libs/Consts';
import {
  KlineConfig
} from 'exchanges/binance/RequestParams';

const WS_URL = 'wss://api.upbit.com/websocket/v1';
const PING_INTERVAL_TIME = 60000;
const PONG_TIMEOUT_TIME = 10000;
const RESTART_SOCKET_DELAY_TIME = 3000;
const BALANCE_INTERVAL_TIME = 5000;
const PRIVATE_TRADE_INTERVAL_TIME = 2000;

class UpbitSpotWsClient extends EventEmitter implements WsInterface {
  private readonly apiConfig: ApiConfig;
  private readonly exchangeApi: any;
  private socket: WebSocket;
  private pingInterval: any;
  private pongTimeout: any;
  private balanceInterval: any;
  private tradeInterval: any;
  private readonly tradeMessages: PrivateTrade[];

  constructor (apiConfig: ApiConfig = {}) {
    super();

    this.apiConfig = apiConfig;
    this.exchangeApi = new UpbitSpotAPI(apiConfig);

    this.socket = undefined;

    this.pingInterval = undefined;
    this.pongTimeout = undefined;

    this.balanceInterval = undefined;

    this.tradeInterval = undefined;
    this.tradeMessages = [];
  }

  async initConnection () {
    const connectionConfig = this.getConnectionConfig();

    this.socket = new WebSocket(WS_URL, connectionConfig);

    this.socket.on('open', () => {
      this.onOpen();
    });

    this.socket.on('message', (data: string) => {
      this.onMessage(data);
    });

    this.socket.on('close', () => {
      this.restartSocket();
    });

    this.socket.on('error', () => {
      this.restartSocket();
    });
  }

  subscribePriceChannels(symbols: string[]) {
    const params: any = [
      {
        ticket: generateUUID()
      },
      {
        type: 'trade',
        codes: symbols,
        isOnlyRealtime: true
      },
      {
        type: 'orderbook',
        codes: symbols
      }
    ];

    this.sendMessage(params);
  }

  subscribeOrderbookChannels(symbols: string[]) {
    const params: any = [
      {
        ticket: generateUUID()
      },
      {
        type: 'orderbook',
        codes: symbols
      },
      {
        type: 'trade',
        codes: symbols,
        isOnlyRealtime: true
      }
    ];

    this.sendMessage(params);
  }

  subscribeKlineChannels (symbolConfigs: KlineConfig[]) {
    throw new Error('Method not implemented.');
  }

  // Upbit just support subscribe one times with multiple channels
  subscribePriceChannel (symbol: string) {
    const params: any = [
      {
        ticket: generateUUID()
      },
      {
        type: 'orderbook',
        codes: [symbol]
      },
      {
        type: 'trade',
        codes: [symbol],
        isOnlyRealtime: true
      }
    ];

    this.sendMessage(params);
  }

  // Upbit just support subscribe one times with multiple channels
  subscribeOrderbookChannel (symbol: string) {
    const params: any = [
      {
        ticket: generateUUID()
      },
      {
        type: 'orderbook',
        codes: [symbol]
      },
      {
        type: 'trade',
        codes: [symbol],
        isOnlyRealtime: true
      }
    ];

    this.sendMessage(params);
  }

  subscribeKlineChannel (symbol: string, interval: string) {
    throw new Error('Method not implemented.');
  }

  restartSocket () {
    this.terminate();

    setTimeout(() => {
      this.initConnection();
    }, RESTART_SOCKET_DELAY_TIME);
  }

  terminate () {
    this.clearSocketConnection();
    this.clearPingInterval();
    this.clearPongTimeout();
    this.clearPrivateInterval();
    this.emit('close');
  }

  private onOpen () {
    this.emit('open');
    this.initPingInterval();
    this.handlePrivateAccountIfNeed();
  }

  private async onMessage (data: string) {
    const formattedData = JSON.parse(data);

    if (formattedData.status == 'UP') {
      // Pong
      this.clearPongTimeout(); return;
    }

    switch (formattedData.type) {
      case 'trade':
      { this.onTradeUpdated(formattedData); return; }
      case 'orderbook':
      { this.onOrderbookUpdated(formattedData); return; }
      case 'myTrade':
      { await this.onPrivateTradeUpdated(formattedData); }
    }
  }

  private onTradeUpdated (trade: TradeResponseData) {
    const formattedTrade = {
      symbol: trade.code,
      price: trade.trade_price,
      timestamp: trade.trade_timestamp
    };

    this.emit('priceUpdated', formattedTrade);
  }

  private onOrderbookUpdated (orderbook: OrderbookResponseData) {
    const formattedOrderbook: any = {
      symbol: orderbook.code,
      type: OrderbookType.SNAPSHOT,
      bids: [],
      asks: [],
      mode: ExchangeMode.Spot
    };

    for (const item of orderbook.orderbook_units) {
      formattedOrderbook.bids.push({
        price: item.bid_price,
        quantity: item.bid_size
      });
      formattedOrderbook.asks.push({
        price: item.ask_price,
        quantity: item.ask_size
      });
    }

    this.emit('orderbookUpdated', formattedOrderbook);
  }

  private async onPrivateTradeUpdated (trade: PrivateTrade) {
    this.tradeMessages.push(trade);
  }

  private handlePrivateAccountIfNeed () {
    if (isEmpty(this.apiConfig)) {
      return;
    }

    this.subscribePrivateTradeChannel();
    this.initBalanceInterval();
    this.initTradeInterval();
  }

  private subscribePrivateTradeChannel () {
    const params: SubscribeParams = [
      {
        ticket: generateUUID()
      },
      {
        type: 'myTrade'
      }
    ];

    this.sendMessage(params);
  }

  private initBalanceInterval () {
    this.balanceInterval = setInterval(() => {
      this.sendSnapshotBalances();
    }, BALANCE_INTERVAL_TIME);
  }

  private initTradeInterval () {
    this.tradeInterval = setInterval(() => {
      this.handlePrivateTradeMessages();
    }, PRIVATE_TRADE_INTERVAL_TIME);
  }

  private initPingInterval () {
    this.pingInterval = setInterval(() => {
      if (this.socket.readyState !== WebSocket.OPEN) {
        return;
      }

      this.clearPongTimeout();
      this.sendMessage('PING');
      this.initPongTimeout();
    }, PING_INTERVAL_TIME);
  }

  private initPongTimeout () {
    this.pongTimeout = setTimeout(() => {
      this.restartSocket();
    }, PONG_TIMEOUT_TIME);
  }

  private async handlePrivateTradeMessages () {
    const trade = this.tradeMessages.shift();
    if (!trade) {
      return;
    }

    const order = await this.exchangeApi.getOrderDetail({
      orderId: trade.order_uuid
    });

    this.emit('orderUpdated', order);
  }

  private async sendSnapshotBalances () {
    const balances = await this.exchangeApi.getBalances();

    this.emit('balanceUpdated', balances);
  }

  private sendMessage (message: SubscribeParams | string) {
    if (!isString(message)) {
      message = JSON.stringify(message);
    }

    this.socket.send(message);
  }

  private clearSocketConnection () {
    if (!this.socket) {
      return;
    }

    this.socket.removeAllListeners();
    this.socket.terminate();
    this.socket = undefined;
  }

  private clearPingInterval () {
    clearInterval(this.pingInterval);
  }

  private clearPongTimeout () {
    clearTimeout(this.pongTimeout);
  }

  private clearPrivateInterval () {
    clearInterval(this.tradeInterval);
    clearInterval(this.balanceInterval);
  }

  private getConnectionConfig () {
    if (!this.apiConfig.apiKey) {
      return {};
    }

    const payload: JwtPayload = {
      access_key: this.apiConfig.apiKey,
      nonce: uuidv4()
    };
    const jwtToken: string = jwt.sign(payload, this.apiConfig.apiSecret);

    return {
      headers: {
        authorization: `Bearer ${jwtToken}`
      }
    };
  }
}

export default UpbitSpotWsClient;
