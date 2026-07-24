import React, { useState, useEffect, useRef } from 'react';
import { AppState, GradeTabGroup, ClassTab, MiniTab, Student } from './types';
import { createDefaultAppState, createDefaultMiniTab } from './utils/defaultData';
import { saveLocalState, loadLocalState, exportStateAsJSON, importStateFromJSON, uploadToGoogleDrive } from './utils/driveSync';
import { RadarChart } from './components/RadarChart';
import { StudentsDataEditor } from './components/StudentsDataEditor';
import { OverallView } from './components/OverallView';
import { downloadChartImage, downloadAllChartsInMiniTab } from './utils/exportCharts';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  Download,
  Upload,
  HardDrive,
  RefreshCw,
  BarChart2,
  Layers,
  GraduationCap,
  Users,
  CheckSquare,
  Square,
  Share2,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function App() {
  // Load state from local storage or initialize default state
  const [appState, setAppState] = useState<AppState>(() => {
    const saved = loadLocalState();
    return saved || createDefaultAppState();
  });

  // Active student selection state
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Export options state
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const [downloadAllMiniTabCharts, setDownloadAllMiniTabCharts] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);

  // Renaming inline states
  const [editingItem, setEditingItem] = useState<{ type: 'grade' | 'class' | 'miniTab'; id: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Drive sync state
  const [driveAccessToken, setDriveAccessToken] = useState<string>('');
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [driveSyncStatus, setDriveSyncStatus] = useState<string>('');
  const [showDriveModal, setShowDriveModal] = useState(false);

  // Constant local auto-sync on every state change
  useEffect(() => {
    saveLocalState(appState);
  }, [appState]);

  // Current active Grade Tab Group
  const activeGradeGroup =
    appState.tabGroups.find((g) => g.id === appState.activeTabGroupId) || appState.tabGroups[0];

  // Current active Class Tab
  const activeClassTab =
    activeGradeGroup?.tabs.find((t) => t.id === activeGradeGroup.activeTabId) ||
    activeGradeGroup?.tabs[0];

  // Current active Mini Tab
  const activeMiniTab =
    activeClassTab?.miniTabs.find((m) => m.id === activeClassTab.activeMiniTabId) ||
    activeClassTab?.miniTabs[0];

  // Ensure default selected student when active mini tab changes
  useEffect(() => {
    if (activeMiniTab) {
      if (
        !selectedStudentId ||
        (selectedStudentId !== 'ALL_CLASS' &&
          !activeMiniTab.students.some((s) => s.id === selectedStudentId))
      ) {
        setSelectedStudentId(selectedStudentId === 'ALL_CLASS' ? 'ALL_CLASS' : activeMiniTab.students[0]?.id || 'ALL_CLASS');
      }
    } else {
      setSelectedStudentId(null);
    }
  }, [activeMiniTab?.id]);

  // SVG Ref for single chart exports
  const chartSvgContainerRef = useRef<HTMLDivElement>(null);

  // STATE UPDATE HELPERS
  const updateAppState = (updater: (prev: AppState) => AppState) => {
    setAppState((prev) => updater(prev));
  };

  // 1. TAB GROUP (GRADE) MANAGEMENT
  const handleAddGrade = () => {
    const newGradeNum = appState.tabGroups.length + 1;
    const newGrade: GradeTabGroup = {
      id: `gt_${Date.now()}`,
      name: `Grade ${newGradeNum}`,
      tabs: [
        {
          id: `ct_${Date.now()}`,
          name: `Class ${newGradeNum}-A`,
          miniTabs: [createDefaultMiniTab(`mt_${Date.now()}`, 'Term 1 Assessment')],
          activeMiniTabId: `mt_${Date.now()}`,
          selectedMiniTabIdsForOverall: [`mt_${Date.now()}`],
        },
      ],
      activeTabId: `ct_${Date.now()}`,
      isOverallActive: false,
    };

    updateAppState((prev) => ({
      ...prev,
      tabGroups: [...prev.tabGroups, newGrade],
      activeTabGroupId: newGrade.id,
    }));
  };

  const handleRemoveGrade = (gradeId: string) => {
    if (appState.tabGroups.length <= 1) return; // keep at least 1 grade
    const filtered = appState.tabGroups.filter((g) => g.id !== gradeId);
    updateAppState((prev) => ({
      ...prev,
      tabGroups: filtered,
      activeTabGroupId: filtered[0].id,
    }));
  };

  // 2. CLASS TAB MANAGEMENT
  const handleAddClass = () => {
    if (!activeGradeGroup) return;
    const newClassNum = activeGradeGroup.tabs.length + 1;
    const newMiniTabId = `mt_${Date.now()}`;
    const newClass: ClassTab = {
      id: `ct_${Date.now()}`,
      name: `Class ${newClassNum}`,
      miniTabs: [createDefaultMiniTab(newMiniTabId, 'Term 1 Assessment')],
      activeMiniTabId: newMiniTabId,
      selectedMiniTabIdsForOverall: [newMiniTabId],
    };

    updateAppState((prev) => ({
      ...prev,
      tabGroups: prev.tabGroups.map((g) =>
        g.id === activeGradeGroup.id
          ? {
              ...g,
              tabs: [...g.tabs, newClass],
              activeTabId: newClass.id,
              isOverallActive: false,
            }
          : g
      ),
    }));
  };

  const handleRemoveClass = (classId: string) => {
    if (!activeGradeGroup || activeGradeGroup.tabs.length <= 1) return;
    const filteredTabs = activeGradeGroup.tabs.filter((t) => t.id !== classId);
    updateAppState((prev) => ({
      ...prev,
      tabGroups: prev.tabGroups.map((g) =>
        g.id === activeGradeGroup.id
          ? {
              ...g,
              tabs: filteredTabs,
              activeTabId: filteredTabs[0].id,
              isOverallActive: false,
            }
          : g
      ),
    }));
  };

  // 3. MINI TAB MANAGEMENT
  const handleAddMiniTab = () => {
    if (!activeClassTab) return;
    const count = activeClassTab.miniTabs.length + 1;
    const newMiniTab = createDefaultMiniTab(`mt_${Date.now()}`, `Assessment ${count}`);

    updateAppState((prev) => ({
      ...prev,
      tabGroups: prev.tabGroups.map((g) =>
        g.id === activeGradeGroup.id
          ? {
              ...g,
              tabs: g.tabs.map((t) =>
                t.id === activeClassTab.id
                  ? {
                      ...t,
                      miniTabs: [...t.miniTabs, newMiniTab],
                      activeMiniTabId: newMiniTab.id,
                      selectedMiniTabIdsForOverall: [...t.selectedMiniTabIdsForOverall, newMiniTab.id],
                    }
                  : t
              ),
            }
          : g
      ),
    }));
  };

  const handleRemoveMiniTab = (miniTabId: string) => {
    if (!activeClassTab || activeClassTab.miniTabs.length <= 1) return;
    const filtered = activeClassTab.miniTabs.filter((m) => m.id !== miniTabId);

    updateAppState((prev) => ({
      ...prev,
      tabGroups: prev.tabGroups.map((g) =>
        g.id === activeGradeGroup.id
          ? {
              ...g,
              tabs: g.tabs.map((t) =>
                t.id === activeClassTab.id
                  ? {
                      ...t,
                      miniTabs: filtered,
                      activeMiniTabId: filtered[0].id,
                      selectedMiniTabIdsForOverall: t.selectedMiniTabIdsForOverall.filter(
                        (id) => id !== miniTabId
                      ),
                    }
                  : t
              ),
            }
          : g
      ),
    }));
  };

  // UPDATE ACTIVE MINI TAB DATA
  const handleUpdateActiveMiniTab = (updatedMiniTab: MiniTab) => {
    updateAppState((prev) => ({
      ...prev,
      tabGroups: prev.tabGroups.map((g) =>
        g.id === activeGradeGroup.id
          ? {
              ...g,
              tabs: g.tabs.map((t) =>
                t.id === activeClassTab.id
                  ? {
                      ...t,
                      miniTabs: t.miniTabs.map((m) => (m.id === updatedMiniTab.id ? updatedMiniTab : m)),
                    }
                  : t
              ),
            }
          : g
      ),
    }));
  };

  // UPDATE CLASS TAB (FOR OVERALL MINI TAB SELECTION)
  const handleUpdateActiveClassTab = (updatedClassTab: ClassTab) => {
    updateAppState((prev) => ({
      ...prev,
      tabGroups: prev.tabGroups.map((g) =>
        g.id === activeGradeGroup.id
          ? {
              ...g,
              tabs: g.tabs.map((t) => (t.id === updatedClassTab.id ? updatedClassTab : t)),
            }
          : g
      ),
    }));
  };

  // RENAMING ACTION
  const handleStartRename = (type: 'grade' | 'class' | 'miniTab', id: string, currentName: string) => {
    setEditingItem({ type, id });
    setRenameValue(currentName);
  };

  const handleSaveRename = () => {
    if (!editingItem || !renameValue.trim()) {
      setEditingItem(null);
      return;
    }

    const { type, id } = editingItem;
    const trimmed = renameValue.trim();

    updateAppState((prev) => ({
      ...prev,
      tabGroups: prev.tabGroups.map((g) => {
        if (type === 'grade' && g.id === id) {
          return { ...g, name: trimmed };
        }
        return {
          ...g,
          tabs: g.tabs.map((t) => {
            if (type === 'class' && t.id === id) {
              return { ...t, name: trimmed };
            }
            return {
              ...t,
              miniTabs: t.miniTabs.map((m) => {
                if (type === 'miniTab' && m.id === id) {
                  return { ...m, name: trimmed };
                }
                return m;
              }),
            };
          }),
        };
      }),
    }));

    setEditingItem(null);
  };

  // CHART EXPORT DISPATCH
  const handleExport = async () => {
    if (!activeMiniTab) return;
    setIsExporting(true);

    try {
      if (downloadAllMiniTabCharts) {
        // Batch ZIP download for all students in the mini tab
        await downloadAllChartsInMiniTab(activeMiniTab, exportFormat, (current, total) => {
          setExportProgress({ current, total });
        });
      } else {
        // Single active chart SVG export
        const svgElem = chartSvgContainerRef.current?.querySelector('svg');
        if (svgElem) {
          const isClassAvg = selectedStudentId === 'ALL_CLASS';
          const studentName = isClassAvg
            ? 'Whole_Class_Average'
            : activeMiniTab.students.find((s) => s.id === selectedStudentId)?.name || 'student';
          const filename = `${activeClassTab.name}_${activeMiniTab.name}_${studentName}`.replace(
            /[^a-zA-Z0-9_-]/g,
            '_'
          );
          await downloadChartImage(svgElem, filename, exportFormat);
        }
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please check your browser permissions or try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // GOOGLE DRIVE MANUAL / ACCESS TOKEN SYNC
  const handleSyncGoogleDrive = async () => {
    if (!driveAccessToken.trim()) {
      alert('Please enter your Google OAuth Access Token to backup data to Google Drive.');
      return;
    }

    setIsSyncingDrive(true);
    setDriveSyncStatus('Syncing data to Google Drive...');

    try {
      const res = await uploadToGoogleDrive(
        driveAccessToken.trim(),
        appState,
        appState.driveSyncedFileId
      );
      updateAppState((prev) => ({
        ...prev,
        driveSyncedFileId: res.fileId,
        lastSyncedAt: new Date().toLocaleTimeString(),
      }));
      setDriveSyncStatus(`Successfully backed up to Google Drive file ID: ${res.fileId}`);
    } catch (err: any) {
      console.error(err);
      setDriveSyncStatus(`Drive Sync error: ${err.message || 'Failed'}`);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // FILE IMPORT
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imported = await importStateFromJSON(file);
        setAppState(imported);
        alert('Data imported successfully!');
      } catch (err) {
        alert('Failed to import file: Invalid JSON structure.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col antialiased">
      {/* TOP APPLICATION HEADER */}
      <header className="bg-slate-900 text-white px-4 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-xs">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Student Radar Tracking App
              <span className="text-[10px] font-medium bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/20">
                Auto Sync Active
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Multi-Grade & Class Radar Assessment Engine with Overall Summarization
            </p>
          </div>
        </div>

        {/* TOP TOOLBAR: SYNC & EXPORT BUTTONS */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* LOCAL SYNC STATUS */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700/80">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
            <span>Saved Locally</span>
            {appState.lastSyncedAt && (
              <span className="text-slate-400 font-mono text-[10px]">({appState.lastSyncedAt})</span>
            )}
          </div>

          {/* GOOGLE DRIVE MODAL BUTTON */}
          <button
            onClick={() => setShowDriveModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span>Google Drive Sync</span>
          </button>

          {/* EXPORT DATA JSON */}
          <button
            onClick={() => exportStateAsJSON(appState)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Download JSON backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data</span>
          </button>

          {/* IMPORT DATA JSON */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import Data</span>
            <input type="file" accept=".json" onChange={handleFileInputChange} className="hidden" />
          </label>
        </div>
      </header>

      {/* GOOGLE DRIVE SYNC MODAL */}
      {showDriveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800">Google Drive Backup Sync</h3>
              </div>
              <button
                onClick={() => setShowDriveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Your data is constantly saved locally in your browser. You can also sync and back up your tracking files directly to your Google Drive storage.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Google OAuth Access Token:
              </label>
              <input
                type="password"
                placeholder="Paste Google Drive OAuth access token..."
                value={driveAccessToken}
                onChange={(e) => setDriveAccessToken(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 block">
                To sync, paste an OAuth token with drive.file scope.
              </span>
            </div>

            {driveSyncStatus && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 break-all">
                {driveSyncStatus}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDriveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={handleSyncGoogleDrive}
                disabled={isSyncingDrive}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {isSyncingDrive ? 'Syncing...' : 'Sync to Google Drive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-5">
        {/* LEVEL 1: TAB GROUP NAVIGATION (GRADES) */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>Grade Groups</span>
          </div>

          <div className="flex items-center gap-2 flex-1 overflow-x-auto py-0.5">
            {appState.tabGroups.map((grade) => {
              const isActive = grade.id === activeGradeGroup?.id;
              const isEditing = editingItem?.type === 'grade' && editingItem.id === grade.id;

              return (
                <div
                  key={grade.id}
                  onClick={() =>
                    updateAppState((prev) => ({
                      ...prev,
                      activeTabGroupId: grade.id,
                    }))
                  }
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {isEditing ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                      onClick={(e) => e.stopPropagation()}
                      className="px-1 py-0.5 text-slate-900 bg-white rounded-md text-xs font-bold w-24 focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span>{grade.name}</span>
                  )}

                  {isActive && !isEditing && (
                    <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleStartRename('grade', grade.id, grade.name)}
                        className="p-1 hover:bg-blue-700/60 rounded-md transition-colors"
                        title="Rename grade"
                      >
                        <Edit2 className="w-3 h-3 text-blue-100" />
                      </button>
                      {appState.tabGroups.length > 1 && (
                        <button
                          onClick={() => handleRemoveGrade(grade.id)}
                          className="p-1 hover:bg-blue-700/60 rounded-md transition-colors text-blue-200 hover:text-white"
                          title="Delete grade"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {isEditing && (
                    <button
                      onClick={handleSaveRename}
                      className="p-1 bg-white text-blue-600 rounded-md font-bold text-[10px]"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              onClick={handleAddGrade}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-dashed border-slate-300 transition-all text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Grade Group</span>
            </button>
          </div>
        </div>

        {/* LEVEL 2: CLASS TABS & OVERALL TAB (COMPLEMENT) */}
        {activeGradeGroup && (
          <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Classes</span>
              </div>

              {activeGradeGroup.tabs.map((classTab) => {
                const isTabActive =
                  classTab.id === activeClassTab?.id && !activeGradeGroup.isOverallActive;
                const isOverallActive =
                  classTab.id === activeClassTab?.id && activeGradeGroup.isOverallActive;
                const isEditing = editingItem?.type === 'class' && editingItem.id === classTab.id;

                return (
                  <div
                    key={classTab.id}
                    className="flex items-center bg-slate-100/90 rounded-xl p-1 border border-slate-200/80"
                  >
                    {/* CLASS TAB BUTTON */}
                    <button
                      onClick={() =>
                        updateAppState((prev) => ({
                          ...prev,
                          tabGroups: prev.tabGroups.map((g) =>
                            g.id === activeGradeGroup.id
                              ? { ...g, activeTabId: classTab.id, isOverallActive: false }
                              : g
                          ),
                        }))
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isTabActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                          onClick={(e) => e.stopPropagation()}
                          className="px-1 py-0.5 text-slate-900 bg-white rounded-md text-xs font-bold w-20 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span>{classTab.name}</span>
                      )}

                      {isTabActive && !isEditing && (
                        <span className="flex items-center gap-0.5 ml-1">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename('class', classTab.id, classTab.name);
                            }}
                            className="p-0.5 hover:bg-emerald-700 rounded transition-colors"
                          >
                            <Edit2 className="w-3 h-3 text-emerald-100" />
                          </span>
                          {activeGradeGroup.tabs.length > 1 && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveClass(classTab.id);
                              }}
                              className="p-0.5 hover:bg-emerald-700 rounded transition-colors text-emerald-200"
                            >
                              <Trash2 className="w-3 h-3" />
                            </span>
                          )}
                        </span>
                      )}
                    </button>

                    {/* OVERALL TAB COMPLEMENT BUTTON (NEXT TO CLASS TAB) */}
                    <button
                      onClick={() =>
                        updateAppState((prev) => ({
                          ...prev,
                          tabGroups: prev.tabGroups.map((g) =>
                            g.id === activeGradeGroup.id
                              ? { ...g, activeTabId: classTab.id, isOverallActive: true }
                              : g
                          ),
                        }))
                      }
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ml-1 ${
                        isOverallActive
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
                      }`}
                      title={`Overall summarization graph for ${classTab.name}`}
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>Overall</span>
                    </button>
                  </div>
                );
              })}

              <button
                onClick={handleAddClass}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-dashed border-slate-300 transition-all text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Class</span>
              </button>
            </div>
          </div>
        )}

        {/* OVERALL VIEW OR CLASS MINI-TABS VIEW */}
        {activeGradeGroup?.isOverallActive && activeClassTab ? (
          /* OVERALL VIEW COMPONENT */
          <OverallView
            classTab={activeClassTab}
            onUpdateClassTab={handleUpdateActiveClassTab}
          />
        ) : (
          /* CLASS VIEW WITH MINI TABS */
          <div className="space-y-5">
            {/* LEVEL 3: MINI TABS NAVIGATION */}
            {activeClassTab && (
              <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2 overflow-x-auto">
                <div className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Mini Tabs</span>
                </div>

                <div className="flex items-center gap-2 flex-1 overflow-x-auto py-0.5">
                  {activeClassTab.miniTabs.map((miniTab) => {
                    const isActive = miniTab.id === activeMiniTab?.id;
                    const isEditing = editingItem?.type === 'miniTab' && editingItem.id === miniTab.id;

                    return (
                      <div
                        key={miniTab.id}
                        onClick={() =>
                          updateAppState((prev) => ({
                            ...prev,
                            tabGroups: prev.tabGroups.map((g) =>
                              g.id === activeGradeGroup.id
                                ? {
                                    ...g,
                                    tabs: g.tabs.map((t) =>
                                      t.id === activeClassTab.id
                                        ? { ...t, activeMiniTabId: miniTab.id }
                                        : t
                                    ),
                                  }
                                : g
                            ),
                          }))
                        }
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                          isActive
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                        }`}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                            onClick={(e) => e.stopPropagation()}
                            className="px-1 py-0.5 text-slate-900 bg-white rounded-md text-xs font-bold w-24 focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <span>{miniTab.name}</span>
                        )}

                        {isActive && !isEditing && (
                          <div className="flex items-center gap-0.5 ml-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleStartRename('miniTab', miniTab.id, miniTab.name)}
                              className="p-0.5 hover:bg-purple-700/60 rounded transition-colors"
                              title="Rename mini tab"
                            >
                              <Edit2 className="w-3 h-3 text-purple-100" />
                            </button>
                            {activeClassTab.miniTabs.length > 1 && (
                              <button
                                onClick={() => handleRemoveMiniTab(miniTab.id)}
                                className="p-0.5 hover:bg-purple-700/60 rounded transition-colors text-purple-200 hover:text-white"
                                title="Delete mini tab"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={handleAddMiniTab}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-600 border border-dashed border-slate-300 transition-all text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Mini Tab</span>
                  </button>
                </div>
              </div>
            )}

            {/* CONTENT GRID: RADAR CHART STAGE + STUDENTS DATA EDITOR */}
            {activeMiniTab && (() => {
              // Calculate Whole Class Average performances for activeMiniTab
              const miniTabClassAvgPerformance: Record<string, number> = {};
              if (activeMiniTab.students.length > 0) {
                activeMiniTab.criteria.forEach((criterion) => {
                  let sum = 0;
                  let count = 0;
                  activeMiniTab.students.forEach((student) => {
                    const val = activeMiniTab.performances[student.id]?.[criterion.id];
                    if (val !== undefined && val !== null) {
                      sum += val;
                      count++;
                    }
                  });
                  miniTabClassAvgPerformance[criterion.id] =
                    count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
                });
              }

              const isClassAvgMode = selectedStudentId === 'ALL_CLASS';

              const displayMiniTabForChart: MiniTab = isClassAvgMode
                ? {
                    ...activeMiniTab,
                    students: [{ id: 'class_avg', name: 'Whole Class Average' }],
                    performances: {
                      ...activeMiniTab.performances,
                      class_avg: miniTabClassAvgPerformance,
                    },
                  }
                : activeMiniTab;

              const activeStudentObj = activeMiniTab.students.find((s) => s.id === selectedStudentId);

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT: RADAR CHART STAGE */}
                  <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    {/* CHART ACTION TOOLBAR: EXPORT OPTIONS & MINI TAB CHECKBOX */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      {/* EXPORT FORMAT SELECTOR & MINI TAB BATCH CHECKBOX */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">Format:</span>
                          <select
                            value={exportFormat}
                            onChange={(e) => setExportFormat(e.target.value as 'png' | 'jpeg')}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:outline-none"
                          >
                            <option value="png">PNG Image</option>
                            <option value="jpeg">JPEG Image</option>
                          </select>
                        </div>

                        {/* CHECKBOX TO DOWNLOAD ALL CHARTS IN MINI TAB */}
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={downloadAllMiniTabCharts}
                            onChange={(e) => setDownloadAllMiniTabCharts(e.target.checked)}
                            className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                          />
                          <span>Download all charts in this mini-tab</span>
                        </label>
                      </div>

                      {/* EXPORT ACTION BUTTON */}
                      <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        <span>
                          {isExporting
                            ? exportProgress
                              ? `Exporting ${exportProgress.current}/${exportProgress.total}...`
                              : 'Exporting...'
                            : downloadAllMiniTabCharts
                            ? 'Export All (ZIP)'
                            : 'Export Chart'}
                        </span>
                      </button>
                    </div>

                    {/* DISPLAY MODE SWITCHER: WHOLE CLASS VS INDIVIDUAL STUDENT */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">Display:</span>
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                          <button
                            onClick={() => setSelectedStudentId('ALL_CLASS')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                              isClassAvgMode
                                ? 'bg-white text-blue-600 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Whole Class</span>
                          </button>

                          <select
                            value={isClassAvgMode ? '' : selectedStudentId || ''}
                            onChange={(e) => setSelectedStudentId(e.target.value || 'ALL_CLASS')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg bg-transparent border-0 focus:outline-none cursor-pointer ${
                              !isClassAvgMode && selectedStudentId
                                ? 'text-blue-600 font-bold bg-white shadow-xs'
                                : 'text-slate-600'
                            }`}
                          >
                            <option value="">-- Individual Student Drop-down --</option>
                            {activeMiniTab.students.map((student) => (
                              <option key={`opt-${student.id}`} value={student.id}>
                                {student.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* RADAR CHART CONTAINER */}
                    <div
                      ref={chartSvgContainerRef}
                      className="flex items-center justify-center min-h-[500px] p-2 bg-white rounded-xl"
                    >
                      <RadarChart
                        miniTab={displayMiniTabForChart}
                        selectedStudentId={isClassAvgMode ? 'class_avg' : selectedStudentId}
                        width={720}
                        height={720}
                        customTitle={`${activeClassTab?.name} - ${activeMiniTab.name} ${
                          isClassAvgMode
                            ? '(Whole Class Average)'
                            : activeStudentObj
                            ? `(${activeStudentObj.name})`
                            : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* RIGHT: STUDENTS DATA & CONFIGURATION EDITOR */}
                  <div className="lg:col-span-5 h-[760px]">
                    <StudentsDataEditor
                      miniTab={activeMiniTab}
                      onUpdateMiniTab={handleUpdateActiveMiniTab}
                      selectedStudentId={selectedStudentId}
                      onSelectStudent={setSelectedStudentId}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
