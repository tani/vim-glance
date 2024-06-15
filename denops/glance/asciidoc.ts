import { Renderer, RendererConstructor } from "./renderer.ts";
import * as Asciidoctor from "npm:asciidoctor-wasm@0.2023.15/dist/browser.js"

type Options = Record<string | number | symbol, never>;

export const AsciidocRenderer: RendererConstructor<Options> =
  class AsciidocRenderer implements Renderer<Options> {
    #asciidoctor: Asciidoctor.Asciidoctor;
    constructor(asciidoctor: Asciidoctor.Asciidoctor) {
      this.#asciidoctor = asciidoctor;
    }
    static async create(_options: Options): Promise<AsciidocRenderer> {
      const adoc = await Asciidoctor.initFromURL(Asciidoctor.wasmURL);
      return new AsciidocRenderer(adoc);
    }
    async render(text: string): Promise<string> {
      const convert_rb = await this.#asciidoctor.vm.evalAsync(`
        require 'asciidoctor'
        require 'asciidoctor/extensions'
        require 'json'
        class SourceMapProcessor < Asciidoctor::Extensions::TreeProcessor
          def process(document)
            document.find_by.each do |block|
              block.id = "data-source-line-#{block.lineno}"
            end
            document
          end
        end
        Asciidoctor::Extensions.register do
          tree_processor SourceMapProcessor
        end
        lambda do |content|
          Asciidoctor.convert(content.to_s, safe: :safe, sourcemap: true)
        end
      `)
      const result = await convert_rb.callAsync("call", this.#asciidoctor.vm.wrap(text));
      return result.toString();
    }
  };
