import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { StorageProvider, StoredFile } from './storage-provider.interface';

/**
 * `LocalDiskStorageProvider` — CMS-B.2. Dev/single-box implementation:
 * writes under a configurable local directory (`MEDIA_LOCAL_PATH`,
 * defaulting to `./storage/media` so `npm run start:dev` works with zero
 * config). The production backend (`S3StorageProvider`, key-namespaced
 * `sites/{siteId}/...`) lands in CMS-B.3 — this sub-phase doesn't
 * site-scope keys yet since no caller (the upload endpoint) exists until
 * CMS-B.4.
 *
 * `url` is a relative `/media/{key}` path. Actually serving that path
 * (a static assets mount, or a dedicated read-back route) is not part of
 * this sub-phase — CMS-B.4's upload endpoint is the first real caller,
 * and whatever serves `/media/*` in production is an ops/deployment
 * concern outside the CMS module's own code.
 */
@Injectable()
export class LocalDiskStorageProvider implements StorageProvider {
  private readonly basePath: string;

  constructor(private readonly configService: ConfigService) {
    const configuredPath = this.configService.get<string>('MEDIA_LOCAL_PATH');
    this.basePath = path.resolve(configuredPath || './storage/media');
  }

  async write(key: string, contents: Buffer): Promise<StoredFile> {
    const storageKey = this.normalizeKey(key);
    const fullPath = path.join(this.basePath, storageKey);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, contents);

    return {
      storageKey,
      url: `/media/${storageKey}`,
      sizeBytes: contents.byteLength,
    };
  }

  async read(storageKey: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, this.normalizeKey(storageKey));
    return fs.readFile(fullPath);
  }

  // Strips leading slashes and any `..` segments so a caller-supplied key
  // can never escape `basePath` via path traversal.
  private normalizeKey(key: string): string {
    return path
      .normalize(key)
      .split(path.sep)
      .filter((segment) => segment !== '' && segment !== '..')
      .join(path.sep);
  }
}
