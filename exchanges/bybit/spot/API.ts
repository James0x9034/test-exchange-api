import BigNumber from 'bignumber.js';
import type SpotApiInterface from '../../../libs/BaseInterfaces/SpotApiInterface';

import { sortBy, first, isEmpty } from 'lodash';

import {
  getTimeRanges,
  intervalToMilis,
  isStableCoin
} from '../../../libs/Utils';
import BaseAPI from '../BaseAPI';

import {
  type ApiConfig,
  type CancelOrderPayload,
  type GetDepositAddressPayload,
  type GetKlinesRequestPayload,
  type GetOrderPayload,
  type PlaceSpotOrderPayload,
  type WithdrawRequestPayload
} from '../../../libs/RequestConfig';
import {
  type FormattedOrder,
  type FormattedBalance,
  type FormattedDepositAddress,
  type FormattedKline,
  type GetOrderTradesResponse,
  type FormattedWithdrawalTransaction,
  type OrderResponse,
  type FormattedDepositTransaction,
  type Fee,
  FormattedTicker
} from '../../../libs/ResponseConfig';
import {
  AMOUNT_PRECISION,
  AccountType,
  CategoryType,
  EXCHANGE_WITHDRAWAL_FEE_TYPE_AUTOMATICALLY,
  ExchangeDepositStatus,
  ExchangeOrderSide,
  ExchangeOrderStatus,
  ExchangeOrderType,
  ExchangeWithdrawalStatus,
  MAXIMUM_KLINE_LIMIT,
  TRIGGER_BY_LAST_PRICE,
} from '../Consts';
import {
  Currency,
  OrderSide,
  OrderStatus,
  TransactionStatus
} from '../../../libs/Consts';
import { type FillOrderData, type OrderResponseData } from '../ResponseData';

class BybitSpotAPI extends BaseAPI implements SpotApiInterface {
  constructor (apiConfig: ApiConfig = {}) {
    super(apiConfig);
  }

  async getKlines ({
    symbol,
    interval,
    limit
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
      const params = {
        category: CategoryType.SPOT,
        symbol,
        interval: granularity,
        start: timeRange.startTime,
        end: timeRange.endTime
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
          symbol,
          interval
        };
      });

      if (i == totalTimeRanges - 1) {
        klines.shift();
      }

