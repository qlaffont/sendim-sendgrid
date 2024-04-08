import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Sendim } from 'sendim';

import { SendimSendgridProvider, SendimSendgridProviderConfig } from '../src';

const mockSend = jest.fn().mockImplementation(() => {
  return [
    {
      statusCode: 202,
    },
  ];
});

jest.mock('node-fetch', () =>
  jest.fn().mockImplementation(() => ({
    status: process.env.FAILED === 'true' ? 401 : 404,
  })),
);

jest.mock('@sendgrid/mail');
const sendgrid = require('@sendgrid/mail');
sendgrid.send = mockSend;

describe('Sendim Sendgrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be Defined', () => {
    expect(Sendim).toBeDefined();
  });

  it('should be able to define log', () => {
    expect(new Sendim('debug')).toBeDefined();
  });

  it('should be able to add transport', async () => {
    const sendim = new Sendim();

    try {
      process.env.FAILED = 'true';
      await sendim.addTransport<SendimSendgridProviderConfig>(
        SendimSendgridProvider,
        { apiKey: '' },
      );
    } catch (error) {
      expect(sendim).toBeDefined();
      expect(sendim.transports).toBeDefined();
      expect(Object.keys(sendim.transports)).toHaveLength(0);
    }

    process.env.FAILED = 'false';
    await sendim.addTransport<SendimSendgridProviderConfig>(
      SendimSendgridProvider,
      { apiKey: process.env.SENDGRID_APIKEY! },
    );

    expect(sendim).toBeDefined();
    expect(sendim.transports).toBeDefined();
    expect(Object.keys(sendim.transports)).toHaveLength(1);
  });

  it('should be able to send raw email', async () => {
    const sendim = new Sendim('debug');

    await sendim.addTransport<SendimSendgridProviderConfig>(
      SendimSendgridProvider,
      { apiKey: process.env.SENDGRID_APIKEY! },
    );

    await sendim.sendRawMail({
      textContent: 'test',
      htmlContent: '<p>test</p>',
      subject: 'test',
      to: [
        {
          email: 'test1@test.fr',
        },
        {
          email: 'test2@test.fr',
        },
      ],
      sender: {
        email: 'test@test.fr',
      },
    });

    expect(mockSend).toBeCalledWith({
      attachments: [],
      html: '<p>test</p>',
      from: 'test@test.fr',
      subject: 'test',
      text: 'test',
      to: ['test1@test.fr', 'test2@test.fr'],
      bcc: undefined,
      cc: undefined,
      replyTo: undefined,
    });
  });

  it('should be able to send transactional email', async () => {
    const sendim = new Sendim('debug');

    await sendim.addTransport<SendimSendgridProviderConfig>(
      SendimSendgridProvider,
      { apiKey: process.env.SENDGRID_APIKEY! },
    );

    await sendim.sendTransactionalMail({
      templateId: '6',
      to: [
        {
          email: 'test1@test.fr',
        },
        {
          email: 'test2@test.fr',
        },
      ],
      sender: {
        email: 'test@test.fr',
      },
      params: {
        TEST: 'testParam',
      },
    });

    expect(mockSend).toBeCalledWith({
      from: 'test@test.fr',
      bcc: undefined,
      cc: undefined,
      replyTo: undefined,
      templateId: '6',
      dynamicTemplateData: {
        TEST: 'testParam',
      },
      to: ['test1@test.fr', 'test2@test.fr'],
      attachments: [],
    });
  });
});
