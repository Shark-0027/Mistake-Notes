import { useState } from "react";
import { Alert, Button, Card, Form, Input } from "antd";
import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { useAuth } from "../auth";

interface LoginValues {
  username: string;
  password: string;
}

export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user) return <Navigate to="/records" replace />;

  async function submit(values: LoginValues) {
    setLoading(true);
    setError("");
    try {
      await signIn(values.username.trim(), values.password);
      const from =
        (location.state as { from?: string } | null)?.from || "/records";
      navigate(from, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "登录失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card" bordered>
        <BrandLogo />
        <div className="login-heading">
          <h1>登录错题本</h1>
          <p>查看历史作答与批改反馈，整理自己的错因和复习笔记。</p>
        </div>
        {error && (
          <Alert
            type="error"
            showIcon
            message={error}
            className="login-alert"
          />
        )}
        <Form<LoginValues>
          layout="vertical"
          requiredMark={false}
          onFinish={(values) => void submit(values)}
        >
          <Form.Item
            label="账号"
            name="username"
            rules={[{ required: true, message: "请输入账号" }]}
          >
            <Input
              autoComplete="username"
              prefix={<UserRound size={15} />}
              placeholder="请输入账号"
            />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password
              autoComplete="current-password"
              prefix={<LockKeyhole size={15} />}
              placeholder="请输入密码"
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            icon={!loading ? <ArrowRight size={16} /> : undefined}
          >
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}

