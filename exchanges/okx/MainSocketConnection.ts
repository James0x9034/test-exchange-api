import {
  Method
} from 'axios';
import * as EventEmiiter from 'events';
import {
  ApiConfig
} from '../../libs/RequestConfig';
import {
  isEmpty
} from 'lodash';
import * as CryptoJS from 'crypto-js';
import {
  CURRENCY_USDT,
  ExchangeMode,
  OrderbookType
} from '../../libs/Consts';
import {
  WebSocket
} from 'ws';

const PUBLIC_WS_URL = 'wss://ws.okx.com:8443/ws/v5/public';
const PRIVATE_WS_URL = 'wss://ws.okx.com:8443/ws/v5/private';
const PING_INTERVAL_TIME = 15000;
const PONG_TIMEOUT_TIME = 10000;

class OKXMainSocketConnection extends EventEmiiter {
  private readonly apiConfig: ApiConfig;
  private socket: any;
  private pingInterval: any;
  private pongTimeout: any;

  constructor(apiConfig: ApiConfig = {}) {
    super();

    this.apiConfig = apiConfig;

    this.socket = undefined;
    this.pingInterval = undefined;
    this.pongTimeout = undefined;
  }

  isOpen() {
    return this.socket?.readyState == WebSocket.OPEN;
  }

  async initConnection() {
    let wsUrl = PUBLIC_WS_URL;

    if (!isEmpty(this.apiConfig)) {
      wsUrl = PRIVATE_WS_URL;
    }

    this.socket = new WebSocket(wsUrl);

    this.socket.on('open', () => {
      this._onOpen();
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

  subscribePriceChannels(symbols: string[]) {
    const formattedChannels = symbols.map(symbol => {
      return {
        channel: 'trades',
        instId: symbol
      };
    });

    this._sendMessage('subscribe', formattedChannels);
  }

  subscribeOrderbookChannels(symbols: string[], level: number) {
    const formattedChannels = symbols.map(symbol => {
      return {
        channel: `books${level}`,
        instId: symbol
      };
    });

    this._sendMessage('subscribe', formattedChannels);
  }

  subscribePriceChannel(symbol: string) {
    this._sendMessage('subscribe', [{
      channel: 'trades',
      instId: symbol
    }]);
  }

  subscribeOrderbookChannel(symbol: string, level: number) {
    this._sendMessage('subscribe', [{
      channel: `books${level}`,
      instId: symbol
    }]);
  }

  subscribeOrderChannel(instType: string) {
    this._sendMessage('subscribe', [{
      channel: 'orders',
      instType
    }]);
  }

  subscribeBalanceChannel() {
    this._sendMessage('subscribe', [{
      channel: 'account',
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

    this._clearPingInterval();
    this._clearPongTimeout();
  }

  restartSocket() {
    this.terminate();
    this.emit('close');
  }

  private _initPingInterval() {
    this.pingInterval = setInterval(() => {
      this._clearPongTimeout();
      this.socket.send('ping');
      this._initPongTimeout();
    }, PING_INTERVAL_TIME);
  }

  private _initPongTimeout() {
    this.pongTimeout = setTimeout(() => {
      this.restartSocket();
    }, PONG_TIMEOUT_TIME);
  }

  private _onOpen() {
    this._authenticationIfNeed();
    this._initPingInterval();
    this.emit('open');
  }

  private _onMessage(message: string) {
    if (message == 'pong') {
      this._clearPongTimeout();
      return;
    }

    const parsedMessage = JSON.parse(message);
    const {
      event,
      code,
      data,
      arg
    } = parsedMessage;

    if (event == 'login') {
      return this.emit('authenticated', code);
    }

    if (isEmpty(data)) {
      return;
    }

    const argChannel = arg.channel;

    if (argChannel == 'trades') {
      this._onTradeUpdated(data);
      return;
    }

    if (argChannel.includes('books')) {
      this._onOrderbookUpdated(data, arg.instId);
      return;
    }

    if (argChannel == 'orders') {
      return this.emit('orderUpdated', data, arg.instType);
    }

    if (argChannel == 'account') {
      this._onBalanceUpdated(data);
    }
  }

  private _onTradeUpdated(trades: any) {
    for (const trade of trades) {
      const formattedTrade = {
        symbol: trade.instId,
        price: trade.px,
        timestamp: trade.ts
      };

      this.emit('priceUpdated', formattedTrade);
    }
  }

  private _onOrderbookUpdated(
    orderbooks: any,
    symbol: string
  ) {
    for (const orderbook of orderbooks) {
      const formattedOrderbook = {
        symbol,
        bids: this._formatOrderbook(orderbook.bids),
        asks: this._formatOrderbook(orderbook.asks),
        type: OrderbookType.SNAPSHOT,
        updatedAt: orderbook.ts,
        mode: ExchangeMode.Future
      };

      this.emit('orderbookUpdated', formattedOrderbook);
    }
  }

  private _onBalanceUpdated(account: any) {
    const balances = account[0].details;
    const formattedBalances = balances.filter(balance => {
      return balance.ccy == CURRENCY_USDT;
    }).map((balance: any) => {
      return {
        asset: balance.ccy,
        balance: balance.cashBal,
        availableBalance: balance.availBal,
        usdtBalance: balance.cashBal
      };
    });

    this.emit('balanceUpdated', formattedBalances);
  }

  private _authenticationIfNeed() {
    if (isEmpty(this.apiConfig)) {
      return;
    }

    const timestamp = Date.now() / 1000;
    const params = {
      apiKey: this.apiConfig.apiKey,
      passphrase: this.apiConfig.passphrase,
      timestamp,
      sign: this._generateSign('GET', '/users/self/verify', timestamp)
    };

    this._sendMessage('login', [params]);
  }

  private _generateSign(method: Method, path: string, timestamp: number) {
    const signStr = `${timestamp}${method}${path}`;
    const hmacHex = CryptoJS.HmacSHA256(signStr, this.apiConfig.apiSecret);

    return CryptoJS.enc.Base64.stringify(hmacHex);
  }

  private _formatOrderbook(orderbook: any) {
    return orderbook.map((item: any) => {
      return {
        price: item[0],
        quantity: item[1]
      };
    });
  }

  private _sendMessage(action: any, params: any) {
    this.socket.send(
      JSON.stringify({
        op: action,
        args: params
      })
    );
  }

  private _clearPingInterval() {
    clearInterval(this.pingInterval);
  }

  private _clearPongTimeout() {
    clearTimeout(this.pongTimeout);
  }
}

export default OKXMainSocketConnection;