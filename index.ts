import BinanceFutureApi from "./exchanges/binance/future/API";
import BinanceFutureWsClient from "./exchanges/binance/future/WS";
import BinanceSpotApi from "./exchanges/binance/spot/API";
import BinanceSpotWsClient from "./exchanges/binance/spot/WS";
import BinanceMarginApi from "./exchanges/binance/margin/API";
import BinanceMarginWsClient from "./exchanges/binance/margin/WS";

import UpbitSpotAPI from "./exchanges/upbit/spot/API";
import UpbitSpotWsClient from "./exchanges/upbit/spot/WS";

import BitgetFutureApi from "./exchanges/bitget/future/API";
import BitgetFutureWSClient from "./exchanges/bitget/future/WS";
import BitgetSpotApi from "./exchanges/bitget/spot/API";
import BitgetSpotWSClient from "./exchanges/bitget/spot/WS";

import BybitFutureAPI from "./exchanges/bybit/future/API";
import BybitFutureWSClient from "./exchanges/bybit/future/WS";
import BybitSpotAPI from "./exchanges/bybit/spot/API";
import BybitSpotWSClient from "./exchanges/bybit/spot/WS";

import OKXFutureAPI from "./exchanges/okx/future/API";
import OKXFutureWSClient from "./exchanges/okx/future/WS";

import FpmarketAPI from "./exchanges/fpmarket/API";
import FpmarketWsClient from "./exchanges/fpmarket/WS";

import BingXFutureAPI from "./exchanges/bingx/future/API";
import BingXFutureWsClient from "./exchanges/bingx/future/WS";
import BingXSpotAPI from "./exchanges/bingx/spot/API";
import BingXSpotWSClient from "./exchanges/bingx/spot/WS";

export default {
  binance: {
    future: {
      api: BinanceFutureApi,
      ws: BinanceFutureWsClient
    },
    spot: {
      api: BinanceSpotApi,
      ws: BinanceSpotWsClient
    },
    margin: {
      api: BinanceMarginApi,
      ws: BinanceMarginWsClient
    }
  },
  upbit: {
    future: {
      api: undefined,
      ws: undefined
    },
    spot: {
      api: UpbitSpotAPI,
      ws: UpbitSpotWsClient
    }
  },
  bitget: {
    future: {
      api: BitgetFutureApi,
      ws: BitgetFutureWSClient
    },
    spot: {
      api: BitgetSpotApi,
      ws: BitgetSpotWSClient
    }
  },
  bybit: {
    future: {
      api: BybitFutureAPI,
      ws: BybitFutureWSClient
    },
    spot: {
      api: BybitSpotAPI,
      ws: BybitSpotWSClient
    }
  },
  okx: {
    future: {
      api: OKXFutureAPI,
      ws: OKXFutureWSClient
    },
    spot: {
      api: undefined,
      ws: undefined
    }
  },
  bingx: {
    future: {
      api: BingXFutureAPI,
      ws: BingXFutureWsClient
    },
    spot: {
      api: BingXSpotAPI,
      ws: BingXSpotWSClient
    }
  },
  fpmarket:{
    future: {
      api: undefined,
      ws: undefined
    },
    spot: {
      api: undefined,
      ws: undefined
    },
    forex: {
      api: FpmarketAPI,
      ws: FpmarketWsClient
    }
  }
};
