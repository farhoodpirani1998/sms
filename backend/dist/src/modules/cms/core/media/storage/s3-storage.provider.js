"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageProvider = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
class S3StorageProvider {
    constructor(bucket, region, credentials, client) {
        this.bucket = bucket;
        this.region = region;
        this.client =
            client ??
                new client_s3_1.S3Client({
                    region: this.region,
                    credentials: {
                        accessKeyId: credentials.accessKeyId,
                        secretAccessKey: credentials.secretAccessKey,
                    },
                });
    }
    async write(key, contents) {
        await this.client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: contents,
        }));
        return {
            storageKey: key,
            url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
            sizeBytes: contents.byteLength,
        };
    }
    async read(storageKey) {
        const result = await this.client.send(new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: storageKey,
        }));
        const body = result.Body;
        const chunks = [];
        for await (const chunk of body) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }
}
exports.S3StorageProvider = S3StorageProvider;
//# sourceMappingURL=s3-storage.provider.js.map