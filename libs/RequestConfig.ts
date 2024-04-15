import { CreateAxiosDefaults } from 'axios';
import { MarginType, OrderType } from './Consts';

export interface GetDepositAddressPayload {
  coin: string;
  network?: string;
}

export interface CancelOrderPayload {
  symbol: string;
  orderId: string | number;
  clientOrderId?: string;
}

export interface PlaceOrderRequestPayload {
  price?: number;
  stopPrice?: number;
  symbol: string;
  quantity?: number;
  positionSide: string;
  side?: string;
  orderType: string;
  clientOrderId?: string;
  isMaker?: boolean;
  isHedgeMode?: boolean;
  isFullResponse?: boolean;
  clientOrder: any;
  tag: string;
}

export interface PlaceFutureOrderPayload {
  price?: number | string;
  stopPrice?: number | string;
  symbol: string;
  quantity: number | string;
  positionSide: string;
  tag?: string;
  orderType: OrderType;
  clientOrderId?: string;
  isMaker?: boolean;
  isHedgeMode?: boolean;
  isFullResponse?: boolean;
}

export interface PlaceSpotOrderPayload {
  price?: number;
  stopPrice?: number;
  symbol: string;
  quantity: number | string;
  amount: number;
  side: string;
  timeInForce?: string;
  orderType?: OrderType;
  isFullResponse?: boolean;
  clientOrderId?: string;
}

export interface GetKlinesRequestPayload {
  symbol: string;
  interval: string;
  limit: number;
}

export interface GetOrderbooksRequest {
  symbol: string;
  limit: number;
}

export interface OrderTradesParams {
  orderId: number;
  symbol: string;
}

export interface GetOrderPayload {
  orderId?: string | number;
  clientOrderId?: string;
  symbol: string;
}

export interface ChangeAccountConfigPayload {
  symbol: string;
  leverage: number;
  tradeMode?: number;
  marginType?: MarginType;
  side?: string;
}

export interface ChangePositionModeRequestPayload {
  symbol: string;
  enableHedgeMode?: boolean;
}

export interface WithdrawRequestPayload {
  coin: string;
  network: string;
  address: string;
  addressTag?: string;
  amount: number | string;
}

export interface ApiConfig {
  apiKey?: string;
  apiSecret?: string;
  passphrase?: string;
  httpConfig?: CreateAxiosDefaults;
}

export interface ChangePositionMode {
  symbol: string;
  enableHedgeMode: boolean | false;
}

export interface ChangeMarginLeveragePayload {
  symbol: string;
  leverage: number;
}

export interface GetKlinesPayload {
  symbol: string;
  interval: string;
  limit: number;
}
