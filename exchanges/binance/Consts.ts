/* eslint-disable max-len */
import {
  AccountSuspended,
  AuthenticationError,
  BadRequest,
  BadResponse,
  BadSymbol,
  DDoSProtection,
  ExchangeError,
  ExchangeNotAvailable,
  InsufficientFunds,
  InsufficientPositions,
  InvalidNonce,
  InvalidOrder,
  LeverageCannotChange,
  MarginModeAlreadySet,
  MarginModeCannotChange,
  OnMaintenance,
  OrderImmediatelyFillable,
  OrderNotFillable,
  OrderNotFound,
  PermissionDenied,
  PositionModeAlreadySet,
  RateLimitExceeded,
  RequestTimeout
} from '../../libs/Error';

export enum AccountTransferType {
  SPOT_TO_USDT_FUTURE = 1,
  USDT_FUTURE_TO_SPOT = 2,
  SPOT_TO_COIN_FUTURE = 3,
  COIN_FUTURE_TO_SPOT = 4
}

export enum ExchangeOrderStatus {
  NEW = 'NEW',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  CANCELED = 'CANCELED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum MarginType {
  ISOLATED = 'ISOLATED',
  CROSS = 'CROSSED'
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
  TAKE_PROFIT_LIMIT = 'TAKE_PROFIT_LIMIT'
}

export enum TimeInForce {
  GTC = 'GTC',
  GTX = 'GTX'
}

export enum ResponseType {
  RESULT = 'RESULT',
  FULL = 'FULL'
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW'
}

export enum BalanceEvent {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAW',
  TRANSFER = 'ASSET_TRANSFER'
}

export enum DepositStatus {
  SUCCESS = 1
}

export enum ExchangeDepositStatus {
  PENDING = 0,
  EXECUTING = 6,
  EXECUTED = 1
}

export enum ExchangeWithdrawalStatus {
  EMAIL_SENT = 0,
  AWAITING = 2,
  PROCESSING = 4,
  COMPLETED = 6,
  CANCELLED = 1,
  REJECTED = 3,
  FAILURE = 5
}

export enum ExchangePositionSide {
  BOTH = 'BOTH'
}

export const URL_FUTURE_PREFIX = '/fapi/v1';

export const MAXIMUM_KLINE_LIMIT = 1000;

