# Збирає index.html з src/ (style.css + core.js + views.js + gcal.js + app.js)
css=open('src/style.css').read(); js=open('src/core.js').read()+'\n'+open('src/views.js').read()+'\n'+open('src/gcal.js').read()+'\n'+open('src/app.js').read()
js=js.replace("document.addEventListener('click', async e => {\n  if (e.target.closest('[data-sheet-close]'))","document.addEventListener('click', async e => {\n  if (suppressClick) { suppressClick = false; return; }\n  if (e.target.closest('[data-sheet-close]'))",1)
assert 'if (suppressClick) { suppressClick = false; return; }' in js
STAR='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"/></svg>'
FLAME='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 1.5s.9 3.1-1.4 6.1C10 10.3 7 12 7 16a5 5 0 0 0 10 0c0-2.3-1-3.9-1-3.9s2.5 1 2.5 4.4A6.5 6.5 0 0 1 5.5 16C5.5 9 13.5 7.8 13.5 1.5z"/></svg>'
tpl=open('src/shell.html').read()
open('index.html','w').write(tpl.replace('/*CSS*/',css).replace('/*JS*/',js).replace('<!--STAR-->',STAR).replace('<!--FLAME-->',FLAME))
open('build-check.mjs','w').write(js)
print('built', len(open('index.html').read()))
