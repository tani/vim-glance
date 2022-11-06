import { Application, FlashServer, Router } from "https://lib.deno.dev/x/oak@v11/mod.ts";

interface Options {
  onOpen: () => void;
  readFile: (path: string) => Promise<Uint8Array | null>;
  stylesheet: string;
}

export class Server {
  #sockets: WebSocket[] = [];
  #controller = new AbortController();
  #app: Application | undefined;

  constructor(options: Options) {
    const router = new Router()
      .get("/", async ({ response }) => {
        response.redirect("/html");
      })
      .get("/html", async ({ response }) => {
        const url = new URL("./index.html", import.meta.url);
        response.status = 200;
        response.headers.set("Content-Type", "text/html");
        response.body = await Deno.readTextFile(url);
      })
      .get("/ws", (context) => {
        if (!context.isUpgradable) {
          context.throw(501);
        }
        const socket = context.upgrade();
        this.#sockets.push(socket);
        queueMicrotask(options.onOpen);
      })
      .get("/css", async ({ response }) => {
        response.status = 200;
        response.headers.set("Content-Type", "text/css");
        response.body = options.stylesheet;
      })
      .get("/js", async ({ response }) => {
        response.status = 200;
        response.headers.set("Content-Type", "text/javascript");
        const url = new URL("./script.js", import.meta.url);
        response.body = await Deno.readTextFile(url);
      })
      .get("/:file", async ({ request, response, params }) => {
        const contentType = request.headers.get("Content-Type") ?? "text/plain";
        response.headers.set("Content-Type", contentType);
        response.body = await options.readFile(params.file);
        response.status = response.body === null ? 404 : 200;
      });

    const app = new Application({ serverConstructor: FlashServer });
    app.use(router.routes());
    app.use(router.allowedMethods());

    this.#app = app;
  }
  close() {
    this.#controller.abort();
  }
  listen(options: Deno.ListenOptions) {
    this.#app?.listen({ ...options, signal: this.#controller.signal });
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
