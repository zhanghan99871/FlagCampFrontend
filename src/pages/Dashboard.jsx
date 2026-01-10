import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Empty, Avatar, Dropdown, Tag } from "antd";
import {
  PlusOutlined,
  UserOutlined,
  LogoutOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  EditOutlined,
  DeleteOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth/login");
      return;
    }

    // 获取用户信息
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // 加载假数据行程
    loadFakeTrips();
  }, [navigate]);

  const loadFakeTrips = () => {
    // 假数据：已有的行程（按时间由近到远）
    const fakeTrips = [
      {
        id: 4,
        city: "New York City",
        startDate: "2026-02-15",
        endDate: "2026-02-20",
        duration: 6,
        poiCount: 8,
        thumbnail: "🗽",
        status: "upcoming",
      },
      {
        id: 2,
        city: "New York City",
        startDate: "2026-01-10",
        endDate: "2026-01-13",
        duration: 4,
        poiCount: 5,
        thumbnail: "🏙️",
        status: "upcoming",
      },
      {
        id: 3,
        city: "New York City",
        startDate: "2025-12-20",
        endDate: "2025-12-25",
        duration: 6,
        poiCount: 10,
        thumbnail: "🎄",
        status: "past",
      },
    ];

    // 按日期排序（近到远）
    fakeTrips.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    setTrips(fakeTrips);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth/login");
  };

  const handleNewTrip = () => {
    // TODO: 跳转到地图创建页面
    alert("Coming soon: Create new itinerary");
  };

  const handleViewTrip = (tripId) => {
    // TODO: 跳转到行程详情页
    // alert(`View trip ${tripId}`);
    navigate(`/itinerary/${tripId}`);
  };

  const handleEditTrip = (tripId) => {
    // TODO: 跳转到编辑页面
    alert(`Edit trip ${tripId}`);
  };

  const handleDeleteTrip = (tripId) => {
    if (window.confirm("Are you sure you want to delete this trip?")) {
      setTrips(trips.filter((t) => t.id !== tripId));
    }
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  if (!user) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* 顶部导航栏 */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h1 className="dashboard-logo">🌍 Trip Planner</h1>
        </div>
        <div className="dashboard-header-right">
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="user-profile">
              <Avatar size={36} icon={<UserOutlined />} />
              <span className="user-name">{user.username || user.email}</span>
            </div>
          </Dropdown>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="dashboard-content">
        <div className="dashboard-title-bar">
          <div>
            <h2 className="dashboard-title">My Trips</h2>
            <p className="dashboard-subtitle">
              Plan and manage your travel itineraries
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={handleNewTrip}
            className="new-trip-button"
          >
            New Itinerary
          </Button>
        </div>

        {/* 行程列表 */}
        {trips.length === 0 ? (
          <Empty description="No trips yet" style={{ marginTop: 60 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleNewTrip}
            >
              Create Your First Trip
            </Button>
          </Empty>
        ) : (
          <div className="trips-grid">
            {trips.map((trip) => (
              <Card
                key={trip.id}
                hoverable
                className="trip-card"
                onClick={() => handleViewTrip(trip.id)}
                actions={[
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditTrip(trip.id);
                    }}
                  >
                    Edit
                  </Button>,
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTrip(trip.id);
                    }}
                  >
                    Delete
                  </Button>,
                ]}
              >
                <div className="trip-card-header">
                  <div className="trip-thumbnail">{trip.thumbnail}</div>
                  <Tag color={trip.status === "upcoming" ? "blue" : "default"}>
                    {trip.status === "upcoming" ? "Upcoming" : "Past"}
                  </Tag>
                </div>
                <h3 className="trip-city">{trip.city}</h3>
                <div className="trip-info">
                  <div className="trip-info-item">
                    <CalendarOutlined />
                    <span>
                      {trip.startDate} - {trip.endDate}
                    </span>
                  </div>
                  <div className="trip-info-item">
                    <EnvironmentOutlined />
                    <span>{trip.poiCount} Places</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
