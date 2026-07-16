import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './storage-provider.interface';
import { LocalDiskStorageProvider } from './local-disk-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';

/**
 * `storageProviderFactory` — CMS-B.3. Picks the `StorageProvider`
 * implementation off `MEDIA_STORAGE_DRIVER` (defaulting to `local`, so
 * CMS-B.2 deployments with the var unset keep working unchanged). Used as
 * the `useFactory` for the `STORAGE_PROVIDER` token in `media.module.ts`
 * — the single place selection logic lives, per
 * docs/architecture/CMS_ARCHITECTURE.md §4.7's "swappable via env var
 * with no code change" requirement.
 */
export function storageProviderFactory(configService: ConfigService): StorageProvider {
  const driver = configService.get<string>('MEDIA_STORAGE_DRIVER') ?? 'local';

  if (driver === 's3') {
    const bucket = configService.get<string>('MEDIA_S3_BUCKET');
    const region = configService.get<string>('MEDIA_S3_REGION');
    const accessKeyId = configService.get<string>('MEDIA_S3_ACCESS_KEY_ID');
    const secretAccessKey = configService.get<string>('MEDIA_S3_SECRET_ACCESS_KEY');

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'MEDIA_STORAGE_DRIVER=s3 requires MEDIA_S3_BUCKET, MEDIA_S3_REGION, ' +
          'MEDIA_S3_ACCESS_KEY_ID, and MEDIA_S3_SECRET_ACCESS_KEY to be set',
      );
    }

    return new S3StorageProvider(bucket, region, { accessKeyId, secretAccessKey });
  }

  return new LocalDiskStorageProvider(configService);
}
