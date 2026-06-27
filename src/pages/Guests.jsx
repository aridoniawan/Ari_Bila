import { useState, useEffect } from 'react';
import { fetchSheetData, addSheetData, updateSheetData, deleteSheetData } from '../api/sheetApi';
import { Plus, Edit2, Trash2, X, Users, UserPlus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const Guests = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const [formData, setFormData] = useState({
    Pihak: "Pria", Nama: "", Relasi: "", "Jumlah Undangan": 1, "Status Konfirmasi": "Belum", Alamat: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchSheetData('Tamu');
      setGuests(data);
    } catch (error) {
      console.error("Failed to load guests", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData(item);
    } else {
      setFormData({ Pihak: "Pria", Nama: "", Relasi: "Keluarga", "Jumlah Undangan": 1, "Status Konfirmasi": "Belum", Alamat: "" });
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
        await updateSheetData('Tamu', formData);
      } else {
        await addSheetData('Tamu', formData);
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      alert("Gagal menyimpan tamu");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Hapus tamu ini?")) {
      try {
        await deleteSheetData('Tamu', id);
        loadData();
      } catch (error) {
        alert("Gagal menghapus tamu");
      }
    }
  };

  // Calculations
  const totalUndangan = guests.reduce((acc, curr) => acc + Number(curr['Jumlah Undangan'] || 0), 0);
  
  const tamuPria = guests.filter(g => g.Pihak === 'Pria').reduce((acc, curr) => acc + Number(curr['Jumlah Undangan'] || 0), 0);
  const tamuWanita = guests.filter(g => g.Pihak === 'Wanita').reduce((acc, curr) => acc + Number(curr['Jumlah Undangan'] || 0), 0);
  
  const persentasePria = totalUndangan > 0 ? (tamuPria / totalUndangan) * 100 : 0;
  const persentaseWanita = totalUndangan > 0 ? (tamuWanita / totalUndangan) * 100 : 0;

  const hadirCount = guests.filter(g => g['Status Konfirmasi'] === 'Hadir').reduce((acc, curr) => acc + Number(curr['Jumlah Undangan'] || 0), 0);

  // Search & Pagination
  const filteredGuests = guests.filter(g => g.Nama.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPages = Math.ceil(filteredGuests.length / ITEMS_PER_PAGE) || 1;
  const paginatedGuests = filteredGuests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 style={{ fontSize: '1.5rem' }}>Manajemen Tamu Undangan</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <UserPlus size={16} /> Tambah Tamu
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="card">
          <h3 className="text-muted mb-2 flex items-center gap-2" style={{ fontSize: '0.875rem' }}>
            <Users size={16} /> Total Undangan
          </h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalUndangan} <span style={{fontSize: '0.875rem', fontWeight: 'normal'}} className="text-muted">Orang</span></div>
          <div className="mt-2 text-sm text-success" style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>
            {hadirCount} Orang Konfirmasi Hadir
          </div>
        </div>
        
        <div className="card" style={{ borderLeft: '4px solid var(--color-secondary)' }}>
          <h3 className="text-muted mb-2" style={{ fontSize: '0.875rem' }}>Pihak Pria</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{persentasePria.toFixed(1)}%</div>
          <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>{tamuPria} Undangan</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <h3 className="text-muted mb-2" style={{ fontSize: '0.875rem' }}>Pihak Wanita</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{persentaseWanita.toFixed(1)}%</div>
          <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>{tamuWanita} Undangan</div>
        </div>
      </div>

      {/* Visual Bar Pria vs Wanita */}
      {totalUndangan > 0 && (
        <div className="card mb-4" style={{ padding: '1rem' }}>
          <div className="flex justify-between mb-1" style={{ fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--color-secondary)' }}>Pria ({persentasePria.toFixed(0)}%)</span>
            <span style={{ color: 'var(--color-primary)' }}>Wanita ({persentaseWanita.toFixed(0)}%)</span>
          </div>
          <div style={{ width: '100%', height: '0.75rem', display: 'flex', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{ width: `${persentasePria}%`, backgroundColor: 'var(--color-secondary)' }}></div>
            <div style={{ width: `${persentaseWanita}%`, backgroundColor: 'var(--color-primary)' }}></div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div>Memuat daftar tamu...</div>
      ) : (
        <div className="card">
          <div className="flex justify-between items-center mb-4" style={{ gap: '1rem', flexWrap: 'wrap' }}>
            <div className="flex items-center gap-2" style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <Search size={16} className="text-muted" style={{ position: 'absolute', left: '0.75rem' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Cari nama tamu..." 
                value={searchQuery}
                onChange={handleSearchChange}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Pihak</th>
                  <th>Nama Tamu</th>
                  <th>Relasi</th>
                  <th>Jml Orang</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGuests.map(item => (
                  <tr key={item.ID}>
                    <td>
                      <span className={`badge ${item.Pihak === 'Pria' ? 'badge-secondary' : 'badge-primary'}`}>
                        {item.Pihak}
                      </span>
                    </td>
                    <td className="font-medium">
                      {item.Nama}
                      {item.Alamat && <div className="text-muted" style={{fontSize: '0.75rem'}}>{item.Alamat}</div>}
                    </td>
                    <td>{item.Relasi}</td>
                    <td>{item['Jumlah Undangan']}</td>
                    <td>
                      <span className={`badge ${item['Status Konfirmasi'] === 'Hadir' ? 'badge-success' : item['Status Konfirmasi'] === 'Tidak Hadir' ? 'badge-danger' : 'badge-warning'}`}>
                        {item['Status Konfirmasi']}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-icon" onClick={() => handleOpenModal(item)}><Edit2 size={16} /></button>
                        <button className="btn-icon text-danger" onClick={() => handleDelete(item.ID)} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredGuests.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted" style={{ padding: '2rem' }}>
                      {searchQuery ? 'Tamu tidak ditemukan.' : 'Belum ada data tamu.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {filteredGuests.length > 0 && (
            <div className="flex justify-between items-center mt-4" style={{ fontSize: '0.875rem' }}>
              <div className="text-muted">
                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredGuests.length)} dari {filteredGuests.length} tamu
              </div>
              <div className="flex gap-2">
                <button 
                  className="btn btn-outline" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '0.25rem 0.5rem' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center px-2 font-medium">
                  {currentPage} / {totalPages}
                </div>
                <button 
                  className="btn btn-outline" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '0.25rem 0.5rem' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Tamu' : 'Tambah Tamu'}</h3>
              <button className="btn-icon" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Pihak</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="Pihak" value="Pria" checked={formData.Pihak === 'Pria'} onChange={handleChange} /> Pria
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="Pihak" value="Wanita" checked={formData.Pihak === 'Wanita'} onChange={handleChange} /> Wanita
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nama Tamu / Keluarga</label>
                <input type="text" className="form-input" name="Nama" value={formData.Nama} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Relasi</label>
                  <select className="form-select" name="Relasi" value={formData.Relasi} onChange={handleChange} required>
                    <option value="Keluarga Inti">Keluarga Inti</option>
                    <option value="Keluarga Jauh">Keluarga Jauh</option>
                    <option value="Teman Sekolah/Kuliah">Teman Sekolah/Kuliah</option>
                    <option value="Teman Kerja">Teman Kerja</option>
                    <option value="Tetangga">Tetangga</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jml Undangan</label>
                  <input type="number" min="1" className="form-input" name="Jumlah Undangan" value={formData['Jumlah Undangan']} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status Konfirmasi</label>
                <select className="form-select" name="Status Konfirmasi" value={formData['Status Konfirmasi']} onChange={handleChange}>
                  <option value="Belum">Belum Konfirmasi</option>
                  <option value="Hadir">Hadir</option>
                  <option value="Tidak Hadir">Tidak Hadir</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Alamat / Kota</label>
                <input type="text" className="form-input" name="Alamat" value={formData.Alamat} onChange={handleChange} />
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

export default Guests;
