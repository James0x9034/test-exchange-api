import BigNumber from 'bignumber.js';
import {
  forEach,
  isEmpty
} from 'lodash';
import {
  isJsonString
} from '../Utils';
import BitgetSpotAPI from './API';
import BaseWS from '../BaseWS';
import {
  type ApiConfig
} from '../../../libs/RequestConfig';
import {
  type ExchangeWsParams
} from '../RequestParams';
import {
  type WsBalanceData,
  type WsKlineData,
  type WsOrderData,
  type WsTradeData
} from '../ResponseData';
import {
  Currency,
  ExchangeMode,
  OrderStatus,
  OrderbookType
} from '../../../libs/Consts';
import {
  ExchangeOrderSide,
  ExchangeOrderStatus,
  ExchangeOrderType
} from '../Consts';
import {
  type Fee
} from '../../../libs/ResponseConfig';
import {
  isStableCoin
} from '../../../libs/Utils';
import {
  KlineConfig
} from 'exchanges/binance/RequestParams';

class BitgetSpotWSClient extends BaseWS {
  private readonly exchangeApi: BitgetSpotAPI;

  constructor (apiConfig: ApiConfig = {}) {
    super('wss://ws.bitget.com/spot/v1/stream', apiConfig);

    this.exchangeApi = new BitgetSpotAPI(apiConfig);
  }

  subscribePriceChannels(symbols: string[]) {
    const formattedChannels = symbols.map(symbol => {
      const arrSymbol = symbol.split('_');

      return{
        instType: 'sp',
        channel: 'trade',
        instId: arrSymbol[0]
      };
    });

    this.send({
      op: 'subscribe',
      args: formattedChannels
    });
  }

  subscribeKlineChannels(symbolConfigs: KlineConfig[]) {
    const formattedChannels = symbolConfigs.map(config => {
      const arrSymbol = config.symbol.split('_');
      const formattedInterval = this.formatRequestKlineInterval(config.interval);
      return{
        instType: 'sp',
        channel: `candle${formattedInterval}`,
        instId: arrSymbol[0]
      };
    });

    this.send({
      op: 'subscribe',
      args: formattedChannels
    });
  }

  subscribeOrderbookChannels(symbols: string[], level: number = 5) {
    const formattedChannels = symbols.map(symbol => {
      const arrSymbol = symbol.split('_');
      return {
        instType: 'sp',
        channel: `books${level}`,
        instId: arrSymbol[0]
      };
    });

    this.send({
      op: 'subscribe',
      args: formattedChannels
    });
  }

  subscribeKlineChannel (symbol: string, interval: string) {
    const arrSymbol = symbol.split('_');
    const formattedInterval = this.formatRequestKlineInterval(interval);
    const params: ExchangeWsParams[] = [
      {
        instType: 'sp',
        channel: `candle${formattedInterval}`,
        instId: arrSymbol[0]
      }
    ];

    this.send({
      op: 'subscribe',
      args: params
    });
  }

  subscribePriceChannel (symbol: string) {
    const arrSymbol = symbol.split('_');
    const tradeChannelParams: ExchangeWsParams[] = [
      {
        instType: 'sp',
        channel: 'trade',
        instId: arrSymbol[0]
      }
    ];

    this.send({
      op: 'subscribe',
      args: tradeChannelParams
    });
  }

  subscribeOrderbookChannel (symbol: string, level = 5) {
    const arrSymbol = symbol.split('_');
    const params: ExchangeWsParams[] = [
      {
        instType: 'sp',
        channel: `books${level}`,
        instId: arrSymbol[0]
      }
    ];

    this.send({
      op: 'subscribe',
      args: params
    });
  }

  subscribeOrderChannel () {
    const orderChannelParams: ExchangeWsParams[] = [
      {
        channel: 'orders',
        instType: 'spbl',
        instId: 'default'
      }
    ];

    this.send({
      op: 'subscribe',
      args: orderChannelParams
    });
  }

  subscribeAccountChannel () {
    const accountParams: ExchangeWsParams[] = [
      {
        channel: 'account',
        instType: 'spbl',
        instId: 'default'
      }
    ];

    this.send({
      op: 'subscribe',
      args: accountParams
    });
  }

  async onMessage (message: string) {
    if (message === 'pong') {
      this.clearPongTimeout(); return;
    }

    if (!isJsonString(message)) {
      return;
    }

    const parsedMessage = JSON.parse(message);

    if (parsedMessage.event === 'login' && parsedMessage.code == 0) {
      this.subscribeOrderChannel();
      this.subscribeAccountChannel();
      return;
    }

    const { action, arg, data } = parsedMessage;
    const channel = arg?.channel;

    if (channel === 'orders') {
      await this.onOrdersUpdated(data); return;
    }

    if (channel === 'account') {
      this.onBalanceUpdated(data); return;
    }

    if (channel.includes('candle') && action == 'update') {
      this.onKlineUpdated(channel, arg.instId, data); return;
    }

    if (channel === 'trade' && action == 'update') {
      this.onTradeUpdated(data, arg.instId); return;
    }

    if (channel.includes('books')) {
      this.onOrderbookUpdated(data, arg.instId);
    }
  }

  onKlineUpdated (channel: string, symbol: string, klines: WsKlineData[]) {
    const interval = channel.substring(6).toLowerCase();

    for (const kline of klines) {
      const formattedKline = this.formatKline(kline);

      this.emit('klineUpdated', {
        symbol,
        interval,
        ...formattedKline
      });
    }
  }

  onTradeUpdated (trades: WsTradeData[], symbol: string) {
    for (const trade of trades) {
      const formattedTrade = this.formatTrade(trade);

      this.emit('priceUpdated', {
        symbol,
        ...formattedTrade
      });
    }
  }

