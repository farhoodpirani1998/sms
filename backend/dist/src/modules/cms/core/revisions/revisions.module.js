"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevisionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const content_revision_entity_1 = require("./entities/content-revision.entity");
const revisions_service_1 = require("./revisions.service");
const revisions_controller_1 = require("./revisions.controller");
let RevisionsModule = class RevisionsModule {
};
exports.RevisionsModule = RevisionsModule;
exports.RevisionsModule = RevisionsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([content_revision_entity_1.ContentRevision])],
        controllers: [revisions_controller_1.RevisionsController],
        providers: [revisions_service_1.RevisionsService],
        exports: [revisions_service_1.RevisionsService],
    })
], RevisionsModule);
//# sourceMappingURL=revisions.module.js.map