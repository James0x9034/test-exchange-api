import BigNumber from 'bignumber.js';
import type FutureAPIInterface from '../../../libs/BaseInterfaces/FutureApiInterface';
import BaseAPI from '../BaseAPI';

import {
  GetOrderbooksRequest,
  type ApiConfig,
  type CancelOrderPayload,
  type ChangeAccountConfigPayload,
  type GetKlinesPayload,
  type GetOrderPayload,
  type PlaceFutureOrderPayload
} from '../../../libs/RequestConfig';
import {
  FormattedTrade,
  type FormattedBalance,
  type FormattedKline,
  type FormattedOrder,
  type FormattedPosition,
  type FormattedTicker,
  FormattedExchangeOrderBook
} from '../../../libs/ResponseConfig';
import {
  formatOrderbook,
  getErrorInstance,
  getTimeRanges,
  handlePromiseResults,
  intervalToMilis
} from '../../../libs/Utils';
import { formatOrderStatus } from '../Utils';
import {
  EXCHANGE_EXCEPTION,
  ExchangeOrderType,
  ExchangePositionSide,
  MAXIMUM_KLINE_LIMIT,
  MarginType,
  ResponseType,
  TimeInForce,
  URL_FUTURE_PREFIX
} from '../Consts';
import {
  Currency,
  ExchangeMode,
  OrderSide,
  OrderStatus,
  OrderType,
  PositionSide
} from '../../../libs/Consts';
import {
  type GetOrderParams,
  type GetPositionParams,
  type PlaceOrderParams
} from '../RequestParams';
import {
  type OrderResponseData
} from '../ResponseData';

class BinanceFutureAPI extends BaseAPI implements FutureAPIInterface {
  constructor(apiConfig: ApiConfig = {}) {
    super('https://fapi.binance.com', apiConfig);
  }

  async placeOrder(
    payload: PlaceFutureOrderPayload
  ): Promise<FormattedOrder | any> {
    const params = this.parsePlacingOrderParams(payload);
    const order = await this.makeRequest(
      'POST',
      this.getFutureAPIURL('/order'),
      params
    );

    return this.formatOrder(order);
  }

  async placeBatchOrder(
    payloads: PlaceFutureOrderPayload[]
  ): Promise<FormattedOrder[] | any> {
    const formattedPayload = payloads.map((payload: any) => {
      return this.parsePlacingOrderParams(payload);
    });
    const params = {
      batchOrders: JSON.stringify(formattedPayload)
    };
    const uri = this.getFutureAPIURL('/batchOrders');
    const orders = await this.makeRequest('POST', uri, params);

    return orders.map((order: any, idx: number) => {
      const orderPayload = formattedPayload[idx];

      if (order.code && order.msg) {
        // error case
        return {
          ...order,
          clientOrderId: orderPayload.newClientOrderId,
          status: OrderStatus.ERROR,
          errorInstance: getErrorInstance({
            code: order.code,
            msg: order.msg
          }, EXCHANGE_EXCEPTION)
        };
      }

      return this.formatOrder(order);
    });
  }

  async cancelOrder({
    symbol,
    orderId,
    clientOrderId
  }: CancelOrderPayload): Promise<FormattedOrder> {
    const params: GetOrderParams = {
      symbol
    };

    if (clientOrderId) {
      params.origClientOrderId = clientOrderId;
    } else {
      params.orderId = orderId;
    }

    const order = await this.makeRequest(
      'DELETE',
      this.getFutureAPIURL('/order'),
      params
    );

    return this.formatOrder(order);
  }

  async getOrderDetail({
    orderId,
    symbol,
    clientOrderId
  }: GetOrderPayload): Promise<FormattedOrder> {
    const params: GetOrderParams = {
      symbol
    };

    if (clientOrderId) {
      params.origClientOrderId = clientOrderId;
    } else {
      params.orderId = orderId;
    }

    const order = await this.makeRequest(
      'GET',
      this.getFutureAPIURL('/order'),
      params
    );

    return this.formatOrder(order);
  }

  async changeMarginLeverage({
    symbol,
    leverage
  }: ChangeAccountConfigPayload): Promise<any> {
    const results = await Promise.allSettled([
      this.switchMarginMode(symbol, MarginType.CROSS),
      this.changeLeverage({
        symbol,
        leverage
      }),
    ]);

    return handlePromiseResults(results, 'changeMarginLeverage');
  }

  async changePositionMode(
    symbol: string,
    enableHedgeMode: boolean
  ): Promise<any> {
    await this.makeRequest('POST', this.getFutureAPIURL('/positionMode'), {
      dualSidePosition: enableHedgeMode
    });
  }

  async getBalances(): Promise<FormattedBalance[]> {
    const balances = await this.makeRequest(
      'GET',
      '/fapi/v2/balance'
    );

    return balances.map((balance: any) => {
      return {
        asset: balance.asset,
        availableBalance: balance.availableBalance,
        balance: balance.balance
      };
    });
  }

