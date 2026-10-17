import app from './app.js';

const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer from 1 to 65535.');
  process.exitCode = 1;
} else {
  app.listen(port, '0.0.0.0', (error) => {
    if (error) {
      console.error(`Unable to start API: ${error.message}`);
      process.exitCode = 1;
      return;
    }

    console.log(`API listening on port ${port}`);
  });
}
