/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type ApiConfig,
  type CancelOrderPayload,
  type GetDepositAddressPayload,
  type GetKlinesRequestPayload,
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
  type FormattedTicker,
  type FormattedDepositTransaction
} from '../../../libs/ResponseConfig';
import {
  dateToTimestampUTC,
  getTimeRanges,
  intervalToMilis,
  millisecondsToDateTime,
  sleep
} from '../../../libs/Utils';
import BaseAPI from '../BaseAPI';
import {
  type GetDepositAddressParams,
  type GetExchangeOrderPayload,
  type GetKlinesParams,
  type GetTickerParams,
  type GetWithdrawalBalanceInformationParams,
  type PlaceSpotOrderParams,
  type WithdrawParams
} from '../RequestParams';
import { isEmpty } from 'lodash';
import {
  type BalanceResponseData,
  type DepositAddressResponseData,
  type FillOrderData,
  type FormattedWithdrawalBalanceInformation,
  type GetWithdrawalBalanceInformationResponse,
  type KlinesResponseData,
  type OrderResponseData,
  type OrderTrade,
  type TransactionResponseData,
  type TickerResponseData
} from '../ResponseData';
import BigNumber from 'bignumber.js';
import type SpotApiInterface from '../../../libs/BaseInterfaces/SpotApiInterface';
import {
  ExchangeOrderSide,
  ExchangeOrderState,
  ExchangeOrderType,
  ExchangeTransactionStatus
} from '../Consts';
import {
  CURRENCY_KRW,
  Currency,
  OrderSide,
  OrderStatus,
  TransactionStatus
} from '../../../libs/Consts';

const MAXIMUM_LIMIT_KLINE_REQUEST = 200;
class UpbitSpotAPI extends BaseAPI implements SpotApiInterface {
  constructor (apiConfig: ApiConfig = {}) {
    super(apiConfig);
  }

  async getOrderTrades (orderId: string): Promise<GetOrderTradesResponse[]> {
    throw new Error('Method not implemented.');
  }

  async placeOrder ({
    price,
    symbol,
    quantity,
    side,
    amount,
    isFullResponse = true
  }: PlaceSpotOrderPayload): Promise<FormattedOrder | any> {
    const uri = '/v1/orders';
    const params: PlaceSpotOrderParams = {
      market: symbol,
      side:
        side == OrderSide.BUY ? ExchangeOrderSide.BID : ExchangeOrderSide.ASK
    };

    if (price) {
      params.ord_type = ExchangeOrderType.LIMIT;
      params.price = price;
      params.volume = quantity;
    } else if (side === OrderSide.BUY) {
      params.ord_type = ExchangeOrderType.BUY_MARKET;
      params.price = amount;
    } else {
      params.ord_type = ExchangeOrderType.SELL_MARKET;
      params.volume = quantity;
    }

    const order: any = await this.makeRequest(
      'POST',
      uri,
      params
    );

    if (!isFullResponse) {
      return {
        orderId: order.orderId,
        status: OrderStatus.PENDING
      }
    }

    return await this.getOrderDetail({
      orderId: order.uuid
    });
  }

  async cancelOrder ({ orderId }: CancelOrderPayload): Promise<FormattedOrder> {
    const uri = '/v1/order';
    const params = {
      uuid: orderId
    };

    await this.makeRequest('DELETE', uri, params);
    return await this.getOrderDetail({
      orderId
    });
  }

  async getOrderDetail ({
    orderId
  }: GetExchangeOrderPayload): Promise<FormattedOrder> {
    const uri = '/v1/order';
    const params = {
      uuid: orderId
    };
    const order: OrderResponseData = await this.makeRequest('GET', uri, params);

    if (this.isMarketOrder(order) && isEmpty(order.trades)) {
      await sleep(2000);

      return await this.getOrderDetail({
        orderId
      });
    }

    return this.formatOrder(order);
  }

