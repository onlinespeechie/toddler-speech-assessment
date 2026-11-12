// Run: npx tsx scripts/check-email.ts  (needs network for DNS). Covers the brief's testing checklist.
import assert from 'node:assert';
import { promises as dns } from 'node:dns';
import { checkEmail } from '../src/lib/emailCheck';
import { suggestEmail } from '../src/lib/emailTypo';

async function main() {
  const sug: Record<string, string> = {
    'jane@gmail.con': 'jane@gmail.com', 'jane@hotmsil.com': 'jane@hotmail.com', 'jane@iclould.com': 'jane@icloud.com',
    'jane@gmail.com.au': 'jane@gmail.com', 'jane@outlook.ck': 'jane@outlook.com', 'jane@live.comau': 'jane@live.com.au',
  };
  for (const [i, o] of Object.entries(sug)) assert.equal(suggestEmail(i), o, i);
  for (const ok of ['jane@gmail.com', 'jane+quiz@gmail.com', 'hello+quiztest1@onlinespeechie.com', 'a@unisa.edu.au']) {
    assert.equal(suggestEmail(ok), null, `no suggestion: ${ok}`);
    assert.equal((await checkEmail(ok)).ok, true, `pass: ${ok}`);
  }
  for (const bad of ['jane@meow.com', 'jane@mailinator.com', 'a@example.com', 'jane@no-such-domain-xyz-12345.com', 'jane@gmail', 'hello@gmail.com'])
    assert.equal((await checkEmail(bad)).ok, false, `block: ${bad}`);
  // DNS forced to fail (SERVFAIL / timeout-like): must fail open
  dns.resolveMx = async () => { throw Object.assign(new Error('boom'), { code: 'ESERVFAIL' }); };
  assert.equal((await checkEmail('jane@fresh-domain-for-failopen-test.com')).ok, true, 'fail open');
  console.log('all email checks passed');
}
main();
