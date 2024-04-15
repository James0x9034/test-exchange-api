/* eslint-disable max-len */
import {
  AuthenticationError,
  BadRequest,
  ExchangeError,
  InsufficientFunds,
  InvalidNonce,
  InvalidOrder,
  OrderNotFillable,
  OrderNotFound,
  PermissionDenied,
  RateLimitExceeded,
  RequestTimeout
} from '../../libs/Error';

export enum CategoryType {
  LINEAR = 'linear',
  SPOT = 'spot'
}

export enum AccountType {
  CLASSIC = 'CLASSIC',
  UNIFIED = 'UNIFIED'
}

export enum PositionIdxHedgeMode {
  BUY = 1,
  SELL = 2
}

export enum ExchangePositionMode {
  BOTH_SIDE = 3,
  MERGE_SINGLE = 0
}

export enum ExchangeOrderType {
  LIMIT = 'Limit',
  MARKET = 'Market'
}

export enum ExchangeOrderSide {
  BUY = 'Buy',
  SELL = 'Sell'
}

export enum ExchangeOrderStatus {
  NEW = 'New',
  CREATED = 'Created',
  UNTRIGGERED = 'Untriggered',
  PARTIALLY_FILLED = 'PartiallyFilled',
  FILLED = 'Filled',
  PENDING_CANCEL = 'PendingCancel',
  CANCELED = 'Cancelled',
  REJECTED = 'Rejected',
  DEACTIVATED = 'Deactivated',
  PARTIALLY_FILLED_CANCELED = 'PartiallyFilledCanceled'
}

export enum ExchangeDepositStatus {
  UNKNOWN = 0,
  TO_BE_CONFIRMED = 1,
  PROCESSING = 2,
  SUCCESS = 3,
  DEPOSIT_FAILED = 4
}

export enum ExchangeWithdrawalStatus {
  SECURITY_CHECK = 'SecurityCheck',
  PENDING = 'Pending',
  SUCCESS = 'Success',
  CANCEL_BY_USER = 'CancelByUser',
  REJECT = 'Reject',
  FAIL = 'Fail',
  BLOCKCHAIN_CONFIRMED = 'BlockchainConfirmed'
}

export enum ExchangeTIF {
  GTC = 'GTC',
  POST_ONLY = 'PostOnly'
}

export enum TradeMode {
  CROSS = 0
}

export enum ExchangeMarginMode {
  ISOLATED_MARGIN = 'ISOLATED_MARGIN',
  CROSS_MARGIN = 'REGULAR_MARGIN'
}
export const AMOUNT_PRECISION = 4;
export const TRIGGER_BY_LAST_PRICE = 'LastPrice';
export const MAXIMUM_KLINE_LIMIT = 200;
export const EXCHANGE_WITHDRAWAL_FEE_TYPE_AUTOMATICALLY = 1;
export const RET_CODE_OK = 0;
export const BYBIT_BROKER = 'Ij000393';

