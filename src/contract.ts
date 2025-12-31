/**
 * NanoPy SDK Contract
 * Smart contract interaction with ABI encoding/decoding
 */

import { keccak256 } from 'js-sha3';
import { ABI, ABIFunction, ABIParameter, CallOptions, TransactionReceipt, Log } from './types';
import { Wallet } from './wallet';
import { hexToBytes, bytesToHex, numberToHex, hexToNumber } from './utils';

export class Contract {
  readonly address: string;
  readonly abi: ABI;
  private client: any; // NanoPy client
  readonly methods: Record<string, ContractMethod> = {};
  readonly events: Record<string, EventDecoder> = {};

  constructor(address: string, abi: ABI, client: any) {
    this.address = address;
    this.abi = abi;
    this.client = client;

    // Build methods from ABI
    for (const item of abi) {
      if (item.type === 'function' && item.name) {
        this.methods[item.name] = new ContractMethod(this, item);
      }
      if (item.type === 'event' && item.name) {
        this.events[item.name] = new EventDecoder(item);
      }
    }
  }

  /**
   * Call view/pure function
   */
  async call(method: string, args: any[] = [], options: CallOptions = {}): Promise<any> {
    const abiItem = this.abi.find(
      i => i.type === 'function' && i.name === method
    ) as ABIFunction;

    if (!abiItem) {
      throw new Error(`Method ${method} not found in ABI`);
    }

    const data = this.encodeCall(abiItem, args);

    const result = await this.client.rpc.ethCall({
      to: this.address,
      data,
      from: options.from,
      value: options.value ? numberToHex(BigInt(options.value)) : undefined
    });

    return this.decodeResult(abiItem, result);
  }

  /**
   * Send transaction to contract
   */
  async send(
    wallet: Wallet,
    method: string,
    args: any[] = [],
    options: CallOptions = {}
  ): Promise<TransactionReceipt> {
    const abiItem = this.abi.find(
      i => i.type === 'function' && i.name === method
    ) as ABIFunction;

    if (!abiItem) {
      throw new Error(`Method ${method} not found in ABI`);
    }

    const data = this.encodeCall(abiItem, args);

    const tx = {
      to: this.address,
      data,
      value: options.value ? numberToHex(BigInt(options.value)) : '0x0',
      gasLimit: options.gasLimit || '0x100000',
      gasPrice: options.gasPrice
    };

    return this.client.sendTransaction(wallet, tx);
  }

  /**
   * Estimate gas for method call
   */
  async estimateGas(method: string, args: any[] = [], options: CallOptions = {}): Promise<number> {
    const abiItem = this.abi.find(
      i => i.type === 'function' && i.name === method
    ) as ABIFunction;

    if (!abiItem) {
      throw new Error(`Method ${method} not found in ABI`);
    }

    const data = this.encodeCall(abiItem, args);

    const gasHex = await this.client.rpc.estimateGas({
      to: this.address,
      data,
      from: options.from,
      value: options.value ? numberToHex(BigInt(options.value)) : undefined
    });

    return hexToNumber(gasHex);
  }

  /**
   * Get past events
   */
  async getPastEvents(
    eventName: string,
    options: {
      fromBlock?: number | string;
      toBlock?: number | string;
      filter?: Record<string, any>;
    } = {}
  ): Promise<DecodedLog[]> {
    const eventAbi = this.abi.find(
      i => i.type === 'event' && i.name === eventName
    ) as ABIFunction;

    if (!eventAbi) {
      throw new Error(`Event ${eventName} not found in ABI`);
    }

    const decoder = this.events[eventName];
    const topics: (string | null)[] = [decoder.topic];

    // Add indexed parameter filters
    if (options.filter && eventAbi.inputs) {
      const indexedInputs = eventAbi.inputs.filter(i => i.indexed);
      for (const input of indexedInputs) {
        if (options.filter[input.name] !== undefined) {
          topics.push(this.encodeParameter(input.type, options.filter[input.name]));
        } else {
          topics.push(null);
        }
      }
    }

    const logs = await this.client.rpc.getLogs({
      address: this.address,
      topics,
      fromBlock: options.fromBlock,
      toBlock: options.toBlock
    });

    return logs.map((log: Log) => decoder.decode(log));
  }

