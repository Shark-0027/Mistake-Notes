import { Avatar, Button, Segmented } from "antd";
import { LogOut, Moon, Sun } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../auth";
import { useTheme } from "../theme";
import { BrandLogo } from "./BrandLogo";

export function AppShell() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <BrandLogo />
          <div className="header-actions">
            <Segmented
              aria-label="主题切换"
              size="small"
              value={theme}
              onChange={(value) => setTheme(value as "light" | "dark")}
              options={[
                { value: "light", icon: <Sun size={14} />, label: "日间" },
                { value: "dark", icon: <Moon size={14} />, label: "夜间" },
              ]}
            />
            <span className="user-chip">
              <Avatar className="student-avatar">
                {user?.name.slice(-2, -1) || "学"}
              </Avatar>
              <span>{user?.name}</span>
            </span>
            <Button
              type="text"
              className="logout-button"
              icon={<LogOut size={15} />}
              onClick={() => void signOut()}
            >
              退出
            </Button>
          </div>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

