import BigNumber from 'bignumber.js';
import { groupBy } from 'lodash';

import type FutureAPIInterface from '../../../libs/BaseInterfaces/FutureApiInterface';
import {
  GetOrderbooksRequest,
  type ApiConfig,
  type CancelOrderPayload,
  type ChangeMarginLeveragePayload,
  type GetKlinesPayload,
  type GetOrderPayload,
  type PlaceFutureOrderPayload
} from '../../../libs/RequestConfig';
import {
  FormattedExchangeOrderBook,
  type FormattedBalance,
  type FormattedKline,
  type FormattedOrder,
  type FormattedPosition,
  type FormattedTicker,
} from '../../../libs/ResponseConfig';
import {
  formatOrderbook,
  getErrorInstance,
  getTimeRanges,
  handlePromiseResults,
  intervalToMilis,
  sleep
} from '../../../libs/Utils';
import BaseAPI from '../BaseAPI';
import {
  Currency,
  ExchangeMode,
  OrderStatus,
  OrderType,
  PositionSide
} from '../../../libs/Consts';
import {
  BITGET_MAXIMUM_KLINE_LIMIT,
  EXCHANGE_EXCEPTION,
  ExchangeOrderSide,
  ExchangeOrderType,
  ExchangeTimeInForce,
  HoldMode,
  MarginMode,
  ProductType,
  URL_MIX_API_PREFIX
} from '../Consts';
import {
  type GetBusinessBillsParams,
  type GetBusinessBillsPayload,
  type PlaceBatchOrderPayload,
  type PlaceFutureOrderParams
} from '../RequestParams';
import {
  type BalanceResponseData,
  type FormattedExchangeOrder,
  type GetBusinessBillResponseData,
  type OrderResponseData,
  type PlaceBatchOrderResponseData,
  type PositionResponseData
} from '../ResponseData';

class BitgetFutureAPI extends BaseAPI implements FutureAPIInterface {
  constructor(apiConfig: ApiConfig = {}) {
    super(apiConfig);
  }

  async placeOrder(
    payload: PlaceFutureOrderPayload
  ): Promise<FormattedOrder | any> {
    const { isFullResponse = true } = payload;
    const params = this.parsePlacingOrderParams(payload);
    const url = this.getMixApiURL('/order/placeOrder');
    const headers = this.signer('POST', url, params);
    const order: OrderResponseData = await this.axiosInstance.post(
      url,
      params,
      {
        headers
      }
    );

    if (!isFullResponse) {
      return {
        orderId: order.orderId,
        clientOrderId: order.clientOid,
        status: OrderStatus.PENDING
      };
    }

    if (params.orderType === ExchangeOrderType.MARKET) {
      await sleep(1500);
    }

    return await this.getOrderDetail({
      orderId: order.orderId,
      clientOrderId: order.clientOid,
      symbol: payload.symbol
    });
  }

  async placeBatchOrder(
    payloads: PlaceFutureOrderPayload[]
  ): Promise<FormattedExchangeOrder[]> {
    const formattedPayloads = payloads.map((payload) =>
      this.parsePlacingOrderParams(payload)
    );
    const payloadGroups: PlaceBatchOrderPayload = groupBy(
      formattedPayloads,
      'symbol'
    );
    let batchResults: FormattedExchangeOrder[] = [];

    for (const [symbol, payloadGroup] of Object.entries(payloadGroups)) {
      const results = await this.requestPlaceBatchOrder(symbol, payloadGroup);

      batchResults = batchResults.concat(results);
    }

    return batchResults;
  }

  async cancelOrder({
    symbol,
    orderId
  }: CancelOrderPayload): Promise<FormattedOrder> {
    const params = {
      symbol,
      marginCoin: Currency.USDT,
      orderId
    };
    const url = this.getMixApiURL('/order/cancel-order');
    const headers = this.signer('POST', url, params);

    await this.axiosInstance.post(url, params, {
      headers
    });

    return await this.getOrderDetail({
      symbol,
      orderId
    });
  }

  async getOrderDetail({
    orderId,
    symbol,
    clientOrderId
  }: GetOrderPayload): Promise<FormattedOrder> {
    const url = this.getMixApiURL('/order/detail');
    const params: any = {
      symbol
    };

    if (clientOrderId) {
      params.clientOid = clientOrderId;
    } else {
      params.orderId = orderId;
    }

    const headers = this.signer('GET', url, params);
    const order: OrderResponseData = await this.axiosInstance.get(url, {
      headers,
      params
    });

    return {
      orderId: order.orderId,
      price: order.price,
      quantity: order.size,
      executedPrice: order.priceAvg,
      executedQuantity: order.filledQty,
      receivedQuantity: order.filledQty,
      executedTime: order.cTime,
      clientOrderId: order.clientOid,
      status: this.parseOrderStatus(order),
      fee: BigNumber(order.fee).abs().toFixed(),
      feeCurrency: Currency.USDT
    };
  }

