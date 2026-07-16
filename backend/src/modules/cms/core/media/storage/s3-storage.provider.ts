import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { StorageProvider, StoredFile } from './storage-provider.interface';

export interface S3Credentials {
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * `S3StorageProvider` — CMS-B.3. Production storage backend, selected via
 * `MEDIA_STORAGE_DRIVER=s3` (see `storage-provider.factory.ts`).
 *
 * Deliberately takes bucket/region/credentials as constructor args rather
 * than injecting `ConfigService` directly (unlike
 * `LocalDiskStorageProvider`) — it's always constructed by the factory,
 * never by Nest's `useClass`, so there's no DI benefit to reading config
 * itself, and explicit args make the "what does this need to run"
 * contract obvious at the call site and in tests.
 *
 * `key` is used as-is for the S3 object key. Namespacing keys
 * `sites/{siteId}/...` (per docs/architecture/CMS_ARCHITECTURE.md §4.7,
 * so a second Site's media never collides with the first's) is the
 * caller's responsibility (CMS-B.4's upload endpoint composes the key
 * before calling `write`) — this provider and `LocalDiskStorageProvider`
 * both stay ignorant of Site scoping, matching the roadmap's file list
 * for this sub-phase (`storage-provider.interface.ts` is not touched
 * here).
 *
 * The optional `client` constructor param exists purely so unit tests can
 * inject a mocked `S3Client` instead of hitting real AWS.
 */
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;

  constructor(
    private readonly bucket: string,
    private readonly region: string,
    credentials: S3Credentials,
    client?: S3Client,
  ) {
    this.client =
      client ??
      new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        },
      });
  }

  async write(key: string, contents: Buffer): Promise<StoredFile> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: contents,
      }),
    );

    return {
      storageKey: key,
      url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
      sizeBytes: contents.byteLength,
    };
  }

  async read(storageKey: string): Promise<Buffer> {
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      }),
    );

    const body = result.Body as NodeJS.ReadableStream;
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
