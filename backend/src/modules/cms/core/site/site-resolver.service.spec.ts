import { NotFoundException } from '@nestjs/common';
import { SiteResolverService } from './site-resolver.service';
import { Site } from './entities/site.entity';

function fakeSite(overrides: Partial<Site> = {}): Site {
  return {
    id: 'site-1',
    name: 'NHG',
    domain: 'nhg.example.com',
    defaultLocale: 'en',
    supportedLocales: ['en'],
    theme: null,
    socialLinks: null,
    seoDefaults: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function fakeRepository(sites: Site[]) {
  return {
    findOne: jest.fn().mockImplementation(async ({ where }: any) => {
      return sites.find((s) => s.domain === where.domain) ?? null;
    }),
    find: jest.fn().mockResolvedValue(sites),
  } as any;
}

describe('SiteResolverService', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('resolveByDomain', () => {
    it('returns the matching Site', async () => {
      const site = fakeSite();
      const service = new SiteResolverService(fakeRepository([site]));

      await expect(service.resolveByDomain('nhg.example.com')).resolves.toBe(site);
    });

    it('throws NotFoundException when no Site matches', async () => {
      const service = new SiteResolverService(fakeRepository([]));

      await expect(service.resolveByDomain('unknown.example.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('resolveBySlug', () => {
    it('matches the first label of a Site domain, case-insensitively', async () => {
      process.env.NODE_ENV = 'development';
      const site = fakeSite({ domain: 'nhg.example.com' });
      const service = new SiteResolverService(fakeRepository([site]));

      await expect(service.resolveBySlug('NHG')).resolves.toBe(site);
    });

    it('throws NotFoundException when the slug matches no Site', async () => {
      process.env.NODE_ENV = 'development';
      const service = new SiteResolverService(fakeRepository([fakeSite()]));

      await expect(service.resolveBySlug('unknown')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for an empty/blank slug', async () => {
      process.env.NODE_ENV = 'development';
      const service = new SiteResolverService(fakeRepository([fakeSite()]));

      await expect(service.resolveBySlug('   ')).rejects.toThrow(NotFoundException);
    });

    it('is disabled in production, even for a slug that would otherwise match', async () => {
      process.env.NODE_ENV = 'production';
      const site = fakeSite({ domain: 'nhg.example.com' });
      const service = new SiteResolverService(fakeRepository([site]));

      await expect(service.resolveBySlug('nhg')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolveFromHost', () => {
    it('resolves by domain when the Host header matches, ignoring a port', async () => {
      const site = fakeSite({ domain: 'nhg.example.com' });
      const service = new SiteResolverService(fakeRepository([site]));

      await expect(service.resolveFromHost('nhg.example.com:3000')).resolves.toBe(site);
    });

    it('resolves by domain case-insensitively', async () => {
      const site = fakeSite({ domain: 'nhg.example.com' });
      const service = new SiteResolverService(fakeRepository([site]));

      await expect(service.resolveFromHost('NHG.EXAMPLE.COM')).resolves.toBe(site);
    });

    it('falls back to the dev slug when the Host does not match any Site', async () => {
      process.env.NODE_ENV = 'development';
      const site = fakeSite({ domain: 'nhg.example.com' });
      const service = new SiteResolverService(fakeRepository([site]));

      await expect(service.resolveFromHost('localhost:3000', 'nhg')).resolves.toBe(site);
    });

    it('falls back to the dev slug when there is no Host header at all', async () => {
      process.env.NODE_ENV = 'development';
      const site = fakeSite({ domain: 'nhg.example.com' });
      const service = new SiteResolverService(fakeRepository([site]));

      await expect(service.resolveFromHost(undefined, 'nhg')).resolves.toBe(site);
    });

    it('throws NotFoundException when neither Host nor slug resolve to a Site', async () => {
      process.env.NODE_ENV = 'development';
      const service = new SiteResolverService(fakeRepository([fakeSite()]));

      await expect(service.resolveFromHost('unknown.example.com', 'also-unknown')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when there is no Host and no slug', async () => {
      const service = new SiteResolverService(fakeRepository([fakeSite()]));

      await expect(service.resolveFromHost(undefined)).rejects.toThrow(NotFoundException);
    });

    it('does not fall back to slug in production, even if the Host misses', async () => {
      process.env.NODE_ENV = 'production';
      const site = fakeSite({ domain: 'nhg.example.com' });
      const service = new SiteResolverService(fakeRepository([site]));

      await expect(service.resolveFromHost('localhost', 'nhg')).rejects.toThrow(NotFoundException);
    });
  });
});
