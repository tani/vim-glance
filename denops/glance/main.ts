import { Denops } from "https://deno.land/x/denops_std@v6.5.1/mod.ts";
import { g, o } from "https://deno.land/x/denops_std@v6.5.1/variable/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.5.1/function/mod.ts";
import { collect } from "https://deno.land/x/denops_std@v6.5.1/batch/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v6.5.1/helper/mod.ts";
import { open } from "https://deno.land/x/open@v1.0.0/index.ts";
import { memoizy } from "npm:memoizy@1.2.3";
import { join } from "jsr:@std/path@1.0.8";
import { Server } from "./server.ts";
import { MarkdownRenderer } from "./markdown.ts";
import { AsciidocRenderer } from "./asciidoc.ts";
import { PodiumRenderer } from "./pod.ts";
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
    const [lines, pos] = await collect(denops, (denops) => [
      fn.getline(denops, 1, "$"),
      fn.getpos(denops, "."),
    ]) as [string[], fn.Position];
    const content = lines.join("\n");
    const filetype = await o.get(denops, "filetype", "none");
    if (filetype == "markdown") {
      const document = await renderer.markdown.render(content);
      server.send("update", { document, line: pos[1] });
    } else if (filetype == "asciidoc") {
      const document = await renderer.asciidoc.render(content);
      server.send("update", { document, line: pos[1] });
    } else if (filetype == "pod") {
      const document = await renderer.pod.render(content);
      server.send("update", { document, line: pos[1] });
    }
  }

  const ensureOptions = memoizy(async () => {
    const defaultStylesheet = `
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    img, picture, video, canvas, svg {
      display: block;
      max-width: 100%;
    }
    input, button, textarea, select {
      font: inherit;
    }
    p, h1, h2, h3, h4, h5, h6 {
      overflow-wrap: break-word;
    }
    #root {
      isolation: isolate;
      margin: 50px auto;
      width: min(700px, 90%);
    }
    `;
    const defaultConfigPath = new URL("./config.ts", import.meta.url)
      .toString();
    const [
      hostname,
      port,
      open,
      silent,
      markdown_plugins,
      markdown_html,
      markdown_breaks,
      markdown_linkify,
      stylesheet,
      configPath,
    ] = await collect(denops, (denops) => [
      g.get(denops, "glance#server_hostname", "127.0.0.1"),
      g.get(denops, "glance#server_port", 8765),
      g.get(denops, "glance#server_open", true),
      g.get(denops, "glance#server_silent", false),
      g.get(denops, "glance#markdown_plugins", []),
      g.get(denops, "glance#markdown_html", false),
      g.get(denops, "glance#markdown_breaks", false),
      g.get(denops, "glance#markdown_linkify", false),
      g.get(denops, "glance#stylesheet", defaultStylesheet),
      g.get(denops, "glance#config", defaultConfigPath),
    ]);
    return {
      hostname,
      port,
      open,
      silent,
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
    const pod = await PodiumRenderer.create({ denops });
    return { markdown, asciidoc, pod };
  });

  const ensureServer = memoizy(async () => {
    const options = await ensureOptions();
    const server = new Server({
      onOpen: update,
      readFile,
      stylesheet: options.stylesheet,
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
        port: options.port,
        onListen: (addr: Deno.NetAddr) => {
          if (!options.silent) {
            const message = `[glance] Server listening on http://${addr.hostname}:${addr.port}`;
            helper.echo(denops, message);
          }
        },
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
