import React, { useState, useEffect } from 'react';
import { Download, X, FileText, Palette, Check, Image as ImageIcon } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: (exportOptions: {
    filename: string;
    bgColor: string;
    format: 'png' | 'jpeg';
  }) => void;
  defaultFilename: string;
  isBatchExport: boolean;
  initialFormat: 'png' | 'jpeg';
  isExporting: boolean;
  exportProgress: { current: number; total: number } | null;
}

const COLOR_PRESETS = [
  { name: 'Pure White', hex: '#ffffff', border: true },
  { name: 'Soft Light Gray', hex: '#f8fafc', border: true },
  { name: 'Light Slate', hex: '#f1f5f9', border: true },
  { name: 'Soft Blue', hex: '#eff6ff', border: false },
  { name: 'Dark Navy', hex: '#0f172a', border: false },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onConfirmExport,
  defaultFilename,
  isBatchExport,
  initialFormat,
  isExporting,
  exportProgress,
}) => {
  const [filename, setFilename] = useState(defaultFilename);
  const [bgType, setBgType] = useState<'transparent' | 'solid'>('transparent');
  const [solidColor, setSolidColor] = useState('#ffffff');
  const [format, setFormat] = useState<'png' | 'jpeg'>(initialFormat);

  useEffect(() => {
    if (isOpen) {
      setFilename(defaultFilename);
      setFormat(initialFormat);
      if (initialFormat === 'jpeg') {
        setBgType('solid');
      }
    }
  }, [isOpen, defaultFilename, initialFormat]);

  if (!isOpen) return null;

  const effectiveBgColor = bgType === 'transparent' ? 'transparent' : solidColor;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = filename.trim() || defaultFilename;
    onConfirmExport({
      filename: finalName,
      bgColor: format === 'jpeg' ? (bgType === 'transparent' ? '#ffffff' : solidColor) : effectiveBgColor,
      format,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {isBatchExport ? 'Export All Charts (ZIP)' : 'Export Chart Image'}
              </h3>
              <p className="text-xs text-slate-500">Customize filename and background style</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL FORM */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* OPTION 1: CHANGE THE NAME */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>{isBatchExport ? 'ZIP Archive Name' : 'Image File Name'}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Editable</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter custom file name..."
                disabled={isExporting}
                className="w-full pl-3 pr-16 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
              />
              <span className="absolute right-3 text-xs font-bold text-slate-400 uppercase pointer-events-none">
                .{isBatchExport ? 'zip' : format}
              </span>
            </div>
          </div>

          {/* FORMAT SELECTION */}
          {!isBatchExport && (
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Image Format</span>
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormat('png')}
                  disabled={isExporting}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    format === 'png'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PNG (Supports Transparent)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormat('jpeg');
                    if (bgType === 'transparent') setBgType('solid');
                  }}
                  disabled={isExporting}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    format === 'jpeg'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  JPEG (Solid Background)
                </button>
              </div>
            </div>
          )}

          {/* OPTION 2: CHANGE THE BACKGROUND COLOR */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Palette className="w-3.5 h-3.5 text-blue-600" />
              <span>Background Style</span>
            </label>

            {/* BG TYPE SELECTOR: TRANSPARENT VS SOLID */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBgType('transparent')}
                disabled={isExporting || format === 'jpeg'}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  bgType === 'transparent' && format !== 'jpeg'
                    ? 'border-blue-500 bg-blue-50/60 text-blue-700 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                } ${format === 'jpeg' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="w-4 h-4 rounded border border-slate-300 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:4px_4px]" />
                <span>Transparent</span>
              </button>

              <button
                type="button"
                onClick={() => setBgType('solid')}
                disabled={isExporting}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  bgType === 'solid'
                    ? 'border-blue-500 bg-blue-50/60 text-blue-700 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div
                  className="w-4 h-4 rounded border border-slate-300 shadow-2xs"
                  style={{ backgroundColor: solidColor }}
                />
                <span>Solid Color</span>
              </button>
            </div>

            {/* SOLID COLOR CHOOSER */}
            {bgType === 'solid' && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5 animate-in fade-in duration-100">
                <span className="text-[11px] font-bold text-slate-600 block">Choose Solid Color:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setSolidColor(preset.hex)}
                      disabled={isExporting}
                      className={`w-7 h-7 rounded-lg transition-transform flex items-center justify-center relative ${
                        preset.border ? 'border border-slate-300' : ''
                      } ${
                        solidColor.toLowerCase() === preset.hex.toLowerCase()
                          ? 'scale-110 ring-2 ring-blue-500 ring-offset-1'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                      title={preset.name}
                    >
                      {solidColor.toLowerCase() === preset.hex.toLowerCase() && (
                        <Check
                          className={`w-3.5 h-3.5 ${
                            preset.hex === '#0f172a' ? 'text-white' : 'text-slate-800'
                          }`}
                        />
                      )}
                    </button>
                  ))}

                  {/* CUSTOM COLOR PICKER */}
                  <label
                    className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                    title="Custom Color"
                  >
                    <input
                      type="color"
                      value={solidColor}
                      onChange={(e) => setSolidColor(e.target.value)}
                      disabled={isExporting}
                      className="w-4 h-4 p-0 border-0 rounded cursor-pointer"
                    />
                    <span>Custom</span>
                  </label>
                </div>
              </div>
            )}

            {/* VISUAL BACKGROUND PREVIEW TILE */}
            <div className="flex items-center justify-between p-2.5 bg-slate-100/70 border border-slate-200/60 rounded-xl text-xs">
              <span className="font-semibold text-slate-600">Background Preview:</span>
              <div
                className={`w-28 h-6 rounded-lg border border-slate-300/80 flex items-center justify-center text-[10px] font-bold shadow-2xs ${
                  bgType === 'transparent' && format !== 'jpeg'
                    ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:6px_6px] text-slate-500'
                    : ''
                }`}
                style={
                  bgType === 'solid' || format === 'jpeg'
                    ? { backgroundColor: solidColor, color: solidColor === '#0f172a' ? '#fff' : '#334155' }
                    : {}
                }
              >
                {bgType === 'transparent' && format !== 'jpeg' ? 'Transparent' : solidColor}
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isExporting}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isExporting
                  ? exportProgress
                    ? `Exporting ${exportProgress.current}/${exportProgress.total}...`
                    : 'Exporting...'
                  : 'Download'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