  /**
   * Encode function call data
   */
  encodeCall(abiItem: ABIFunction, args: any[]): string {
    const selector = this.functionSelector(abiItem);
    const encodedArgs = Contract.encodeArguments(abiItem.inputs || [], args);
    return selector + encodedArgs;
  }

  /**
   * Get function selector (4 bytes)
   */
  functionSelector(abiItem: ABIFunction): string {
    const signature = `${abiItem.name}(${(abiItem.inputs || []).map(i => i.type).join(',')})`;
    return '0x' + keccak256(signature).slice(0, 8);
  }

  /**
   * Decode function result
   */
  decodeResult(abiItem: ABIFunction, data: string): any {
    if (!abiItem.outputs || abiItem.outputs.length === 0) {
      return null;
    }

    const decoded = Contract.decodeArguments(abiItem.outputs, data);

    if (abiItem.outputs.length === 1) {
      return decoded[0];
    }

    return decoded;
  }

  /**
   * Static method to encode constructor/function arguments
   */
  static encodeArguments(inputs: ABIParameter[], args: any[]): string {
    let result = '';

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const arg = args[i];
      result += Contract.encodeParameter(input.type, arg).slice(2);
    }

    return result;
  }

  /**
   * Static method to decode arguments from data
   */
  static decodeArguments(outputs: ABIParameter[], data: string): any[] {
    const cleanData = data.startsWith('0x') ? data.slice(2) : data;
    const results: any[] = [];
    let offset = 0;

    for (const output of outputs) {
      const [value, newOffset] = Contract.decodeParameter(output.type, cleanData, offset);
      results.push(value);
      offset = newOffset;
    }

    return results;
  }

  /**
   * Encode single parameter
   */
  private encodeParameter(type: string, value: any): string {
    return Contract.encodeParameter(type, value);
  }

  static encodeParameter(type: string, value: any): string {
    // Address
    if (type === 'address') {
      const addr = value.toLowerCase().replace('0x', '');
      return '0x' + addr.padStart(64, '0');
    }

    // Uint types
    if (type.startsWith('uint')) {
      const num = BigInt(value);
      return '0x' + num.toString(16).padStart(64, '0');
    }

    // Int types
    if (type.startsWith('int')) {
      let num = BigInt(value);
      if (num < 0) {
        num = (1n << 256n) + num;
      }
      return '0x' + num.toString(16).padStart(64, '0');
    }

    // Bool
    if (type === 'bool') {
      return '0x' + (value ? '1' : '0').padStart(64, '0');
    }

    // Bytes32
    if (type === 'bytes32') {
      const hex = value.startsWith('0x') ? value.slice(2) : value;
      return '0x' + hex.padEnd(64, '0');
    }

    // String
    if (type === 'string') {
      const bytes = new TextEncoder().encode(value);
      const length = bytes.length;
      const lengthHex = length.toString(16).padStart(64, '0');
      let dataHex = bytesToHex(bytes).slice(2);
      // Pad to 32-byte boundary
      while (dataHex.length % 64 !== 0) {
        dataHex += '0';
      }
      // For dynamic types, first word is offset, then length, then data
      return '0x' + lengthHex + dataHex;
    }

    // Bytes (dynamic)
    if (type === 'bytes') {
      const hex = value.startsWith('0x') ? value.slice(2) : value;
      const length = hex.length / 2;
      const lengthHex = length.toString(16).padStart(64, '0');
      let dataHex = hex;
      while (dataHex.length % 64 !== 0) {
        dataHex += '0';
      }
      return '0x' + lengthHex + dataHex;
    }

    throw new Error(`Unsupported type: ${type}`);
  }

  /**
   * Decode single parameter
   */
  static decodeParameter(type: string, data: string, offset: number = 0): [any, number] {
    const chunk = data.slice(offset, offset + 64);

    // Address
    if (type === 'address') {
      return ['0x' + chunk.slice(24), offset + 64];
    }

    // Uint types
    if (type.startsWith('uint')) {
      return [BigInt('0x' + chunk), offset + 64];
    }

    // Int types
    if (type.startsWith('int')) {
      let num = BigInt('0x' + chunk);
      const bits = parseInt(type.replace('int', '') || '256');
      const max = 1n << BigInt(bits - 1);
      if (num >= max) {
        num = num - (1n << BigInt(bits));
      }
      return [num, offset + 64];
    }

    // Bool
    if (type === 'bool') {
      return [chunk.slice(-1) === '1', offset + 64];
    }

    // Bytes32
    if (type === 'bytes32') {
      return ['0x' + chunk, offset + 64];
    }

    // String (dynamic)
    if (type === 'string') {
      const dataOffset = parseInt(chunk, 16) * 2;
      const length = parseInt(data.slice(dataOffset, dataOffset + 64), 16);
      const strData = data.slice(dataOffset + 64, dataOffset + 64 + length * 2);
      const bytes = hexToBytes(strData);
      return [new TextDecoder().decode(bytes), offset + 64];
    }

    throw new Error(`Unsupported type: ${type}`);
  }
}

