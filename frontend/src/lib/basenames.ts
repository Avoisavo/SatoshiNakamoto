import { normalize } from 'viem/ens';
import { createPublicClient, http, Address } from 'viem';
import { base, baseSepolia } from 'wagmi/chains';

// Basenames L2 Resolver addresses
const BASENAMES_RESOLVER = {
  [base.id]: '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD',
  [baseSepolia.id]: '0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA',
} as const;

// Registry addresses
const BASENAMES_REGISTRY = {
  [base.id]: '0xb94704422c2a1e396835a571837aa5ae53285a95',
  [baseSepolia.id]: '0x1493b2567056c2181630115660963E13A8E32735',
} as const;

/**
 * Resolve a basename to an address
 * @param name - The basename (e.g., "jesse.base.eth")
 * @param chainId - The chain ID (base or baseSepolia)
 * @returns The resolved address or null
 */
export async function resolveBasename(
  name: string,
  chainId: number = base.id
): Promise<Address | null> {
  try {
    const chain = chainId === base.id ? base : baseSepolia;
    const client = createPublicClient({
      chain,
      transport: http(),
    });

    const normalizedName = normalize(name);
    const address = await client.getEnsAddress({
      name: normalizedName,
      universalResolverAddress: BASENAMES_RESOLVER[chainId as keyof typeof BASENAMES_RESOLVER],
    });

    return address;
  } catch (error) {
    console.error('Error resolving basename:', error);
    return null;
  }
}

/**
 * Get the primary basename for an address (reverse resolution)
 * @param address - The Ethereum address
 * @param chainId - The chain ID (base or baseSepolia)
 * @returns The primary basename or null
 */
export async function getPrimaryBasename(
  address: Address,
  chainId: number = base.id
): Promise<string | null> {
  try {
    const chain = chainId === base.id ? base : baseSepolia;
    const client = createPublicClient({
      chain,
      transport: http(),
    });

    const name = await client.getEnsName({
      address,
      universalResolverAddress: BASENAMES_RESOLVER[chainId as keyof typeof BASENAMES_RESOLVER],
    });

    return name;
  } catch (error) {
    console.error('Error getting primary basename:', error);
    return null;
  }
}

/**
 * Get avatar URL for a basename
 * @param name - The basename
 * @param chainId - The chain ID
 * @returns The avatar URL or null
 */
export async function getBasenameAvatar(
  name: string,
  chainId: number = base.id
): Promise<string | null> {
  try {
    const chain = chainId === base.id ? base : baseSepolia;
    const client = createPublicClient({
      chain,
      transport: http(),
    });

    const normalizedName = normalize(name);
    const avatar = await client.getEnsAvatar({
      name: normalizedName,
      universalResolverAddress: BASENAMES_RESOLVER[chainId as keyof typeof BASENAMES_RESOLVER],
    });

    return avatar;
  } catch (error) {
    console.error('Error getting basename avatar:', error);
    return null;
  }
}

/**
 * Get text records for a basename
 * @param name - The basename
 * @param key - The text record key (e.g., "com.twitter", "url", "description")
 * @param chainId - The chain ID
 * @returns The text record value or null
 */
export async function getBasenameTextRecord(
  name: string,
  key: string,
  chainId: number = base.id
): Promise<string | null> {
  try {
    const chain = chainId === base.id ? base : baseSepolia;
    const client = createPublicClient({
      chain,
      transport: http(),
    });

    const normalizedName = normalize(name);
    const text = await client.getEnsText({
      name: normalizedName,
      key,
      universalResolverAddress: BASENAMES_RESOLVER[chainId as keyof typeof BASENAMES_RESOLVER],
    });

    return text;
  } catch (error) {
    console.error('Error getting basename text record:', error);
    return null;
  }
}