      chartData = chartData.concat(klines);
    }

    return sortBy(chartData, 'openTime');
  }

  async getTicker (symbol: string): Promise<any> {
    const uri = '/v5/market/tickers';
    const params: any = {
      category: CategoryType.SPOT,
      symbol
    };
    const response = await this.makeRequest('GET', uri, params);
    const tickers = response.list.map((ticker: any) => {
      return {
        symbol: ticker.symbol,
        price: ticker.lastPrice
      };
    });

    return first(tickers);
  }

  async getTickers(): Promise<FormattedTicker[]> {
    const uri = '/v5/market/tickers';
    const params: any = {
      category: CategoryType.SPOT
    };
    const response = await this.makeRequest('GET', uri, params);

    return response.list.map((ticker: any) => {
      return {
        symbol: ticker.symbol,
        price: ticker.lastPrice,
        baseSymbol: ticker.symbol
      };
    });
  }

  async getBalances (): Promise<FormattedBalance[]> {
    const uri = '/v5/account/wallet-balance';
    const params = {
      accountType: AccountType.UNIFIED
    };
    const response = await this.makeRequest('GET', uri, params);
    const account = response.list.find((item: any) => {
      return item.accountType == AccountType.UNIFIED;
    });

    return account.coin.map((balance: any) => {
      return {
        asset: balance.coin,
        balance: balance.walletBalance,
        availableBalance: balance.availableToWithdraw
      };
    });
  }

  async getDepositAddress ({
    coin,
    network
  }: GetDepositAddressPayload): Promise<FormattedDepositAddress> {
    const uri = '/v5/asset/deposit/query-address';
    const params = {
      coin,
      chainType: network
    };
    const response = await this.makeRequest('GET', uri, params);
    const address = response.chains.find((chainAddress: any) => {
      return chainAddress.chain == network;
    });

    return {
      address: address.addressDeposit,
      network: address.chain,
      coin: response.coin,
      tag: address.tagDeposit
    };
  }

  async getDepositHistories (
    coin: string,
    startTime?: number
  ): Promise<FormattedDepositTransaction[]> {
    const uri = '/v5/asset/deposit/query-record';
    const params: any = {
      coin
    };

    if (startTime) {
      params.startTime = startTime;
    }

    const response = await this.makeRequest('GET', uri, params);

    return response.rows.map((transaction: any) => {
      return {
        amount: transaction.amount,
        coin: transaction.coin,
        address: transaction.toAddress,
        network: transaction.chain,
        txid: transaction.txID,
        status: this.parseDepositStatus(transaction.status),
        updatedAt: transaction.successAt,
        fee: transaction.depositFee
      };
    });
  }

  async getWithdrawal (id: string): Promise<FormattedWithdrawalTransaction> {
    const uri = '/v5/asset/withdraw/query-record';
    const params = {
      withdrawID: id
    };
    const response = await this.makeRequest('GET', uri, params);
    const transaction =
      response.rows.find((item: any) => {
        return item.withdrawId == id;
      }) || {};

    return {
      id: transaction.withdrawId,
      amount: transaction.amount,
      fee: transaction.withdrawFee,
      coin: transaction.coin,
      address: transaction.toAddress,
      addressTag: transaction.tag,
      txid: transaction.txID,
      network: transaction.chain,
      updatedAt: transaction.updateTime,
      status: this.parseWithdrawalStatus(transaction.status)
    };
  }

  async getOrderTrades (orderId: string): Promise<GetOrderTradesResponse[]> {
    const uri = '/spot/v3/private/my-trades';
    const params = {
      orderId
    };
    const response = await this.makeRequest('GET', uri, params);

    return response.list.map((trade: any) => {
      return {
        id: trade.tradeId,
        orderId: trade.orderId,
        symbol: trade.symbol,
        executedPrice: trade.orderPrice,
        executedQuantity: trade.orderQty,
        fee: trade.execFee,
        feeCurrency: trade.feeTokenId,
        isMaker: +trade.isMaker,
        updatedAt: trade.executionTime
      };
    });
  }

  async getOrderDetail ({
    symbol,
    clientOrderId,
    orderId
  }: GetOrderPayload): Promise<FormattedOrder> {
    const uri = '/v5/order/realtime';
    const params: any = {
      category: CategoryType.SPOT,
      symbol
    };

    if (clientOrderId) {
      params.orderLinkId = clientOrderId;
    } else {
      params.orderId = orderId;
    }

    const response = await this.makeRequest('GET', uri, params);
    const order = response.list.find((item: any) => {
      if (clientOrderId) {
        return item.orderLinkId == clientOrderId;
      }

      return item.orderId == orderId;
    });

    if (isEmpty(order)) {
      throw new Error('Order not found');
    }

    return await this.formatExchangeOrder(order);
  }

  async placeOrder ({
    price,
    stopPrice,
    symbol,
    quantity,
    amount,
    side,
    timeInForce,
    isFullResponse = true
  }: PlaceSpotOrderPayload): Promise<FormattedOrder | OrderResponse> {
    const path = '/v5/order/create';
    const placingOrderType = price
      ? ExchangeOrderType.LIMIT
      : ExchangeOrderType.MARKET;
    let qty = quantity;

    if (side == OrderSide.BUY && !price) {
      qty = BigNumber(amount).toFixed(AMOUNT_PRECISION);
    }

    const orderParams: any = {
      category: CategoryType.SPOT,
      symbol,
      orderType: placingOrderType,
      side:
        side == OrderSide.BUY ? ExchangeOrderSide.BUY : ExchangeOrderSide.SELL,
      qty: BigNumber(qty).toFixed(),
      timeInForce: timeInForce || 'GTC'
    };

    if (price) {
      orderParams.price = BigNumber(price).toFixed();
    }

    if (stopPrice) {
      orderParams.triggerPrice = BigNumber(stopPrice).toFixed();
      orderParams.triggerBy = TRIGGER_BY_LAST_PRICE;
    }

    const order = await this.makeRequest('POST', path, orderParams);

    if (!isFullResponse) {
      return {
        orderId: order.orderId,
        clientOrderId: order.orderLinkId,
        status: OrderStatus.PENDING
      };
    }

    return await this.getOrderDetail({
      orderId: order.orderId,
      clientOrderId: order.orderLinkId,
      symbol
    });
  }

  async cancelOrder ({
    symbol,
    orderId,
    clientOrderId
  }: CancelOrderPayload): Promise<FormattedOrder> {
    const path = '/v5/order/cancel';
    const params: any = {
      category: CategoryType.SPOT,
      symbol
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
      clientOrderId
    });
  }

  async withdraw ({
    coin,
    network,
    address,
    addressTag,
    amount
  }: WithdrawRequestPayload): Promise<FormattedWithdrawalTransaction> {
    const uri = '/v5/asset/withdraw/create';
    const params: any = {
      coin,
      chain: network,
      address,
      amount: BigNumber(amount).toFixed(),
      feeType: EXCHANGE_WITHDRAWAL_FEE_TYPE_AUTOMATICALLY,
      timestamp: Date.now()
    };

    if (addressTag) {
      params.tag = addressTag;
    }

    const response = await this.makeRequest('POST', uri, params);

    return await this.getWithdrawal(response.id);
  }

  private async formatExchangeOrder (
    order: OrderResponseData
  ): Promise<FormattedOrder> {
    const filledResult = await this.calculateFilled(order);
    let quantity = order.qty;

    if (
      order.orderType == ExchangeOrderType.MARKET &&
      order.side == ExchangeOrderSide.BUY
    ) {
      quantity = order.cumExecQty;
    }

    return {
      orderId: order.orderId,
      clientOrderId: order.orderLinkId,
      symbol: order.symbol,
      side: order.side.toUpperCase(),
      price: order.price,
      quantity,
      status: this.parseOrderStatus(order),
      ...filledResult
    };
  }

  private async calculateFilled (
    order: OrderResponseData
  ): Promise<FillOrderData> {
    let executedPrice = order.avgPrice;
    if (isNaN(executedPrice) || !executedPrice) {
      const ticker = await this.getTicker(order.symbol);
      executedPrice = ticker.price;
    }

    const result: FillOrderData = {
      executedAmount: 0,
      executedPrice,
      executedQuantity: order.cumExecQty,
      receivedQuantity: order.cumExecQty,
      fee: order.cumExecFee,
      feeCurrency: ''
    };

    if (!order.cumExecQty) {
      return result;
    }

    const trades = await this.getOrderTrades(order.orderId);
    const fees: Fee[] = [];

    for (const trade of trades) {
      const tradeFee = trade.fee;
      const coin = trade.feeCurrency;

      if (this.isBaseAsset(trade.feeCurrency, order.symbol)) {
        result.receivedQuantity = BigNumber(result.receivedQuantity)
          .minus(tradeFee)
          .toFixed();
      }

      const existFee = fees.find((item) => {
        return item.commissionAsset == coin;
      });

      if (existFee) {
        existFee.commission = BigNumber(existFee.commission)
          .plus(tradeFee)
          .toFixed();
        continue;
      }

      const assetFee = {
        commissionAsset: coin,
        commission: tradeFee
      };

      fees.push(assetFee);
    }

    if (isEmpty(fees)) {
      return result;
    }

    result.executedAmount = BigNumber(result.executedQuantity)
      .multipliedBy(result.executedPrice)
      .toFixed();

    if (fees.length == 1) {
      const feeItem = fees[0];

      result.fee = feeItem.commission;
      result.feeCurrency = feeItem.commissionAsset;

      return result;
    }

    const usdtFee = await this.parseFeesToUsdt(fees, order);

    result.fee = usdtFee;
    result.feeCurrency = Currency.USDT;

    return result;
  }

  private async parseFeesToUsdt (
    fees: Fee[],
    order: OrderResponseData
  ): Promise<string> {
    const { symbol } = order;
    let usdtFee = BigNumber(0);
    let executedPrice = order.avgPrice;

    if (isNaN(executedPrice) || !executedPrice) {
      const ticker = await this.getTicker(order.symbol);
      executedPrice = ticker.price;
    }

    for (const fee of fees) {
      const { commissionAsset, commission } = fee;

      if (commissionAsset == Currency.USDT || isStableCoin(commissionAsset)) {
        usdtFee = usdtFee.plus(commission);
        continue;
      }

      if (this.isBaseAsset(commissionAsset, symbol)) {
        const arrSymbol = symbol.split('_');
        const quoteAsset = arrSymbol[0].substring(commissionAsset.length);

        if (quoteAsset == Currency.USDT) {
          usdtFee = BigNumber(executedPrice)
            .multipliedBy(commission)
            .plus(usdtFee);
          continue;
        }
      }

      const ticker = await this.getTicker(`${commissionAsset}USDT`);

      usdtFee = BigNumber(ticker.price || 0)
        .multipliedBy(commission)
        .plus(usdtFee);
    }

    return usdtFee.toFixed();
  }

  private parseDepositStatus (status: number): TransactionStatus {
    switch (status) {
      case ExchangeDepositStatus.UNKNOWN:
      case ExchangeDepositStatus.TO_BE_CONFIRMED:
        return TransactionStatus.PENDING;
      case ExchangeDepositStatus.PROCESSING:
        return TransactionStatus.EXECUTING;
      case ExchangeDepositStatus.SUCCESS:
        return TransactionStatus.EXECUTED;
      case ExchangeDepositStatus.DEPOSIT_FAILED:
        return TransactionStatus.CANCELED;
      default:
        return TransactionStatus.PENDING;
    }
  }

  private parseWithdrawalStatus (status: string): TransactionStatus {
    switch (status) {
      case ExchangeWithdrawalStatus.SECURITY_CHECK:
      case ExchangeWithdrawalStatus.PENDING:
        return TransactionStatus.PENDING;
      case ExchangeWithdrawalStatus.SUCCESS:
        return TransactionStatus.EXECUTED;
      case ExchangeWithdrawalStatus.CANCEL_BY_USER:
      case ExchangeWithdrawalStatus.REJECT:
      case ExchangeWithdrawalStatus.FAIL:
        return TransactionStatus.CANCELED;
      case ExchangeWithdrawalStatus.BLOCKCHAIN_CONFIRMED:
        return TransactionStatus.EXECUTING;
      default:
        return TransactionStatus.PENDING;
    }
  }

  private parseOrderStatus ({
    orderStatus,
    cumExecQty
  }: OrderResponseData): OrderStatus {
    if (
      cumExecQty &&
      BigNumber(cumExecQty).isGreaterThan(0) &&
      [
        ExchangeOrderStatus.PENDING_CANCEL,
        ExchangeOrderStatus.CANCELED,
        ExchangeOrderStatus.REJECTED,
        ExchangeOrderStatus.DEACTIVATED
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
      case ExchangeOrderStatus.PARTIALLY_FILLED_CANCELED:
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

  private parseKlineInterval (interval: string): string | number {
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

  private isBaseAsset (asset: string, symbol: string): boolean {
    const assetLength = asset.length;
    const firstSymbolAsset = symbol.substring(0, assetLength);

    return asset == firstSymbolAsset;
  }
}

export default BybitSpotAPI;
