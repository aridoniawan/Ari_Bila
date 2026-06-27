import { useState, useEffect } from 'react';
import { fetchAllAppData, addSheetData, deleteSheetData } from '../api/sheetApi';
import { APP_CONFIG } from '../config';
import { Plus, Trash2, RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react';

const Tabungan = () => {
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const [formData, setFormData] = useState({ 
    Pihak: "Pria", 
    Nominal: "", 
    Tanggal: new Date().toISOString().split('T')[0],
    Catatan: "" 
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (force = false) => {
    setLoading(true);
    try {
      const data = await fetchAllAppData(force);
      setRiwayat(data['Riwayat Tabungan'] || []);
    } catch (error) {
      console.error("Gagal mengambil data tabungan", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(APP_CONFIG.locale, {
      style: 'currency',
      currency: APP_CONFIG.currency,
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatCurrencyInput = (value) => {
    if (!value && value !== 0 && value !== '0') return '';
    const number = value.toString().replace(/\D/g, '');
    if (!number) return '';
    return 'Rp ' + parseInt(number, 10).toLocaleString('id-ID');
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // fallback if invalid
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  };

  const handleOpenModal = () => {
    setFormData({ Pihak: "Pria", Nominal: "", Tanggal: new Date().toISOString().split('T')[0], Catatan: "" });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'Nominal') {
      newValue = value.replace(/\D/g, '');
    }
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await addSheetData('Riwayat Tabungan', formData);
      handleCloseModal();
      loadData(true); // force refresh
    } catch (error) {
      alert("Gagal menambah riwayat tabungan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus riwayat ini? Saldo tabungan Anda akan otomatis berkurang.")) {
      try {
        setIsSaving(true);
        await deleteSheetData('Riwayat Tabungan', id);
        loadData(true); // force refresh
      } catch (error) {
        alert("Gagal menghapus riwayat");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const tabunganPria = riwayat.filter(t => t.Pihak === 'Pria').reduce((acc, curr) => acc + Number(curr.Nominal || 0), 0);
  const tabunganWanita = riwayat.filter(t => t.Pihak === 'Wanita').reduce((acc, curr) => acc + Number(curr.Nominal || 0), 0);

  // Pagination
  const reversedRiwayat = riwayat.slice().reverse();
  const totalPages = Math.ceil(reversedRiwayat.length / ITEMS_PER_PAGE) || 1;
  const paginatedRiwayat = reversedRiwayat.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div>
      <div className="flex justify-between items-center mb-8" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem' }}>Buku Tabungan</h2>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => loadData(true)}>
            <RefreshCw size={16} className={loading && !isSaving ? "animate-spin" : ""} />
          </button>
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <Plus size={16} /> Tambah Setoran
          </button>
        </div>
      </div>

      {loading && !isSaving && riwayat.length === 0 ? (
        <div className="flex items-center gap-2 text-muted py-8">
          <RefreshCw className="animate-spin" size={16}/> Memuat Riwayat...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8" style={{ marginBottom: '2rem' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--color-secondary)' }}>
              <h3 className="text-muted mb-2" style={{ fontSize: '0.875rem' }}>Saldo Pria</h3>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(tabunganPria)}</div>
            </div>
            <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
              <h3 className="text-muted mb-2" style={{ fontSize: '0.875rem' }}>Saldo Wanita</h3>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(tabunganWanita)}</div>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4" style={{ fontSize: '1.125rem' }}>Riwayat Setoran</h3>
            {riwayat.length === 0 ? (
              <p className="text-muted text-center py-8">Belum ada riwayat tabungan. Mulai menabung dengan klik "Tambah Setoran".</p>
            ) : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Tanggal</th>
                      <th style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>Pihak</th>
                      <th style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>Nominal</th>
                      <th style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>Catatan</th>
                      <th style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRiwayat.map((row) => (
                      <tr key={row.ID || Math.random()} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{formatDate(row.Tanggal)}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: 'var(--radius-full)', 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold',
                            backgroundColor: row.Pihak === 'Pria' ? 'rgba(74, 144, 226, 0.1)' : 'rgba(69, 178, 154, 0.1)',
                            color: row.Pihak === 'Pria' ? 'var(--color-secondary)' : 'var(--color-primary)'
                          }}>
                            {row.Pihak}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{formatCurrency(row.Nominal)}</td>
                        <td style={{ padding: '0.75rem' }}>{row.Catatan || "-"}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <button className="btn-icon" onClick={() => handleDelete(row.ID)} style={{ color: 'var(--color-danger)' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {riwayat.length > 0 && (
              <div className="flex justify-between items-center mt-4" style={{ fontSize: '0.875rem' }}>
                <div className="text-muted">
                  Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, riwayat.length)} dari {riwayat.length} riwayat
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
        </>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal} style={{ zIndex: 9999 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Setoran Tabungan</h3>
              <button className="btn-icon" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Sumber Dana (Pihak)</label>
                <select className="form-select" name="Pihak" value={formData.Pihak} onChange={handleChange}>
                  <option value="Pria">Pria</option>
                  <option value="Wanita">Wanita</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nominal Setoran (Rp)</label>
                <input type="text" className="form-input" name="Nominal" value={formatCurrencyInput(formData.Nominal)} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Setor</label>
                <input type="date" className="form-input" name="Tanggal" value={formData.Tanggal} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Catatan (Opsional)</label>
                <input type="text" className="form-input" name="Catatan" value={formData.Catatan} onChange={handleChange} placeholder="Gaji bulanan, bonus, dll" />
              </div>
              <div className="mt-4 flex justify-between">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tabungan;
