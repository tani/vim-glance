# Glance Vim
![image](https://user-images.githubusercontent.com/5019902/152632510-6c2081f1-213f-4123-9739-bd1fd6e2c765.png)

Do you know the number of Markdown flavours in the world?
Everyone has an own flavour.
It's hard to find the suitable Markdown previewer for your own flavored Markdown.

Glance Vim is YOUR previewer. You do not to wander anymore.
Because this plugin provides a mechanism to customize renderer using markdown-it plugins.

If you want to use emoji in the markdown, then you just need to append `markdown-it-emoji` to `g:glance#plugins`

```vim
let g:glance#plugins = ['https://esm.sh/markdown-it-emoji']
```

The renderer dynamically loads your plugin with _dynamic import_ in Deno,
then it renders the buffer content with _markdown-it_,
and finally it sends the HTML document to the browwser.

Of couse, Glance Vim also provide features as follows.

- Spy the cursor motion in Vim.
- Append custom preamble in a head of HTML output.
- Synchronize content between the buffer and the browser.
- Offline mode, Deno caches the markdown-it plugins.

Let's write document in your own flavoured Markdown.

## Installation

This plugin requires denops.vim and Deno.

```vim
Plug 'vim-denops/denops.vim'
Plug 'tani/glance-vim'
```

## Usage

Please hit the command `:Glance` in Vim and open `http://localhost:8765/index.html` in the browser.

- `g:glance#server_port (8765)` is a port number to serve the previewer.
- `g:glance#markdown_plugins ([])` is a list of URLs for the markdown-it plugins.
- `g:glance#markdown_html (v:false)` is a boolean value to be enable HTML tags in markdown.
- `g:glance#markdown_linkify (v:false)` is a boolean vlaue to render URLs as `a` elments .
- `g:glance#markdown_breaks (v:false)` is a boolean vlaue to convert newlines into `br` elements.
- `g:glance#html_preamble ('')` is a string, which will be appended at the head of HTML output.

## Advanced Usage

Glance Vim has an interface to extend the MarkdownIt renderer in TypeScript.

Step1: Set path of configuration file `g:glance#config` such as `~/.config/glance/init.ts`

``` vim
let g:glance#config = extend('~/.config/glance/init.ts')
```

Step2: Write a configuration in TypeScript.

```typescript
// ~/.config/glance/init.ts
import markdownItEmoji from 'https://esm.sh/markdown-it-emoji'
import MarkdownIt from 'https://esm.sh/markdown-it'

export function createMarkdownRenderer(md: MarkdownIt): MarkdownIt {
  return md.use(markdownItEmoji);
}
```

## Related Plugins

- [previm](https://github.com/previm/previm)
- [bufpreview.vim](https://github.com/kat0h/bufpreview.vim)
- [markdown-preview.nvim](https://github.com/iamcco/markdown-preview.nvim)

## Copyright and License

Copyrihgt (c) 2022 TANIGUCHI Masaya. All rights reserved.
This plugin is released under [MIT License](http://git.io/mit-license)
