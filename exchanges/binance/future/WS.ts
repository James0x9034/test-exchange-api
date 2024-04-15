import {
  isEmpty
} from 'lodash';
import BaseWS from '../BaseWS';
import {
  formatOrderStatus
} from '../Utils';
import BinanceFutureAPI from './API';
import {
  type ApiConfig
} from '../../../libs/RequestConfig';
import {
  type WsAccountConfigData,
  type WsAccountData,
  type WsKlineData,
  type WsOrderData,
  type WsFutureOrderbookData,
  type WsTradeData
} from '../ResponseData';
import {
  TransactionType
} from '../Consts';
import {
  CURRENCY_USDT,
  ExchangeMode,
  OrderSide,
  OrderType,
  OrderbookType,
  PositionSide
} from '../../../libs/Consts';
import {
  type FormattedPosition
} from '../../../libs/ResponseConfig';
import {
  KlineConfig
} from '../RequestParams';

class BinanceFutureWsClient extends BaseWS {
  private positions: FormattedPosition[];

  constructor(apiConfig: ApiConfig = {}) {
    super(apiConfig);
    this.positions = [];
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

  subscribePriceChannel(symbol: string) {
    const channelParams = [`${symbol.toLowerCase()}@aggTrade`];
    this.subscribe(channelParams);
  }

  subscribeKlineChannel(symbol: string, interval: string) {
    const channelParams = [`${symbol.toLowerCase()}@kline_${interval}`];
    this.subscribe(channelParams);
  }

  subscribeOrderbookChannel(symbol: string, level: number = 5) {
    const channelParams = [`${symbol.toLowerCase()}@depth${level}`];
    this.subscribe(channelParams);
  }

  protected onOpen() {
    super.onOpen();
    this.getCustomerPositionsIfNeed();
  }

  protected onMessage(message: string) {
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
      case 'ORDER_TRADE_UPDATE': {
        this.onOrderUpdated(messageData.o);
        return;
      }
      case 'ACCOUNT_UPDATE': {
        this.onAccountUpdated(messageData.a);
        return;
      }
      case 'kline': {
        this.onKlineUpdated(messageData.k);
        return;
      }
      case 'listenKeyExpired': {
        this.restartSocket();
        return;
      }
      case 'ACCOUNT_CONFIG_UPDATE': {
        this.onAccountConfigUpdated(messageData);
        return;
      }
      case 'depthUpdate': {
        this.onOrderbookUpdated(messageData);
      }
    }
  }

  protected getWsUrl(): string {
    if (isEmpty(this.apiConfig)) {
      return 'wss://fstream.binance.com/stream';
    }

    return `wss://fstream.binance.com/ws/${this.listenKey}`;
  }

  protected getApiUrl(): string {
    return 'https://fapi.binance.com';
  }

  protected getListenKeyUri(): string {
    return '/fapi/v1/listenKey';
  }

  private onAccountUpdated(data: WsAccountData) {
    const formattedBalances = data.B.filter((balance: any) => {
      return balance.a == CURRENCY_USDT;
    }).map((balance: any) => {
      return {
        asset: balance.a,
        availableBalance: balance.cw,
        balance: balance.wb,
        amount: balance.bc, // deposit/withdraw amount
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

  private onTradeUpdated(trade: WsTradeData) {
    this.emit('priceUpdated', this.formatTrade(trade));
  }

  private onOrderbookUpdated(orderbook: WsFutureOrderbookData) {
    const formattedOrderbook = {
      symbol: orderbook.s,
      bids: this.formatOrderbook(orderbook.b),
      asks: this.formatOrderbook(orderbook.a),
      type: OrderbookType.SNAPSHOT,
      mode: ExchangeMode.Future
    };

    this.emit('orderbookUpdated', formattedOrderbook);
  }

  private onOrderUpdated(order: WsOrderData) {
    const formattedOrder = {
      symbol: order.s,
      baseSymbol: order.s,
      side: order.S,
      orderType: order.o,
      originalQuantity: order.q,
      originalPrice: order.p,
      executedPrice: order.ap,
      executedQuantity: order.z,
      receivedQuantity: order.z,
      lastExecutedQuantity: order.l,
      status: formatOrderStatus(order.X, order.z),
      orderId: order.i,
      positionSide: order.ps,
      pnlAmount: order.rp,
      clientOrderId: order.c,
      executedTime: order.T,
      leverage: this.getOrderLeverage(order),
      orderSide: this.parseOrderSide(order),
      fee: order.n,
      feeCurrency: order.N
    };

    this.emit('orderUpdated', formattedOrder);
  }

  private onKlineUpdated(kline: WsKlineData) {
    this.emit('klineUpdated', this.formatKline(kline));
  }

  private onAccountConfigUpdated(config: WsAccountConfigData) {
    if (!config.ac) {
      return;
    }

    const updatedPosition = config.ac;
    const positions = this.positions.filter((item) => {
      return item.symbol === updatedPosition.s;
    });

    for (const position of positions) {
      position.leverage = updatedPosition.l;
    }
  }

  private async getCustomerPositionsIfNeed() {
    if (isEmpty(this.apiConfig)) {
      return;
    }

    const exchangeApi = new BinanceFutureAPI(this.apiConfig);

    this.positions = await exchangeApi.getPositions();
  }

  private getOrderLeverage(order: WsOrderData) {
    const symbol = order.s;
    const positionSide = order.ps;
    const currentPosition = this.positions.find((position: any) => {
      return (
        position.symbol === symbol && position.positionSide === positionSide
      );
    });

    return currentPosition?.leverage;
  }

  private parseOrderSide(order: WsOrderData): OrderType {
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
}

export default BinanceFutureWsClient;