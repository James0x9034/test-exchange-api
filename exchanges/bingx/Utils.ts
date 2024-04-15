import BigNumber from 'bignumber.js';
import {
  ExchangeOrderStatus
} from './Consts';
import {
  OrderStatus
} from '../../libs/Consts';

export function formatOrderStatus (
  status: ExchangeOrderStatus,
  executedQty: string
): OrderStatus {
  // if order filled partially then was canceled, we pretend this order has been executed
  if (
    BigNumber(executedQty).isGreaterThan(0) &&
    status === ExchangeOrderStatus.CANCELED
  ) {
    return OrderStatus.EXECUTED;
  }

  switch (status) {
    case ExchangeOrderStatus.NEW:
      return OrderStatus.PENDING;
    case ExchangeOrderStatus.PARTIALLY_FILLED:
      return OrderStatus.EXECUTING;
    case ExchangeOrderStatus.FILLED:
      return OrderStatus.EXECUTED;
    case ExchangeOrderStatus.CANCELED:
    case ExchangeOrderStatus.REJECTED:
    case ExchangeOrderStatus.FAILED:
    case ExchangeOrderStatus.EXPIRED:
      return OrderStatus.CANCELED;
    default:
      return OrderStatus.PENDING; // You may want to provide a default case or handle it differently
  }
}
