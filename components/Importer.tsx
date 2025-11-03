import React, { useState } from 'react';

interface ImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: string) => void;
  title: string;
  columns: string[];
}

const Importer: React.FC<ImporterProps> = ({ isOpen, onClose, onImport, title, columns }) => {
  const [pastedData, setPastedData] = useState('');

  if (!isOpen) return null;

  const handleImportClick = () => {
    if (pastedData.trim()) {
      onImport(pastedData);
      setPastedData('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="font-medium text-slate-700">操作說明：</p>
            <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1 mt-1">
              <li>在您的 Google 試算表中，選取您要匯入的資料。</li>
              <li>請確保欄位順序為：<span className="font-semibold">{columns.join(', ')}</span>。</li>
              <li>複製您選取的儲存格 (Ctrl+C 或 Cmd+C)。</li>
              <li>將複製的內容貼到下方的文字區域中 (Ctrl+V 或 Cmd+V)。</li>
            </ol>
          </div>
          <textarea
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            placeholder="在此貼上試算表資料..."
            className="w-full h-40 p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-white"
            aria-label="Pasted data area"
          />
        </div>
        <div className="p-4 border-t text-right space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">取消</button>
          <button onClick={handleImportClick} className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:bg-sky-300" disabled={!pastedData.trim()}>匯入資料</button>
        </div>
      </div>
    </div>
  );
};

export default Importer;
