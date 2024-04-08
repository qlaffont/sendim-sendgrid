import sgMail from '@sendgrid/mail';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import fetch from 'node-fetch';
import {
  RawMailOptions,
  SendimTransportInterface,
  TransactionalMailOptions,
} from 'sendim';

type EmailInfo = TransactionalMailOptions['to'];

interface AttachmentData {
  content: string;
  filename: string;
  type?: string;
  disposition?: string;
  contentId?: string;
}

export interface SendimSendgridProviderConfig {
  apiKey: string;
}
export class SendimSendgridProvider implements SendimTransportInterface {
  providerName = 'sendgrid';
  api: typeof sgMail;

  constructor(public config: SendimSendgridProviderConfig) {
    this.config = config;
    this.api = sgMail;
    this.api.setApiKey(this.config.apiKey);
  }

  async isHealthy() {
    const response = await fetch('https://api.sendgrid.com/v3/resource', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
      },
    });

    return response.status === 404;
  }

  async sendRawMail({
    attachments: rawAttachments,
    sender: rawSender,
    to: rawTo,
    cc: rawCc,
    bcc: rawBcc,
    subject,
    htmlContent,
    textContent,
    reply,
  }: RawMailOptions) {
    const attachments: AttachmentData[] =
      rawAttachments?.map((item) => ({
        contentType: item.contentType,
        content: item.content,
        filename: item.name,
        disposition: 'attachment',
        content_id: item.name,
      })) || [];

    const send = await this.api.send({
      from: rawSender.email,
      to: this.parseMultipleEmail(rawTo),
      subject: subject,
      html: htmlContent,
      text: textContent,
      cc: this.parseMultipleEmail(rawCc),
      bcc: this.parseMultipleEmail(rawBcc),
      attachments,
      replyTo: reply,
    });

    if (send[0].statusCode < 200 && send[0].statusCode > 299) {
      throw new Error(send[0].body.toString());
    }
  }

  async sendTransactionalMail(transacMailOptions: TransactionalMailOptions) {
    const {
      attachments: rawAttachments,
      sender: rawSender,
      to: rawTo,
      cc: rawCc,
      bcc: rawBcc,
      templateId,
      params,
      reply,
    } = transacMailOptions;

    const attachments: AttachmentData[] =
      rawAttachments?.map((item) => ({
        contentType: item.contentType,
        content: item.content,
        filename: item.name,
        disposition: 'attachment',
        content_id: item.name,
      })) || [];

    const send = await this.api.send({
      from: rawSender.email,
      to: this.parseMultipleEmail(rawTo),
      cc: this.parseMultipleEmail(rawCc),
      bcc: this.parseMultipleEmail(rawBcc),
      templateId,
      dynamicTemplateData: params,
      attachments,
      replyTo: reply,
    });

    if (send[0].statusCode < 200 && send[0].statusCode > 299) {
      throw new Error(send[0].body.toString());
    }
  }

  private parseMultipleEmail = (emailInfo?: EmailInfo) =>
    emailInfo?.map((info) => info.email);
}
