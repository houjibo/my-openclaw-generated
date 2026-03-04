export * from './types';
export * from './intent-network';
export * from './registry';

import { IntentRegistry } from './registry';
import { registerFolderScenario } from './scenarios/folder-scenario';
import { registerMavenScenario } from './scenarios/maven-scenario';
import { registerNodeJSScenario } from './scenarios/nodejs-scenario';

export function createIntentNetwork(): IntentRegistry {
  const registry = new IntentRegistry();
  registerFolderScenario(registry);
  registerMavenScenario(registry);
  registerNodeJSScenario(registry);

  const validation = registry.validate();
  if (!validation.valid) {
    console.warn('意图网络验证失败:', validation.errors);
  }

  return registry;
}
