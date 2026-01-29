import React, { useState } from 'react';
import './App.css';

// --- 辅助函数 ---
const generateWellsForSize = (size) => {
  const rows = size === 96 ? 8 : (size === 48 ? 6 : (size === 24 ? 4 : (size === 12 ? 3 : 2)));
  const cols = size === 96 ? 12 : (size === 48 ? 8 : (size === 24 ? 6 : (size === 12 ? 4 : 3)));
  
  const newWells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const rowLabel = String.fromCharCode(65 + r);
      const colLabel = c + 1;
      newWells.push({
        id: `${rowLabel}${colLabel}`,
        label: '', 
        color: '#ffffff',
        status: 'empty' 
      });
    }
  }
  return newWells;
};

// 初始化仓库
const initialStore = {
  6: generateWellsForSize(6),
  12: generateWellsForSize(12),
  24: generateWellsForSize(24),
  48: generateWellsForSize(48),
  96: generateWellsForSize(96),
};

function App() {
  const [format, setFormat] = useState(96);
  const [plateStore, setPlateStore] = useState(initialStore);
  const currentWells = plateStore[format];
  
  // 交互状态
  const [isSelecting, setIsSelecting] = useState(false); 
  const [selectedWells, setSelectedWells] = useState([]); 
  
  // 弹窗状态
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ name: '', color: '#3b82f6' });

  // --- 鼠标交互 ---
  const handleMouseDown = (id) => {
    setIsSelecting(true);
    setSelectedWells([id]);
  };

  const handleMouseEnter = (id) => {
    if (isSelecting && !selectedWells.includes(id)) {
      setSelectedWells(prev => [...prev, id]);
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    if (selectedWells.length > 0) {
      setModalData({ name: '', color: '#3b82f6' }); 
      setShowModal(true);
    }
  };

  // --- 应用设置 ---
  const applySettings = () => {
    if (!modalData.name) {
      alert("请输入分组名称！");
      return;
    }

    const newWells = currentWells.map(well => {
      if (selectedWells.includes(well.id)) {
        return { 
          ...well, 
          color: modalData.color, 
          label: modalData.name,
          status: 'filled'
        };
      }
      return well;
    });

    setPlateStore(prev => ({ ...prev, [format]: newWells }));
    setShowModal(false);
    setSelectedWells([]);
  };

  const cancelSelection = () => {
    setShowModal(false);
    setSelectedWells([]);
  };

  const clearCurrentCanvas = () => {
    if(confirm(`确定要清空当前的 ${format} 孔板吗？`)) {
      setPlateStore(prev => ({
        ...prev,
        [format]: generateWellsForSize(format)
      }));
    }
  };

  const getGridCols = () => {
    if (format === 96) return 12;
    if (format === 48) return 8;
    if (format === 24) return 6;
    if (format === 12) return 4;
    return 3;
  };

  // ⭐⭐ 核心修改：统计全局所有孔板的数据 ⭐⭐
  const getGlobalLegendData = () => {
    const stats = {};
    
    // 遍历仓库中所有规格 (6, 12, 24, 48, 96)
    Object.values(plateStore).forEach(wells => {
      wells.forEach(well => {
        if (well.status === 'filled') {
          const key = well.label;
          if (!stats[key]) { 
            stats[key] = { color: well.color, count: 0 }; 
          }
          stats[key].count += 1;
        }
      });
    });

    return Object.entries(stats);
  };

  const legendList = getGlobalLegendData();

  return (
    <div className="app-container" onMouseUp={() => setIsSelecting(false)}>
      <header className="header">
        <h1>孔板配色小工具</h1> 
        <div className="header-actions"></div>
      </header>

      <div className="toolbar">
        {[6, 12, 24, 48, 96].map(size => (
          <button key={size} className={`seg-btn ${format === size ? 'active' : ''}`} onClick={() => setFormat(size)}>
            {size} 孔
          </button>
        ))}
      </div>

      <div className="main-area">
        {/* --- 左侧：纯净画布 --- */}
        <div className="canvas-wrapper">
          <div className="plate-card">
            <div className="plate-header-info">
              <h3>{format} Well Plate</h3>
            </div>

            <div className="plate-grid" style={{ gridTemplateColumns: `repeat(${getGridCols()}, 1fr)` }}>
              {currentWells.map((well) => {
                const isSelected = selectedWells.includes(well.id);
                const displayText = well.status === 'filled' ? well.label.slice(0, 3) : well.id;
                
                return (
                  <div
                    key={well.id}
                    className={`well ${isSelected ? 'temp-selected' : ''}`}
                    style={{ 
                      backgroundColor: isSelected ? '#dbeafe' : well.color,
                      color: (well.status === 'filled' && well.color === '#000000') ? '#fff' : '#4b5563',
                      borderColor: (well.status === 'filled') ? well.color : '#d1d5db'
                    }}
                    onMouseDown={() => handleMouseDown(well.id)}
                    onMouseEnter={() => handleMouseEnter(well.id)}
                    onMouseUp={handleMouseUp}
                    title={`孔位: ${well.id}\n名称: ${well.label || '未命名'}`}
                  >
                    <span className="well-text">{displayText}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* --- 右侧：全局统计面板 --- */}
        <div className="side-panel">
          <div className="panel-header">
            <h3>📊 全局统计</h3>
            <span className="badge">{legendList.length} 组</span>
          </div>

          <div className="stats-container">
            {legendList.length === 0 ? (
              <div className="empty-state">
                <p>暂无数据</p>
                <span>请框选左侧孔位进行标记</span>
              </div>
            ) : (
              <div className="stats-list-vertical">
                {legendList.map(([name, data]) => (
                  <div key={name} className="stat-row">
                    <div className="stat-info">
                      <span className="stat-color-dot" style={{backgroundColor: data.color}}></span>
                      <span className="stat-name">{name}</span>
                    </div>
                    <span className="stat-count">{data.count} 孔</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel-footer">
            <button className="btn-block btn-danger-outline" onClick={clearCurrentCanvas}>
              🗑️ 清空当前孔板
            </button>
          </div>
        </div>
      </div>

      {/* 弹窗 (Modal) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>📝 标记区域</h3>
            <p className="modal-desc">已选中 <strong>{selectedWells.length}</strong> 个孔位</p>
            <div className="form-group">
              <label>分组名称</label>
              <input autoFocus type="text" placeholder="例如：Control" value={modalData.name} onChange={(e) => setModalData({...modalData, name: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && applySettings()} />
            </div>
            <div className="form-group">
              <label>标记颜色</label>
              <div className="color-palette">
                {['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b', '#000000'].map(c => (
                  <div key={c} className={`color-dot ${modalData.color === c ? 'active' : ''}`} style={{ backgroundColor: c }} onClick={() => setModalData({...modalData, color: c})} />
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={cancelSelection}>取消</button>
              <button className="btn btn-primary" onClick={applySettings}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;