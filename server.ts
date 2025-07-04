import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
const dev = process.env.NODE_ENV !== 'production';
const app = next({ 
  dev,
  // Add this to disable error overlay
  conf: {
    devIndicators: {
      buildActivity: false,
      appIsrStatus: false,
    }
  }
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req: any, res: any) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });


  server.listen(3000, (err?: any) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});