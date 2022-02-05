import MarkdownIt from "https://esm.sh/markdown-it@12";

interface Options {
  html: boolean;
  linkify: boolean;
  breaks: boolean;
  plugins: string[];
  createMarkdownRenderer: (md: MarkdownIt) => MarkdownIt;
}

export class MarkdownRenderer {
  #markdownIt: MarkdownIt | undefined;
  async initialize(options: Options) {
    let markdownIt = new MarkdownIt({
      options,
    });
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
    this.#markdownIt = options.createMarkdownRenderer(markdownIt);
  }
  render(content: string) {
    return Promise.resolve(this.#markdownIt.render(content));
  }
}