  async getBalances (): Promise<FormattedBalance[]> {
    const uri = '/v1/accounts';
    const balances: BalanceResponseData[] = await this.makeRequest('GET', uri);

    return balances.map((balance) => {
      const totalBalance = BigNumber(balance.balance)
        .plus(balance.locked)
        .toFixed();

      return {
        asset: balance.currency,
        balance: totalBalance,
        availableBalance: balance.balance,
        krwBalance: balance.currency == CURRENCY_KRW ? totalBalance : BigNumber(balance.avg_buy_price)
          .multipliedBy(totalBalance)
          .toFixed()
      };
    });
  }

  async getDepositAddress ({
    coin
  }: GetDepositAddressPayload): Promise<FormattedDepositAddress> {
    const uri = '/v1/deposits/generate_coin_address';
    const params: GetDepositAddressParams = {
      currency: coin,
      net_type: coin
    };
    const address: DepositAddressResponseData = await this.makeRequest(
      'POST',
      uri,
      params
    );

    if (address.deposit_address) {
      return this.formatDepositAddress(address);
    }

    if (address.success) {
      await sleep(5000);

      return await this.getDepositAddress({
        coin
      });
    }

    throw address;
  }

  async getDepositHistories (
    currency: string,
    startTime: number
  ): Promise<FormattedDepositTransaction[]> {
    const uri = '/v1/deposits';
    const params = {
      currency
    };
    let transactions = await this.makeRequest('GET', uri, params);

    transactions = this.formatFormattedDepositTransactions(transactions);

    if (startTime) {
      transactions = transactions.filter((item: any) => {
        return BigNumber(item.updatedAt).comparedTo(startTime) >= 0;
      });
    }

    return transactions;
  }

  async getWithdrawal (id: string): Promise<FormattedWithdrawalTransaction> {
    const uri = '/v1/withdraw';
    const params = {
      uuid: id
    };
    const transaction: TransactionResponseData = await this.makeRequest(
      'GET',
      uri,
      params
    );

    return this.formatWithdrawalTransaction(transaction);
  }

  async withdraw ({
    coin,
    address,
    addressTag,
    amount
  }: WithdrawRequestPayload): Promise<FormattedWithdrawalTransaction> {
    const uri = '/v1/withdraws/coin';
    const actualAmount = await this.calculateWithdrawalAmount(coin, amount);
    const params: WithdrawParams = {
      currency: coin,
      net_type: coin,
      amount: actualAmount,
      address,
      transaction_type: 'default'
    };

    if (addressTag) {
      params.secondary_address = addressTag;
    }

    const transaction: TransactionResponseData = await this.makeRequest(
      'POST',
      uri,
      params
    );

    return this.formatWithdrawalTransaction({
      ...transaction,
      address,
      addressTag
    });
  }

  async getKlines({
    symbol,
    interval,
    limit
  }) {
    let chartData = [];
    const currentTimestamp = Date.now();
    const intervalInMilis = intervalToMilis(interval);
    const fromTime = currentTimestamp - (intervalInMilis * limit);
    const timeRanges = getTimeRanges(interval, fromTime, currentTimestamp, MAXIMUM_LIMIT_KLINE_REQUEST);
    const uri = this.getKlineUrl(interval);
    const totalTimeRanges = timeRanges.length;

    for (let i = 0; i < totalTimeRanges; i++) {
      const timeRange = timeRanges[i];
      const params = {
        market: symbol,
        count: (timeRange.endTime - timeRange.startTime) / intervalInMilis,
        to: millisecondsToDateTime(timeRange.endTime)
      }
      let response = await this.makeRequest('GET', uri, params);
      const klines = this.formatKlines(response, interval);

      if (i == totalTimeRanges - 1) {
        klines.shift();
      }

      chartData = chartData.concat(klines.reverse());
    }

    return chartData;
  }

  async getTicker (market: string): Promise<FormattedTicker | any> {
    const uri = '/v1/ticker';
    const params: GetTickerParams = {
      markets: market
    };

    const tickers: TickerResponseData[] = await this.makeRequest(
      'GET',
      uri,
      params
    );
    const marketTicker = tickers[0];

    return {
      symbol: marketTicker.market,
      price: marketTicker.trade_price
    };
  }

