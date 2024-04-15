import { AccountTransferType, type ExchangeOrderType } from './Consts';

export interface TransferRequest {
  asset: string;
  amount: number;
  type: AccountTransferType;
}

export interface WithdrawParams {
  coin: string
  network: string
  address: string
  amount: number | string
  addressTag?: string
}

export interface PlaceOrderParams {
  symbol: string
  side: string
  quantity: number | string
  newOrderRespType: string
  positionSide?: string
  type?: ExchangeOrderType
  price?: number | string
  timeInForce?: string
  stopPrice?: number | string
  newClientOrderId?: string
}

export interface GetOrderParams {
  symbol: string
  origClientOrderId?: string
  orderId?: string | number
}

export interface GetPositionParams {
  symbol?: string
}

// spot
export interface GetDepositAddressParams {
  coin: string
  network?: string
}

export interface GetDepositHistoriesParams {
  coin: string
  startTime?: number
}

export type KlineConfig = {
  symbol: string,
  interval: string
}