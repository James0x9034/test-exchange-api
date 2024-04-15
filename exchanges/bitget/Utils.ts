import { type Method } from 'axios';
import { createHmac } from 'crypto';
import { isEmpty } from 'lodash';
import * as querystring from 'querystring';

export function parseJsonString (obj: object) {
  if (isEmpty(obj)) {
    return;
  }

  let json = JSON.stringify(obj);

  Object.keys(obj)
    .filter((key) => key[0] === '_')
    .forEach((key) => {
      json = json.replace(key, key.substring(1));
    });

  const reg = new RegExp('"_', 'g');

  return json.replace(reg, '"');
}

export function encryptSignature (
  method: Method,
  url: string,
  params: any,
  timestamp: number,
  secret: string
) {
  const httpMethod = method.toUpperCase();
  const paramsStr = !isEmpty(params)
    ? httpMethod === 'GET'
      ? `?${querystring.stringify(params)}`
      : module.exports.parseJsonString(params)
    : '';
  const preHash = String(timestamp) + httpMethod + url + paramsStr;
  const hashMac = createHmac('sha256', secret);
  const preHashToMacBuffer = hashMac.update(preHash).digest();

  return preHashToMacBuffer.toString('base64');
}

export function isJsonString (str: string) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }

  return true;
}
