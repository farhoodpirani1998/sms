import { ConfigService } from '@nestjs/config';
import { storageProviderFactory } from './storage-provider.factory';
import { LocalDiskStorageProvider } from './local-disk-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';

// Mock the AWS SDK client so this test never touches real S3 — only
// S3StorageProvider's own logic (key/URL construction, credential
// wiring) is under test here, per the roadmap's "S3 client mocked"
// build-verification requirement.
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
}));

function configWith(values: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

describe('storageProviderFactory', () => {
  it('returns LocalDiskStorageProvider when MEDIA_STORAGE_DRIVER is unset', () => {
    const provider = storageProviderFactory(configWith({}));
    expect(provider).toBeInstanceOf(LocalDiskStorageProvider);
  });

  it('returns LocalDiskStorageProvider when MEDIA_STORAGE_DRIVER=local', () => {
    const provider = storageProviderFactory(configWith({ MEDIA_STORAGE_DRIVER: 'local' }));
    expect(provider).toBeInstanceOf(LocalDiskStorageProvider);
  });

  it('returns S3StorageProvider when MEDIA_STORAGE_DRIVER=s3 and all vars are set', () => {
    const provider = storageProviderFactory(
      configWith({
        MEDIA_STORAGE_DRIVER: 's3',
        MEDIA_S3_BUCKET: 'nhg-media',
        MEDIA_S3_REGION: 'us-east-1',
        MEDIA_S3_ACCESS_KEY_ID: 'AKIAFAKE',
        MEDIA_S3_SECRET_ACCESS_KEY: 'fake-secret',
      }),
    );
    expect(provider).toBeInstanceOf(S3StorageProvider);
  });

  it('throws when MEDIA_STORAGE_DRIVER=s3 but required vars are missing', () => {
    expect(() =>
      storageProviderFactory(
        configWith({ MEDIA_STORAGE_DRIVER: 's3', MEDIA_S3_BUCKET: 'nhg-media' }),
      ),
    ).toThrow(/MEDIA_STORAGE_DRIVER=s3 requires/);
  });
});

describe('S3StorageProvider', () => {
  it('writes an object and returns a virtual-hosted-style URL', async () => {
    const send = jest.fn().mockResolvedValue({});
    const fakeClient = { send } as any;
    const provider = new S3StorageProvider(
      'nhg-media',
      'us-east-1',
      { accessKeyId: 'AKIAFAKE', secretAccessKey: 'fake-secret' },
      fakeClient,
    );

    const result = await provider.write('sites/site-1/logo.png', Buffer.from('fake-bytes'));

    expect(send).toHaveBeenCalledTimes(1);
    expect(result.storageKey).toBe('sites/site-1/logo.png');
    expect(result.url).toBe(
      'https://nhg-media.s3.us-east-1.amazonaws.com/sites/site-1/logo.png',
    );
    expect(result.sizeBytes).toBe(Buffer.from('fake-bytes').byteLength);
  });
});
