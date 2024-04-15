import { head } from 'lodash';

class MessageQueue {
  private messages: any[];
  private processing: boolean;

  constructor() {
    this.messages = [];
    this.processing = false;
  }

  enqueue(messages: any) {
    this.messages.push(...messages);
  }

  latestMessage() {
    return head(this.messages);
  }

  dequeue() {
    return this.messages.shift();
  }

  isEmpty() {
    return !this.messages.length;
  }

  start() {
    this.processing = true;
  }

  finish() {
    this.processing = false;
  }

  isProcessing() {
    return this.processing;
  }
}

export default MessageQueue;
