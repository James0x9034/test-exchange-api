/* eslint-disable @typescript-eslint/no-unused-vars */
import BigNumber from 'bignumber.js';
import { forEach } from 'lodash';

import type SpotApiInterface from '../../../libs/BaseInterfaces/SpotApiInterface';
import {
  type ApiConfig,
  type CancelOrderPayload,
  type GetDepositAddressPayload,
  type GetKlinesPayload,
  type GetOrderPayload,
  type PlaceSpotOrderPayload,
  type WithdrawRequestPayload
} from '../../../libs/RequestConfig';
import {
  type FormattedWithdrawalTransaction,
  type FormattedKline,
  type FormattedTicker,
  type FormattedBalance,
  type FormattedDepositAddress,
  type FormattedOrder,
  type FormattedDepositTransaction,
  type Fee
} from '../../../libs/ResponseConfig';
import {
  getTimeRanges,
  intervalToMilis,
  isStableCoin,
  sleep
} from '../../../libs/Utils';
import BaseAPI from '../BaseAPI';
import {
  BITGET_MAXIMUM_KLINE_LIMIT,
  DEPOSIT_START_TIME_DIFF_DEFAULT,
  ExchangeOrderSide,
  ExchangeOrderStatus,
  ExchangeOrderType,
  ExchangeTimeInForce,
  ExchangeTransactionStatus
} from '../Consts';
import {
  type AccountResponseData,
  type ExchangeTransactionResponseData,
  type DepositResponseData,
  type KlineResponseData,
  type TickerResponseData,
  type SpotOrderResponseData,
  type WithdrawResponseData
} from '../ResponseData';
import {
  type GetOrderParams,
  type GetSpotOrderParams,
  type PlaceSpotOrderParams,
  type WithdrawParams
} from '../RequestParams';
import {
  Currency,
  OrderSide,
  OrderStatus,
  TransactionStatus
} from '../../../libs/Consts';

class BitgetSpotAPI extends BaseAPI implements SpotApiInterface {
  constructor (apiConfig: ApiConfig = {}) {
    super(apiConfig);
  }

  async getKlines ({
    symbol,
    interval,
    limit
  }: GetKlinesPayload): Promise<FormattedKline[]> {
    let chartData: FormattedKline[] = [];
    const currentTimestamp = Date.now();
    const intervalInMilis = intervalToMilis(interval);
    const fromTime = currentTimestamp - intervalInMilis * limit;
    const timeRanges = getTimeRanges(
      interval,
      fromTime,
      currentTimestamp,
      BITGET_MAXIMUM_KLINE_LIMIT
    );
    const period = this.formarRequestKlineInterval(interval);
    const url = '/api/spot/v1/market/candles';
    const totalTimeRanges = timeRanges.length;

    for (let i = 0; i < totalTimeRanges; i++) {
      const timeRange = timeRanges[i];
      const params = {
        symbol,
        period,
        after: timeRange.startTime,
        before: timeRange.endTime,
        limit: BITGET_MAXIMUM_KLINE_LIMIT
      };
      const klines: KlineResponseData[] = await this.axiosInstance.get(url, {
        params
      });

      // Remove last item because it belongs to the current moment bar and it has not finished yet
      if (i == totalTimeRanges - 1) {
        klines.pop();
      }

      const formattedKlines = klines.map((kline) => {
        return {
          openTime: kline.ts,
          open: kline.open,
          high: kline.high,
          low: kline.low,
          close: kline.close,
          volume: kline.quoteVol,
          closeTime: BigNumber(kline.ts)
            .plus(intervalInMilis - 1)
            .toString(),
          symbol,
          interval
        };
      });

      chartData = chartData.concat(formattedKlines);
    }

    return chartData;
  }

  async getTicker (symbol: string): Promise<FormattedTicker> {
    const uri = '/api/spot/v1/market/ticker';
    const params = {
      symbol
    };
    const ticker: TickerResponseData = await this.axiosInstance.get(uri, {
      params
    });

    return {
      symbol: ticker.symbol,
      price: ticker.close
    };
  }

