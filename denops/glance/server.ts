import { App, createApp } from "https://lib.deno.dev/x/servest@v1/mod.ts";
import { lookup } from "https://esm.sh/mime-types";

interface Options {
  onOpen: () => void;
}

export class Server {
  #sockets: WebSocket[] = [];
  #listener: Deno.Closer | undefined;
  #app: App | undefined;
  constructor(options: Options) {
    const app = createApp();

    app.ws("/", (req) => {
      const socket: WebSocket = req as any;
      this.#sockets.push(socket);
      setTimeout(options.onOpen, 1000);
    });

    app.get(/^\/(.*)/, async (req) => {
      const status = 200;
      const contentType = lookup(req.match[1]) || "text/plain";
      const headers = new Headers({ "Content-Type": contentType });
      const url = new URL(`./${req.match[1]}`, import.meta.url);
      const body = await Deno.readTextFile(url);
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
