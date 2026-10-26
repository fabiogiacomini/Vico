import manifest from '../../registry/sources.json';
import { registrySchema } from '../core/sources';
export const registry = registrySchema.parse(manifest);
