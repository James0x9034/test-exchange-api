import BigNumber from 'bignumber.js';
import type FutureAPIInterface from '../../../libs/BaseInterfaces/FutureApiInterface';
import {
  type PlaceFutureOrderPayload,
  type CancelOrderPayload,
  type GetOrderPayload,
  type ChangeAccountConfigPayload,
  type GetKlinesRequestPayload,
  GetOrderbooksRequest,
} from '../../../libs/RequestConfig';
import {
  type FormattedOrder,
  type FormattedBalance,
  type FormattedKline,
  type FormattedPosition,
  FormattedExchangeOrderBook,
} from '../../../libs/ResponseConfig';
import {
  formatOrderbook,
  getErrorInstance,
  getTimeRanges,
  intervalToMilis
} from '../../../libs/Utils';
import BaseAPI from '../BaseAPI';
import {
  ExchangeOrderSide,
  ExchangeOrderState,
  ExchangeOrderType,
  ExchangePositionMode,
  InstrumentType,
  MAXIMUM_KLINE_LIMIT,
  MarginMode,
  ResponseCode,
  ExchangePositionSide,
  EXCHANGE_EXCEPTION,
} from '../Consts';
import {
  map,
  sortBy
} from 'lodash';
import {
  ExchangeMode,
  OrderStatus,
  OrderType,
  PositionSide
} from '../../../libs/Consts';

class OKXFutureAPI extends BaseAPI implements FutureAPIInterface {
  async placeOrder(payload: PlaceFutureOrderPayload): Promise<any> {
    const { symbol, isFullResponse = true } = payload;

    const params = this.parsePlacingOrderParams(payload);
    const response = await this.makeRequest(
      'POST',
      '/api/v5/trade/order',
      params
    );
    const order = response[0];

    if (!isFullResponse) {
      return {
        orderId: order.ordId,
        clientOrderId: order.clOrdId,
        status: OrderStatus.PENDING,
      };
    }

    return await this.getOrderDetail({
      orderId: order.ordId,
      clientOrderId: order.clOrdId,
      symbol,
    });
  }

  async placeBatchOrder(payloads: PlaceFutureOrderPayload[]): Promise<any> {
    const params = payloads.map((payload) => {
      return this.parsePlacingOrderParams(payload);
    });
    const orders = await this.makeRequest(
      'POST',
      '/api/v5/trade/batch-orders',
      params
    );

    return orders.map((order: any) => {
      const formattedOrder: any = {
        orderId: order.ordId,
        clientOrderId: order.clOrdId,
        status: OrderStatus.PENDING,
      };

      if (order.sCode !== ResponseCode.OK) {
        formattedOrder.status = OrderStatus.ERROR;
        formattedOrder.code = order.sCode;
        formattedOrder.msg = order.sMsg;
        formattedOrder.errorInstance = getErrorInstance({
          code:order.sCode
        }, EXCHANGE_EXCEPTION);
      }

      return formattedOrder;
    });
  }

  async cancelOrder({
    symbol,
    orderId,
    clientOrderId
  }: CancelOrderPayload): Promise<FormattedOrder> {
    const params: any = {
      instId: symbol
    };

    if (clientOrderId) {
      params.clOrdId = clientOrderId;
    } else {
      params.ordId = orderId;
    }

    await this.makeRequest('POST', '/api/v5/trade/cancel-order', params);

    return await this.getOrderDetail({
      symbol,
      orderId,
      clientOrderId
    });
  }

  async getOrderDetail({
    orderId,
    clientOrderId,
    symbol,
  }: GetOrderPayload): Promise<FormattedOrder> {
    const params: any = {
      instId: symbol
    };

    if (clientOrderId) {
      params.clOrdId = clientOrderId;
    } else {
      params.ordId = orderId;
    }

    const response = await this.makeRequest('GET', '/api/v5/trade/order', params);
    const order = response[0];
    const isFilled = BigNumber(order.fillPx || 0)
      .abs()
      .isGreaterThan(0);

    return {
      orderId: order.ordId,
      price: order.px,
      executedPrice: order.avgPx,
      executedQuantity: order.accFillSz,
      receivedQuantity: order.accFillSz,
      executedTime: order.uTime,
      clientOrderId: order.clOrdId,
      status: this.parseOrderStatus(order.state, isFilled),
      fee: BigNumber(order.fee).abs().toFixed(),
      feeCurrency: order.feeCcy,
      orderType: order.ordType.toLowerCase(),
    };
  }

  async changeMarginLeverage({
    leverage,
    symbol,
  }: ChangeAccountConfigPayload): Promise<any> {
    await this.makeRequest('POST', '/api/v5/account/set-leverage', {
      lever: leverage,
      instId: symbol,
      mgnMode: MarginMode.CROSS,
    });
  }

