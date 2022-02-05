import { Denops } from "https://lib.deno.dev/x/denops_std@v2/mod.ts";
import { execute } from "https://lib.deno.dev/x/denops_std@v2/helper/mod.ts";
import * as vars from "https://lib.deno.dev/x/denops_std@v2/variable/mod.ts";
import * as funs from "https://lib.deno.dev/x/denops_std@v2/function/mod.ts";
import { Server } from "./server.ts";
import { MarkdownRenderer } from "./markdown.ts";

const server = new Server();

async function update(denops: Denops, renderer: MarkdownRenderer) {
  const lines = await funs.getline(denops, 1, "$");
  const content = lines.join("\n");
  const document = await renderer.render(content);
  const pos = await funs.getpos(denops, ".");
  server.send("update", {
    document,
    line: pos[1],
  });
}

const style = `
<style>
*, *::before, *::after {
  box-sizing: border-box;
  line-height: calc(1em + 0.5rem)
  font-family: system-ui;
}
#root {
  margin: 50px auto;
  width: min(700px, 90%);
}
img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
} </style>
`;

export async function main(denops: Denops) {
  const port = (await vars.g.get(denops, "glance#server_port", 8765))!;
  const plugins = (await vars.g.get(denops, "glance#markdown_plugins", []))!;
  const html = (await vars.g.get(denops, "glance#markdown_html", false))!;
  const breaks = (await vars.g.get(denops, "glance#markdown_breaks", false))!;
  const linkify = (await vars.g.get(denops, "glance#markdown_linkify", false))!;
  const preamble = (await vars.g.get(denops, "glance#html_preamble", style))!;
  const configPath = await vars.g.get<string>(denops, "glance#config");
  let createMarkdownRenderer = (md: unknown) => md;
  if (configPath) {
    createMarkdownRenderer = (await import(configPath)).createMarkdownRenderer;
  }
  const renderer = new MarkdownRenderer();
  await renderer.initialize({ html, breaks, linkify, plugins, preamble, createMarkdownRenderer });
  denops.dispatcher = {
    update() {
      update(denops, renderer);
      return Promise.resolve();
    },
    listen() {
      server.listen({ port });
      setInterval(() => update(denops, renderer), 1000);
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
      augroup GranceBuffer
        autocmd!
        autocmd CursorMoved,CursorMovedI,TextChanged,TextChangedI,TextChangedP <buffer> call denops#notify('${denops.name}', 'update', [])
        autocmd BufUnload <buffer> call denops#notify('${denops.name}', 'close', [])
      augroup END
    endfunction
    command! Glance call s:glance()
  `;
  execute(denops, script);
}
