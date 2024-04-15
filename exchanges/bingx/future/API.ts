import {
  Currency,
  ExchangeMode,
  OrderSide,
  OrderStatus,
  OrderType,
  PositionSide
} from '../../../libs/Consts';
import BaseAPI from '../BaseAPI';
import {
  formatOrderbook,
  getTimeRanges,
  intervalToMilis,
  sleep
} from '../../../libs/Utils';
import {
  ExchangeOrderType,
  MAXIMUM_KLINE_LIMIT,
  TimeInForce,
  URL_FUTURE_PREFIX
} from '../Consts';
import {
  FormattedBalance,
  FormattedExchangeOrderBook,
  FormattedKline,
  FormattedOrder,
  FormattedPosition,
  FormattedTicker,
  FormattedTrade
} from '../../../libs/ResponseConfig';
import {
  ApiConfig,
  CancelOrderPayload,
  ChangeAccountConfigPayload,
  GetKlinesPayload, GetOrderPayload,
  GetOrderbooksRequest,
  PlaceFutureOrderPayload
} from '../../../libs/RequestConfig';
import BigNumber from 'bignumber.js';
import FutureAPIInterface from '../../../libs/BaseInterfaces/FutureApiInterface';
import {
  formatOrderStatus
} from '../Utils';

class BingXFutureAPI extends BaseAPI implements FutureAPIInterface {
  constructor(apiConfig: ApiConfig = {}) {
    super(apiConfig);
  }

  async placeOrder(payload: PlaceFutureOrderPayload): Promise<FormattedOrder | any> {
    const {
      isFullResponse = true
    } = payload;
    const params = this._parsePlacingOrderParams(payload);
    const response = await this.makeRequest('POST', this._getFutureAPIURL('/trade/order'), params);
    const order = response.order;

    if (!isFullResponse) {
      return {
        orderId: order.orderId,
        clientOrderId: order.clientOrderID,
        status: OrderStatus.PENDING
      };
    }

    await sleep(2000);

    return this.getOrderDetail({
      orderId: order.orderId,
      clientOrderId: order.clientOrderID,
      symbol: order.symbol
    });
  }

  // TODO: not working at this moment
  async placeBatchOrder(payloads: PlaceFutureOrderPayload[]): Promise<FormattedOrder[] | any> {
    const path = '/openApi/swap/v2/trade/batchOrders';
    const formattedPayloads = payloads.map(payload => {
      return this._parsePlacingOrderParams(payload);
    });
    const params = {
      batchOrders: formattedPayloads
    };
    const response = await this.makeRequest('POST', path, params);

    return response;
  }

  async cancelOrder({
    symbol,
    orderId,
    clientOrderId
  }: CancelOrderPayload): Promise<FormattedOrder> {
    const params: any = {
      symbol
    };

    if (clientOrderId) {
      params.clientOrderID = clientOrderId;
    } else {
      params.orderId = orderId;
    }

    const response = await this.makeRequest('DELETE', this._getFutureAPIURL('/trade/order'), params);

    return this._formatOrder(response.order);
  }

  async getOrderDetail({
    orderId,
    clientOrderId,
    symbol
  }: GetOrderPayload): Promise<FormattedOrder> {
    const params: any = {
      symbol
    };

    if (clientOrderId) {
      params.clientOrderID = clientOrderId;
    } else {
      params.orderId = orderId;
    }

    const response = await this.makeRequest('GET', this._getFutureAPIURL('/trade/order'), params);

    return this._formatOrder(response.order);
  }

  async getTicker(symbol?: string): Promise<FormattedTicker> {
    const params: any = {};

    if (symbol) {
      params.symbol = symbol;
    }

    const tickers = await this.makeRequest('GET', this._getFutureAPIURL('/quote/ticker'), params, true);

    if (symbol) {
      return {
        symbol: tickers.symbol,
        price: tickers.lastPrice
      };
    }

    const formattedTickers = tickers.map((ticker) => ({
      symbol: ticker.symbol,
      price: ticker.lastPrice
    }));

    return formattedTickers;
  }

  async getOrderbooks(payload: GetOrderbooksRequest):Promise<FormattedExchangeOrderBook>{
    const orderbook = await this.makeRequest(
      'GET',
      this._getFutureAPIURL('/quote/depth'),
      payload
    );

    return {
      symbol: payload.symbol,
      bids: formatOrderbook(orderbook.bids),
      asks: formatOrderbook(orderbook.asks),
      mode: ExchangeMode.Future
    };
  }

  async getKlines({
    symbol,
    interval,
    limit
  }: GetKlinesPayload): Promise<FormattedKline[]> {
    let chartData = [];
    const currentTimestamp = Date.now();
    const intervalInMilis = intervalToMilis(interval);
    const fromTime = currentTimestamp - (intervalInMilis * limit);
    const timeRanges = getTimeRanges(interval, fromTime, currentTimestamp, MAXIMUM_KLINE_LIMIT);
    const totalTimeRanges = timeRanges.length;

    for (let i = 0; i < totalTimeRanges; i++) {
      const timeRange = timeRanges[i];
      const klines = await this.makeRequest('GET', this._getFutureAPIURL('/quote/klines'), {
        symbol,
        interval,
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
        limit: MAXIMUM_KLINE_LIMIT
      }, true);
      const formattedKlines = klines.map((kline) => {
        const closeTime = BigNumber(kline.time).plus(intervalInMilis - 1).toString();

        return {
          open: kline.open,
          close: kline.close,
          high: kline.high,
          low: kline.low,
          volume: kline.volume,
          openTime: kline.time,
          closeTime,
          symbol,
          interval
        };
      });

      if (i == totalTimeRanges - 1) {
        formattedKlines.pop();
      }

      chartData = chartData.concat(formattedKlines);
    }

    return chartData;
  }

