import BigNumber from 'bignumber.js';
import {
  sortBy,
  first,
  isEmpty
} from 'lodash';
import {
  formatOrderbook,
  getErrorInstance,
  getTimeRanges,
  handlePromiseResults,
  intervalToMilis
} from '../../../libs/Utils';
import BaseAPI from '../BaseAPI';

import {
  GetOrderbooksRequest,
  type ApiConfig,
  type CancelOrderPayload,
  type ChangeAccountConfigPayload,
  type GetKlinesRequestPayload,
  type GetOrderPayload,
  type PlaceFutureOrderPayload,
} from '../../../libs/RequestConfig';
import {
  type FormattedBalance,
  type FormattedKline,
  type FormattedPosition,
  type FormattedTicker,
  type FormattedOrder,
  type OrderResponse,
  FormattedExchangeOrderBook,
} from '../../../libs/ResponseConfig';
import { type GetKlinesParams, type PlaceOrderParams } from '../RequestParams';
import type FutureAPIInterface from '../../../libs/BaseInterfaces/FutureApiInterface';
import {
  CategoryType,
  ExchangeOrderSide,
  ExchangeOrderStatus,
  MAXIMUM_KLINE_LIMIT,
  ExchangePositionMode,
  ExchangeOrderType,
  ExchangeTIF,
  PositionIdxHedgeMode,
  TRIGGER_BY_LAST_PRICE,
  RET_CODE_OK,
  EXCHANGE_EXCEPTION,
  AccountType,
  ExchangeMarginMode,
} from '../Consts';
import {
  Currency,
  ExchangeMode,
  OrderStatus,
  OrderType,
  PositionSide,
} from '../../../libs/Consts';
import { type OrderResponseData } from '../ResponseData';

class BybitFutureAPI extends BaseAPI implements FutureAPIInterface {
  constructor(apiConfig: ApiConfig = {}) {
    super(apiConfig);
  }

  async getKlines({
    symbol,
    interval,
    limit,
  }: GetKlinesRequestPayload): Promise<FormattedKline[]> {
    let chartData: FormattedKline[] = [];
    const currentTimestamp = Date.now();
    const intervalInMilis = intervalToMilis(interval);
    const fromTime = currentTimestamp - intervalInMilis * limit;
    const timeRanges = getTimeRanges(
      interval,
      fromTime,
      currentTimestamp,
      MAXIMUM_KLINE_LIMIT
    );
    const granularity = this.parseKlineInterval(interval);
    const path = '/v5/market/kline';
    const totalTimeRanges = timeRanges.length;

    for (let i = 0; i < totalTimeRanges; i++) {
      const timeRange = timeRanges[i];
      const params: GetKlinesParams = {
        category: CategoryType.LINEAR,
        symbol,
        interval: granularity,
        start: timeRange.startTime,
        end: timeRange.endTime,
      };
      const response = await this.makeRequest('GET', path, params);
      const klines = response.list.map((kline: any) => {
        const closeTime = BigNumber(kline[0])
          .plus(intervalInMilis - 1)
          .toString();

        return {
          openTime: kline[0],
          open: kline[1],
          high: kline[2],
          low: kline[3],
          close: kline[4],
          volume: kline[5],
          closeTime,
        };
      });

      if (i == totalTimeRanges - 1) {
        klines.shift();
      }

      chartData = chartData.concat(klines);
    }

    return sortBy(chartData, 'openTime');
  }

  async getOrderbooks(payload: GetOrderbooksRequest):Promise<FormattedExchangeOrderBook>{
    const uri = '/v5/market/orderbook';
    const orderbook = await this.makeRequest('GET', uri, {
      ...payload,
      category: CategoryType.LINEAR
    });

    return {
      symbol: payload.symbol,
      bids: formatOrderbook(orderbook.b),
      asks: formatOrderbook(orderbook.a),
      mode: ExchangeMode.Future
    };
  }

  async getTicker(symbol: string): Promise<FormattedTicker | any> {
    const uri = '/v5/market/tickers';
    const params: any = {
      category: CategoryType.LINEAR,
    };

    if (symbol) {
      params.symbol = symbol;
    }

    const response = await this.makeRequest('GET', uri, params);
    const tickers = response.list.map((ticker: any) => {
      return {
        symbol: ticker.symbol,
        price: ticker.lastPrice,
      };
    });

    if (symbol) {
      return first(tickers);
    }

    return tickers;
  }