  async getTickers(): Promise<FormattedTicker[]> {
    const marketList = await this.getMarketList();
    const marketQuery = marketList.join(',');
    const uri = '/v1/ticker';
    const params = {
      markets: marketQuery
    };
    const tickers = await this.makeRequest('GET', uri, params);

    return tickers.map(ticker => {
      const arrSymbol = ticker.market.split('-');
      return {
        symbol: ticker.market,
        price: ticker.trade_price,
        baseSymbol: arrSymbol[1] + arrSymbol[0]
      }
    });
  }

  private async getMarketList() {
    const uri = '/v1/market/all';
    const markets = await this.makeRequest('GET', uri);

    return markets.map(item => {
      return item.market;
    });
  }

  private getKlineUrl (interval: string): string {
    const unit = interval.substring(interval.length - 1);
    const num = +interval.substring(0, interval.length - 1);

    switch (unit) {
      case 'm':
        return `/v1/candles/minutes/${num}`;
      case 'h':
        // eslint-disable-next-line no-case-declarations
        const intervalInMin = num * 60;
        return `/v1/candles/minutes/${intervalInMin}`;
      case 'd':
        return '/v1/candles/days';
      case 'w':
        return '/v1/candles/weeks';
      // eslint-disable-next-line no-duplicate-case
      case 'm':
        return '/v1/candles/months';
    }
    return '';
  }

  private async getWithdrawalBalanceInformation (
    currency: string
  ): Promise<FormattedWithdrawalBalanceInformation> {
    const uri = '/v1/withdraws/chance';
    const params: GetWithdrawalBalanceInformationParams = {
      currency,
      net_type: currency
    };
    const information: GetWithdrawalBalanceInformationResponse =
      await this.makeRequest('GET', uri, params);

    return {
      currency,
      withdrawalFee: information.currency.withdraw_fee,
      isCoin: information.currency.is_coin,
      withdrawalMinimum: information.withdraw_limit.minimum,
      precision: information.withdraw_limit.fixed
    };
  }

  private formatOrder (order: OrderResponseData): FormattedOrder {
    const { executedAmount, executedPrice, executedQuantity } =
      this.calculateFilled(order.trades);
    const arrMarket = order.market.split('-');
    let price = order.price;
    let quantity = order.volume;

    if (this.isMarketOrder(order)) {
      price = executedPrice;
      quantity = executedQuantity;
    }

    const formattedOrder = {
      orderId: order.uuid,
      symbol: order.market,
      side:
        order.side == ExchangeOrderSide.BID ? OrderSide.BUY : OrderSide.SELL,
      price,
      quantity,
      executedAmount,
      executedPrice,
      executedQuantity,
      receivedQuantity: executedQuantity,
      fee: order.paid_fee,
      feeCurrency: arrMarket[0],
      status: this.parseOrderStatus(order)
    };

    return formattedOrder;
  }

  private formatDepositAddress (
    address: DepositAddressResponseData
  ): FormattedDepositAddress {
    return {
      coin: address.currency,
      address: address.deposit_address,
      tag: address.secondary_address
    };
  }

  private formatKlines (
    klines: KlinesResponseData[],
    interval: string
  ): FormattedKline[] {
    const intervalInMs = intervalToMilis(interval);

    return klines.map((kline) => {
      const openTime = dateToTimestampUTC(kline.candle_date_time_utc);

      return {
        openTime,
        symbol: kline.market,
        interval,
        open: kline.opening_price,
        close: kline.trade_price,
        high: kline.high_price,
        low: kline.low_price,
        baseVolume: kline.candle_acc_trade_volume,
        closeTime: +openTime + intervalInMs - 1
      };
    });
  }

  private formatFormattedDepositTransactions (
    transactions: TransactionResponseData[]
  ): FormattedDepositTransaction[] {
    return transactions.map((transaction) => {
      const createdAt = dateToTimestampUTC(transaction.created_at);
      const updatedAt = transaction.done_at
        ? dateToTimestampUTC(transaction.done_at)
        : createdAt;
      return {
        id: transaction.uuid,
        amount: transaction.amount,
        coin: transaction.currency,
        txid: transaction.txid,
        fee: transaction.fee,
        status: this.parseDepositStatus(transaction.state.toLowerCase()),
        createdAt,
        updatedAt
      };
    });
  }

