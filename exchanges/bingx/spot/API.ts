import SpotApiInterface from '../../../libs/BaseInterfaces/SpotApiInterface';
import BaseAPI from '../BaseAPI';
import {
  ApiConfig,
  CancelOrderPayload,
  GetDepositAddressPayload,
  GetKlinesPayload,
  GetOrderPayload,
  PlaceSpotOrderPayload,
  WithdrawRequestPayload
} from '../../../libs/RequestConfig';
import {
  getTimeRanges,
  intervalToMilis
} from '../../../libs/Utils';
import {
  FormattedBalance,
  FormattedDepositAddress,
  FormattedDepositTransaction,
  FormattedKline, FormattedOrder,
  FormattedTicker,
  FormattedWithdrawalTransaction
} from '../../../libs/ResponseConfig';
import {
  first,
  isEmpty,
  sortBy
} from 'lodash';
import {
  ExchangeDepositStatus,
  ExchangeOrderStatus,
  ExchangeOrderType,
  ExchangeWithdrawalStatus,
  MAXIMUM_KLINE_LIMIT,
  OrderSide,
  WalletType
} from '../Consts';
import BigNumber from 'bignumber.js';
import {
  OrderStatus,
  TransactionStatus
} from '../../../libs/Consts';

class BingXSpotAPI extends BaseAPI implements SpotApiInterface {
  constructor(apiConfig: ApiConfig) {
    super(apiConfig);
  }

