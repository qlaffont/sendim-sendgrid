# sendim-sendgrid

A simple library to send email with Sendim for SendGrid.

## Attachments Warning

- Attachment content should be sent as base64

## Usage

```typescript
import { Sendim } from 'sendim';
import { SendimSendgridProviderConfig, SendimSendgridProvider } from 'sendim-sendgrid';

const sendim = new Sendim();

await sendim.addTransport<SendimSendgridProviderConfig>(
  SendimSendgridProvider,
  { apiKey: process.env.SENDGRID_APIKEY! },
);

await sendim.sendTransactionalMail({
  templateId: '6',
  to: [
    {
      email: 'test@test.fr',
    },
  ],
  sender: {
    email: 'test@test.fr',
  },
});
```

## Tests

To execute jest tests (all errors, type integrity test)

```
pnpm test
```

## Maintain

This package use [TSdx](https://github.com/jaredpalmer/tsdx). Please check documentation to update this package.
