import { ApiConfig, GetKlinesPayload } from "../libs/RequestConfig";
import { camelCaseObjectKey, getTimeRanges, intervalToMilis } from "../libs/Utils";
import * as querystring from 'querystring';
import axios, { Method } from 'axios';

const MAXIMUM_KLINE_LIMIT = 2000;
const FOREX_MAIN_SOURCE_URL = 'http://35.226.252.114';

class ForexAPI {
  private exchange: string;
  private apiConfig: ApiConfig;

  constructor(exchange: string, apiConfig: ApiConfig = {}) {
    this.exchange = exchange;
    this.apiConfig = apiConfig;
  }

  getTicker(symbol: string) {
    const uri = '/api/v1/metatrader/symbols/tickers';
    const params = {
      exchange: this.exchange,
      symbol
    }

    return this._makeRequest('GET', uri, params);
  }

  async getKlines({
    symbol,
    interval,
    limit
  }: GetKlinesPayload) {
    let chartData = [];
    const currentTimestamp = Date.now();
    const intervalInMilis = intervalToMilis(interval);
    const fromTime = currentTimestamp - (intervalInMilis * limit);
    const timeRanges = getTimeRanges(interval, fromTime, currentTimestamp, MAXIMUM_KLINE_LIMIT);
    const uri = '/api/v1/metatrader/charts';
    const totalTimeRanges = timeRanges.length;

    for (let i = 0; i < totalTimeRanges; i++) {
      const timeRange = timeRanges[i];
      const klines = await this._makeRequest('GET', uri, {
        symbol,
        timeframe: interval,
        exchange: this.exchange,
        from_time: timeRange.startTime,
        to_time: timeRange.endTime
      });
      const formattedKlines = klines.map(kline => {
        kline.interval = interval;
        kline.symbol = symbol;

        return camelCaseObjectKey(kline);
      });

      if (i == totalTimeRanges - 1) {
        formattedKlines.pop();
      }

      chartData = chartData.concat(formattedKlines);
    }

    return chartData;
  }

  private async _makeRequest(method: Method, uri: string, params: any) {
    const url = `${FOREX_MAIN_SOURCE_URL}${uri}?${querystring.stringify(params)}`;
    const response = await axios.request({
      url,
      method
    });

    return response.data.data;
  }
}

export default ForexAPI;