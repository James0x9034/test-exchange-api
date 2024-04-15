import BaseWS from '../BaseWS';
import * as zlib from 'zlib';
import * as JSONBigint from 'json-bigint';
import {
  ApiConfig
} from '../../../libs/RequestConfig';
import {
  intervalToMilis
} from '../../../libs/Utils';
import BigNumber from 'bignumber.js';
import {
  CURRENCY_USDT,
  ExchangeMode,
  OrderSide,
  OrderType,
  OrderbookType,
  PositionSide
} from '../../../libs/Consts';
import {
  formatOrderStatus
} from '../Utils';
import {
  BASE_WS_URL,
  TransactionType
} from '../Consts';
import {
  isEmpty
} from 'lodash';
import BingXFutureAPI from './API';
import {
  KlineConfig
} from 'exchanges/binance/RequestParams';

type Leverage = {
  symbol: string,
  longLeverage: number,
  shortLeverage: number
}

class BingXFutureWsClient extends BaseWS {
  private leverages: Leverage[];

  constructor(apiConfig: ApiConfig = {}) {
    super(apiConfig);

    this.leverages = [];
  }

  subscribePriceChannels(symbols: string[]) {
    const formattedChannels = symbols.map(symbol => {
      return `${symbol}@trade`;
    });

    this._subscribe(formattedChannels);
  }

  subscribeOrderbookChannels(symbols: string[], level: number = 5) {
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

  subscribeOrderbookChannel(symbol: string, depth = 5) {
    const dataType = `${symbol}@depth${depth}`;
    this._subscribe(dataType);
  }

  subscribePriceChannel(symbol: string) {
    const dataType = `${symbol}@trade`;
    this._subscribe(dataType);
  }

  subscribeKlineChannel(symbol: string, interval: string) {
    const dataType = `${symbol}@kline_${interval}`;
    this._subscribe(dataType);
  }

  protected _onOpen() {
    super._onOpen();
    this._initLeverage();
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

    const parsedMessage = JSONBigint({ storeAsString: true }).parse(decodedMessage);

    if (parsedMessage.dataType) {
      const dataType = parsedMessage.dataType;

      if (dataType.includes('depth')) {
        const orderbook = parsedMessage.data;

        orderbook.s = dataType.split('@')[0];

        return this._onOrderbookUpdated(orderbook);
      }

      if (dataType.includes('trade')) {
        return this._onTradeUpdated(parsedMessage.data[0]);
      }

      if (dataType.includes('kline')) {
        const interval = dataType.split('_')[1];
        const kline = {
          s: parsedMessage.s,
          i: interval,
          ...parsedMessage.data[0]
        };

        return this._onKlineUpdated(kline);
      }
    }

    if (parsedMessage.e) {
      switch (parsedMessage.e) {
        case 'ACCOUNT_UPDATE':
          return this._onAccountUpdated(parsedMessage.a);
        case 'ORDER_TRADE_UPDATE':
          return this._onOrderUpdated(parsedMessage.o);
        case 'ACCOUNT_CONFIG_UPDATE':
          return this._onAccountConfigUpdated(parsedMessage);
        case 'listenKeyExpired':
          return this.restartSocket();
      }
    }
  }

  protected _getWsUrl() {
    if (this.apiConfig) {
      return `${BASE_WS_URL}?listenKey=${this.listenKey}`;
    }

    return BASE_WS_URL;
  }

  private _onAccountConfigUpdated(config) {
    if (!config.ac) {
      return;
    }

    const accountConfig = config.ac;
    const orderLeverages = this.leverages.filter(l => l.symbol == accountConfig.s);

    for (const leverage of orderLeverages) {
      leverage.longLeverage = accountConfig.l;
      leverage.shortLeverage = accountConfig.S;
    }
  }

  private _onKlineUpdated(kline) {
    const intervalInMilis = intervalToMilis(kline.i);
    const closeTime = BigNumber(kline.T).plus(intervalInMilis - 1).toString();
    const formattedKline = {
      openTime: kline.T,
      symbol: kline.s,
      interval: kline.i,
      open: kline.o,
      close: kline.c,
      high: kline.h,
      low: kline.l,
      volume: kline.v,
      closeTime
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
      mode: ExchangeMode.Future
    };

    this.emit('orderbookUpdated', formattedOrderbook);
  }

  private async _onOrderUpdated(order) {
    const orderSide = this._parseOrderSide(order);
    const leverage = await this._getOrderLeverage(order);
    const formattedOrder = {
      symbol: order.s,
      baseSymbol: order.s.replace(/-/g, ''),
      side: order.S,
      orderType: order.o,
      originalQuantity: order.q,
      originalPrice: order.p,
      executedPrice: order.ap,
      executedQuantity: order.z,
      receivedQuantity: order.z,
      status: formatOrderStatus(
        order.X,
        order.z
      ),
      orderId: order.i,
      positionSide: order.ps,
      pnlAmount: order.rp,
      clientOrderId: order.c,
      executedTime: order.T,
      leverage,
      orderSide,
      fee: BigNumber(order.n).abs().toFixed(),
      feeCurrency: order.N
    };

    this.emit('orderUpdated', formattedOrder);
  }

  private _onAccountUpdated(data) {
    const formattedBalances = data.B.filter(balance => {
      return balance.a == CURRENCY_USDT;
    }).map(balance => {
      return {
        asset: balance.a,
        availableBalance: balance.cw, //Wallet balance excluding isolated margin
        balance: balance.wb,
        amount: balance.bc,
        usdtBalance: balance.wb
      };
    });

    if ([TransactionType.DEPOSIT, TransactionType.WITHDRAW].includes(data.m)) {
      this.emit('transactionCreated', {
        transactions: formattedBalances,
        type: data.m
      });
    }

    this.emit('balanceUpdated', formattedBalances);
  }

  private _formatOrderbook(orderbook) {
    return orderbook.map(item => {
      return {
        price: item[0],
        quantity: item[1]
      };
    });
  }

  private _parseOrderSide(order) {
    const tradeSide = order.S;
    const positionSide = order.ps;

    if (
      (tradeSide === OrderSide.BUY && positionSide === PositionSide.LONG) ||
      (tradeSide === OrderSide.SELL && positionSide === PositionSide.SHORT)
    ) {
      return OrderType.OPEN;
    }

    return OrderType.CLOSE;
  }

  private async _initLeverage() {
    if (isEmpty(this.apiConfig)) {
      return;
    }

    const exchangeApi = new BingXFutureAPI(this.apiConfig);
    const positions = await exchangeApi.getPositions();

    this.leverages = positions.map(ps => ({
      symbol: ps.symbol,
      longLeverage: ps.positionSide == 'LONG' ? ps.leverage : null,
      shortLeverage: ps.positionSide == 'SHORT' ? ps.leverage : null
    }));
  }

  private async _getOrderLeverage(order) {
    let orderLeverage = this.leverages.find(leverage => {
      return leverage.symbol == order.s;
    });

    if (isEmpty(orderLeverage)) {
      const response = await this._requestAPI('GET', '/openApi/swap/v2/trade/leverage', {
        symbol: order.s
      });
      const leverageData = response.data;

      orderLeverage = {
        symbol: order.s,
        longLeverage: leverageData.longLeverage,
        shortLeverage: leverageData.shortLeverage,
      };

      this.leverages.push(orderLeverage);
    }

    return order.ps == PositionSide.LONG ? orderLeverage.longLeverage : orderLeverage.shortLeverage;
  }
}

export default BingXFutureWsClient;