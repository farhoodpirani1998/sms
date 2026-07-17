"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const storage_provider_factory_1 = require("./storage-provider.factory");
const local_disk_storage_provider_1 = require("./local-disk-storage.provider");
const s3_storage_provider_1 = require("./s3-storage.provider");
jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
    PutObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
}));
function configWith(values) {
    return { get: (key) => values[key] };
}
describe('storageProviderFactory', () => {
    it('returns LocalDiskStorageProvider when MEDIA_STORAGE_DRIVER is unset', () => {
        const provider = (0, storage_provider_factory_1.storageProviderFactory)(configWith({}));
        expect(provider).toBeInstanceOf(local_disk_storage_provider_1.LocalDiskStorageProvider);
    });
    it('returns LocalDiskStorageProvider when MEDIA_STORAGE_DRIVER=local', () => {
        const provider = (0, storage_provider_factory_1.storageProviderFactory)(configWith({ MEDIA_STORAGE_DRIVER: 'local' }));
        expect(provider).toBeInstanceOf(local_disk_storage_provider_1.LocalDiskStorageProvider);
    });
    it('returns S3StorageProvider when MEDIA_STORAGE_DRIVER=s3 and all vars are set', () => {
        const provider = (0, storage_provider_factory_1.storageProviderFactory)(configWith({
            MEDIA_STORAGE_DRIVER: 's3',
            MEDIA_S3_BUCKET: 'nhg-media',
            MEDIA_S3_REGION: 'us-east-1',
            MEDIA_S3_ACCESS_KEY_ID: 'AKIAFAKE',
            MEDIA_S3_SECRET_ACCESS_KEY: 'fake-secret',
        }));
        expect(provider).toBeInstanceOf(s3_storage_provider_1.S3StorageProvider);
    });
    it('throws when MEDIA_STORAGE_DRIVER=s3 but required vars are missing', () => {
        expect(() => (0, storage_provider_factory_1.storageProviderFactory)(configWith({ MEDIA_STORAGE_DRIVER: 's3', MEDIA_S3_BUCKET: 'nhg-media' }))).toThrow(/MEDIA_STORAGE_DRIVER=s3 requires/);
    });
});
describe('S3StorageProvider', () => {
    it('writes an object and returns a virtual-hosted-style URL', async () => {
        const send = jest.fn().mockResolvedValue({});
        const fakeClient = { send };
        const provider = new s3_storage_provider_1.S3StorageProvider('nhg-media', 'us-east-1', { accessKeyId: 'AKIAFAKE', secretAccessKey: 'fake-secret' }, fakeClient);
        const result = await provider.write('sites/site-1/logo.png', Buffer.from('fake-bytes'));
        expect(send).toHaveBeenCalledTimes(1);
        expect(result.storageKey).toBe('sites/site-1/logo.png');
        expect(result.url).toBe('https://nhg-media.s3.us-east-1.amazonaws.com/sites/site-1/logo.png');
        expect(result.sizeBytes).toBe(Buffer.from('fake-bytes').byteLength);
    });
});
//# sourceMappingURL=storage-provider.factory.spec.js.map