import BigNumber from 'bignumber.js';
import {
  isEmpty
} from 'lodash';

import BaseWS from '../BaseWS';
import {
  formatOrderStatus
} from '../Utils';
import {
  type WsKlineData,
  type WsOrderData,
  type WsSpotOrderbookData,
  type WsSpotBalance,
  type WsTradeData,
  type WsTransactionData
} from '../ResponseData';
import {
  ExchangeMode,
  OrderbookType
} from '../../../libs/Consts';
import {
  type ApiConfig
} from '../../../libs/RequestConfig';
import {
  KlineConfig
} from '../RequestParams';

class BinanceSpotWsClient extends BaseWS {
  constructor (apiConfig: ApiConfig = {}) {
    super(apiConfig);
  }

  subscribePriceChannels(symbols: string[]) {
    const formattedChannels = symbols.map(symbol => {
      return `${symbol.toLowerCase()}@aggTrade`;
    });

    this.subscribe(formattedChannels);
  }

  subscribeOrderbookChannels(symbols: string[], level: number = 5) {
    const formattedChannels = symbols.map(symbol => {
      return `${symbol.toLowerCase()}@depth${level}`;
    });

    this.subscribe(formattedChannels);
  }

  subscribeKlineChannels(symbolConfigs: KlineConfig[]) {
    const formattedChannels = symbolConfigs.map(config => {
      return `${config.symbol.toLowerCase()}@kline_${config.interval}`;
    });

    this.subscribe(formattedChannels);
  }

  subscribeKlineChannel (symbol: string, interval: string) {
    const channelParams = [`${symbol.toLowerCase()}@kline_${interval}`];
    this.subscribe(channelParams);
  }

  subscribePriceChannel (symbol: string) {
    const channelParams = [`${symbol.toLowerCase()}@aggTrade`];
    this.subscribe(channelParams);
  }

  subscribeOrderbookChannel (symbol: string, level: number = 5) {
    const channelParams = [`${symbol.toLowerCase()}@depth${level}`];
    this.subscribe(channelParams);
  }

  protected onMessage (message: string) {
    const parsedMessage = JSON.parse(message);
    const messageData = parsedMessage.data || parsedMessage;

    if (!messageData) {
      return;
    }

    switch (messageData.e) {
      case 'aggTrade': {
        this.onTradeUpdated(messageData);
        return;
      }
      case 'kline': {
        this.onKlineUpdated(messageData);
        return;
      }
      case 'balanceUpdate': {
        this.onBalanceUpdated(messageData);
        return;
      }
      case 'executionReport': {
        this.onOrderUpdated(messageData);
        return;
      }
      case 'outboundAccountPosition': {
        this.onAccountUpdated(messageData.B);
        return;
      }
    }

    const messageStream = parsedMessage.stream;

    if (messageStream?.includes('depth')) {
      this.onOrderbookUpdated(messageData, messageStream);
    }
  }

  private onTradeUpdated (trade: WsTradeData) {
    this.emit('priceUpdated', this.formatTrade(trade));
  }

  private onKlineUpdated (kline: WsKlineData) {
    this.emit('klineUpdated', this.formatKline(kline));
  }

  private onOrderbookUpdated (orderbooks: WsSpotOrderbookData, channel: string) {
    const arrChannel = channel.split('@');
    const formattedOrderbook = {
      symbol: arrChannel[0].toUpperCase(),
      bids: this.formatOrderbook(orderbooks.bids),
      asks: this.formatOrderbook(orderbooks.asks),
      type: OrderbookType.SNAPSHOT,
      mode: ExchangeMode.Spot
    };

    this.emit('orderbookUpdated', formattedOrderbook);
  }

  private onBalanceUpdated (transaction: WsTransactionData) {
    const formattedTransaction = {
      coin: transaction.a,
      amount: transaction.d
    };

    this.emit('transactionUpdated', formattedTransaction);
  }

  private onAccountUpdated (balances: WsSpotBalance[]) {
    const formattedBalances = balances.map((balance) => {
      return {
        asset: balance.a,
        availableBalance: balance.f,
        balance: BigNumber(balance.f).plus(balance.l).toFixed()
      };
    });

    this.emit('balanceUpdated', formattedBalances);
  }

  private onOrderUpdated (order: WsOrderData) {
    const executedResult = this.calculateFilled(order);
    const formattedOrder = {
      orderId: order.i,
      clientOrderid: order.c,
      symbol: order.s,
      side: order.S,
      price: order.p,
      quantity: order.q,
      status: formatOrderStatus(order.X, order.z),
      ...executedResult
    };

    this.emit('orderUpdated', formattedOrder);
  }

  private calculateFilled (order: WsOrderData) {
    const symbol = order.s;
    const result = {
      executedPrice: order.L,
      executedQuantity: order.z,
      receivedQuantity: order.z,
      fee: order.n,
      feeCurrency: order.N
    };

    if (BigNumber(result.fee).isEqualTo(0)) {
      return result;
    }

    if (this.isBaseAsset(result.feeCurrency, symbol)) {
      result.receivedQuantity = BigNumber(result.executedQuantity)
        .minus(result.fee)
        .toFixed();
    }

    return result;
  }

  private isBaseAsset (asset: string, symbol: string) {
    const assetLength = asset.length;
    const firstSymbolAsset = symbol.substring(0, assetLength);

    return asset == firstSymbolAsset;
  }

  protected getWsUrl () {
    if (isEmpty(this.apiConfig)) {
      return 'wss://stream.binance.com:9443/stream';
    }

    return `wss://stream.binance.com:9443/stream?streams=${this.listenKey}`;
  }

  protected getApiUrl () {
    return 'https://api.binance.com';
  }

  protected getListenKeyUri () {
    return '/api/v3/userDataStream';
  }
}

export default BinanceSpotWsClient;
