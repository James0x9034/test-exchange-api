import { type ExchangeOrderSide, type ExchangeOrderType, type ProductType } from './Consts';

export interface PlaceFutureOrderParams {
  marginCoin: string
  symbol: string
  size: string | number
  side: ExchangeOrderSide
  orderType: string
  price?: string | number
  timeInForceValue?: string
  clientOid?: string
}

export type PlaceBatchOrderPayload = Record<string, PlaceFutureOrderParams[]>

export interface GetBusinessBillsParams {
  startTime: string
  endTime: string
  productType: ProductType
  pageSize: number
  next: boolean
  lastEndId?: string
}

export interface GetOrderParams {
  symbol: string
  clientOrderId?: string
  orderId?: string | number
}

// spot
export interface WithdrawParams {
  coin: string
  chain: string
  address: string
  amount: string | number
  tag?: string
}

export interface GetSpotOrderParams {
  symbol: string
  clientOid?: string
  orderId?: string | number
}

export interface PlaceSpotOrderParams {
  symbol: string
  side: string
  quantity: string | number
  orderType: ExchangeOrderType
  force: string
  price?: string | number
}

// payload
export interface GetExchangeOrderPayload {
  symbol: string
  clientOrderId?: string
  orderId?: string | number
}

export interface GetBusinessBillsPayload {
  startTime: string
  endTime: string
  lastEndId?: string
}

// ws

export interface ExchangeWsParams {
  instType: string
  channel: string
  instId: string
}
