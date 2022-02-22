if exists('g:loaded_glance') || &compatible
  finish
endif
let g:loaded_glance = v:true

let s:save_cpoptions = &cpoptions
set cpoptions&vim

function! s:notify(method, params) abort
  call denops#plugin#wait_async('glance',
        \ function('denops#notify', ['glance', a:method, a:params]))
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

let &cpoptions = s:save_cpoptions
unlet s:save_cpoptions
