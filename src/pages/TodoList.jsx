import { useState, useEffect } from 'react';
import { fetchSheetData, addSheetData, updateSheetData, deleteSheetData } from '../api/sheetApi';
import { Plus, Edit2, Trash2, X, AlertCircle, Clock, CheckCircle } from 'lucide-react';

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    Tugas: "", Kategori: "", Urgensi: "Sedang", "Estimasi Waktu": "", Status: "Belum", Deadline: "", Keterangan: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchSheetData('To-Do List');
      // Sort by status (Belum first) then roughly by Urgency if possible
      const sortedData = data.sort((a, b) => {
        if (a.Status === 'Selesai' && b.Status !== 'Selesai') return 1;
        if (a.Status !== 'Selesai' && b.Status === 'Selesai') return -1;
        return 0;
      });
      setTodos(sortedData);
    } catch (error) {
      console.error("Failed to load todos", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData(item);
    } else {
      setFormData({ Tugas: "", Kategori: "Administrasi", Urgensi: "Tinggi", "Estimasi Waktu": "12 Bulan Sebelum", Status: "Belum", Deadline: "", Keterangan: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateSheetData('To-Do List', formData);
      } else {
        await addSheetData('To-Do List', formData);
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      alert("Gagal menyimpan tugas");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Hapus tugas ini?")) {
      try {
        await deleteSheetData('To-Do List', id);
        loadData();
      } catch (error) {
        alert("Gagal menghapus tugas");
      }
    }
  };

  const toggleStatus = async (item) => {
    const newStatus = item.Status === 'Selesai' ? 'Belum' : 'Selesai';
    const updatedItem = { ...item, Status: newStatus };
    
    // Optimistic update
    setTodos(todos.map(t => t.ID === item.ID ? updatedItem : t));
    
    if (newStatus === 'Selesai') {
      window.dispatchEvent(new CustomEvent('celebrate', { detail: { type: 'task' } }));
    }
    
    try {
      await updateSheetData('To-Do List', updatedItem);
    } catch (error) {
      alert("Gagal mengupdate status");
      loadData(); // Revert on fail
    }
  };

  const completedCount = todos.filter(t => t.Status === 'Selesai').length;
  const progress = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;

  const getUrgencyColor = (urgensi) => {
    switch(urgensi) {
      case 'Tinggi (Wajib Awal)': return 'var(--color-danger)';
      case 'Tinggi': return 'var(--color-danger)';
      case 'Sedang': return 'var(--color-warning)';
      case 'Rendah': return 'var(--color-success)';
      default: return 'var(--color-text-muted)';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 style={{ fontSize: '1.5rem' }}>Planning & To-Do List</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Tambah Tugas
        </button>
      </div>

      <div className="card mb-4">
        <h3 className="mb-2 text-muted" style={{ fontSize: '0.875rem' }}>Progress Keseluruhan</h3>
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold" style={{ fontSize: '1.5rem' }}>{progress.toFixed(0)}%</span>
          <span className="text-muted">{completedCount} dari {todos.length} Tugas Selesai</span>
        </div>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {loading ? (
        <div>Memuat To-Do List...</div>
      ) : (
        <div className="grid gap-4">
          {todos.map(item => (
            <div 
              key={item.ID} 
              className="card flex items-center justify-between"
              style={{ 
                opacity: item.Status === 'Selesai' ? 0.6 : 1,
                borderLeft: `4px solid ${getUrgencyColor(item.Urgensi)}`
              }}
            >
              <div className="flex items-center gap-4 w-full">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    className="checkbox-input"
                    checked={item.Status === 'Selesai'}
                    onChange={() => toggleStatus(item)}
                  />
                </label>
                
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold" style={{ textDecoration: item.Status === 'Selesai' ? 'line-through' : 'none' }}>
                      {item.Tugas}
                    </span>
                    {item.Urgensi.includes('Tinggi') && <AlertCircle size={14} color="var(--color-danger)" />}
                    {item.Status === 'Selesai' && <CheckCircle size={14} color="var(--color-success)" />}
                  </div>
                  
                  <div className="flex items-center gap-4 text-muted" style={{ fontSize: '0.75rem' }}>
                    <span className="badge badge-secondary">{item.Kategori}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {item['Estimasi Waktu']}
                    </span>
                    {item.Keterangan && <span>• {item.Keterangan}</span>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="btn-icon" onClick={() => handleOpenModal(item)}><Edit2 size={16} /></button>
                  <button className="btn-icon text-danger" onClick={() => handleDelete(item.ID)} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
          {todos.length === 0 && (
            <div className="text-center text-muted card">Belum ada tugas dalam daftar.</div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Tugas' : 'Tambah Tugas'}</h3>
              <button className="btn-icon" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Tugas</label>
                <input type="text" className="form-input" name="Tugas" value={formData.Tugas} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select className="form-select" name="Kategori" value={formData.Kategori} onChange={handleChange} required>
                    <option value="Administrasi">Administrasi</option>
                    <option value="Venue/Tempat">Venue/Tempat</option>
                    <option value="Vendor Utama">Vendor Utama</option>
                    <option value="Perencanaan Awal">Perencanaan Awal</option>
                    <option value="Keuangan">Keuangan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Urgensi</label>
                  <select className="form-select" name="Urgensi" value={formData.Urgensi} onChange={handleChange} required>
                    <option value="Tinggi (Wajib Awal)">Tinggi (Wajib Awal)</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Estimasi Waktu (Saran kapan diurus)</label>
                <input type="text" className="form-input" name="Estimasi Waktu" value={formData['Estimasi Waktu']} onChange={handleChange} placeholder="Misal: 6-12 Bulan Sebelum H" required />
              </div>
              <div className="form-group">
                <label className="form-label">Keterangan Tambahan</label>
                <textarea className="form-input" name="Keterangan" value={formData.Keterangan} onChange={handleChange}></textarea>
              </div>
              <div className="mt-4 flex justify-between">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoList;
