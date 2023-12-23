import MarkdownIt from "https://esm.sh/markdown-it@13.0.1";
import { Renderer, RendererConstructor } from "./renderer.ts";

interface Options {
  html: boolean;
  linkify: boolean;
  breaks: boolean;
  plugins: string[];
  createMarkdownRenderer: (md: MarkdownIt) => MarkdownIt;
}

export const MarkdownRenderer: RendererConstructor<Options> =
  class MarkdownRenderer implements Renderer<Options> {
    #markdownIt: MarkdownIt;
    constructor(markdownIt: MarkdownIt) {
      this.#markdownIt = markdownIt;
    }
    static async create(options: Options): Promise<MarkdownRenderer> {
      let markdownIt = new MarkdownIt(options);
      const plugins = [
        ...options.plugins,
        "https://esm.sh/markdown-it-source-map",
      ];
      const modules = await Promise.all(
        plugins.map(async (plugin) => await import(plugin)),
      );
      for (const module of modules) {
        markdownIt = markdownIt.use(module.default);
      }
      markdownIt = options.createMarkdownRenderer(markdownIt);
      return new MarkdownRenderer(markdownIt);
    }
    render(text: string): Promise<string> {
      return Promise.resolve(this.#markdownIt.render(text));
    }
  };
