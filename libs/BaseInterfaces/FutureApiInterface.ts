import {
  GetOrderbooksRequest,
  type CancelOrderPayload,
  type ChangeAccountConfigPayload,
  type GetKlinesRequestPayload,
  type GetOrderPayload,
  type PlaceFutureOrderPayload
} from '../RequestConfig';
import {
  type FormattedBalance,
  type FormattedKline,
  type FormattedPosition,
  type FormattedTicker,
  type FormattedOrder,
  FormattedExchangeOrderBook,
} from '../ResponseConfig';

interface FutureAPIInterface {
  placeOrder: (payload: PlaceFutureOrderPayload) => Promise<FormattedOrder | any>
  placeBatchOrder: (
    payloads: PlaceFutureOrderPayload[]
  ) => Promise<FormattedOrder[] | any>
  cancelOrder: (payload: CancelOrderPayload) => Promise<FormattedOrder | any>
  getOrderDetail: (payload: GetOrderPayload) => Promise<FormattedOrder>
  changeMarginLeverage: (payload: ChangeAccountConfigPayload) => Promise<any>
  changePositionMode: (symbol: string, enableHedgeMode: boolean) => Promise<any>
  getBalances: () => Promise<FormattedBalance[]>
  getKlines: (payload: GetKlinesRequestPayload) => Promise<FormattedKline[]>
  getPositions: (symbol?: string) => Promise<FormattedPosition[]>
  getTicker: (symbol?: string) => Promise<FormattedTicker | any>
  getMaximumBatchOrder: () => number
  getOrderbooks: (payload: GetOrderbooksRequest) => Promise<FormattedExchangeOrderBook>
}

export default FutureAPIInterface;
