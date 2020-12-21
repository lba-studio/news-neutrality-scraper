import { logger } from "./logger.util";

export interface BufferedRequest<RequestT, ResultT> {
  data: RequestT;
  onDone: (result: ResultT) => void;
  onError: (e: any) => void;
}

abstract class BufferedService<RequestT, ResultT> {
  private timeoutToken: ReturnType<typeof setTimeout> | undefined;
  private batchBuffer: Array<BufferedRequest<RequestT, ResultT>>;
  private clearTimeoutToken() {
    if (this.timeoutToken) {
      clearTimeout(this.timeoutToken);
      this.timeoutToken = undefined;
    }
  }

  constructor(
    private maxBatchBufferSize: number,
    private waitMsBeforeSending: number,
    private requestQuotaPerSecond: number
  ) {
    this.batchBuffer = [];
  }

  protected getRequestFromRequestList(
    requestList: Array<BufferedRequest<RequestT, ResultT>>,
    index?: number
  ): BufferedRequest<RequestT, ResultT> {
    if (index === undefined) {
      throw new Error("Index is undefined.");
    }
    const docRequest = requestList[index];
    if (!docRequest) {
      throw new Error("Missing docRequest!");
    }
    return docRequest;
  }

  protected async dispatch() {
    const requestList = this.batchBuffer.slice(0, this.maxBatchBufferSize);
    this.batchBuffer = this.batchBuffer.slice(this.maxBatchBufferSize);
    if (this.batchBuffer.length) {
      this.timeoutToken = setTimeout(
        () => this.dispatch(),
        1000 / this.requestQuotaPerSecond
      );
    }
    if (!requestList.length) {
      logger.debug("Empty requestList. Skipping!");
      return;
    }
    try {
      await this.processRequest(requestList);
    } catch (e) {
      logger.error(e);
      requestList.forEach((request) => request.onError(e));
    }
  }

  protected abstract processRequest(
    requestList: Array<BufferedRequest<RequestT, ResultT>>
  ): Promise<void> | void;

  protected async sendForProcessing(
    request: BufferedRequest<RequestT, ResultT>
  ) {
    this.clearTimeoutToken();
    this.batchBuffer.push(request);
    if (this.timeoutToken === undefined) {
      this.timeoutToken = setTimeout(() => {
        this.dispatch();
      }, this.waitMsBeforeSending);
    }
  }
}

export default BufferedService;
