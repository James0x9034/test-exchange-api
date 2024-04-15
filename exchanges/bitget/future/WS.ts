import BigNumber from 'bignumber.js';
import {
  isEmpty
} from 'lodash';
import BaseWS from '../BaseWS';
import {
  isJsonString
} from '../Utils';
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
  CURRENCY_USDT,
  Currency,
  ExchangeMode,
  OrderSide,
  OrderStatus,
  OrderType,
  OrderbookType,
  PositionSide
} from '../../../libs/Consts';
import {
  KlineConfig
} from 'exchanges/binance/RequestParams';

class BitgetFutureWSClient extends BaseWS {
  constructor (apiConfig: ApiConfig = {}) {
    super('wss://ws.bitget.com/mix/v1/stream', apiConfig);
  }

  subscribePriceChannels(symbols: string[]) {
    const formattedChannels = symbols.map(symbol => {
      const arrSymbol = symbol.split('_');

      return{
        instType: 'mc',
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
      const formattedInterval = this.formarRequestKlineInterval(config.interval);
      return{
        instType: 'mc',
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
        instType: 'mc',
        channel: `books${level}`,
        instId: arrSymbol[0]
      };
    });

    this.send({
      op: 'subscribe',
      args: formattedChannels
    });
  }

  subscribePriceChannel (symbol: string) {
    const arrSymbol = symbol.split('_');
    const tradeChannelParams: ExchangeWsParams[] = [
      {
        instType: 'mc',
        channel: 'trade',
        instId: arrSymbol[0]
      }
    ];

    this.send({
      op: 'subscribe',
      args: tradeChannelParams
    });
  }

  subscribeKlineChannel (symbol: string, interval: string) {
    const arrSymbol = symbol.split('_');
    const formattedInterval = this.formarRequestKlineInterval(interval);
    const params: ExchangeWsParams[] = [
      {
        instType: 'mc',
        channel: `candle${formattedInterval}`,
        instId: arrSymbol[0]
      }
    ];

    this.send({
      op: 'subscribe',
      args: params
    });
  }

  subscribeOrderbookChannel (symbol: string, level = 5) {
    const arrSymbol = symbol.split('_');
    const params: ExchangeWsParams[] = [
      {
        instType: 'mc',
        channel: `books${level}`,
        instId: arrSymbol[0]
      }
    ];

    this.send({
      op: 'subscribe',
      args: params
    });
  }

  protected onMessage (message: string) {
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

    if (!data) {
      return;
    }

    const channel = arg?.channel;

    if (channel === 'orders') {
      this.onOrdersUpdated(data); return;
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

  private subscribeOrderChannel () {
    const orderChannelParams: ExchangeWsParams[] = [
      {
        channel: 'orders',
        instType: 'UMCBL',
        instId: 'default'
      }
    ];

    this.send({
      op: 'subscribe',
      args: orderChannelParams
    });
  }

  private subscribeAccountChannel () {
    const accountParams: ExchangeWsParams[] = [
      {
        channel: 'account',
        instType: 'UMCBL',
        instId: 'default'
      }
    ];

    this.send({
      op: 'subscribe',
      args: accountParams
    });
  }

  private onKlineUpdated (
    channel: string,
    symbol: string,
    klines: WsKlineData[]
  ) {
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

  private onTradeUpdated (trades: WsTradeData[], symbol: string) {
    for (const trade of trades) {
      const formattedTrade = this.formatTrade(trade);

      this.emit('priceUpdated', {
        symbol,
        ...formattedTrade
      });
    }
  }

  private onOrderbookUpdated (orderbooks: any, instrument: string) {
    if (isEmpty(orderbooks)) {
      return;
    }

    for (const orderbook of orderbooks) {
      orderbook.bids = this.formatOrderbook(orderbook.bids);
      orderbook.asks = this.formatOrderbook(orderbook.asks);
      orderbook.symbol = `${instrument}_UMCBL`;
      orderbook.type = OrderbookType.SNAPSHOT;
      orderbook.mode = ExchangeMode.Future;

      this.emit('orderbookUpdated', orderbook);
    }
  }

  private onOrdersUpdated (orders: WsOrderData[]) {
    orders.forEach((order) => {
      const instrument = order.instId;
      const arrInstrument = instrument.split('_');
      const feeCurrency = order.orderFee.find((item: any) => {
        return item.feeCcy === Currency.USDT;
      });
      const formattedOrder = {
        symbol: instrument,
        baseSymbol: arrInstrument[0],
        side: order.side.toUpperCase(),
        orderType: order.ordType.toUpperCase(),
        originalQuantity: order.sz,
        originalPrice: order.px,
        executedPrice: order.avgPx,
        executedQuantity: order.accFillSz,
        receivedQuantity: order.accFillSz,
        status: this.parseOrderStatus(order),
        orderId: order.ordId,
        positionSide: order.posSide.toUpperCase(),
        pnlAmount: order.pnl,
        clientOrderId: order.clOrdId,
        executedTime: order.fillTime,
        leverage: order.lever,
        orderSide: this.parseOrderSide(order),
        fee: BigNumber(feeCurrency?.fee || 0)
          .abs()
          .toFixed(),
        feeCurrency: feeCurrency?.feeCcy
      };

      this.emit('orderUpdated', formattedOrder);
    });
  }

  private onBalanceUpdated (balances: WsBalanceData[]) {
    const formattedBalances = balances.filter(balance => {
      return balance.marginCoin == CURRENCY_USDT;
    }).map((balance) => {
      return {
        asset: balance.marginCoin,
        availableBalance: balance.available,
        balance: balance.equity,
        usdtBalance: balance.equity
      };
    });

    this.emit('balanceUpdated', formattedBalances);
  }

  private parseOrderSide (order: WsOrderData) {
    const side = order.side.toUpperCase();
    const positionSide = order.posSide.toUpperCase();

    if (
      (side == OrderSide.BUY && positionSide == PositionSide.LONG) ||
      (side == OrderSide.SELL && positionSide == PositionSide.SHORT)
    ) {
      return OrderType.OPEN;
    }

    return OrderType.CLOSE;
  }

  private parseOrderStatus ({ status, accFillSz }: WsOrderData) {
    if (
      accFillSz &&
      BigNumber(accFillSz).isGreaterThan(0) &&
      status == 'cancelled'
    ) {
      return OrderStatus.EXECUTED;
    }

    switch (status) {
      case 'new':
        return OrderStatus.PENDING;
      case 'partial-fill':
        return OrderStatus.EXECUTING;
      case 'full-fill':
        return OrderStatus.EXECUTED;
      case 'cancelled':
        return OrderStatus.CANCELED;
    }
  }

  private formarRequestKlineInterval (interval: string) {
    const unit = interval.substring(interval.length - 1);

    if (unit === 'm') {
      return interval.toLowerCase();
    }

    return interval.toUpperCase();
  }
}

export default BitgetFutureWSClient;
