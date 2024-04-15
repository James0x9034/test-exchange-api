import BigNumber from 'bignumber.js';
import { isEmpty } from 'lodash';

import BaseAPI from '../BaseAPI';
import type SpotApiInterface from '../../../libs/BaseInterfaces/SpotApiInterface';

import {
  type ApiConfig,
  type CancelOrderPayload,
  type GetDepositAddressPayload,
  type GetKlinesPayload,
  type GetOrderPayload,
  type OrderTradesParams,
  type PlaceSpotOrderPayload,
  type WithdrawRequestPayload
} from '../../../libs/RequestConfig';
import {
  type FormattedBalance,
  type FormattedDepositAddress,
  type FormattedDepositTransaction,
  type FormattedKline,
  type FormattedOrder,
  type FormattedTicker,
  type FormattedWithdrawalTransaction
} from '../../../libs/ResponseConfig';
import {
  dateToTimestamp,
  getTimeRanges,
  intervalToMilis,
  isStableCoin,
  sleep
} from '../../../libs/Utils';
import { formatOrderStatus } from '../Utils';
import {
  type Fee,
  type OrderResponseData,
  type OrderTrade,
  type TransactionResponseData
} from '../ResponseData';
import {
  TransferRequest,
  type GetDepositAddressParams,
  type GetDepositHistoriesParams,
  type GetOrderParams,
  type PlaceOrderParams,
  type WithdrawParams
} from '../RequestParams';
import {
  ExchangeDepositStatus,
  ExchangeOrderType,
  ExchangeWithdrawalStatus,
  MAXIMUM_KLINE_LIMIT,
  ResponseType,
  TimeInForce
} from '../Consts';
import { Currency, OrderType, TransactionStatus } from '../../../libs/Consts';

class BinanceSpotAPI extends BaseAPI implements SpotApiInterface {
  constructor (apiConfig: ApiConfig = {}) {
    super('https://api.binance.com', apiConfig);
  }

  async transfer (payload: TransferRequest) : Promise<any> {
    const transaction = await this.makeRequest(
      'POST',
      '/sapi/v1/futures/transfer',
      payload
    );

    return transaction;
  }