  async getPositions(symbol?: string): Promise<FormattedPosition[]> {
    const params: any = {};

    if (symbol) {
      params.symbol = symbol;
    }

    const response = await this.makeRequest('GET', this._getFutureAPIURL('/user/positions'), params);

    return response.map((position) => ({
      symbol: position.symbol,
      baseSymbol: position.symbol,
      leverage: position.leverage,
      positionSide: position.positionSide,
      quantity: BigNumber(position.positionAmt).abs().toFixed(),
      entryPrice: position.avgPrice
    }));
  }

  async getBalances(): Promise<FormattedBalance[]> {
    const response = await this.makeRequest('GET', this._getFutureAPIURL('/user/balance'));
    const balance = response.balance;

    return [{
      asset: balance.asset,
      availableBalance: balance.availableMargin,
      balance: balance.balance
    }];
  }

  async getLatestTrade(symbol: string): Promise<FormattedTrade> {
    const trades = await this.makeRequest('GET', this._getFutureAPIURL('/quote/trades'), {
      symbol,
      limit: 1
    }, true);
    const latestTrade = trades[0] || {};

    return {
      price: latestTrade.price,
      quantity: latestTrade.qty,
      time: latestTrade.time
    };
  }

  async changeMarginLeverage({
    symbol,
    marginType,
    leverage,
    side
  }: ChangeAccountConfigPayload) {
    this._switchMarginMode({
      symbol,
      marginType
    });
    this._changeLeverage({
      symbol,
      leverage,
      side
    });
  }

  changePositionMode: (symbol: string, enableHedgeMode: boolean) => Promise<any>;

  getMaximumBatchOrder() {
    return 10;
  }

  private _formatOrder(order) {
    return {
      orderId: order.orderId,
      price: order.price,
      quantity: order.origQty,
      executedPrice: order.avgPrice,
      executedQuantity: order.executedQty,
      receivedQuantity: order.executedQty,
      executedTime: order.updateTime,
      clientOrderId: order.clientOrderId,
      status: formatOrderStatus(order.status, order.executedQty),
      fee: BigNumber(order.commission).abs().toFixed(),
      feeCurrency: Currency.USDT,
      orderType: order.type?.toLowerCase()
    };
  }

  private _changeLeverage({
    symbol,
    side,
    leverage
  }) {
    const parsedLeverage = leverage.toString();
    const params = {
      symbol,
      side,
      leverage: parsedLeverage
    };

    return this.makeRequest('POST', this._getFutureAPIURL('/trade/leverage'), params);
  }

  private _switchMarginMode({
    symbol,
    marginType
  }) {
    const params = {
      symbol,
      marginType
    };

    return this.makeRequest('POST', this._getFutureAPIURL('/trade/marginType'), params);
  }

  private _getFutureAPIURL(uri) {
    return `${URL_FUTURE_PREFIX}${uri}`;
  }

  private _parsePlacingOrderParams({
    price,
    stopPrice,
    symbol,
    quantity,
    positionSide,
    orderType,
    clientOrderId,
    isMaker = false,
    isHedgeMode = true
  }: PlaceFutureOrderPayload) {
    const params : any = {
      symbol,
      side: orderType === OrderType.ENTRY ? OrderSide.BUY : OrderSide.SELL,
      quantity,
      positionSide
    };

    params.side = this._parsePlacingOrderSide(orderType, positionSide, isHedgeMode);

    if (!price && !stopPrice) {
      params.type = ExchangeOrderType.MARKET;
    } else if (price && !stopPrice) {
      params.type = ExchangeOrderType.LIMIT;
      params.price = price;
      params.timeInForce = TimeInForce.GTC;
    } else if (stopPrice && !price) {
      params.stopPrice = stopPrice;

      if ([
        OrderType.STOP_LOSS,
        OrderType.ENTRY
      ].includes(orderType)) {
        params.type = ExchangeOrderType.STOP_MARKET;
      } else {
        params.type = ExchangeOrderType.TAKE_PROFIT_MARKET;
      }
    } else {
      params.price = price;
      params.stopPrice = stopPrice;

      if ([
        OrderType.STOP_LOSS,
        OrderType.ENTRY
      ].includes(orderType)) {
        params.type = ExchangeOrderType.STOP;
      } else {
        params.type = ExchangeOrderType.TAKE_PROFIT;
      }
    }

    if (isMaker && price) {
      params.timeInForce = TimeInForce.POST_ONLY;
    }

    if (clientOrderId) {
      params.clientOrderID = clientOrderId;
    }

    return params;
  }

  private _parsePlacingOrderSide(orderType, positionSide, isHedgeMode) {
    if (!isHedgeMode) {
      return positionSide == PositionSide.LONG ? OrderSide.BUY : OrderSide.SELL;
    }

    if (
      orderType === OrderType.ENTRY && positionSide === PositionSide.LONG
      || orderType !== OrderType.ENTRY && positionSide === PositionSide.SHORT
    ) {
      return OrderSide.BUY;
    }

    return OrderSide.SELL;
  }
}

export default BingXFutureAPI;