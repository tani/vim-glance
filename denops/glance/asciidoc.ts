import type { Asciidoctor } from "https://deno.land/x/asciidoctor@2.2.6-xhr-fix/mod.js";
// Patched version of Asciidoctor.js
import createAsciidoctor from "https://gist.githubusercontent.com/tani/37d50182f167eb2e77173b8dc7bf399d/raw/2e597799c96fea33935d569d3638563d7f8924f4/asciidoctor.js";
import { Renderer, RendererConstructor } from "./renderer.ts";

type Options = Asciidoctor.ProcessorOptions;

function SourceMap(registry: any) {
  registry.treeProcessor(function () {
    this.process(function (doc: any) {
      doc.findBy().forEach(function (block: any) {
        block.id = `data-source-line-${block.getLineNumber()}`;
      });
      return doc;
    });
  });
}

export const AsciidocRenderer: RendererConstructor<Options> =
  class AsciidocRenderer implements Renderer<Options> {
    #asciidoctor: Asciidoctor;
    #options: Options;
    constructor(asciidoctor: Asciidoctor, options: Options = {}) {
      this.#asciidoctor = asciidoctor;
      this.#options = options;
    }
    static create(options: Options): Promise<AsciidocRenderer> {
      const asciidoctor = createAsciidoctor();
      asciidoctor.Extensions.register(SourceMap);
      const renderer = new AsciidocRenderer(asciidoctor, {
        ...options,
        safe: "safe",
        sourcemap: true,
      });
      return Promise.resolve(renderer);
    }
    render(text: string): Promise<string> {
      const doc = this.#asciidoctor.load(text, this.#options);
      return Promise.resolve(doc.convert());
    }
  };
