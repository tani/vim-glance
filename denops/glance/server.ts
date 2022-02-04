import { createApp } from "https://lib.deno.dev/x/servest@v1/mod.ts";
import { lookup } from "https://esm.sh/mime-types";

export class Server {
  #socket: WebSocket | undefined;
  #listener: Deno.Closer | undefined;
  #app = createApp();
  constructor() {
    this.#app.ws("/", (req) => {
      this.#socket = req as any;
    });

    this.#app.get(/^\/(.*)/, async (req) => {
      const status = 200;
      const headers = new Headers({
        "Content-Type": lookup(req.match[1]) || "text/plain",
      });
      const body = await Deno.readTextFile(
        new URL(`./${req.match[1]}`, import.meta.url),
      );
      await req.respond({ status, headers, body });
    });
  }
  close() {
    this.#listener?.close();
  }
  listen(options: Deno.ListenOptions) {
    this.#listener = this.#app.listen(options);
  }
  send(type: string, payload: unknown) {
    this.#socket?.send(JSON.stringify({ type, payload }));
  }
}
