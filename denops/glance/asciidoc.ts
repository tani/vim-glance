import createAsciidoctor from "npm:@asciidoctor/core@3.0.4";
import type { Asciidoctor, ProcessorOptions } from "npm:@asciidoctor/core@3.0.4";
import { Renderer, RendererConstructor } from "./renderer.ts";

type Options = ProcessorOptions;

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
      asciidoctor.Extensions.register(SourceMap as any);
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
