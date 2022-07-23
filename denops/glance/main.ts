import { Denops } from "https://lib.deno.dev/x/denops_std@v3/mod.ts";
import { g } from "https://lib.deno.dev/x/denops_std@v3/variable/mod.ts";
import * as fn from "https://lib.deno.dev/x/denops_std@v3/function/mod.ts";
import * as batch from "https://lib.deno.dev/x/denops_std@v3/batch/mod.ts";
import { open } from "https://lib.deno.dev/x/open@v0.0.5/index.ts";
import { join } from "https://lib.deno.dev/std/path/mod.ts";
import { Server } from "./server.ts";
import { MarkdownRenderer } from "./markdown.ts";

type Options = {
  hostname: string;
  port: number;
  open: boolean;
  plugins: string[];
  html: boolean;
  breaks: boolean;
  linkify: boolean;
  stylesheet: string;
  configPath: string;
};

export async function main(denops: Denops) {
  async function readFile(path: string): Promise<Uint8Array | null> {
    const dir = await fn.expand(denops, "%:p:h") as string;
    try {
      return await Deno.readFile(join(dir, path));
    } catch (error: unknown) {
      if (error instanceof Deno.errors.NotFound) {
        return null;
      }
      throw error;
    }
  }

  async function update() {
    const renderer = await ensureRenderer();
    const server = await ensureServer();
    const [lines, pos] = await batch.gather(denops, async (denops) => {
      await fn.getline(denops, 1, "$");
      await fn.getpos(denops, ".");
    }) as [string[], fn.Position];
    const content = lines.join("\n");
    const document = await renderer.render(content);
    server.send("update", { document, line: pos[1] });
  }

  let _options: Promise<Options> | undefined;
  async function ensureOptions() {
    if (_options) return await _options;
    const defaultStylesheet = "#root {margin: 50px auto; width: min(700px, 90%);}";
    const defaultConfigPath = new URL("./config.ts", import.meta.url).toString();
    _options = (async () => {
      const [
        hostname,
        port,
        open,
        plugins,
        html,
        breaks,
        linkify,
        stylesheet,
        configPath,
      ] = await batch.gather(denops, async (denops) => {
        await g.get(denops, "glance#server_hostname", "127.0.0.1");
        await g.get(denops, "glance#server_port", 8765);
        await g.get(denops, "glance#server_open", true);
        await g.get(denops, "glance#markdown_plugins", []);
        await g.get(denops, "glance#markdown_html", false);
        await g.get(denops, "glance#markdown_breaks", false);
        await g.get(denops, "glance#markdown_linkify", false);
        await g.get(denops, "glance#stylesheet", defaultStylesheet);
        await g.get(denops, "glance#config", defaultConfigPath);
      }) as [
        string,
        number,
        boolean,
        string[],
        boolean,
        boolean,
        boolean,
        string,
        string,
      ];
      return {
        hostname,
        port,
        open,
        plugins,
        html,
        breaks,
        linkify,
        stylesheet,
        configPath,
      };
    })();
    return await _options;
  }

  let _renderer: Promise<MarkdownRenderer> | undefined;
  async function ensureRenderer() {
    if (_renderer) return await _renderer;
    _renderer = (async () => {
      const options = await ensureOptions();
      const { createMarkdownRenderer } = await import(options.configPath);
      const renderer = new MarkdownRenderer();
      const { html, breaks, linkify, plugins } = options;
      await renderer.initialize({ html, breaks, linkify, plugins, createMarkdownRenderer });
      return renderer;
    })();
    return await _renderer;
  }

  let _server: Promise<Server> | undefined;
  async function ensureServer() {
    if (_server) return await _server;
    _server = (async () => {
      const options = await ensureOptions();
      const server = new Server({ onOpen: update, readFile, stylesheet: options.stylesheet });
      return server;
    })();
    return await _server;
  }

  denops.dispatcher = {
    update() {
      update();
      return Promise.resolve();
    },
    async listen() {
      const options = await ensureOptions();
      const server = await ensureServer();
      server.listen({ hostname: options.hostname, port: options.port });
      if (options.open) {
        await open(`http://localhost:${options.port}`, {
          background: true,
        });
      }
    },
    async close() {
      const server = await ensureServer();
      server?.close();
    },
  };

  // To accelerate startup, call ensureXXXXX in background
  ensureOptions().catch((e) => console.error("[glance] Failed to load options", e));
  ensureRenderer().catch((e) => console.error("[glance] Failed to load renderer", e));
  ensureServer().catch((e) => console.error("[glance] Failed to load server", e));
}