  async getTickers(): Promise<FormattedTicker[]> {
    const uri = '/api/spot/v1/market/tickers';
    const tickers: TickerResponseData[] = await this.axiosInstance.get(uri);

    return tickers.map(ticker => {
      return {
        symbol: ticker.symbol,
        price: ticker.close,
        baseSymbol: ticker.symbol
      };
    });
  }

  async getBalances (): Promise<FormattedBalance[]> {
    const uri = '/api/spot/v1/account/assets';
    const headers = this.signer('GET', uri);
    const accounts: AccountResponseData[] = await this.axiosInstance.get(uri, {
      headers
    });

    return accounts
      .filter((account) => {
        return BigNumber(account.available).plus(account.lock).isGreaterThan(0);
      })
      .map((account) => {
        return {
          asset: account.coinName.toUpperCase(),
          availableBalance: account.available,
          balance: BigNumber(account.available).plus(account.lock).toFixed()
        };
      });
  }

  async getDepositAddress ({
    coin,
    network
  }: GetDepositAddressPayload): Promise<FormattedDepositAddress> {
    const uri = '/api/spot/v1/wallet/deposit-address';
    const params = {
      coin,
      chain: network?.toLowerCase()
    };
    const headers = this.signer('GET', uri, params);
    const depositAddress: DepositResponseData = await this.axiosInstance.get(
      uri,
      {
        headers,
        params
      }
    );

    depositAddress.network = depositAddress.chain;

    return depositAddress;
  }

  async getDepositHistories (
    coin: string,
    startTime?: number
  ): Promise<FormattedDepositTransaction[]> {
    const uri = '/api/spot/v1/wallet/deposit-list';
    const endTime = Date.now();
    const defaultStartTime = endTime - DEPOSIT_START_TIME_DIFF_DEFAULT;
    const params = {
      coin,
      startTime: defaultStartTime,
      endTime,
      pageSize: 100
    };

    if (startTime) {
      params.startTime = startTime;
    }

    const headers = this.signer('GET', uri, params);
    const transactions: ExchangeTransactionResponseData[] =
      await this.axiosInstance.get(uri, {
        headers,
        params
      });

    return transactions.map((transaction) => {
      return {
        id: transaction.id,
        amount: transaction.amount,
        coin: transaction.coin,
        address: transaction.toAddress,
        network: transaction.chain,
        txid: transaction.txId,
        status: this.parseTransactionStatus(transaction.status),
        updatedAt: transaction.uTime,
        fee: transaction.fee
      };
    });
  }

  async getWithdrawal (id: string): Promise<FormattedWithdrawalTransaction> {
    const uri = '/api/spot/v1/wallet/withdrawal-list';
    const endTime = Date.now();
    const startTime = endTime - DEPOSIT_START_TIME_DIFF_DEFAULT;
    const params = {
      startTime,
      endTime
    };
    const headers = this.signer('GET', uri, params);
    const transactions: any = await this.axiosInstance.get(uri, {
      headers,
      params
    });
    const transaction =
      transactions.find((item: any) => {
        return item.id == id;
      }) || {};

    return {
      id: transaction.id,
      amount: BigNumber(transaction.amount).plus(transaction.fee).toFixed(),
      fee: transaction.fee,
      coin: transaction.coin,
      address: transaction.toAddress,
      addressTag: transaction.tag,
      txid: transaction.txId,
      network: transaction.chain,
      updatedAt: transaction.uTime,
      status: this.parseTransactionStatus(transaction.status?.toLowerCase())
    };
  }

  async getOrderDetail ({
    symbol,
    clientOrderId,
    orderId
  }: GetOrderPayload): Promise<FormattedOrder> {
    const uri = '/api/spot/v1/trade/orderInfo';
    const params: GetOrderParams = {
      symbol
    };

    if (clientOrderId) {
      params.clientOrderId = clientOrderId;
    } else {
      params.orderId = orderId;
    }

    const headers = this.signer('POST', uri, params);
    const orders: SpotOrderResponseData[] = await this.axiosInstance.post(
      uri,
      params,
      {
        headers
      }
    );

    if (orders[0]) {
      return await this.formatOrder(orders[0]);
    }

    const orderHistories = await this.getOrderHistories(symbol);
    const order: any =
      orderHistories.find((item) => {
        return item.clientOrderId == clientOrderId || item.orderId == orderId;
      }) || {};

    return await this.formatOrder(order);
  }

