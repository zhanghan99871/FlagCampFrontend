import React, { useMemo, useState, useMessage } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, message, Checkbox } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { apiFetch } from "../api/client";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

export default function Login() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 1. Initialize the message API and the context holder
  const [messageApi, contextHolder] = message.useMessage();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      //🔥 假账号验证逻辑（优先检查）
      if (
        values.email === "admin@gmail.com" &&
        values.password === "12345678"
      ) {
        // 生成假 token
        const fakeToken = "fake-jwt-token-" + Date.now();
        localStorage.setItem("token", fakeToken);
        localStorage.setItem(
          "user",
          JSON.stringify({
            email: "admin@gmail.com",
            username: "Admin User",
            id: 1,
          })
        );

        message.success("Login successful!");

        setTimeout(() => {
          navigate("/dashboard");
        }, 500);

        setLoading(false);
        return; // 直接返回，不调用真实API
      }

      // 真实 API 调用（如果不是假账号）
      const data = await apiFetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const token = data.token;
      if (!token) {
        throw new Error("Login response did not include token");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(data.user || {}));

      messageApi.success("Login successful!"); // 使用 messageApi 显示成功消息

      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem("token");
        messageApi.error("Invalid email or password");
      } else if (err.status === 403) {
        localStorage.removeItem("token");
        messageApi.error("Access denied. Please log in again");
      } else {
        messageApi.error(err.message + " Login failed. Please try again");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      {contextHolder}
      <div className="auth-container">
        <div className="auth-content">
          <div className="auth-header">
            <h1 className="auth-logo">🌍 Trip Planner</h1>
            <p className="auth-subtitle">
              Your Smart Travel Planning Assistant
            </p>
          </div>

          <Card className="auth-card">
            <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
              Welcome Back
            </h2>

            <Form
              form={form}
              name="login"
              onFinish={handleLogin}
              autoComplete="off"
              size="large"
              layout="vertical"
            >
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter your email" },
                  {
                    type: "email",
                    message: "Please enter a valid email address",
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: "Please enter your password" },
                  { min: 6, message: "Password must be at least 6 characters" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>Remember me</Checkbox>
                  </Form.Item>
                  <a href="#" className="auth-link">
                    Forgot password?
                  </a>
                </div>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="auth-button"
                >
                  Log In
                </Button>
              </Form.Item>

              <div className="auth-footer-text">
                Don't have an account?{" "}
                <a
                  onClick={() => navigate("/auth/register")}
                  className="auth-link"
                >
                  Sign up
                </a>
              </div>
            </Form>
          </Card>

          <div className="auth-copyright">
            © 2026 Trip Planner. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
}
