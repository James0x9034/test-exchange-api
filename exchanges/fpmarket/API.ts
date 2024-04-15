import ForexAPI from "../ForexBaseAPI";
import { ApiConfig } from "../../libs/RequestConfig";

class FpmarketAPI extends ForexAPI {
  constructor(apiConfig: ApiConfig = {}) {
    super('fpmarket', apiConfig);
  }
}

export default FpmarketAPI;