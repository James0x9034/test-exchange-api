class BaseError extends Error {
  constructor(message: string) {
    super(message);
  }
}
// Exchange Error errors
class ExchangeError extends Error {
  constructor(message: string) {
    super(message);
  }
}
class AuthenticationError extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}
class PermissionDenied extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}
class AccountNotEnabled extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}
class AccountSuspended extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}
class ArgumentsRequired extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}

class Unauthorized extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}

class Forbidden extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}

class NotFound extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}

class InternalServerError extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}
class BadRequest extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}

class BadSymbol extends BadRequest {
  constructor(message: string) {
    super(message);
  }
}
class NoChange extends BadRequest {
  constructor(message: string) {
    super(message);
  }
}
class MarginModeAlreadySet extends NoChange {
  constructor(message: string) {
    super(message);
  }
}

class MarginModeCannotChange extends NoChange {
  constructor(message: string) {
    super(message);
  }
}

class PositionModeAlreadySet extends NoChange {
  constructor(message: string) {
    super(message);
  }
}

class LeverageCannotChange extends NoChange {
  constructor(message: string) {
    super(message);
  }
}
class BadResponse extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}
class NullResponse extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}
class InsufficientFunds extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}

class InsufficientPositions extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}
class InvalidAddress extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}
class AddressPending extends InvalidAddress {
  constructor(message: string) {
    super(message);
  }
}
class InvalidOrder extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}
class ContractUnavailable extends InvalidOrder {
  constructor(message: string) {
    super(message);
  }
}
class OrderNotFound extends InvalidOrder {
  constructor(message: string) {
    super(message);
  }
}
class OrderNotCached extends InvalidOrder {
  constructor(message: string) {
    super(message);
  }
}
class CancelPending extends InvalidOrder {
  constructor(message: string) {
    super(message);
  }
}
class OrderImmediatelyFillable extends InvalidOrder {
  constructor(message: string) {
    super(message);
  }
}
class OrderNotFillable extends InvalidOrder {
  constructor(message: string) {
    super(message);
  }
}
class DuplicateOrderId extends InvalidOrder {
  constructor(message: string) {
    super(message);
  }
}
class NotSupported extends ExchangeError {
  constructor(message: string) {
    super(message);
  }
}
// Network error
class NetworkError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}
class DDoSProtection extends NetworkError {
  constructor(message: string) {
    super(message);
  }
}
class RateLimitExceeded extends DDoSProtection {
  constructor(message: string) {
    super(message);
  }
}
class ExchangeNotAvailable extends NetworkError {
  constructor(message: string) {
    super(message);
  }
}
class OnMaintenance extends ExchangeNotAvailable {
  constructor(message: string) {
    super(message);
  }
}
class InvalidNonce extends NetworkError {
  constructor(message: string) {
    super(message);
  }
}
class RequestTimeout extends NetworkError {
  constructor(message: string) {
    super(message);
  }
}

const errors = {
  Forbidden,
  NotFound,
  Unauthorized,
  InternalServerError,
  MarginModeCannotChange,
  LeverageCannotChange,
  PositionModeAlreadySet,
  BaseError,
  ExchangeError,
  PermissionDenied,
  AccountNotEnabled,
  AccountSuspended,
  ArgumentsRequired,
  BadRequest,
  BadSymbol,
  MarginModeAlreadySet,
  BadResponse,
  NullResponse,
  InsufficientFunds,
  InvalidAddress,
  InvalidOrder,
  OrderNotFound,
  OrderNotCached,
  CancelPending,
  OrderImmediatelyFillable,
  OrderNotFillable,
  DuplicateOrderId,
  NotSupported,
  NetworkError,
  DDoSProtection,
  RateLimitExceeded,
  ExchangeNotAvailable,
  OnMaintenance,
  InvalidNonce,
  RequestTimeout,
  AuthenticationError,
  AddressPending,
  ContractUnavailable,
  InsufficientPositions
};

export {
  Forbidden,
  NotFound,
  Unauthorized,
  InternalServerError,
  MarginModeCannotChange,
  LeverageCannotChange,
  PositionModeAlreadySet,
  BaseError,
  ExchangeError,
  PermissionDenied,
  AccountNotEnabled,
  AccountSuspended,
  ArgumentsRequired,
  BadRequest,
  BadSymbol,
  MarginModeAlreadySet,
  BadResponse,
  NullResponse,
  InsufficientFunds,
  InvalidAddress,
  InvalidOrder,
  OrderNotFound,
  OrderNotCached,
  CancelPending,
  OrderImmediatelyFillable,
  OrderNotFillable,
  DuplicateOrderId,
  NotSupported,
  NetworkError,
  DDoSProtection,
  RateLimitExceeded,
  ExchangeNotAvailable,
  OnMaintenance,
  InvalidNonce,
  RequestTimeout,
  AuthenticationError,
  AddressPending,
  ContractUnavailable,
  InsufficientPositions
};

export default errors;
