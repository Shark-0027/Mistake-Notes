import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ConfigProvider, theme as antdTheme } from "antd";

type ThemeValue = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeValue;
  setTheme: (theme: ThemeValue) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = "mistake-notes-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeValue>(() => {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(storageKey, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
    }),
    [theme],
  );

  const brand = theme === "dark" ? "#818cf8" : "#4f46e5";
  const brandHover = theme === "dark" ? "#a5b0fc" : "#4338ca";

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider
        theme={{
          algorithm:
            theme === "dark"
              ? antdTheme.darkAlgorithm
              : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: brand,
            colorPrimaryHover: brandHover,
            colorInfo: brand,
            colorBgBase: theme === "dark" ? "#0f1117" : "#f6f7fb",
            colorBgContainer: theme === "dark" ? "#181b24" : "#ffffff",
            colorTextBase: theme === "dark" ? "#f1f3f9" : "#0f172a",
            colorBorder: theme === "dark" ? "#2a2e3a" : "#e8eaf0",
            borderRadius: 8,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
          },
          components: {
            Button: { controlHeight: 38, fontWeight: 600 },
            Card: { borderRadiusLG: 11 },
            Input: { controlHeight: 38 },
            Select: { controlHeight: 38 },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

