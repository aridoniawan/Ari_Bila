import { useState, useEffect } from 'react';
import { fetchAllAppData, updateSheetData } from '../api/sheetApi';
import { APP_CONFIG } from '../config';
import { Edit2, X, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ ID: "1", Pengaturan: "Jalur Vendor Utama", Nilai: "Belum Memilih" });

  const [selectedAllInId, setSelectedAllInId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (data && data['Vendor All-in']?.length > 0 && !selectedAllInId) {
      setSelectedAllInId(data['Vendor All-in'][0].ID);
    }
  }, [data, selectedAllInId]);

  const loadData = async (force = false) => {
    setLoading(true);
    try {
      const allData = await fetchAllAppData(force);
      setData(allData);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
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

  const handleOpenModal = () => {
    const settings = data?.['Pengaturan'] || [];
    const jalurSetting = settings.find(s => s.Pengaturan === 'Jalur Vendor Utama');
    if (jalurSetting) {
      setFormData(jalurSetting);
    } else {
      setFormData({ ID: "1", Pengaturan: "Jalur Vendor Utama", Nilai: "Belum Memilih" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSheetData('Pengaturan', formData);
      handleCloseModal();
      loadData(true); // force refresh after save
    } catch (error) {
      alert("Gagal menyimpan pengaturan");
    }
  };

  if (loading || !data) {
    return <div className="flex items-center gap-2 text-muted"><RefreshCw className="animate-spin" size={16}/> Memuat Data Super Cepat...</div>;
  }

  const allInVendors = data['Vendor All-in'] || [];
  const customVendors = data['Vendor Custom'] || [];
  const todoData = data['To-Do List'] || [];
  const riwayatTabungan = data['Riwayat Tabungan'] || [];
  
  // Settings
  const settings = data['Pengaturan'] || [];
  const packageChoice = settings.find(s => s.Pengaturan === 'Jalur Vendor Utama')?.Nilai || 'Belum Memilih';

  // Calculations for Costs
  const selectedAllInVendor = allInVendors.find(v => v.ID == selectedAllInId) || allInVendors[0];
  const totalAllIn = selectedAllInVendor 
    ? Number(selectedAllInVendor['Harga Paket'] || 0) + Number(selectedAllInVendor['Budget Tambahan'] || 0)
    : 0;

  const totalCustom = customVendors.reduce((acc, curr) => {
    const cost = Number(curr['Harga Final']) || Number(curr['Estimasi Harga']) || 0;
    return acc + cost;
  }, 0);
  
  const activeTarget = packageChoice === 'All-in' ? totalAllIn : packageChoice === 'Custom' ? totalCustom : Math.max(totalAllIn, totalCustom);

  // Tabungan Calculations (From History)
  const tabunganPria = riwayatTabungan.filter(t => t.Pihak === 'Pria').reduce((acc, curr) => acc + Number(curr.Nominal || 0), 0);
  const tabunganWanita = riwayatTabungan.filter(t => t.Pihak === 'Wanita').reduce((acc, curr) => acc + Number(curr.Nominal || 0), 0);
  const totalTabungan = tabunganPria + tabunganWanita;

  const progressPria = activeTarget > 0 ? (tabunganPria / activeTarget) * 100 : 0;
  const progressWanita = activeTarget > 0 ? (tabunganWanita / activeTarget) * 100 : 0;
  const totalProgress = progressPria + progressWanita;

  // Todos
  const totalTodos = todoData.length;
  const completedTodos = todoData.filter(t => t.Status === 'Selesai').length;
  const progressTodos = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 style={{ fontSize: '1.5rem' }}>Dashboard Overview</h2>
        <button className="btn btn-outline" onClick={() => loadData(true)}>
          <RefreshCw size={16} /> Segarkan Data
        </button>
      </div>
      
      {/* Target & Tabungan Card */}
      <div className="card mb-4">
        <div className="flex justify-between items-start mb-4" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: '1 1 min-content' }}>
            <h3 className="text-muted mb-1" style={{ fontSize: '0.875rem' }}>
              Total Kebutuhan Biaya ({packageChoice})
              <button className="btn-icon inline-flex ml-2" onClick={handleOpenModal} style={{padding: '2px'}}><Edit2 size={12}/></button>
            </h3>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)', wordBreak: 'break-word' }}>
              {formatCurrency(activeTarget)}
            </div>
            <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>Otomatis dikalkulasi dari pengisian Vendor</div>
          </div>
          <div style={{ textAlign: 'left', flex: '1 1 min-content' }}>
            <h3 className="text-muted mb-1" style={{ fontSize: '0.875rem' }}>Total Tabungan</h3>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)', wordBreak: 'break-word' }}>
              {formatCurrency(totalTabungan)}
            </div>
            <a href="/tabungan" className="text-primary mt-1 inline-block" style={{ fontSize: '0.75rem' }}>Lihat Riwayat &rarr;</a>
          </div>
        </div>

        {/* Split Progress Bar */}
        <div className="mb-2 flex justify-between text-sm" style={{ fontSize: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Pria: {formatCurrency(tabunganPria)} ({progressPria.toFixed(1)}%)</span>
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Wanita: {formatCurrency(tabunganWanita)} ({progressWanita.toFixed(1)}%)</span>
        </div>
        <div style={{ width: '100%', height: '1rem', display: 'flex', borderRadius: 'var(--radius-full)', overflow: 'hidden', backgroundColor: 'var(--color-border)' }}>
          <div style={{ width: `${Math.min(progressPria, 100)}%`, backgroundColor: 'var(--color-secondary)' }}></div>
          <div style={{ width: `${Math.min(progressWanita, 100 - progressPria)}%`, backgroundColor: 'var(--color-primary)' }}></div>
        </div>
        <div className="mt-2 text-center text-muted" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          {totalProgress.toFixed(1)}% Terkumpul dari Target
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Komparasi All-in vs Custom */}
        <div className="card">
          <h3 className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>Komparasi Jalur Vendor</h3>
          
          <div className="mb-3">
            <div className="flex justify-between items-center text-sm mb-1" style={{ fontSize: '0.875rem' }}>
              <div className="flex items-center gap-2">
                <span>All-in:</span>
                {allInVendors.length > 0 ? (
                  <select 
                    className="form-select" 
                    style={{ padding: '0.25rem 0.5rem', width: 'auto', minWidth: '120px' }}
                    value={selectedAllInId || (allInVendors[0]?.ID)}
                    onChange={(e) => setSelectedAllInId(e.target.value)}
                  >
                    {allInVendors.map(v => (
                      <option key={v.ID} value={v.ID}>{v['Nama Vendor']}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </div>
              <span className="font-bold">{formatCurrency(totalAllIn)}</span>
            </div>
          </div>
          
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1" style={{ fontSize: '0.875rem' }}>
              <span>Jalur Pilihan Sendiri (Custom)</span>
              <span className="font-bold">{formatCurrency(totalCustom)}</span>
            </div>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            {totalAllIn > 0 && totalCustom > 0 ? (
              <div className="flex items-center gap-2" style={{ color: totalAllIn < totalCustom ? 'var(--color-success)' : 'var(--color-warning)', fontSize: '0.875rem', fontWeight: 500 }}>
                {totalAllIn < totalCustom ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                {selectedAllInVendor?.['Nama Vendor']} {totalAllIn < totalCustom ? 'Lebih Hemat' : 'Lebih Mahal'} {formatCurrency(Math.abs(totalAllIn - totalCustom))}
              </div>
            ) : (
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Isi kedua jalur vendor untuk melihat komparasi hemat.</div>
            )}
          </div>
        </div>

        {/* Progress Tugas */}
        <div className="card">
          <h3 className="text-muted mb-2" style={{ fontSize: '0.875rem' }}>Progress Persiapan (To-Do)</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {completedTodos} / {totalTodos} <span className="text-muted" style={{ fontSize: '1rem' }}>Tugas Selesai</span>
          </div>
          <div className="progress-container mt-2">
            <div className="progress-bar" style={{ width: `${progressTodos}%`, backgroundColor: 'var(--color-success)' }}></div>
          </div>
          
          <div className="mt-4 pt-4 flex gap-2" style={{ borderTop: '1px solid var(--color-border)' }}>
            <a href="/todo" className="btn btn-outline" style={{ flex: 1, textDecoration: 'none' }}>Lihat Tugas</a>
            <a href="/vendors" className="btn btn-outline" style={{ flex: 1, textDecoration: 'none' }}>Kelola Vendor</a>
          </div>
        </div>
      </div>

      {/* Modal Pengaturan Target */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Pilih Jalur Target Utama</h3>
              <button className="btn-icon" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Jalur Vendor yang Dipilih</label>
                <select className="form-select" name="Nilai" value={formData.Nilai} onChange={(e) => setFormData({...formData, Nilai: e.target.value})}>
                  <option value="Belum Memilih">Belum Memilih (Pilih yang terbesar otomatis)</option>
                  <option value="All-in">Paket All-in</option>
                  <option value="Custom">Pilihan Sendiri (Custom)</option>
                </select>
                <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>Ini akan menjadi basis persentase target tabungan Anda.</div>
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

export default Dashboard;