  async getPositions(symbol?: string): Promise<FormattedPosition[]> {
    const path = '/v5/position/list';
    const params: any = {
      category: CategoryType.LINEAR,
    };

    if (symbol) {
      params.symbol = symbol;
    } else {
      params.settleCoin = Currency.USDT;
    }

    const response = await this.makeRequest('GET', path, params);

    return response.list.map((position: any) => {
      return {
        symbol: position.symbol,
        baseSymbol: position.symbol,
        leverage: position.leverage,
        marginType: position.tradeMode,
        positionSide:
          position.side == ExchangeOrderSide.BUY
            ? PositionSide.LONG
            : PositionSide.SHORT,
        quantity: BigNumber(position.size).abs().toFixed(),
        entryPrice: position.avgPrice,
      };
    });
  }

  async getBalances(): Promise<FormattedBalance[]> {
    const path = '/v5/account/wallet-balance';
    const params = {
      accountType: AccountType.UNIFIED,
    };
    const response = await this.makeRequest('GET', path, params);
    const account = response.list.find((item: any) => {
      return item.accountType == AccountType.UNIFIED;
    });

    return account.coin.map((balance: any) => {
      return {
        asset: balance.coin,
        balance: balance.walletBalance,
        availableBalance: balance.availableToWithdraw,
      };
    });
  }

  async getOrderDetail({
    orderId,
    clientOrderId,
    symbol,
  }: GetOrderPayload): Promise<FormattedOrder> {
    const path = '/v5/order/realtime';
    const params: any = {
      category: CategoryType.LINEAR,
      symbol,
    };

    if (clientOrderId) {
      params.orderLinkId = clientOrderId;
    } else {
      params.orderId = orderId;
    }

    const response = await this.makeRequest('GET', path, params);
    const order = response.list.find((item: any) => {
      if (clientOrderId) {
        return item.orderLinkId == clientOrderId;
      }

      return item.orderId == orderId;
    });

    if (isEmpty(order)) {
      throw new Error('Order not found');
    }

    const executedQuantity = order.cumExecQty;
    const executedAmount = order.cumExecValue || 0;
    let executedPrice = order.avgPrice;

    if (
      executedPrice &&
      executedQuantity &&
      BigNumber(executedPrice).isLessThanOrEqualTo(0) &&
      BigNumber(executedAmount).isGreaterThan(0)
    ) {
      executedPrice = BigNumber(executedAmount)
        .dividedBy(executedQuantity)
        .toFixed();
    }

    return {
      orderId: order.orderId,
      price: order.price,
      quantity: order.qty,
      executedPrice,
      executedQuantity,
      receivedQuantity: executedQuantity,
      executedTime: order.updatedTime,
      clientOrderId: order.orderLinkId,
      status: this.parseOrderStatus(order),
      fee: order.cumExecFee,
      feeCurrency: Currency.USDT,
      orderType: order.orderType?.toLowerCase(),
    };
  }

  getMaximumBatchOrder(): number {
    return 10;
  }

  async changeMarginLeverage({ symbol, leverage }: ChangeAccountConfigPayload) {
    const results = await Promise.allSettled([
      this.switchMarginMode(ExchangeMarginMode.CROSS_MARGIN),
      this.changeLeverage({
        symbol,
        leverage,
      })
    ]);

    return handlePromiseResults(results, 'changeMarginLeverage');
  }

  async changePositionMode(symbol: string, enableHedgeMode: boolean = false) {
    const path = '/v5/position/switch-mode';
    const params = {
      category: CategoryType.LINEAR,
      coin: Currency.USDT,
      mode: enableHedgeMode
        ? ExchangePositionMode.BOTH_SIDE
        : ExchangePositionMode.MERGE_SINGLE,
    };

    await this.makeRequest('POST', path, params);
  }

  async placeOrder(
    payload: PlaceFutureOrderPayload
  ): Promise<FormattedOrder | OrderResponse> {
    const { isFullResponse = true } = payload;
    const path = '/v5/order/create';
    const orderParams = this.parsePlacingOrderParams(payload);
    const order = await this.makeRequest('POST', path, orderParams);

    if (!isFullResponse) {
      return {
        orderId: order.orderId,
        clientOrderId: order.orderLinkId,
        status: OrderStatus.PENDING,
      };
    }

    return await this.getOrderDetail({
      orderId: order.orderId,
      clientOrderId: order.orderLinkId,
      symbol: payload.symbol,
    });
  }

