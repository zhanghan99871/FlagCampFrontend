import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Checkbox, Modal } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { apiFetch } from '../api/client';

export default function Login() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // 🔥 页面加载时，自动填充保存的邮箱
    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            form.setFieldsValue({
                email: savedEmail,
                remember: true
            });
        }
    }, [form]);

    const handleLogin = async (values) => {
        setLoading(true);

        try {
            // 🔥 处理 "Remember me" 功能
            if (values.remember) {
                // 保存邮箱到 localStorage（不保存密码，安全考虑）
                localStorage.setItem('rememberedEmail', values.email);
            } else {
                // 如果不勾选，删除保存的邮箱
                localStorage.removeItem('rememberedEmail');
            }

            // 🔥 假账号验证（开发/测试用）
            if (values.email === 'admin@gmail.com' && values.password === '12345678') {
                const fakeToken = 'fake-jwt-token-' + Date.now();
                localStorage.setItem('token', fakeToken);
                localStorage.setItem('user', JSON.stringify({
                    email: 'admin@gmail.com',
                    username: 'Admin User',
                    displayName: 'Admin User',
                    id: 1
                }));

                message.success('Login successful!');
                setTimeout(() => navigate('/dashboard'), 500);
                setLoading(false);
                return;
            }

            // 🔥 真实 API 调用（生产环境）
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: values.email,
                    password: values.password
                }),
            });

            const token = data.token || data.data?.token;
            if (!token) {
                throw new Error('Login response did not include token');
            }

            // 保存 token 和用户信息
            localStorage.setItem('token', token);
            const userData = data.user || data.data?.user || {};
            localStorage.setItem('user', JSON.stringify(userData));

            message.success('Login successful!');
            setTimeout(() => navigate('/dashboard'), 500);

        } catch (err) {
            // 错误处理
            if (err.status === 401) {
                message.error('Invalid email or password');
            } else if (err.status === 403) {
                message.error('Access denied. Please log in again');
            } else {
                message.error(err.message || 'Login failed. Please try again');
            }
        } finally {
            setLoading(false);
        }
    };

    // 🔥 忘记密码处理
    const handleForgotPassword = () => {
        const email = form.getFieldValue('email');

        if (!email) {
            message.warning('Please enter your email first');
            return;
        }

        Modal.confirm({
            title: 'Reset Password',
            content: (
                <div>
                    <p>Send password reset link to:</p>
                    <p style={{ fontWeight: 600, color: '#667eea' }}>{email}</p>
                    <p style={{ marginTop: 16, fontSize: 13, color: '#999' }}>
                        You will receive an email with instructions to reset your password.
                    </p>
                </div>
            ),
            okText: 'Send Reset Link',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    // TODO: 调用后端重置密码 API
                    // await apiFetch('/auth/forgot-password', {
                    //   method: 'POST',
                    //   body: JSON.stringify({ email })
                    // });

                    // 临时：显示成功消息
                    message.success('Password reset link sent! Please check your email.');
                    console.log('Reset password for:', email);
                } catch (err) {
                    message.error('Failed to send reset link. Please try again.');
                }
            },
        });
    };

    return (
        <div className="auth-container">
            <div className="auth-content">
                <div className="auth-header">
                    <h1 className="auth-logo">🌍 Trip Planner</h1>
                    <p className="auth-subtitle">Your Smart Travel Planning Assistant</p>
                </div>

                <Card className="auth-card">
                    <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>Welcome Back</h2>

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
                                { required: true, message: 'Please enter your email' },
                                { type: 'email', message: 'Please enter a valid email address' }
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
                                { required: true, message: 'Please enter your password' },
                                { min: 6, message: 'Password must be at least 6 characters' }
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                            />
                        </Form.Item>

                        <Form.Item>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Form.Item name="remember" valuePropName="checked" noStyle>
                                    <Checkbox>Remember me</Checkbox>
                                </Form.Item>
                                <a
                                    onClick={handleForgotPassword}
                                    className="auth-link"
                                    style={{ cursor: 'pointer' }}
                                >
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
                            Don't have an account? <a onClick={() => navigate('/auth/register')} className="auth-link">Sign up</a>
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