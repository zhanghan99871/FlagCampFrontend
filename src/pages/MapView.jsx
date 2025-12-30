import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Input,
    Button,
    Card,
    Tag,
    Rate,
    message
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    ArrowLeftOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    SaveOutlined,
    DeleteOutlined,
    DragOutlined
} from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

const { Search } = Input;

// 修复 Leaflet 默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// 纽约市中心坐标
const NYC_CENTER = [40.7580, -73.9855];

// 假数据：NYC 热门景点
const FAKE_POIS = [
    {
        id: 'poi-1',
        name: 'Statue of Liberty',
        type: 'Monument',
        rating: 4.8,
        location: [40.6892, -74.0445],
        hours: '9:00 AM - 5:00 PM',
        description: 'Iconic copper statue, a gift from France',
        category: 'Attraction'
    },
    {
        id: 'poi-2',
        name: 'Central Park',
        type: 'Park',
        rating: 4.7,
        location: [40.7829, -73.9654],
        hours: '6:00 AM - 1:00 AM',
        description: 'Huge urban park with lakes, theaters & gardens',
        category: 'Nature'
    },
    {
        id: 'poi-3',
        name: 'Times Square',
        type: 'Landmark',
        rating: 4.6,
        location: [40.7580, -73.9855],
        hours: 'Open 24 hours',
        description: 'Bustling commercial intersection',
        category: 'Attraction'
    },
    {
        id: 'poi-4',
        name: 'Empire State Building',
        type: 'Landmark',
        rating: 4.7,
        location: [40.7484, -73.9857],
        hours: '8:00 AM - 2:00 AM',
        description: 'Iconic Art Deco skyscraper',
        category: 'Attraction'
    },
    {
        id: 'poi-5',
        name: 'Metropolitan Museum of Art',
        type: 'Museum',
        rating: 4.8,
        location: [40.7794, -73.9632],
        hours: '10:00 AM - 5:00 PM',
        description: 'Vast art museum on Museum Mile',
        category: 'Culture'
    },
    {
        id: 'poi-6',
        name: 'Brooklyn Bridge',
        type: 'Bridge',
        rating: 4.7,
        location: [40.7061, -73.9969],
        hours: 'Open 24 hours',
        description: 'Iconic suspension bridge to Brooklyn',
        category: 'Attraction'
    },
    {
        id: 'poi-7',
        name: 'One World Trade Center',
        type: 'Landmark',
        rating: 4.7,
        location: [40.7127, -74.0134],
        hours: '9:00 AM - 9:00 PM',
        description: 'Tallest building in Western Hemisphere',
        category: 'Attraction'
    },
    {
        id: 'poi-8',
        name: 'The High Line',
        type: 'Park',
        rating: 4.6,
        location: [40.7480, -74.0048],
        hours: '7:00 AM - 10:00 PM',
        description: 'Elevated linear park on former railroad',
        category: 'Nature'
    }
];

