import BigNumber from 'bignumber.js';
import {
  intervalToMilis
} from '../../libs/Utils';
import {
  isEmpty
} from 'lodash';
import {
  EventEmitter,
  WebSocket
} from 'ws';
import {
  KlineConfig
} from 'exchanges/binance/RequestParams';

const BUSINESS_WS_URL = 'wss://ws.okx.com:8443/ws/v5/business';
const PING_INTERVAL_TIME = 15000;
const PONG_TIMEOUT_TIME = 10000;

class OKXBusinessSocketConnection extends EventEmitter {
  private socket: any;
  private pingInterval: any;
  private pongTimeout: any;

  constructor() {
    super();

    this.socket = undefined;
    this.pingInterval = undefined;
    this.pongTimeout = undefined;
  }

  isOpen() {
    return this.socket?.readyState == WebSocket.OPEN;
  }

  async initConnection() {
    this.socket = new WebSocket(BUSINESS_WS_URL);

    this.socket.on('open', () => {
      this._initPingInterval();
      this.emit('open');
    });

    this.socket.on('close', () => {
      this.emit('close');
    });

    this.socket.on('message', data => {
      this._onMessage(data);
    });

    this.socket.on('error', () => {
      this.emit('close');
    });
  }

  subscribeKlineChannels(symbolConfigs: KlineConfig[]) {
    const formattedChannels = symbolConfigs.map(config => {
      const formattedInterval = this._parseKlineInterval(config.interval);

      return {
        channel: `candle${formattedInterval}`,
        instId: config.symbol
      };
    });

    this._sendMessage('subscribe', formattedChannels);
  }

  subscribeKlineChannel(symbol: string, interval: string) {
    const formattedInterval = this._parseKlineInterval(interval);

    this._sendMessage('subscribe', [{
      channel: `candle${formattedInterval}`,
      instId: symbol
    }]);
  }

  terminate() {
    if (this.socket) {
      this.socket.removeAllListeners();

      if (this.isOpen()) {
        this.socket.terminate();
      }

      this.socket = undefined;
    }

    this.clearPingInterval();
    this.clearPongTimeout();
  }

  restartSocket() {
    this.terminate();
    this.emit('close');
  }

  private _onMessage(message: string) {
    if (message == 'pong') {
      this.clearPongTimeout();
      return;
    }

    const parsedMessage = JSON.parse(message);
    const {
      data,
      arg
    } = parsedMessage;

    if (isEmpty(data)) {
      return;
    }

    const argChannel = arg.channel;

    if (argChannel.includes('candle')) {
      return this._onKlineUpdated(argChannel, arg.instId, data);
    }
  }

  private _onKlineUpdated(channel: string, symbol: string, klines: any) {
    const interval = channel.replace('candle', '').toLowerCase();
    const intervalInMilis = intervalToMilis(interval);

    for (const kline of klines) {
      const closeTime = BigNumber(kline[0])
        .plus(intervalInMilis - 1)
        .toString();

      const formattedKline = {
        symbol,
        interval,
        openTime: kline[0],
        open: kline[1],
        high: kline[2],
        low: kline[3],
        close: kline[4],
        quoteVolume: kline[5],
        closeTime
      };

      this.emit('klineUpdated', formattedKline);
    }
  }

  private _initPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.socket.readyState !== WebSocket.OPEN) {
        return;
      }

      this.clearPongTimeout();
      this.socket.send('ping');
      this._initPongTimeout();
    }, PING_INTERVAL_TIME);
  }

  private _initPongTimeout() {
    this.pongTimeout = setTimeout(() => {
      this.restartSocket();
    }, PONG_TIMEOUT_TIME);
  }

  private clearPongTimeout() {
    clearTimeout(this.pongTimeout);
  }

  private clearPingInterval() {
    clearInterval(this.pingInterval);
  }

  private _parseKlineInterval(interval: string) {
    const unit = interval.substring(interval.length - 1);

    if (unit == 'm') {
      return interval;
    }

    return interval.toUpperCase();
  }

  private _sendMessage(action: any, params: any) {
    this.socket.send(
      JSON.stringify({
        op: action,
        args: params
      })
    );
  }
}

export default OKXBusinessSocketConnection;