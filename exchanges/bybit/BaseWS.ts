/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  EventEmitter
} from 'events';
import {
  WebSocket
} from 'ws';
import BigNumber from 'bignumber.js';
import {
  isEmpty,
  last,
  chain
} from 'lodash';
import {
  encodeHmac,
  mergeObjectArrayByKey
} from '../../libs/Utils';
import {
  type ApiConfig
} from '../../libs/RequestConfig';
import type WsInterface from '../../libs/BaseInterfaces/WsInterface';
import {
  ExchangeMode,
  OrderStatus,
  OrderbookType
} from '../../libs/Consts';
import {
  FormattedExchangeOrderBook,
  type FormattedOrderbook
} from '../../libs/ResponseConfig';
import {
  type KlineResponseData,
  type OrderbookToBeUpdated,
  type WsOrderbookData,
  type WsTradeData
} from './ResponseData';
import {
  ExchangeOrderStatus
} from './Consts';
import {
  KlineConfig
} from 'exchanges/binance/RequestParams';

const PING_INTERVAL_TIME = 60000;
const PONG_TIMEOUT_TIME = 10000;
const RESTART_DELAY_TIME = 5000;

class BaseWS extends EventEmitter implements WsInterface {
  private readonly apiConfig: ApiConfig;
  private socket: WebSocket | undefined;
  private pingInterval: any;
  private pongTimeout: any;
  private readonly orderbooks: FormattedExchangeOrderBook[];

  constructor(apiConfig: ApiConfig = {}) {
    super();

    this.apiConfig = apiConfig;
    this.socket = undefined;
    this.pingInterval = undefined;
    this.pongTimeout = undefined;

    this.orderbooks = [];
  }

  initConnection() {
    let wsUrl = this.getPublicUrl();

    if (!isEmpty(this.apiConfig)) {
      wsUrl = this.getPrivateUrl();
    }

    this.socket = new WebSocket(wsUrl);

    this.socket.on('open', () => {
      this.onOpen();
    });

    this.socket.on('close', () => {
      this.restartSocket();
    });

    this.socket.on('message', (data) => {
      this.onMessage(data);
    });

    this.socket.on('error', () => {
      this.restartSocket();
    });

    this.initPingInterval();
  }

  restartSocket() {
    this.terminate();

    setTimeout(() => {
      this.initConnection();
    }, RESTART_DELAY_TIME);
  }

