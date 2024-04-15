import {
  ApiConfig
} from '../../../libs/RequestConfig';
import BaseWS from '../BaseWS';
import BingXSpotAPI from './API';
import { isEmpty } from 'lodash';
import * as zlib from 'zlib';
import * as JSONbigint from 'json-bigint';
import BigNumber from 'bignumber.js';
import {
  ExchangeMode,
  OrderStatus,
  OrderbookType
} from '../../../libs/Consts';
import {
  BASE_SPOT_WS_URL,
  ExchangeOrderStatus
} from '../Consts';
import {
  KlineConfig
} from 'exchanges/binance/RequestParams';

class BingXSpotWSClient extends BaseWS {
  private exchangeApi: any;

  constructor(apiConfig: ApiConfig = {}) {
    super(apiConfig);

    this.exchangeApi = new BingXSpotAPI(apiConfig);
  }

  subscribePriceChannels(symbols: string[]) {
    const formattedChannels = symbols.map(symbol => {
      return `${symbol}@trade`;
    });

    this._subscribe(formattedChannels);
  }

  subscribeOrderbookChannels(symbols: string[], level: number = 20) {
    const formattedChannels = symbols.map(symbol => {
      return `${symbol}@depth${level}`;
    });

    this._subscribe(formattedChannels);
  }

  subscribeKlineChannels(symbolConfigs: KlineConfig[]) {
    const formattedChannels = symbolConfigs.map(config => {
      return `${config.symbol}@kline_${config.interval}`;
    });

    this._subscribe(formattedChannels);
  }

  subscribeOrderbookChannel(symbol: string, depth = 20) {
    const dataType = `${symbol}@depth${depth}`;
    this._subscribe(dataType);
  }

  subscribePriceChannel(symbol: string) {
    const dataType = `${symbol}@trade`;
    this._subscribe(dataType);
  }

  subscribeKlineChannel(symbol: string, interval = '1m') {
    const formattedInterval = this._formatInterval(interval);
    const dataType = `${symbol}@kline_${formattedInterval}`;

    this._subscribe(dataType);
  }

  protected _onOpen() {
    this.emit('open');

    if (!isEmpty(this.apiConfig)) {
      this._subscribeOrderUpdateChannel();
      this._subscribeAccountUpdateChannel();
    }
  }

  protected _onMessage(message: string) {
    const buf = Buffer.from(message);
    const decodedMessage = zlib.gunzipSync(buf).toString('utf8');

    if (decodedMessage == 'Ping') {
      this.socket.send('Pong');
      return;
    }

    if (decodedMessage == 'Pong') {
      return this._clearPongTimeout();
    }

    const parsedMessage = JSONbigint({ storeAsString: true }).parse(decodedMessage);

    if (parsedMessage.dataType) {
      const dataType = parsedMessage.dataType;

      if (dataType.includes('depth')) {
        const orderbook = parsedMessage.data;

        orderbook.s = dataType.split('@')[0];

        return this._onOrderbookUpdated(orderbook);
      }

      if (dataType.includes('trade')) {
        return this._onTradeUpdated(parsedMessage.data);
      }

      if (dataType.includes('kline')) {
        const klineData = parsedMessage.data;
        const kline = {
          s: klineData.s,
          ...klineData.K,
        };

        return this._onKlineUpdated(kline);
      }
    }

    const messageData = parsedMessage.data || parsedMessage;

    if (messageData.e) {
      switch (messageData.e) {
        case 'ACCOUNT_UPDATE':
          return this._onAccountUpdated(messageData.a);
        case 'executionReport':
          return this._onOrderUpdated(messageData);
        case 'listenKeyExpired':
          return this.restartSocket();
      }
    }
  }

  protected _getWsUrl() {
    if (this.apiConfig) {
      return `${BASE_SPOT_WS_URL}?listenKey=${this.listenKey}`;
    }

    return BASE_SPOT_WS_URL;
  }

  private _subscribeOrderUpdateChannel() {
    const dataType = 'spot.executionReport';
    this._subscribe(dataType);
  }

  private _subscribeAccountUpdateChannel() {
    const dataType = 'ACCOUNT_UPDATE';
    this._subscribe(dataType);
  }

  private _onAccountUpdated(data) {
    const formattedBalances = data.B.map(balance => {
      return {
        asset: balance.a,
        availableBalance: balance.cw,
        balance: balance.wb,
      };
    });

    this.emit('balanceUpdated', formattedBalances);
  }

  private async _onOrderUpdated(order) {
    const translatedOrder = {
      orderId: order.i,
      symbol: order.s,
      side: order.S,
      type: order.o,
      quantity: order.l,
      status: order.X,
      cummulativeQuoteQty: order.Z,
      executedQty: order.l,
      fee: order.n,
      feeAsset: order.N,
      price: order.p
    };
    const formattedOrder = await this.exchangeApi.formatExchangeOrder(translatedOrder);

    this.emit('orderUpdated', formattedOrder);
  }

  private _onKlineUpdated(kline) {
    const interval = this._formatKlineInterval(kline.i);
    const formattedKline = {
      openTime: kline.t,
      symbol: kline.s,
      interval,
      open: kline.o,
      close: kline.c,
      high: kline.h,
      low: kline.l,
      baseVolume: kline.v,
      quoteVolume: BigNumber(kline.v).multipliedBy(kline.c).toFixed(),
      closeTime: kline.T
    };

    this.emit('klineUpdated', formattedKline);
  }

  private _onTradeUpdated(trade) {
    const formattedTrade = {
      symbol: trade.s,
      price: trade.p,
      timestamp: trade.T
    };

    this.emit('priceUpdated', formattedTrade);
  }

  private _onOrderbookUpdated(orderbook) {
    const formattedOrderbook = {
      symbol: orderbook.s,
      bids: this._formatOrderbook(orderbook.bids),
      asks: this._formatOrderbook(orderbook.asks),
      type: OrderbookType.SNAPSHOT,
      mode: ExchangeMode.Spot
    };

    this.emit('orderbookUpdated', formattedOrderbook);
  }

  private _formatInterval(interval){
    const unit = interval.substring(interval.length - 1);
    const num = +interval.substring(0, interval.length - 1);

    if(unit == 'm'){
      return num + 'min';
    }
  }

  private _formatKlineInterval(intervalString) {
    const interval = Number(intervalString.match(/\d+/g));

    return `${interval}m`;
  }

  private _formatOrderbook(orderbook) {
    return orderbook.map(item => {
      return {
        price: item[0],
        quantity: item[1]
      };
    });
  }

  private _parseOrderStatus(orderStatus): OrderStatus {
    switch (orderStatus) {
      case ExchangeOrderStatus.NEW:
      case ExchangeOrderStatus.PENDING:
        return OrderStatus.PENDING;
      case ExchangeOrderStatus.PARTIALLY_FILLED:
        return OrderStatus.EXECUTING;
      case ExchangeOrderStatus.FILLED:
        return OrderStatus.EXECUTED;
      case ExchangeOrderStatus.CANCELED:
      case ExchangeOrderStatus.FAILED:
        return OrderStatus.CANCELED;
    }
  }
}

export default BingXSpotWSClient;