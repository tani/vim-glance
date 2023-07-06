# vim-glance

![](https://user-images.githubusercontent.com/5019902/152632510-6c2081f1-213f-4123-9739-bd1fd6e2c765.png)

**UPDATE:** The glance-vim now supports Asciidoc and POD file types. You can preview these file types within the vim editor by typing `:Glance` in a buffer that houses these specific file types.

The plugin offers a customization mechanism for rendering documents using markdown-it plugins.
If you desire to use emojis within your markdown, you can simply append `markdown-it-emoji` plugin URL to the `g:glance#plugins` as shown below:

```vim
let g:glance#markdown_plugins = ['https://esm.sh/markdown-it-emoji']
```

The above plugin is loaded dynamically within Deno, consequently rendering the buffer content with _markdown-it_. The rendered content is subsequently dispatched as an HTML document to your browser.

Glance Vim offers various handy features:

- Monitoring cursor movement within Vim.
- Adding a custom preamble to the beginning of your HTML output.
- Facilitating content synchronization between the buffer and the browser.
- Operating in offline mode where Deno caches the markdown-it plugins.

Begin crafting your documents with your own flavored markdown.

## Installation

This plugin requires denops.vim and Deno.
For example, to use this plugin with [vim-jetpack](https://github.com/tani/vim-jetpack).
Optionally, to use POD renderer, you need to install [podium](https://github.com/tani/podium) as well.

```vim
Jetpack 'vim-denops/denops.vim'
Jetpack 'tani/glance-vim'
Jetpack 'tani/podium'           "For POD file, optional
```

## Usage

Please hit the command `:Glance` in Vim and open `http://localhost:8765` in the browser. Use `:GlanceStop` to stop
glance.

- `g:glance#server_hostname (127.0.0.1)` is a hostname to serve the previewer.
- `g:glance#server_port (8765)` is a port number to serve the previewer.
- `g:glance#server_open (v:true)` is a boolean value to open the previewer automatically
- `g:glance#markdown_plugins ([])` is a list of URLs for the markdown-it plugins.
- `g:glance#markdown_html (v:false)` is a boolean value to be enable HTML tags in markdown.
- `g:glance#markdown_linkify (v:false)` is a boolean value to render URLs as `a` elments .
- `g:glance#markdown_breaks (v:false)` is a boolean value to convert newlines into `br` elements.
- `g:glance#stylesheet ('')` is a string, which will be appended as a CSS stylesheet..

## Advanced Usage

Glance Vim has an interface to extend the MarkdownIt renderer in TypeScript.

Step1: Set path of configuration file `g:glance#config` such as `~/.config/glance/init.ts`

```vim
let g:glance#config = expand('~/.config/glance/init.ts')
```

Step2: Write a configuration in TypeScript.

```typescript
// ~/.config/glance/init.ts
import markdownItEmoji from "https://esm.sh/markdown-it-emoji";
import MarkdownIt from "https://esm.sh/markdown-it";

export function createMarkdownRenderer(md: MarkdownIt): MarkdownIt {
  return md.use(markdownItEmoji);
}
```

## Related Plugins

- [previm](https://github.com/previm/previm)
- [bufpreview.vim](https://github.com/kat0h/bufpreview.vim)
- [markdown-preview.nvim](https://github.com/iamcco/markdown-preview.nvim)

## Copyright and License

Copyrihgt (c) 2023 TANIGUCHI Masaya. All rights reserved. This plugin is released under
[MIT License](http://git.io/mit-license)