  terminate() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.terminate();
      this.socket = undefined;
    }

    this.clearPingInterval();
    this.clearPongTimeout();
    this.emit('close');
  }

  subscribePriceChannels(symbols: string[]) {
    const formattedChannels = symbols.map(symbol => {
      return `publicTrade.${symbol}`;
    });

    this.sendMessage('subscribe', formattedChannels);
  }

  subscribeKlineChannels(symbolConfigs: KlineConfig[]) {
    const formattedChannels = symbolConfigs.map(config => {
      const parsedInterval = this.parseKlineInterval(config.interval);

      return `kline.${parsedInterval}.${config.symbol}`;
    });

    this.sendMessage('subscribe', formattedChannels);
  }

  subscribeOrderbookChannels(symbols: string[], level = 1) {
    const formattedChannels = symbols.map(symbol => {
      return `orderbook.${level}.${symbol}`;
    });

    this.sendMessage('subscribe', formattedChannels);
  }

  subscribePriceChannel(symbol: string) {
    this.sendMessage('subscribe', [`publicTrade.${symbol}`]);
  }

  subscribeKlineChannel(symbol: string, interval: string) {
    const parsedInterval = this.parseKlineInterval(interval);

    this.sendMessage('subscribe', [`kline.${parsedInterval}.${symbol}`]);
  }

  subscribeOrderbookChannel(symbol: string, level = 1) {
    this.sendMessage('subscribe', [`orderbook.${level}.${symbol}`]);
  }

  private onOpen() {
    this.emit('open');
    this.authenticationIfNeed();
  }

  private parseKlineInterval(interval: string) {
    const unit = interval.substring(interval.length - 1);
    const value = +interval.substring(0, interval.length - 1);

    switch (unit) {
      case 'h':
        return value * 60;
      case 'm':
        return value;
      case 'd':
        return 'D';
      default:
        return interval;
    }
  }

  private clearPingInterval() {
    clearInterval(this.pingInterval);
  }

  private initPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.socket?.readyState !== WebSocket.OPEN) {
        return;
      }

      this.clearPongTimeout();
      this.sendMessage('ping');
      this.initPongTimeout();
    }, PING_INTERVAL_TIME);
  }

  private initPongTimeout() {
    this.pongTimeout = setTimeout(() => {
      this.restartSocket();
    }, PONG_TIMEOUT_TIME);
  }

  private onMessage(message: any) {
    const parsedMessage = JSON.parse(message);
    const { data, op, topic, type } = parsedMessage;
    const action = topic || op;

    if (action == 'auth') {
      this.onAuthenticated(parsedMessage); return;
    }

    if (op == 'pong' || (op == 'ping' && parsedMessage.ret_msg == 'pong')) {
      this.clearPongTimeout(); return;
    }

    if (action == 'order') {
      this.onOrderUpdated(data); return;
    }

    if (action == 'wallet') {
      this.onBalanceUpdated(data); return;
    }

    if (action.includes('kline')) {
      this.onKlineUpdated(action, data); return;
    }

    if (action.includes('publicTrade')) {
      this.onTradeUpdated(data); return;
    }

    if (action.includes('orderbook')) {
      this.onOrderbookUpdated(data, type, action);
    }
  }

  private onOrderbookUpdated(
    orderbook: WsOrderbookData,
    type: string,
    topic: string
  ) {
    const arrTopic = topic.split('.');
    const level = arrTopic[1];
    const currentTimestamp = Date.now();
    const currentOrderbook = this.orderbooks.find((item) => {
      return item.symbol == orderbook.s;
    });
    const formattedOrderbook = {
      bids: this.formatOrderbook(orderbook.b),
      asks: this.formatOrderbook(orderbook.a),
      symbol: orderbook.s,
      updatedAt: currentTimestamp
    };

    if (type == OrderbookType.SNAPSHOT) {
      this.onSnapshotOrderbookUpdated(formattedOrderbook); return;
    }

    if (!currentOrderbook) {
      return;
    }

    currentOrderbook.bids = this.updateOrderbook(
      level,
      currentOrderbook.bids,
      formattedOrderbook.bids,
      true
    );
    currentOrderbook.asks = this.updateOrderbook(
      level,
      currentOrderbook.asks,
      formattedOrderbook.asks
    );
    currentOrderbook.updatedAt = currentTimestamp;
    currentOrderbook.mode = this.getPublicUrl().includes('spot') ?
      ExchangeMode.Spot : ExchangeMode.Future;

    this.emit('orderbookUpdated', currentOrderbook);
  }

  private updateOrderbook(
    level: string,
    currentOrderbook: FormattedOrderbook[],
    incomingOrderbook: FormattedOrderbook[],
    isBids = false
  ) {
    const mergedOrderbook = mergeObjectArrayByKey(
      incomingOrderbook,
      currentOrderbook,
      'price',
      'quantity'
    );

    return chain(mergedOrderbook)
      .filter((item) => {
        return BigNumber(item.quantity).isGreaterThan(0);
      })
      .orderBy('price', isBids ? 'desc' : 'asc')
      .take(+level)
      .value();
  }

  private onSnapshotOrderbookUpdated(orderbook: FormattedExchangeOrderBook) {
    const currentOrderbook = this.orderbooks.find((item) => {
      return item.symbol == orderbook.symbol;
    });

    if (currentOrderbook) {
      Object.assign(currentOrderbook, orderbook);
    } else {
      this.orderbooks.push(orderbook);
    }

    this.emit('orderbookUpdated', orderbook);
  }

  private formatOrderbook(
    orderbook: OrderbookToBeUpdated[]
  ): FormattedOrderbook[] {
    return orderbook.map((item) => {
      return {
        price: item[0],
        quantity: item[1]
      };
    });
  }

  private onTradeUpdated(trades: WsTradeData[]) {
    for (const trade of trades) {
      const formattedTrade = {
        symbol: trade.s,
        price: trade.p,
        timestamp: trade.T
      };

      this.emit('priceUpdated', formattedTrade);
    }
  }

  private onKlineUpdated(topic: string, klines: KlineResponseData[]) {
    const arrTopic = topic.split('.');
    const symbol = last(arrTopic);

    for (const kline of klines) {
      const formattedKline = {
        openTime: kline.start,
        symbol,
        interval: this.formatKlineInterval(kline.interval),
        open: kline.open,
        close: kline.close,
        high: kline.high,
        low: kline.low,
        baseVolume: kline.volume,
        quoteVolume: BigNumber(kline.volume)
          .multipliedBy(kline.close)
          .toFixed(),
        closeTime: kline.end
      };

      this.emit('klineUpdated', formattedKline);
    }
  }

  private formatKlineInterval(interval: string): string {
    if (isNaN(+interval)) {
      return interval.toLowerCase();
    }

    if (+interval < 60) {
      return `${interval}m`;
    }

    return `${+interval / 60}h`;
  }

  private onAuthenticated(auth: any) {
    if (!auth.success) {
      this.restartSocket(); return;
    }

    this.sendMessage('subscribe', ['order', 'wallet']);
  }

  private authenticationIfNeed() {
    if (!this.apiConfig.apiSecret) {
      return;
    }

    const expires = BigNumber(Date.now()).plus(31536000000).toString();
    const signStr = `GET/realtime${expires}`;
    const signature = encodeHmac(signStr, this.apiConfig.apiSecret);

    this.sendMessage('auth', [this.apiConfig.apiKey, expires, signature]);
  }

  private sendMessage(action: string, params?: any[]) {
    this.socket?.send(
      JSON.stringify({
        op: action,
        args: params
      })
    );
  }

  private clearPongTimeout() {
    clearTimeout(this.pongTimeout);
  }

  private getPrivateUrl(): string {
    return 'wss://stream.bybit.com/v5/private';
  }

  protected onOrderUpdated(orders: any) {

  }

  protected onBalanceUpdated(accounts: any) {

  }

  protected getPublicUrl(): string {
    return '';
  }

  protected parseOrderStatus(status: ExchangeOrderStatus): OrderStatus {
    switch (status) {
      case ExchangeOrderStatus.NEW:
      case ExchangeOrderStatus.CREATED:
      case ExchangeOrderStatus.UNTRIGGERED:
        return OrderStatus.PENDING;
      case ExchangeOrderStatus.PARTIALLY_FILLED:
        return OrderStatus.EXECUTING;
      case ExchangeOrderStatus.FILLED:
        return OrderStatus.EXECUTED;
      case ExchangeOrderStatus.PENDING_CANCEL:
      case ExchangeOrderStatus.CANCELED:
      case ExchangeOrderStatus.REJECTED:
      case ExchangeOrderStatus.DEACTIVATED:
        return OrderStatus.CANCELED;
      default:
        return OrderStatus.ERROR;
    }
  }
}

export default BaseWS;
