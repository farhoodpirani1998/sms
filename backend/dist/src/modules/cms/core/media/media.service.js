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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const path = __importStar(require("path"));
const media_asset_entity_1 = require("./entities/media-asset.entity");
const storage_provider_interface_1 = require("./storage/storage-provider.interface");
const site_service_1 = require("../site/site.service");
const media_processing_queue_1 = require("./media-processing.queue");
let MediaService = class MediaService {
    constructor(mediaAssetRepository, storageProvider, siteService, mediaProcessingQueue) {
        this.mediaAssetRepository = mediaAssetRepository;
        this.storageProvider = storageProvider;
        this.siteService = siteService;
        this.mediaProcessingQueue = mediaProcessingQueue;
    }
    async upload(file, dto, uploadedById) {
        if (!file) {
            throw new common_1.BadRequestException('فایلی برای آپلود ارسال نشده است');
        }
        await this.siteService.findOne(dto.siteId);
        const extension = path.extname(file.originalname);
        const key = `sites/${dto.siteId}/${(0, crypto_1.randomUUID)()}${extension}`;
        const stored = await this.storageProvider.write(key, file.buffer);
        const asset = this.mediaAssetRepository.create({
            siteId: dto.siteId,
            originalFilename: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: stored.sizeBytes,
            storageKey: stored.storageKey,
            url: stored.url,
            width: null,
            height: null,
            altText: dto.altText ?? null,
            uploadedById,
        });
        const saved = await this.mediaAssetRepository.save(asset);
        if (saved.mimeType.startsWith('image/')) {
            await this.mediaProcessingQueue.enqueueThumbnailJob(saved.id);
        }
        return saved;
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(media_asset_entity_1.MediaAsset)),
    __param(1, (0, common_1.Inject)(storage_provider_interface_1.STORAGE_PROVIDER)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object, site_service_1.SiteService,
        media_processing_queue_1.MediaProcessingQueue])
], MediaService);
//# sourceMappingURL=media.service.js.map