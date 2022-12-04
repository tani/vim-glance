import type { Asciidoctor } from "https://lib.deno.dev/x/asciidoctor@2.2.6-xhr-fix/mod.js";
import createAsciidoctor from "https://lib.deno.dev/x/asciidoctor@2.2.6-xhr-fix/mod.js";
import { Renderer, RendererConstructor } from "./renderer.ts";

type Options = Asciidoctor.ProcessorOptions;

export const AsciidocRenderer: RendererConstructor<Options> = 
  class AsciidocRenderer implements Renderer<Options> {
    #asciidoctor: Asciidoctor;
    #options: Options;
    constructor(asciidoctor: Asciidoctor, options: Options = {}) {
      this.#asciidoctor = asciidoctor;
      this.#options = options;
    }
    static create(options: Options): Promise<AsciidocRenderer> {
      const asciidoctor = createAsciidoctor()
      const renderer = new AsciidocRenderer(asciidoctor, {
        ...options,
        safe: "safe",
        sourcemap: true
      });
      return Promise.resolve(renderer);
    }
    render(text: string): Promise<string> {
      const doc = this.#asciidoctor.load(text, this.#options);
      return Promise.resolve(doc.convert());
    }
  }
