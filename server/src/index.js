import { config } from './config.js';
import { createAppServer } from './app.js';

const server = createAppServer();

server.listen(config.port, config.host, () => {
  console.log(`DataComPredia server listening on http://${config.host}:${config.port}`);
});
