import { AppState, MiniTab, ClassTab, GradeTabGroup } from '../types';

export function createDefaultMiniTab(id: string, name: string): MiniTab {
  const receptionGroup = { id: 'g_rec', name: 'RECEPTION', showName: true, fontSize: 13, rotation: 0, color: '#3b82f6', showShape: true };
  const interactionGroup = { id: 'g_int', name: 'INTERACTION', showName: true, fontSize: 13, rotation: 0, color: '#06b6d4', showShape: true };
  const productionGroup = { id: 'g_pro', name: 'PRODUCTION', showName: true, fontSize: 13, rotation: 0, color: '#2563eb', showShape: true };
  const mediationGroup = { id: 'g_med', name: 'MEDIATION', showName: true, fontSize: 13, rotation: 0, color: '#6366f1', showShape: true };

  const groups = [receptionGroup, interactionGroup, productionGroup, mediationGroup];

  const criteria = [
    // Reception
    { id: 'c_rec_1', groupId: 'g_rec', name: 'Understanding conversation between other speakers' },
    { id: 'c_rec_2', groupId: 'g_rec', name: 'Understanding as a member of a live audience' },
    { id: 'c_rec_3', groupId: 'g_rec', name: 'Note-taking (lectures, seminars, meetings, etc.)' },
    { id: 'c_rec_4', groupId: 'g_rec', name: 'Reading for orientation' },
    { id: 'c_rec_5', groupId: 'g_rec', name: 'Reading for information and argument' },

    // Interaction
    { id: 'c_int_1', groupId: 'g_int', name: 'Understanding an interlocutor' },
    { id: 'c_int_2', groupId: 'g_int', name: 'Informal discussion (with friends)' },
    { id: 'c_int_3', groupId: 'g_int', name: 'Formal discussion (meetings)' },
    { id: 'c_int_4', groupId: 'g_int', name: 'Goal-oriented co-operation' },
    { id: 'c_int_5', groupId: 'g_int', name: 'Information exchange' },
    { id: 'c_int_6', groupId: 'g_int', name: 'Goal-oriented online transactions and collaboration' },

    // Production
    { id: 'c_pro_1', groupId: 'g_pro', name: 'Sustained monologue: giving information' },
    { id: 'c_pro_2', groupId: 'g_pro', name: 'Sustained monologue: putting a case' },
    { id: 'c_pro_3', groupId: 'g_pro', name: 'Addressing audiences' },
    { id: 'c_pro_4', groupId: 'g_pro', name: 'Reports and essays' },

    // Mediation
    { id: 'c_med_1', groupId: 'g_med', name: 'Facilitating pluricultural space' },
    { id: 'c_med_2', groupId: 'g_med', name: 'Facilitating collaborative interaction with peers' },
    { id: 'c_med_3', groupId: 'g_med', name: 'Collaborating to construct meaning' },
    { id: 'c_med_4', groupId: 'g_med', name: 'Encouraging conceptual talk' },
    { id: 'c_med_5', groupId: 'g_med', name: 'Explaining data (graphs, diagrams, etc.)' },
    { id: 'c_med_6', groupId: 'g_med', name: 'Processing text in writing' },
  ];

  const students = [
    { id: 's_1', name: 'Alex Johnson' },
    { id: 's_2', name: 'Sophia Chen' },
    { id: 's_3', name: 'Marcus Miller' },
  ];

  const performances: Record<string, Record<string, number>> = {
    s_1: {
      c_rec_1: 4, c_rec_2: 3, c_rec_3: 5, c_rec_4: 4, c_rec_5: 6,
      c_int_1: 4, c_int_2: 5, c_int_3: 3, c_int_4: 4, c_int_5: 5, c_int_6: 4,
      c_pro_1: 3, c_pro_2: 4, c_pro_3: 3, c_pro_4: 5,
      c_med_1: 2, c_med_2: 4, c_med_3: 3, c_med_4: 3, c_med_5: 4, c_med_6: 5,
    },
    s_2: {
      c_rec_1: 5, c_rec_2: 5, c_rec_3: 6, c_rec_4: 5, c_rec_5: 5,
      c_int_1: 6, c_int_2: 5, c_int_3: 4, c_int_4: 5, c_int_5: 6, c_int_6: 5,
      c_pro_1: 5, c_pro_2: 4, c_pro_3: 5, c_pro_4: 6,
      c_med_1: 4, c_med_2: 5, c_med_3: 5, c_med_4: 4, c_med_5: 5, c_med_6: 4,
    },
    s_3: {
      c_rec_1: 3, c_rec_2: 2, c_rec_3: 4, c_rec_4: 3, c_rec_5: 3,
      c_int_1: 3, c_int_2: 4, c_int_3: 2, c_int_4: 3, c_int_5: 3, c_int_6: 3,
      c_pro_1: 2, c_pro_2: 3, c_pro_3: 2, c_pro_4: 3,
      c_med_1: 3, c_med_2: 3, c_med_3: 2, c_med_4: 3, c_med_5: 2, c_med_6: 3,
    }
  };

  return {
    id,
    name,
    circles: {
      count: 6,
      circleNames: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      showCircleNames: true,
      circleNameFontSize: 11,
    },
    groups,
    criteria,
    students,
    performances,
    chartSettings: {
      isFilled: true,
      lineColor: '#2563eb',
      fillOpacity: 0.65,
      showPoints: true,
    }
  };
}

export function createDefaultAppState(): AppState {
  const miniTab1 = createDefaultMiniTab('mt_1', 'Term 1 Assessment');
  const miniTab2 = createDefaultMiniTab('mt_2', 'Midterm Evaluation');

  const classTab1: ClassTab = {
    id: 'ct_1',
    name: 'Class 1-A',
    miniTabs: [miniTab1, miniTab2],
    activeMiniTabId: 'mt_1',
    selectedMiniTabIdsForOverall: ['mt_1', 'mt_2']
  };

  const classTab2: ClassTab = {
    id: 'ct_2',
    name: 'Class 1-B',
    miniTabs: [createDefaultMiniTab('mt_3', 'Term 1 Assessment')],
    activeMiniTabId: 'mt_3',
    selectedMiniTabIdsForOverall: ['mt_3']
  };

  const gradeGroup1: GradeTabGroup = {
    id: 'gt_1',
    name: 'Grade 1',
    tabs: [classTab1, classTab2],
    activeTabId: 'ct_1',
    isOverallActive: false,
  };

  const gradeGroup2: GradeTabGroup = {
    id: 'gt_2',
    name: 'Grade 2',
    tabs: [
      {
        id: 'ct_3',
        name: 'Class 2-A',
        miniTabs: [createDefaultMiniTab('mt_4', 'Term 1 Assessment')],
        activeMiniTabId: 'mt_4',
        selectedMiniTabIdsForOverall: ['mt_4']
      }
    ],
    activeTabId: 'ct_3',
    isOverallActive: false,
  };

  return {
    tabGroups: [gradeGroup1, gradeGroup2],
    activeTabGroupId: 'gt_1',
    isAutoSyncEnabled: true
  };
}
