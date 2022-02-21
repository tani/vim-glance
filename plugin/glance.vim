if exists('g:loaded_glance') || &cp
  finish
endif
let g:loaded_glance = v:true

let s:save_cpo = &cpo
set cpo&vim

function! s:notify(method, args) abort
  if exists('g:loaded_denops')
        \ && denops#server#status() ==# 'running'
        \ && denops#plugin#is_loaded('glance')
    call denops#notify('glance', a:method, a:args)
  else
    execute 'autocmd User DenopsPluginPost:glance ++once'
          \ printf('call denops#notify("glance", "%s", "%s")',
          \ a:method, string(a:args))
  endif
endfunction

function! s:glance() abort
  call s:notify('listen', [])
  augroup Grance
    autocmd! * <buffer>
    autocmd TextChanged,TextChangedI,TextChangedP <buffer> call s:notify('update', [])
    autocmd CursorMoved,CursorMovedI <buffer> call s:notify('update', [])
    autocmd BufUnload <buffer> call s:notify('close', [])
  augroup END
endfunction

command! Glance call s:glance()

let &cpo = s:save_cpo
unlet s:save_cpo
