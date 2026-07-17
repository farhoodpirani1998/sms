"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicSiteContext = void 0;
const common_1 = require("@nestjs/common");
exports.PublicSiteContext = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.cmsSite;
});
//# sourceMappingURL=public-site-context.decorator.js.map