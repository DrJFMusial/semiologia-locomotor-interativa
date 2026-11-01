import { defineConfig } from 'vite';
// Motor 3D da aula em um único módulo ES autocontido (Three.js, cinemática, modelos em base64).
// Em modo biblioteca, o Vite embute os arquivos importados com ?url.
export default defineConfig({
  build: {
    outDir: 'dist-aula',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    lib: { entry: 'src/aula/entrada.js', formats: ['es'], fileName: () => 'motor3d.js' },
    rollupOptions: { output: { inlineDynamicImports: true } },
    minify: 'esbuild',
    target: 'es2020',
  },
});
