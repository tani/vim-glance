import MarkdownIt from "https://esm.sh/markdown-it";

interface Options {
  html: boolean;
  linkify: boolean;
  breaks: boolean;
  plugins: string[];
  preamble: string;
}

export class MarkdownRenderer {
  #markdownIt: MarkdownIt | undefined;
  #preamble = "";
  async initialize(options: Options) {
    this.#preamble = options.preamble;
    let markdownIt = new MarkdownIt({
      options,
    });
    const plugins = [
      "https://esm.sh/markdown-it-source-map",
      ...options.plugins,
    ];
    const modules = await Promise.all(
      plugins.map(async (plugin) => await import(plugin)),
    );
    for (const module of modules) {
      markdownIt = markdownIt.use(module.default);
    }
    this.#markdownIt = markdownIt;
  }
  async render(content: string) {
    return await Promise.resolve(
      this.#preamble + this.#markdownIt.render(content),
    );
  }
}
