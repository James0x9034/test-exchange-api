import {
  AuthenticationError,
  BadRequest,
  ExchangeError,
  InsufficientFunds,
  InvalidOrder,
  OrderNotFound,
  PermissionDenied
} from '../../libs/Error';

export enum ExchangeOrderSide {
  BID = 'bid',
  ASK = 'ask',
}

export enum ExchangeOrderType {
  LIMIT = 'limit',
  BUY_MARKET = 'price',
  SELL_MARKET = 'market',
}

export enum ExchangeTransactionStatus {
  SUBMITTING = 'submitting',
  WAITING = 'waiting',
  SUBMITTED = 'submitted',
  ALMOST_ACCEPTED = 'almost_accepted',
  PROCESSING = 'processing',
  ACCEPTED = 'accepted',
  DONE = 'done',
  REJECTED = 'rejected',
  CANCELED = 'canceled',
}

export enum ExchangeOrderState {
  DONE = 'done',
  CANCEL = 'cancel',
  WAIT = 'wait',
  WATCH = 'watch',
}

export const MAXIMUM_LIMIT_KLINE_REQUEST = 200;

export const EXCHANGE_EXCEPTION = {
  'This key has expired.': AuthenticationError,
  invalid_access_key: AuthenticationError,
  jwt_verification: AuthenticationError,

  'Missing request parameter error. Check the required parameters!': BadRequest,

  'side is missing, side does not have a valid value': InvalidOrder,
  volume_too_large: InvalidOrder,
  invalid_funds: InvalidOrder,

  thirdparty_agreement_required: PermissionDenied,
  out_of_scope: PermissionDenied,

  order_not_found: OrderNotFound,

  insufficient_funds: InsufficientFunds,

  create_ask_error: ExchangeError,
  create_bid_error: ExchangeError
};