  async placeOrder (
    order: PlaceSpotOrderPayload
  ): Promise<FormattedOrder | any> {
    const {
      price,
      stopPrice,
      symbol,
      quantity,
      amount,
      side,
      timeInForce,
      isFullResponse = true
    } = order;

    if (stopPrice) {
      this.placeStopOrder(order); return;
    }

    const uri = '/api/spot/v1/trade/orders';
    const params: PlaceSpotOrderParams = {
      symbol,
      side: side.toLowerCase(),
      quantity,
      orderType: price ? ExchangeOrderType.LIMIT : ExchangeOrderType.MARKET,
      force: timeInForce || ExchangeTimeInForce.GTC
    };

    if (price) {
      params.price = price;
    } else if (side == OrderSide.BUY) {
      params.quantity = amount;
    }

    const headers = this.signer('POST', uri, params);
    const exchangeOrder: SpotOrderResponseData = await this.axiosInstance.post(
      uri,
      params,
      {
        headers
      }
    );

    if (!isFullResponse) {
      return {
        orderId: exchangeOrder.orderId,
        clientOrderId: exchangeOrder.clientOrderId,
        status: OrderStatus.PENDING
      };
    }

    if (params.orderType == ExchangeOrderType.MARKET) {
      await sleep(1500);
    }

    return await this.getOrderDetail({
      orderId: exchangeOrder.orderId,
      clientOrderId: exchangeOrder.clientOrderId,
      symbol
    });
  }

  async cancelOrder ({
    symbol,
    clientOrderId,
    orderId
  }: CancelOrderPayload): Promise<FormattedOrder> {
    const params: GetSpotOrderParams = {
      symbol
    };

    if (clientOrderId) {
      params.clientOid = clientOrderId;
    } else {
      params.orderId = orderId;
    }

    const uri = '/api/spot/v1/trade/cancel-order-v2';
    const headers = this.signer('POST', uri, params);

    await this.axiosInstance.post(uri, params, {
      headers
    });

    return await this.getOrderDetail({
      symbol,
      orderId
    });
  }

  async withdraw ({
    coin,
    network,
    address,
    addressTag,
    amount
  }: WithdrawRequestPayload): Promise<FormattedWithdrawalTransaction> {
    const uri = '/api/spot/v1/wallet/withdrawal-v2';
    const params: WithdrawParams = {
      coin,
      chain: network,
      address,
      amount
    };

    if (addressTag) {
      params.tag = addressTag;
    }

    const headers = this.signer('POST', uri, params);
    const transaction: WithdrawResponseData = await this.axiosInstance.post(
      uri,
      params,
      {
        headers
      }
    );

    return await this.getWithdrawal(transaction.orderId);
  }

  async getOrderHistories (symbol: string): Promise<SpotOrderResponseData[]> {
    const uri = '/api/spot/v1/trade/history';
    const params = {
      symbol
    };
    const headers = this.signer('POST', uri, params);

    return await this.axiosInstance.post(uri, params, {
      headers
    });
  }

  // TODO
  placeStopOrder (order: any): void {

  }

  async formatOrder (order: SpotOrderResponseData): Promise<FormattedOrder> {
    const { side, orderType } = order;
    const executedResult = await this.calculateFilled(order);
    let quantity = order.quantity;

    if (
      orderType == ExchangeOrderType.MARKET &&
      side == ExchangeOrderSide.BUY
    ) {
      quantity = order.fillQuantity;
    }

    return {
      orderId: order.orderId,
      clientOrderId: order.clientOrderId,
      symbol: order.symbol,
      side: order.side.toUpperCase(),
      price: order.price,
      quantity,
      status: this.parseOrderStatus(order),
      ...executedResult
    };
  }

