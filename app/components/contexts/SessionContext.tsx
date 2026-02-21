"use client";

import { createContext, useEffect, useRef, useState, useContext } from "react";
import { usePathname } from "next/navigation";
import { initializeUser } from "@/app/api/initializeUser";
import { UserConfig } from "@/app/types/objects";
import { supabase } from "@/lib/supabase";
import { ConfigListEntry, CorrectSettings } from "@/app/types/payloads";
import { ToastContext } from "./ToastContext";
import { useDeviceId } from "@/app/getDeviceId";

export const SessionContext = createContext<{
  mode: string;
  id: string | null;
  showRateLimitDialog: boolean;
  enableRateLimitDialog: () => void;
  userConfig: UserConfig | null;
  savingConfig: boolean;
  fetchCurrentConfig: () => void;
  configIDs: ConfigListEntry[];
  updateConfig: (config: UserConfig, setDefault: boolean) => void;
  handleCreateConfig: (user_id: string) => void;
  getConfigIDs: (user_id: string) => void;
  handleLoadConfig: (user_id: string, config_id: string) => void;
  handleDeleteConfig: (
    user_id: string,
    config_id: string,
    selectedConfig: boolean
  ) => void;
  loadingConfig: boolean;
  loadingConfigs: boolean;
  correctSettings: CorrectSettings | null;
  triggerFetchCollection: () => void;
  fetchCollectionFlag: boolean;
  initialized: boolean;
  triggerFetchConversation: () => void;
  fetchConversationFlag: boolean;
  updateUnsavedChanges: (unsaved: boolean) => void;
  unsavedChanges: boolean;
}>({
  mode: "home",
  id: "",
  showRateLimitDialog: false,
  enableRateLimitDialog: () => {},
  userConfig: null,
  savingConfig: false,
  fetchCurrentConfig: () => {},
  configIDs: [],
  updateConfig: () => {},
  handleCreateConfig: () => {},
  getConfigIDs: () => {},
  handleLoadConfig: () => {},
  handleDeleteConfig: () => {},
  loadingConfig: false,
  loadingConfigs: false,
  correctSettings: null,
  triggerFetchCollection: () => {},
  fetchCollectionFlag: false,
  initialized: false,
  triggerFetchConversation: () => {},
  fetchConversationFlag: false,
  updateUnsavedChanges: () => {},
  unsavedChanges: false,
});

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { showErrorToast, showSuccessToast, showWarningToast } =
    useContext(ToastContext);

  const [mode, setMode] = useState<string>("home");

  const pathname = usePathname();

  const [showRateLimitDialog, setShowRateLimitDialog] =
    useState<boolean>(false);
  const deviceId = useDeviceId();
  const [id, setId] = useState<string | null>(null);
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);

  // Get authenticated user ID from Supabase
  useEffect(() => {
    const getAuthenticatedUserId = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) {
          console.error("Error getting authenticated user:", error);
          // Fallback to device ID if no authenticated user
          setId(deviceId);
          return;
        }

        if (user) {
          console.log("🔍 Authenticated user ID:", user.id);
          setId(user.id);
        } else {
          console.log("⚠️ No authenticated user, using device ID");
          setId(deviceId);
        }
      } catch (error) {
        console.error("Error in getAuthenticatedUserId:", error);
        setId(deviceId);
      }
    };

    getAuthenticatedUserId();
  }, [deviceId]);
  const [configIDs, setConfigIDs] = useState<ConfigListEntry[]>([]);
  const [correctSettings, setCorrectSettings] =
    useState<CorrectSettings | null>(null);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(false);
  const [loadingConfigs, setLoadingConfigs] = useState<boolean>(false);
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars -- setter reserved for future backend */
  const [savingConfig, _setSavingConfig] = useState<boolean>(false);
  const initialized = useRef(false);
  const [fetchCollectionFlag, setFetchCollectionFlag] =
    useState<boolean>(false);
  const [fetchConversationFlag, setFetchConversationFlag] =
    useState<boolean>(false);

  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);

  const triggerFetchCollection = () => {
    setFetchCollectionFlag((prev) => !prev);
  };

  const triggerFetchConversation = () => {
    setFetchConversationFlag((prev) => !prev);
  };

  const getConfigIDs = async (user_id: string) => {
    setLoadingConfigs(true);
    setConfigIDs([]);
    if (!user_id) {
      return;
    }
    // TODO: Commented out to avoid 404 error - endpoint not implemented
    // const configList = await getConfigList(user_id);

    // if (configList.error) {
    //   showErrorToast("Failed to Load Configuration List", configList.error);
    // }

    // // Sort configs by last_used date in descending order (most recent first)
    // const sortedConfigs = configList.configs.sort((a, b) => {
    //   return (
    //     new Date(b.last_update_time).getTime() -
    //     new Date(a.last_update_time).getTime()
    //   );
    // });

    // Mock empty config list for now
    const sortedConfigs: ConfigListEntry[] = [];
    setConfigIDs(sortedConfigs);
    setLoadingConfigs(false);
  };

  // TODO : Add fetching all possible model names from the API

  const fetchCurrentConfig = async () => {
    // Config endpoint not available on current backend
  };

  const updateUnsavedChanges = (unsaved: boolean) => {
    setUnsavedChanges(unsaved);
  };

  useEffect(() => {
    if (initialized.current || !id) return;
    initUser();
  }, [id]);

  useEffect(() => {
    if (pathname === "/") {
      setMode("home");
    } else if (
      pathname.startsWith("/data") ||
      pathname.startsWith("/collection")
    ) {
      setMode("data-explorer");
    } else if (pathname.startsWith("/eval")) {
      setMode("evaluation");
    } else if (pathname.startsWith("/about/data")) {
      setMode("about-data");
    } else if (pathname.startsWith("/about")) {
      setMode("about");
    }
  }, [pathname]);

  const initUser = async () => {
    if (!id) {
      return;
    }
    const user_object = await initializeUser(id);
    setLoadingConfig(true);

    if (user_object.error) {
      console.error(user_object.error);
      showErrorToast("Failed to Initialize User", user_object.error);
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.log("Initialized user with id: " + id);
    }

    getConfigIDs(id);
    setUserConfig({
      backend: user_object.config,
      frontend: user_object.frontend_config,
    });
    setCorrectSettings(user_object.correct_settings);
    setLoadingConfig(false);
    showSuccessToast("User Initialized");
    initialized.current = true;
  };

  const enableRateLimitDialog = () => {
    setShowRateLimitDialog(true);
  };

  /* eslint-disable @typescript-eslint/no-unused-vars -- API params reserved for future backend */
  const updateConfig = async (
    _config: UserConfig,
    _setDefault: boolean = false
  ) => {
    // Config save endpoint not available on current backend
    showWarningToast("Not Available", "Configuration management is not supported yet.");
  };

  const handleLoadConfig = async (_user_id: string, _config_id: string) => {
    // Config load endpoint not available on current backend
  };

  const handleCreateConfig = async (_user_id: string) => {
    // Config create endpoint not available on current backend
  };

  const handleDeleteConfig = async (
    _user_id: string,
    _config_id: string,
    _selectedConfig: boolean
  ) => {
    // Config delete endpoint not available on current backend
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */

  return (
    <SessionContext.Provider
      value={{
        mode,
        id,
        showRateLimitDialog,
        enableRateLimitDialog,
        userConfig,
        savingConfig,
        fetchCurrentConfig,
        configIDs,
        updateConfig,
        handleCreateConfig,
        getConfigIDs,
        handleLoadConfig,
        handleDeleteConfig,
        loadingConfig,
        loadingConfigs,
        correctSettings,
        fetchCollectionFlag,
        initialized: initialized.current,
        triggerFetchCollection,
        triggerFetchConversation,
        fetchConversationFlag,
        updateUnsavedChanges,
        unsavedChanges,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
