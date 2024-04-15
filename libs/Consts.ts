import {
  BadRequest,
  Forbidden,
  InternalServerError,
  NotFound,
  Unauthorized
} from "./Error";

export enum OrderStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  EXECUTED = 'executed',
  CLOSED = 'closed',
  CANCELED = 'canceled',
  TRIGGERED = 'triggered',
  ERROR = 'error',
}

export enum MarginType {
  ISOLATED = 'ISOLATED',
  CROSS = 'CROSSED',
}

export enum PositionSide {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

export enum OrderType {
  ENTRY = 'entry',
  STOP_LOSS = 'stop_loss',
  CLOSE = 'close',
  OPEN = 'open',
}

export enum TransactionStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  EXECUTED = 'executed',
  CANCELED = 'canceled',
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum Currency {
  ETH = 'ETH',
  USDT = 'USDT',
}

export enum OrderbookType {
  SNAPSHOT = 'snapshot',
}

export enum ExchangeMode {
  Future = 'future',
  Spot = 'spot'
}

export const HTTP_ERROR = {
  '400': BadRequest,
  '401': Unauthorized,
  '403': Forbidden,
  '404': NotFound,
  '500': InternalServerError
};

export const CURRENCY_USDT = 'USDT';

export const CURRENCY_KRW = 'KRW';