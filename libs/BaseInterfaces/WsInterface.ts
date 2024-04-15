import {
  KlineConfig
} from "exchanges/binance/RequestParams"

interface WsInterface {
  initConnection: () => any
  restartSocket: () => any
  terminate: () => any
  subscribePriceChannel: (symbol: string) => any
  subscribeKlineChannel: (symbol: string, interval: string) => any
  subscribeOrderbookChannel: (symbol: string, level: any) => any
  subscribePriceChannels: (symbols: string[]) => any
  subscribeKlineChannels: (symbolConfigs: KlineConfig[]) => any
  subscribeOrderbookChannels: (symbols: string[], level: any) => any
}

export default WsInterface;
