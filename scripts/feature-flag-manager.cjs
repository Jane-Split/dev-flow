const fs = require('fs');
const path = require('path');

/**
 * FeatureFlagManager — 功能开关管理器
 * 
 * 统一管理所有优化功能的开关状态，支持运行时查询和动态切换。
 */
class FeatureFlagManager {
  constructor(configPath = '.dev-flow/feature-flags.yaml') {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const yaml = require('js-yaml');
        return yaml.load(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (e) {
      console.warn(`[FeatureFlag] Failed to load config: ${e.message}`);
    }
    
    // 默认配置：全部启用
    return {
      features: {},
      global: { log_feature_usage: true, auto_rollback_on_error: false }
    };
  }

  /**
   * 检查功能是否启用
   */
  isEnabled(featureName) {
    const feature = this.config.features?.[featureName];
    if (!feature) {
      console.warn(`[FeatureFlag] Unknown feature: ${featureName}`);
      return false;
    }
    return feature.enabled === true;
  }

  /**
   * 获取功能配置
   */
  getFeature(featureName) {
    return this.config.features?.[featureName] || null;
  }

  /**
   * 获取所有功能状态
   */
  getAllFeatures() {
    const features = {};
    for (const [name, config] of Object.entries(this.config.features || {})) {
      features[name] = {
        enabled: config.enabled,
        description: config.description
      };
    }
    return features;
  }

  /**
   * 启用功能
   */
  enable(featureName) {
    if (this.config.features?.[featureName]) {
      this.config.features[featureName].enabled = true;
      this.saveConfig();
      console.log(`[FeatureFlag] Enabled: ${featureName}`);
    }
  }

  /**
   * 禁用功能
   */
  disable(featureName) {
    if (this.config.features?.[featureName]) {
      this.config.features[featureName].enabled = false;
      this.saveConfig();
      console.log(`[FeatureFlag] Disabled: ${featureName}`);
    }
  }

  /**
   * 切换功能状态
   */
  toggle(featureName) {
    if (this.isEnabled(featureName)) {
      this.disable(featureName);
    } else {
      this.enable(featureName);
    }
  }

  /**
   * 获取功能的 fallback 描述
   */
  getFallback(featureName) {
    return this.config.features?.[featureName]?.fallback || 'No fallback defined';
  }

  /**
   * 保存配置到文件
   */
  saveConfig() {
    try {
      const yaml = require('js-yaml');
      fs.writeFileSync(this.configPath, yaml.dump(this.config));
    } catch (e) {
      console.error(`[FeatureFlag] Failed to save config: ${e.message}`);
    }
  }

  /**
   * 打印功能状态报告
   */
  printReport() {
    console.log('\n=== Feature Flags Report ===\n');
    
    const features = this.config.features || {};
    const enabled = Object.entries(features).filter(([_, f]) => f.enabled);
    const disabled = Object.entries(features).filter(([_, f]) => !f.enabled);
    
    console.log(`Enabled (${enabled.length}/${Object.keys(features).length}):`);
    for (const [name, config] of enabled) {
      console.log(`  ✓ ${name}: ${config.description}`);
    }
    
    if (disabled.length > 0) {
      console.log(`\nDisabled (${disabled.length}/${Object.keys(features).length}):`);
      for (const [name, config] of disabled) {
        console.log(`  ✗ ${name}: ${config.description}`);
        console.log(`    Fallback: ${config.fallback}`);
      }
    }
    
    console.log('\n=============================\n');
  }
}

// 单例实例
let instance = null;

function getFeatureFlagManager(configPath) {
  if (!instance) {
    instance = new FeatureFlagManager(configPath);
  }
  return instance;
}

module.exports = {
  FeatureFlagManager,
  getFeatureFlagManager
};

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const featureName = args[1];

  const manager = getFeatureFlagManager();

  if (command === 'list') {
    manager.printReport();
  } else if (command === 'enable' && featureName) {
    manager.enable(featureName);
  } else if (command === 'disable' && featureName) {
    manager.disable(featureName);
  } else if (command === 'toggle' && featureName) {
    manager.toggle(featureName);
  } else if (command === 'check' && featureName) {
    const enabled = manager.isEnabled(featureName);
    console.log(`${featureName}: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  } else {
    console.log('Usage: node feature-flag-manager.cjs <list|enable|disable|toggle|check> [featureName]');
    console.log('\nAvailable features:');
    manager.printReport();
  }
}
