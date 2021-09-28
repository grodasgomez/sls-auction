import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpErrorHandler from '@middy/http-error-handler';

export default handler => middy(handler)
  .use([
    httpJsonBodyParser(), //Will automatically parse our string from event.body
    httpEventNormalizer(), // Reduce the room for errors, making always accessible event api objects such as query parameters or path parameters
    httpErrorHandler() // Helps us to manager errors smoothly
  ]);