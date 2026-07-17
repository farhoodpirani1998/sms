"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharp_1 = __importDefault(require("sharp"));
const media_processing_processor_1 = require("./media-processing.processor");
function fakeRepository(asset) {
    return {
        findOne: jest.fn().mockResolvedValue(asset),
        save: jest.fn().mockImplementation(async (entity) => entity),
    };
}
function fakeStorageProvider(read) {
    return {
        read: jest.fn().mockResolvedValue(read),
        write: jest.fn().mockResolvedValue({
            storageKey: 'ignored',
            url: '/media/ignored',
            sizeBytes: 0,
        }),
    };
}
function makeAsset(overrides = {}) {
    return {
        id: 'asset-1',
        siteId: 'site-1',
        site: undefined,
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
    async function fixturePng() {
        return (0, sharp_1.default)({
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
        const processor = new media_processing_processor_1.MediaProcessingProcessor(repository, storage);
        await processor.process({ data: { mediaAssetId: asset.id } });
        expect(storage.read).toHaveBeenCalledWith('sites/site-1/abc123.png');
        expect(storage.write).toHaveBeenCalledTimes(1);
        expect(storage.write.mock.calls[0][0]).toBe('sites/site-1/abc123-thumb.png');
        const thumbnailBytes = storage.write.mock.calls[0][1];
        const thumbnailMeta = await (0, sharp_1.default)(thumbnailBytes).metadata();
        expect(thumbnailMeta.width).toBeLessThanOrEqual(400);
        expect(thumbnailMeta.height).toBeLessThanOrEqual(400);
        expect(repository.save).toHaveBeenCalledTimes(1);
        const saved = repository.save.mock.calls[0][0];
        expect(saved.width).toBe(20);
        expect(saved.height).toBe(10);
    });
    it('skips non-image assets without touching storage', async () => {
        const asset = makeAsset({ mimeType: 'application/pdf', storageKey: 'sites/site-1/doc.pdf' });
        const repository = fakeRepository(asset);
        const storage = fakeStorageProvider(Buffer.from(''));
        const processor = new media_processing_processor_1.MediaProcessingProcessor(repository, storage);
        await processor.process({ data: { mediaAssetId: asset.id } });
        expect(storage.read).not.toHaveBeenCalled();
        expect(storage.write).not.toHaveBeenCalled();
        expect(repository.save).not.toHaveBeenCalled();
    });
    it('logs and returns when the MediaAsset no longer exists', async () => {
        const repository = fakeRepository(null);
        const storage = fakeStorageProvider(Buffer.from(''));
        const processor = new media_processing_processor_1.MediaProcessingProcessor(repository, storage);
        await processor.process({ data: { mediaAssetId: 'missing' } });
        expect(storage.read).not.toHaveBeenCalled();
        expect(repository.save).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=media-processing.processor.spec.js.map