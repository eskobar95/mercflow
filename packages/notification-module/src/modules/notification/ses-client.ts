export type SendEmailParams = {
  from: string
  to: string
  subject: string
  html: string
  replyTo?: string | null
}

export type SendEmailResult = {
  messageId: string
}

export interface ISESClient {
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>
}

export class StubSESClient implements ISESClient {
  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    void params
    return {
      messageId: `stub-${Date.now()}`,
    }
  }
}
