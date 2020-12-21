import comprehend from "../clients/comprehend.client";
import BufferedService, { BufferedRequest } from "../utils/BufferedService";
import weakTrim from "../utils/weakTrim";

export interface KeyPhraseScore {
  text: string;
  score: number;
}

const WAIT_MS_BEFORE_SENDING = 100;
const MAX_BATCH_BUFFER_SIZE = 25;
const COMPREHEND_QUOTA_PER_SECOND = 10;
const MAX_CHAR_LIMIT = 2000;

class KeyPhrasesService extends BufferedService<string, Array<KeyPhraseScore>> {
  constructor() {
    super(
      MAX_BATCH_BUFFER_SIZE,
      WAIT_MS_BEFORE_SENDING,
      COMPREHEND_QUOTA_PER_SECOND
    );
  }
  protected async processRequest(
    requestList: BufferedRequest<string, Array<KeyPhraseScore>>[]
  ): Promise<void> {
    const result = await comprehend
      .batchDetectKeyPhrases({
        LanguageCode: "en",
        TextList: requestList.map((e) => e.data),
      })
      .promise();
    result.ResultList.forEach((e) => {
      const docRequest = this.getRequestFromRequestList(requestList, e.Index);
      const keyPhraseScores: Array<KeyPhraseScore> =
        e.KeyPhrases?.map((phrase) => {
          if (!phrase.Text || !phrase.Score) {
            throw new Error(
              "Missing text or score from batchDetectKeyPhrases."
            );
          }
          return {
            text: phrase.Text,
            score: phrase.Score,
          };
        }) || [];
      docRequest.onDone(keyPhraseScores);
    });
    result.ErrorList.forEach((e) => {
      const docRequest = this.getRequestFromRequestList(requestList, e.Index);
      docRequest.onError(e);
    });
  }
  async getKeyPhraseScores(text: string): Promise<Array<KeyPhraseScore>> {
    const textToAnalyze = weakTrim(text, MAX_CHAR_LIMIT);
    return new Promise((res, rej) =>
      this.sendForProcessing({
        data: textToAnalyze,
        onDone: res,
        onError: rej,
      })
    );
  }
}

const keyPhrasesService = new KeyPhrasesService();

export default keyPhrasesService;
