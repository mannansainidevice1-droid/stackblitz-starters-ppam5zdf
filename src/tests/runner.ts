/**
 * BHAIRAVI Creations - Universal Test Suite Runner (TypeScript / Node)
 * Executes Tiers 1 through 4 systematic tests using Node native test runner
 */

import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import path from 'node:path';
import fs from 'node:fs';

const TIER_DIRS = [
  'tier1_features',
  'tier2_boundaries',
  'tier3_interactions',
  'tier4_scenarios'
];

async function collectTestFiles(): Promise<string[]> {
  const baseDir = path.resolve(process.cwd(), 'src/tests/e2e');
  const files: string[] = [];

  for (const tier of TIER_DIRS) {
    const tierPath = path.join(baseDir, tier);
    if (fs.existsSync(tierPath)) {
      const entries = fs.readdirSync(tierPath);
      for (const entry of entries) {
        if (entry.endsWith('.test.ts') || entry.endsWith('.test.js')) {
          files.push(path.join(tierPath, entry));
        }
      }
    }
  }

  return files;
}

async function main() {
  console.log('================================================================');
  console.log(' BHAIRAVI Creations — Opaque-Box E2E Test Suite Runner');
  console.log(' Tiers 1-4 Systematic Requirements Verification (F1 to F50)');
  console.log('================================================================\n');

  const files = await collectTestFiles();
  console.log(`Discovered ${files.length} test suite files across Tiers 1-4.`);

  const testStream = run({
    files,
    concurrency: true
  });

  testStream.compose(new spec()).pipe(process.stdout);
}

main().catch((err) => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