  async changeMarginLeverage({
    symbol,
    leverage
  }: ChangeMarginLeveragePayload): Promise<any> {
    const results = await Promise.allSettled([
      this.switchMarginMode(symbol, MarginMode.CROSSED),
      this.changeLeverage({
        symbol,
        leverage
      }),
    ]);

    return handlePromiseResults(results, 'changeMarginLeverage');
  }

  async getBalances(): Promise<FormattedBalance[]> {
    const url = this.getMixApiURL('/account/accounts');
    const params = {
      productType: ProductType.USDT_PERPETUAL
    };
    const headers = this.signer('GET', url, params);
    const accounts: BalanceResponseData[] = await this.axiosInstance.get(url, {
      headers,
      params
    });

    return accounts.map((balance) => {
      return {
        asset: balance.marginCoin,
        availableBalance: balance.crossMaxAvailable,
        balance: balance.equity
      };
    });
  }

  async getKlines({
    symbol,
    interval,
    limit
  }: GetKlinesPayload): Promise<FormattedKline[]> {
    let chartData: any = [];
    const currentTimestamp = Date.now();
    const intervalInMilis = intervalToMilis(interval);
    const fromTime = currentTimestamp - intervalInMilis * limit;
    const timeRanges = getTimeRanges(
      interval,
      fromTime,
      currentTimestamp,
      BITGET_MAXIMUM_KLINE_LIMIT
    );
    const granularity = this.formarRequestKlineInterval(interval);
    const url = this.getMixApiURL('/market/candles');
    const totalTimeRanges = timeRanges.length;

    for (let i = 0; i < totalTimeRanges; i++) {
      const timeRange = timeRanges[i];
      const params = {
        symbol,
        granularity,
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
        limit: BITGET_MAXIMUM_KLINE_LIMIT
      };
      let klines: any = await this.axiosInstance.get(url, {
        params
      });

      // Remove last item because it belongs to current moment bar and it has not finished yet
      if (i == totalTimeRanges - 1) {
        klines.pop();
      }

      klines = klines.map((kline: any) => {
        return {
          openTime: kline[0],
          open: kline[1],
          high: kline[2],
          low: kline[3],
          close: kline[4],
          volume: kline[5],
          closeTime: BigNumber(kline[0])
            .plus(intervalInMilis - 1)
            .toString()
        };
      });

      chartData = chartData.concat(klines);
    }

    return chartData;
  }

  async getPositions(symbol?: string): Promise<FormattedPosition[]> {
    const url = this.getMixApiURL('/position/allPosition');
    const params = {
      productType: ProductType.USDT_PERPETUAL
    };
    const headers = this.signer('GET', url, params);
    const positions: PositionResponseData[] = await this.axiosInstance.get(
      url,
      {
        params,
        headers
      }
    );

    return positions
      .filter((position) => {
        if (symbol) {
          return position.symbol === symbol;
        }

        return true;
      })
      .map((position) => {
        const arrSymbol = position.symbol.split('_');

        return {
          symbol: position.symbol,
          baseSymbol: arrSymbol[0],
          leverage: position.leverage,
          marginType: position.marginMode,
          positionSide: position.holdSide.toUpperCase(),
          quantity: BigNumber(position.total).abs().toFixed(),
          entryPrice: position.averageOpenPrice
        };
      });
  }

  async getBusinessBills({
    startTime,
    endTime,
    lastEndId
  }: GetBusinessBillsPayload) {
    const url = '/api/mix/v1/account/accountBusinessBill';
    const params: GetBusinessBillsParams = {
      startTime,
      endTime,
      productType: ProductType.USDT_PERPETUAL,
      pageSize: 100,
      next: true
    };

    if (lastEndId) {
      params.lastEndId = lastEndId;
    }

    const headers = this.signer('GET', url, params);
    const transactions: GetBusinessBillResponseData =
      await this.axiosInstance.get(url, {
        params,
        headers
      });

    return transactions.result.map((item: any) => {
      return {
        id: item.id,
        asset: item.marginCoin.toUpperCase(),
        business: item.business,
        transactionTime: item.cTime,
        amount: item.amount,
        lastEndId: transactions.lastEndId
      };
    });
  }

  async getTicker(symbol: string): Promise<FormattedTicker> {
    const url = '/api/mix/v1/market/ticker';
    const params = {
      symbol
    };

    const ticker: any = await this.axiosInstance.get(url, {
      params
    });

    return {
      symbol,
      price: ticker.last
    };
  }

  async getOrderbooks(payload: GetOrderbooksRequest):Promise<FormattedExchangeOrderBook>{
    const url = '/api/mix/v1/market/depth';
    const orderbook: any = await this.axiosInstance.get(url, {
      params: payload
    });

    return {
      symbol: payload.symbol,
      bids: formatOrderbook(orderbook.bids),
      asks: formatOrderbook(orderbook.asks),
      mode: ExchangeMode.Future
    };
  }

  getMaximumBatchOrder() {
    return 50;
  }

