/* eslint-disable max-len */
import {
  AccountNotEnabled,
  AccountSuspended,
  AuthenticationError,
  BadRequest,
  BadSymbol,
  CancelPending,
  ContractUnavailable,
  ExchangeError,
  ExchangeNotAvailable,
  InsufficientFunds,
  InsufficientPositions,
  InvalidAddress,
  InvalidNonce,
  InvalidOrder,
  OnMaintenance,
  OrderNotFillable,
  OrderNotFound,
  PermissionDenied,
  RateLimitExceeded,
  RequestTimeout
} from '../../libs/Error';

export enum MarginMode {
  CROSS = 'cross'
}

export enum ExchangeOrderSide {
  BUY = 'buy',
  SELL = 'sell'
}

export enum ExchangePositionSide {
  LONG = 'long',
  SHORT = 'short',
  NET = 'net'
}

export enum ExchangeOrderType {
  LIMIT = 'limit',
  MARKET = 'market',
  POST_ONLY = 'post_only'
}

export enum InstrumentType {
  SWAP = 'SWAP'
}

export enum ExchangePositionMode {
  LONG_SHORT = 'long_short_mode',
  NET = 'net_mode'
}

export enum ExchangeOrderState {
  LIVE = 'live',
  PARTIALLY_FILLED = 'partially_filled',
  FILLED = 'filled',
  CANCELED = 'canceled'
}

export enum ExchangeOrderbookAction {
  SNAPSHOT = 'snapshot'
}

export enum PositionSide {
  NET = 'net'
}

export enum ErrorCode {
  SETTING_FAILED_BECAUSEOF_OPEN_POSITION = '59000'
}

export enum ResponseCode {
  OK = '0',
  OPERATION_FAILED = '1',
  OPERATION_PARTIALLY_SUCCEEDED = '2'
}

export const REST_PRODUCTION_TRADING_URL = 'https://www.okx.com';
export const MAXIMUM_KLINE_LIMIT = 100;

