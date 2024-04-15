import ForexSpotWsClient from "../ForexBaseWS";

class FpmarketWsClient extends ForexSpotWsClient {
  constructor() {
    super('fpmarket');
  }
}

export default FpmarketWsClient;
