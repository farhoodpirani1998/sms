"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bullmq_1 = require("@nestjs/bullmq");
const config_1 = require("@nestjs/config");
const media_asset_entity_1 = require("./entities/media-asset.entity");
const storage_provider_interface_1 = require("./storage/storage-provider.interface");
const storage_provider_factory_1 = require("./storage/storage-provider.factory");
const media_service_1 = require("./media.service");
const media_controller_1 = require("./media.controller");
const site_module_1 = require("../site/site.module");
const media_processing_queue_1 = require("./media-processing.queue");
const media_processing_processor_1 = require("./media-processing.processor");
let MediaModule = class MediaModule {
};
exports.MediaModule = MediaModule;
exports.MediaModule = MediaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([media_asset_entity_1.MediaAsset]),
            site_module_1.SiteModule,
            bullmq_1.BullModule.registerQueue({ name: media_processing_queue_1.MEDIA_PROCESSING_QUEUE }),
        ],
        controllers: [media_controller_1.MediaController],
        providers: [
            {
                provide: storage_provider_interface_1.STORAGE_PROVIDER,
                useFactory: storage_provider_factory_1.storageProviderFactory,
                inject: [config_1.ConfigService],
            },
            media_service_1.MediaService,
            media_processing_queue_1.MediaProcessingQueue,
            media_processing_processor_1.MediaProcessingProcessor,
        ],
        exports: [storage_provider_interface_1.STORAGE_PROVIDER, media_service_1.MediaService],
    })
], MediaModule);
//# sourceMappingURL=media.module.js.map