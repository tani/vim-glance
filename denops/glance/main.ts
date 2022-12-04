import { Denops } from "https://lib.deno.dev/x/denops_std@v3/mod.ts";
import { g, o } from "https://lib.deno.dev/x/denops_std@v3/variable/mod.ts";
import * as fn from "https://lib.deno.dev/x/denops_std@v3/function/mod.ts";
import * as batch from "https://lib.deno.dev/x/denops_std@v3/batch/mod.ts";
import { open } from "https://lib.deno.dev/x/open@v0.0.5/index.ts";
import memoizy from "https://lib.deno.dev/x/memoizy@v1/mod.ts";
import { join } from "https://lib.deno.dev/std/path/mod.ts";
import { Server } from "./server.ts";
import { MarkdownRenderer } from "./markdown.ts";
import { AsciidocRenderer } from "./asciidoc.ts";
import { Renderer } from "./renderer.ts";

interface Renderers {
  [key: string]: Renderer<any>;
}

type Options = {
  hostname: string;
  port: number;
  open: boolean;
  markdown_plugins: string[];
  markdown_html: boolean;
  markdown_breaks: boolean;
  markdown_linkify: boolean;
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
    const renderer = await ensureRenderers();
    const server = await ensureServer();
    const [lines, pos] = await batch.gather(denops, async (denops) => {
      await fn.getline(denops, 1, "$");
      await fn.getpos(denops, ".");
    }) as [string[], fn.Position];
    const content = lines.join("\n");
    const filetype = await o.get(denops, "filetype", "none")
    if (filetype == "markdown") {
      const document = await renderer.markdown.render(content);
      server.send("update", { document, line: pos[1] });
    } else if (filetype == "asciidoc") {
      const document = await renderer.asciidoc.render(content);
      server.send("update", { document, line: pos[1] });
    }
  }

  const ensureOptions = memoizy(async () => {
    const defaultStylesheet = "#root {margin: 50px auto; width: min(700px, 90%);}";
    const defaultConfigPath = new URL("./config.ts", import.meta.url).toString();
    const [
      hostname,
      port,
      open,
      markdown_plugins,
      markdown_html,
      markdown_breaks,
      markdown_linkify,
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
      markdown_plugins,
      markdown_html,
      markdown_breaks,
      markdown_linkify,
      stylesheet,
      configPath,
    };
  });

  const ensureRenderers = memoizy(async (): Promise<Renderers> => {
    const options = await ensureOptions();
    const { createMarkdownRenderer } = await import(options.configPath);
    const markdown = await MarkdownRenderer.create({
      html: options.markdown_html,
      breaks: options.markdown_breaks,
      linkify: options.markdown_linkify,
      plugins: options.markdown_plugins,
      createMarkdownRenderer,
    });
    const asciidoc = await AsciidocRenderer.create({});
    return { markdown, asciidoc };
  });

  const ensureServer = memoizy(async () => {
    const options = await ensureOptions();
    const server = new Server({
      onOpen: update,
      readFile,
      stylesheet: options.stylesheet
    });
    return server;
  });

  denops.dispatcher = {
    update() {
      update();
      return Promise.resolve();
    },
    async listen() {
      const options = await ensureOptions();
      const server = await ensureServer();
      server.listen({
        hostname: options.hostname,
        port: options.port
      });
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
  // ensureOptions().catch((e) => console.error("[glance] Failed to load options", e));
  // ensureRenderers().catch((e) => console.error("[glance] Failed to load renderer", e));
  // ensureServer().catch((e) => console.error("[glance] Failed to load server", e));
}
