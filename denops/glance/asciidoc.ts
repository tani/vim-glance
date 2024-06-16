import { Renderer, RendererConstructor } from "./renderer.ts";
import { Asciidoctor, wasmURL } from "npm:asciidoctor-wasm@0.2023.19/dist/browser.js"
import type { AsciidoctorOptions } from "npm:asciidoctor-wasm@0.2023.19/dist/browser.js"

export const AsciidocRenderer: RendererConstructor<AsciidoctorOptions> =
  class AsciidocRenderer implements Renderer<AsciidoctorOptions> {
    #asciidoctor: Asciidoctor;
    #options: AsciidoctorOptions;
    constructor(asciidoctor: Asciidoctor, options: AsciidoctorOptions = {}) {
      this.#asciidoctor = asciidoctor;
      this.#options = { ...options, safe: "safe", sourcemap: true };
 }
    static async create(options: AsciidoctorOptions): Promise<AsciidocRenderer> {
      const adoc = await Asciidoctor.initFromURL(wasmURL);
      adoc.code = `
        require 'asciidoctor'
        require 'asciidoctor/extensions'
        require 'js'
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
        lambda do |js_content, js_options|
          options = {}
          js_options_str = JS.global[:JSON].stringify(js_options).to_s
          for key, value in JSON.parse(js_options_str)
            options[key.to_sym] = value
          end
          content = js_content.to_s
          Asciidoctor.convert(content, options)
        end
      `;
      return new AsciidocRenderer(adoc, options);
    }
    render(text: string): Promise<string> {
      return this.#asciidoctor.convert(text, this.#options);
    }
  };