  async getKlines({
    symbol,
    interval,
    limit
  }: GetKlinesPayload): Promise<FormattedKline[]> {
    let chartData = [];
    const path = '/openApi/spot/v1/market/kline';
    const currentTimestamp = Date.now();
    const intervalInMilis = intervalToMilis(interval);
    const fromTime = currentTimestamp - (intervalInMilis * limit);
    const timeRanges = getTimeRanges(interval, fromTime, currentTimestamp, MAXIMUM_KLINE_LIMIT);
    const totalTimeRanges = timeRanges.length;

    for (let i = 0; i < totalTimeRanges; i++) {
      const timeRange = timeRanges[i];
      const params = {
        symbol,
        interval,
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
        limit
      };
      const response = await this.makeRequest('GET', path, params);
      const klines = response.map(kline => {
        return {
          openTime: kline[0],
          open: kline[1],
          high: kline[2],
          low: kline[3],
          close: kline[4],
          volume: kline[7],
          closeTime: kline[6],
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

  async getTicker(symbol?: string): Promise<FormattedTicker[]> {
    const uri = '/openApi/spot/v1/ticker/24hr';
    const params: any = {};

    if (symbol) {
      params.symbol = symbol;
    }

    const tickers = await this.makeRequest('GET', uri, params);
    const formattedTickers = tickers.map(ticker => {
      return {
        symbol: ticker.symbol,
        price: ticker.lastPrice
      };
    });

    if (symbol) {
      return first(formattedTickers);
    }

    return formattedTickers;
  }

  async getBalances(): Promise<FormattedBalance[]> {
    const uri = '/openApi/spot/v1/account/balance';
    const response = await this.makeRequest('GET', uri);

    return response.balances.map(balance => {
      return {
        asset: balance.asset,
        availableBalance: balance.free
      };
    });
  }

  async getDepositAddress({
    coin,
    network
  }: GetDepositAddressPayload): Promise<FormattedDepositAddress> {
    const uri = '/openApi/wallets/v1/capital/deposit/address';
    const depositAddresses = await this.makeRequest('GET', uri, {
      coin
    });
    const address = depositAddresses.data.find(chainAddress => {
      return chainAddress.network == network;
    });

    return {
      address: address.address,
      network: address.network,
      coin: address.coin,
      tag: address.tag,
    };
  }

  async getDepositHistories(
    coin: string,
    startTime?: number
  ): Promise<FormattedDepositTransaction[]> {
    const uri = '/openApi/api/v3/capital/deposit/hisrec';
    const params: any = {
      coin
    };

    if (startTime) {
      params.startTime = startTime;
    }

    const response = await this.makeRequest('GET', uri, params);

    return response.map(transaction => {
      return {
        amount: transaction.amount,
        coin: transaction.coin,
        address: transaction.address,
        network: transaction.network,
        txid: transaction.txId,
        status: this._parseDepositStatus(transaction.status),
        updatedAt: transaction.insertTime,
      };
    });
  }

  async getWithdrawal(id: string): Promise<FormattedWithdrawalTransaction | any> {
    const uri = '/openApi/api/v3/capital/withdraw/history';
    const transactions = await this.makeRequest('GET', uri);
    const transaction = transactions.find(item => item.id === id);

    if(isEmpty(transaction)){
      return {};
    }

    return {
      id: transaction.id,
      amount: transaction.amount,
      fee: transaction.transactionFee,
      coin: transaction.coin,
      address: transaction.address,
      txid: transaction.txId,
      network: transaction.network,
      updatedAt: transaction.applyTime,
      status: this._parseWithdrawalStatus(transaction.status)
    };
  }

  async getOrderDetail({
    symbol,
    orderId,
    clientOrderId
  }: GetOrderPayload): Promise<FormattedOrder> {
    const uri = '/openApi/spot/v1/trade/query';
    const params: any = {
      symbol,
    };

    if (clientOrderId) {
      params.clientOrderID = clientOrderId;
    } else {
      params.orderId = orderId;
    }

    const order = await this.makeRequest('GET', uri, params);

    return this.formatExchangeOrder(order);
  }

  async withdraw({
    coin,
    network,
    address,
    amount,
  }: WithdrawRequestPayload): Promise<FormattedWithdrawalTransaction> {
    const uri = '/openApi/wallets/v1/capital/withdraw/apply';
    const params = {
      coin,
      network,
      address,
      amount: BigNumber(amount).toFixed(),
      walletType: WalletType.FUND_ACCOUNT,
    };
    const withdrawal = await this.makeRequest('POST', uri, params);

    return this.getWithdrawal(withdrawal.id);
  }

  async placeOrder(params: PlaceSpotOrderPayload): Promise<FormattedOrder> {
    const path = '/openApi/spot/v1/trade/order';
    const formattedParams = this._parsePlacingOrderParams(params);
    const order = await this.makeRequest('POST', path, formattedParams);

    return this.getOrderDetail(order);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async placeBatchOrder(payloads) {
    return;
  }

  async cancelOrder({
    symbol,
    orderId,
    clientOrderId
  }: CancelOrderPayload) {
    const path = '/openApi/spot/v1/trade/cancel';
    const params: any = {
      symbol
    };

    if (clientOrderId) {
      params.clientOrderID = clientOrderId;
    } else {
      params.orderId = orderId;
    }

    await this.makeRequest('POST', path, params);

    return this.getOrderDetail({
      symbol,
      orderId,
      clientOrderId
    });
  }

  formatExchangeOrder(order: any): FormattedOrder {
    let quantity = order.origQty;
    const executedPrice = BigNumber(order.cummulativeQuoteQty).dividedBy(order.executedQty).toFixed();
    let receivedQuantity = order.executedQty;
    const coinSymbol = order.symbol.split('-')[0];
    const fee = BigNumber(order.fee).abs().toFixed();

    if (order.type == ExchangeOrderType.MARKET && order.side == OrderSide.BUY) {
      quantity = order.executedQty;
    }

    if (order.feeAsset == coinSymbol) {
      receivedQuantity = BigNumber(order.executedQty).minus(fee).toFixed();
    }

    const formattedOrder = {
      orderId: order.orderId,
      clientOrderId: order.origClientOrderId,
      symbol: order.symbol,
      side: order.side,
      price: order.price,
      quantity,
      status: this._parseOrderStatus(order.status),
      executedAmount: order.cummulativeQuoteQty,
      executedPrice,
      executedQuantity: order.executedQty,
      receivedQuantity,
      fee,
      feeCurrency: order.feeAsset
    };

    return formattedOrder;
  }

  private _parseOrderStatus(orderStatus: ExchangeOrderStatus): OrderStatus {
    switch (orderStatus) {
      case ExchangeOrderStatus.NEW:
      case ExchangeOrderStatus.PENDING:
        return OrderStatus.PENDING;
      case ExchangeOrderStatus.PARTIALLY_FILLED:
        return OrderStatus.EXECUTING;
      case ExchangeOrderStatus.FILLED:
        return OrderStatus.EXECUTED;
      case ExchangeOrderStatus.CANCELED:
      case ExchangeOrderStatus.FAILED:
        return OrderStatus.CANCELED;
    }
  }

  private _parseDepositStatus(status): TransactionStatus {
    switch (status) {
      case ExchangeDepositStatus.TO_BE_CONFIRMED:
        return TransactionStatus.PENDING;
      case ExchangeDepositStatus.CONFIRMED:
        return TransactionStatus.EXECUTED;
      case ExchangeDepositStatus.APPROVAL_FAILED:
      case ExchangeDepositStatus.APPROVED_FAILED_AND_RETURN_ASSETS:
        return TransactionStatus.CANCELED;
      case ExchangeDepositStatus.APPROVED_AND_PASSED:
      case ExchangeDepositStatus.EXPORTED:
      case ExchangeDepositStatus.PRELIMINARY_CONFIRMATION_OF_RECHARGE:
      case ExchangeDepositStatus.APPLIED_FOR_BLOCK:
        return TransactionStatus.EXECUTING;
    }
  }

  private _parseWithdrawalStatus(status) {
    switch (status) {
      case ExchangeWithdrawalStatus.TO_BE_CONFIRMED:
        return TransactionStatus.PENDING;
      case ExchangeWithdrawalStatus.CONFIRMED:
        return TransactionStatus.EXECUTED;
      case ExchangeWithdrawalStatus.APPROVAL_FAILED:
      case ExchangeWithdrawalStatus.APPROVED_FAILED_AND_RETURN_ASSETS:
        return TransactionStatus.CANCELED;
      case ExchangeWithdrawalStatus.APPROVED_AND_PASSED:
      case ExchangeWithdrawalStatus.EXPORTED:
      case ExchangeWithdrawalStatus.PRELIMINARY_CONFIRMATION_OF_RECHARGE:
      case ExchangeWithdrawalStatus.APPLIED_FOR_BLOCK:
        return TransactionStatus.EXECUTING;
    }
  }

  private _parsePlacingOrderParams({
    price,
    symbol,
    quantity,
    amount,
    side,
    timeInForce,
    clientOrderId
  }: PlaceSpotOrderPayload) {
    const placingOrderType = price ? ExchangeOrderType.LIMIT : ExchangeOrderType.MARKET;
    const orderParams: any = {
      symbol,
      side,
      type: placingOrderType,
    };

    if (placingOrderType == ExchangeOrderType.MARKET && side == OrderSide.BUY) {
      orderParams.quoteOrderQty = amount;
    } else {
      orderParams.quantity = quantity;
    }

    if (price) {
      orderParams.price = BigNumber(price).toFixed();
    }

    if (timeInForce) {
      orderParams.timeInForce = timeInForce;
    }

    if (clientOrderId) {
      orderParams.newClientOrderId = clientOrderId.replace('-', '');
    }

    return orderParams;
  }
}

export default BingXSpotAPI;