  onOrderbookUpdated (orderbooks: any, instrument: string) {
    if (isEmpty(orderbooks)) {
      return;
    }

    for (const orderbook of orderbooks) {
      orderbook.bids = this.formatOrderbook(orderbook.bids);
      orderbook.asks = this.formatOrderbook(orderbook.asks);
      orderbook.symbol = `${instrument}_SPBL`;
      orderbook.type = OrderbookType.SNAPSHOT;
      orderbook.mode = ExchangeMode.Spot;

      this.emit('orderbookUpdated', orderbook);
    }
  }

  async onOrdersUpdated (orders: WsOrderData[]) {
    if (isEmpty(orders)) {
      return;
    }

    for (const order of orders) {
      let quantity = order.sz;

      if (
        order.ordType == ExchangeOrderType.MARKET &&
        order.side == ExchangeOrderSide.BUY
      ) {
        quantity = order.accFillSz;
      }

      const executedResult = await this.calculateFilled(order);
      const formattedOrder = {
        orderId: order.ordId,
        clientOrderId: order.clOrdId,
        symbol: order.instId,
        side: order.side.toUpperCase(),
        price: order.px,
        quantity,
        status: this.parseOrderStatus(order),
        ...executedResult
      };

      this.emit('orderUpdated', formattedOrder);
    }
  }

  onBalanceUpdated (accounts: WsBalanceData[]) {
    if (isEmpty(accounts)) {
      return;
    }

    const formattedBalances = accounts.map((account) => {
      return {
        asset: account.coinName,
        availableBalance: account.available,
        balance: BigNumber(account.available).plus(account.lock).toFixed()
      };
    });

    this.emit('balanceUpdated', formattedBalances);
  }

  async calculateFilled (order: WsOrderData) {
    const { orderFee, instId } = order;
    const result = {
      executedPrice: order.avgPx,
      executedQuantity: order.accFillSz,
      receivedQuantity: order.accFillSz
    };

    if (isEmpty(orderFee)) {
      return result;
    }

    const fees: Fee[] = [];

    forEach(orderFee, (feeDetail) => {
      const totalFee = BigNumber(feeDetail.fee).abs().toFixed();
      const coin = feeDetail.feeCcy;

      if (this.isBaseAsset(coin, instId)) {
        result.receivedQuantity = BigNumber(result.receivedQuantity)
          .minus(totalFee)
          .toFixed();
      }

      const existFee = fees.find((item) => {
        return item.commissionAsset == coin;
      });

      if (existFee) {
        existFee.commission = BigNumber(existFee.commission)
          .plus(totalFee)
          .toFixed();
        return;
      }

      const assetFee = {
        commissionAsset: coin,
        commission: totalFee
      };

      fees.push(assetFee);
    });

    let fee: number | string = 0;
    let feeCurrency: string | undefined;

    if (fees.length == 1) {
      const feeItem = fees[0];

      fee = feeItem.commission;
      feeCurrency = feeItem.commissionAsset;
    } else {
      const usdtFee = await this.parseFeesToUsdt(fees, order);

      fee = usdtFee;
      feeCurrency = Currency.USDT;
    }

    return {
      ...result,
      fee,
      feeCurrency
    };
  }

  async parseFeesToUsdt (fees: Fee[], order: any) {
    const { executedPrice, instId } = order;
    let usdtFee = BigNumber(0);

    for (const fee of fees) {
      const { commissionAsset, commission } = fee;

      if (commissionAsset == Currency.USDT || isStableCoin(commissionAsset)) {
        usdtFee = usdtFee.plus(commission);
        continue;
      }

      if (this.isBaseAsset(commissionAsset, instId)) {
        const arrSymbol = instId.split('_');
        const quoteAsset = arrSymbol[0].substring(commissionAsset.length);

        if (quoteAsset == Currency.USDT) {
          usdtFee = BigNumber(executedPrice)
            .multipliedBy(commission)
            .plus(usdtFee);
          continue;
        }
      }

      const ticker = await this.exchangeApi.getTicker(
        `${commissionAsset}USDT_SPBL`
      );

      usdtFee = BigNumber(ticker.price || 0)
        .multipliedBy(commission)
        .plus(usdtFee);
    }

    return usdtFee.toFixed();
  }

  formatRequestKlineInterval (interval: string) {
    const intervalLength = interval.length;
    const unit = interval.substring(intervalLength - 1);

    if (['h', 'd', 'w'].includes(unit)) {
      const formattedInterval = interval.toUpperCase();

      return intervalLength == 1 ? `1${formattedInterval}` : formattedInterval;
    }

    return interval;
  }

  parseOrderStatus ({ status, accFillSz }: WsOrderData) {
    if (
      accFillSz &&
      BigNumber(accFillSz).isGreaterThan(0) &&
      status == ExchangeOrderStatus.CANCELLED
    ) {
      return OrderStatus.EXECUTED;
    }

    switch (status) {
      case ExchangeOrderStatus.INIT:
      case ExchangeOrderStatus.NEW:
        return OrderStatus.PENDING;
      case ExchangeOrderStatus.SOCKET_PARTIAL_FILL:
        return OrderStatus.EXECUTING;
      case ExchangeOrderStatus.SOCKET_FULL_FILL:
        return OrderStatus.EXECUTED;
      case ExchangeOrderStatus.CANCELLED:
        return OrderStatus.CANCELED;
    }
  }

  isBaseAsset (asset: string, symbol: string) {
    const assetLength = asset.length;
    const firstSymbolAsset = symbol.substring(0, assetLength);

    return asset == firstSymbolAsset;
  }
}

export default BitgetSpotWSClient;
