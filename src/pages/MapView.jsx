import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Button,
    Card,
    Input,
    Layout,
    List,
    Space,
    Tag,
    Typography,
    DatePicker,
    message,
} from "antd";
import {
    DeleteOutlined,
    MenuOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "./MapView.css";

const { RangePicker } = DatePicker;

const DEFAULT_CENTER = { lat: 40.758, lng: -73.9855 };
const DEFAULT_ZOOM = 12;

const initialPois = [
    {
        id: "poi-1",
        name: "Times Square",
        lat: "40.7580",
        lng: "-73.9855",
    },
    {
        id: "poi-2",
        name: "Central Park",
        lat: "40.7812",
        lng: "-73.9665",
    },
    {
        id: "poi-3",
        name: "Brooklyn Bridge",
        lat: "40.7061",
        lng: "-73.9969",
    },
];

function loadGoogleMaps(apiKey, mapId) {
    if (window.google?.maps?.places && (!mapId || window.google?.maps?.marker)) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const existing = document.querySelector(
            mapId
                ? "script[data-google-maps-places-marker]"
                : "script[data-google-maps-places]"
        );
        if (existing) {
            existing.addEventListener("load", resolve);
            existing.addEventListener("error", reject);
            return;
        }

        const script = document.createElement("script");
        const libraries = mapId ? "places,marker" : "places";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries}&v=weekly`;
        script.async = true;
        script.defer = true;
        if (mapId) {
            script.dataset.googleMapsPlacesMarker = "true";
        } else {
            script.dataset.googleMapsPlaces = "true";
        }
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export default function MapView() {
    const navigate = useNavigate();
    const [pois, setPois] = useState(initialPois);
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const dragIndexRef = useRef(null);
    const autocompleteContainerRef = useRef(null);
    const autocompleteElementRef = useRef(null);

    const apiKey = useMemo(
        () => process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
        []
    );
    const mapId = useMemo(
        () => process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || "",
        []
    );

    const invalidPoiNames = useMemo(() => {
        return pois
            .filter(
                (poi) =>
                    !isFinite(parseFloat(poi.lat)) || !isFinite(parseFloat(poi.lng))
            )
            .map((poi) => poi.name || "(unnamed)");
    }, [pois]);

    useEffect(() => {
        let isMounted = true;

        if (!apiKey) {
            setLoadError("Missing Google Maps API key.");
            return undefined;
        }

        loadGoogleMaps(apiKey, mapId)
            .then(() => {
                if (!isMounted) return;
                setIsLoaded(true);
            })
            .catch(() => {
                if (!isMounted) return;
                setLoadError("Failed to load Google Maps.");
            });

        return () => {
            isMounted = false;
        };
    }, [apiKey, mapId]);

    useEffect(() => {
        if (!isLoaded || !mapRef.current || mapInstanceRef.current) {
            return;
        }

        const map = new window.google.maps.Map(mapRef.current, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            mapTypeControl: false,
            fullscreenControl: false,
            ...(mapId ? { mapId } : {}),
        });

        mapInstanceRef.current = map;
    }, [isLoaded, mapId]);

    useEffect(() => {
        if (
            !isLoaded ||
            !autocompleteContainerRef.current ||
            autocompleteElementRef.current
        ) {
            return;
        }

        const LegacyAutocomplete = window.google?.maps?.places?.Autocomplete;

        autocompleteContainerRef.current.innerHTML = "";

        if (LegacyAutocomplete) {
            const inputEl = document.createElement("input");
            inputEl.type = "text";
            inputEl.placeholder = "Search and add places";
            inputEl.className = "mapview-search-input mapview-search-legacy";
            autocompleteContainerRef.current.appendChild(inputEl);

            const nycBounds = new window.google.maps.LatLngBounds(
                { lat: 40.4774, lng: -74.2591 },
                { lat: 40.9176, lng: -73.7004 }
            );

            const autocomplete = new LegacyAutocomplete(inputEl, {
                fields: ["geometry", "name"],
                bounds: nycBounds,
                strictBounds: false,
            });

            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                if (!place?.geometry?.location) {
                    return;
                }

                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const name = place.name || "New POI";
                const id = `poi-${Date.now()}`;
                setPois((prev) => [
                    ...prev,
                    { id, name, lat: String(lat), lng: String(lng) },
                ]);
                inputEl.value = "";
            });

            autocompleteElementRef.current = inputEl;
        }

        return () => {
            autocompleteElementRef.current = null;
        };
    }, [isLoaded]);

    useEffect(() => {
        if (!isLoaded || !mapInstanceRef.current) {
            return;
        }

        const map = mapInstanceRef.current;
        markersRef.current.forEach((marker) => {
            if (marker && typeof marker.setMap === "function") {
                marker.setMap(null);
                return;
            }
            if (marker && "map" in marker) {
                marker.map = null;
            }
        });
        markersRef.current = [];

        const parsedPois = pois
            .filter(
                (poi) => isFinite(parseFloat(poi.lat)) && isFinite(parseFloat(poi.lng))
            )
            .map((poi) => ({
                ...poi,
                lat: parseFloat(poi.lat),
                lng: parseFloat(poi.lng),
            }));

        const AdvancedMarkerElement =
            window.google?.maps?.marker?.AdvancedMarkerElement;
        const useAdvancedMarkers = Boolean(mapId) && AdvancedMarkerElement;
        markersRef.current = parsedPois.map((poi, index) => {
            if (useAdvancedMarkers) {
                const markerContent = document.createElement("div");
                markerContent.className = "mapview-marker";
                markerContent.textContent = String(index + 1);
                return new AdvancedMarkerElement({
                    map,
                    position: { lat: poi.lat, lng: poi.lng },
                    title: poi.name || `Stop ${index + 1}`,
                    content: markerContent,
                });
            }

            return new window.google.maps.Marker({
                position: { lat: poi.lat, lng: poi.lng },
                map,
                label: `${index + 1}`,
                title: poi.name || `Stop ${index + 1}`,
            });
        });

        if (parsedPois.length === 0) {
            map.setCenter(DEFAULT_CENTER);
            return;
        }

        if (parsedPois.length === 1) {
            map.setCenter({ lat: parsedPois[0].lat, lng: parsedPois[0].lng });
            map.setZoom(14);
            return;
        }
    }, [invalidPoiNames.length, isLoaded, mapId, pois]);

    const updatePoi = (id, field, value) => {
        setPois((prev) =>
            prev.map((poi) => (poi.id === id ? { ...poi, [field]: value } : poi))
        );
    };

    const deletePoi = (id) => {
        setPois((prev) => prev.filter((poi) => poi.id !== id));
    };

    const movePoi = (index, direction) => {
        setPois((prev) => {
            const next = [...prev];
            const target = index + direction;
            if (target < 0 || target >= next.length) return prev;
            const temp = next[index];
            next[index] = next[target];
            next[target] = temp;
            return next;
        });
    };

    const reorderPois = (fromIndex, toIndex) => {
        setPois((prev) => {
            if (fromIndex === null || toIndex === null || fromIndex === toIndex) {
                return prev;
            }
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    };

    const handleSave = () => {
        if (pois.length === 0) {
            message.warning("Please add at least one place to your itinerary");
            return;
        }

        if (!dateRange || !dateRange[0] || !dateRange[1]) {
            message.warning("Please select travel dates");
            return;
        }

        const itinerary = {
            pois,
            startDate: dateRange[0].format("YYYY-MM-DD"),
            endDate: dateRange[1].format("YYYY-MM-DD"),
        };

        console.log("Saving itinerary:", itinerary);
        message.success("Itinerary saved successfully!");

        setTimeout(() => {
            navigate("/dashboard");
        }, 1000);
    };

    const handleBack = () => {
        navigate("/dashboard");
    };

    return (
        <div className="mapview-container">
            <header className="mapview-header">
                <div className="mapview-header-left">
                    <h1 className="mapview-logo">🗺️ Route Builder</h1>
                </div>
                <div className="mapview-header-right">
                    <Space size="middle">
                        <RangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            format="YYYY-MM-DD"
                            placeholder={["Start Date", "End Date"]}
                            suffixIcon={<CalendarOutlined />}
                        />
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleSave}
                            size="large"
                        >
                            Save
                        </Button>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={handleBack}
                            size="large"
                        >
                            Back
                        </Button>
                    </Space>
                </div>
            </header>

            <Layout className="mapview-layout">
                <Layout.Sider width={360} className="mapview-sider">
                    <Card className="mapview-card">
                        <Typography.Title level={4} style={{ marginBottom: 4 }}>
                            NYC Route Planner
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            Search for places, add POIs, and drag items to reorder them.
                        </Typography.Text>

                        {loadError && <div className="mapview-error">{loadError}</div>}
                        {invalidPoiNames.length > 0 && (
                            <div className="mapview-error">
                                Fix lat/lng for: {invalidPoiNames.join(", ")}
                            </div>
                        )}

                        <div className="mapview-search" ref={autocompleteContainerRef} />

                        <List
                            dataSource={pois}
                            locale={{ emptyText: "No POIs yet" }}
                            renderItem={(poi, index) => (
                                <List.Item
                                    key={poi.id}
                                    className="mapview-poi-item"
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={() => {
                                        reorderPois(dragIndexRef.current, index);
                                        dragIndexRef.current = null;
                                    }}
                                >
                                    <Card className="mapview-poi-card" size="small">
                                        <Space direction="vertical" style={{ width: "100%" }}>
                                            <div className="mapview-poi-header">
                                                <Space>
                                                    <MenuOutlined
                                                        className="mapview-drag-handle"
                                                        draggable
                                                        onDragStart={(event) => {
                                                            dragIndexRef.current = index;
                                                            event.dataTransfer.effectAllowed = "move";
                                                        }}
                                                        onDragEnd={() => {
                                                            dragIndexRef.current = null;
                                                        }}
                                                    />
                                                    <Typography.Text strong>
                                                        Stop {index + 1}
                                                    </Typography.Text>
                                                </Space>
                                                <Space>
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        onClick={() => movePoi(index, -1)}
                                                        disabled={index === 0}
                                                    >
                                                        ↑
                                                    </Button>
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        onClick={() => movePoi(index, 1)}
                                                        disabled={index === pois.length - 1}
                                                    >
                                                        ↓
                                                    </Button>
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        size="small"
                                                        onClick={() => deletePoi(poi.id)}
                                                    />
                                                </Space>
                                            </div>
                                            <Input
                                                value={poi.name}
                                                onChange={(event) =>
                                                    updatePoi(poi.id, "name", event.target.value)
                                                }
                                                placeholder="POI name"
                                            />
                                        </Space>
                                    </Card>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Layout.Sider>

                <Layout.Content className="mapview-map">
                    {!isLoaded && !loadError && (
                        <div className="mapview-loading">Loading map...</div>
                    )}
                    <div ref={mapRef} className="mapview-map-canvas" />
                </Layout.Content>
            </Layout>
        </div>
    );
}