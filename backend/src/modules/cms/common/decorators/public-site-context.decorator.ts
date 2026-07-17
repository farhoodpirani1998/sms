import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithCmsSite } from '../../core/public-api/guards/public-site-context.guard';

/**
 * CMS-I.1. Companion param decorator to `PublicSiteContextGuard` — mirrors
 * the existing `@CurrentUser()` pattern (src/common/decorators). Reads
 * `request.cmsSite`, which only the guard populates, so any handler using
 * this decorator must have `PublicSiteContextGuard` applied (directly or
 * via a controller-level `@UseGuards`) — not yet the case anywhere, since
 * no public controller is wired to the guard until CMS-I.3–I.5.
 */
export const PublicSiteContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithCmsSite>();
    return request.cmsSite;
  },
);
