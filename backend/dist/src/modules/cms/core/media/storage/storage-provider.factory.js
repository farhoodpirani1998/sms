"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageProviderFactory = storageProviderFactory;
const local_disk_storage_provider_1 = require("./local-disk-storage.provider");
const s3_storage_provider_1 = require("./s3-storage.provider");
function storageProviderFactory(configService) {
    const driver = configService.get('MEDIA_STORAGE_DRIVER') ?? 'local';
    if (driver === 's3') {
        const bucket = configService.get('MEDIA_S3_BUCKET');
        const region = configService.get('MEDIA_S3_REGION');
        const accessKeyId = configService.get('MEDIA_S3_ACCESS_KEY_ID');
        const secretAccessKey = configService.get('MEDIA_S3_SECRET_ACCESS_KEY');
        if (!bucket || !region || !accessKeyId || !secretAccessKey) {
            throw new Error('MEDIA_STORAGE_DRIVER=s3 requires MEDIA_S3_BUCKET, MEDIA_S3_REGION, ' +
                'MEDIA_S3_ACCESS_KEY_ID, and MEDIA_S3_SECRET_ACCESS_KEY to be set');
        }
        return new s3_storage_provider_1.S3StorageProvider(bucket, region, { accessKeyId, secretAccessKey });
    }
    return new local_disk_storage_provider_1.LocalDiskStorageProvider(configService);
}
//# sourceMappingURL=storage-provider.factory.js.map