// 创建自定义带编号的图标
const createNumberedIcon = (number) => {
    return L.divIcon({
        className: 'custom-numbered-icon',
        html: `<div class="marker-pin">
             <span class="marker-number">${number}</span>
           </div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -42]
    });
};

// 可拖拽的 POI 项组件
function SortablePOIItem({ poi, index, onRemove }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: poi.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="sortable-poi-item">
            <div className="poi-drag-handle" {...attributes} {...listeners}>
                <DragOutlined />
            </div>
            <div className="poi-item-number">{index + 1}</div>
            <div className="poi-item-content">
                <span className="poi-item-name">{poi.name}</span>
                <Tag color="blue">{poi.type}</Tag>
            </div>
            <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => onRemove(poi.id)}
            />
        </div>
    );
}

export default function MapView() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [addedPOIs, setAddedPOIs] = useState([]);
    const [expandedCards, setExpandedCards] = useState([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 搜索 POI
    const handleSearch = (value) => {
        if (!value.trim()) {
            setSearchResults([]);
            return;
        }

        // 假数据过滤
        const results = FAKE_POIS.filter(poi =>
            poi.name.toLowerCase().includes(value.toLowerCase()) ||
            poi.type.toLowerCase().includes(value.toLowerCase()) ||
            poi.category.toLowerCase().includes(value.toLowerCase())
        );

        setSearchResults(results);

        if (results.length === 0) {
            message.info('No places found');
        }
    };

    // 添加 POI 到行程
    const handleAddPOI = (poi) => {
        if (addedPOIs.find(p => p.id === poi.id)) {
            message.warning('This place is already in your itinerary');
            return;
        }

        setAddedPOIs([...addedPOIs, poi]);
        message.success(`Added ${poi.name} to itinerary`);
    };

    // 移除 POI
    const handleRemovePOI = (poiId) => {
        setAddedPOIs(addedPOIs.filter(p => p.id !== poiId));
        message.info('Place removed from itinerary');
    };

    // 切换卡片展开/收起
    const toggleCardExpand = (poiId) => {
        setExpandedCards(prev =>
            prev.includes(poiId)
                ? prev.filter(id => id !== poiId)
                : [...prev, poiId]
        );
    };

    // 拖拽结束处理
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setAddedPOIs((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // 保存行程
    const handleSave = () => {
        if (addedPOIs.length === 0) {
            message.warning('Please add at least one place to your itinerary');
            return;
        }

        // TODO: 调用后端 API 保存
        console.log('Saving itinerary:', addedPOIs);
        message.success('Itinerary saved successfully!');

        setTimeout(() => {
            navigate('/dashboard');
        }, 1000);
    };

    return (
        <div className="map-view-container">
            {/* 顶部导航栏 */}
            <div className="map-view-header">
                <h1 className="map-view-logo">🌍 Trip Planner</h1>
                <div className="map-view-actions">
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSave}
                        size="large"
                    >
                        Save Itinerary
                    </Button>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/dashboard')}
                        size="large"
                    >
                        Back
                    </Button>
                </div>
            </div>

            {/* 主内容区 */}
            <div className="map-view-content">
                {/* 左侧边栏 */}
                <div className="map-sidebar">
                    <div className="sidebar-search">
                        <Search
                            placeholder="Search places in NYC..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            onSearch={handleSearch}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* 搜索结果列表 */}
                    <div className="sidebar-results">
                        {searchResults.length === 0 && searchQuery ? (
                            <div className="no-results">No places found</div>
                        ) : searchResults.length === 0 ? (
                            <div className="no-results">
                                <SearchOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                                <p>Search for places to add to your itinerary</p>
                            </div>
                        ) : (
                            searchResults.map(poi => {
                                const isExpanded = expandedCards.includes(poi.id);
                                const isAdded = addedPOIs.find(p => p.id === poi.id);

                                return (
                                    <Card
                                        key={poi.id}
                                        className={`poi-card ${isExpanded ? 'expanded' : ''}`}
                                        hoverable
                                        onClick={() => toggleCardExpand(poi.id)}
                                    >
                                        <div className="poi-card-header">
                                            <div className="poi-card-title">
                                                <h4>{poi.name}</h4>
                                                <Tag color="purple">{poi.type}</Tag>
                                            </div>
                                            <Button
                                                type="primary"
                                                shape="circle"
                                                icon={<PlusOutlined />}
                                                disabled={isAdded}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddPOI(poi);
                                                }}
                                            />
                                        </div>

                                        {isExpanded && (
                                            <div className="poi-card-details">
                                                <div className="poi-detail-item">
                                                    <Rate disabled defaultValue={poi.rating} allowHalf />
                                                    <span className="rating-text">{poi.rating}</span>
                                                </div>
                                                <div className="poi-detail-item">
                                                    <ClockCircleOutlined />
                                                    <span>{poi.hours}</span>
                                                </div>
                                                <div className="poi-detail-item">
                                                    <EnvironmentOutlined />
                                                    <span>{poi.category}</span>
                                                </div>
                                                <p className="poi-description">{poi.description}</p>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 地图区域 */}
                <div className="map-container">
                    <MapContainer
                        center={NYC_CENTER}
                        zoom={12}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* 显示所有已添加的 POI 标记 */}
                        {addedPOIs.map((poi, index) => (
                            <Marker
                                key={poi.id}
                                position={poi.location}
                                icon={createNumberedIcon(index + 1)}
                            >
                                <Popup>
                                    <div style={{ minWidth: 150 }}>
                                        <h4 style={{ margin: '0 0 8px 0' }}>{poi.name}</h4>
                                        <p style={{ margin: '4px 0', fontSize: 12, color: '#666' }}>
                                            <ClockCircleOutlined /> {poi.hours}
                                        </p>
                                        <Rate disabled defaultValue={poi.rating} allowHalf style={{ fontSize: 12 }} />
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>

            {/* 底部行程时间线 */}
            {addedPOIs.length > 0 && (
                <div className="map-timeline">
                    <div className="timeline-header">
                        <h3>Your Itinerary ({addedPOIs.length} places)</h3>
                    </div>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={addedPOIs.map(p => p.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="timeline-items">
                                {addedPOIs.map((poi, index) => (
                                    <React.Fragment key={poi.id}>
                                        <SortablePOIItem
                                            poi={poi}
                                            index={index}
                                            onRemove={handleRemovePOI}
                                        />
                                        {index < addedPOIs.length - 1 && (
                                            <div className="timeline-arrow">→</div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            )}
        </div>
    );
}