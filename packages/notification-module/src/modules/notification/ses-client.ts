import {
  CreateEmailIdentityCommand,
  GetEmailIdentityCommand,
  SendEmailCommand,
  SESv2Client,
  type VerificationStatus,
} from "@aws-sdk/client-sesv2"
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts"

import type { DomainDnsRecords, SesDomainStatus } from "./types"

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

export type CreateEmailIdentityResult = {
  identityArn: string
  records: DomainDnsRecords
}

export type GetEmailIdentityResult = {
  verificationStatus: SesDomainStatus
  records: DomainDnsRecords
}

export interface ISESClient {
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>
  createEmailIdentity(domain: string): Promise<CreateEmailIdentityResult>
  getEmailIdentity(domain: string): Promise<GetEmailIdentityResult>
}

const SPF_RECORD_VALUE = "v=spf1 include:amazonses.com ~all"

export function buildDkimRecords(domain: string, tokens: string[]): DomainDnsRecords["dkim"] {
  return tokens.map((token) => ({
    type: "CNAME" as const,
    name: `${token}._domainkey.${domain}`,
    value: `${token}.dkim.amazonses.com`,
  }))
}

export function buildDomainDnsRecords(domain: string, tokens: string[]): DomainDnsRecords {
  return {
    dkim: buildDkimRecords(domain, tokens),
    spf: {
      type: "TXT",
      name: domain,
      value: SPF_RECORD_VALUE,
    },
  }
}

export function mapSesVerificationStatus(status: VerificationStatus | undefined): SesDomainStatus {
  switch (status) {
    case "SUCCESS":
      return "verified"
    case "FAILED":
    case "TEMPORARY_FAILURE":
      return "failed"
    case "PENDING":
    case "NOT_STARTED":
    default:
      return "pending"
  }
}

export function buildSesIdentityArn(region: string, accountId: string, domain: string): string {
  return `arn:aws:ses:${region}:${accountId}:identity/${domain}`
}

type AwsSesConfig = {
  region: string
  accessKeyId?: string
  secretAccessKey?: string
}

function resolveAwsSesConfig(): AwsSesConfig {
  const region = process.env.AWS_REGION?.trim()
  if (region === undefined || region === "") {
    throw new Error("AWS_REGION is required for SES domain identity operations")
  }

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim()

  return {
    region,
    accessKeyId: accessKeyId === "" ? undefined : accessKeyId,
    secretAccessKey: secretAccessKey === "" ? undefined : secretAccessKey,
  }
}

function buildAwsCredentials(config: AwsSesConfig): { accessKeyId: string; secretAccessKey: string } | undefined {
  if (config.accessKeyId !== undefined && config.secretAccessKey !== undefined) {
    return {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    }
  }
  return undefined
}

export class AwsSESClient implements ISESClient {
  private readonly sesClient_: SESv2Client
  private readonly stsClient_: STSClient
  private readonly region_: string
  private accountId_: string | null = null

  constructor(config?: AwsSesConfig) {
    const resolved = config ?? resolveAwsSesConfig()
    this.region_ = resolved.region
    const credentials = buildAwsCredentials(resolved)
    this.sesClient_ = new SESv2Client({ region: resolved.region, credentials })
    this.stsClient_ = new STSClient({ region: resolved.region, credentials })
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const response = await this.sesClient_.send(
      new SendEmailCommand({
        FromEmailAddress: params.from,
        Destination: {
          ToAddresses: [params.to],
        },
        ReplyToAddresses:
          params.replyTo !== null && params.replyTo !== undefined && params.replyTo !== ""
            ? [params.replyTo]
            : undefined,
        Content: {
          Simple: {
            Subject: {
              Data: params.subject,
              Charset: "UTF-8",
            },
            Body: {
              Html: {
                Data: params.html,
                Charset: "UTF-8",
              },
            },
          },
        },
      })
    )

    const messageId = response.MessageId?.trim()
    if (messageId === undefined || messageId === "") {
      throw new Error("SES sendEmail did not return a MessageId")
    }

    return { messageId }
  }

  private async resolveAccountId(): Promise<string> {
    if (this.accountId_ !== null) {
      return this.accountId_
    }

    const fromEnv = process.env.AWS_ACCOUNT_ID?.trim()
    if (fromEnv !== undefined && fromEnv !== "") {
      this.accountId_ = fromEnv
      return fromEnv
    }

    const response = await this.stsClient_.send(new GetCallerIdentityCommand({}))
    const accountId = response.Account?.trim()
    if (accountId === undefined || accountId === "") {
      throw new Error("Unable to resolve AWS account ID for SES identity ARN")
    }
    this.accountId_ = accountId
    return accountId
  }

  async createEmailIdentity(domain: string): Promise<CreateEmailIdentityResult> {
    const response = await this.sesClient_.send(
      new CreateEmailIdentityCommand({
        EmailIdentity: domain,
      })
    )

    const tokens = response.DkimAttributes?.Tokens ?? []
    if (tokens.length === 0) {
      const existing = await this.getEmailIdentity(domain)
      const accountId = await this.resolveAccountId()
      return {
        identityArn: buildSesIdentityArn(this.region_, accountId, domain),
        records: existing.records,
      }
    }

    const accountId = await this.resolveAccountId()
    return {
      identityArn: buildSesIdentityArn(this.region_, accountId, domain),
      records: buildDomainDnsRecords(domain, tokens),
    }
  }

  async getEmailIdentity(domain: string): Promise<GetEmailIdentityResult> {
    const response = await this.sesClient_.send(
      new GetEmailIdentityCommand({
        EmailIdentity: domain,
      })
    )

    const tokens = response.DkimAttributes?.Tokens ?? []
    return {
      verificationStatus: mapSesVerificationStatus(response.VerificationStatus),
      records: buildDomainDnsRecords(domain, tokens),
    }
  }
}

export class StubSESClient implements ISESClient {
  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    void params
    return {
      messageId: `stub-${Date.now()}`,
    }
  }

  async createEmailIdentity(domain: string): Promise<CreateEmailIdentityResult> {
    const tokens = ["stubtoken1", "stubtoken2", "stubtoken3"]
    return {
      identityArn: `arn:aws:ses:eu-north-1:000000000000:identity/${domain}`,
      records: buildDomainDnsRecords(domain, tokens),
    }
  }

  async getEmailIdentity(domain: string): Promise<GetEmailIdentityResult> {
    const tokens = ["stubtoken1", "stubtoken2", "stubtoken3"]
    return {
      verificationStatus: "pending",
      records: buildDomainDnsRecords(domain, tokens),
    }
  }
}

export function createSESClientFromEnv(): ISESClient {
  const hasAwsRegion = (process.env.AWS_REGION?.trim() ?? "") !== ""
  if (hasAwsRegion) {
    return new AwsSESClient()
  }
  return new StubSESClient()
}

export function createSESClientFromEnv(): ISESClient {
  return new StubSESClient()
}
