import { createHmac } from 'crypto';
import { camelCase, mapKeys } from 'lodash';
import moment = require('moment');
import * as momentTz from 'moment-timezone';
import * as uuid from 'uuid';
import { HTTP_ERROR } from './Consts';
import {
  AxiosError,
  Method
} from 'axios';
import {
  ExchangeError,
  InvalidOrder
} from './Error';
import {
  ExchangeErrorResponse,
  FormattedOrderbook
} from './ResponseConfig';

export function formatOrderbook (orderbook: any): FormattedOrderbook[] {
  return orderbook.map((item) => {
    return {
      price: item[0],
      quantity: item[1]
    };
  });
}

export function handleHttpError(error: AxiosError) {
  throwMatchedException(
    HTTP_ERROR,
    `${error.response?.status}`,
    `${error.response?.statusText}`
  );
}

export function millisecondsToDateTime(time: number, format = 'YYYY-MM-DD HH:mm:ss') {
  return moment(time).utc().format(format);
}

export function serializeParams(
  params: any,
  method: Method,
  strict_validation = false
): string {
  if (!params) {
    return '';
  }

  if (method !== 'GET') {
    return JSON.stringify(params);
  }

  const queryString = Object.keys(params)
    .map((key) => {
      const value = params[key];
      if (strict_validation === true && typeof value === 'undefined') {
        throw new Error(
          'Failed to sign API request due to undefined parameter'
        );
      }
      return `${key}=${value}`;
    })
    .join('&');

  // Prevent trailing `?` if no params are provided
  return queryString ? '?' + queryString : queryString;
}

export function getErrorInstance(error: ExchangeErrorResponse, exchangeException: any) {
  const {
    code,
    msg
  } = error;

  if (code && exchangeException[code]) {
    return new exchangeException[code](msg || code);
  }

  if (msg && exchangeException[msg]) {
    return new exchangeException[msg](msg);
  }

  return new InvalidOrder(msg || code);
}

export function throwMatchedException(
  exchangeException: any,
  error: string | number,
  message: string,
  continueCheckError = false
) {
  if (exchangeException[error]) {
    throw new exchangeException[error](message ? message : error);
  }

  if (!continueCheckError) {
    throw new ExchangeError(`${error}`);
  }
}

export function encodeHmac(
  str: string,
  secret: string,
  algo: string = 'sha256'
): string {
  return createHmac(algo, secret).update(str).digest('hex');
}

export function dateToTimestamp(date: Date): string {
  return moment(date).format('x');
}

export function dateToTimestampUTC(date: Date): string {
  return momentTz.tz(date, 'UTC').format('x');
}

export function isStableCoin(coin: string): boolean {
  return ['USDT', 'BUSD', 'TUSD', 'USDC', 'DAI'].includes(coin);
}

export function intervalToSec(interval: string): number {
  const unit = interval.substring(interval.length - 1);
  const num = +interval.substring(0, interval.length - 1);

  switch (unit) {
    case 'm':
      return num * 60;
    case 'h':
      return num * 60 * 60;
    case 'd':
      return num * 24 * 60 * 60;
  }

  return 0;
}

export function intervalToMilis(interval: string): number {
  const intervalInSec = intervalToSec(interval);

  return intervalInSec * 1000;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

export function getTimeRanges(
  interval: string,
  fromTime: number,
  toTime: number,
  limit: number
): { startTime: number; endTime: number }[] {
  const intervalInMilis = intervalToMilis(interval);
  let startTime = fromTime;
  const timeParts = Math.ceil((toTime - fromTime) / (intervalInMilis * limit));
  const timeRanges: { startTime: number; endTime: number }[] = [];

  for (let i = 1; i <= timeParts; i++) {
    let nextEndTime = startTime + intervalInMilis * limit;

    if (nextEndTime > toTime) {
      nextEndTime = toTime;
    }

    timeRanges.push({
      startTime,
      endTime: nextEndTime
    });

    startTime = nextEndTime;
  }

  return timeRanges;
}

export function mergeObjectArrayByKey(
  incomingArr: any,
  sourceArr: any,
  comparedKey: string,
  updatedKey: string
): any {
  for (const item of incomingArr) {
    const existItem = sourceArr.find(function (sourceItem: any) {
      return sourceItem[comparedKey] == item[comparedKey];
    });

    if (existItem) {
      existItem[updatedKey] = item[updatedKey];
      continue;
    }

    sourceArr.push(item);
  }

  return sourceArr;
}

export function randomString(length: number): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let str = '';

  for (let i = 0; i < length; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return str;
}

export function camelCaseObjectKey(
  obj: Record<string, any>
): Record<string, any> {
  return mapKeys(obj, function (value, key) {
    return camelCase(key);
  });
}

export function generateUUID(): string {
  return uuid.v4();
}

export function handlePromiseResults(results: any[], method: string) {
  const rejectedResults = results.filter(item => {
    return item.status === 'rejected';
  });

  for (const result of rejectedResults) {
    throw result.reason;
  }
}
