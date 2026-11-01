const {execFileSync}=require('child_process'),path=require('path'); const root=path.resolve(__dirname,'..');const motor=path.join(root,'integracao-3d/motor');
execFileSync(process.execPath,[path.join(motor,'node_modules/vite/bin/vite.js'),'build','-c','vite.aula.config.js'],{cwd:motor,stdio:'inherit'});
execFileSync(process.execPath,[path.join(root,'integracao-3d/scripts/integrar.cjs')],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,[path.join(root,'scripts/publicar.cjs')],{cwd:root,stdio:'inherit'});
