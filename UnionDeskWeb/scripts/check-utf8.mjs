import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const IGNORED_DIRS = new Set([
  '.git',
  '.idea',
  '.umi',
  '.umi-production',
  '.turbo',
  'coverage',
  'dist',
  'node_modules',
  'target',
]);

const TEXT_FILE_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.less',
  '.md',
  '.mjs',
  '.scss',
  '.ts',
  '.tsx',
  '.txt',
  '.xml',
  '.yaml',
  '.yml',
]);

const decoder = new TextDecoder('utf-8', { fatal: true });

function shouldCheck(filePath) {
  return TEXT_FILE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

async function walk(dir, acc) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.editorconfig') {
      if (IGNORED_DIRS.has(entry.name)) {
        continue;
      }
    }
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, acc);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }
    if (shouldCheck(fullPath)) {
      acc.push(fullPath);
    }
  }
}

function toRelative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function isUtf8Bom(bytes) {
  return (
    bytes.length >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
  );
}

async function main() {
  const files = [];
  await walk(ROOT, files);

  const invalidEncodingFiles = [];
  const bomFiles = [];

  for (const file of files) {
    const bytes = await fs.readFile(file);
    if (isUtf8Bom(bytes)) {
      bomFiles.push(toRelative(file));
      continue;
    }
    try {
      decoder.decode(bytes);
    } catch {
      invalidEncodingFiles.push(toRelative(file));
    }
  }

  if (invalidEncodingFiles.length === 0 && bomFiles.length === 0) {
    console.log(`UTF-8 check passed (${files.length} files).`);
    return;
  }

  if (invalidEncodingFiles.length > 0) {
    console.error('Found files that are not valid UTF-8:');
    invalidEncodingFiles.forEach((file) => console.error(`- ${file}`));
  }

  if (bomFiles.length > 0) {
    console.error('Found files that include UTF-8 BOM (not allowed):');
    bomFiles.forEach((file) => console.error(`- ${file}`));
  }

  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
