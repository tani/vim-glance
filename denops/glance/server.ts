import { Hono } from "jsr:@hono/hono@4.4.4";

interface Options {
  onOpen: () => void;
  readFile: (path: string) => Promise<Uint8Array | null>;
  stylesheet: string;
}

export class Server {
  #sockets: WebSocket[] = [];
  #controller = new AbortController();
  #app: Hono | undefined = undefined;

  constructor(options: Options) {
    const app = new Hono();
    app.get("/", (c) => {
      return c.redirect("/html");
    });
    app.get("/html", (c) => {
      try {
        const url = new URL("./index.html", import.meta.url);
        const body = Deno.readTextFileSync(url);
        c.status(200);
        return c.html(body);
      } catch {
        c.status(404);
        return c.text("File not found");
      }
    });
    app.get("/ws", (c) => {
      const { response, socket } = Deno.upgradeWebSocket(c.req.raw);
      this.#sockets.push(socket);
      return response;
    });
    app.get("/css", (c) => {
      c.header("Content-Type", "text/css");
      return c.body(options.stylesheet);
    });
    app.get("/js", async (c) => {
      try {
        const url = new URL("./script.js", import.meta.url);
        const body = await Deno.readTextFile(url);
        c.header("Content-Type", "text/javascript");
        c.status(200);
        return c.body(body);
      } catch {
        c.status(404);
        return c.text("File not found");
      }
    });
    app.get("/:file", async (c) => {
      try {
        const body = await Deno.readFile(c.req.param("file"));
        const contentType = c.req.header("Content-Type") ?? "text/plain";
        c.header("Content-Type", contentType);
        c.status(200);
        return c.body(body);
      } catch {
        c.status(404);
        return c.text("File not found");
      }
    });

    this.#app = app;
  }
  close() {
    this.#controller.abort();
  }
  listen(options: Deno.ListenOptions) {
    Deno.serve({ ...options, signal: this.#controller.signal }, this.#app?.fetch!);
  }
  send(type: string, payload: unknown) {
    for (const socket of this.#sockets) {
      try {
        socket.send(JSON.stringify({ type, payload }));
      } catch {
        console.log("[glance] A socket has been closed");
        this.#sockets = this.#sockets.filter((it) => it !== socket);
      }
    }
  }
}