  async getOrderbooks(payload: GetOrderbooksRequest):Promise<FormattedExchangeOrderBook>{
    const orderbook = await this.makeRequest(
      'GET',
      '/fapi/v1/depth',
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
    let chartData: any[] = [];
    const currentTimestamp = Date.now();
    const intervalInMilis = intervalToMilis(interval);
    const fromTime = currentTimestamp - intervalInMilis * limit;
    const timeRanges = getTimeRanges(
      interval,
      fromTime,
      currentTimestamp,
      MAXIMUM_KLINE_LIMIT
    );
    const uri = this.getFutureAPIURL('/klines');
    const totalTimeRanges = timeRanges.length;

    for (let i = 0; i < totalTimeRanges; i++) {
      const timeRange = timeRanges[i];
      const klines = await this.makeRequest(
        'GET',
        uri,
        {
          symbol,
          interval,
          startTime: timeRange.startTime,
          endTime: timeRange.endTime,
          limit: MAXIMUM_KLINE_LIMIT
        },
        true
      );
      const formattedKlines = klines.map((kline: any) => {
        return {
          openTime: kline[0],
          open: kline[1],
          high: kline[2],
          low: kline[3],
          close: kline[4],
          volume: kline[5],
          closeTime: kline[6],
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
    const uri = '/fapi/v2/positionRisk';
    const params: GetPositionParams = {};

    if (symbol) {
      params.symbol = symbol;
    }

    const positions = await this.makeRequest('GET', uri, params);

    return positions.map((position: any) => {
      return {
        symbol: position.symbol,
        baseSymbol: position.symbol,
        leverage: position.leverage,
        marginType: position.marginType,
        positionSide: position.positionSide,
        quantity: BigNumber(position.positionAmt).abs().toFixed(),
        entryPrice: position.entryPrice
      };
    });
  }

  async getLatestTrade(symbol: string): Promise<FormattedTrade> {
    const trade = await this.makeRequest(
      'GET',
      this.getFutureAPIURL('/trade'),
      {
        symbol,
        limit: 1
      }
    );
    const latestTrade = trade[0] || {};

    return {
      price: latestTrade.price,
      quantity: latestTrade.qty,
      time: latestTrade.time
    };
  }

  async getTicker(symbol: string): Promise<FormattedTicker> {
    const uri = '/fapi/v1/ticker/price';
    const params = {
      symbol
    };
    const ticker = await this.makeRequest('GET', uri, params, true);

    return ticker;
  }

  async switchMarginMode(symbol: string, marginType: MarginType): Promise<any> {
    const params = {
      symbol,
      marginType
    };

    const response = await this.makeRequest(
      'POST',
      this.getFutureAPIURL('/marginType'),
      params
    );

    return response;
  }

  async changeLeverage({
    symbol,
    leverage
  }: ChangeAccountConfigPayload) {
    const params = {
      symbol,
      leverage
    };

    await this.makeRequest('POST', this.getFutureAPIURL('/leverage'), params);
  }

  getMaximumBatchOrder() {
    return 5;
  }

  private getFutureAPIURL(uri: string): string {
    return `${URL_FUTURE_PREFIX}${uri}`;
  }

  private formatOrder(order: OrderResponseData): FormattedOrder {
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
      fee: this.calculateFee(order),
      feeCurrency: Currency.USDT,
      orderType: order.type?.toLowerCase()
    };
  }

  // Correct getting fee
  private calculateFee(order: OrderResponseData): string {
    return BigNumber(order.avgPrice)
      .multipliedBy(order.executedQty)
      .multipliedBy(0.0004)
      .toFixed();
  }

  private parsePlacingOrderParams({
    orderType,
    positionSide,
    quantity,
    symbol,
    clientOrderId,
    isHedgeMode = true,
    isMaker = false,
    price,
    stopPrice
  }: PlaceFutureOrderPayload) {
    const params: PlaceOrderParams = {
      symbol,
      side: orderType === OrderType.ENTRY ? OrderSide.BUY : OrderSide.SELL,
      quantity,
      newOrderRespType: ResponseType.RESULT,
      positionSide: isHedgeMode ? positionSide : ExchangePositionSide.BOTH
    };

    params.side = this.parsePlacingOrderSide(
      orderType,
      positionSide,
      isHedgeMode
    );

    if (!price && !stopPrice) {
      params.type = ExchangeOrderType.MARKET;
    } else if (price && !stopPrice) {
      params.type = ExchangeOrderType.LIMIT;
      params.price = price;
      params.timeInForce = TimeInForce.GTC;
    } else if (stopPrice && !price) {
      params.stopPrice = stopPrice;

      if ([OrderType.STOP_LOSS, OrderType.ENTRY].includes(orderType)) {
        params.type = ExchangeOrderType.STOP_MARKET;
      } else {
        params.type = ExchangeOrderType.TAKE_PROFIT_MARKET;
      }
    } else {
      params.price = price;
      params.stopPrice = stopPrice;

      if ([OrderType.STOP_LOSS, OrderType.ENTRY].includes(orderType)) {
        params.type = ExchangeOrderType.STOP;
      } else {
        params.type = ExchangeOrderType.TAKE_PROFIT;
      }
    }

    if (isMaker && price) {
      params.timeInForce = TimeInForce.GTX;
    }

    if (clientOrderId) {
      params.newClientOrderId = clientOrderId;
    }

    return params;
  }

  private parsePlacingOrderSide(
    orderType: string,
    positionSide: string,
    isHedgeMode: boolean
  ): OrderSide {
    if (!isHedgeMode) {
      return positionSide == PositionSide.LONG ? OrderSide.BUY : OrderSide.SELL;
    }

    if (
      (orderType === OrderType.ENTRY && positionSide === PositionSide.LONG) ||
      (orderType !== OrderType.ENTRY && positionSide === PositionSide.SHORT)
    ) {
      return OrderSide.BUY;
    }

    return OrderSide.SELL;
  }
}

export default BinanceFutureAPI;
