import { ClientSchema, type Client } from '../schemas/client';

const modules = import.meta.glob('/clients/*/config.ts', { eager: true }) as Record<
  string,
  { default: unknown }
>;

/** Loads every client config and validates it. An invalid config fails the build. */
export function getClients(): Client[] {
  return Object.entries(modules).map(([path, mod]) => {
    const result = ClientSchema.safeParse(mod.default);
    if (!result.success) {
      throw new Error(`Invalid client config at ${path}:\n${result.error.message}`);
    }
    const folder = path.split('/').at(-2);
    if (result.data.slug !== folder) {
      throw new Error(`Client slug "${result.data.slug}" does not match folder "${folder}" (${path})`);
    }
    return result.data;
  });
}

export function getClient(slug: string): Client {
  const client = getClients().find((c) => c.slug === slug);
  if (!client) throw new Error(`No client with slug "${slug}"`);
  return client;
}
