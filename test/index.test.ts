import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Sendim } from 'sendim';

import { SendimSendgridProvider, SendimSendgridProviderConfig } from '../src';

// const mockSend = jest.fn().mockImplementation(() => ({
//   status: 202,
//   json: async () => ({}),
// }));

jest.mock('node-fetch-native', () => ({
  fetch: jest.fn().mockImplementation(() => ({
    status: process.env.FAILED === 'true' ? 401 : 404,
    json: async () => ({}),
  })),
}));

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

    const { fetch } = require('node-fetch-native');
    expect(fetch).lastCalledWith('https://api.sendgrid.com/v3/mail/send', {
      body: '{"from":{"email":"test@test.fr"},"subject":"test","personalizations":[{"to":[{"email":"test1@test.fr"},{"email":"test2@test.fr"}]}],"content":[{"value":"test","type":"text/plain"},{"value":"<p>test</p>","type":"text/html"}]}',
      headers: {
        Authorization: 'Bearer undefined',
        'Content-Type': 'application/json',
      },
      method: 'POST',
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

    const { fetch } = require('node-fetch-native');
    expect(fetch).lastCalledWith('https://api.sendgrid.com/v3/mail/send', {
      body: '{"from":{"email":"test@test.fr"},"personalizations":[{"to":[{"email":"test1@test.fr"},{"email":"test2@test.fr"}]}],"template_id":"6"}',
      headers: {
        Authorization: 'Bearer undefined',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
  });
});
