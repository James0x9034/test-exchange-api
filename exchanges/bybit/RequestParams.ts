export interface PlaceOrderParams {
  category: string
  symbol: string
  orderType: string
  qty: string
  timeInForce: string
  closeOnTrigger?: boolean
  positionIdx?: number
  reduceOnly?: boolean
  price?: string
  triggerPrice?: string
  triggerBy?: string
  orderLinkId?: string
  side: string
}

export interface GetKlinesParams {
  category: string
  symbol: string
  interval: string | number
  start: number
  end: number
}
