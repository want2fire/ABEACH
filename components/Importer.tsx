
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
    // Simple validation: check if at least one row has data
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
            // Use 'array' type and codepage 65001 (UTF-8) to handle Chinese characters correctly
            const workbook = XLSX.read(data, { type: 'array', codepage: 65001 });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            // Convert to array of arrays
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
            processData(json);
          } catch (err) {
            setError('檔案解析失敗，請確認格式正確');
          } finally {
            setIsLoading(false);
          }
        };
        // Read as ArrayBuffer is more robust for encoding
        reader.readAsArrayBuffer(file);

      } else {
        // URL Import
        if (!url) {
          setError('請輸入網址');
          setIsLoading(false);
          return;
        }
        
        // Intelligent handling for Google Sheets
        let fetchUrl = url;
        if (url.includes('docs.google.com/spreadsheets')) {
           // Try to convert to XLSX export URL if it's a standard edit/view link
           // XLSX is binary and handles Unicode characters much better than CSV
           if (!url.includes('/export')) {
               // remove /edit... and replace with /export?format=xlsx
               fetchUrl = url.replace(/\/edit.*$/, '') + '/export?format=xlsx';
           }
        }

        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error('無法下載檔案，請確認網址權限');
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            throw new Error('無法下載檔案。請確認該 Google 試算表權限已設定為「知道連結的人均可檢視」，且不是登入頁面。');
        }

        // Get arrayBuffer directly from fetch response
        const arrayBuffer = await response.arrayBuffer();
        
        try {
            // Use 'array' type to handle raw bytes correctly
            // Force codepage to 65001 (UTF-8)
            const workbook = XLSX.read(arrayBuffer, { type: 'array', codepage: 65001 });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
            processData(json);
        } catch (err) {
             setError('無法解析來自網址的資料，可能是檔案格式錯誤');
             setIsLoading(false);
        }
      }
    } catch (err: any) {
      setError(err.message || '發生未預期的錯誤');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={handleClose} className="text-slate-500 hover:text-slate-800 text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-4">
            <div className="flex space-x-4 mb-4 border-b border-slate-200">
                <button 
                    className={`pb-2 px-1 ${activeTab === 'file' ? 'border-b-2 border-sky-600 text-sky-600 font-medium' : 'text-slate-500'}`}
                    onClick={() => setActiveTab('file')}
                >
                    上傳檔案
                </button>
                <button 
                    className={`pb-2 px-1 ${activeTab === 'url' ? 'border-b-2 border-sky-600 text-sky-600 font-medium' : 'text-slate-500'}`}
                    onClick={() => setActiveTab('url')}
                >
                    輸入網址
                </button>
            </div>

            <div className="space-y-4 min-h-[150px]">
                {activeTab === 'file' ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                            <svg className="w-10 h-10 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                            <span className="text-sm text-slate-600 font-medium">{file ? file.name : '點擊選擇 Excel 或 CSV 檔案'}</span>
                            <span className="text-xs text-slate-400 mt-1">支援 .xlsx, .xls, .csv</span>
                        </label>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">檔案連結 (Google Sheets 或 Excel)</label>
                        <input 
                            type="text" 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-white text-slate-900"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            提示：如果是 Google 試算表，請確保權限已開啟為「知道連結的人均可檢視」。
                        </p>
                    </div>
                )}
                
                <div className="bg-sky-50 p-3 rounded-md text-sm text-sky-800">
                     <strong>欄位順序要求：</strong> {columns.join(', ')}
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>

        <div className="p-4 border-t text-right space-x-2 bg-slate-50 rounded-b-lg">
          <button onClick={handleClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">取消</button>
          <button 
            onClick={handleImport} 
            disabled={isLoading}
            className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:bg-sky-300 flex items-center justify-center inline-flex min-w-[80px]"
          >
            {isLoading ? (
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
            ) : '開始匯入'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Importer;
