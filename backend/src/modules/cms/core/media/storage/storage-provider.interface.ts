/**
 * `StorageProvider` — CMS-B.2. The abstraction every media backend
 * implements, per docs/architecture/CMS_ARCHITECTURE.md §4.7: two
 * implementations (`LocalDiskStorageProvider` here, `S3StorageProvider`
 * in CMS-B.3) selected by `MEDIA_STORAGE_DRIVER=local|s3`, swappable with
 * no code change to callers.
 *
 * Deliberately minimal — just enough for CMS-B.4's upload endpoint to
 * persist a file and read it back. Deletion/listing are not part of this
 * sub-phase's scope; they're added if/when a content type needs them.
 */
export interface StoredFile {
  /** Provider-internal path/key. Namespaced `sites/{siteId}/...` starting
   *  at CMS-B.3; CMS-B.2's local provider uses a flatter layout since
   *  there's no site-scoping requirement yet at this sub-phase. */
  storageKey: string;
  /** The URL actually served to clients for this file. */
  url: string;
  sizeBytes: number;
}

export interface StorageProvider {
  /**
   * Persist a file's bytes under `key` and return where it ended up
   * (storageKey may differ from the requested `key` if the provider
   * needs to namespace/rewrite it) plus the public URL.
   */
  write(key: string, contents: Buffer): Promise<StoredFile>;

  /** Read back a previously-written file's bytes by its storageKey. */
  read(storageKey: string): Promise<Buffer>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
