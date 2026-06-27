import { useState, useEffect } from 'react';
import { fetchSheetData, addSheetData, updateSheetData, deleteSheetData } from '../api/sheetApi';
import { APP_CONFIG } from '../config';
import { Plus, Edit2, Trash2, X, MessageCircle, Search } from 'lucide-react';

const CUSTOM_CATEGORIES = [
  "Cathering", "Venue", "Decor", "Attire", "Souvenir", "MUA", 
  "Undangan", "Fotographer", "WO", "Lainnya"
];

const Vendors = () => {
  const [activeTab, setActiveTab] = useState('All-in');
  const [allInVendors, setAllInVendors] = useState([]);
  const [customVendors, setCustomVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({});
  const [excludeItems, setExcludeItems] = useState([{ name: '', price: '' }]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allIn, custom] = await Promise.all([
        fetchSheetData('Vendor All-in'),
        fetchSheetData('Vendor Custom')
      ]);
      setAllInVendors(allIn);
      setCustomVendors(custom);
    } catch (error) {
      console.error("Failed to load vendors", error);
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

  const getWaLink = (kontak) => {
    if (!kontak) return null;
    let number = kontak.toString().replace(/\D/g, '');
    if (number.length < 8) return null; // Terlalu pendek untuk nomor valid
    if (number.startsWith('0')) {
      number = '62' + number.substring(1);
    }
    return `https://wa.me/${number}`;
  };

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      let mappedItem = { ...item };
      if (activeTab !== 'All-in' && mappedItem['Kategori'] && !CUSTOM_CATEGORIES.includes(mappedItem['Kategori'])) {
        mappedItem['KategoriCustom'] = mappedItem['Kategori'];
        mappedItem['Kategori'] = 'Lainnya';
      }
      setFormData(mappedItem);
      if (activeTab === 'All-in') {
        try {
          const parsed = JSON.parse(item['Item Exclude']);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setExcludeItems(parsed);
          } else {
            setExcludeItems([{ name: '', price: '' }]);
          }
        } catch (e) {
          setExcludeItems([{ name: item['Item Exclude'] || '', price: item['Budget Tambahan'] || '' }]);
        }
      }
    } else {
      setFormData(activeTab === 'All-in' 
        ? { "Nama Vendor": "", "Kontak": "", "Harga Paket": "", "Item Exclude": "", "Budget Tambahan": "", "DP": "", "Sisa": "", "Status": "Belum DP", "Catatan": "" }
        : { "Kategori": "", "Nama Vendor": "", "Kontak": "", "Estimasi Harga": "", "Harga Final": "", "DP": "", "Sisa": "", "Status": "Belum DP", "Catatan": "" }
      );
      setExcludeItems([{ name: '', price: '' }]);
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

    if (name === 'Kontak') {
      let digits = value.replace(/\D/g, '');
      if (digits.length > 0) {
        if (digits.startsWith('0')) {
          digits = '62' + digits.substring(1);
        } else if (digits.startsWith('8')) {
          digits = '62' + digits;
        }
      }
      newValue = digits;
    } else if (['Harga Paket', 'Estimasi Harga', 'Harga Final', 'DP', 'Sisa'].includes(name)) {
      newValue = value.replace(/\D/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sheetName = activeTab === 'All-in' ? 'Vendor All-in' : 'Vendor Custom';
    
    let dataToSave = { ...formData };
    if (activeTab === 'All-in') {
      const validItems = excludeItems.filter(i => i.name.trim() !== '');
      const totalTambahan = validItems.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
      dataToSave['Item Exclude'] = JSON.stringify(validItems);
      dataToSave['Budget Tambahan'] = totalTambahan;
    } else {
      if (dataToSave['Kategori'] === 'Lainnya' && dataToSave['KategoriCustom']) {
        dataToSave['Kategori'] = dataToSave['KategoriCustom'];
      }
      delete dataToSave['KategoriCustom'];
    }

    try {
      if (editingItem) {
        await updateSheetData(sheetName, dataToSave);
      } else {
        await addSheetData(sheetName, dataToSave);
      }
      
      // Trigger DP celebration if newly DP or Lunas
      if (
        (dataToSave['Status'] === 'DP' || dataToSave['Status'] === 'Lunas') &&
        (!editingItem || (editingItem['Status'] !== 'DP' && editingItem['Status'] !== 'Lunas'))
      ) {
        window.dispatchEvent(new CustomEvent('celebrate', { detail: { type: 'dp' } }));
      }
      
      handleCloseModal();
      loadData(); // Reload data
    } catch (error) {
      alert("Gagal menyimpan data");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      const sheetName = activeTab === 'All-in' ? 'Vendor All-in' : 'Vendor Custom';
      try {
        await deleteSheetData(sheetName, id);
        loadData();
      } catch (error) {
        alert("Gagal menghapus data");
      }
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const displayedAllIn = allInVendors.filter(v => v['Nama Vendor']?.toLowerCase().includes(searchQuery.toLowerCase()));
  const displayedCustom = customVendors.filter(v => 
    v['Nama Vendor']?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v['Kategori']?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateTotals = () => {
    if (activeTab === 'All-in') {
      let totalBiaya = 0;
      let totalDibayar = 0;
      allInVendors.forEach(v => {
        const biaya = Number(v['Harga Paket'] || 0) + Number(v['Budget Tambahan'] || 0);
        totalBiaya += biaya;
        totalDibayar += Number(v['DP'] || 0);
      });
      return { totalBiaya, totalDibayar, percent: totalBiaya > 0 ? (totalDibayar / totalBiaya) * 100 : 0 };
    } else {
      let totalBiaya = 0;
      let totalDibayar = 0;
      customVendors.forEach(v => {
        const biaya = Number(v['Harga Final']) || Number(v['Estimasi Harga']) || 0;
        totalBiaya += biaya;
        totalDibayar += Number(v['DP'] || 0);
      });
      return { totalBiaya, totalDibayar, percent: totalBiaya > 0 ? (totalDibayar / totalBiaya) * 100 : 0 };
    }
  };
  const totals = calculateTotals();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 style={{ fontSize: '1.5rem' }}>Manajemen Vendor</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Tambah Vendor
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => handleTabChange('All-in')}
          style={{ 
            padding: '0.75rem 1rem', 
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'All-in' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'All-in' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'All-in' ? 600 : 400
          }}
        >
          Paket All-in
        </button>
        <button 
          onClick={() => handleTabChange('Custom')}
          style={{ 
            padding: '0.75rem 1rem', 
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'Custom' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'Custom' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'Custom' ? 600 : 400
          }}
        >
          Pilihan Sendiri (Custom)
        </button>
      </div>

      {!loading && (
        <div className="card mb-4" style={{ backgroundColor: 'var(--color-bg)' }}>
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="text-muted" style={{ fontSize: '0.875rem' }}>Ringkasan {activeTab}</h3>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {formatCurrency(totals.totalDibayar)} <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>dari {formatCurrency(totals.totalBiaya)}</span>
              </div>
            </div>
            <div className="font-bold text-primary" style={{ fontSize: '1.25rem' }}>
              {totals.percent.toFixed(1)}%
            </div>
          </div>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${totals.percent}%`, backgroundColor: 'var(--color-primary)' }}></div>
          </div>
        </div>
      )}

      {loading ? (
        <div>Memuat data vendor...</div>
      ) : (
        <div className="card">
          <div className="flex justify-between items-center mb-4" style={{ gap: '1rem', flexWrap: 'wrap' }}>
            <div className="flex items-center gap-2" style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <Search size={16} className="text-muted" style={{ position: 'absolute', left: '0.75rem' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder={activeTab === 'All-in' ? "Cari nama vendor all-in..." : "Cari nama atau kategori vendor..."} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                {activeTab === 'All-in' ? (
                  <tr>
                    <th>Nama Vendor</th>
                    <th>Harga Total</th>
                    <th>Sudah Dibayar</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Kategori</th>
                    <th>Nama Vendor</th>
                    <th>Estimasi Harga</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {(activeTab === 'All-in' ? displayedAllIn : displayedCustom).map(item => (
                  <tr key={item.ID}>
                    {activeTab === 'All-in' ? (
                      <>
                        <td className="font-medium">
                          <div className="flex items-center gap-2">
                            {item['Nama Vendor']}
                            {getWaLink(item['Kontak']) && (
                              <a href={getWaLink(item['Kontak'])} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }} title="Chat WhatsApp">
                                <MessageCircle size={16} />
                              </a>
                            )}
                          </div>
                        </td>
                        <td>{formatCurrency(Number(item['Harga Paket'] || 0) + Number(item['Budget Tambahan'] || 0))}</td>
                        <td>{formatCurrency(item['DP'])}</td>
                        <td>
                          <span className={`badge ${item['Status'] === 'Lunas' ? 'badge-success' : (item['Status'] === 'DP' ? 'badge-warning' : 'badge-secondary')}`}>
                            {item['Status'] || 'Belum DP'}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td><span className="badge badge-secondary">{item['Kategori']}</span></td>
                        <td className="font-medium">
                          <div className="flex items-center gap-2">
                            {item['Nama Vendor']}
                            {getWaLink(item['Kontak']) && (
                              <a href={getWaLink(item['Kontak'])} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }} title="Chat WhatsApp">
                                <MessageCircle size={16} />
                              </a>
                            )}
                          </div>
                        </td>
                        <td>{formatCurrency(item['Estimasi Harga'])}</td>
                        <td>
                          <span className={`badge ${item['Status'] === 'Lunas' ? 'badge-success' : 'badge-warning'}`}>
                            {item['Status']}
                          </span>
                        </td>
                      </>
                    )}
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-icon" onClick={() => handleOpenModal(item)}><Edit2 size={16} /></button>
                        <button className="btn-icon text-danger" onClick={() => handleDelete(item.ID)} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(activeTab === 'All-in' ? displayedAllIn : displayedCustom).length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted" style={{ padding: '2rem' }}>
                      {searchQuery ? 'Vendor tidak ditemukan.' : 'Belum ada data vendor.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Vendor' : 'Tambah Vendor'} {activeTab}</h3>
              <button className="btn-icon" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              {activeTab === 'All-in' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Nama Vendor</label>
                    <input type="text" className="form-input" name="Nama Vendor" value={formData['Nama Vendor']} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kontak (No. HP)</label>
                    <input type="text" className="form-input" name="Kontak" placeholder="Contoh: 62812... (Otomatis mengganti angka 0)" value={formData['Kontak']} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Harga Paket</label>
                    <input type="text" className="form-input" name="Harga Paket" value={formatCurrencyInput(formData['Harga Paket'])} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Daftar Item Exclude & Budget Tambahan</label>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                      {excludeItems.map((exItem, index) => (
                        <div key={index} className="flex gap-2 mb-2 items-start">
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Nama Item (misal: Gedung)" 
                            value={exItem.name} 
                            onChange={(e) => {
                              const newItems = [...excludeItems];
                              newItems[index].name = e.target.value;
                              setExcludeItems(newItems);
                            }} 
                            style={{ flex: 1 }}
                          />
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Harga (Rp)" 
                            value={formatCurrencyInput(exItem.price)} 
                            onChange={(e) => {
                              const newItems = [...excludeItems];
                              newItems[index].price = e.target.value.replace(/\D/g, '');
                              setExcludeItems(newItems);
                            }} 
                            style={{ width: '130px' }}
                          />
                          <button 
                            type="button" 
                            className="btn-icon" 
                            onClick={() => {
                              if (excludeItems.length > 1) {
                                setExcludeItems(excludeItems.filter((_, i) => i !== index));
                              } else {
                                setExcludeItems([{ name: '', price: '' }]);
                              }
                            }}
                            style={{ color: 'var(--color-danger)', marginTop: '4px' }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <div className="flex justify-between items-center mt-3">
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          onClick={() => setExcludeItems([...excludeItems, { name: '', price: '' }])}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        >
                          <Plus size={14} /> Tambah Item Lainnya
                        </button>
                        <div className="font-bold" style={{ fontSize: '0.875rem' }}>
                          Total: {formatCurrency(excludeItems.reduce((acc, curr) => acc + Number(curr.price || 0), 0))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2 mb-4">
                    <div className="form-group mb-0">
                      <label className="form-label">Sudah DP / Bayar</label>
                      <input type="text" className="form-input" name="DP" value={formatCurrencyInput(formData['DP'])} onChange={handleChange} />
                    </div>
                    <div className="form-group mb-0">
                      <label className="form-label">Status Pembayaran</label>
                      <select className="form-select" name="Status" value={formData['Status']} onChange={handleChange}>
                        <option value="Belum DP">Belum DP</option>
                        <option value="DP">Sudah DP</option>
                        <option value="Lunas">Lunas</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sisa Pembayaran</label>
                    <input type="text" className="form-input" name="Sisa" value={formatCurrencyInput(formData['Sisa'])} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Catatan Tambahan</label>
                    <textarea className="form-input" name="Catatan" value={formData['Catatan']} onChange={handleChange}></textarea>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Kategori</label>
                    <select className="form-select" name="Kategori" value={formData['Kategori']} onChange={handleChange} required>
                      <option value="">Pilih Kategori</option>
                      {CUSTOM_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {formData['Kategori'] === 'Lainnya' && (
                      <input 
                        type="text" 
                        className="form-input" 
                        name="KategoriCustom" 
                        placeholder="Masukkan kategori (misal: Hiburan)" 
                        value={formData['KategoriCustom'] || ''} 
                        onChange={handleChange} 
                        required 
                        style={{ marginTop: '0.5rem' }}
                      />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nama Vendor</label>
                    <input type="text" className="form-input" name="Nama Vendor" value={formData['Nama Vendor']} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kontak (No. HP)</label>
                    <input type="text" className="form-input" name="Kontak" placeholder="Contoh: 62812... (Otomatis mengganti angka 0)" value={formData['Kontak']} onChange={handleChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Estimasi Harga</label>
                      <input type="text" className="form-input" name="Estimasi Harga" value={formatCurrencyInput(formData['Estimasi Harga'])} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Harga Final</label>
                      <input type="text" className="form-input" name="Harga Final" value={formatCurrencyInput(formData['Harga Final'])} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sudah DP</label>
                      <input type="text" className="form-input" name="DP" value={formatCurrencyInput(formData['DP'])} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sisa Pembayaran</label>
                      <input type="text" className="form-input" name="Sisa" value={formatCurrencyInput(formData['Sisa'])} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status Pembayaran</label>
                    <select className="form-select" name="Status" value={formData['Status']} onChange={handleChange}>
                      <option value="Belum DP">Belum DP</option>
                      <option value="DP">Sudah DP</option>
                      <option value="Lunas">Lunas</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Catatan</label>
                    <textarea className="form-input" name="Catatan" value={formData['Catatan']} onChange={handleChange}></textarea>
                  </div>
                </>
              )}
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

export default Vendors;
