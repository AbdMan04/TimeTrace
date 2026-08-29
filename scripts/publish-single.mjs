import { copyFileSync } from 'node:fs';

copyFileSync('dist-single/index.html', 'index.html');
console.log('Copied dist-single/index.html -> index.html (repo-root published build)');