import { Denops } from "https://lib.deno.dev/x/denops_std@v2/mod.ts";
import { execute } from "https://lib.deno.dev/x/denops_std@v2/helper/mod.ts";
import * as vars from "https://lib.deno.dev/x/denops_std@v2/variable/mod.ts";
import * as funs from "https://lib.deno.dev/x/denops_std@v2/function/mod.ts";
import { Server } from "./server.ts";
import { MarkdownRenderer } from "./markdown.ts";
import MarkdownIt from "https://esm.sh/markdown-it";

const style = `
<style>
#root {
  margin: 50px auto;
  width: min(700px, 90%);
}
</style>
`;

async function update(denops: Denops, renderer: MarkdownIt, server: Server) {
  const lines = await funs.getline(denops, 1, "$");
  const content = lines.join("\n");
  const document = await renderer.render(content);
  const pos = await funs.getpos(denops, ".");
  server.send("update", { document, line: pos[1] });
}

export async function main(denops: Denops) {
  const onOpen = () => update(denops, renderer, server);
  const server = new Server({ onOpen });
  const port = (await vars.g.get(denops, "glance#server_port", 8765))!;
  const plugins = (await vars.g.get(denops, "glance#markdown_plugins", []))!;
  const html = (await vars.g.get(denops, "glance#markdown_html", false))!;
  const breaks = (await vars.g.get(denops, "glance#markdown_breaks", false))!;
  const linkify = (await vars.g.get(denops, "glance#markdown_linkify", false))!;
  const preamble = (await vars.g.get(denops, "glance#html_preamble", style))!;
  const defaultConfigPath = new URL("./config.ts", import.meta.url).toString();
  const configPath = (await vars.g.get<string>(denops, "glance#config", defaultConfigPath))!;
  const config = await import(configPath);
  const createMarkdownRenderer = config.createMarkdownRenderer;
  const renderer = new MarkdownRenderer();
  await renderer.initialize({ html, breaks, linkify, plugins, preamble, createMarkdownRenderer });

  denops.dispatcher = {
    update() {
      update(denops, renderer, server);
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
  const script = `
    function s:glance()
      call denops#notify('${denops.name}', 'listen', [])
      augroup Grance
        autocmd!
        autocmd TextChanged,TextChangedI,TextChangedP <buffer> call denops#notify('${denops.name}', 'update', [])
        autocmd CursorMoved,CursorMovedI <buffer> call denops#notify('${denops.name}', 'update', [])
        autocmd BufUnload <buffer> call denops#notify('${denops.name}', 'close', [])
      augroup END
    endfunction
    command! Glance call s:glance()
  `;
  execute(denops, script);
}
