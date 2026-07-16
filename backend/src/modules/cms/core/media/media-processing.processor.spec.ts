import sharp from 'sharp';
import { MediaProcessingProcessor } from './media-processing.processor';
import { MediaAsset } from './entities/media-asset.entity';
import { StorageProvider } from './storage/storage-provider.interface';

function fakeRepository(asset: MediaAsset | null) {
  return {
    findOne: jest.fn().mockResolvedValue(asset),
    save: jest.fn().mockImplementation(async (entity: MediaAsset) => entity),
  } as any;
}

function fakeStorageProvider(read: Buffer): jest.Mocked<StorageProvider> {
  return {
    read: jest.fn().mockResolvedValue(read),
    write: jest.fn().mockResolvedValue({
      storageKey: 'ignored',
      url: '/media/ignored',
      sizeBytes: 0,
    }),
  };
}

function makeAsset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: 'asset-1',
    siteId: 'site-1',
    site: undefined as any,
    originalFilename: 'logo.png',
    mimeType: 'image/png',
    sizeBytes: 100,
    storageKey: 'sites/site-1/abc123.png',
    url: '/media/sites/site-1/abc123.png',
    width: null,
    height: null,
    altText: null,
    uploadedById: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('MediaProcessingProcessor', () => {
  // A real, tiny (20x10) red PNG generated with sharp itself — exercises
  // the actual image-processing path (metadata + resize), not a mock.
  async function fixturePng(): Promise<Buffer> {
    return sharp({
      create: { width: 20, height: 10, channels: 3, background: { r: 255, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();
  }

  it('reads the original, writes a resized thumbnail, and backfills width/height', async () => {
    const original = await fixturePng();
    const asset = makeAsset();
    const repository = fakeRepository(asset);
    const storage = fakeStorageProvider(original);
    const processor = new MediaProcessingProcessor(repository, storage);

    await processor.process({ data: { mediaAssetId: asset.id } } as any);

    expect(storage.read).toHaveBeenCalledWith('sites/site-1/abc123.png');
    expect(storage.write).toHaveBeenCalledTimes(1);
    expect(storage.write.mock.calls[0][0]).toBe('sites/site-1/abc123-thumb.png');

    const thumbnailBytes = storage.write.mock.calls[0][1] as Buffer;
    const thumbnailMeta = await sharp(thumbnailBytes).metadata();
    expect(thumbnailMeta.width).toBeLessThanOrEqual(400);
    expect(thumbnailMeta.height).toBeLessThanOrEqual(400);

    expect(repository.save).toHaveBeenCalledTimes(1);
    const saved = repository.save.mock.calls[0][0] as MediaAsset;
    expect(saved.width).toBe(20);
    expect(saved.height).toBe(10);
  });

  it('skips non-image assets without touching storage', async () => {
    const asset = makeAsset({ mimeType: 'application/pdf', storageKey: 'sites/site-1/doc.pdf' });
    const repository = fakeRepository(asset);
    const storage = fakeStorageProvider(Buffer.from(''));
    const processor = new MediaProcessingProcessor(repository, storage);

    await processor.process({ data: { mediaAssetId: asset.id } } as any);

    expect(storage.read).not.toHaveBeenCalled();
    expect(storage.write).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('logs and returns when the MediaAsset no longer exists', async () => {
    const repository = fakeRepository(null);
    const storage = fakeStorageProvider(Buffer.from(''));
    const processor = new MediaProcessingProcessor(repository, storage);

    await processor.process({ data: { mediaAssetId: 'missing' } } as any);

    expect(storage.read).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });
});
