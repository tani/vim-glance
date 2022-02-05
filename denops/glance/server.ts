import { App, createApp } from "https://lib.deno.dev/x/servest@v1/mod.ts";
import { lookup } from "https://esm.sh/mime-types@2";

interface Options {
  onOpen: () => void;
  readFile: (path: string) => Promise<Uint8Array>;
  stylesheet: string;
}

export class Server {
  #sockets: WebSocket[] = [];
  #listener: Deno.Closer | undefined;
  #app: App | undefined;
  constructor(options: Options) {
    const app = createApp();

    app.get("/", async (req) => {
      req.redirect("/html");
    });

    app.get("/html", async (req) => {
      const status = 200;
      const headers = new Headers({ "Content-Type": "text/html" });
      const url = new URL("./index.html", import.meta.url);
      const body = await Deno.readTextFile(url);
      await req.respond({ status, headers, body });
    });

    app.ws("/ws", (req) => {
      const socket: WebSocket = req as any;
      this.#sockets.push(socket);
      setTimeout(options.onOpen, 1000);
    });

    app.get("/css", async (req) => {
      const status = 200;
      const headers = new Headers({ "Content-Type": "text/css" });
      const body = options.stylesheet;
      await req.respond({ status, headers, body });
    });

    app.get(/^\/(.+)/, async (req) => {
      const status = 200;
      const contentType = lookup(req.match[1]) || "text/plain";
      const headers = new Headers({ "Content-Type": contentType });
      const body = await options.readFile(req.match[1]);
      await req.respond({ status, headers, body });
    });

    this.#app = app;
  }
  close() {
    this.#listener?.close();
  }
  listen(options: Deno.ListenOptions) {
    if (!this.#listener) {
      this.#listener = this.#app?.listen(options);
    }
  }
  send(type: string, payload: unknown) {
    for (const socket of this.#sockets) {
      socket.send(JSON.stringify({ type, payload }));
    }
  }
}