  async changePositionMode(symbol: string, enableHedgeMode: boolean) {
    const url = '/api/mix/v1/account/setPositionMode';
    const params = {
      productType: ProductType.USDT_PERPETUAL,
      holdMode: HoldMode.ONE_WAY
    };

    if (enableHedgeMode) {
      params.holdMode = HoldMode.TWO_WAY;
    }

    const headers = this.signer('POST', url, params);

    return await this.axiosInstance.post(url, params, {
      headers
    });
  }

  private async requestPlaceBatchOrder(
    symbol: string,
    payloads: PlaceFutureOrderParams[]
  ): Promise<FormattedExchangeOrder[]> {
    const url = this.getMixApiURL('/order/batch-orders');
    const params = {
      symbol,
      marginCoin: Currency.USDT,
      orderDataList: payloads
    };
    const headers = this.signer('POST', url, params);

    try {
      const response: PlaceBatchOrderResponseData = await this.axiosInstance.post(
        url,
        params,
        {
          headers
        }
      );
      const successOrders = response.orderInfo.map((order) => {
        return {
          orderId: order.orderId,
          clientOrderId: order.clientOid,
          status: OrderStatus.PENDING
        };
      });
      const errorOrders = response.failure.map((order) => {
        return {
          orderId: order.orderId,
          clientOrderId: order.clientOid,
          status: OrderStatus.ERROR,
          msg: order.errorMsg,
          code: order.errorCode,
          errorInstance: getErrorInstance({
            msg: order.errorMsg,
            code: order.errorCode
          }, EXCHANGE_EXCEPTION)
        };
      });

      return successOrders.concat(errorOrders);
    } catch (error) {
      return payloads.map(order => {
        return {
          clientOrderId: order.clientOid,
          status: OrderStatus.ERROR,
          errorInstance: error
        };
      });
    }
  }

  async switchMarginMode(symbol: string, marginMode: MarginMode) {
    const params = {
      symbol,
      marginCoin: Currency.USDT,
      marginMode
    };
    const url = this.getMixApiURL('/account/setMarginMode');
    const headers = this.signer('POST', url, params);

    return await this.axiosInstance.post(url, params, {
      headers
    });
  }

  async changeLeverage({ symbol, leverage }: ChangeMarginLeveragePayload) {
    const params = {
      symbol,
      marginCoin: Currency.USDT,
      leverage
    };
    const url = this.getMixApiURL('/account/setLeverage');
    const headers = this.signer('POST', url, params);

    return await this.axiosInstance.post(url, params, {
      headers
    });
  }

  private formarRequestKlineInterval(interval: string) {
    const unit = interval.substring(interval.length - 1);

    if (unit === 'm') {
      return interval.toLowerCase();
    }

    return interval.toUpperCase();
  }

  private parseOrderStatus({
    state,
    filledQty
  }: OrderResponseData): OrderStatus {
    if (
      filledQty &&
      BigNumber(filledQty).isGreaterThan(0) &&
      state == 'canceled'
    ) {
      return OrderStatus.EXECUTED;
    }

    switch (state) {
      case 'new':
        return OrderStatus.PENDING;
      case 'partially_filled':
        return OrderStatus.EXECUTING;
      case 'filled':
        return OrderStatus.EXECUTED;
      case 'canceled':
        return OrderStatus.CANCELED;
      default:
        return OrderStatus.ERROR;
    }
  }

  private parsePlacingOrderParams({
    price,
    symbol,
    quantity,
    positionSide,
    orderType,
    clientOrderId,
    isMaker = false,
    isHedgeMode = true
  }: PlaceFutureOrderPayload) {
    const params: PlaceFutureOrderParams = {
      marginCoin: Currency.USDT,
      symbol,
      size: quantity,
      side: this.getPlaceOrderSide(positionSide, orderType, isHedgeMode),
      orderType: ExchangeOrderType.MARKET
    };

    if (price) {
      params.orderType = ExchangeOrderType.LIMIT;
      params.price = price;
    }

    if (isMaker && price) {
      params.timeInForceValue = ExchangeTimeInForce.POST_ONLY;
    }

    if (clientOrderId) {
      params.clientOid = clientOrderId;
    }

    return params;
  }

  private getMixApiURL(uri: string) {
    return `${URL_MIX_API_PREFIX}${uri}`;
  }

  private getPlaceOrderSide(
    positionSide?: string,
    orderType?: string,
    isHedgeMode = true
  ) {
    if (isHedgeMode) {
      return this.getHedgeModeOrderSide(positionSide, orderType);
    }

    return positionSide == PositionSide.LONG
      ? ExchangeOrderSide.BUY_SINGLE
      : ExchangeOrderSide.SELL_SINGLE;
  }

  private getHedgeModeOrderSide(positionSide?: string, orderType?: string) {
    if (orderType === OrderType.ENTRY) {
      return positionSide === PositionSide.LONG
        ? ExchangeOrderSide.OPEN_LONG
        : ExchangeOrderSide.OPEN_SHORT;
    }

    return positionSide === PositionSide.LONG
      ? ExchangeOrderSide.CLOSE_LONG
      : ExchangeOrderSide.CLOSE_SHORT;
  }
}

export default BitgetFutureAPI;
