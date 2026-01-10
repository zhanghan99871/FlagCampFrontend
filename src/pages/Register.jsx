import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, message, Checkbox, Progress } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { apiFetch } from "../api/client";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function passwordStrength(pw) {
  const s = String(pw || "");
  let score = 0;
  if (s.length >= 8) score++;
  if (/[A-Z]/.test(s)) score++;
  if (/[a-z]/.test(s)) score++;
  if (/[0-9]/.test(s)) score++;
  if (/[^A-Za-z0-9]/.test(s)) score++;

  const clamped = Math.min(score, 4);
  const label = ["Weak", "Fair", "Good", "Strong", "Very Strong"][clamped];
  const percent = (clamped / 4) * 100;

  return { score: clamped, label, percent };
}

export default function Register() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  const strength = useMemo(() => passwordStrength(password), [password]);

  const handleRegister = async (values) => {
    setLoading(true);

    try {
      await apiFetch("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: String(values.fullName).trim(),
          email: String(values.email).trim(),
          password: values.password,
        }),
      });

      message.success("Registration successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/auth/login");
      }, 800);
    } catch (err) {
      message.error(err?.message || "Registration failed. Please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-header">
          <h1 className="auth-logo">🌍 Trip Planner</h1>
          <p className="auth-subtitle">Create your account to start planning</p>
        </div>

        <Card className="auth-card">
          <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
            Create Account
          </h2>

          <Form
            form={form}
            name="register"
            onFinish={handleRegister}
            autoComplete="off"
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="fullName"
              label="Full Name"
              rules={[
                { required: true, message: "Please enter your name" },
                { min: 2, message: "Name must be at least 2 characters" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Your full name"
                autoComplete="name"
              />
            </Form.Item>

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
                prefix={<MailOutlined />}
                placeholder="your@email.com"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please enter your password" },
                { min: 8, message: "Password must be at least 8 characters" },
                () => ({
                  validator(_, value) {
                    if (!value || passwordStrength(value).score > 1) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        "Password is too weak. Add numbers, symbols, and mixed case"
                      )
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Item>

            {password && (
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 12, color: "#666" }}>
                    Password Strength
                  </span>
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: "#667eea" }}
                  >
                    {strength.label}
                  </span>
                </div>
                <Progress
                  percent={strength.percent}
                  showInfo={false}
                  strokeColor={{
                    "0%": "#667eea",
                    "100%": "#764ba2",
                  }}
                />
                <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                  Use 8+ characters with numbers, symbols, and mixed case
                </div>
              </div>
            )}

            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="agree"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value
                      ? Promise.resolve()
                      : Promise.reject(new Error("You must agree to continue")),
                },
              ]}
            >
              <Checkbox>
                I agree to the{" "}
                <a href="#" className="auth-link">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="auth-link">
                  Privacy Policy
                </a>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="auth-button"
              >
                Create Account
              </Button>
            </Form.Item>

            <div className="auth-footer-text">
              Already have an account?{" "}
              <a onClick={() => navigate("/auth/login")} className="auth-link">
                Log in
              </a>
            </div>
          </Form>
        </Card>

        <div className="auth-copyright">
          © 2026 Trip Planner. All rights reserved.
        </div>
      </div>
    </div>
  );
}