  async calculateFilled (order: SpotOrderResponseData): Promise<any> {
    const { feeDetail, symbol } = order;
    const result = {
      executedAmount: '0',
      executedPrice: order.fillPrice,
      executedQuantity: order.fillQuantity,
      receivedQuantity: order.fillQuantity
    };

    if (!feeDetail) {
      return result;
    }

    const orderFees = JSON.parse(feeDetail);
    const fees: Fee[] = [];

    forEach(orderFees, (feeDetail, coin) => {
      const totalFee = BigNumber(feeDetail.totalFee).abs().toFixed();

      if (this.isBaseAsset(coin, symbol)) {
        result.receivedQuantity = BigNumber(result.receivedQuantity)
          .minus(totalFee)
          .toFixed();
      }

      const existFee = fees.find((item: any) => {
        return item.commissionAsset == coin;
      });

      if (existFee) {
        existFee.commission = BigNumber(existFee.commission)
          .plus(totalFee)
          .toFixed();
        return;
      }

      const assetFee = {
        commissionAsset: coin,
        commission: totalFee
      };

      fees.push(assetFee);
    });

    let fee: any = 0;
    let feeCurrency: any;

    if (fees.length == 1) {
      const feeItem = fees[0];

      fee = feeItem.commission;
      feeCurrency = feeItem.commissionAsset;
    } else {
      const usdtFee = await this.parseFeesToUsdt(fees, order);

      fee = usdtFee;
      feeCurrency = Currency.USDT;
    }

    result.executedAmount = BigNumber(result.executedPrice)
      .multipliedBy(result.executedQuantity)
      .toFixed();

    return {
      ...result,
      fee,
      feeCurrency
    };
  }

  async parseFeesToUsdt (
    fees: any[],
    order: SpotOrderResponseData
  ): Promise<string> {
    const { executedPrice, symbol } = order;
    let usdtFee = BigNumber(0);

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

      const ticker = await this.getTicker(`${commissionAsset}USDT_SPBL`);

      usdtFee = BigNumber(ticker.price || 0)
        .multipliedBy(commission)
        .plus(usdtFee);
    }

    return usdtFee.toFixed();
  }

  parseTransactionStatus (status: string): TransactionStatus {
    switch (status) {
      case ExchangeTransactionStatus.PENDING:
      case ExchangeTransactionStatus.PENDING_REVIEW:
        return TransactionStatus.PENDING;
      case ExchangeTransactionStatus.WALLET_PROCESSING:
        return TransactionStatus.EXECUTING;
      case ExchangeTransactionStatus.SUCCESS:
        return TransactionStatus.EXECUTED;
      case ExchangeTransactionStatus.PENDING_FAIL:
      case ExchangeTransactionStatus.PENDING_REVIEW_FAIL:
      case ExchangeTransactionStatus.REJECT:
        return TransactionStatus.CANCELED;
      default:
        return TransactionStatus.PENDING;
    }
  }

  parseOrderStatus ({
    fillQuantity,
    status
  }: SpotOrderResponseData): OrderStatus {
    if (
      fillQuantity &&
      BigNumber(fillQuantity).isGreaterThan(0) &&
      status == ExchangeOrderStatus.CANCELLED
    ) {
      return OrderStatus.CANCELED;
    }

    switch (status) {
      case ExchangeOrderStatus.INIT:
      case ExchangeOrderStatus.NEW:
        return OrderStatus.PENDING;
      case ExchangeOrderStatus.PARTIAL_FILL:
        return OrderStatus.EXECUTING;
      case ExchangeOrderStatus.FULL_FILL:
        return OrderStatus.EXECUTED;
      case ExchangeOrderStatus.CANCELLED:
        return OrderStatus.CANCELED;
      default:
        return OrderStatus.ERROR;
    }
  }

  isBaseAsset (asset: string, symbol: string): boolean {
    const assetLength = asset.length;
    const firstSymbolAsset = symbol.substring(0, assetLength);

    return asset == firstSymbolAsset;
  }

  formarRequestKlineInterval (interval: string): string {
    const unit = interval.substring(interval.length - 1);
    const value = interval.substring(0, interval.length - 1);

    if (unit === 'm') {
      return `${value}min`;
    }

    if (unit == 'd') {
      return `${value}day`;
    }

    if (unit == 'w') {
      return `${value}week`;
    }

    return interval;
  }
}

export default BitgetSpotAPI;