  private formatWithdrawalTransaction (
    transaction: TransactionResponseData
  ): FormattedWithdrawalTransaction {
    return {
      id: transaction.uuid,
      amount: transaction.amount,
      fee: transaction.fee,
      coin: transaction.currency,
      address: transaction.address,
      addressTag: transaction.addressTag,
      status: this.parseWithdrawalStatus(transaction.state.toLowerCase()),
      txid: transaction.txid,
      updatedAt: dateToTimestampUTC(transaction.created_at)
    };
  }

  private async calculateWithdrawalAmount (
    coin: string,
    amount: number | string
  ) {
    const { withdrawalFee, precision } =
      await this.getWithdrawalBalanceInformation(coin);
    const actualAmount = BigNumber(amount).minus(withdrawalFee).toFixed();
    const actualPrecision = coin === Currency.ETH ? 8 : precision;

    return BigNumber(actualAmount)
      .decimalPlaces(actualPrecision, BigNumber.ROUND_DOWN)
      .toFixed();
  }

  private calculateFilled (trades: OrderTrade[]): FillOrderData {
    if (isEmpty(trades)) {
      return {
        executedQuantity: 0,
        executedPrice: 0
      };
    }

    let totalQuantity = BigNumber(0);
    let executedAmount = BigNumber(0);

    for (const trade of trades) {
      totalQuantity = totalQuantity.plus(trade.volume);
      executedAmount = BigNumber(trade.price)
        .multipliedBy(trade.volume)
        .plus(executedAmount);
    }

    return {
      executedAmount: executedAmount.toFixed(),
      executedPrice: executedAmount.dividedBy(totalQuantity).toFixed(),
      executedQuantity: totalQuantity.toFixed()
    };
  }

  private parseOrderStatus (order: OrderResponseData): OrderStatus {
    if (
      [ExchangeOrderState.WAIT, ExchangeOrderState.WATCH].includes(order.state)
    ) {
      return OrderStatus.PENDING;
    }

    if (order.state === ExchangeOrderState.DONE) {
      return OrderStatus.EXECUTED;
    }

    if (
      this.isMarketOrder(order) &&
      order.state === ExchangeOrderState.CANCEL
    ) {
      return OrderStatus.EXECUTED;
    }

    if (order.state === ExchangeOrderState.CANCEL) {
      return OrderStatus.CANCELED;
    }

    return OrderStatus.ERROR;
  }

  private parseDepositStatus (state: string): TransactionStatus {
    switch (state) {
      case ExchangeTransactionStatus.SUBMITTING:
      case ExchangeTransactionStatus.SUBMITTED:
        return TransactionStatus.PENDING;
      case ExchangeTransactionStatus.ALMOST_ACCEPTED:
      case ExchangeTransactionStatus.PROCESSING:
        return TransactionStatus.EXECUTING;
      case ExchangeTransactionStatus.ACCEPTED:
        return TransactionStatus.EXECUTED;
      case ExchangeTransactionStatus.REJECTED:
        return TransactionStatus.CANCELED;
      default:
        return TransactionStatus.PENDING;
    }
  }

  private parseWithdrawalStatus (state: string): TransactionStatus {
    switch (state) {
      case ExchangeTransactionStatus.SUBMITTING:
      case ExchangeTransactionStatus.SUBMITTED:
      case ExchangeTransactionStatus.WAITING:
        return TransactionStatus.PENDING;
      case ExchangeTransactionStatus.PROCESSING:
      case ExchangeTransactionStatus.ALMOST_ACCEPTED:
      case ExchangeTransactionStatus.ACCEPTED:
        return TransactionStatus.EXECUTING;
      case ExchangeTransactionStatus.DONE:
        return TransactionStatus.EXECUTED;
      case ExchangeTransactionStatus.CANCELED:
      case ExchangeTransactionStatus.REJECTED:
        return TransactionStatus.CANCELED;
      default:
        return TransactionStatus.PENDING;
    }
  }

  private isMarketOrder (order: OrderResponseData): boolean {
    return [
      ExchangeOrderType.BUY_MARKET,
      ExchangeOrderType.SELL_MARKET
    ].includes(order.ord_type);
  }
}

export default UpbitSpotAPI;