/**
 * Contract method wrapper for fluent API
 */
export class ContractMethod {
  private contract: Contract;
  private abiItem: ABIFunction;

  constructor(contract: Contract, abiItem: ABIFunction) {
    this.contract = contract;
    this.abiItem = abiItem;
  }

  /**
   * Encode function call
   */
  encodeABI(...args: any[]): string {
    return this.contract.encodeCall(this.abiItem, args);
  }

  /**
   * Call view/pure function
   */
  async call(...args: any[]): Promise<any> {
    return this.contract.call(this.abiItem.name!, args);
  }

  /**
   * Send transaction
   */
  async send(wallet: Wallet, options: CallOptions = {}, ...args: any[]): Promise<TransactionReceipt> {
    return this.contract.send(wallet, this.abiItem.name!, args, options);
  }

  /**
   * Estimate gas
   */
  async estimateGas(...args: any[]): Promise<number> {
    return this.contract.estimateGas(this.abiItem.name!, args);
  }
}

/**
 * Event decoder
 */
export class EventDecoder {
  readonly name: string;
  readonly topic: string;
  private inputs: ABIParameter[];

  constructor(abiItem: ABIFunction) {
    this.name = abiItem.name!;
    this.inputs = abiItem.inputs || [];
    const signature = `${this.name}(${this.inputs.map(i => i.type).join(',')})`;
    this.topic = '0x' + keccak256(signature);
  }

  /**
   * Decode log to event object
   */
  decode(log: Log): DecodedLog {
    const indexedInputs = this.inputs.filter(i => i.indexed);
    const nonIndexedInputs = this.inputs.filter(i => !i.indexed);

    const args: Record<string, any> = {};

    // Decode indexed parameters from topics
    let topicIndex = 1;
    for (const input of indexedInputs) {
      if (topicIndex < log.topics.length) {
        const [value] = Contract.decodeParameter(input.type, log.topics[topicIndex].slice(2));
        args[input.name] = value;
        topicIndex++;
      }
    }

    // Decode non-indexed parameters from data
    const decoded = Contract.decodeArguments(nonIndexedInputs, log.data);
    nonIndexedInputs.forEach((input, i) => {
      args[input.name] = decoded[i];
    });

    return {
      event: this.name,
      args,
      log
    };
  }
}

export interface DecodedLog {
  event: string;
  args: Record<string, any>;
  log: Log;
}
