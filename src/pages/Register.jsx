import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Checkbox, Progress } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { apiFetch } from '../api/client';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function passwordStrength(pw) {
  const s = String(pw || '');
  let score = 0;
  if (s.length >= 8) score++;
  if (/[A-Z]/.test(s)) score++;
  if (/[a-z]/.test(s)) score++;
  if (/[0-9]/.test(s)) score++;
  if (/[^A-Za-z0-9]/.test(s)) score++;

  const clamped = Math.min(score, 4);
  const label = ['弱', '一般', '好', '强', '非常强'][clamped];
  const percent = (clamped / 4) * 100;

  return { score: clamped, label, percent };
}

export default function Register() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  const strength = useMemo(() => passwordStrength(password), [password]);

  const handleRegister = async (values) => {
    setLoading(true);

    try {
      await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          username: String(values.fullName).trim(),
          email: String(values.email).trim(),
          password: values.password,
        }),
      });

      message.success('注册成功！即将跳转到登录页面');

      setTimeout(() => {
        navigate('/auth/login');
      }, 800);

    } catch (err) {
      message.error(err?.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="auth-container">
        <div className="auth-content">
          <div className="auth-header">
            <h1 className="auth-logo">🌍 Trip Planner</h1>
            <p className="auth-subtitle">创建你的账号，开始规划旅程</p>
          </div>

          <Card className="auth-card">
            <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>创建账号</h2>

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
                  label="姓名"
                  rules={[
                    { required: true, message: '请输入姓名' },
                    { min: 2, message: '姓名至少需要2个字符' }
                  ]}
              >
                <Input
                    prefix={<UserOutlined />}
                    placeholder="你的姓名"
                    autoComplete="name"
                />
              </Form.Item>

              <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[
                    { required: true, message: '请输入邮箱地址' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
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
                  label="密码"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 8, message: '密码至少需要8个字符' },
                    () => ({
                      validator(_, value) {
                        if (!value || passwordStrength(value).score > 1) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('密码强度太弱，请添加数字、符号和大小写字母'));
                      },
                    }),
                  ]}
              >
                <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="至少8个字符"
                    autoComplete="new-password"
                    onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Item>

              {password && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>密码强度</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#667eea' }}>{strength.label}</span>
                    </div>
                    <Progress
                        percent={strength.percent}
                        showInfo={false}
                        strokeColor={{
                          '0%': '#667eea',
                          '100%': '#764ba2',
                        }}
                    />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      使用8个以上字符，包含数字、符号和大小写字母
                    </div>
                  </div>
              )}

              <Form.Item
                  name="confirmPassword"
                  label="确认密码"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请确认密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'));
                      },
                    }),
                  ]}
              >
                <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="再次输入密码"
                    autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                  name="agree"
                  valuePropName="checked"
                  rules={[
                    {
                      validator: (_, value) =>
                          value ? Promise.resolve() : Promise.reject(new Error('必须同意条款才能继续')),
                    },
                  ]}
              >
                <Checkbox>
                  我同意 <a href="#" className="auth-link">服务条款</a> 和 <a href="#" className="auth-link">隐私政策</a>
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
                  创建账号
                </Button>
              </Form.Item>

              <div className="auth-footer-text">
                已有账号？ <a onClick={() => navigate('/auth/login')} className="auth-link">立即登录</a>
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