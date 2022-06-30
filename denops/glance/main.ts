import { Denops } from "https://lib.deno.dev/x/denops_std@v3/mod.ts";
import { g } from "https://lib.deno.dev/x/denops_std@v3/variable/mod.ts";
import * as fn from "https://lib.deno.dev/x/denops_std@v3/function/mod.ts";
import { join } from "https://lib.deno.dev/std/path/mod.ts";
import { Server } from "./server.ts";
import { MarkdownRenderer } from "./markdown.ts";

type Options = {
  port: number;
  plugins: string[];
  html: boolean;
  breaks: boolean;
  linkify: boolean;
  stylesheet: string;
  configPath: string;
};

export async function main(denops: Denops) {
  let options: Options | undefined;
  let renderer: MarkdownRenderer | undefined;
  let server: Server | undefined;

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
    renderer = await ensureRenderer();
    server = await ensureServer();
    const lines = await fn.getline(denops, 1, "$");
    const content = lines.join("\n");
    const document = await renderer.render(content);
    const pos = await fn.getpos(denops, ".");
    server.send("update", { document, line: pos[1] });
  }

  async function ensureOptions() {
    if (options) return options;
    const defaultStylesheet = "#root {margin: 50px auto; width: min(700px, 90%);}";
    const defaultConfigPath = new URL("./config.ts", import.meta.url).toString();
    options = {
      port: await g.get(denops, "glance#server_port", 8765),
      plugins: await g.get(denops, "glance#markdown_plugins", []),
      html: await g.get(denops, "glance#markdown_html", false),
      breaks: await g.get(denops, "glance#markdown_breaks", false),
      linkify: await g.get(denops, "glance#markdown_linkify", false),
      stylesheet: await g.get(denops, "glance#stylesheet", defaultStylesheet),
      configPath: await g.get(denops, "glance#config", defaultConfigPath),
    };
    return options;
  }

  async function ensureRenderer() {
    if (renderer) return renderer;
    options = await ensureOptions();
    const { createMarkdownRenderer } = await import(options.configPath);
    renderer = new MarkdownRenderer();
    const { html, breaks, linkify, plugins } = options;
    await renderer.initialize({ html, breaks, linkify, plugins, createMarkdownRenderer });
    return renderer;
  }

  async function ensureServer() {
    if (server) return server;
    options = await ensureOptions();
    server = new Server({ onOpen: update, readFile, stylesheet: options.stylesheet });
    return server;
  }

  denops.dispatcher = {
    update() {
      update();
      return Promise.resolve();
    },
    async listen() {
      options = await ensureOptions();
      server = await ensureServer();
      server.listen({ port: options.port });
    },
    close() {
      server?.close();
      return Promise.resolve();
    },
  };
}