export const EXCHANGE_EXCEPTION: {[key: number | string]: any} = {
  1: ExchangeError, // Operation failed
  2: ExchangeError, // Bulk operation partially succeeded
  50010: ExchangeError, // User ID can not be empty
  50012: ExchangeError, // Account status invalid
  50015: ExchangeError, // Either parameter {0} or {1} is required
  50016: ExchangeError, // Parameter {0} does not match parameter {1}
  50017: ExchangeError, // The position is frozen due to ADL. Operation restricted
  50018: ExchangeError, // Currency {0} is frozen due to ADL. Operation restricted
  50019: ExchangeError, // The account is frozen due to ADL. Operation restricted
  50020: ExchangeError, // The position is frozen due to liquidation. Operation restricted
  50021: ExchangeError, // Currency {0} is frozen due to liquidation. Operation restricted
  50022: ExchangeError, // The account is frozen due to liquidation. Operation restricted
  50023: ExchangeError, // Funding fee frozen. Operation restricted
  50025: ExchangeError, // Parameter {0} count exceeds the limit {1}
  50028: ExchangeError, // Unable to take the order, please reach out to support center for details
  50100: ExchangeError, // API frozen, please contact customer service
  50108: ExchangeError, // Exchange ID does not exist
  50109: ExchangeError, // Exchange domain does not exist
  51017: ExchangeError, // Borrow amount exceeds the limit
  51018: ExchangeError, // User with option account can not hold net short positions
  51019: ExchangeError, // No net long positions can be held under isolated margin mode in options
  51023: ExchangeError, // Position does not exist
  51025: ExchangeError, // Order count exceeds the limit
  51155: ExchangeError, // Due to local compliance requirements, trading of this pair or contract is restricted.
  51405: ExchangeError, // Cancellation failed as you do not have any pending orders
  51406: ExchangeError, // Canceled - order count exceeds the limit {0}
  51408: ExchangeError, // Pair ID or name does not match the order info
  51409: ExchangeError, // Either pair ID or pair name ID is required
  51500: ExchangeError, // Either order price or amount is required
  51501: ExchangeError, // Maximum {0} orders can be modified
  51503: ExchangeError, // Order modification failed as the order does not exist
  51506: ExchangeError, // Order modification unavailable for the order type
  51508: ExchangeError, // Orders are not allowed to be modified during the call auction
  51509: ExchangeError, // Modification failed as the order has been canceled
  51510: ExchangeError, // Modification failed as the order has been completed
  51511: ExchangeError, // Modification failed as the order price did not meet the requirement for Post Only
  51600: ExchangeError, // Status not found
  51601: ExchangeError, // Order status and order ID cannot exist at the same time
  51602: ExchangeError, // Either order status or order ID is required
  51735: ExchangeError, // Sub-account is not supported
  52000: ExchangeError, // No updates
  54000: ExchangeError, // Margin transactions unavailable
  54001: ExchangeError, // Only Multi-currency margin account can be set to borrow coins automatically
  58000: ExchangeError, // Account type {0} does not supported when getting the sub-account balance
  58003: ExchangeError, // Currency type is not supported by Savings Account
  58005: ExchangeError, // The redeemed amount must be no greater than {0}
  58006: ExchangeError, // Service unavailable for token {0}
  58007: ExchangeError, // Abnormal Assets interface. Please try again later
  58100: ExchangeError, // The trading product triggers risk control, and the platform has suspended the fund transfer-out function with related users. Please wait patiently
  58103: ExchangeError, // Parent account user id does not match sub-account user id
  58110: ExchangeError, // The contract triggers risk control, and the platform has suspended the fund transfer function of it. Please wait patiently
  58111: ExchangeError, // Funds transfer unavailable as the perpetual contract is charging the funding fee. Please try again later
  58112: ExchangeError, // Your fund transfer failed. Please try again later
  58114: ExchangeError, // Transfer amount must be more than 0
  58115: ExchangeError, // Sub-account does not exist
  58116: ExchangeError, // Transfer amount exceeds the limit
  58117: ExchangeError, // Account assets are abnormal, please deal with negative assets before transferring
  58200: ExchangeError, // Withdrawal from {0} to {1} is unavailable for this currency
  58201: ExchangeError, // Withdrawal amount exceeds the daily limit
  58202: ExchangeError, // The minimum withdrawal amount for NEO is 1, and the amount must be an integer
  58205: ExchangeError, // Withdrawal amount exceeds the upper limit
  58206: ExchangeError, // Withdrawal amount is lower than the lower limit
  58208: ExchangeError, // Withdrawal failed. Please link your email
  58209: ExchangeError, // Withdrawal failed. Withdraw feature is not available for sub-accounts
  58210: ExchangeError, // Withdrawal fee exceeds the upper limit
  58211: ExchangeError, // Withdrawal fee is lower than the lower limit (withdrawal endpoint: incorrect fee)
  58212: ExchangeError, // Withdrawal fee should be {0}% of the withdrawal amount
  58300: ExchangeError, // Deposit-address count exceeds the limit
  59000: ExchangeError, // Your settings failed as you have positions or open orders
  59001: ExchangeError, // Switching unavailable as you have borrowings
  59100: ExchangeError, // You have open positions. Please cancel all open positions before changing the leverage
  59101: ExchangeError, // You have pending orders with isolated positions. Please cancel all the pending orders and adjust the leverage
  59102: ExchangeError, // Leverage exceeds the maximum leverage. Please adjust the leverage
  59104: ExchangeError, // The leverage is too high. The borrowed position has exceeded the maximum position of this leverage. Please adjust the leverage
  59105: ExchangeError, // Leverage can not be less than {0}. Please adjust the leverage
  59106: ExchangeError, // The max available margin corresponding to your order tier is {0}. Please adjust your margin and place a new order
  59107: ExchangeError, // You have pending orders under the service, please modify the leverage after canceling all pending orders
  59109: ExchangeError, // Account equity less than the required margin amount after adjustment. Please adjust the leverage
  59300: ExchangeError, // Margin call failed. Position does not exist
  59301: ExchangeError, // Margin adjustment failed for exceeding the max limit
  59313: ExchangeError, // Unable to repay. You haven't borrowed any {ccy} {ccyPair} in Quick margin mode.
  59401: ExchangeError, // Holdings already reached the limit
  59500: ExchangeError, // Only the APIKey of the main account has permission
  59501: ExchangeError, // Only 50 APIKeys can be created per account
  59502: ExchangeError, // Note name cannot be duplicate with the currently created APIKey note name
  59503: ExchangeError, // Each APIKey can bind up to 20 IP addresses
  59504: ExchangeError, // The sub account does not support the withdrawal function
  59505: ExchangeError, // The passphrase format is incorrect
  59506: ExchangeError, // APIKey does not exist
  59507: ExchangeError, // The two accounts involved in a transfer must be two different sub accounts under the same parent account
  63999: ExchangeError, // Internal system error

  50000: BadRequest, // Body can not be empty
  50002: BadRequest, // Json data format error
  50006: BadRequest, // Invalid Content_Type, please use "application/json" format
  50014: BadRequest, // Parameter {0} can not be empty
  50024: BadRequest, // Parameter {0} and {1} can not exist at the same time
  50044: BadRequest, // Must select one broker type
  50115: BadRequest, // Invalid request method
  51000: BadRequest, // Parameter {0} error
  51003: BadRequest, // Either client order ID or order ID is required
  51111: BadRequest, // Maximum {0} orders can be placed in bulk
  51156: BadRequest, // You're leading trades in long/short mode and can't use this API endpoint to close positions
  51159: BadRequest, // You're leading trades in buy/sell mode. If you want to place orders using this API endpoint, the orders must be in the same direction as your existing positions and open orders.
  51323: BadRequest, // You're already leading trades with take profit or stop loss settings. Cancel your existing stop orders to proceed
  51324: BadRequest, // As a lead trader, you hold positions in {instrument}. To close your positions, place orders in the amount that equals the available amount for closing
  51407: BadRequest, // Either order ID or client order ID is required
  58125: BadRequest, // Non-tradable assets can only be transferred from sub-accounts to main accounts
  58126: BadRequest, // Non-tradable assets can only be transferred between funding accounts
  58127: BadRequest, // Main account API Key does not support current transfer 'type' parameter. Please refer to the API documentation.
  58128: BadRequest, // Sub-account API Key does not support current transfer 'type' parameter. Please refer to the API documentation.
  58221: BadRequest, // Missing label of withdrawal address.
  58222: BadRequest, // Illegal withdrawal address.
  58224: BadRequest, // This type of crypto does not support on-chain withdrawing to OKX addresses. Please withdraw through internal transfers.
  58227: BadRequest, // Withdrawal of non-tradable assets can be withdrawn all at once only
  58228: BadRequest, // Withdrawal of non-tradable assets requires that the API Key must be bound to an IP
  59216: BadRequest, // The position doesn't exist. Please try again
  60012: BadRequest, // Illegal request
  60013: BadRequest, // Invalid args
  60017: BadRequest, // Invalid url path
  60018: BadRequest, // The {0} {1} {2} {3} {4} does not exist
  60019: BadRequest, // Invalid op {op}
  70010: BadRequest, // Timestamp parameters need to be in Unix timestamp format in milliseconds.
  70013: BadRequest, // endTs needs to be bigger than or equal to beginTs.
  70016: BadRequest, // Please specify your instrument settings for at least one instType.

  50001: OnMaintenance, // Matching engine upgrading. Please try again later

  50004: RequestTimeout, // Endpoint request timeout (does not indicate success or failure of order, please check order status)

  50005: ExchangeNotAvailable, // API is offline or unavailable
  50013: ExchangeNotAvailable, // System is busy, please try again later
  50026: ExchangeNotAvailable, // System error, please try again later.
  60016: ExchangeNotAvailable, // Buffer is full, cannot write data
  'Internal Server Error': ExchangeNotAvailable, // {"code":500,"data":{},"detailMsg":"","error_code":"500","error_message":"Internal Server Error","msg":"Internal Server Error"}
  'server error': ExchangeNotAvailable, // {"code":500,"data":{},"detailMsg":"","error_code":"500","error_message":"server error 1236805249","msg":"server error 1236805249"}

  50007: AccountSuspended, // Account blocked
  50009: AccountSuspended, // Account is suspended due to ongoing liquidation
  51009: AccountSuspended, // Order placement function is blocked by the platform
  51024: AccountSuspended, // Unified accountblocked
  58004: AccountSuspended, // Account blocked (transfer & withdrawal endpoint: either end of the account does not authorize the transfer)
  58101: AccountSuspended, // Transfer suspended (transfer endpoint: either end of the account does not authorize the transfer)
  58204: AccountSuspended, // Withdrawal suspended
  59508: AccountSuspended, // The sub account of {0} is suspended

  50008: AuthenticationError, // User does not exist
  50101: AuthenticationError, // Broker id of APIKey does not match current environment
  50103: AuthenticationError, // Request header "OK_ACCESS_KEY" can not be empty
  50104: AuthenticationError, // Request header "OK_ACCESS_PASSPHRASE" can not be empty
  50105: AuthenticationError, // Request header "OK_ACCESS_PASSPHRASE" incorrect
  50106: AuthenticationError, // Request header "OK_ACCESS_SIGN" can not be empty
  50107: AuthenticationError, // Request header "OK_ACCESS_TIMESTAMP" can not be empty
  50111: AuthenticationError, // Invalid OK_ACCESS_KEY
  50112: AuthenticationError, // Invalid OK_ACCESS_TIMESTAMP
  50113: AuthenticationError, // Invalid signature
  50114: AuthenticationError, // Invalid authorization
  51732: AuthenticationError, // Required user KYC level not met
  51733: AuthenticationError, // User is under risk control
  51734: AuthenticationError, // User KYC Country is not supported
  58001: AuthenticationError, // Incorrect trade password
  58213: AuthenticationError, // Please set trading password before withdrawal
  50119: AuthenticationError,

  50011: RateLimitExceeded, // Request too frequent
  51113: RateLimitExceeded, // Market-price liquidation requests too frequent
  58102: RateLimitExceeded, // Too frequent transfer (transfer too frequently)
  60014: RateLimitExceeded, // Requests too frequent

  50027: PermissionDenied, // The account is restricted from trading
  50120: PermissionDenied, // This API key doesn't have permission to use this function
  50110: PermissionDenied, // Invalid IP
  58002: PermissionDenied, // Please activate Savings Account first
  58104: PermissionDenied, // Since your P2P transaction is abnormal, you are restricted from making fund transfers. Please contact customer support to remove the restriction
  58105: PermissionDenied, // Since your P2P transaction is abnormal, you are restricted from making fund transfers. Please transfer funds on our website or app to complete identity verification
  58106: PermissionDenied, // Please enable the account for spot contract
  58107: PermissionDenied, // Please enable the account for futures contract
  58108: PermissionDenied, // Please enable the account for option contract
  58109: PermissionDenied, // Please enable the account for swap contract

  50102: InvalidNonce, // Timestamp request expired
  60006: InvalidNonce, // Timestamp request expired

  51001: BadSymbol, // Instrument ID does not exist
  51002: BadSymbol, // Instrument ID does not match underlying index
  51012: BadSymbol, // Token does not exist
  51014: BadSymbol, // Index does not exist
  51015: BadSymbol, // Instrument ID does not match instrument type
  51026: BadSymbol, // Instrument type does not match underlying index
  51130: BadSymbol, // Fixed margin currency error

  51004: InvalidOrder, // Order amount exceeds current tier limit
  51005: InvalidOrder, // Order amount exceeds the limit
  51006: InvalidOrder, // Order price out of the limit
  51007: InvalidOrder, // Order placement failed. Order amount should be at least 1 contract (showing up when placing an order with less than 1 contract)
  51011: InvalidOrder, // Duplicated order ID
  51016: InvalidOrder, // Duplicated client order ID
  51020: InvalidOrder, // Order amount should be greater than the min available amount
  51046: InvalidOrder, // The take profit trigger price must be higher than the order price
  51047: InvalidOrder, // The stop loss trigger price must be lower than the order price
  51031: InvalidOrder, // This order price is not within the closing price range
  51101: InvalidOrder, // Entered amount exceeds the max pending order amount (Cont) per transaction
  51102: InvalidOrder, // Entered amount exceeds the max pending count
  51103: InvalidOrder, // Entered amount exceeds the max pending order count of the underlying asset
  51104: InvalidOrder, // Entered amount exceeds the max pending order amount (Cont) of the underlying asset
  51105: InvalidOrder, // Entered amount exceeds the max order amount (Cont) of the contract
  51106: InvalidOrder, // Entered amount exceeds the max order amount (Cont) of the underlying asset
  51107: InvalidOrder, // Entered amount exceeds the max holding amount (Cont)
  51108: InvalidOrder, // Positions exceed the limit for closing out with the market price
  51109: InvalidOrder, // No available offer
  51110: InvalidOrder, // You can only place a limit order after Call Auction has started
  51112: InvalidOrder, // Close order size exceeds your available size
  51115: InvalidOrder, // Cancel all pending close-orders before liquidation
  51116: InvalidOrder, // Order price or trigger price exceeds {0}
  51117: InvalidOrder, // Pending close-orders count exceeds limit
  51118: InvalidOrder, // Total amount should exceed the min amount per order
  51120: InvalidOrder, // Order quantity is less than {0}, please try again
  51121: InvalidOrder, // Order count should be the integer multiples of the lot size
  51122: InvalidOrder, // Order price should be higher than the min price {0}
  51124: InvalidOrder, // You can only place limit orders during call auction
  51125: InvalidOrder, // Currently there are reduce + reverse position pending orders in margin trading. Please cancel all reduce + reverse position pending orders and continue
  51128: InvalidOrder, // Multi-currency margin account can not do cross-margin trading
  51129: InvalidOrder, // The value of the position and buy order has reached the position limit, and no further buying is allowed
  51132: InvalidOrder, // Your position amount is negative and less than the minimum trading amount
  51135: InvalidOrder, // Your closing price has triggered the limit price, and the max buy price is {0}
  51136: InvalidOrder, // Your closing price has triggered the limit price, and the min sell price is {0}
  51137: InvalidOrder, // Your opening price has triggered the limit price, and the max buy price is {0}
  51138: InvalidOrder, // Your opening price has triggered the limit price, and the min sell price is {0}
  51162: InvalidOrder, // You have {instrument} open orders. Cancel these orders and try again
  51163: InvalidOrder, // You hold {instrument} positions. Close these positions and try again
  51166: InvalidOrder, // Currently, we don't support leading trades with this instrument
  51174: InvalidOrder, // The number of {param0} pending orders reached the upper limit of {param1} (orders).
  51201: InvalidOrder, // Value of per market order cannot exceed 100,000 USDT
  51202: InvalidOrder, // Market - order amount exceeds the max amount
  51203: InvalidOrder, // Order amount exceeds the limit {0}
  51204: InvalidOrder, // The price for the limit order can not be empty
  51250: InvalidOrder, // Algo order price is out of the available range
  51251: InvalidOrder, // Algo order type error (when user place an iceberg order)
  51252: InvalidOrder, // Algo order price is out of the available range
  51253: InvalidOrder, // Average amount exceeds the limit of per iceberg order
  51254: InvalidOrder, // Iceberg average amount error (when user place an iceberg order)
  51255: InvalidOrder, // Limit of per iceberg order: Total amount/1000 < x <= Total amount
  51256: InvalidOrder, // Iceberg order price variance error
  51257: InvalidOrder, // Trail order callback rate error
  51258: InvalidOrder, // Trail - order placement failed. The trigger price of a sell order should be higher than the last transaction price
  51259: InvalidOrder, // Trail - order placement failed. The trigger price of a buy order should be lower than the last transaction price
  51260: InvalidOrder, // Maximum {0} pending trail - orders can be held at the same time
  51261: InvalidOrder, // Each user can hold up to {0} pending stop - orders at the same time
  51262: InvalidOrder, // Maximum {0} pending iceberg orders can be held at the same time
  51263: InvalidOrder, // Maximum {0} pending time-weighted orders can be held at the same time
  51264: InvalidOrder, // Average amount exceeds the limit of per time-weighted order
  51265: InvalidOrder, // Time-weighted order limit error
  51267: InvalidOrder, // Time-weighted order strategy initiative rate error
  51268: InvalidOrder, // Time-weighted order strategy initiative range error
  51269: InvalidOrder, // Time-weighted order interval error, the interval should be {0}<= x<={1}
  51270: InvalidOrder, // The limit of time-weighted order price variance is 0 < x <= 1%
  51271: InvalidOrder, // Sweep ratio should be 0 < x <= 100%
  51272: InvalidOrder, // Price variance should be 0 < x <= 1%
  51273: InvalidOrder, // Total amount should be more than {0}
  51274: InvalidOrder, // Total quantity of time-weighted order must be larger than single order limit
  51275: InvalidOrder, // The amount of single stop-market order can not exceed the upper limit
  51276: InvalidOrder, // Stop - Market orders cannot specify a price
  51277: InvalidOrder, // TP trigger price can not be higher than the last price
  51278: InvalidOrder, // SL trigger price can not be lower than the last price
  51279: InvalidOrder, // TP trigger price can not be lower than the last price
  51280: InvalidOrder, // SL trigger price can not be higher than the last price
  51321: InvalidOrder, // You're leading trades. Currently, we don't support leading trades with arbitrage, iceberg, or TWAP bots
  51322: InvalidOrder, // You're leading trades that have been filled at market price. We've canceled your open stop orders to close your positions
  51325: InvalidOrder, // As a lead trader, you must use market price when placing stop orders
  51327: InvalidOrder, // closeFraction is only available for futures and perpetual swaps
  51329: InvalidOrder, // closeFraction is only available in NET mode
  51330: InvalidOrder, // closeFraction is only available for stop market orders
  51403: InvalidOrder, // Cancellation failed as the order type does not support cancellation
  51404: InvalidOrder, // Order cancellation unavailable during the second phase of call auction
  59128: InvalidOrder, // As a lead trader, you can't lead trades in {instrument} with leverage higher than {num}

  58203: InvalidAddress, // Please add a withdrawal address
  58207: InvalidAddress, // Withdrawal failed due to address error

  51008: InsufficientFunds, // Order placement failed due to insufficient balance
  51119: InsufficientFunds, // Order placement failed due to insufficient balance
  51127: InsufficientFunds, // Available balance is 0
  51131: InsufficientFunds, // Insufficient balance
  51502: InsufficientFunds, // Order modification failed for insufficient margin
  51736: InsufficientFunds, // Insufficient {ccy} balance

  51010: AccountNotEnabled, // Account level too low {"code":"1","data":[{"clOrdId":"uJrfGFth9F","ordId":"","sCode":"51010","sMsg":"The current account mode does not support this API interface. ","tag":""}],"msg":"Operation failed."}

  51021: ContractUnavailable, // Contract to be listed
  51022: ContractUnavailable, // Contract suspended
  51027: ContractUnavailable, // Contract expired
  51028: ContractUnavailable, // Contract under delivery
  51029: ContractUnavailable, // Contract is being settled
  51030: ContractUnavailable, // Funding fee is being settled  '51021': ContractUnavailable, // Contract to be listed

  51400: OrderNotFound, // Cancellation failed as the order does not exist
  51401: OrderNotFound, // Cancellation failed as the order is already canceled
  51402: OrderNotFound, // Cancellation failed as the order is already completed
  51603: OrderNotFound, // Order does not exist

  51410: CancelPending, // Cancellation failed as the order is already under cancelling status

  51100: OrderNotFillable, // Unable to place order. Take profit/Stop loss conditions cannot be added to reduce-only orders.
  51126: OrderNotFillable, // Currently there are reduce only pending orders in margin trading.Please cancel all reduce only pending orders and continue
  51134: OrderNotFillable, // Closing failed. Please check your holdings and pending orders. Turn off the Reduce-only to continue.
  51328: OrderNotFillable, // closeFraction is only available for reduceOnly orders
  51133: OrderNotFillable, // Reduce-only feature is unavailable for the spot transactions by multi-currency margin account
  51205: OrderNotFillable, // Reduce-Only is not available
  51139: OrderNotFillable, // Reduce-only feature is unavailable for the spot transactions by simple account
  51148: OrderNotFillable, // Failed to place order. The new order may execute an opposite trading direction of your existing reduce-only positions. Cancel or edit pending orders to continue order
  51170: OrderNotFillable, // Failed to place order. A reduce-only order can’t be the same trading direction as your existing positions.
  51171: OrderNotFillable, // Failed to edit order. The edited order may execute an opposite trading direction of your existing reduce-only positions. Cancel or edit pending orders to continue.
  51333: OrderNotFillable, // Close position order in hedge-mode or reduce-only order in one-way mode cannot attach TPSL
  51530: OrderNotFillable, // Order modification unsuccessful. Take profit/Stop loss conditions cannot be added to or removed from reduce-only orders.
  51165: OrderNotFillable, // The number of {instrument} reduce-only orders reached the upper limit of {upLimit}. Cancel some orders to proceed
  51168: OrderNotFillable, // Failed. You have reduce-only type of open order(s), please proceed after canceling existing order(s)

  51169: InsufficientPositions, // Failed to place order. You don’t have any positions of this contract. Turn off the Reduce-only to continue.
};
