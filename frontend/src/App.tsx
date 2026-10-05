import { App as AntApp, Button, Result } from "antd";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./auth";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { RecordDetailPage } from "./pages/RecordDetailPage";
import { RecordsPage } from "./pages/RecordsPage";
import { ThemeProvider } from "./theme";

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="center-screen">
      <Result
        status="404"
        title="页面不存在"
        subTitle="返回错题列表继续复习。"
        extra={
          <Button type="primary" onClick={() => navigate("/records")}>
            返回列表
          </Button>
        }
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <RequireAuth>
                    <AppShell />
                  </RequireAuth>
                }
              >
                <Route path="/records" element={<RecordsPage />} />
                <Route path="/records/:id" element={<RecordDetailPage />} />
              </Route>
              <Route path="/" element={<Navigate to="/records" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ThemeProvider>
  );
}

