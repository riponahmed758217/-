import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  MinusCircle, 
  Wallet, 
  History, 
  Download, 
  Trash2, 
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronRight,
  TrendingUp,
  Package,
  User,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, TransactionType } from './types';

// Utility for formatting currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
  }).format(amount).replace('BDT', '৳');
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Forms State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    qty: '',
    price: '',
    paid: ''
  });

  // Load data from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('token_khata_v3');
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse transactions", e);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('token_khata_v3', JSON.stringify(transactions));
  }, [transactions]);

  // Calculations
  const metrics = useMemo(() => {
    let cash = 0;
    let totalDena = 0;
    let totalPaona = 0;
    let currentStock = 0;
    let totalBuyCost = 0;
    let totalBuyQty = 0;
    let totalProfit = 0;

    // First pass: Average Cost
    transactions.forEach(t => {
      if (t.type === 'buy') {
        totalBuyCost += t.total;
        totalBuyQty += t.qty;
      }
    });
    const avgUnitCost = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0;

    // Second pass: Metrics
    transactions.forEach(t => {
      if (t.type === 'buy') {
        cash -= t.paidOrRec;
        totalDena += t.due;
        currentStock += t.qty;
      } else if (t.type === 'sell') {
        cash += t.paidOrRec;
        totalPaona += t.due;
        currentStock -= t.qty;
        const profitFromSale = t.total - (t.qty * avgUnitCost);
        totalProfit += profitFromSale;
      } else if (t.type === 'expense') {
        cash -= t.paidOrRec;
        totalProfit -= t.paidOrRec;
      }
    });

    return { cash, totalDena, totalPaona, currentStock, totalProfit };
  }, [transactions]);

  const addTransaction = (type: TransactionType) => {
    if (!formData.name && type !== 'expense') {
      alert('নাম দিন!');
      return;
    }

    const qtyNum = parseFloat(formData.qty) || 0;
    const totalNum = parseFloat(formData.price) || 0;
    const paidNum = parseFloat(formData.paid) || 0;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      date: formData.date,
      name: formData.name || (type === 'expense' ? 'অন্যান্য খরচ' : 'Unknown'),
      qty: qtyNum,
      total: type === 'expense' ? totalNum : totalNum,
      paidOrRec: type === 'expense' ? totalNum : paidNum,
      due: type === 'expense' ? 0 : totalNum - paidNum,
      timestamp: Date.now()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    alert('সফলভাবে সেভ হয়েছে!');
    setFormData({
      date: new Date().toISOString().split('T')[0],
      name: '',
      qty: '',
      price: '',
      paid: ''
    });
    setActiveTab('home');
  };

  const clearData = () => {
    if (confirm('সাবধান! সব ডাটা মুছে যাবে। আপনি কি নিশ্চিত?')) {
      setTransactions([]);
    }
  };

  const downloadCSV = () => {
    if (transactions.length === 0) return alert('কোন ডাটা নেই!');
    let csv = "Date,Type,Name,Qty,Total,Paid/Rec,Due\n";
    transactions.forEach(t => {
      csv += `${t.date},${t.type},${t.name},${t.qty},${t.total},${t.paidOrRec},${t.due}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Token_Khata_Report_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  const filteredTransactions = transactions.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const peopleBalances = useMemo(() => {
    const balances: Record<string, { totalDue: number, totalPaid: number, type: 'Customer' | 'Mahajan' }> = {};
    
    transactions.forEach(t => {
      if (!t.name) return;
      if (!balances[t.name]) {
        balances[t.name] = { totalDue: 0, totalPaid: 0, type: t.type === 'buy' ? 'Mahajan' : 'Customer' };
      }
      balances[t.name].totalDue += t.due;
    });

    return Object.entries(balances)
      .filter(([_, stats]) => stats.totalDue > 0)
      .map(([name, stats]) => ({ name, ...stats }));
  }, [transactions]);

  return (
    <div className="min-h-screen pb-20 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-700 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6" />
            <h1 className="text-xl font-bold font-sans">টোকেন খাতা প্রো</h1>
          </div>
          <button onClick={() => setActiveTab('settings')} className="p-2 hover:bg-indigo-600 rounded-full transition-colors">
            <Trash2 className="w-5 h-5 text-indigo-100" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full p-4 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              {/* Main Summary Card */}
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <TrendingUp className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <p className="text-indigo-100 text-sm font-medium">বর্তমানে স্টকে আছে</p>
                  <h2 className="text-4xl font-bold mt-1 tracking-tight">{metrics.currentStock} <span className="text-lg font-normal">টি টোকেন</span></h2>
                </div>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard title="নগদ টাকা" value={metrics.cash} color="text-indigo-600" bg="bg-indigo-50" icon={Wallet} />
                <MetricCard title="মোট লাভ" value={metrics.totalProfit} color="text-emerald-600" bg="bg-emerald-50" icon={TrendingUp} />
                <MetricCard title="মোট দেনা" value={metrics.totalDena} color="text-rose-600" bg="bg-rose-50" icon={ArrowUpCircle} />
                <MetricCard title="মোট পাওনা" value={metrics.totalPaona} color="text-amber-600" bg="bg-amber-50" icon={ArrowDownCircle} />
              </div>

              {/* Quick Actions Title */}
              <h3 className="text-slate-800 font-bold text-lg pt-2">সারাংশ (Balances)</h3>
              <div className="space-y-2">
                {peopleBalances.length > 0 ? (
                  peopleBalances.map((person, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${person.type === 'Mahajan' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{person.name}</p>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">{person.type === 'Mahajan' ? 'মহাজন (দেনা)' : 'কাস্টমার (পাওনা)'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${person.type === 'Mahajan' ? 'text-rose-600' : 'text-amber-600'}`}>
                          {formatCurrency(person.totalDue)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm">কোন পাওনা বা দেনা নেই</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'buy' && (
            <FormPage 
              key="buy"
              title="টোকেন ক্রয় (মহাজন)"
              type="buy"
              formData={formData}
              setFormData={setFormData}
              onSubmit={() => addTransaction('buy')}
            />
          )}

          {activeTab === 'sell' && (
            <FormPage 
              key="sell"
              title="টোকেন বিক্রি (কাস্টমার)"
              type="sell"
              formData={formData}
              setFormData={setFormData}
              onSubmit={() => addTransaction('sell')}
            />
          )}

          {activeTab === 'expense' && (
            <FormPage 
              key="expense"
              title="অন্যান্য খরচ"
              type="expense"
              formData={formData}
              setFormData={setFormData}
              onSubmit={() => addTransaction('expense')}
            />
          )}

          {activeTab === 'report' && (
            <motion.div 
              key="report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Summary Section in Report */}
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" /> বকেয়া ও পাওনার হিসাব (Balances)
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {peopleBalances.length > 0 ? (
                    peopleBalances.map((person, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                        <div className="text-xs">
                          <p className="font-bold text-slate-700">{person.name}</p>
                          <p className={`text-[9px] uppercase font-bold ${person.type === 'Mahajan' ? 'text-rose-500' : 'text-amber-500'}`}>
                            {person.type === 'Mahajan' ? 'মহাজন (দেনা)' : 'কাস্টমার (পাওনা)'}
                          </p>
                        </div>
                        <p className={`text-sm font-bold ${person.type === 'Mahajan' ? 'text-rose-600' : 'text-amber-600'}`}>
                          {formatCurrency(person.totalDue)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 text-xs py-4">সব হিসাব পরিশোধিত</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={downloadCSV} className="flex-1 bg-slate-800 text-white p-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-xs shadow-sm active:scale-95 transition-transform">
                  <Download className="w-4 h-4" /> CSV ডাউনলোড
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="নাম বা ধরণ লিখে খুঁজুন..." 
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 pl-10 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-slate-600">সাম্প্রতিক লেনদেন</h3>
                  <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                    {filteredTransactions.length} টি রেজাল্ট
                  </span>
                </div>
                {filteredTransactions.map((t) => (
                  <TransactionListItem key={t.id} t={t} />
                ))}
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-10 bg-white rounded-3xl border border-slate-100">
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">কোন লেনদেন পাওয়া যায়নি</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
                  <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">ডাটা ম্যানেজমেন্ট</h2>
                  <p className="text-slate-500 text-sm mt-2">আপনি কি সব ডাটা মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা সম্ভব নয়।</p>
                  <button 
                    onClick={clearData}
                    className="mt-6 w-full bg-rose-600 text-white p-4 rounded-xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 transition-colors"
                  >
                    সব ডাটা রিসেট করুন
                  </button>
               </div>
               <button onClick={() => setActiveTab('home')} className="w-full text-slate-500 font-medium py-2">ফিরে যান</button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-50">
        <div className="max-w-md mx-auto flex justify-around">
          <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={LayoutDashboard} label="হোম" />
          <NavButton active={activeTab === 'buy'} onClick={() => setActiveTab('buy')} icon={PlusCircle} label="ক্রয়" />
          <NavButton active={activeTab === 'sell'} onClick={() => setActiveTab('sell')} icon={MinusCircle} label="বিক্রি" />
          <NavButton active={activeTab === 'expense'} onClick={() => setActiveTab('expense')} icon={Wallet} label="খরচ" />
          <NavButton active={activeTab === 'report'} onClick={() => setActiveTab('report')} icon={History} label="রিপোর্ট" />
        </div>
      </nav>
    </div>
  );
}

function MetricCard({ title, value, color, bg, icon: Icon }: any) {
  return (
    <div className={`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between`}>
      <div className={`p-2 ${bg} ${color} rounded-lg w-fit mb-3`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{title}</p>
        <p className={`text-lg font-bold ${color} truncate`}>{formatCurrency(value)}</p>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center py-3 px-2 flex-1 transition-all relative ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
      {active && <motion.div layoutId="nav-bg" className="absolute top-0 w-8 h-1 bg-indigo-600 rounded-full" />}
      <Icon className={`w-5 h-5 mb-1 ${active ? 'scale-110' : ''} transition-transform`} />
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

function FormPage({ title, type, formData, setFormData, onSubmit }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4"
    >
      <h2 className="text-xl font-bold text-slate-800 border-b border-slate-50 pb-4 flex items-center gap-2">
        {type === 'buy' ? <PlusCircle className="text-rose-500" /> : type === 'sell' ? <MinusCircle className="text-emerald-500" /> : <Wallet className="text-indigo-500" />}
        {title}
      </h2>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">তারিখ</label>
          <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 text-sm focus:ring-2 focus:ring-indigo-500" />
        </div>
        
        {type !== 'expense' && (
          <>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">{type === 'buy' ? 'মহাজনের নাম' : 'কাস্টমারের নাম'}</label>
              <input type="text" placeholder="নাম লিখুন" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">পরিমাণ (Qty)</label>
                <input type="number" placeholder="0" value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">মোট মূল্য</label>
                <input type="number" placeholder="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">{type === 'buy' ? 'নগদ দিলেন' : 'নগদ পেলেন'}</label>
              <input type="number" placeholder="0" value={formData.paid} onChange={e => setFormData({...formData, paid: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 text-sm" />
            </div>
          </>
        )}

        {type === 'expense' && (
          <>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">খরচের বিবরণ</label>
              <input type="text" placeholder="বিবরণ লিখুন" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">টাকার পরিমাণ</label>
              <input type="number" placeholder="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 text-sm" />
            </div>
          </>
        )}

        <button 
          onClick={onSubmit}
          className={`w-full p-4 rounded-2xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 mt-4 
            ${type === 'buy' ? 'bg-rose-600 shadow-rose-200' : type === 'sell' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-indigo-600 shadow-indigo-200'}`}
        >
          {type === 'buy' ? <PlusCircle className="w-5 h-5" /> : type === 'sell' ? <MinusCircle className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
          এন্ট্রি সেভ করুন
        </button>
      </div>
    </motion.div>
  );
}

function TransactionListItem({ t }: { t: Transaction }) {
  const [expanded, setExpanded] = useState(false);
  
  const typeLabels: Record<string, string> = {
    buy: 'ক্রয়',
    sell: 'বিক্রি',
    expense: 'খরচ'
  };

  const typeConfig: Record<string, { bg: string, text: string, icon: any }> = {
    buy: { bg: 'bg-rose-50', text: 'text-rose-600', icon: PlusCircle },
    sell: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: MinusCircle },
    expense: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: Wallet }
  };

  const config = typeConfig[t.type];
  const Icon = config.icon;

  return (
    <div 
      onClick={() => setExpanded(!expanded)}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all active:bg-slate-50 cursor-pointer"
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl ${config.bg} ${config.text} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm leading-tight">{t.name} <span className="text-[10px] font-normal text-slate-400">({typeLabels[t.type]})</span></h4>
            <div className="flex items-center gap-2 mt-0.5">
               <Clock className="w-3 h-3 text-slate-300" />
               <span className="text-[10px] text-slate-400 font-medium">{t.date}</span>
               {t.qty > 0 && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded uppercase font-bold">{t.qty} টি</span>}
            </div>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className={`font-bold text-sm ${config.text}`}>
            {formatCurrency(t.total)}
          </p>
          {t.due > 0 ? (
            <span className="text-[9px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-full font-bold animate-pulse">বাকি {formatCurrency(t.due)}</span>
          ) : (
            t.type !== 'expense' && <span className="text-[9px] bg-emerald-50 text-emerald-500 px-1.5 py-0.5 rounded-full font-bold">পরিশোধিত</span>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 border-t border-slate-50 pt-3"
          >
            <div className="grid grid-cols-2 gap-4 text-xs">
               <div className="space-y-2">
                 <p className="text-slate-400">মোট মূল্য: <span className="text-slate-800 font-bold">{formatCurrency(t.total)}</span></p>
                 <p className="text-slate-400">{t.type === 'buy' ? 'নগদ দিলেন:' : 'নগদ পেলেন:'} <span className="text-slate-800 font-bold">{formatCurrency(t.paidOrRec)}</span></p>
               </div>
               <div className="space-y-2 border-l border-slate-100 pl-4">
                 <p className="text-slate-400">{t.type === 'buy' ? 'বাকি (দেনা):' : 'বাকি (পাওনা):'} <span className={`${t.due > 0 ? 'text-rose-600' : 'text-slate-400'} font-bold`}>{formatCurrency(t.due)}</span></p>
                 <p className="text-slate-400">মালিকানা: <span className="text-slate-800 font-bold">{t.name}</span></p>
               </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-300">
               <span>ID: {t.id.slice(0, 8)}</span>
               <span>{new Date(t.timestamp).toLocaleTimeString('bn-BD')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

