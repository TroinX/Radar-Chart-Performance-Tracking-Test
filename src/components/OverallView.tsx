import React, { useState } from 'react';
import { ClassTab, MiniTab, Student, CriteriaGroup } from '../types';
import { RadarChart } from './RadarChart';
import { CheckSquare, Square, Users, BarChart3, TrendingUp, HelpCircle } from 'lucide-react';

interface OverallViewProps {
  classTab: ClassTab;
  onUpdateClassTab: (updated: ClassTab) => void;
}

export const OverallView: React.FC<OverallViewProps> = ({ classTab, onUpdateClassTab }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | 'ALL_CLASS'>('ALL_CLASS');

  const { miniTabs, selectedMiniTabIdsForOverall } = classTab;

  // Toggle mini tab checkbox for overall summary
  const handleToggleMiniTab = (miniTabId: string) => {
    const isSelected = selectedMiniTabIdsForOverall.includes(miniTabId);
    let updatedIds: string[];
    if (isSelected) {
      updatedIds = selectedMiniTabIdsForOverall.filter((id) => id !== miniTabId);
    } else {
      updatedIds = [...selectedMiniTabIdsForOverall, miniTabId];
    }

    onUpdateClassTab({
      ...classTab,
      selectedMiniTabIdsForOverall: updatedIds,
    });
  };

  // Active mini tabs selected for overall summary
  const activeSelectedMiniTabs = miniTabs.filter((mt) =>
    selectedMiniTabIdsForOverall.includes(mt.id)
  );

  if (miniTabs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        No mini tabs available in this class. Add a mini tab to view overall summarization.
      </div>
    );
  }

  // Combine and calculate aggregated summary MiniTab for whole class & individual students
  // Base template on the first mini tab structure (groups, criteria, circles)
  const baseMiniTab = activeSelectedMiniTabs[0] || miniTabs[0];

  // Collect all unique students across selected mini tabs
  const studentMap = new Map<string, Student>();
  activeSelectedMiniTabs.forEach((mt) => {
    mt.students.forEach((s) => studentMap.set(s.id, s));
  });
  const aggregatedStudents = Array.from(studentMap.values());

  // Aggregate performances: average score per student per criterion across selected mini tabs
  const aggregatedPerformances: Record<string, Record<string, number>> = {};
  const wholeClassPerformances: Record<string, Record<string, number>> = {
    class_avg: {},
  };

  if (activeSelectedMiniTabs.length > 0) {
    // 1. Calculate per-student average
    aggregatedStudents.forEach((student) => {
      const studentPerf: Record<string, number> = {};

      baseMiniTab.criteria.forEach((criterion) => {
        let totalScore = 0;
        let count = 0;

        activeSelectedMiniTabs.forEach((mt) => {
          const perf = mt.performances[student.id]?.[criterion.id];
          if (perf !== undefined) {
            totalScore += perf;
            count++;
          }
        });

        studentPerf[criterion.id] = count > 0 ? parseFloat((totalScore / count).toFixed(2)) : 0;
      });

      aggregatedPerformances[student.id] = studentPerf;
    });

    // 2. Calculate whole class average per criterion across selected mini tabs
    baseMiniTab.criteria.forEach((criterion) => {
      let totalScore = 0;
      let totalEntries = 0;

      activeSelectedMiniTabs.forEach((mt) => {
        mt.students.forEach((s) => {
          const perf = mt.performances[s.id]?.[criterion.id];
          if (perf !== undefined) {
            totalScore += perf;
            totalEntries++;
          }
        });
      });

      wholeClassPerformances.class_avg[criterion.id] =
        totalEntries > 0 ? parseFloat((totalScore / totalEntries).toFixed(2)) : 0;
    });
  }

  // Construct artificial summary miniTab for chart display
  const isClassAvgMode = selectedStudentId === 'ALL_CLASS';

  const summaryMiniTab: MiniTab = {
    ...baseMiniTab,
    id: 'overall_summary',
    name: `${classTab.name} - Overall Summary`,
    students: isClassAvgMode
      ? [{ id: 'class_avg', name: 'Whole Class Average' }]
      : aggregatedStudents.filter((s) => s.id === selectedStudentId),
    performances: isClassAvgMode ? wholeClassPerformances : aggregatedPerformances,
  };

  // Group summary calculations (average score per group for criteria)
  const groupAverages = baseMiniTab.groups.map((group) => {
    const groupCriteria = baseMiniTab.criteria.filter((c) => c.groupId === group.id);
    if (groupCriteria.length === 0) return { group, avgScore: 0 };

    let sum = 0;
    let total = 0;

    groupCriteria.forEach((c) => {
      if (isClassAvgMode) {
        const val = wholeClassPerformances.class_avg?.[c.id] || 0;
        sum += val;
        total++;
      } else {
        const val = aggregatedPerformances[selectedStudentId]?.[c.id] || 0;
        sum += val;
        total++;
      }
    });

    return {
      group,
      avgScore: total > 0 ? parseFloat((sum / total).toFixed(2)) : 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* HEADER & MINI TAB CHECKBOXES SELECTION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-800">
                Overall Summarization: <span className="text-blue-600">{classTab.name}</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select mini tabs to tick/include in the aggregated summarization graph and metrics.
            </p>
          </div>

          {/* VIEW SWITCHER: WHOLE CLASS VS INDIVIDUAL STUDENT */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedStudentId('ALL_CLASS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                selectedStudentId === 'ALL_CLASS'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Whole Class</span>
            </button>

            <select
              value={selectedStudentId === 'ALL_CLASS' ? '' : selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value || 'ALL_CLASS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg bg-transparent border-0 focus:outline-none cursor-pointer ${
                selectedStudentId !== 'ALL_CLASS' ? 'text-blue-600 font-bold bg-white shadow-xs' : 'text-slate-600'
              }`}
            >
              <option value="">-- Select Student --</option>
              {aggregatedStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CHECKBOXES FOR MINI TABS */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 block">
            Included Mini Tabs ({selectedMiniTabIdsForOverall.length} / {miniTabs.length} ticked):
          </span>
          <div className="flex flex-wrap gap-2">
            {miniTabs.map((mt) => {
              const isChecked = selectedMiniTabIdsForOverall.includes(mt.id);
              return (
                <label
                  key={`tick-mt-${mt.id}`}
                  onClick={() => handleToggleMiniTab(mt.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                    isChecked
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>{mt.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* OVERALL GRAPH & GROUP BREAKDOWN METRICS */}
      {activeSelectedMiniTabs.length === 0 ? (
        <div className="p-8 text-center text-amber-600 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-medium">
          Please tick at least one mini tab above to generate the overall summarization graph.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* RADAR CHART CONTAINER */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center">
            <RadarChart
              miniTab={summaryMiniTab}
              selectedStudentId={isClassAvgMode ? 'class_avg' : selectedStudentId}
              width={700}
              height={700}
              customTitle={
                isClassAvgMode
                  ? 'Whole Class Average Summarization'
                  : `Individual Summary: ${aggregatedStudents.find((s) => s.id === selectedStudentId)?.name || ''}`
              }
            />
          </div>

          {/* GROUP STATS BREAKDOWN */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Performance By Group Criteria</span>
              </h4>

              <div className="space-y-3">
                {groupAverages.map(({ group, avgScore }) => {
                  const percentage = Math.round((avgScore / baseMiniTab.circles.count) * 100);

                  return (
                    <div key={`group-avg-${group.id}`} className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <span style={{ color: group.color || '#3b82f6' }}>{group.name}</span>
                        <span className="text-slate-800">
                          {avgScore} / {baseMiniTab.circles.count} ({percentage}%)
                        </span>
                      </div>

                      {/* PROGRESS BAR */}
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: group.color || '#3b82f6',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DETAILED CRITERIA SCORES TABLE */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Criteria Detailed Means
              </h4>

              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {baseMiniTab.criteria.map((c) => {
                  const score = isClassAvgMode
                    ? wholeClassPerformances.class_avg?.[c.id] || 0
                    : aggregatedPerformances[selectedStudentId]?.[c.id] || 0;

                  return (
                    <div
                      key={`crit-detail-${c.id}`}
                      className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg border border-slate-200/60"
                    >
                      <span className="text-slate-700 font-medium truncate max-w-[220px]" title={c.name}>
                        {c.name}
                      </span>
                      <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
