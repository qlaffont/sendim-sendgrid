import { classes } from '@sendgrid/helpers';
import { MailData } from '@sendgrid/helpers/classes/mail';
const { Mail } = classes;
import fetch from 'node-fetch-native';
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
  apiKey: string;

  constructor(public config: SendimSendgridProviderConfig) {
    this.config = config;
    this.apiKey = this.config.apiKey;
  }

  async isHealthy() {
    const response = await fetch('https://api.sendgrid.com/v3/resource', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
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

    return this.send({
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

    return this.send({
      from: rawSender.email,
      to: this.parseMultipleEmail(rawTo),
      cc: this.parseMultipleEmail(rawCc),
      bcc: this.parseMultipleEmail(rawBcc),
      templateId,
      dynamicTemplateData: params,
      attachments,
      replyTo: reply,
    });
  }

  private parseMultipleEmail = (emailInfo?: EmailInfo) =>
    emailInfo?.map((info) => info.email);

  private async send(datas: MailData) {
    const mail = Mail.create(datas);
    const json = mail.toJSON();

    const request = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(json),
    });

    if (request.status < 200 && request.status > 299) {
      throw new Error(request.body?.toString());
    }

    return request.json();
  }
}
