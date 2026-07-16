import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { LocalDiskStorageProvider } from './local-disk-storage.provider';

describe('LocalDiskStorageProvider', () => {
  let tmpDir: string;
  let provider: LocalDiskStorageProvider;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-media-test-'));
    const configService = {
      get: (key: string) => (key === 'MEDIA_LOCAL_PATH' ? tmpDir : undefined),
    } as unknown as ConfigService;
    provider = new LocalDiskStorageProvider(configService);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('writes a file and reads back identical bytes', async () => {
    const contents = Buffer.from('hello media asset');

    const stored = await provider.write('fixtures/hello.txt', contents);

    expect(stored.storageKey).toBe('fixtures/hello.txt');
    expect(stored.url).toBe('/media/fixtures/hello.txt');
    expect(stored.sizeBytes).toBe(contents.byteLength);

    const readBack = await provider.read(stored.storageKey);
    expect(readBack.equals(contents)).toBe(true);
  });

  it('creates nested directories that do not yet exist', async () => {
    const contents = Buffer.from('nested');

    const stored = await provider.write('a/b/c/nested.txt', contents);

    const onDisk = await fs.readFile(path.join(tmpDir, 'a/b/c/nested.txt'));
    expect(onDisk.equals(contents)).toBe(true);
    expect(stored.storageKey).toBe('a/b/c/nested.txt');
  });

  it('strips path traversal segments from the key', async () => {
    const contents = Buffer.from('traversal');

    const stored = await provider.write('../../etc/passwd', contents);

    // '..' segments are dropped, so the file lands inside tmpDir under
    // 'etc/passwd', never escaping basePath.
    expect(stored.storageKey).toBe('etc/passwd');
    const onDisk = await fs.readFile(path.join(tmpDir, 'etc/passwd'));
    expect(onDisk.equals(contents)).toBe(true);
  });

  it('defaults to ./storage/media when MEDIA_LOCAL_PATH is unset', () => {
    const configService = { get: () => undefined } as unknown as ConfigService;
    const defaultProvider = new LocalDiskStorageProvider(configService);

    expect((defaultProvider as any).basePath).toBe(path.resolve('./storage/media'));
  });
});
