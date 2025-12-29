import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Checkbox } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { apiFetch } from '../api/client';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

export default function Login() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values) => {
    setLoading(true);

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: values.email,
          password: values.password
        }),
      });

      const token = data.token;
      if (!token) {
        throw new Error('Login response did not include token');
      }

      localStorage.setItem('token', token);
      message.success('登录成功！');

      setTimeout(() => {
        navigate('/hello');
      }, 500);

    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem('token');
        message.error('邮箱或密码错误');
      } else if (err.status === 403) {
        localStorage.removeItem('token');
        message.error('访问被拒绝，请重新登录');
      } else {
        message.error(err.message || '登录失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="auth-container">
        <div className="auth-content">
          <div className="auth-header">
            <h1 className="auth-logo">🌍 Trip Planner</h1>
            <p className="auth-subtitle">你的智能旅行规划助手</p>
          </div>

          <Card className="auth-card">
            <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>欢迎回来</h2>

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
                  label="邮箱"
                  rules={[
                    { required: true, message: '请输入邮箱地址' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
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
                  label="密码"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少需要6个字符' }
                  ]}
              >
                <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="输入密码"
                    autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>记住我</Checkbox>
                  </Form.Item>
                  <a href="#" className="auth-link">忘记密码？</a>
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
                  登录
                </Button>
              </Form.Item>

              <div className="auth-footer-text">
                还没有账号？ <a onClick={() => navigate('/auth/register')} className="auth-link">立即注册</a>
              </div>
            </Form>
          </Card>

          <div className="auth-copyright">
            © 2024 Trip Planner. All rights reserved.
          </div>
        </div>
      </div>
  );
}