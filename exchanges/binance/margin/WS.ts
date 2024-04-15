import { type ApiConfig } from '../../../libs/RequestConfig';
import BinanceSpotWsClient from '../spot/WS';

class BinanceMarginWsClient extends BinanceSpotWsClient {
  constructor (apiConfig: ApiConfig = {}) {
    super(apiConfig);
  }

  getListenKeyUri (): string {
    return '/sapi/v1/userDataStream';
  }
}

export default BinanceMarginWsClient;