export const EXCHANGE_EXCEPTION : {[key: string| number]: any}= {
  'System is under maintenance.': OnMaintenance, // {"code":1,"msg":"System is under maintenance."}

  'System abnormality': ExchangeError, // {"code":-1000,"msg":"System abnormality"}
  '-2010': ExchangeError, // {"code":-2010,"msg":"generic error code for createOrder -> 'Account has insufficient balance for requested action.', {"code":-2010,"msg":"Rest API trading is not enabled."}, etc..."}
  '-3000': ExchangeError, // {"code":-3000,"msg":"Internal server error."}
  '-3004': ExchangeError, // {"code":-3004,"msg":"Trade not allowed."}
  '-3007': ExchangeError, // {"code":-3007,"msg":"You have pending transaction, please try again later.."}
  '-3017': ExchangeError, // {"code":-3017,"msg":"This asset are not allowed to transfer into margin account currently."}
  '-3024': ExchangeError, // {"code":-3024,"msg":"The unpaid debt is too small after this repayment."}
  '-3029': ExchangeError, // {"code":-3029,"msg":"Transfer failed."}
  '-3037': ExchangeError, // {"code":-3037,"msg":"PNL is clearing. Wait a second."}
  '-3045': ExchangeError, // {"code":-3045,"msg":"The system doesn't have enough asset now."}
  '-3999': ExchangeError, // {"code":-3999,"msg":"This function is only available for invited users."}
  '-4015': ExchangeError, // {"code":-4015 ,"msg":"Withdraw is limited."}
  '-4023': ExchangeError, // {"code":-4023,"msg":"Within 24 hours, the withdrawal exceeds the maximum amount."}
  '-4027': ExchangeError, // {"code":-4027,"msg":"Failed to obtain tranId."}
  '-4030': ExchangeError, // {"code":-4030,"msg":"Confirmation of successful asset withdrawal. [TODO] possible bug in docs"}
  '-4031': ExchangeError, // {"code":-4031,"msg":"Cancellation failed."}
  '-4032': ExchangeError, // {"code":-4032,"msg":"Withdraw verification exception."}
  '-4034': ExchangeError, // {"code":-4034,"msg":"The address is suspected of fake."}
  '-4037': ExchangeError, // {"code":-4037,"msg":"Re-sending Mail failed."}
  '-4038': ExchangeError, // {"code":-4038,"msg":"Please try again in 5 minutes."}
  '-4041': ExchangeError, // {"code":-4041,"msg":"Please try again in one minute."}
  '-4042': ExchangeError, // {"code":-4042,"msg":"This asset cannot get deposit address again."}
  '-4045': ExchangeError, // {"code":-4045,"msg":"Failure to acquire assets."}
  '-5010': ExchangeError, // {"code":-5010,"msg":"Asset transfer fail."}
  '-5012': ExchangeError, // {"code":-5012,"msg":"Asset transfer is in pending."}
  '-6004': ExchangeError, // {"code":-6004,"msg":"Product not in purchase status"}
  '-6013': ExchangeError, // {"code":-6013,"msg":"Purchasing failed"}

  'You are not authorized to execute this request.': PermissionDenied, // {"msg":"You are not authorized to execute this request."}
  'You don\'t have permission.': PermissionDenied, // {"msg":"You don't have permission.","success":false}
  'This symbol is restricted for this account.': PermissionDenied,
  'This symbol is not permitted for this account.': PermissionDenied, // {"code":-2010,"msg":"This symbol is not permitted for this account."}
  '-1005': PermissionDenied, // {"code":-1005,"msg":"No such IP has been white listed"}
  '-1011': PermissionDenied, // {"code":-1011,"msg":"This IP cannot access this route."}
  '-4014': PermissionDenied, // {"code":-4014 ,"msg":"Withdraw is not allowed within 2 min login."}
  '-4016': PermissionDenied, // {"code":-4016 ,"msg":"Within 24 hours after password modification, withdrawal is prohibited."} | on swap: {"code":-4016,"msg":"Limit price can't be higher than 27330.52."}
  '-4017': PermissionDenied, // {"code":-4017 ,"msg":"Within 24 hours after the release of 2FA, withdrawal is prohibited."}
  '-4035': PermissionDenied, // {"code":-4035,"msg":"This address is not on the whitelist. Please join and try again."}

  'API key does not exist': AuthenticationError,
  '-1002': AuthenticationError, // {"code":-1002,"msg":"'You are not authorized to execute this request.'"}
  '-1022': AuthenticationError, // {"code":-1022,"msg":"Signature for this request is not valid."}
  '-1099': AuthenticationError, // {"code":-1099,"msg":"Not found, authenticated, or authorized"}
  '-1109': AuthenticationError, // {"code":-1109,"msg":"Invalid account."}
  '-1125': AuthenticationError, // {"code":-1125,"msg":"This listenKey does not exist."}
  '-2008': AuthenticationError, // {"code":-2008,"msg":"Invalid Api-Key ID."}
  '-2014': AuthenticationError, // {"code":-2014,"msg":"API-key format invalid."}
  '-2015': AuthenticationError, // {"code":-2015,"msg":"Invalid API-key, IP, or permissions for action."}
  '-3001': AuthenticationError, // {"code":-3001,"msg":"Please enable 2FA first."}
  '-4004': AuthenticationError, // {"code":-4004,"msg":"You don't login or auth."}
  '-4013': AuthenticationError, // {"code":-4013 ,"msg":"2FA is not opened."}
  // "-4046": AuthenticationError, // {"code":-4046,"msg":"Agreement not confirmed."}
  '-6019': AuthenticationError, // {"code":-6019,"msg":"Need confirm"}
  '-13007': AuthenticationError, // {"code":-13007,"msg":"The Agreement is not signed"}
  100001003: AuthenticationError, // {"code":100001003,"msg":"Verification failed"} // undocumented
  200003903: AuthenticationError, // {"code":200003903,"msg":"Your identity verification has been rejected. Please complete identity verification again."}

  'Order would trigger immediately.': OrderImmediatelyFillable,
  'Stop price would trigger immediately.': OrderImmediatelyFillable, // {"code":-2010,"msg":"Stop price would trigger immediately."}
  'Order would immediately match and take.': OrderImmediatelyFillable, // {"code":-2010,"msg":"Order would immediately match and take."}
  '-2021': OrderImmediatelyFillable, // {"code":-2021,"msg":"Order would immediately trigger."}

  'Account has insufficient balance for requested action.': InsufficientFunds,
  '-2018': InsufficientFunds, // {"code":-2018,"msg":"Balance is insufficient"}
  '-2019': InsufficientFunds, // {"code":-2019,"msg":"Margin is insufficient."}
  '-2023': InsufficientFunds, // {"code":-2023,"msg":"User in liquidation mode now."}
  '-2028': InsufficientFunds, // {"code":-2028,"msg":"Leverage is smaller than permitted: insufficient margin balance"}
  '-3005': InsufficientFunds, // {"code":-3005,"msg":"Transferring out not allowed. Transfer out amount exceeds max amount."}
  '-3006': InsufficientFunds, // {"code":-3006,"msg":"Your borrow amount has exceed maximum borrow amount."}
  '-3008': InsufficientFunds, // {"code":-3008,"msg":"Borrow not allowed. Your borrow amount has exceed maximum borrow amount."}
  '-3012': InsufficientFunds, // {"code":-3012,"msg":"Borrow is banned for this asset."}
  '-3020': InsufficientFunds, // {"code":-3020,"msg":"Transfer out amount exceeds max amount."}
  '-3041': InsufficientFunds, // {"code":-3041,"msg":"Balance is not enough"}
  '-4024': InsufficientFunds, // {"code":-4024,"msg":"You don't have this asset."}
  '-4025': InsufficientFunds, // {"code":-4025,"msg":"The number of hold asset is less than zero."}
  '-4026': InsufficientFunds, // {"code":-4026,"msg":"You have insufficient balance."}
  '-5002': InsufficientFunds, // {"code":-5002,"msg":"You have insufficient balance."}
  '-5003': InsufficientFunds, // {"code":-5003,"msg":"You don't have this asset."}
  '-5005': InsufficientFunds, // {"code":-5005,"msg":"The residual balances of %s is too low, Please re-choose."}
  '-5008': InsufficientFunds, // {"code":-5008,"msg":"Insufficient amount of returnable assets."}
  '-5013': InsufficientFunds, // {"code":-5013,"msg":"Asset transfer failed: insufficient balance""} // undocumented
  '-6012': InsufficientFunds, // {"code":-6012,"msg":"Balance not enough"}
  '-9000': InsufficientFunds, // {"code":-9000,"msg":"user have no avaliable amount"}"
  '-11008': InsufficientFunds, // {"code":-11008,"msg":"Exceeding the account's maximum borrowable limit."} // undocumented

  'Rest API trading is not enabled.': ExchangeNotAvailable,
  'This account may not place or cancel orders.': ExchangeNotAvailable,
  'Market is closed.': ExchangeNotAvailable, // {"code":-1013,"msg":"Market is closed."}
  '-1000': ExchangeNotAvailable, // {"code":-1000,"msg":"An unknown error occured while processing the request."}
  '-1001': ExchangeNotAvailable, // {"code":-1001,"msg":"'Internal error; unable to process your request. Please try again.'"}
  '-1016': ExchangeNotAvailable, // {"code":-1016,"msg":"'This service is no longer available.',"}

  'Too many requests. Please try again later.': DDoSProtection, // {"msg":"Too many requests. Please try again later.","success":false}
  '-1004': DDoSProtection, // {"code":-1004,"msg":"Server is busy, please wait and try again"}
  '-3044': DDoSProtection, // {"code":-3044,"msg":"System busy."}

  'This action is disabled on this account.': AccountSuspended, // {"code":-2011,"msg":"This action is disabled on this account."}
  '-3014': AccountSuspended, // {"code":-3014,"msg":"Borrow is banned for this account."}
  '-3018': AccountSuspended, // {"code":-3018,"msg":"Transferring in has been banned for this account."}
  '-3019': AccountSuspended, // {"code":-3019,"msg":"Transferring out has been banned for this account."}
  '-3022': AccountSuspended, // {"code":-3022,"msg":"You account's trading is banned."}
  '-3036': AccountSuspended, // {"code":-3036,"msg":"This account is not allowed to repay."}

  'Limit orders require GTC for this phase.': BadRequest,
  'This order type is not possible in this trading phase.': BadRequest,
  'This type of sub-account exceeds the maximum number limit': BadRequest, // {"code":-9000,"msg":"This type of sub-account exceeds the maximum number limit"}
  '-1020': BadRequest, // {"code":-1020,"msg":"'This operation is not supported.'"}
  '-1023': BadRequest, // {"code":-1023,"msg":"Start time is greater than end time."}
  '-1100': BadRequest, // {"code":-1100,"msg":"createOrder(symbol, 1, asdf) -> 'Illegal characters found in parameter 'price'"}
  '-1101': BadRequest, // {"code":-1101,"msg":"Too many parameters; expected %s and received %s."}
  '-1102': BadRequest, // {"code":-1102,"msg":"Param %s or %s must be sent, but both were empty"}
  '-1103': BadRequest, // {"code":-1103,"msg":"An unknown parameter was sent."}
  '-1104': BadRequest, // {"code":-1104,"msg":"Not all sent parameters were read, read 8 parameters but was sent 9"}
  '-1105': BadRequest, // {"code":-1105,"msg":"Parameter %s was empty."}
  '-1106': BadRequest, // {"code":-1106,"msg":"Parameter %s sent when not required."}
  '-1108': BadRequest, // {"code":-1108,"msg":"Invalid asset."}
  '-1110': BadRequest, // {"code":-1110,"msg":"Invalid symbolType."}
  '-1111': BadRequest, // {"code":-1111,"msg":"Precision is over the maximum defined for this asset."}
  '-1113': BadRequest, // {"code":-1113,"msg":"Withdrawal amount must be negative."}
  '-1114': BadRequest, // {"code":-1114,"msg":"TimeInForce parameter sent when not required."}
  '-1115': BadRequest, // {"code":-1115,"msg":"Invalid timeInForce."}
  '-1116': BadRequest, // {"code":-1116,"msg":"Invalid orderType."}
  '-1117': BadRequest, // {"code":-1117,"msg":"Invalid side."}
  '-1118': BadRequest, // {"code":-1118,"msg":"New client order ID was empty."}
  '-1119': BadRequest, // {"code":-1119,"msg":"Original client order ID was empty."}
  '-1120': BadRequest, // {"code":-1120,"msg":"Invalid interval."}
  '-1127': BadRequest, // {"code":-1127,"msg":"More than %s hours between startTime and endTime."}
  '-1128': BadRequest, // {"code":-1128,"msg":"{"code":-1128,"msg":"Combination of optional parameters invalid."}"}
  '-1130': BadRequest, // {"code":-1130,"msg":"Data sent for paramter %s is not valid."}
  '-1131': BadRequest, // {"code":-1131,"msg":"recvWindow must be less than 60000"}
  '-1135': BadRequest, // This error code will occur if a parameter requiring a JSON object is invalid.
  '-1136': BadRequest, // {"code":-1136,"msg":"Invalid newOrderRespType"}
  '-2016': BadRequest, // {"code":-2016,"msg":"No trading window could be found for the symbol. Try ticker/24hrs instead."}
  '-3003': BadRequest, // {"code":-3003,"msg":"Margin account does not exist."}
  '-3009': BadRequest, // {"code":-3009,"msg":"This asset are not allowed to transfer into margin account currently."}
  '-3010': BadRequest, // {"code":-3010,"msg":"Repay not allowed. Repay amount exceeds borrow amount."}
  '-3011': BadRequest, // {"code":-3011,"msg":"Your input date is invalid."}
  '-3013': BadRequest, // {"code":-3013,"msg":"Borrow amount less than minimum borrow amount."}
  '-3015': BadRequest, // {"code":-3015,"msg":"Repay amount exceeds borrow amount."}
  '-3016': BadRequest, // {"code":-3016,"msg":"Repay amount less than minimum repay amount."}
  '-3021': BadRequest, // {"code":-3021,"msg":"Margin account are not allowed to trade this trading pair."}
  '-3023': BadRequest, // {"code":-3023,"msg":"You can't transfer out/place order under current margin level."}
  '-3025': BadRequest, // {"code":-3025,"msg":"Your input date is invalid."}
  '-3026': BadRequest, // {"code":-3026,"msg":"Your input param is invalid."}
  '-3038': BadRequest, // {"code":-3038,"msg":"Listen key not found."}
  '-3042': BadRequest, // {"code":-3042,"msg":"PriceIndex not available for this margin pair."}
  '-3043': BadRequest, // {"code":-3043,"msg":"Transferring in not allowed."}
  '-4001': BadRequest, // {"code":-4001 ,"msg":"Invalid operation."}
  '-4002': BadRequest, // {"code":-4002 ,"msg":"Invalid get."}
  '-4003': BadRequest, // {"code":-4003 ,"msg":"Your input email is invalid."}
  '-4006': BadRequest, // {"code":-4006 ,"msg":"Support main account only."}
  '-4007': BadRequest, // {"code":-4007 ,"msg":"Address validation is not passed."}
  '-4008': BadRequest, // {"code":-4008 ,"msg":"Address tag validation is not passed."}
  '-4010': BadRequest, // {"code":-4010 ,"msg":"White list mail has been confirmed."} // [TODO] possible bug: it should probably be "has not been confirmed"
  '-4011': BadRequest, // {"code":-4011 ,"msg":"White list mail is invalid."}
  '-4012': BadRequest, // {"code":-4012 ,"msg":"White list is not opened."}
  '-4021': BadRequest, // {"code":-4021,"msg":"Asset withdrawal must be an %s multiple of %s."}
  '-4022': BadRequest, // {"code":-4022,"msg":"Not less than the minimum pick-up quantity %s."}
  '-4028': BadRequest, // {"code":-4028,"msg":"The amount of withdrawal must be greater than the Commission."}
  '-4029': BadRequest, // {"code":-4029,"msg":"The withdrawal record does not exist."}
  '-4033': BadRequest, // {"code":-4033,"msg":"Illegal address."}
  '-4036': BadRequest, // {"code":-4036,"msg":"The new address needs to be withdrawn in {0} hours."}
  '-4039': BadRequest, // {"code":-4039,"msg":"The user does not exist."}
  '-4040': BadRequest, // {"code":-4040,"msg":"This address not charged."}
  '-4043': BadRequest, // {"code":-4043,"msg":"More than 100 recharge addresses were used in 24 hours."}
  '-4044': BadRequest, // {"code":-4044,"msg":"This is a blacklist country."}
  // "-4047": BadRequest, // {"code":-4047,"msg":"Time interval must be within 0-90 days"}
  '-4054': BadRequest, // {"code":-4054,"msg":"Cannot add position margin: position is 0."}
  '-5001': BadRequest, // {"code":-5001,"msg":"Don't allow transfer to micro assets."}
  '-5004': BadRequest, // {"code":-5004,"msg":"The residual balances of %s have exceeded 0.001BTC, Please re-choose."}
  '-5006': BadRequest, // {"code":-5006,"msg":"Only transfer once in 24 hours."}
  '-5007': BadRequest, // {"code":-5007,"msg":"Quantity must be greater than zero."}
  '-5009': BadRequest, // {"code":-5009,"msg":"Product does not exist."}
  '-5011': BadRequest, // {"code":-5011,"msg":"future account not exists."}
  '-5021': BadRequest, // {"code":-5021,"msg":"This parent sub have no relation"}
  '-6001': BadRequest, // {"code":-6001,"msg":"Daily product not exists."}
  '-6003': BadRequest, // {"code":-6003,"msg":"Product not exist or you don't have permission"}
  '-6006': BadRequest, // {"code":-6006,"msg":"Redeem amount error"}
  '-6007': BadRequest, // {"code":-6007,"msg":"Not in redeem time"}
  '-6008': BadRequest, // {"code":-6008,"msg":"Product not in redeem status"}
  '-6011': BadRequest, // {"code":-6011,"msg":"Exceeding the maximum num allowed to purchase per user"}
  '-6014': BadRequest, // {"code":-6014,"msg":"Exceed up-limit allowed to purchased"}
  '-6015': BadRequest, // {"code":-6015,"msg":"Empty request body"}
  '-6016': BadRequest, // {"code":-6016,"msg":"Parameter err"}
  '-6017': BadRequest, // {"code":-6017,"msg":"Not in whitelist"}
  '-6018': BadRequest, // {"code":-6018,"msg":"Asset not enough"}
  '-6020': BadRequest, // {"code":-6020,"msg":"Project not exists"}
  '-7001': BadRequest, // {"code":-7001,"msg":"Date range is not supported."}
  '-7002': BadRequest, // {"code":-7002,"msg":"Data request type is not supported."}
  '-10017': BadRequest, // {"code":-10017,"msg":"Repay amount should not be larger than liability."}
  '-13000': BadRequest, // {"code":-13000,"msg":"Redeption of the token is forbiden now"}
  '-13001': BadRequest, // {"code":-13001,"msg":"Exceeds individual 24h redemption limit of the token"}
  '-13002': BadRequest, // {"code":-13002,"msg":"Exceeds total 24h redemption limit of the token"}
  '-13003': BadRequest, // {"code":-13003,"msg":"Subscription of the token is forbiden now"}
  '-13004': BadRequest, // {"code":-13004,"msg":"Exceeds individual 24h subscription limit of the token"}
  '-13005': BadRequest, // {"code":-13005,"msg":"Exceeds total 24h subscription limit of the token"}
  '-21001': BadRequest, // {"code":-21001,"msg":"USER_IS_NOT_UNIACCOUNT"}
  '-21002': BadRequest, // {"code":-21002,"msg":"UNI_ACCOUNT_CANT_TRANSFER_FUTURE"}
  '-21003': BadRequest, // {"code":-21003,"msg":"NET_ASSET_MUST_LTE_RATIO"}

  '-1003': RateLimitExceeded, // {"code":-1003,"msg":"Too much request weight used, current limit is 1200 request weight per 1 MINUTE. Please use the websocket for live updates to avoid polling the API."}
  '-1015': RateLimitExceeded, // {"code":-1015,"msg":"'Too many new orders; current limit is %s orders per %s.'"}
  '-4005': RateLimitExceeded, // {"code":-4005 ,"msg":"Too many new requests."}
  '-6009': RateLimitExceeded, // {"code":-6009,"msg":"Request frequency too high"}
  '-12014': RateLimitExceeded, // {"code":-12014,"msg":"More than 1 request in 3 seconds"}

  '-1006': BadResponse, // {"code":-1006,"msg":"An unexpected response was received from the message bus. Execution status unknown."}
  '-1010': BadResponse, // {"code":-1010,"msg":"ERROR_MSG_RECEIVED."}

  '-1007': RequestTimeout, // {"code":-1007,"msg":"Timeout waiting for response from backend server. Send status unknown; execution status unknown."}

  '-1013': InvalidOrder, // {"code":-1013,"msg":"createOrder -> 'invalid quantity'/'invalid price'/MIN_NOTIONAL"}
  '-1014': InvalidOrder, // {"code":-1014,"msg":"Unsupported order combination."}
  '-1112': InvalidOrder, // {"code":-1112,"msg":"No orders on book for symbol."}
  '-2025': InvalidOrder, // {"code":-2025,"msg":"Reach max open order limit."}
  '-2026': InvalidOrder, // {"code":-2026,"msg":"This OrderType is not supported when reduceOnly."}
  '-2027': InvalidOrder, // {"code":-2027,"msg":"Exceeded the maximum allowable position at current leverage."}
  '-6005': InvalidOrder, // {"code":-6005,"msg":"Smaller than min purchase limit"}
  '-13006': InvalidOrder, // {"code":-13006,"msg":"Subscription amount is too small"}

  '-1021': InvalidNonce,  // {"code":-1021,"msg":"'your time is ahead of server'"}

  '-1121': BadSymbol, // {"code":-1121,"msg":"Invalid symbol."}
  '-3002': BadSymbol, // {"code":-3002,"msg":"We don't have this asset."}
  '-3027': BadSymbol, // {"code":-3027,"msg":"Not a valid margin asset."}
  '-3028': BadSymbol, // {"code":-3028,"msg":"Not a valid margin pair."}
  '-4018': BadSymbol, // {"code":-4018,"msg":"We don't have this asset."}
  '-4019': BadSymbol, // {"code":-4019,"msg":"Current asset is not open for withdrawal."}

  '-2011': OrderNotFound, // {  "code": -2011,"msg": "Unknown order sent."}
  '-2013': OrderNotFound, // {"code":-2013,"msg":"fetchOrder (1, 'BTC/USDT') -> 'Order does not exist'"}

  '-2020': OrderNotFillable, // {"code":-2020,"msg":"Unable to fill."}
  '-5022': OrderNotFillable, // {"code":-5022,"msg":"Postonly order invalid"}

  '-4046': MarginModeAlreadySet, // {"code":-4046,"msg":"No need to change margin type."}

  '-4047': MarginModeCannotChange, // {"code":-4047, "msg: cant change margin because of open position"}
  '-4048': MarginModeCannotChange, // {"code":-4048, "msg: cant change margin because of open order"}

  '-4059': PositionModeAlreadySet, // {"code":-4059,"msg":"No need to change posititon mode."}

  '-4161': LeverageCannotChange, // {"code":-4161,"msg":"Leverage change not supported"}

  '-2022': InsufficientPositions, // ReducedOnly orders is rejected
  '-2024': InsufficientPositions, // {"code":-2024,"msg":"Position is not sufficient."}
  '-4118': InsufficientPositions, // ReduceOnly Order Failed. Please check your existing position and open orders
};
