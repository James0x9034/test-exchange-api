import BigNumber from 'bignumber.js';
import {
  type ApiConfig
} from '../../../libs/RequestConfig';
import BaseWS from '../BaseWS';
import {
  ExchangeOrderSide,
  ExchangeOrderState,
  ExchangePositionSide,
  InstrumentType,
  ResponseCode
} from '../Consts';
import {
  OrderStatus,
  OrderType
} from '../../../libs/Consts';

class OKXFutureWSClient extends BaseWS {
  constructor(apiConfig: ApiConfig = {}) {
    super(apiConfig);
  }

  protected onAuthenticated(code: string) {
    if (code != ResponseCode.OK) {
      this.restartSocket();
      return;
    }

    this.subscribeOrderChannel(InstrumentType.SWAP);
    this.subscribeBalanceChannel();
  }

  protected onOrderUpdated(orders: any, instrumentType: InstrumentType) {
    if (instrumentType != InstrumentType.SWAP) {
      return;
    }

    for (const order of orders) {
      const arrInstrument = order.instId.split('-');
      const orderFee = this.getOrderFee(order);
      const formattedOrder = {
        symbol: order.instId,
        baseSymbol: arrInstrument[0] + arrInstrument[1],
        side: order.side.toUpperCase(),
        orderType: order.ordType.toUpperCase(),
        originalQuantity: order.sz,
        originalPrice: order.px,
        executedPrice: order.avgPx,
        executedQuantity: order.accFillSz,
        status: this.parseOrderStatus(order),
        orderId: order.ordId,
        positionSide: order.posSide.toUpperCase(),
        clientOrderId: order.clOrdId,
        executedTime: order.uTime,
        orderSide: this.getOrderSide(order),
        pnlAmount: this.getOrderPnl(order),
        leverage: order.lever,
        ...orderFee
      };

      this.emit('orderUpdated', formattedOrder);
    }
  }

  private getOrderSide(order: any) {
    const {
      posSide,
      side
    } = order;

    if (
      (posSide == ExchangePositionSide.LONG && side == ExchangeOrderSide.BUY) ||
      (posSide == ExchangePositionSide.SHORT && side == ExchangeOrderSide.SELL)
    ) {
      return OrderType.OPEN;
    }

    return OrderType.CLOSE;
  }

  private getOrderFee(order: any) {
    const {
      avgPx,
      fee,
      feeCcy,
      instId
    } = order;
    const arrInstrument = instId.split('-');
    const calculatedFee = BigNumber(fee).abs();

    if (arrInstrument[1] == feeCcy) {
      return {
        fee: calculatedFee.toFixed(),
        feeCurrency: feeCcy
      };
    }

    return {
      fee: calculatedFee.multipliedBy(avgPx).toFixed(),
      feeCurrency: arrInstrument[1]
    };
  }

  private getOrderPnl(order: any) {
    const {
      avgPx,
      pnl,
      feeCcy,
      instId
    } = order;
    const arrInstrument = instId.split('-');
    const calculatedPnl = BigNumber(pnl);

    if (arrInstrument[1] == feeCcy) {
      return calculatedPnl.toFixed();
    }

    return calculatedPnl.multipliedBy(avgPx).toFixed();
  }

  private parseOrderStatus({
    state,
    accFillSz
  }: any) {
    if (
      state == ExchangeOrderState.CANCELED &&
      accFillSz &&
      BigNumber(accFillSz).isGreaterThan(0)
    ) {
      return OrderStatus.EXECUTED;
    }

    switch (state) {
      case ExchangeOrderState.LIVE:
        return OrderStatus.PENDING;
      case ExchangeOrderState.PARTIALLY_FILLED:
        return OrderStatus.EXECUTING;
      case ExchangeOrderState.FILLED:
        return OrderStatus.EXECUTED;
      case ExchangeOrderState.CANCELED:
        return OrderStatus.CANCELED;
    }
  }
}

export default OKXFutureWSClient;