  async placeBatchOrder(
    payloads: PlaceFutureOrderPayload[]
  ): Promise<OrderResponse[]> {
    const path = '/v5/order/create-batch';
    const formattedPayloads = payloads.map((payload) => {
      return this.parsePlacingOrderParams(payload);
    });
    const params = {
      category: CategoryType.LINEAR,
      request: formattedPayloads,
    };
    const response = await this.makeRequest('POST', path, params);
    const responseInfos = response.retExtInfo.list;
    const results: OrderResponse[] = [];

    for (const [index, order] of response.result.list.entries()) {
      const responseInfo = responseInfos[index];
      const formattedOrder: any = {
        orderId: order.orderId,
        clientOrderId: order.orderLinkId,
        status: OrderStatus.PENDING,
      };

      if (responseInfo.code !== RET_CODE_OK) {
        formattedOrder.status = OrderStatus.ERROR;
        formattedOrder.code = responseInfo.code;
        formattedOrder.msg = responseInfo.msg;
        formattedOrder.errorInstance = getErrorInstance({
          code: responseInfo.code
        }, EXCHANGE_EXCEPTION);
      }

      results.push(formattedOrder);
    }

    return results;
  }

  async cancelOrder({
    symbol,
    orderId,
    clientOrderId,
  }: CancelOrderPayload): Promise<FormattedOrder> {
    const path = '/v5/order/cancel';
    const params: any = {
      category: CategoryType.LINEAR,
      symbol,
    };

    if (clientOrderId) {
      params.orderLinkId = clientOrderId;
    } else {
      params.orderId = orderId;
    }

    await this.makeRequest('POST', path, params);

    return await this.getOrderDetail({
      symbol,
      orderId,
      clientOrderId,
    });
  }

  async switchMarginMode(marginMode: ExchangeMarginMode): Promise<any> {
    const path = '/v5/account/set-margin-mode';
    const params = {
      setMarginMode: marginMode
    };

    await this.makeRequest('POST', path, params);
  }

  async changeLeverage({
    symbol,
    leverage,
  }: ChangeAccountConfigPayload): Promise<any> {
    const path = '/v5/position/set-leverage';
    const parsedLeverage = leverage.toString();
    const params = {
      category: CategoryType.LINEAR,
      symbol,
      sellLeverage: parsedLeverage,
      buyLeverage: parsedLeverage,
    };

    await this.makeRequest('POST', path, params);
  }

  private parsePlacingOrderParams({
    price,
    stopPrice,
    symbol,
    quantity,
    positionSide,
    orderType,
    clientOrderId,
    isMaker = false,
    isHedgeMode = true,
  }: PlaceFutureOrderPayload): PlaceOrderParams {
    const placingOrderType = price
      ? ExchangeOrderType.LIMIT
      : ExchangeOrderType.MARKET;
    const orderParams: PlaceOrderParams = {
      category: CategoryType.LINEAR,
      symbol,
      orderType: placingOrderType,
      side: this.parsePlacingOrderSide(orderType, positionSide, isHedgeMode),
      qty: BigNumber(quantity).toFixed(),
      timeInForce: ExchangeTIF.GTC,
      closeOnTrigger: false,
    };

    if (isHedgeMode) {
      orderParams.positionIdx =
        positionSide == PositionSide.LONG
          ? PositionIdxHedgeMode.BUY
          : PositionIdxHedgeMode.SELL;
      orderParams.reduceOnly = orderType !== OrderType.ENTRY;
    }

    if (price) {
      orderParams.price = BigNumber(price).toFixed();
      orderParams.timeInForce = isMaker
        ? ExchangeTIF.POST_ONLY
        : ExchangeTIF.GTC;
    }

    if (stopPrice) {
      orderParams.triggerPrice = BigNumber(stopPrice).toFixed();
      orderParams.triggerBy = TRIGGER_BY_LAST_PRICE;
    }

    if (clientOrderId) {
      orderParams.orderLinkId = clientOrderId;
    }

    return orderParams;
  }

  private parsePlacingOrderSide(
    orderType: string,
    positionSide: string,
    isHedgeMode: boolean
  ): string {
    if (!isHedgeMode) {
      return positionSide == PositionSide.LONG
        ? ExchangeOrderSide.BUY
        : ExchangeOrderSide.SELL;
    }

    if (
      (orderType == OrderType.ENTRY && positionSide == PositionSide.LONG) ||
      (orderType != OrderType.ENTRY && positionSide == PositionSide.SHORT)
    ) {
      return ExchangeOrderSide.BUY;
    }

    return ExchangeOrderSide.SELL;
  }

  private parseOrderStatus({
    orderStatus,
    cumExecQty,
  }: OrderResponseData): OrderStatus {
    if (
      cumExecQty &&
      BigNumber(cumExecQty).isGreaterThan(0) &&
      [
        ExchangeOrderStatus.PENDING_CANCEL,
        ExchangeOrderStatus.CANCELED,
        ExchangeOrderStatus.REJECTED,
        ExchangeOrderStatus.DEACTIVATED,
      ].includes(orderStatus)
    ) {
      return OrderStatus.EXECUTED;
    }

    switch (orderStatus) {
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

  private parseKlineInterval(interval: string): string | number {
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
}

export default BybitFutureAPI;