  async changePositionMode(
    symbol: string,
    enableHedgeMode: boolean
  ): Promise<any> {
    return await this.makeRequest('POST', '/api/v5/account/set-position-mode', {
      posMode: enableHedgeMode
        ? ExchangePositionMode.LONG_SHORT
        : ExchangePositionMode.NET,
    });
  }

  async getBalances(): Promise<FormattedBalance[]> {
    const response = await this.makeRequest('GET', '/api/v5/account/balance');
    const balances = response[0].details;

    return balances.map((balance: any) => {
      return {
        asset: balance.ccy,
        balance: balance.cashBal,
        availableBalance: balance.availBal,
      };
    });
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
    const totalTimeRanges = timeRanges.length;
    const unit = interval.substring(interval.length - 1);

    if(unit !== 'm'){
      interval = interval.toUpperCase();
    }

    for (let i = 0; i < totalTimeRanges; i++) {
      const timeRange = timeRanges[i];
      const params = {
        instId: symbol,
        bar: interval,
        before: timeRange.startTime,
      };
      const response = await this.makeRequest(
        'GET',
        '/api/v5/market/candles',
        params
      );
      const klines = response.map((kline: any) => {
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
        klines.pop();
      }

      chartData = chartData.concat(klines);
    }

    return sortBy(chartData, 'openTime');
  }

  async getOrderbooks(payload: GetOrderbooksRequest):Promise<FormattedExchangeOrderBook>{
    const {
      limit,
      symbol
    } = payload;
    const orderbook = await this.makeRequest('GET', '/api/v5/market/books', {
      instId:symbol,
      sz: limit
    });

    return {
      symbol: payload.symbol,
      bids: formatOrderbook(orderbook[0].bids),
      asks: formatOrderbook(orderbook[0].asks),
      mode: ExchangeMode.Future
    };
  }

  async getPositions(symbol?: string): Promise<FormattedPosition[]> {
    let positions = await this.makeRequest('GET', '/api/v5/account/positions', {
      instType: InstrumentType.SWAP,
    });

    if (symbol) {
      positions = positions.filter((position: any) => {
        return position.instId == symbol;
      });
    }

    return positions.map((position: any) => {
      const symbol = position.instId;
      const arrInstrument = symbol.split('-');

      return {
        symbol,
        baseSymbol: arrInstrument[0] + arrInstrument[1],
        leverage: position.lever,
        marginType: position.mgnMode,
        positionSide: position.posSide.toUpperCase(),
        quantity: position.pos,
        entryPrice: position.avgPx,
      };
    });
  }

  async getTicker(symbol?: string): Promise<any> {
    if (symbol) {
      const ticker = await this.makeRequest('GET', '/api/v5/market/ticker', {
        instId: symbol,
      });

      return {
        symbol,
        price: ticker[0].last,
      };
    }

    const tickers = await this.makeRequest('GET', '/api/v5/market/tickers', {
      instType: InstrumentType.SWAP,
    });

    return map(tickers, (item) => {
      return {
        symbol: item.instId,
        price: item.last,
      };
    });
  }

  getMaximumBatchOrder(): number {
    return 20;
  }

  private parseOrderStatus(
    state: ExchangeOrderState,
    isFilled: boolean
  ): OrderStatus {
    switch (state) {
      case ExchangeOrderState.PARTIALLY_FILLED:
      case ExchangeOrderState.CANCELED:
        return isFilled ? OrderStatus.EXECUTED : OrderStatus.CANCELED;
      case ExchangeOrderState.LIVE:
        return isFilled ? OrderStatus.EXECUTING : OrderStatus.PENDING;
      case ExchangeOrderState.FILLED:
        return OrderStatus.EXECUTED;
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
    tag,
    clientOrderId,
    isMaker = false,
    isHedgeMode = true,
  }: PlaceFutureOrderPayload) {
    let type = price ? ExchangeOrderType.LIMIT : ExchangeOrderType.MARKET;

    if (isMaker && price) {
      type = ExchangeOrderType.POST_ONLY;
    }

    const params: any = {
      instId: symbol,
      ordType: type,
      sz: quantity,
      posSide: isHedgeMode
        ? positionSide.toLowerCase()
        : ExchangePositionSide.NET,
      tdMode: MarginMode.CROSS,
      side: this.getPlacingOrderSide(orderType, positionSide, isHedgeMode),
    };

    if (price) {
      params.px = price;
    }

    if (isHedgeMode) {
      params.reduceOnly = orderType != OrderType.ENTRY;
    }

    if (clientOrderId) {
      params.clOrdId = clientOrderId;
    }

    if (tag) {
      params.tag = tag;
    }

    return params;
  }

  private getPlacingOrderSide(
    orderType: OrderType,
    positionSide: string,
    isHedgeMode: boolean
  ) {
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
}

export default OKXFutureAPI;
