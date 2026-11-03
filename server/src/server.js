import app from './app.js';
import { recoverPendingImports } from './services/materialService.js';

const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer from 1 to 65535.');
  process.exitCode = 1;
} else {
  try {
    await recoverPendingImports();
  } catch {
    console.error('Material cleanup recovery failed. Check Supabase credentials, migrations, and Storage before restarting.');
    process.exit(1);
  }
  app.listen(port, '0.0.0.0', (error) => {
    if (error) {
      console.error(`Unable to start API: ${error.message}`);
      process.exitCode = 1;
      return;
    }

    console.log(`API listening on port ${port}`);
  });
}
