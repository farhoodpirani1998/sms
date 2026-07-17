"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs/promises"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const local_disk_storage_provider_1 = require("./local-disk-storage.provider");
describe('LocalDiskStorageProvider', () => {
    let tmpDir;
    let provider;
    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-media-test-'));
        const configService = {
            get: (key) => (key === 'MEDIA_LOCAL_PATH' ? tmpDir : undefined),
        };
        provider = new local_disk_storage_provider_1.LocalDiskStorageProvider(configService);
    });
    afterEach(async () => {
        await fs.rm(tmpDir, { recursive: true, force: true });
    });
    it('writes a file and reads back identical bytes', async () => {
        const contents = Buffer.from('hello media asset');
        const stored = await provider.write('fixtures/hello.txt', contents);
        expect(stored.storageKey).toBe('fixtures/hello.txt');
        expect(stored.url).toBe('/media/fixtures/hello.txt');
        expect(stored.sizeBytes).toBe(contents.byteLength);
        const readBack = await provider.read(stored.storageKey);
        expect(readBack.equals(contents)).toBe(true);
    });
    it('creates nested directories that do not yet exist', async () => {
        const contents = Buffer.from('nested');
        const stored = await provider.write('a/b/c/nested.txt', contents);
        const onDisk = await fs.readFile(path.join(tmpDir, 'a/b/c/nested.txt'));
        expect(onDisk.equals(contents)).toBe(true);
        expect(stored.storageKey).toBe('a/b/c/nested.txt');
    });
    it('strips path traversal segments from the key', async () => {
        const contents = Buffer.from('traversal');
        const stored = await provider.write('../../etc/passwd', contents);
        expect(stored.storageKey).toBe('etc/passwd');
        const onDisk = await fs.readFile(path.join(tmpDir, 'etc/passwd'));
        expect(onDisk.equals(contents)).toBe(true);
    });
    it('defaults to ./storage/media when MEDIA_LOCAL_PATH is unset', () => {
        const configService = { get: () => undefined };
        const defaultProvider = new local_disk_storage_provider_1.LocalDiskStorageProvider(configService);
        expect(defaultProvider.basePath).toBe(path.resolve('./storage/media'));
    });
});
//# sourceMappingURL=local-disk-storage.provider.spec.js.map