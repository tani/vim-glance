import MarkdownIt from "https://esm.sh/markdown-it";

export class MarkdownRenderer {
  #markdownIt = new MarkdownIt();
  #preamble = "";
  async initialize(options: { plugins: string[]; preamble: string }) {
    this.#preamble = options.preamble;
    const plugins = [
      "https://esm.sh/markdown-it-source-map",
      ...options.plugins,
    ];
    const modules = await Promise.all(
      plugins.map(async (plugin) => await import(plugin)),
    );
    for (const module of modules) {
      this.#markdownIt = this.#markdownIt.use(module.default);
    }
  }
  async render(content: string) {
    return await Promise.resolve(
      this.#preamble + this.#markdownIt.render(content),
    );
  }
}