export const EXCHANGE_EXCEPTION: { [key: string | number]: any } = {
  '-10009': BadRequest, // {"ret_code":-10009,"ret_msg":"Invalid period!","result":null,"token":null}
  '-1004': BadRequest, // {"ret_code":-1004,"ret_msg":"Missing required parameter \u0027symbol\u0027","ext_code":null,"ext_info":null,"result":null}
  '-1021': BadRequest, // {"ret_code":-1021,"ret_msg":"Timestamp for this request is outside of the recvWindow.","ext_code":null,"ext_info":null,"result":null}
  '-1103': BadRequest, // An unknown parameter was sent.
  '-6017': BadRequest, // Repayment amount has exceeded the total liability
  '-6025': BadRequest, // Amount to borrow cannot be lower than the min. amount to borrow (per transaction)
  '-6029': BadRequest, // Amount to borrow has exceeded the user's estimated max amount to borrow
  7001: BadRequest, // {"retCode":7001,"retMsg":"request params type error"}
  10001: BadRequest, // parameter error
  10014: BadRequest, // Request is duplicate
  10017: BadRequest, // request path not found or request method is invalid
  12201: BadRequest, // {"retCode":12201,"retMsg":"Invalid orderCategory parameter.","result":{},"retExtInfo":null,"time":1666699391220}
  12141: BadRequest, // "retCode":12141,"retMsg":"Duplicate clientOrderId.","result":{},"retExtInfo":{},"time":1686134298989}
  110013: BadRequest, // Due to risk limit, cannot set leverage
  110015: BadRequest, // the position is in cross_margin
  110018: BadRequest, // userId illegal
  110043: BadRequest, // Set leverage not modified
  110046: BadRequest, // Any adjustments made will trigger immediate liquidation
  110047: BadRequest, // Risk limit cannot be adjusted due to insufficient available margin
  110048: BadRequest, // Risk limit cannot be adjusted as the current/expected position value held exceeds the revised risk limit
  110049: BadRequest, // Tick notes can only be numbers
  110050: BadRequest, // Coin is not in the range of selected
  110060: BadRequest, // Under full TP/SL mode, it is not allowed to modify TP/SL
  110061: BadRequest, // Under partial TP/SL mode, TP/SL set more than 20
  110062: BadRequest, // Institution MMP profile not found.
  131202: BadRequest, // Invalid memberId
  131203: BadRequest, // Request parameter error
  131204: BadRequest, // Account info error
  131205: BadRequest, // Query transfer error
  131207: BadRequest, // Account not exist
  131209: BadRequest, // Get subMember relation error
  131210: BadRequest, // Amount accuracy error
  131211: BadRequest, // fromAccountType can't be the same as toAccountType
  131213: BadRequest, // TransferLTV check error
  131214: BadRequest, // TransferId exist
  131215: BadRequest, // Amount error
  131002: BadRequest, // Parameter error
  131086: BadRequest, // Withdrawal amount exceeds risk limit (the risk limit of margin trade is triggered)
  131088: BadRequest, // The withdrawal amount exceeds the remaining withdrawal limit of your identity verification level. The current available amount for withdrawal : %s
  131089: BadRequest, // User sensitive operation, withdrawal is prohibited within 24 hours
  131094: BadRequest, // UserId is not in the whitelist
  131095: BadRequest, // Withdrawl amount exceeds the 24 hour platform limit
  131096: BadRequest, // Withdraw amount does not satify the lower limit or upper limit
  140013: BadRequest, // Due to risk limit, cannot set leverage
  140018: BadRequest, // userId illegal
  140024: BadRequest, // You have an existing position, so position mode cannot be switched
  140025: BadRequest, // Position mode is not modified
  140026: BadRequest, // Cross/isolated margin mode is not modified
  140027: BadRequest, // Margin is not modified
  140029: BadRequest, // Hedge mode is not available for this symbol
  140031: BadRequest, // risk limit info does not exists
  140036: BadRequest, // Cross margin mode is not allowed to change leverage
  140038: BadRequest, // Portfolio margin mode is not allowed to change leverage
  140039: BadRequest, // Maintain margin rate is too high, which may trigger liquidation
  140043: BadRequest, // Set leverage not modified
  140046: BadRequest, // Any adjustments made will trigger immediate liquidation
  140047: BadRequest, // Risk limit cannot be adjusted due to insufficient available margin
  140048: BadRequest, // Risk limit cannot be adjusted as the current/expected position value held exceeds the revised risk limit
  140049: BadRequest, // Tick notes can only be numbers
  140060: BadRequest, // Under full TP/SL mode, it is not allowed to modify TP/SL
  140061: BadRequest, // Under partial TP/SL mode, TP/SL set more than 20
  140062: BadRequest, // Institution MMP profile not found.
  170035: BadRequest, // Submitted to the system for processing!
  170036: BadRequest, // You haven't enabled Cross Margin Trading yet. To do so, please head to the PC trading site or the Bybit app
  170037: BadRequest, // Cross Margin Trading not yet supported by the selected coin
  170105: BadRequest, // Parameter '%s' was empty.
  170130: BadRequest, // Data sent for paramter '%s' is not valid.
  170221: BadRequest, // This coin does not exist.
  176002: BadRequest, // Query user account info error
  176004: BadRequest, // Query order history start time exceeds end time
  176003: BadRequest, // Query user loan history error
  176006: BadRequest, // Repayment Failed
  176005: BadRequest, // Failed to borrow
  176008: BadRequest, // You haven't enabled Cross Margin Trading yet. To do so
  176007: BadRequest, // User not found
  176010: BadRequest, // Failed to locate the coins to borrow
  176009: BadRequest, // You haven't enabled Cross Margin Trading yet. To do so
  176012: BadRequest, // Pair not available
  176011: BadRequest, // Cross Margin Trading not yet supported by the selected coin
  176014: BadRequest, // Repeated repayment requests
  176013: BadRequest, // Cross Margin Trading not yet supported by the selected pair
  176016: BadRequest, // No repayment required
  176017: BadRequest, // Repayment amount has exceeded the total liability
  176018: BadRequest, // Settlement in progress
  176019: BadRequest, // Liquidation in progress
  176020: BadRequest, // Failed to locate repayment history
  176021: BadRequest, // Repeated borrowing requests
  176022: BadRequest, // Coins to borrow not generally available yet
  176023: BadRequest, // Pair to borrow not generally available yet
  176024: BadRequest, // Invalid user status
  176025: BadRequest, // Amount to borrow cannot be lower than the min. amount to borrow (per transaction)
  176026: BadRequest, // Amount to borrow cannot be larger than the max. amount to borrow (per transaction)
  176027: BadRequest, // Amount to borrow cannot be higher than the max. amount to borrow per user
  176028: BadRequest, // Amount to borrow has exceeded Bybit's max. amount to borrow
  176029: BadRequest, // Amount to borrow has exceeded the user's estimated max. amount to borrow
  176030: BadRequest, // Query user loan info error
  176031: BadRequest, // Number of decimals has exceeded the maximum precision
  176034: BadRequest, // The leverage ratio is out of range
  176038: BadRequest, // The spot leverage is closed and the current operation is not allowed
  176039: BadRequest, // Borrowing, current operation is not allowed
  176040: BadRequest, // There is a spot leverage order, and the adjustment of the leverage switch failed!
  181000: BadRequest, // category is null
  181001: BadRequest, // category only support linear or option or spot.
  20022: BadRequest, // missing parameter leverage
  20023: BadRequest, // leverage must be a number
  20031: BadRequest, // leverage must be greater than zero
  20070: BadRequest, // missing parameter margin
  20071: BadRequest, // margin must be greater than zero
  20084: BadRequest, // order_id or order_link_id is required
  30001: BadRequest, // order_link_id is repeated
  // '30084': BadRequest, // Isolated not modified, see handleErrors below
  34036: BadRequest, // {"ret_code":34036,"ret_msg":"leverage not modified","ext_code":"","ext_info":"","result":null,"time_now":"1652376449.258918","rate_limit_status":74,"rate_limit_reset_ms":1652376449255,"rate_limit":75}
  35015: BadRequest, // {"ret_code":35015,"ret_msg":"Qty not in range","ext_code":"","ext_info":"","result":null,"time_now":"1652277215.821362","rate_limit_status":99,"rate_limit_reset_ms":1652277215819,"rate_limit":100}
  3100116: BadRequest, // {"retCode":3100116,"retMsg":"Order quantity below the lower limit 0.01.","result":null,"retExtMap":{"key0":"0.01"}}
  3100198: BadRequest, // {"retCode":3100198,"retMsg":"orderLinkId can not be empty.","result":null,"retExtMap":{}}

  '-1140': InvalidOrder, // {"ret_code":-1140,"ret_msg":"Transaction amount lower than the minimum.","result":{},"ext_code":"","ext_info":null,"time_now":"1659204910.248576"}
  '-1197': InvalidOrder, // {"ret_code":-1197,"ret_msg":"Your order quantity to buy is too large. The filled price may deviate significantly from the market price. Please try again","result":{},"ext_code":"","ext_info":null,"time_now":"1659204531.979680"}
  '-2013': InvalidOrder, // {"ret_code":-2013,"ret_msg":"Order does not exist.","ext_code":null,"ext_info":null,"result":null}
  110001: InvalidOrder, // Order does not exist
  110003: InvalidOrder, // Order price is out of permissible range
  110005: InvalidOrder, // position status
  110008: InvalidOrder, // Order has been finished or canceled
  110009: InvalidOrder, // The number of stop orders exceeds maximum limit allowed
  110010: InvalidOrder, // Order already cancelled
  110011: InvalidOrder, // Any adjustments made will trigger immediate liquidation
  110016: InvalidOrder, // Requested quantity of contracts exceeds risk limit, please adjust your risk limit level before trying again
  110019: InvalidOrder, // orderId illegal
  110020: InvalidOrder, // number of active orders greater than 500
  110021: InvalidOrder, // Open Interest exceeded
  110022: InvalidOrder, // qty has been limited, cannot modify the order to add qty
  110023: InvalidOrder, // This contract only supports position reduction operation, please contact customer service for details
  110024: InvalidOrder, // You have an existing position, so position mode cannot be switched
  110025: InvalidOrder, // Position mode is not modified
  110026: InvalidOrder, // Cross/isolated margin mode is not modified
  110027: InvalidOrder, // Margin is not modified
  110028: InvalidOrder, // Open orders exist, so you cannot change position mode
  110029: InvalidOrder, // Hedge mode is not available for this symbol
  110030: InvalidOrder, // Duplicate orderId
  110031: InvalidOrder, // risk limit info does not exists
  110032: InvalidOrder, // Illegal order
  110033: InvalidOrder, // Margin cannot be set without open position
  110034: InvalidOrder, // There is no net position
  110035: InvalidOrder, // Cancel order is not completed before liquidation
  110036: InvalidOrder, // Cross margin mode is not allowed to change leverage
  110037: InvalidOrder, // User setting list does not have this symbol
  110038: InvalidOrder, // Portfolio margin mode is not allowed to change leverage
  110039: InvalidOrder, // Maintain margin rate is too high, which may trigger liquidation
  110040: InvalidOrder, // Order will trigger forced liquidation, please resubmit the order
  110041: InvalidOrder, // Skip liquidation is not allowed when a position or maker order exists
  110042: InvalidOrder, // Pre-delivery status can only reduce positions
  110054: InvalidOrder, // This position has at least one take profit link order, so the take profit and stop loss mode cannot be switched
  110055: InvalidOrder, // This position has at least one stop loss link order, so the take profit and stop loss mode cannot be switched
  110056: InvalidOrder, // This position has at least one trailing stop link order, so the take profit and stop loss mode cannot be switched
  110057: InvalidOrder, // Conditional order or limit order contains TP/SL related params
  110058: InvalidOrder, // Insufficient number of remaining position size to set take profit and stop loss
  110059: InvalidOrder, // In the case of partial filled of the open order, it is not allowed to modify the take profit and stop loss settings of the open order
  110064: InvalidOrder, // The number of contracts modified cannot be less than or equal to the filled quantity
  110070: InvalidOrder, // ETP symbols are not allowed to be traded
  110072: InvalidOrder, // OrderLinkedID is duplicate
  130006: InvalidOrder, // {"ret_code":130006,"ret_msg":"The number of contracts exceeds maximum limit allowed: too large","ext_code":"","ext_info":"","result":null,"time_now":"1658397095.099030","rate_limit_status":99,"rate_limit_reset_ms":1658397095097,"rate_limit":100}
  130074: InvalidOrder, // {"ret_code":130074,"ret_msg":"expect Rising, but trigger_price[190000000] \u003c= current[211280000]??LastPrice","ext_code":"","ext_info":"","result":null,"time_now":"1655386638.067076","rate_limit_status":97,"rate_limit_reset_ms":1655386638065,"rate_limit":100}
  140003: InvalidOrder, // Order price is out of permissible range
  140005: InvalidOrder, // position status
  140008: InvalidOrder, // Order has been finished or canceled
  140009: InvalidOrder, // The number of stop orders exceeds maximum limit allowed
  140010: InvalidOrder, // Order already cancelled
  140011: InvalidOrder, // Any adjustments made will trigger immediate liquidation
  140015: InvalidOrder, // the position is in cross_margin
  140016: InvalidOrder, // Requested quantity of contracts exceeds risk limit, please adjust your risk limit level before trying again
  140019: InvalidOrder, // orderId illegal
  140020: InvalidOrder, // number of active orders greater than 500
  140021: InvalidOrder, // Open Interest exceeded
  140022: InvalidOrder, // qty has been limited, cannot modify the order to add qty
  140023: InvalidOrder, // This contract only supports position reduction operation, please contact customer service for details
  140028: InvalidOrder, // Open orders exist, so you cannot change position mode
  140030: InvalidOrder, // Duplicate orderId
  140032: InvalidOrder, // Illegal order
  140033: InvalidOrder, // Margin cannot be set without open position
  140034: InvalidOrder, // There is no net position
  140035: InvalidOrder, // Cancel order is not completed before liquidation
  140037: InvalidOrder, // User setting list does not have this symbol
  140040: InvalidOrder, // Order will trigger forced liquidation, please resubmit the order
  140041: InvalidOrder, // Skip liquidation is not allowed when a position or maker order exists
  140042: InvalidOrder, // Pre-delivery status can only reduce positions
  140050: InvalidOrder, // Coin is not in the range of selected
  140054: InvalidOrder, // This position has at least one take profit link order, so the take profit and stop loss mode cannot be switched
  140055: InvalidOrder, // This position has at least one stop loss link order, so the take profit and stop loss mode cannot be switched
  140056: InvalidOrder, // This position has at least one trailing stop link order, so the take profit and stop loss mode cannot be switched
  140057: InvalidOrder, // Conditional order or limit order contains TP/SL related params
  140058: InvalidOrder, // Insufficient number of remaining position size to set take profit and stop loss
  140059: InvalidOrder, // In the case of partial filled of the open order, it is not allowed to modify the take profit and stop loss settings of the open order
  140064: InvalidOrder, // The number of contracts modified cannot be less than or equal to the filled quantity
  140070: InvalidOrder, // ETP symbols are not allowed to be traded
  170005: InvalidOrder, // Too many new orders; current limit is %s orders per %s.
  170115: InvalidOrder, // Invalid timeInForce.
  170116: InvalidOrder, // Invalid orderType.
  170117: InvalidOrder, // Invalid side.
  170121: InvalidOrder, // Invalid symbol.
  170132: InvalidOrder, // Order price too high.
  170133: InvalidOrder, // Order price lower than the minimum.
  170134: InvalidOrder, // Order price decimal too long.
  170135: InvalidOrder, // Order quantity too large.
  170136: InvalidOrder, // Order quantity lower than the minimum.
  170137: InvalidOrder, // Order volume decimal too long
  170139: InvalidOrder, // Order has been filled.
  170140: InvalidOrder, // Transaction amount lower than the minimum.
  170124: InvalidOrder, // Order amount too large.
  170141: InvalidOrder, // Duplicate clientOrderId
  170142: InvalidOrder, // Order has been canceled
  170143: InvalidOrder, // Cannot be found on order book
  170144: InvalidOrder, // Order has been locked
  170145: InvalidOrder, // This order type does not support cancellation
  170146: InvalidOrder, // Order creation timeout
  170147: InvalidOrder, // Order cancellation timeout
  170148: InvalidOrder, // Market order amount decimal too long
  170151: InvalidOrder, // The trading pair is not open yet
  170157: InvalidOrder, // The trading pair is not available for api trading
  170159: InvalidOrder, // Market Order is not supported within the first %s minutes of newly launched pairs due to risk control.
  170190: InvalidOrder, // Cancel order has been finished
  170191: InvalidOrder, // Can not cancel order, please try again later
  170192: InvalidOrder, // Order price cannot be higher than %s .
  170193: InvalidOrder, // Buy order price cannot be higher than %s.
  170194: InvalidOrder, // Sell order price cannot be lower than %s.
  170195: InvalidOrder, // Please note that your order may not be filled
  170196: InvalidOrder, // Please note that your order may not be filled
  170197: InvalidOrder, // Your order quantity to buy is too large. The filled price may deviate significantly from the market price. Please try again
  170198: InvalidOrder, // Your order quantity to sell is too large. The filled price may deviate significantly from the market price. Please try again
  170199: InvalidOrder, // Your order quantity to buy is too large. The filled price may deviate significantly from the nav. Please try again.
  170200: InvalidOrder, // Your order quantity to sell is too large. The filled price may deviate significantly from the nav. Please try again.
  170228: InvalidOrder, // The purchase amount of each order exceeds the estimated maximum purchase amount.
  170229: InvalidOrder, // The sell quantity per order exceeds the estimated maximum sell quantity.
  170210: InvalidOrder, // New order rejected.
  170217: InvalidOrder, // Only LIMIT-MAKER order is supported for the current pair.
  170218: InvalidOrder, // The LIMIT-MAKER order is rejected due to invalid price.
  170010: InvalidOrder, // Purchase failed: Exceed the maximum position limit of leveraged tokens, the current available limit is %s USDT
  170011: InvalidOrder, // "Purchase failed: Exceed the maximum position limit of innovation tokens,
  170019: InvalidOrder, // the current available limit is replaceKey0 USDT"
  170202: InvalidOrder, // Invalid orderFilter parameter.
  170203: InvalidOrder, // Please enter the TP/SL price.
  170204: InvalidOrder, // trigger price cannot be higher than 110% price.
  170206: InvalidOrder, // trigger price cannot be lower than 90% of qty.
  175000: InvalidOrder, // The serialNum is already in use.
  175001: InvalidOrder, // Daily purchase limit has been exceeded. Please try again later.
  175002: InvalidOrder, // There's a large number of purchase orders. Please try again later.
  175004: InvalidOrder, // Daily redemption limit has been exceeded. Please try again later.
  175005: InvalidOrder, // There's a large number of redemption orders. Please try again later.
  175007: InvalidOrder, // Order not found.
  175008: InvalidOrder, // Purchase period hasn't started yet.
  175009: InvalidOrder, // Purchase amount has exceeded the upper limit.
  175012: InvalidOrder, // Redemption period hasn't started yet.
  175013: InvalidOrder, // Redemption amount has exceeded the upper limit.
  175014: InvalidOrder, // Purchase of the LT has been temporarily suspended.
  175015: InvalidOrder, // Redemption of the LT has been temporarily suspended.
  175016: InvalidOrder, // Invalid format. Please check the length and numeric precision.
  175017: InvalidOrder, // Failed to place order：Exceed the maximum position limit of leveraged tokens, the current available limit is XXXX USDT
  181002: InvalidOrder, // symbol is null.
  181003: InvalidOrder, // side is null.
  181004: InvalidOrder, // side only support Buy or Sell.
  182000: InvalidOrder, // symbol related quote price is null
  20003: InvalidOrder, // missing parameter side
  20004: InvalidOrder, // invalid parameter side
  20005: InvalidOrder, // missing parameter symbol
  20006: InvalidOrder, // invalid parameter symbol
  20007: InvalidOrder, // missing parameter order_type
  20008: InvalidOrder, // invalid parameter order_type
  20009: InvalidOrder, // missing parameter qty
  20010: InvalidOrder, // qty must be greater than 0
  20011: InvalidOrder, // qty must be an integer
  20012: InvalidOrder, // qty must be greater than zero and less than 1 million
  20013: InvalidOrder, // missing parameter price
  20014: InvalidOrder, // price must be greater than 0
  20015: InvalidOrder, // missing parameter time_in_force
  20016: InvalidOrder, // invalid value for parameter time_in_force
  20017: InvalidOrder, // missing parameter order_id
  20018: InvalidOrder, // invalid date format
  20019: InvalidOrder, // missing parameter stop_px
  20020: InvalidOrder, // missing parameter base_price
  20021: InvalidOrder, // missing parameter stop_order_id
  30003: InvalidOrder, // qty must be more than the minimum allowed
  30004: InvalidOrder, // qty must be less than the maximum allowed
  30005: InvalidOrder, // price exceeds maximum allowed
  30007: InvalidOrder, // price exceeds minimum allowed
  30008: InvalidOrder, // invalid order_type
  30014: InvalidOrder, // invalid closing order, qty should not greater than size
  30015: InvalidOrder, // invalid closing order, side should be opposite
  30017: InvalidOrder, // estimated fill price cannot be lower than current Buy liq_price
  30018: InvalidOrder, // estimated fill price cannot be higher than current Sell liq_price
  30019: InvalidOrder, // cannot attach TP/SL params for non-zero position when placing non-opening position order
  30020: InvalidOrder, // position already has TP/SL params
  30021: InvalidOrder, // cannot afford estimated position_margin
  30022: InvalidOrder, // estimated buy liq_price cannot be higher than current mark_price
  30023: InvalidOrder, // estimated sell liq_price cannot be lower than current mark_price
  30024: InvalidOrder, // cannot set TP/SL/TS for zero-position
  30025: InvalidOrder, // trigger price should bigger than 10% of last price
  30026: InvalidOrder, // price too high
  30027: InvalidOrder, // price set for Take profit should be higher than Last Traded Price
  30028: InvalidOrder, // price set for Stop loss should be between Liquidation price and Last Traded Price
  30029: InvalidOrder, // price set for Stop loss should be between Last Traded Price and Liquidation price
  30030: InvalidOrder, // price set for Take profit should be lower than Last Traded Price
  30032: InvalidOrder, // order has been filled or cancelled
  30037: InvalidOrder, // order already cancelled
  30043: InvalidOrder, // operation not allowed as position is undergoing liquidation
  30044: InvalidOrder, // operation not allowed as position is undergoing AD
  30045: InvalidOrder, // operation not allowed as position is not normal status
  30074: InvalidOrder, // can't create the stop order, because you expect the order will be triggered when the LastPrice(or IndexPrice、 MarkPrice, determined by trigger_by) is raising to stop_px, but the LastPrice(or IndexPrice、 MarkPrice) is already equal to or greater than stop_px, please adjust base_price or stop_px
  30075: InvalidOrder, // can't create the stop order, because you expect the order will be triggered when the LastPrice(or IndexPrice、 MarkPrice, determined by trigger_by) is falling to stop_px, but the LastPrice(or IndexPrice、 MarkPrice) is already equal to or less than stop_px, please adjust base_price or stop_px

  '-2015': AuthenticationError, // Invalid API-key, IP, or permissions for action.
  10003: AuthenticationError, // Invalid apikey
  10004: AuthenticationError, // invalid sign
  10007: AuthenticationError, // api_key not found in your request parameters
  10008: AuthenticationError, // User had been banned
  10009: AuthenticationError, // IP had been banned
  131004: AuthenticationError, // KYC needed
  33004: AuthenticationError, // apikey already expired

  5004: ExchangeError, // {"retCode":5004,"retMsg":"Server Timeout","result":null,"retExtInfo":{},"time":1667577060106}
  10016: ExchangeError, // {"retCode":10016,"retMsg":"System error. Please try again later."}
  110063: ExchangeError, // Settlement in progress! xxx not available for trades.
  110066: ExchangeError, // No trading is allowed at the current time
  110071: ExchangeError, // Sorry, we're revamping the Unified Margin Account! Currently, new upgrades are not supported. If you have any questions, please contact our 24/7 customer support.
  110073: ExchangeError, // Set margin mode failed
  131084: ExchangeError, // Withdraw failed because of Uta Upgrading
  131200: ExchangeError, // Service error
  131201: ExchangeError, // Internal error
  131206: ExchangeError, // Fail to transfer
  131208: ExchangeError, // Forbid transfer
  131216: ExchangeError, // Query balance error
  131217: ExchangeError, // Risk check error
  131003: ExchangeError, // Interal error
  131090: ExchangeError, // User withdraw has been banned
  131091: ExchangeError, // Blocked login status does not allow withdrawals
  131092: ExchangeError, // User status is abnormal
  131093: ExchangeError, // The withdrawal address is not in the whitelist
  131097: ExchangeError, // Withdrawal of this currency has been closed
  131098: ExchangeError, // Withdrawal currently is not availble from new address
  131099: ExchangeError, // Hot wallet status can cancel the withdraw
  140063: ExchangeError, // Settlement in progress! xxx not available for trades.
  140066: ExchangeError, // No trading is allowed at the current time
  170001: ExchangeError, // Internal error.
  170031: ExchangeError, // The feature has been suspended
  170032: ExchangeError, // Network error. Please try again later
  170149: ExchangeError, // Create order failed
  170150: ExchangeError, // Cancel order failed
  170227: ExchangeError, // This feature is not supported.
  170234: ExchangeError, // System Error
  175027: ExchangeError, // Subscriptions and redemptions are temporarily unavailable while account upgrade is in progress
  30009: ExchangeError, // no position found
  30016: ExchangeError, // TS and SL must be cancelled first while closing position
  30036: ExchangeError, // the expected position value after order execution exceeds the current risk limit
  30041: ExchangeError, // no position found
  30050: ExchangeError, // any adjustments made will trigger immediate liquidation
  30051: ExchangeError, // due to risk limit, cannot adjust leverage
  30052: ExchangeError, // leverage can not less than 1
  30054: ExchangeError, // position margin is invalid
  30057: ExchangeError, // requested quantity of contracts exceeds risk limit
  30068: ExchangeError, // exit value must be positive
  30078: ExchangeError, // {"ret_code":30078,"ret_msg":"","ext_code":"","ext_info":"","result":null,"time_now":"1644853040.916000","rate_limit_status":73,"rate_limit_reset_ms":1644853040912,"rate_limit":75}
  34026: ExchangeError, // the limit is no change
  340099: ExchangeError, // Server error
  3400045: ExchangeError, // Set margin mode failed

  10002: InvalidNonce, // request expired, check your timestamp and recv_window

  10005: PermissionDenied, // permission denied for current apikey
  10010: PermissionDenied, // request ip mismatch
  10020: PermissionDenied, // {"retCode":10020,"retMsg":"your account is not a unified margin account, please update your account","result":null,"retExtInfo":null,"time":1664783731123}
  10024: PermissionDenied, // Compliance rules triggered
  10027: PermissionDenied, // Trading Banned
  10028: PermissionDenied, // The API can only be accessed by unified account users.
  10029: PermissionDenied, // The requested symbol is invalid, please check symbol whitelist
  100028: PermissionDenied, // The API cannot be accessed by unified account users.
  110065: PermissionDenied, // MMP hasn't yet been enabled for your account. Please contact your BD manager.
  110067: PermissionDenied, // unified account is not support
  110068: PermissionDenied, // Leveraged user trading is not allowed
  110069: PermissionDenied, // Do not allow OTC lending users to trade
  140065: PermissionDenied, // MMP hasn't yet been enabled for your account. Please contact your BD manager.
  140067: PermissionDenied, // unified account is not support
  140068: PermissionDenied, // Leveraged user trading is not allowed
  140069: PermissionDenied, // Do not allow OTC lending users to trade
  170224: PermissionDenied, // You're not a user of the Innovation Zone.
  170201: PermissionDenied, // Your account has been restricted for trades. If you have any questions, please email us at support@bybit.com
  175010: PermissionDenied, // You haven't passed the quiz yet! To purchase and/or redeem an LT, please complete the quiz first.
  176035: PermissionDenied, // Failed to close the leverage switch during liquidation
  176036: PermissionDenied, // Failed to adjust leverage switch during forced liquidation
  176037: PermissionDenied, // For non-unified transaction users, the operation failed
  30011: PermissionDenied, // operation not allowed as position is undergoing liquidation
  30012: PermissionDenied, // operation not allowed as position is undergoing ADL
  30013: PermissionDenied, // position is in liq or adl status

  10006: RateLimitExceeded, // too many requests
  10018: RateLimitExceeded, // exceed ip rate limit
  170222: RateLimitExceeded, // Too many requests in this time frame.
  30033: RateLimitExceeded, // The number of stop orders exceeds maximum limit allowed
  30035: RateLimitExceeded, // too fast to cancel

  110004: InsufficientFunds, // Insufficient wallet balance
  110006: InsufficientFunds, // cannot afford estimated position_margin
  110007: InsufficientFunds, // {"retCode":110007,"retMsg":"ab not enough for new order","result":{},"retExtInfo":{},"time":1668838414793}
  110012: InsufficientFunds, // Available balance not enough
  110014: InsufficientFunds, // Available balance not enough to add margin
  110044: InsufficientFunds, // Insufficient available margin
  110045: InsufficientFunds, // Insufficient wallet balance
  110051: InsufficientFunds, // The user's available balance cannot cover the lowest price of the current market
  110052: InsufficientFunds, // User's available balance is insufficient to set a price
  110053: InsufficientFunds, // The user's available balance cannot cover the current market price and upper limit price
  130021: InsufficientFunds, // {"ret_code":130021,"ret_msg":"orderfix price failed for CannotAffordOrderCost.","ext_code":"","ext_info":"","result":null,"time_now":"1644588250.204878","rate_limit_status":98,"rate_limit_reset_ms":1644588250200,"rate_limit":100} |  {"ret_code":130021,"ret_msg":"oc_diff[1707966351], new_oc[1707966351] with ob[....]+AB[....]","ext_code":"","ext_info":"","result":null,"time_now":"1658395300.872766","rate_limit_status":99,"rate_limit_reset_ms":1658395300855,"rate_limit":100} caused issues/9149#issuecomment-1146559498
  131001: InsufficientFunds, // {"retCode":131001,"retMsg":"the available balance is not sufficient to cover the handling fee","result":{},"retExtInfo":{},"time":1666892821245}
  131212: InsufficientFunds, // Insufficient balance
  131085: InsufficientFunds, // Withdrawal amount is greater than your availale balance (the deplayed withdrawal is triggered)
  140004: InsufficientFunds, // Insufficient wallet balance
  140006: InsufficientFunds, // cannot afford estimated position_margin
  140007: InsufficientFunds, // Insufficient available balance
  140012: InsufficientFunds, // Available balance not enough
  140014: InsufficientFunds, // Available balance not enough to add margin
  140044: InsufficientFunds, // Insufficient available margin
  140045: InsufficientFunds, // Insufficient wallet balance
  140051: InsufficientFunds, // The user's available balance cannot cover the lowest price of the current market
  140052: InsufficientFunds, // User's available balance is insufficient to set a price
  140053: InsufficientFunds, // The user's available balance cannot cover the current market price and upper limit price
  170033: InsufficientFunds, // margin Insufficient account balance
  170034: InsufficientFunds, // Liability over flow in spot leverage trade!
  170131: InsufficientFunds, // Balance insufficient
  170223: InsufficientFunds, // Your Spot Account with Institutional Lending triggers an alert or liquidation.
  170226: InsufficientFunds, // Your Spot Account for Margin Trading is being liquidated.
  175003: InsufficientFunds, // Insufficient available balance. Please make a deposit and try again.
  175006: InsufficientFunds, // Insufficient available balance. Please make a deposit and try again.
  176015: InsufficientFunds, // Insufficient available balance
  30010: InsufficientFunds, // insufficient wallet balance
  30031: InsufficientFunds, // insufficient available balance for order cost
  30042: InsufficientFunds, // insufficient wallet balance
  30049: InsufficientFunds, // insufficient available balance
  30067: InsufficientFunds, // insufficient available balance
  3200300: InsufficientFunds, // {"retCode":3200300,"retMsg":"Insufficient margin balance.","result":null,"retExtMap":{}}

  140001: OrderNotFound, // Order does not exist
  170213: OrderNotFound, // Order does not exist.
  20001: OrderNotFound, // Order not exists
  30034: OrderNotFound, // no order found

  170007: RequestTimeout, // Timeout waiting for response from backend server.

  30063: OrderNotFillable, // reduce-only rule not satisfied Copy trade
  110017: OrderNotFillable, // Reduce-only rule not satisfied Unified Margin,
  140017: OrderNotFillable, // Reduce-only rule not satisfied Contract
};
