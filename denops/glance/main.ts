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

export async function main(denops: Denops) {
  const port = await vars.g.get<number>(denops, "glance#port") ?? 8080;
  const plugins = await vars.g.get<string[]>(denops, "glance#plugins");
  const html = await vars.g.get<boolean>(denops, "glance#html");
  const breaks = await vars.g.get<boolean>(denops, "glance#breaks");
  const linkify = await vars.g.get<boolean>(denops, "glance#linkify");
  const stylePath = new URL("./style.css", import.meta.url);
  const stylesheet = await Deno.readTextFile(stylePath);
  const defaultPreamble = `<style>${stylesheet}</style>`;
  const preamble = await vars.g.get<string>(denops, "glance#preamble");
  const renderer = new MarkdownRenderer();
  await renderer.initialize({
    html: html ?? false,
    breaks: breaks ?? false,
    linkify: linkify ?? false,
    plugins: plugins ?? [],
    preamble: preamble ?? defaultPreamble,
  });
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
    function s:setup_glance()
      call denops#notify('${denops.name}', 'listen', [])
      augroup GranceBuffer
        autocmd!
        autocmd CursorMoved,CursorMovedI,TextChanged,TextChangedI,TextChangedP <buffer> call denops#notify('${denops.name}', 'update', [])
        autocmd BufUnload <buffer> call denops#notify('${denops.name}', 'close', [])
      augroup END
    endfunction

    augroup GranceGlobal
      autocmd!
      autocmd FileType markdown call s:setup_grance()
    augroup END

    if &filetype == 'markdown'
      call s:setup_glance()
    endif
  `;
  execute(denops, script);
}
