import { useState, useEffect } from "react";
import { BackendConfig } from "@/app/types/objects";
import { isEqual } from "lodash";

/**
 * Custom hook for managing tree-specific configuration state
 * Handles loading, saving, resetting tree configurations for specific conversations
 */
export function useTreeConfigState(
  user_id: string | null | undefined,
  conversation_id: string | null | undefined
) {
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars -- setter reserved for future backend */
  const [originalConfig, _setOriginalConfig] = useState<BackendConfig | null>(
    null
  );
  const [currentConfig, setCurrentConfig] = useState<BackendConfig | null>(
    null
  );
  const [changedConfig, setChangedConfig] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Tree config endpoint not available on current backend
  const fetchTreeConfig = async () => {
    setLoading(false);
  };

  // Tree config save endpoint not available on current backend
  const handleSaveConfig = async () => {
  };

  // Tree config reset endpoint not available on current backend
  const resetConfig = async () => {
  };

  // Cancel changes and revert to original
  const cancelConfig = () => {
    if (originalConfig) {
      setCurrentConfig({ ...originalConfig });
      setChangedConfig(false);
    }
  };

  // Update general config fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateFields = (key: string, value: any) => {
    if (currentConfig) {
      setCurrentConfig({
        ...currentConfig,
        [key]: value,
      });
    }
  };

  // Update settings fields
  const updateSettingsFields = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyOrUpdates: string | Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: any
  ) => {
    if (currentConfig) {
      if (typeof keyOrUpdates === "string") {
        // Single key-value update
        setCurrentConfig({
          ...currentConfig,
          settings: {
            ...currentConfig.settings,
            [keyOrUpdates]: value,
          },
        });
      } else {
        // Multiple key-value updates
        setCurrentConfig({
          ...currentConfig,
          settings: {
            ...currentConfig.settings,
            ...keyOrUpdates,
          },
        });
      }
    }
  };

  // Effect to fetch config when dependencies change
  useEffect(() => {
    fetchTreeConfig();
  }, [user_id, conversation_id]);

  // Effect to track changes
  useEffect(() => {
    if (currentConfig && originalConfig) {
      const configsMatch = isEqual(currentConfig, originalConfig);
      setChangedConfig(!configsMatch);
    }
  }, [currentConfig, originalConfig]);

  return {
    // State
    originalConfig,
    currentConfig,
    changedConfig,
    loading,

    // Actions
    handleSaveConfig,
    resetConfig,
    cancelConfig,
    updateFields,
    updateSettingsFields,
    fetchTreeConfig,

    // State setters (for complex updates)
    setCurrentConfig,
  };
}
