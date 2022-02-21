import { Denops } from "https://lib.deno.dev/x/denops_std@v3/mod.ts";
import { execute } from "https://lib.deno.dev/x/denops_std@v3/helper/mod.ts";
import { g } from "https://lib.deno.dev/x/denops_std@v3/variable/mod.ts";
import * as fn from "https://lib.deno.dev/x/denops_std@v3/function/mod.ts";
import { join } from "https://lib.deno.dev/std/path/mod.ts";
import { Server } from "./server.ts";
import { MarkdownRenderer } from "./markdown.ts";

export async function main(denops: Denops) {
  async function readFile(path: string) {
    const dir = await fn.expand(denops, "%:p:h") as string;
    return Deno.readFile(join(dir, path));
  }

  async function update() {
    const lines = await fn.getline(denops, 1, "$");
    const content = lines.join("\n");
    const document = await renderer.render(content);
    const pos = await fn.getpos(denops, ".");
    server.send("update", { document, line: pos[1] });
  }
  const port = (await g.get(denops, "glance#server_port", 8765))!;
  const plugins = (await g.get(denops, "glance#markdown_plugins", []))!;
  const html = (await g.get(denops, "glance#markdown_html", false))!;
  const breaks = (await g.get(denops, "glance#markdown_breaks", false))!;
  const linkify = (await g.get(denops, "glance#markdown_linkify", false))!;
  const defaultStylesheet = `#root {margin: 50px auto; width: min(700px, 90%);}`;
  const stylesheet = (await g.get(denops, "glance#stylesheet", defaultStylesheet))!;
  const defaultConfigPath = new URL("./config.ts", import.meta.url).toString();
  const configPath = (await g.get(denops, "glance#config", defaultConfigPath))!;
  const { createMarkdownRenderer } = await import(configPath);
  const renderer = new MarkdownRenderer();
  await renderer.initialize({ html, breaks, linkify, plugins, createMarkdownRenderer });
  const server = new Server({ onOpen: update, readFile, stylesheet });

  denops.dispatcher = {
    update() {
      update();
      return Promise.resolve();
    },
    listen() {
      server.listen({ port });
      return Promise.resolve();
    },
    close() {
      server.close();
      return Promise.resolve();
    },
  };
}
