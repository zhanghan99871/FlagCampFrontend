import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Timeline,
  Button,
  Card,
  Space,
  Typography,
  Spin,
  Tag,
  Collapse,
  Layout,
  Divider,
} from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

import { apiFetch } from "../api/client";
import ItineraryMap from "./ItineraryMap.jsx";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const ItineraryList = () => {
  const { itineraryId } = useParams(); // Get the ID from the URL
  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState({ days: [] }); // Stores the structured backend data
  const [selectedDay, setSelectedDay] = useState(null);
  const [poiDetails, setPoiDetails] = useState({});

  useEffect(() => {
    const fetchItineraryAndDetails = async () => {
      try {
        setLoading(true);
        // 1. Fetch the main itinerary
        //const response = await apiFetch("/itineraries/4/content");
        const response = await apiFetch(`/itineraries/${itineraryId}/content`);

        if (response && response.success) {
          const itineraryData = response.data.data;
          console.log("Itinerary Loaded:", itineraryData);

          // 2. Extract unique POI IDs
          const poiIds = [
            ...new Set(
              itineraryData.days.flatMap((day) => day.pois.map((p) => p.poiId))
            ),
          ];

          // 3. Fetch POI details individually
          const detailsMap = {};
          await Promise.all(
            poiIds.map(async (id) => {
              try {
                const res = await apiFetch(`/pois/${id}`);
                if (res && res.success) {
                  detailsMap[id] = res.data;
                }
              } catch (e) {
                console.error(`Failed to fetch POI ${id}`, e);
              }
            })
          );

          console.log("POI Details Loaded:", detailsMap);

          // 4. Update states
          setPoiDetails({ ...detailsMap });
          setItinerary(itineraryData);
        }
      } catch (err) {
        console.error("Global fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItineraryAndDetails();
  }, [itineraryId]);

  useEffect(() => {
    if (itinerary?.days?.length > 0) {
      const dayExists = itinerary.days.some((d) => d.day === selectedDay);
      if (!dayExists && selectedDay !== null) {
        setSelectedDay(null);
      }
    }
  }, [itinerary, selectedDay]);

  // 2. Filter the Map Activities based on selectedDay
  const activities = useMemo(() => {
    if (!itinerary?.days) return [];

    const targetDay = itinerary.days.find((d) => d.day === selectedDay);
    if (!targetDay) return [];

    return targetDay.pois
      .map((poi) => {
        //const details = fakeTrips.find((f) => f.id === poi.poiId);
        const details = poiDetails[poi.poiId] || {};
        return {
          ...poi,
          lat: details?.lat,
          lng: details?.lng,
          name: details?.name || `Place ${poi.poiId}`,
          type: details?.type,
        };
      })
      .filter((item) => item.lat && item.lng);
  }, [itinerary, selectedDay, poiDetails]);

  // Logic to change the order of POIs

  const movePoi = (poiId, dayNumber, direction) => {
    setItinerary((prev) => {
      const dayNum = Number(dayNumber);
      const dayIndex = prev.days.findIndex((d) => Number(d.day) === dayNum);
      if (dayIndex === -1) return prev;

      const currentPois = [...prev.days[dayIndex].pois];
      const poiIndex = currentPois.findIndex((p) => p.poiId === poiId);
      if (poiIndex === -1) return prev;

      const newDays = [...prev.days];

      // INTERNAL MOVE
      if (direction === "up" && poiIndex > 0) {
        [currentPois[poiIndex], currentPois[poiIndex - 1]] = [
          currentPois[poiIndex - 1],
          currentPois[poiIndex],
        ];
        newDays[dayIndex] = { ...newDays[dayIndex], pois: currentPois };
      } else if (direction === "down" && poiIndex < currentPois.length - 1) {
        [currentPois[poiIndex], currentPois[poiIndex + 1]] = [
          currentPois[poiIndex + 1],
          currentPois[poiIndex],
        ];
        newDays[dayIndex] = { ...newDays[dayIndex], pois: currentPois };
      }
      // DAY CROSSING (Up to previous day)
      else if (direction === "up" && dayIndex > 0) {
        const movedItem = currentPois.splice(poiIndex, 1)[0];
        const prevDayPois = [...prev.days[dayIndex - 1].pois, movedItem];
        newDays[dayIndex] = { ...newDays[dayIndex], pois: currentPois };
        newDays[dayIndex - 1] = { ...newDays[dayIndex - 1], pois: prevDayPois };
      }
      // DAY CROSSING (Down to next day)
      else if (direction === "down" && dayIndex < prev.days.length - 1) {
        const movedItem = currentPois.splice(poiIndex, 1)[0];
        const nextDayPois = [movedItem, ...prev.days[dayIndex + 1].pois];
        newDays[dayIndex] = { ...newDays[dayIndex], pois: currentPois };
        newDays[dayIndex + 1] = { ...newDays[dayIndex + 1], pois: nextDayPois };
      }

      return { ...prev, days: newDays };
    });
  };

  // pois summary items for Collapse
  const collapseItems = useMemo(() => {
    if (!itinerary?.days) return [];

    return itinerary.days.map((dayObj) => {
      // 1. Get the names for the header summary
      const firstPoiId = dayObj.pois[0]?.poiId;
      const lastPoiId = dayObj.pois[dayObj.pois.length - 1]?.poiId;

      const startName = poiDetails[firstPoiId]?.name;
      const endName = poiDetails[lastPoiId]?.name;

      // 2. Create the route summary string
      let routeSummary = "";
      if (startName) {
        routeSummary =
          dayObj.pois.length > 1 && endName && startName !== endName
            ? `${startName} → ${endName}`
            : startName;
      }

      return {
        key: dayObj.day.toString(),
        label: (
          <div
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Space>
                <Text strong style={{ fontSize: "16px" }}>
                  Day {dayObj.day}
                </Text>
                <Tag color="blue">{dayObj.pois.length} stops</Tag>
              </Space>
            </div>
            {/* This adds the point names to the header */}
            <div style={{ marginTop: "4px" }}>
              <Text type="secondary" style={{ fontSize: "12px" }} italic>
                {dayObj.pois.length > 0 ? routeSummary : "No points added yet"}
              </Text>
            </div>
          </div>
        ),
        children: (
          <Timeline
            mode="left"
            style={{ marginTop: "15px" }}
            items={dayObj.pois.map((poi, index) => {
              //const details = fakeTrips.find((f) => f.id === poi.poiId) || {};
              const details = poiDetails[poi.poiId] || {};
              return {
                children: (
                  <Card size="small" hoverable>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <Text strong>{details.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: "11px" }}>
                          {details.type}
                        </Text>
                      </div>

                      {/* ACTION BUTTONS  */}
                      <Space>
                        <Button
                          size="small"
                          icon={<ArrowUpOutlined />}
                          disabled={dayObj.day === 1 && index === 0}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            movePoi(poi.poiId, dayObj.day, "up"); // CORRECTED ARGUMENTS
                          }}
                        />
                        <Button
                          size="small"
                          icon={<ArrowDownOutlined />}
                          disabled={
                            dayObj.day === itinerary.days.length &&
                            index === dayObj.pois.length - 1
                          }
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            movePoi(poi.poiId, dayObj.day, "down"); // CORRECTED ARGUMENTS
                          }}
                        />
                      </Space>
                    </div>
                  </Card>
                ),
              };
            })}
          />
        ),
      };
    });
  }, [itinerary, poiDetails]); // Recalculate when data or selection changes

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" tip="Loading your trip..." />
      </div>
    );
  }

  return (
    <Layout style={{ height: "100vh", width: "500", overflow: "hidden" }}>
      <Header
        style={{
          background: "#fff",
          padding: "10px 24px",
          lineHeight: "normal",
          height: "auto", // Let the content determine the height
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 2 }}>
            {itinerary.title || "My NYC Itinerary"}
          </Title>
          <Space split={<Divider type="vertical" />}>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              <CalendarOutlined /> {itinerary.days.length} Days
            </Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              <EnvironmentOutlined />{" "}
              {itinerary.days.reduce((sum, d) => sum + d.pois.length, 0)} Stops
            </Text>
          </Space>
        </Space>
      </Header>

      {/* --- THE MAIN CONTENT (SIDEBAR + MAP) --- */}
      <Content style={{ display: "flex", overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            height: "100vh",
            width: "100vw",
            overflow: "hidden",
          }}
        >
          {/* Left Side: Itinerary List (Fixed Width) */}
          <div
            style={{
              width: "550px",
              borderRight: "1px solid #ddd",
              overflowY: "auto",
              padding: "20px",
            }}
          >
            <Typography.Title level={2}>Trip Itinerary</Typography.Title>

            {/* Timeline Inside the Sidebar Div */}

            <Collapse
              accordion // Only one day open at a time
              activeKey={selectedDay ? selectedDay.toString() : null}
              onChange={(key) => {
                if (!key) {
                  setSelectedDay(null);
                } else {
                  setSelectedDay(parseInt(key));
                }
              }}
              expandIconPosition="end"
              style={{ background: "transparent", border: "none" }}
              items={collapseItems}
            />

            {/* TO- */}
            <Button type="primary" block style={{ marginBottom: 20 }}>
              Save Changes
            </Button>
          </div>

          {/* Right side. MAP FRAME */}
          <ItineraryMap activities={activities} selectedDay={selectedDay} />
        </div>
      </Content>
    </Layout>
  );
};

export default ItineraryList;
