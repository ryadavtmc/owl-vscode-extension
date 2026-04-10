const esbuild = require('esbuild');

const isWatch = process.argv.includes('--watch');

const options = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  logLevel: 'info',
};

if (isWatch) {
  esbuild.context(options).then(ctx => {
    ctx.watch();
    console.log('[Owl] Watching for changes...');
  }).catch(() => process.exit(1));
} else {
  esbuild.build(options).catch(() => process.exit(1));
}
