/* eslint-disable max-len */
import {
  AuthenticationError,
  BadRequest,
  ExchangeError,
  Forbidden,
  InsufficientFunds,
  InvalidOrder,
  NotFound,
  OrderNotFound,
  PermissionDenied,
  RateLimitExceeded
} from '../../libs/Error';

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum MarginType {
  ISOLATED = 'ISOLATED',
  CROSS = 'CROSSED',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
}

export enum TimeInForce {
  GTC = 'GTC',
  IOC = 'IOC',
  POST_ONLY = 'PostOnly',
  FOK = 'FOK',
  POC = 'POC',
}

export enum FundingType {
  FUNDING_FEE = 'FUNDING_FEE',
}

export enum ResponseType {
  RESULT = 'RESULT',
  FULL = 'FULL',
}

export enum Currency {
  USDT = 'USDT',
}

export enum ExchangePositionSide {
  BOTH = 'BOTH',
}

export const MAXIMUM_KLINE_LIMIT: number = 1000;

export enum ExchangeOrderStatus {
  NEW = 'NEW',
  PENDING = 'PENDING',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  CANCELED = 'CANCELED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
}

export enum ExchangeDepositStatus {
  CONFIRMED = 0,
  TO_BE_CONFIRMED = 10,
  APPLIED_FOR_BLOCK = 20,
  APPROVED_AND_PASSED = 30,
  APPROVAL_FAILED = 40,
  EXPORTED = 50,
  PRELIMINARY_CONFIRMATION_OF_RECHARGE = 60,
  APPROVED_FAILED_AND_RETURN_ASSETS = 70,
}

export enum ExchangeWithdrawalStatus {
  CONFIRMED = 0,
  TO_BE_CONFIRMED = 10,
  APPLIED_FOR_BLOCK = 20,
  APPROVED_AND_PASSED = 30,
  APPROVAL_FAILED = 40,
  EXPORTED = 50,
  PRELIMINARY_CONFIRMATION_OF_RECHARGE = 60,
  APPROVED_FAILED_AND_RETURN_ASSETS = 70,
}

export enum WalletType {
  FUND_ACCOUNT = 1,
  STANDARD_ACCOUNT = 2,
  PERPETUAL_ACCOUNT = 3,
}

export enum ExchangeOrderType {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
  STOP = 'STOP',
  TAKE_PROFIT = 'TAKE_PROFIT',
  STOP_MARKET = 'STOP_MARKET',
  TAKE_PROFIT_MARKET = 'TAKE_PROFIT_MARKET',
  STOP_LOSS = 'STOP_LOSS',
  STOP_LOSS_LIMIT = 'STOP_LOSS_LIMIT',
  TAKE_PROFIT_LIMIT = 'TAKE_PROFIT_LIMIT',
}

export const CURRENT_SYSTEM_IS_BUSY: number = 100400;
export const SUCCESS_CODE = 0;

export const BASE_API_URL= 'https://open-api.bingx.com';
export const BASE_WS_URL= 'wss://open-api-swap.bingx.com/swap-market';
export const BASE_SPOT_WS_URL= 'wss://open-api-ws.bingx.com/market';
export const URL_FUTURE_PREFIX= '/openApi/swap/v2';
export const URL_SPOT_PREFIX= '/openApi/spot/v1';

export const RESTART_SOCKET_DELAY_TIME = 5000;
export const PING_INTERVAL_TIME = 60000;
export const PONG_TIMEOUT_TIME = 10000;
export const PING_LISTEN_KEY_INTERVAL_TIME = 1800000;

export const EXCHANGE_EXCEPTION = {
  '100500': ExchangeError,  //Internal system error
  '80012': ExchangeError,  //service unavailable
  '80001': ExchangeError,
  '80013': ExchangeError, //The number of your entrusted orders has reached the system limit. If you need to place an order, please cancel other orders first

  '80016': OrderNotFound, //Order does not exist

  '80017': NotFound, //position does not exist

  '80020': Forbidden, //risk forbidden

  '100004': PermissionDenied, //Permission denied as the API key was created without the permission
  '100419': PermissionDenied, //IP does not match IP whitelist

  '101204': InsufficientFunds, //Insufficient margin
  '101400': InsufficientFunds, // 101400

  '100001': AuthenticationError, //signature verification failed
  '100412': AuthenticationError,// Null signature
  '100413': AuthenticationError,// Incorrect apiKey
  '100421': AuthenticationError,// Null timestamp or timestamp mismatch

  '101209': InvalidOrder,// The maximum position value for this leverage is 5000 USDT
  '101211': InvalidOrder, // Post only order invalid price
  '101215': InvalidOrder,// The Maker (Post Only) order ensures that the user always acts as a maker.If the order would immediately match with available orders in the market, it will be canceled.
  '101414': InvalidOrder,// The maximum leverage for the trading pair is *, please reduce the leverage
  '101415': InvalidOrder,// This trading pair is suspended from opening new position
  '101460': InvalidOrder,// The order price should be higher than the estimated liquidation price of the long position
  '101500': InvalidOrder,// rpc timeout
  '101514': InvalidOrder,// You're temporarily suspended from opening positions. Please try again later

  '109201': RateLimitExceeded,// The same order number is only allowed to be submitted once within 1 second.

  '80014': BadRequest,//Invalid parameter
  '80018': BadRequest, //order is already filled
  '80019': BadRequest, //The order is being processed. Please use the allOrders interface to retrieve the order details later
  '100400': BadRequest,
  '101212': BadRequest,// Failed. Please check if you have pending orders under the trading pair. If yes, please cancel them and try again
};