import BigNumber from 'bignumber.js';
import type SpotApiInterface from '../../../libs/BaseInterfaces/SpotApiInterface';

import {
  type ApiConfig,
  type CancelOrderPayload,
  type GetOrderPayload,
  type OrderTradesParams,
  type PlaceSpotOrderPayload
} from '../../../libs/RequestConfig';
import { type FormattedBalance, type FormattedOrder } from '../../../libs/ResponseConfig';

import BinanceSpotAPI from '../spot/API';
import { type GetOrderParams, type PlaceOrderParams } from '../RequestParams';
import { type OrderResponseData, type OrderTrade } from '../ResponseData';
import { ExchangeOrderType, ResponseType, TimeInForce } from '../Consts';
import { OrderType } from '../../../libs/Consts';

class BinanceMarginAPI extends BinanceSpotAPI implements SpotApiInterface {
  constructor (apiConfig: ApiConfig = {}) {
    super(apiConfig);
  }

  async getBalances (): Promise<FormattedBalance[]> {
    const accounts = await this.makeRequest('GET', '/sapi/v1/margin/account');

    return accounts.userAssets
      .map((balance: any) => ({
        asset: balance.asset,
        balance: BigNumber(balance.free).plus(balance.locked).toFixed(),
        availableBalance: balance.free,
        netBalance: balance.netAsset
      }))
      .filter((balance: any) => BigNumber(balance.balance).isGreaterThan(0));
  }

  async getOrderDetail ({
    orderId,
    symbol,
    clientOrderId
  }: GetOrderPayload): Promise<FormattedOrder> {
    const uri = '/sapi/v1/margin/order';
    const params: GetOrderParams = {
      symbol
    };

    if (clientOrderId) {
      params.origClientOrderId = clientOrderId;
    } else {
      params.orderId = orderId;
    }

    const order: OrderResponseData = await this.makeRequest('GET', uri, params);

    if (BigNumber(order.executedQty).isGreaterThan(0)) {
      const trades = await this.getOrderTrades({
        orderId: order.orderId,
        symbol: order.symbol
      });

      order.fills = trades;
    }

    return await this.formatOrder(order);
  }

  async placeOrder ({
    price,
    stopPrice,
    symbol,
    quantity,
    side,
    orderType
  }: PlaceSpotOrderPayload): Promise<FormattedOrder> {
    const uri = '/sapi/v1/margin/order';
    const params: PlaceOrderParams = {
      symbol,
      side,
      quantity,
      newOrderRespType: ResponseType.FULL
    };

    if (!price && !stopPrice) {
      params.type = ExchangeOrderType.MARKET;
    } else if (price && !stopPrice) {
      params.type = ExchangeOrderType.LIMIT;
      params.price = price;
      params.timeInForce = TimeInForce.GTC;
    } else if (stopPrice && !price) {
      params.stopPrice = stopPrice;

      if ([OrderType.STOP_LOSS, OrderType.ENTRY].includes(orderType)) {
        params.type = ExchangeOrderType.STOP_LOSS;
      } else {
        params.type = ExchangeOrderType.TAKE_PROFIT;
      }
    } else {
      params.price = price;
      params.stopPrice = stopPrice;

      if ([OrderType.STOP_LOSS, OrderType.ENTRY].includes(orderType)) {
        params.type = ExchangeOrderType.STOP_LOSS_LIMIT;
      } else {
        params.type = ExchangeOrderType.TAKE_PROFIT_LIMIT;
      }
    }

    const order = await this.makeRequest('POST', uri, params);

    return await this.formatOrder(order);
  }

  async cancelOrder ({
    symbol,
    orderId,
    clientOrderId
  }: CancelOrderPayload): Promise<FormattedOrder> {
    const uri = '/sapi/v1/margin/order';
    const params: GetOrderParams = {
      symbol
    };

    if (clientOrderId) {
      params.origClientOrderId = clientOrderId;
    } else {
      params.orderId = orderId;
    }

    const order: OrderResponseData = await this.makeRequest(
      'DELETE',
      uri,
      params
    );

    if (BigNumber(order.executedQty).isGreaterThan(0)) {
      const trades = await this.getOrderTrades({
        orderId: order.orderId,
        symbol: order.symbol
      });

      order.fills = trades;
    }

    return await this.formatOrder(order);
  }

  protected async getOrderTrades (
    params: OrderTradesParams
  ): Promise<OrderTrade[]> {
    const uri = '/sapi/v1/margin/myTrades';

    return await this.makeRequest('GET', uri, params);
  }
}

export default BinanceMarginAPI;
