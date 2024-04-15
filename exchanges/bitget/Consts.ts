/* eslint-disable max-len */
import {
  AccountSuspended,
  ArgumentsRequired,
  AuthenticationError,
  BadRequest,
  BadSymbol,
  CancelPending,
  DDoSProtection,
  ExchangeError,
  ExchangeNotAvailable,
  InsufficientFunds,
  InsufficientPositions,
  InvalidAddress,
  InvalidNonce,
  InvalidOrder,
  OnMaintenance,
  OrderNotFound,
  PermissionDenied,
  RateLimitExceeded,
  RequestTimeout
} from '../../libs/Error';

export enum ExchangeOrderSide {
  OPEN_LONG = 'open_long',
  OPEN_SHORT = 'open_short',
  CLOSE_LONG = 'close_long',
  CLOSE_SHORT = 'close_short',
  BUY_SINGLE = 'buy_single',
  SELL_SINGLE = 'sell_single'
}

export enum MarginMode {
  FIXED = 'fixed',
  CROSSED = 'crossed'
}

export enum HoldSide {
  LONG = 'long'
}

export enum OrderState {
  FILLED = 3
}

export enum SwapType {
  OPEN_LONG = 1,
  CLOSE_SHORT = 4
}

export enum HoldMode {
  ONE_WAY = 'single_hold',
  TWO_WAY = 'double_hold'
}

export enum ExchangeTransactionStatus {
  PENDING = 'pending',
  PENDING_REVIEW = 'pending_review',
  PENDING_FAIL = 'pending_fail',
  PENDING_REVIEW_FAIL = 'pending_review_fail',
  REJECT = 'reject',
  SUCCESS = 'success',
  WALLET_PROCESSING = 'wallet_processing'
}

export enum ExchangeTimeInForce {
  GTC = 'normal',
  POST_ONLY = 'post_only'
}

export enum ExchangeOrderSide {
  BUY = 'buy'
}

export enum ExchangeOrderType {
  LIMIT = 'limit',
  MARKET = 'market'
}

export enum ExchangeOrderStatus {
  INIT = 'init',
  NEW = 'new',
  PARTIAL_FILL = 'partial_fill',
  FULL_FILL = 'full_fill',
  CANCELLED = 'cancelled',
  SOCKET_PARTIAL_FILL = 'partial-fill',
  SOCKET_FULL_FILL = 'full-fill'
}

export enum ProductType {
  USDT_PERPETUAL = 'umcbl'
}

export const URL_MIX_API_PREFIX = '/api/mix/v1';
export const SWAP_WS_URL = 'wss://ws.bitget.com/mix/v1/stream';
export const DEPOSIT_START_TIME_DIFF_DEFAULT = 604800000;
export const BITGET_MAXIMUM_KLINE_LIMIT = 1000;
export const SUCCESS_CODE = '00000';
export const BITGET_BROKER= 'p8xy5';

