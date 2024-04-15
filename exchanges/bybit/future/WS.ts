import BigNumber from 'bignumber.js';

import { type ApiConfig } from '../../../libs/RequestConfig';
import BaseWS from '../BaseWS';
import { type AccountResponseData, type OrderResponseData } from '../ResponseData';
import { AccountType, CategoryType, ExchangeOrderSide } from '../Consts';
import { CURRENCY_USDT, Currency, OrderType, PositionSide } from '../../../libs/Consts';

class BybitFutureWSClient extends BaseWS {
  constructor (apiConfig: ApiConfig = {}) {
    super(apiConfig);
  }

  protected onOrderUpdated (orders: OrderResponseData[]) {
    const futureOrders = orders.filter((order) => {
      return order.category == CategoryType.LINEAR;
    });

    for (const order of futureOrders) {
      const positionSide = this.parsePositionSide(order.side, order.reduceOnly);
      const executedQuantity = order.cumExecQty;
      const executedAmount = order.cumExecValue || 0;
      let executedPrice = order.avgPrice;

      if (
        executedPrice &&
        executedQuantity &&
        BigNumber(executedPrice).isLessThanOrEqualTo(0) &&
        BigNumber(executedAmount).isGreaterThan(0)
      ) {
        executedPrice = +BigNumber(executedAmount)
          .dividedBy(executedQuantity)
          .toFixed();
      }

      const formattedOrder = {
        symbol: order.symbol,
        baseSymbol: order.symbol,
        side: order.side.toUpperCase(),
        orderType: order.orderType.toUpperCase(),
        originalQuantity: order.qty,
        originalPrice: order.price,
        executedPrice,
        executedQuantity,
        receivedQuantity: executedQuantity,
        status: this.parseOrderStatus(order.orderStatus),
        orderId: order.orderId,
        positionSide,
        clientOrderId: order.orderLinkId,
        executedTime: order.updatedTime,
        orderSide: order.reduceOnly ? OrderType.CLOSE : OrderType.OPEN,
        fee: order.cumExecFee,
        feeCurrency: Currency.USDT
      };

      this.emit('orderUpdated', formattedOrder);
    }
  }

  protected onBalanceUpdated (accounts: AccountResponseData[]) {
    const contractAccount = accounts.find((account) => {
      return account.accountType == AccountType.UNIFIED;
    });

    if (!contractAccount) {
      return;
    }

    const formattedBalances = contractAccount.coin.filter(balance => {
      return balance.coin == CURRENCY_USDT;
    }).map((balance) => {
      return {
        asset: balance.coin,
        availableBalance: balance.availableToWithdraw,
        balance: balance.walletBalance,
        usdtBalance: balance.walletBalance
      };
    });

    this.emit('balanceUpdated', formattedBalances);
  }

  protected getPublicUrl () {
    return 'wss://stream.bybit.com/v5/public/linear';
  }

  private parsePositionSide (side: ExchangeOrderSide, reduceOnly: boolean) {
    if (
      (side == ExchangeOrderSide.BUY && !reduceOnly) ||
      (side == ExchangeOrderSide.SELL && reduceOnly)
    ) {
      return PositionSide.LONG;
    }

    return PositionSide.SHORT;
  }
}

export default BybitFutureWSClient;
