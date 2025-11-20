
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

interface ImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[][]) => void;
  title: string;
  columns: string[];
}

const Importer: React.FC<ImporterProps> = ({ isOpen, onClose, onImport, title, columns }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setUrl('');
    setFile(null);
    setError(null);
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const processData = (data: any[][]) => {
    if (!data || data.length === 0) {
      setError('無法讀取資料或檔案為空');
      return;
    }
    onImport(data);
    handleClose();
  };

  const handleImport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === 'file') {
        if (!file) {
          setError('請選擇檔案');
          setIsLoading(false);
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'array', codepage: 65001 });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
            processData(json);
          } catch (err) {
            setError('檔案解析失敗');
          } finally {
            setIsLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);

      } else {
        if (!url) {
          setError('請輸入網址');
          setIsLoading(false);
          return;
        }
        
        let fetchUrl = url;
        if (url.includes('docs.google.com/spreadsheets') && !url.includes('/export')) {
             fetchUrl = url.replace(/\/edit.*$/, '') + '/export?format=xlsx';
        }

        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error('無法下載檔案');
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            throw new Error('無法下載檔案。請確認權限設定。');
        }

        const arrayBuffer = await response.arrayBuffer();
        
        try {
            const workbook = XLSX.read(arrayBuffer, { type: 'array', codepage: 65001 });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
            processData(json);
        } catch (err) {
             setError('檔案解析錯誤');
             setIsLoading(false);
        }
      }
    } catch (err: any) {
      setError(err.message || '發生錯誤');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="glass-panel rounded-2xl w-full max-w-lg border border-white bg-white shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <h3 className="text-lg font-bold text-stone-800">{title}</h3>
          <button onClick={handleClose} className="text-stone-400 hover:text-stone-800 text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-6">
            <div className="flex space-x-6 mb-6 border-b border-stone-100">
                <button 
                    className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'file' ? 'border-b-2 border-pizza-500 text-pizza-600' : 'text-stone-400 hover:text-stone-600'}`}
                    onClick={() => setActiveTab('file')}
                >
                    上傳檔案
                </button>
                <button 
                    className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'url' ? 'border-b-2 border-pizza-500 text-pizza-600' : 'text-stone-400 hover:text-stone-600'}`}
                    onClick={() => setActiveTab('url')}
                >
                    Google 試算表網址
                </button>
            </div>

            <div className="space-y-4 min-h-[150px]">
                {activeTab === 'file' ? (
                    <div className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center hover:bg-stone-50 transition-colors bg-stone-50/50">
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                            <svg className="w-10 h-10 text-pizza-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                            <span className="text-sm text-stone-600 font-medium mb-1">{file ? file.name : '點擊上傳 Excel/CSV 檔案'}</span>
                            <span className="text-xs text-stone-400">支援格式: .xlsx, .xls, .csv</span>
                        </label>
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1 uppercase">網址連結</label>
                        <input 
                            type="text" 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            className="glass-input w-full px-4 py-2.5 rounded-lg bg-white text-stone-800 border border-stone-300"
                        />
                        <p className="text-xs text-stone-500 mt-2">請確保連結為公開或擁有權限。</p>
                    </div>
                )}
                
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs text-stone-500">
                     <strong className="text-pizza-600">必要欄位:</strong> {columns.join(', ')}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>

        <div className="p-5 border-t border-stone-100 text-right space-x-3 bg-stone-50">
          <button onClick={handleClose} className="px-4 py-2 text-stone-500 hover:text-stone-800 transition-colors text-sm">取消</button>
          <button 
            onClick={handleImport} 
            disabled={isLoading}
            className="px-6 py-2 bg-pizza-500 text-white rounded-lg hover:bg-pizza-600 shadow-md font-medium text-sm disabled:opacity-50"
          >
            {isLoading ? '處理中...' : '開始匯入'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Importer;
