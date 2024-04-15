import {
  isEmpty
} from "lodash";
import {
  EventEmitter
} from "ws";
import * as querystring from 'querystring';
import axios, {
  Method
} from "axios";

const PRICE_INTERVAL_TIME = 5000;
const FOREX_MAIN_SOURCE_URL = 'http://35.226.252.114';

class ForexSpotWsClient extends EventEmitter {
  private exchange: string;
  private isProcessingPriceInterval: boolean;
  private priceInterval: any;
  private priceSymbols: string[];

  constructor(exchange: string) {
    super();

    this.exchange = exchange;

    this.isProcessingPriceInterval = false;
    this.priceInterval = undefined;
    this.priceSymbols = [];
  }

  subscribePriceChannels(symbols: string[]) {
    for (const symbol of symbols) {
      this.subscribePriceChannel(symbol);
    }
  }

  subscribePriceChannel(symbol: string) {
    if (this.priceSymbols.includes(symbol)) {
      return;
    }

    this.priceSymbols.push(symbol);
  }

  initConnection() {
    console.log('Init socket connection');

    this.initPriceInterval();
    this.emit('open');
  }

  private initPriceInterval() {
    this.priceInterval = setInterval(() => {
      this.handleSymbolPrices();
    }, PRICE_INTERVAL_TIME);
  }

  private async handleSymbolPrices() {
    if (this.isProcessingPriceInterval || isEmpty(this.priceSymbols)) {
      return;
    }

    this.isProcessingPriceInterval = true;

    const promises = this.priceSymbols.map(symbol => {
      return this.fetchTicker(symbol);
    });
    const results = await Promise.allSettled(promises);

    for (const tickerResult of results) {
      if (tickerResult.status == 'rejected') {
        continue; //TODO: handle rejected case
      }

      this.emit('priceUpdated', tickerResult.value);
    }

    this.isProcessingPriceInterval = false;
  }

  private async fetchTicker(symbol: string) {
    const url = `${FOREX_MAIN_SOURCE_URL}/api/v1/metatrader/symbols/tickers`;
    const params = {
      exchange: this.exchange,
      symbol
    };
    const response = await this.makeRequest('GET', url, params);

    return response.data.data;
  }

  private makeRequest(method: Method, url: string, params: any) {
    url = `${url}?${querystring.stringify(params)}`;

    return axios.request({
      url,
      method
    });
  }
}

export default ForexSpotWsClient;