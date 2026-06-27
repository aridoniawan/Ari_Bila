import { useState, useEffect } from 'react';
import { fetchSheetData, addSheetData, updateSheetData, deleteSheetData } from '../api/sheetApi';
import { APP_CONFIG } from '../config';
import { Plus, Edit2, Trash2, X, Link as LinkIcon, Search, CheckCircle } from 'lucide-react';

const Seserahan = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    "Nama Toko": "",
    "Nama Barang": "",
    "Estimasi Harga": "",
    "Link Produk": "",
    "Tipe Pembelian": "Online",
    "Sudah Dibeli": "Tidak"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchSheetData('Seserahan');
      setItems(data || []);
    } catch (error) {
      console.error("Failed to load seserahan", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(APP_CONFIG.locale, { style: 'currency', currency: APP_CONFIG.currency, minimumFractionDigits: 0 }).format(amount || 0);
  };

  const formatCurrencyInput = (value) => {
    if (!value && value !== 0 && value !== '0') return '';
    const number = value.toString().replace(/\D/g, '');
    if (!number) return '';
    return 'Rp ' + parseInt(number, 10).toLocaleString('id-ID');
  };

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        "Nama Toko": "",
        "Nama Barang": "",
        "Estimasi Harga": "",
        "Link Produk": "",
        "Tipe Pembelian": "Online",
        "Sudah Dibeli": "Tidak"
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'Estimasi Harga') {
      newValue = value.replace(/\D/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateSheetData('Seserahan', formData);
      } else {
        await addSheetData('Seserahan', formData);
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      alert("Gagal menyimpan data");
    }
  };

  const handleToggleDibeli = async (item) => {
    const isBought = item['Sudah Dibeli'] === 'Ya';
    const updatedItem = {
      ...item,
      'Sudah Dibeli': isBought ? 'Tidak' : 'Ya'
    };
    try {
      await updateSheetData('Seserahan', updatedItem);
      loadData();
    } catch (error) {
      alert("Gagal mengupdate status pembelian");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      try {
        await deleteSheetData('Seserahan', id);
        loadData();
      } catch (error) {
        alert("Gagal menghapus data");
      }
    }
  };

  const displayedItems = items.filter(v => 
    v['Nama Barang']?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v['Nama Toko']?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEstimasi = items.reduce((acc, curr) => {
    if (curr['Sudah Dibeli'] === 'Ya') return acc;
    return acc + Number(curr['Estimasi Harga'] || 0);
  }, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 style={{ fontSize: '1.5rem' }}>Daftar Seserahan</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Tambah Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'var(--color-primary-gradient)', color: 'white' }}>
          <h3 style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Estimasi</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            {formatCurrency(totalEstimasi)}
          </p>
        </div>
        <div className="card">
          <h3 className="text-muted" style={{ fontSize: '0.875rem' }}>Total Item</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            {items.length} Barang
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ marginBottom: '2rem' }}>Memuat data seserahan...</div>
      ) : (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2" style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <Search size={16} className="text-muted" style={{ position: 'absolute', left: '0.75rem' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Cari nama barang atau toko..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Barang</th>
                  <th>Nama Toko</th>
                  <th>Tipe</th>
                  <th>Estimasi Harga</th>
                  <th>Link</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.map(item => (
                  <tr key={item.ID}>
                    <td className="font-medium">{item['Nama Barang']}</td>
                    <td>{item['Nama Toko']}</td>
                    <td>
                      <span className={`badge ${item['Tipe Pembelian'] === 'Online' ? 'badge-primary' : 'badge-secondary'}`}>
                        {item['Tipe Pembelian']}
                      </span>
                    </td>
                    <td>{formatCurrency(item['Estimasi Harga'])}</td>
                    <td>
                      {item['Link Produk'] && (
                        <a href={item['Link Produk'].startsWith('http') ? item['Link Produk'] : `https://${item['Link Produk']}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 500 }}>
                          <LinkIcon size={16} /> Buka
                        </a>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: item['Sudah Dibeli'] === 'Ya' ? '#d1fae5' : '#fef3c7', color: item['Sudah Dibeli'] === 'Ya' ? '#065f46' : '#92400e' }}>
                        {item['Sudah Dibeli'] === 'Ya' ? 'Sudah Dibeli' : 'Belum'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="btn-icon" 
                          title={item['Sudah Dibeli'] === 'Ya' ? 'Batal Sudah Dibeli' : 'Tandai Sudah Dibeli'}
                          onClick={() => handleToggleDibeli(item)}
                          style={{ color: item['Sudah Dibeli'] === 'Ya' ? '#10b981' : 'var(--text-muted)' }}
                        >
                          {item['Sudah Dibeli'] === 'Ya' ? <CheckCircle size={16} /> : <CheckCircle size={16} opacity={0.3} />}
                        </button>
                        <button className="btn-icon" onClick={() => handleOpenModal(item)}><Edit2 size={16} /></button>
                        <button className="btn-icon text-danger" onClick={() => handleDelete(item.ID)} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {displayedItems.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted" style={{ padding: '2rem' }}>
                      {searchQuery ? 'Barang tidak ditemukan.' : 'Belum ada data seserahan.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Seserahan' : 'Tambah Seserahan'}</h3>
              <button className="btn-icon" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nama Barang</label>
                <input type="text" className="form-input" name="Nama Barang" value={formData['Nama Barang']} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nama Toko</label>
                <input type="text" className="form-input" name="Nama Toko" value={formData['Nama Toko']} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Estimasi Harga</label>
                <input type="text" className="form-input" name="Estimasi Harga" value={formatCurrencyInput(formData['Estimasi Harga'])} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Tipe Pembelian</label>
                <select className="form-select" name="Tipe Pembelian" value={formData['Tipe Pembelian']} onChange={handleChange} required>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Link Produk (Opsional)</label>
                <input type="text" className="form-input" name="Link Produk" placeholder="Contoh: https://shopee.co.id/..." value={formData['Link Produk']} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Status Pembelian</label>
                <select className="form-select" name="Sudah Dibeli" value={formData['Sudah Dibeli'] || 'Tidak'} onChange={handleChange} required>
                  <option value="Tidak">Belum Dibeli</option>
                  <option value="Ya">Sudah Dibeli</option>
                </select>
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

export default Seserahan;
