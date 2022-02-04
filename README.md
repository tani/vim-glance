# Glance Vim

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

- `g:glance#plugins` is a list of URLs for the markdown-it plugins.
- `g:glance#port` is a port number to serve the previewer
- `g:glance#preamble` is a string, which will be appended at the head of HTML output.

## Related Plugins

- [previm](https://github.com/previm/previm)
- [bufpreview.vim](https://github.com/kat0h/bufpreview.vim)
- [markdown-preview.nvim](https://github.com/iamcco/markdown-preview.nvim)

## Copyright and License

Copyrihgt (c) 2022 TANIGUCHI Masaya. All rights reserved.
This plugin is released under [MIT License](http://git.io/mit-license)
