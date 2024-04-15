import MessageQueue from '../../../libs/MessageQueue';
import { type ApiConfig } from '../../../libs/RequestConfig';
import BaseWS from '../BaseWS';
import { AccountType, CategoryType } from '../Consts';
import { type AccountResponseData, type OrderResponseData } from '../ResponseData';
import BybitSpotAPI from './API';

class BybitSpotWSClient extends BaseWS {
  private readonly exchangeApi: any;
  private readonly orderMessageQueue: any;
  private readonly orderMessageInterval: any;

  constructor (apiConfig: ApiConfig = {}) {
    super(apiConfig);

    this.exchangeApi = new BybitSpotAPI(apiConfig);

    // Because we have to get order fees via API, handling order message is became async,
    // so we have to treat order message as a message queue and handle it one by one
    this.orderMessageQueue = new MessageQueue();
    this.orderMessageInterval = setInterval(() => {
      this.handleOrderMessage();
    }, 100);
  }

  protected async onOrderUpdated (orders: OrderResponseData[]) {
    const filteredOrders = orders.filter((order) => {
      return order.category == CategoryType.SPOT;
    });

    this.orderMessageQueue.enqueue(filteredOrders);
  }

  protected onBalanceUpdated (accounts: AccountResponseData[]) {
    const contractAccount = accounts.find((account) => {
      return account.accountType == AccountType.UNIFIED;
    });

    if (!contractAccount) {
      return;
    }

    const formattedBalances = contractAccount.coin.map((balance) => {
      return {
        asset: balance.coin,
        availableBalance: balance.availableToWithdraw,
        balance: balance.walletBalance
      };
    });

    this.emit('balanceUpdated', formattedBalances);
  }

  protected async handleOrderMessage () {
    if (
      this.orderMessageQueue.isEmpty() ||
      this.orderMessageQueue.isProcessing()
    ) {
      return;
    }

    this.orderMessageQueue.start();

    const nextOrder = this.orderMessageQueue.dequeue();

    try {
      const formattedOrder = await this.exchangeApi.formatExchangeOrder(
        nextOrder
      );
      this.emit('orderUpdated', formattedOrder);
    } catch (error) {
      // TODO: send error notification
    } finally {
      this.orderMessageQueue.finish();
    }
  }

  protected getPublicUrl (): string {
    return 'wss://stream.bybit.com/v5/public/spot';
  }
}

export default BybitSpotWSClient;
