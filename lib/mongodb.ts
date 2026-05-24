import { MongoClient, type Db } from "mongodb";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
}

const mongoUri = requireEnv("MONGODB_URI");
const mongoDbName = requireEnv("MONGODB_DB");

type CachedMongo = {
  client: MongoClient | null;
  clientPromise: Promise<MongoClient> | null;
};

const globalForMongo = globalThis as typeof globalThis & {
  _mongo?: CachedMongo;
};

const cached = globalForMongo._mongo ?? {
  client: null,
  clientPromise: null,
};

if (!globalForMongo._mongo) {
  globalForMongo._mongo = cached;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (cached.client) {
    return cached.client;
  }

  if (!cached.clientPromise) {
    cached.clientPromise = new MongoClient(mongoUri).connect();
  }

  cached.client = await cached.clientPromise;
  return cached.client;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(mongoDbName);
}
