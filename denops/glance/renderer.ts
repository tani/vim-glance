export interface Renderer<Options> {
  render: (text: string) => Promise<string>;
}

export interface RendererConstructor<Options> {
  create: (options: Options) => Promise<Renderer<Options>>;
  new (...args: any[]): Renderer<Options>;
}
