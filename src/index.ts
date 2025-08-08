import httpBooksProvider from "./providers/books.ts";
import { createServer } from "./server/config/server.ts";
import { config } from "./server/config/environment.ts";

const PORT = config.port;

const booksProvider = httpBooksProvider();
const app = createServer(booksProvider);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app };
