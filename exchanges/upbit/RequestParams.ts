export interface SubscribeId {
  ticket: string
}

export interface SubscribeData {
  type: string
  codes?: [string]
  isOnlyRealtime?: boolean
}

export type SubscribeParams = [SubscribeId, SubscribeData]

export interface Headers {
  authorization: string
}

export interface JwtPayload {
  access_key: string
  nonce: string
}

export interface GetTickerParams {
  markets: string
}

export interface GetKlinesParams {
  market: string
  count: number
}
export interface GetWithdrawalBalanceInformationParams {
  currency: string
  net_type: string
}

export interface GetExchangeOrderPayload {
  orderId?: string | number
  clientOrderId?: string
  symbol?: string
}

export interface WithdrawParams {
  currency: string
  net_type: string
  amount: string
  address: string
  transaction_type: string
  secondary_address?: string
}

export interface GetDepositAddressParams {
  currency: string
  net_type: string
}

export interface PlaceSpotOrderParams {
  market: string
  side: string
  ord_type?: string
  price?: number
  volume?: number | string
}

export interface GetSpotOrderParams {
  uuid: string
}
