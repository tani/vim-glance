import { Renderer, RendererConstructor } from "./renderer.ts";
import { Denops } from "https://lib.deno.dev/x/denops_std@v5/mod.ts";

type Options = {
  denops: Denops;
}

export const PodiumRenderer: RendererConstructor<Options> =
  class PodiumRenderer implements Renderer<Options> {
    #denops: Denops;
    constructor(opts: Options) {
      this.#denops = opts.denops;
    }
    static create(opts: Options): Promise<PodiumRenderer> {
      return Promise.resolve(new PodiumRenderer(opts));
    }
    render(text: string): Promise<string> {
      return this.#denops.call('luaeval', `require("podium_html")([====[${text}]====])`) as Promise<string>;
    }
  }