export const EXCHANGE_EXCEPTION: { [code: number | string]: any } = {
  1: ExchangeError, // { "code": 1, "message": "System error" }
  4001: ExchangeError, // no data received in 30s
  4002: ExchangeError, // Buffer full. cannot write data
  30009: ExchangeError, // { "code": 30009, "message": "system error" }
  30016: ExchangeError, // { "code": 30015, "message": "you are using v1 apiKey, please use v1 endpoint. If you would like to use v3 endpoint, please subscribe to v3 apiKey" }
  30017: ExchangeError, // { "code": 30017, "message": "apikey's broker id does not match" }
  30018: ExchangeError, // { "code": 30018, "message": "apikey's domain does not match" }
  30030: ExchangeError, // { "code": 30030, "message": "endpoint request failed. Please try again" }
  30034: ExchangeError, // { "code": 30034, "message": "exchange ID does not exist" }
  30035: ExchangeError, // { "code": 30035, "message": "trading is not supported in this website" }
  30036: ExchangeError, // { "code": 30036, "message": "no relevant data" }
  // future
  32010: ExchangeError, // { "code": 32010, "message": "leverage cannot be changed with open positions" }
  32011: ExchangeError, // { "code": 32011, "message": "futures status error" }
  32012: ExchangeError, // { "code": 32012, "message": "futures order update error" }
  32013: ExchangeError, // { "code": 32013, "message": "token type is blank" }
  32014: ExchangeError, // { "code": 32014, "message": "your number of contracts closing is larger than the number of contracts available" }
  32015: ExchangeError, // { "code": 32015, "message": "margin ratio is lower than 100% before opening positions" }
  32016: ExchangeError, // { "code": 32016, "message": "margin ratio is lower than 100% after opening position" }
  32017: ExchangeError, // { "code": 32017, "message": "no BBO" }
  32018: ExchangeError, // { "code": 32018, "message": "the order quantity is less than 1, please try again" }
  32019: ExchangeError, // { "code": 32019, "message": "the order price deviates from the price of the previous minute by more than 3%" }
  32020: ExchangeError, // { "code": 32020, "message": "the price is not in the range of the price limit" }
  32021: ExchangeError, // { "code": 32021, "message": "leverage error" }
  32022: ExchangeError, // { "code": 32022, "message": "this function is not supported in your country or region according to the regulations" }
  32023: ExchangeError, // { "code": 32023, "message": "this account has outstanding loan" }
  32024: ExchangeError, // { "code": 32024, "message": "order cannot be placed during delivery" }
  32025: ExchangeError, // { "code": 32025, "message": "order cannot be placed during settlement" }
  32026: ExchangeError, // { "code": 32026, "message": "your account is restricted from opening positions" }
  32027: ExchangeError, // { "code": 32027, "message": "cancelled over 20 orders" }
  32029: ExchangeError, // { "code": 32029, "message": "order info does not exist" }
  32040: ExchangeError, // User have open contract orders or position
  32044: ExchangeError, // { "code": 32044, "message": "The margin ratio after submitting this order is lower than the minimum requirement ({0}) for your tier." }
  32045: ExchangeError, // String of commission over 1 million
  32046: ExchangeError, // Each user can hold up to 10 trade plans at the same time
  32047: ExchangeError, // system error
  32049: ExchangeError, // Each user can hold up to 10 track plans at the same time
  32052: ExchangeError, // String of commission over 100 thousand
  32053: ExchangeError, // Each user can hold up to 6 ice plans at the same time
  32057: ExchangeError, // The order price is zero. Market-close-all function cannot be executed
  32054: ExchangeError, // Trade not allow
  32056: ExchangeError, // iceberg per order average should between {0}-{1} contracts
  32058: ExchangeError, // Each user can hold up to 6 initiative plans at the same time
  32064: ExchangeError, // Time Stringerval of orders should set between 5-120s
  32065: ExchangeError, // Close amount exceeds the limit of Market-close-all (999 for BTC, and 9999 for the rest tokens)
  32066: ExchangeError, // You have open orders. Please cancel all open orders before changing your leverage level.
  32067: ExchangeError, // Account equity < required margin in this setting. Please adjust your leverage level again.
  32068: ExchangeError, // The margin for this position will fall short of the required margin in this setting. Please adjust your leverage level or increase your margin to proceed.
  32069: ExchangeError, // Target leverage level too low. Your account balance is insufficient to cover the margin required. Please adjust the leverage level again.
  32070: ExchangeError, // Please check open position or unfilled order
  32071: ExchangeError, // Your current liquidation mode does not support this action.
  32072: ExchangeError, // The highest available margin for your order’s tier is {0}. Please edit your margin and place a new order.
  32073: ExchangeError, // The action does not apply to the token
  32074: ExchangeError, // The number of contracts of your position, open orders, and the current order has exceeded the maximum order limit of this asset.
  32075: ExchangeError, // Account risk rate breach
  32076: ExchangeError, // Liquidation of the holding position(s) at market price will require cancellation of all pending close orders of the contracts.
  32077: ExchangeError, // Your margin for this asset in futures account is insufficient and the position has been taken over for liquidation. (You will not be able to place orders, close positions, transfer funds, or add margin during this period of time. Your account will be restored after the liquidation is complete.)
  32078: ExchangeError, // Please cancel all open orders before switching the liquidation mode(Please cancel all open orders before switching the liquidation mode)
  32079: ExchangeError, // Your open positions are at high risk.(Please add margin or reduce positions before switching the mode)
  32080: ExchangeError, // Funds cannot be transferred out within 30 minutes after futures settlement
  32083: ExchangeError, // The number of contracts should be a positive multiple of %%. Please place your order again
  // account
  21009: ExchangeError, // Funds cannot be transferred out within 30 minutes after swap settlement(Funds cannot be transferred out within 30 minutes after swap settlement)
  34003: ExchangeError, // { "code": 34003, "message": "sorry, this token cannot be withdrawn to xx at the moment" }
  34004: ExchangeError, // { "code": 34004, "message": "withdrawal fee is smaller than minimum limit" }
  34005: ExchangeError, // { "code": 34005, "message": "withdrawal fee exceeds the maximum limit" }
  34006: ExchangeError, // { "code": 34006, "message": "withdrawal amount is lower than the minimum limit" }
  34007: ExchangeError, // { "code": 34007, "message": "withdrawal amount exceeds the maximum limit" }
  34009: ExchangeError, // { "code": 34009, "message": "your withdrawal amount exceeds the daily limit" }
  34010: ExchangeError, // { "code": 34010, "message": "transfer amount must be larger than 0" }
  34011: ExchangeError, // { "code": 34011, "message": "conditions not met" }
  34012: ExchangeError, // { "code": 34012, "message": "the minimum withdrawal amount for NEO is 1, and the amount must be an integer" }
  34013: ExchangeError, // { "code": 34013, "message": "please transfer" }
  34014: ExchangeError, // { "code": 34014, "message": "transfer limited" }
  34015: ExchangeError, // { "code": 34015, "message": "subaccount does not exist" }
  34022: ExchangeError, // { "code": 34022, "message": "Withdrawals are not available for sub accounts" }
  34026: ExchangeError, // transfer too frequently(transfer too frequently)
  34036: ExchangeError, // Parameter is incorrect, please refer to API documentation
  34037: ExchangeError, // Get the sub-account balance interface, account type is not supported
  34038: ExchangeError, // Since your C2C transaction is unusual, you are restricted from fund transfer. Please contact our customer support to cancel the restriction
  34039: ExchangeError, // You are now restricted from transferring out your funds due to abnormal trades on C2C Market. Please transfer your fund on our website or app instead to verify your identity
  40725: ExchangeError, // { "code": "40725", "msg": "service return an error", "requestTime": 1666268894071, "data": null }
  // spot
  'invalid user': ExchangeError,
  'invalid record': ExchangeError,
  'need to bind email or mobile': ExchangeError,
  'base date error': ExchangeError,
  'gateway internal error': ExchangeError,
  'audit failed': ExchangeError,
  'userid not equal to account_id': ExchangeError,
  'address invalid cointype': ExchangeError,
  'system exception': ExchangeError, // {"status":"error","ts":1595711862763,"err_code":"system exception","err_msg":"system exception"}
  50003: ExchangeError, // No record
  50010: ExchangeError, // The account is abnormally frozen. If you have any questions, please contact customer service.
  'invalid order query time': ExchangeError, // start time is greater than end time; or the time interval between start time and end time is greater than 48 hours
  20003: ExchangeError, // operation failed, {"status":"error","ts":1595730308979,"err_code":"bad-request","err_msg":"20003"}
  '01001': ExchangeError, // order failed, {"status":"fail","err_code":"01001","err_msg":"系统异常，请稍后重试"}
  36005: ExchangeError, // Instrument status is invalid.
  36204: ExchangeError, // Invalid format for request_id.
  36214: ExchangeError, // Instrument does not have valid bid/ask quote.
  'invalid size, valid range': ExchangeError,
  // '00000': ExchangeError, // success
  '40013': ExchangeError, // User status is abnormal
  '40015': ExchangeError, // System is abnormal, please try again later
  '40017': ExchangeError, // Parameter verification failed
  '40104': ExchangeError, // Lever adjustment failure
  '40105': ExchangeError, // Abnormal access to current price limit data
  '40106': ExchangeError, // Abnormal get next settlement time
  '40107': ExchangeError, // Abnormal access to index price data
  '40202': ExchangeError, // User information cannot be empty
  '40300': ExchangeError, // User does not exist
  '40306': ExchangeError, // Batch processing orders can only process up to 20
  '40400': ExchangeError, // Status check abnormal
  '40401': ExchangeError, // The operation cannot be performed
  '40407': ExchangeError, // The query direction is not the direction entrusted by the plan
  '40408': ExchangeError, // Wrong time range
  '40409': ExchangeError, // Time format error
  '40501': ExchangeError, // Channel name error
  '40502': ExchangeError, // If it is a copy user, you must pass the copy to whom
  '40503': ExchangeError, // With the single type
  '40504': ExchangeError, // Platform code must pass
  '40505': ExchangeError, // Not the same as single type
  '40508': ExchangeError, // KOL is not authorized
  '40509': ExchangeError, // Abnormal copy end
  '40600': ExchangeError, // Copy function suspended
  '40601': ExchangeError, // Followers cannot be KOL
  '40602': ExchangeError, // The number of copies has reached the limit and cannot process the request
  '40603': ExchangeError, // Abnormal copy end
  '40605': ExchangeError, // Copy type, the copy number must be passed
  '40606': ExchangeError, // The type of document number is wrong
  '40607': ExchangeError, // Document number must be passed
  '40608': ExchangeError, // No documented products currently supported
  '40609': ExchangeError, // The contract product does not support copying
  '40701': ExchangeError, // KOL is not authorized
  '40702': ExchangeError, // Unauthorized copying user
  '40703': ExchangeError, // Bill inquiry start and end time cannot be empty
  '40704': ExchangeError, // Can only check the data of the last three months
  '40709': ExchangeError, // There is no position in this position, and no automatic margin call can be set
  '40710': ExchangeError, // Abnormal account status
  '40713': ExchangeError, // Cannot exceed the maximum transferable margin amount
  '40714': ExchangeError, // No direct margin call is allowed
  '33004': ExchangeError, // { "code": 33004, "message": "loan amount cannot be smaller than the minimum limit" }
  '33005': ExchangeError, // { "code": 33005, "message": "repayment amount must exceed 0" }
  '33006': ExchangeError, // { "code": 33006, "message": "loan order not found" }
  '33007': ExchangeError, // { "code": 33007, "message": "status not found" }
  '33009': ExchangeError, // { "code": 33009, "message": "user ID is blank" }
  '33010': ExchangeError, // { "code": 33010, "message": "you cannot cancel an order during session 2 of call auction" }
  '33011': ExchangeError, // { "code": 33011, "message": "no new market data" }
  '33012': ExchangeError, // { "code": 33012, "message": "order cancellation failed" }
  '33016': ExchangeError, // { "code": 33016, "message": "margin trading is not open for this token" }
  '33018': ExchangeError, // { "code": 33018, "message": "this parameter must be smaller than 1" }
  '33020': ExchangeError, // { "code": 33020, "message": "request not supported" }
  '33023': ExchangeError, // { "code": 33023, "message": "you can only place market orders during call auction" }
  '33026': ExchangeError, // { "code": 33026, "message": "transaction completed" }
  '33034': ExchangeError, // { "code": 33034, "message": "You can only place limit order after Call Auction has started" }
  '33035': ExchangeError, // This type of order cannot be canceled(This type of order cannot be canceled)
  '33036': ExchangeError, // Exceeding the limit of entrust order
  '33037': ExchangeError, // The buy order price should be lower than 130% of the trigger price
  '33038': ExchangeError, // The sell order price should be higher than 70% of the trigger price
  '33039': ExchangeError, // The limit of callback rate is 0 < x <= 5%
  '33040': ExchangeError, // The trigger price of a buy order should be lower than the latest transaction price
  '33041': ExchangeError, // The trigger price of a sell order should be higher than the latest transaction price
  '33042': ExchangeError, // The limit of price variance is 0 < x <= 1%
  '33043': ExchangeError, // The total amount must be larger than 0
  '33044': ExchangeError, // The average amount should be 1/1000 * total amount <= x <= total amount
  '33045': ExchangeError, // The price should not be 0, including trigger price, order price, and price limit
  '33046': ExchangeError, // Price variance should be 0 < x <= 1%
  '33047': ExchangeError, // Sweep ratio should be 0 < x <= 100%
  '33048': ExchangeError, // Per order limit: Total amount/1000 < x <= Total amount
  '33049': ExchangeError, // Total amount should be X > 0
  '33050': ExchangeError, // Time interval should be 5 <= x <= 120s
  '33051': ExchangeError, // cancel order number not higher limit: plan and track entrust no more than 10, ice and time entrust no more than 6
  '33061': ExchangeError, // Value of a single market price order cannot exceed 100,000 USD
  '33062': ExchangeError, // The leverage ratio is too high. The borrowed position has exceeded the maximum position of this leverage ratio. Please readjust the leverage ratio
  '33063': ExchangeError, // Leverage multiple is too low, there is insufficient margin in the account, please readjust the leverage ratio
  '33064': ExchangeError, // The setting of the leverage ratio cannot be less than 2, please readjust the leverage ratio
  '33065': ExchangeError, // Leverage ratio exceeds maximum leverage ratio, please readjust leverage ratio
  '35001': ExchangeError, // { "code": 35001, "message": "Contract does not exist" }
  '35002': ExchangeError, // { "code": 35002, "message": "Contract settling" }
  '35003': ExchangeError, // { "code": 35003, "message": "Contract paused" }
  '35004': ExchangeError, // { "code": 35004, "message": "Contract pending settlement" }
  '35017': ExchangeError, // { "code": 35017, "message": "Open orders exist" }
  '35022': ExchangeError, // { "code": 35022, "message": "Contract status error" }
  '35024': ExchangeError, // { "code": 35024, "message": "Contract not initialized" }
  '35026': ExchangeError, // { "code": 35026, "message": "Contract settings not initialized" }
  '35032': ExchangeError, // { "code": 35032, "message": "Invalid user status" }
  '35037': ExchangeError, // No last traded price in cache
  '35039': ExchangeError, // { "code": 35039, "message": "Open order quantity exceeds limit" }
  '35044': ExchangeError, // { "code": 35044, "message": "Invalid order status" }
  '35048': ExchangeError, // { "code": 35048, "message": "User contract is frozen and liquidating" }
  '35053': ExchangeError, // { "code": 35053, "message": "Account risk too high" }
  '35057': ExchangeError, // { "code": 35057, "message": "No last traded price" }
  '35058': ExchangeError, // { "code": 35058, "message": "No limit" }
  '35090': ExchangeError, // No stop-limit orders available for cancelation
  '35091': ExchangeError, // No trail orders available for cancellation
  '35092': ExchangeError, // No iceberg orders available for cancellation
  '35093': ExchangeError, // No trail orders available for cancellation
  '35094': ExchangeError, // Stop-limit order last traded price error
  '35096': ExchangeError, // Algo order status error
  '35097': ExchangeError, // Order status and order ID cannot exist at the same time
  '35098': ExchangeError, // An order status or order ID must exist
  '35099': ExchangeError, // Algo order ID error
  '1002': ExchangeError, // {0} verifications within 24 hours
  '1003': ExchangeError, // You failed more than {0} times today, the current operation is locked, please try again in 24 hours
  // '00000': ExchangeError, // success

  'failure to get a peer from the ring-balancer': ExchangeNotAvailable, // { "message": "failure to get a peer from the ring-balancer" }
  30019: ExchangeNotAvailable, // { "code": 30019, "message": "Api is offline or unavailable" }
  30037: ExchangeNotAvailable, // { "code": 30037, "message": "endpoint is offline or unavailable" }
  '40604': ExchangeNotAvailable, // Server is busy, please try again later
  '500': ExchangeNotAvailable, // System busy

  4010: PermissionDenied, // { "code": 4010, "message": "For the security of your funds, withdrawals are not permitted within 24 hours after changing fund password  / mobile number / Google Authenticator settings " }
  30011: PermissionDenied, // { "code": 30011, "message": "invalid IP" }
  30022: PermissionDenied, // { "code": 30022, "message": "Api has been frozen" }
  30028: PermissionDenied, // { "code": 30028, "message": "unauthorized execution" }
  32002: PermissionDenied, // { "code": 32002, "message": "futures account does not exist" }
  34001: PermissionDenied, // { "code": 34001, "message": "withdrawal suspended" }
  34016: PermissionDenied, // { "code": 34016, "message": "transfer suspended" }
  34019: PermissionDenied, // { "code": 34019, "message": "please bind your email before withdrawal" }
  34020: PermissionDenied, // { "code": 34020, "message": "please bind your funds password before withdrawal" }
  34023: PermissionDenied, // { "code": 34023, "message": "Please enable futures trading before transferring your funds" }
  40018: PermissionDenied, // Invalid IP
  // option
  36102: PermissionDenied, // Account status is invalid.
  36104: PermissionDenied, // Account is not enabled for options trading.
  36105: PermissionDenied, // Please enable the account for option contract.
  36107: PermissionDenied, // Funds cannot be transferred out within 30 minutes after option exercising or settlement.
  36109: PermissionDenied, // Funds cannot be transferred in or out during option exercising or settlement.
  36201: PermissionDenied, // New order function is blocked.
  36202: PermissionDenied, // Account does not have permission to short option.
  // spot
  'permissions not right': PermissionDenied, // {"status":"error","ts":1595704490084,"err_code":"invalid-parameter","err_msg":"permissions not right"}
  'user forbid': PermissionDenied,
  'User Prohibited Cash Withdrawal': PermissionDenied,
  'the account with in 24 hours ban coin': PermissionDenied,
  50006: PermissionDenied, // The account is forbidden to withdraw. If you have any questions, please contact customer service.
  50007: PermissionDenied, // The account is forbidden to withdraw within 24 hours. If you have any questions, please contact customer service.
  43111: PermissionDenied, // {"code":"43111","msg":"参数错误 address not in address book","requestTime":1665394201164,"data":null}
  '40014': PermissionDenied, // Incorrect permissions
  '40016': PermissionDenied, // The user must bind the phone or Google
  '40301': PermissionDenied, // Permission has not been obtained yet. If you need to use it, please contact customer service
  '33001': PermissionDenied, // { "code": 33001, "message": "margin account for this pair is not enabled yet" }
  '403': PermissionDenied, // Access prohibited

  30001: AuthenticationError, // { "code": 30001, "message": 'request header "OK_ACCESS_KEY" cannot be blank'}
  30002: AuthenticationError, // { "code": 30002, "message": 'request header "OK_ACCESS_SIGN" cannot be blank'}
  30003: AuthenticationError, // { "code": 30003, "message": 'request header "OK_ACCESS_TIMESTAMP" cannot be blank'}
  30004: AuthenticationError, // { "code": 30004, "message": 'request header "OK_ACCESS_PASSPHRASE" cannot be blank'}
  30006: AuthenticationError, // { "code": 30006, "message": "invalid OK_ACCESS_KEY" }
  30010: AuthenticationError, // { "code": 30010, "message": "API validation failed" }
  30012: AuthenticationError, // { "code": 30012, "message": "invalid authorization" }
  30013: AuthenticationError, // { "code": 30013, "message": "invalid sign" }
  30015: AuthenticationError, // { "code": 30015, "message": 'request header "OK_ACCESS_PASSPHRASE" incorrect'}
  30027: AuthenticationError, // { "code": 30027, "message": "login failure" }
  // '30038': AuthenticationError, // { "code": 30038, "message": "user does not exist" }
  32038: AuthenticationError, // User does not exist
  34018: AuthenticationError, // { "code": 34018, "message": "incorrect trades password" }
  36101: AuthenticationError, // Account does not exist.
  'invalid sign': AuthenticationError,
  'accesskey not null': AuthenticationError, // {"status":"error","ts":1595704360508,"err_code":"invalid-parameter","err_msg":"accesskey not null"}
  'illegal accesskey': AuthenticationError,
  'sign not null': AuthenticationError,
  'illegal sign invalid': AuthenticationError, // {"status":"error","ts":1595684716042,"err_code":"invalid-parameter","err_msg":"illegal sign invalid"}
  'api signature not valid': AuthenticationError,
  '40001': AuthenticationError, // ACCESS_KEY cannot be empty
  '40002': AuthenticationError, // SECRET_KEY cannot be empty
  '40003': AuthenticationError, // Signature cannot be empty
  '40006': AuthenticationError, // Invalid ACCESS_KEY
  '40009': AuthenticationError, // sign signature error
  '40011': AuthenticationError, // ACCESS_PASSPHRASE cannot be empty
  '40012': AuthenticationError, // apikey/password is incorrect
  '40037': AuthenticationError, // Apikey does not exist
  '40506': AuthenticationError, // Platform signature error
  '40507': AuthenticationError, // Api signature error
  '401': AuthenticationError, // Unauthorized access
  '35005': AuthenticationError, // { "code": 35005, "message": "User does not exist" }

  30005: InvalidNonce, // { "code": 30005, "message": "invalid OK_ACCESS_TIMESTAMP" }
  '40004': InvalidNonce, // Request timestamp expired
  '40005': InvalidNonce, // Invalid ACCESS_TIMESTAMP
  '40008': InvalidNonce, // Request timestamp expired

  'req_time is too much difference from server time': InvalidNonce,

  30007: BadRequest, // { "code": 30007, "message": 'invalid Content_Type, please use "application/json" format'}
  30020: BadRequest, // { "code": 30020, "message": "body cannot be blank" }
  30021: BadRequest, // { "code": 30021, "message": "Json data format error" }, { "code": 30021, "message": "json data format error" }
  30023: BadRequest, // { "code": 30023, "message": "{0} parameter cannot be blank" }
  30025: BadRequest, // { "code": 30025, "message": "{0} parameter category error" }
  30031: BadRequest, // { "code": 30031, "message": "token does not exist" }
  30033: BadRequest, // { "code": 30033, "message": "exchange domain does not exist" }
  36001: BadRequest, // Invalid underlying index.
  36002: BadRequest, // Instrument does not exist.
  36205: BadRequest, // Instrument id does not match underlying index.
  36206: BadRequest, // Order_id and client_oid can not be used at the same time.
  400172: BadRequest, // {"code":"400172","msg":"Parameter verification failed","requestTime":1691858304961,"data":null}
  'invalid period': BadRequest, // invalid Kline type
  'invalid accountId': BadRequest,
  'invalid address': BadRequest,
  'more than a daily rate of cash': BadRequest,
  'more than the maximum daily withdrawal amount': BadRequest,
  'Cash Withdrawal Is Less Than The Minimum Value': BadRequest,
  'Cash Withdrawal Is More Than The Maximum Value': BadRequest,
  'order cancel fail': BadRequest, // {"status":"error","ts":1595703343035,"err_code":"bad-request","err_msg":"order cancel fail"}
  'order queryorder invalid': BadRequest,
  'invalid start time': BadRequest, // start time is a date 30 days ago; or start time is a date in the future
  'invalid end time': BadRequest, // end time is a date 30 days ago; or end time is a date in the future
  '40007': BadRequest, // Invalid Content_Type
  '40019': BadRequest, // {"code":"40019","msg":"Parameter QLCUSDT_SPBL cannot be empty","requestTime":1679196063659,"data":null}
  '40102': BadRequest, // Contract configuration does not exist, please check the parameters
  '40103': BadRequest, // Request method cannot be empty
  '40203': BadRequest, // The amount of adjustment margin cannot be empty or negative
  '40204': BadRequest, // Adjustment margin type cannot be empty
  '40205': BadRequest, // Adjusted margin type data is wrong
  '40206': BadRequest, // The direction of the adjustment margin cannot be empty
  '40207': BadRequest, // The adjustment margin data is wrong
  '40208': BadRequest, // The accuracy of the adjustment margin amount is incorrect
  '40209': BadRequest, // The current page number is wrong, please confirm
  '40302': BadRequest, // Parameter abnormality
  '40303': BadRequest, // Can only query up to 20,000 data
  '40304': BadRequest, // Parameter type is abnormal
  '40305': BadRequest, // Client_oid length is not greater than 50, and cannot be Martian characters
  '40402': BadRequest, // The opening direction cannot be empty
  '40403': BadRequest, // Wrong opening direction format
  '40404': BadRequest, // Whether to enable automatic margin call parameters cannot be empty
  '40405': BadRequest, // Whether to enable the automatic margin call parameter type is wrong
  '40406': BadRequest, // Whether to enable automatic margin call parameters is of unknown type
  '40700': BadRequest, // Cursor parameters are incorrect
  '40705': BadRequest, // The start and end time cannot exceed 90 days
  '40707': BadRequest, // Start time is greater than end time
  '40708': BadRequest, // Parameter verification is abnormal
  '33021': BadRequest, // { "code": 33021, "message": "token and the pair do not match" }
  '33059': BadRequest, // { "code": 33059, "message": "client_oid or order_id is required" }
  '33060': BadRequest, // { "code": 33060, "message": "Only fill in either parameter client_oid or order_id" }
  '35059': BadRequest, // { "code": 35059, "message": "client_oid or order_id is required" }
  '35060': BadRequest, // { "code": 35060, "message": "Only fill in either parameter client_oid or order_id" }
  '35061': BadRequest, // { "code": 35061, "message": "Invalid instrument_id" }
  '35095': BadRequest, // Instrument_id error
  '400': BadRequest, // Bad Request
  '404': BadRequest, // Request address does not exist
  '405': BadRequest, // The HTTP Method is not supported
  '415': BadRequest, // The current media type is not supported

  30008: RequestTimeout, // { "code": 30008, "message": "timestamp request expired" }
  40010: RequestTimeout, // { "code": "40010", "msg": "Request timed out", "requestTime": 1666268894074, "data": null }
  50008: RequestTimeout, // network timeout

  32005: InvalidOrder, // { "code": 32005, "message": "max order quantity" }
  32006: InvalidOrder, // { "code": 32006, "message": "the order price or trigger price exceeds USD 1 million" }
  32007: InvalidOrder, // { "code": 32007, "message": "leverage level must be the same for orders on the same side of the contract" }
  32008: InvalidOrder, // { "code": 32008, "message": "Max. positions to open (cross margin)" }
  32009: InvalidOrder, // { "code": 32009, "message": "Max. positions to open (fixed margin)" }
  32030: InvalidOrder, // The order cannot be cancelled
  32048: InvalidOrder, // Order strategy track range error
  32050: InvalidOrder, // Order strategy rang error
  32051: InvalidOrder, // Order strategy ice depth error
  32055: InvalidOrder, // cancel order error
  32059: InvalidOrder, // Total amount should exceed per order amount
  32060: InvalidOrder, // Order strategy type error
  32061: InvalidOrder, // Order strategy initiative limit error
  32062: InvalidOrder, // Order strategy initiative range error
  32063: InvalidOrder, // Order strategy initiative rate error
  36203: InvalidOrder, // Invalid format for client_oid.
  36207: InvalidOrder, // Either order price or fartouch price must be present.
  36208: InvalidOrder, // Either order price or size must be present.
  36209: InvalidOrder, // Either order_id or client_oid must be present.
  36210: InvalidOrder, // Either order_ids or client_oids must be present.
  36211: InvalidOrder, // Exceeding max batch size for order submission.
  36212: InvalidOrder, // Exceeding max batch size for oder cancellation.
  36213: InvalidOrder, // Exceeding max batch size for order amendment.
  36217: InvalidOrder, // Order submission failed.
  36218: InvalidOrder, // Order cancellation failed.
  36219: InvalidOrder, // Order amendment failed.
  36220: InvalidOrder, // Order is pending cancel.
  36221: InvalidOrder, // Order qty is not valid multiple of lot size.
  36222: InvalidOrder, // Order price is breaching highest buy limit.
  36223: InvalidOrder, // Order price is breaching lowest sell limit.
  36224: InvalidOrder, // Exceeding max order size.
  36225: InvalidOrder, // Exceeding max open order count for instrument.
  36226: InvalidOrder, // Exceeding max open order count for underlying.
  36227: InvalidOrder, // Exceeding max open size across all orders for underlying
  36228: InvalidOrder, // Exceeding max available qty for instrument.
  36229: InvalidOrder, // Exceeding max available qty for underlying.
  36230: InvalidOrder, // Exceeding max position limit for underlying.
  40815: InvalidOrder, // Post only invalid price
  40762: InvalidOrder, // { "code":"40762", "msg":"The order size is greater than the max open size", "requestTime":1627293504612 }
  'invalid amount': InvalidOrder,
  'invalid type': InvalidOrder, // {"status":"error","ts":1595700344504,"err_code":"invalid-parameter","err_msg":"invalid type"}
  'invalid orderId': InvalidOrder,
  'market no need price': InvalidOrder,
  'limit need price': InvalidOrder,
  50014: InvalidOrder, // The transaction amount under minimum limits
  50015: InvalidOrder, // The transaction amount exceed maximum limits
  50016: InvalidOrder, // The price can't be higher than the current price
  50017: InvalidOrder, // Price under minimum limits
  50018: InvalidOrder, // The price exceed maximum limits
  50019: InvalidOrder, // The amount under minimum limits
  50021: InvalidOrder, // Price is under minimum limits
  50026: InvalidOrder, // Market price parameter error
  '40108': InvalidOrder, // Wrong order quantity
  '40201': InvalidOrder, // Order number cannot be empty
  '40500': InvalidOrder, // Client_oid check error
  '40706': InvalidOrder, // Wrong order price
  '43011': InvalidOrder, // The parameter does not meet the specification executePrice <= 0
  '43025': InvalidOrder, // Plan order does not exist
  '45110': InvalidOrder, // {"code":"45110","msg":"less than the minimum amount 5 USDT","requestTime":1669911118932,"data":null}
  '33013': InvalidOrder, // { "code": 33013, "message": "order placement failed" }
  '33015': InvalidOrder, // { "code": 33015, "message": "exceeded maximum limit" }
  '33022': InvalidOrder, // { "code": 33022, "message": "pair and the order do not match" }
  '33024': InvalidOrder, // { "code": 33024, "message": "trading amount too small" }
  '33025': InvalidOrder, // { "code": 33025, "message": "base token amount is blank" }
  '33027': InvalidOrder, // { "code": 33027, "message": "cancelled order or order cancelling" }
  '33028': InvalidOrder, // { "code": 33028, "message": "the decimal places of the trading price exceeded the limit" }
  '33029': InvalidOrder, // { "code": 33029, "message": "the decimal places of the trading size exceeded the limit" }
  '35008': InvalidOrder, // { "code": 35008, "message": "Risk ratio too high" }
  '35010': InvalidOrder, // { "code": 35010, "message": "Position closing too large" }
  '35012': InvalidOrder, // { "code": 35012, "message": "Incorrect order size" }
  '35014': InvalidOrder, // { "code": 35014, "message": "Order price is not within limit" }
  '35015': InvalidOrder, // { "code": 35015, "message": "Invalid leverage level" }
  '35019': InvalidOrder, // { "code": 35019, "message": "Order size too large" }
  '35020': InvalidOrder, // { "code": 35020, "message": "Order price too high" }
  '35021': InvalidOrder, // { "code": 35021, "message": "Order size exceeded current tier limit" }
  '35030': InvalidOrder, // { "code": 35030, "message": "Order size too large" }
  '35031': InvalidOrder, // { "code": 35031, "message": "Cancel order size too large" }
  '35040': InvalidOrder, // {"error_message":"Invalid order type","result":"true","error_code":"35040","order_id":"-1"}
  '35049': InvalidOrder, // { "code": 35049, "message": "Invalid order type" }
  '35050': InvalidOrder, // { "code": 35050, "message": "Position settings are blank" }
  '35062': InvalidOrder, // { "code": 35062, "message": "Invalid match_price" }
  '35063': InvalidOrder, // { "code": 35063, "message": "Invalid order_size" }
  '35064': InvalidOrder, // { "code": 35064, "message": "Invalid client_oid" }
  '35066': InvalidOrder, // Order interval error
  '35067': InvalidOrder, // Time-weighted order ratio error
  '35068': InvalidOrder, // Time-weighted order range error
  '35069': InvalidOrder, // Time-weighted single transaction limit error
  '35070': InvalidOrder, // Algo order type error
  '35071': InvalidOrder, // Order total must be larger than single order limit
  '35072': InvalidOrder, // Maximum 6 unfulfilled time-weighted orders can be held at the same time
  '35073': InvalidOrder, // Order price is 0. Market-close-all not available
  '35074': InvalidOrder, // Iceberg order single transaction average error
  '35075': InvalidOrder, // Failed to cancel order
  '35076': InvalidOrder, // LTC 20x leverage. Not allowed to open position
  '35077': InvalidOrder, // Maximum 6 unfulfilled iceberg orders can be held at the same time
  '35078': InvalidOrder, // Order amount exceeded 100,000
  '35079': InvalidOrder, // Iceberg order price variance error
  '35080': InvalidOrder, // Callback rate error
  '35081': InvalidOrder, // Maximum 10 unfulfilled trail orders can be held at the same time
  '35082': InvalidOrder, // Trail order callback rate error
  '35083': InvalidOrder, // Each user can only hold a maximum of 10 unfulfilled stop-limit orders at the same time
  '35084': InvalidOrder, // Order amount exceeded 1 million
  '35085': InvalidOrder, // Order amount is not in the correct range
  '35086': InvalidOrder, // Price exceeds 100 thousand
  '35087': InvalidOrder, // Price exceeds 100 thousand
  '35088': InvalidOrder, // Average amount error
  '35089': InvalidOrder, // Price exceeds 100 thousand

  30014: DDoSProtection, // { "code": 30014, "message": "request too frequent" }
  30026: DDoSProtection, // { "code": 30026, "message": "requested too frequent" }
  '429': DDoSProtection, // Too many requests

  30024: BadSymbol, // {"code":30024,"message":"\"instrument_id\" is an invalid parameter"}
  30032: BadSymbol, // { "code": 30032, "message": "pair does not exist" }
  40034: BadSymbol, // { "code": 40034, "message": "Params does not exist" }
  '40309': BadSymbol, // The contract has been removed

  'invalid currency': BadSymbol, // invalid trading pair
  'invalid symbol': BadSymbol,
  'base symbol error': BadSymbol,
  50004: BadSymbol, // The transaction pair is currently not supported or has been suspended

  30029: AccountSuspended,
  32001: AccountSuspended, // { "code": 32001, "message": "futures account suspended" }
  32028: AccountSuspended, // { "code": 32028, "message": "account is suspended and liquidated" }
  34017: AccountSuspended, // { "code": 34017, "message": "account suspended" }
  36103: AccountSuspended, // Account is suspended due to ongoing liquidation.
  36106: AccountSuspended, // Funds cannot be transferred in or out, as account is suspended.
  'user locked': AccountSuspended,
  '33002': AccountSuspended, // { "code": 33002, "message": "margin account for this pair is suspended" }

  30038: OnMaintenance, // {"client_oid":"","code":"30038","error_code":"30038","error_message":"Matching engine is being upgraded. Please try in about 1 minute.","message":"Matching engine is being upgraded. Please try in about 1 minute.","order_id":"-1","result":false}
  '40200': OnMaintenance, // Server upgrade, please try again later
  '40308': OnMaintenance, // The contract is being temporarily maintained
  '41114': OnMaintenance, // {"code":"41114","msg":"The current trading pair is under maintenance, please refer to the official announcement for the opening time","requestTime":1679196062544,"data":null}
  '43115': OnMaintenance, // {"code":"43115","msg":"The current trading pair is opening soon, please refer to the official announcement for the opening time","requestTime":1688907202434,"data":null}

  32003: CancelPending, // { "code": 32003, "message": "canceling, please wait" }

  32031: ArgumentsRequired, // client_oid or order_id is required.

  34002: InvalidAddress, // { "code": 34002, "message": "please add a withdrawal address" }
  34021: InvalidAddress, // { "code": 34021, "message": "Not verified address" }

  34008: InsufficientFunds, // { "code": 34008, "message": "insufficient balance" }
  36108: InsufficientFunds, // Funds cannot be transferred in or out, as equity of the account is less than zero.
  50020: InsufficientFunds, // Insufficient balance
  'your balance is low': InsufficientFunds, // {"status":"error","ts":1595594160149,"err_code":"invalid-parameter","err_msg":"invalid size, valid range: [1,2000]"}
  '40711': InsufficientFunds, // Insufficient contract account balance
  '40712': InsufficientFunds, // Insufficient margin
  '33003': InsufficientFunds, // { "code": 33003, "message": "no loan balance" }
  '33008': InsufficientFunds, // { "code": 33008, "message": "loan amount cannot exceed the maximum limit" }
  '33017': InsufficientFunds, // { "code": 33017, "message": "insufficient balance" }
  '35025': InsufficientFunds, // { "code": 35025, "message": "No account balance" }
  '35046': InsufficientFunds, // { "code": 35046, "message": "Negative account balance" }
  '35047': InsufficientFunds, // { "code": 35047, "message": "Insufficient account balance" }
  '35052': InsufficientFunds, // { "code": 35052, "message": "Insufficient cross margin" }
  '35055': InsufficientFunds, // { "code": 35055, "message": "Insufficient account balance" }

  36216: OrderNotFound, // Order does not exist.
  40768: OrderNotFound, // Order does not exist
  43001: OrderNotFound,
  '33014': OrderNotFound, // { "code": 33014, "message": "order does not exist" }
  '35029': OrderNotFound, // { "code": 35029, "message": "Order does not exist" }
  '40109': OrderNotFound, // The data of the order cannot be found, please confirm the order number

  'Request Frequency Is Too High': RateLimitExceeded,
  50009: RateLimitExceeded, // The operation is too frequent, please try again later
  '1001': RateLimitExceeded, // The request is too frequent and has been throttled

  22002: InsufficientPositions, // No position to close
  40755: InsufficientPositions, //Not enough open positions are available.
  40757: InsufficientPositions, //Not enough position is available.
  40758: InsufficientPositions, //The position lock is insufficient.
  40771: InsufficientPositions, //When there is a gap, you cannot have a position closing order
  40804: InsufficientPositions, //The number of closed positions cannot exceed the number of positions held
  43023: InsufficientPositions, // Insufficient position, can not set profit or stop loss,
  45003: InsufficientPositions, // Insufficient position
  45005: InsufficientPositions, // Insufficient available positions
  45006: InsufficientPositions,// Insufficient position
  45007: InsufficientPositions, //	Insufficient lock position
};