  async placeOrder ({
    price,
    stopPrice,
    symbol,
    quantity,
    side,
    orderType
  }: PlaceSpotOrderPayload): Promise<FormattedOrder> {
    const uri = '/api/v3/order';
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
    clientOrderId,
    orderId
  }: CancelOrderPayload): Promise<FormattedOrder> {
    const uri = '/api/v3/order';
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

  async getOrderDetail ({
    orderId,
    symbol,
    clientOrderId
  }: GetOrderPayload): Promise<FormattedOrder> {
    const uri = '/api/v3/order';
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

  async getBalances (): Promise<FormattedBalance[]> {
    const balances = await this.makeRequest(
      'POST',
      '/sapi/v3/asset/getUserAsset',
      {
        needBtcValuation: true
      }
    );
    const btcTicker = await this.getTicker('BTCUSDT');

    return balances.map((balance: any) => {
      return {
        asset: balance.asset,
        balance: BigNumber(balance.free).plus(balance.locked).toFixed(),
        availableBalance: balance.free,
        usdtBalance: BigNumber(balance.btcValuation)
          .multipliedBy(btcTicker.price)
          .toFixed()
      };
    });
  }

  async getDepositAddress ({
    coin,
    network
  }: GetDepositAddressPayload): Promise<FormattedDepositAddress> {
    const uri = '/sapi/v1/capital/deposit/address';
    const params: GetDepositAddressParams = {
      coin
    };

    if (network) {
      params.network = network;
    }

    const address = await this.makeRequest('GET', uri, params);

    address.network = network;

    if (!network) {
      const { networkList } = await this.getCoinInformations(coin);
      const defaultNetwork = networkList.find((item: any) => {
        return item.isDefault;
      });

      address.network = defaultNetwork.network;
    }

    return address;
  }

  async getDepositHistories (
    coin: string,
    startTime?: number
  ): Promise<FormattedDepositTransaction[]> {
    const uri = '/sapi/v1/capital/deposit/hisrec';
    const params: GetDepositHistoriesParams = {
      coin
    };

    if (startTime) {
      params.startTime = startTime;
    }

    const transactions = await this.makeRequest('GET', uri, params);

    return this.formatFormattedDepositTransactions(transactions);
  }

  async withdraw ({
    coin,
    network,
    address,
    addressTag,
    amount
  }: WithdrawRequestPayload): Promise<FormattedWithdrawalTransaction> {
    const uri = '/sapi/v1/capital/withdraw/apply';
    const params: WithdrawParams = {
      coin,
      network,
      address,
      amount
    };

    if (addressTag) {
      params.addressTag = addressTag;
    }

    const transaction = await this.makeRequest('POST', uri, params);

    await sleep(2000);

    return await this.getWithdrawal(transaction.id);
  }

  async getTicker (symbol: string): Promise<FormattedTicker> {
    const uri = '/api/v3/ticker/price';
    const params = {
      symbol
    };
    const ticker = await this.makeRequest('GET', uri, params, true);

    return ticker;
  }

  async getTickers(): Promise<FormattedTicker[]> {
    const uri = '/api/v3/ticker/price';
    const tickers = await this.makeRequest('GET', uri, {}, true);

    return tickers.map(ticker => {
      return {
        ...ticker,
        baseSymbol: ticker.symbol
      }
    });
  }

  async getWithdrawal (id: string): Promise<FormattedWithdrawalTransaction> {
    const uri = '/sapi/v1/capital/withdraw/history';
    const withdrawals = await this.makeRequest('GET', uri);
    const withdraw =
      withdrawals.find((item: any) => {
        return item.id == id;
      }) || {};

    return {
      id,
      amount: withdraw.amount,
      fee: withdraw.transactionFee,
      coin: withdraw.coin,
      status: this.parseWithdrawalStatus(withdraw.status),
      address: withdraw.address,
      txid: withdraw.txId,
      network: withdraw.network,
      updatedAt: dateToTimestamp(withdraw.applyTime)
    };
  }

  async getKlines ({
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
    const uri = '/api/v3/klines';
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

  private async getCoinInformations (coin?: string) {
    const uri = '/sapi/v1/capital/config/getall';
    const informations = await this.makeRequest('GET', uri);

    if (coin) {
      return informations.find((information: any) => {
        return information.coin == coin;
      });
    }

    return informations;
  }

  private formatFormattedDepositTransactions (
    transactions: TransactionResponseData[]
  ): FormattedDepositTransaction[] {
    return transactions.map((transaction) => {
      return {
        id: transaction.id,
        amount: transaction.amount,
        coin: transaction.coin,
        address: transaction.address,
        network: transaction.network,
        addressTag: transaction.addressTag,
        txid: transaction.txId,
        status: this.parseDepositStatus(transaction.status),
        updatedAt: transaction.insertTime,
        fee: 0
      };
    });
  }

  private async calculateFilled (order: OrderResponseData) {
    const { fills, symbol } = order;

    if (!fills || isEmpty(fills)) {
      return {
        executedAmount: '0',
        executedPrice: '0',
        receivedQuantity: '0',
        fee: '0',
        feeCurrency: Currency.USDT
      };
    }

    let executedQuantity = BigNumber(0);
    let executedAmount = BigNumber(0);
    const fees: Fee[] = [];

    for (const trade of fills) {
      const { commissionAsset, qty, price, commission } = trade;

      executedQuantity = executedQuantity.plus(qty);
      executedAmount = BigNumber(price).multipliedBy(qty).plus(executedAmount);

      let assetFee = fees.find((item) => {
        return item.commissionAsset == commissionAsset;
      });

      if (assetFee) {
        assetFee.commission = BigNumber(assetFee.commission)
          .plus(commission)
          .toFixed();
      } else {
        assetFee = {
          commissionAsset,
          commission
        };

        fees.push(assetFee);
      }
    }

    const baseFee = fees.find((item: any) => {
      return this.isBaseAsset(item.commissionAsset, symbol);
    });
    const executedPrice = executedAmount.dividedBy(executedQuantity).toFixed();
    const receivedQuantity = executedQuantity
      .minus(baseFee ? baseFee.commission : 0)
      .toFixed();
    const usdtFee = await this.parseTradeUsdtFee(fees, executedPrice, symbol);

    return {
      executedAmount: executedAmount.toFixed(),
      executedPrice,
      receivedQuantity,
      fee: usdtFee,
      feeCurrency: Currency.USDT
    };
  }

  private parseDepositStatus (status: number): string {
    switch (status) {
      case ExchangeDepositStatus.PENDING:
        return TransactionStatus.PENDING;
      case ExchangeDepositStatus.EXECUTING:
        return TransactionStatus.EXECUTED;
      case ExchangeDepositStatus.EXECUTED:
        return TransactionStatus.EXECUTED;
      default:
        return '';
    }
  }

  private parseWithdrawalStatus (status: number): string {
    switch (status) {
      case ExchangeWithdrawalStatus.EMAIL_SENT:
      case ExchangeWithdrawalStatus.AWAITING:
        return TransactionStatus.PENDING;
      case ExchangeWithdrawalStatus.PROCESSING:
        return TransactionStatus.EXECUTING;
      case ExchangeWithdrawalStatus.COMPLETED:
        return TransactionStatus.EXECUTED;
      default:
        return TransactionStatus.EXECUTED;
    }
  }

  private async parseTradeUsdtFee (
    fees: Fee[],
    marketPrice: string,
    symbol: string
  ): Promise<string> {
    let usdtFee = BigNumber(0);

    for (const fee of fees) {
      const { commissionAsset, commission } = fee;

      if (commissionAsset == Currency.USDT || isStableCoin(commissionAsset)) {
        usdtFee = usdtFee.plus(commission);
        continue;
      }

      if (this.isBaseAsset(commissionAsset, symbol)) {
        const quoteAsset = symbol.substring(commissionAsset.length);

        if (quoteAsset == Currency.USDT) {
          usdtFee = BigNumber(marketPrice)
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

  private isBaseAsset (asset: string, symbol: string): boolean {
    const assetLength = asset.length;
    const firstSymbolAsset = symbol.substring(0, assetLength);

    return asset == firstSymbolAsset;
  }

  protected async getOrderTrades (params: OrderTradesParams): Promise<OrderTrade[]> {
    const uri = '/api/v3/myTrades';

    return await this.makeRequest('GET', uri, params);
  }

  protected async formatOrder (
    order: OrderResponseData
  ): Promise<FormattedOrder> {
    const {
      executedAmount,
      executedPrice,
      receivedQuantity,
      fee,
      feeCurrency
    } = await this.calculateFilled(order);
    const formattedOrder = {
      orderId: order.orderId,
      clientOrderId: order.clientOrderId,
      symbol: order.symbol,
      side: order.side,
      price: order.price,
      quantity: order.origQty,
      executedQuantity: order.executedQty,
      executedAmount,
      executedPrice,
      receivedQuantity,
      fee,
      feeCurrency,
      status: formatOrderStatus(order.status, order.executedQty)
    };

    return formattedOrder;
  }
}

export default BinanceSpotAPI;
