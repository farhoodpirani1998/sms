import { IsOptional, IsString, Length } from 'class-validator';

/**
 * `LocaleQueryDto` — CMS-C.3. Shared `?locale=` query shape for every
 * `content/*` endpoint (admin and public) that reads a localized field.
 * Purely a shape/format check (2–10 chars, e.g. `"en"`/`"en-US"`) — it
 * does not validate the value against a `Site`'s `supportedLocales`;
 * that belongs to `LocaleResolverService.resolve()` (this sub-phase),
 * which is the one place that knows which `Site` is in scope and what
 * to fall back to when the requested locale isn't supported.
 */
export class LocaleQueryDto {
  @IsOptional()
  @IsString()
  @Length(2, 10)
  locale?: string;
}
