import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { getDefaultData } from './defaultData';

var e = React.createElement;

var C = {
  accent: "#4A8FD6", accentDim: "rgba(74,143,214,0.07)", bg: "#FFFFFF",
  surface: "#F8F9FB", surface2: "#F0F2F5", border: "#E2E5EA",
  text: "#1A1A2E", textDim: "#8890A0", textMid: "#5A6070",
  success: "#22A860", warning: "#E5A200", danger: "#E04848",
  logo: "#2A2A3E", purple: "#7C5CFC", orange: "#E8723A", teal: "#1AA8A8",
};
var mono = "'JetBrains Mono', monospace";

async function saveManual(slug, data) {
  const { error } = await supabase
    .from('manuals')
    .upsert({ slug, client_name: data.clientName, data }, { onConflict: 'slug' });
  return !error;
}

async function loadManual(slug) {
  const { data, error } = await supabase
    .from('manuals')
    .select('data, updated_at')
    .eq('slug', slug)
    .single();
  if (error || !data) return null;
  return { manual: data.data, updatedAt: data.updated_at };
}

function App() {
  var slug = window.location.pathname.split('/manual/')[1] || 'demo';

  var [data, setData] = useState(getDefaultData());
  var [panelOpen, setPanelOpen] = useState(false);
  var [editSection, setEditSection] = useState('executive');
  var [activeView, setActiveView] = useState('executive');
  var [animPhase, setAnimPhase] = useState(0);
  var [expandedScenario, setExpandedScenario] = useState(null);
  var [checkedItems, setCheckedItems] = useState({});
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [lastSaved, setLastSaved] = useState(null);

  useEffect(function () {
    loadManual(slug).then(function (result) {
      if (result) {
        setData(result.manual);
        setLastSaved(new Date(result.updatedAt));
      }
      setLoading(false);
    });
  }, []);

  useEffect(function () {
    var i = setInterval(function () { setAnimPhase(function (p) { return (p + 1) % 3; }); }, 2800);
    return function () { clearInterval(i); };
  }, []);

  var handleSave = function () {
    setSaving(true);
    saveManual(slug, data).then(function (ok) {
      setSaving(false);
      if (ok) setLastSaved(new Date());
    });
  };

  function upd(path, value) {
    setData(function (prev) {
      var next = JSON.parse(JSON.stringify(prev));
      var keys = path.split('.');
      var obj = next;
      for (var i = 0; i < keys.length - 1; i++) {
        var k = keys[i].match(/^\d+$/) ? parseInt(keys[i]) : keys[i];
        obj = obj[k];
      }
      var last = keys[keys.length - 1].match(/^\d+$/) ? parseInt(keys[keys.length - 1]) : keys[keys.length - 1];
      obj[last] = value;
      return next;
    });
  }

  function addItem(path, template) {
    setData(function (prev) {
      var next = JSON.parse(JSON.stringify(prev));
      var keys = path.split('.');
      var obj = next;
      for (var i = 0; i < keys.length; i++) { var k = keys[i].match(/^\d+$/) ? parseInt(keys[i]) : keys[i]; obj = obj[k]; }
      obj.push(JSON.parse(JSON.stringify(template)));
      return next;
    });
  }

  function removeItem(path, index) {
    setData(function (prev) {
      var next = JSON.parse(JSON.stringify(prev));
      var keys = path.split('.');
      var obj = next;
      for (var i = 0; i < keys.length; i++) { var k = keys[i].match(/^\d+$/) ? parseInt(keys[i]) : keys[i]; obj = obj[k]; }
      obj.splice(index, 1);
      return next;
    });
  }

  // ---- EDITOR STYLES ----
  var inputStyle = { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid ' + C.border, background: C.bg, color: C.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' };
  var monoInputStyle = Object.assign({}, inputStyle, { fontFamily: mono, fontSize: 11 });
  var textareaStyle = Object.assign({}, inputStyle, { resize: 'vertical', minHeight: 50 });
  var labelStyle = { fontSize: 9, fontWeight: 600, color: C.textDim, letterSpacing: '0.05em', display: 'block', marginBottom: 3, textTransform: 'uppercase' };
  var cardStyle = { padding: 12, borderRadius: 8, background: C.bg, border: '1px solid ' + C.border, marginBottom: 8 };
  var rmBtnStyle = { background: 'none', border: 'none', color: C.danger, cursor: 'pointer', fontSize: 13, padding: '2px 5px', fontWeight: 700 };
  var addBtnStyle = { width: '100%', padding: '7px', borderRadius: 6, border: '1px dashed ' + C.border, background: 'transparent', color: C.accent, fontSize: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginTop: 4 };

  function inp(label, path, val, multi, isMono) {
    return e('div', { style: { marginBottom: 8 } },
      e('label', { style: labelStyle }, label),
      multi
        ? e('textarea', { value: val || '', onChange: function (ev) { upd(path, ev.target.value); }, style: textareaStyle })
        : e('input', { type: 'text', value: val || '', onChange: function (ev) { upd(path, ev.target.value); }, style: isMono ? monoInputStyle : inputStyle })
    );
  }

  function arrayEditor(label, path, arr, fields, template) {
    return e('div', { style: { marginBottom: 12 } },
      e('div', { style: { fontSize: 10, fontWeight: 600, color: C.accent, marginBottom: 6, letterSpacing: '0.04em' } }, label),
      (arr || []).map(function (item, i) {
        return e('div', { key: i, style: cardStyle },
          e('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 } },
            e('span', { style: { fontSize: 10, fontWeight: 600, color: C.textMid } }, '#' + (i + 1)),
            e('button', { onClick: function () { removeItem(path, i); }, style: rmBtnStyle }, '×')
          ),
          fields.map(function (f) {
            return inp(f.label, path + '.' + i + '.' + f.key, item[f.key], f.multi, f.mono);
          })
        );
      }),
      e('button', { onClick: function () { addItem(path, template); }, style: addBtnStyle }, '+ Add')
    );
  }

  function simpleArrayEditor(label, path, arr, template) {
    return e('div', { style: { marginBottom: 12 } },
      label ? e('div', { style: { fontSize: 10, fontWeight: 600, color: C.accent, marginBottom: 6 } }, label) : null,
      (arr || []).map(function (item, i) {
        return e('div', { key: i, style: { display: 'flex', gap: 4, marginBottom: 4 } },
          e('input', { type: 'text', value: item, onChange: function (ev) { upd(path + '.' + i, ev.target.value); }, style: Object.assign({}, inputStyle, { flex: 1 }) }),
          e('button', { onClick: function () { removeItem(path, i); }, style: rmBtnStyle }, '×')
        );
      }),
      e('button', { onClick: function () { addItem(path, template); }, style: addBtnStyle }, '+ Add')
    );
  }

  // ---- EDITOR VIEWS ----
  var editorViews = {
    executive: function () {
      return e('div', null,
        inp('Client Name', 'clientName', data.clientName),
        inp('Solution Name', 'solutionName', data.solutionName),
        inp('Version', 'version', data.version),
        inp('Tech Stack', 'stack', data.stack, false, true),
        inp('Confidential Line', 'confidentialLine', data.confidentialLine),
        inp('Business Objective', 'businessObjective', data.businessObjective, true),
        arrayEditor('IMPACT METRICS', 'metrics', data.metrics, [{ label: 'Number', key: 'num' }, { label: 'Label', key: 'label' }, { label: 'Icon', key: 'icon' }], { num: '0', label: 'New metric', icon: '📊' }),
        simpleArrayEditor('IN SCOPE', 'inScope', data.inScope, 'New scope item'),
        simpleArrayEditor('OUT OF SCOPE', 'outOfScope', data.outOfScope, 'New exclusion'),
        inp('Callout Title', 'calloutTitle', data.calloutTitle),
        inp('Callout Body', 'calloutBody', data.calloutBody, true)
      );
    },
    technology: function () {
      return e('div', null,
        arrayEditor('ACCOUNTS', 'accounts', data.accounts, [{ label: 'Name', key: 'name' }, { label: 'Setup', key: 'setup', multi: true }, { label: 'Connection', key: 'connection' }, { label: 'Icon', key: 'icon' }], { name: 'New Service', setup: 'Setup instructions...', connection: 'Connection type', icon: '🔌' }),
        arrayEditor('COSTS', 'costs', data.costs, [{ label: 'Resource', key: 'resource' }, { label: 'Unit', key: 'unit' }, { label: 'Usage', key: 'usage' }, { label: 'Monthly $', key: 'monthly', mono: true }], { resource: 'New', unit: '$/mo', usage: '~0', monthly: '0.00' }),
        arrayEditor('INTEGRATIONS', 'integrations', data.integrations, [{ label: 'System', key: 'system' }, { label: 'Role', key: 'role' }, { label: 'Phase', key: 'phase' }, { label: 'Icon', key: 'icon' }], { system: 'New System', role: 'Role...', phase: '1', icon: '🔌' })
      );
    },
    training: function () {
      return e('div', null,
        arrayEditor('TIMELINE PHASES', 'timeline', data.timeline, [{ label: 'Week', key: 'week' }, { label: 'Focus', key: 'focus' }, { label: 'Deliverables', key: 'deliverables', multi: true }], { week: 'X', focus: 'New Phase', deliverables: 'Deliverables...' })
      );
    },
    instructions: function () {
      return e('div', null,
        arrayEditor('SYSTEM PROMPT RULES', 'promptRules', data.promptRules, [{ label: 'Title', key: 'title' }, { label: 'Description', key: 'desc', multi: true }], { title: 'NEW RULE', desc: 'Rule description...' }),
        arrayEditor('JSON SCHEMAS', 'schemas', data.schemas, [{ label: 'Name', key: 'name', mono: true }, { label: 'Fields Count', key: 'fields' }, { label: 'Used In', key: 'used' }, { label: 'Description', key: 'desc' }], { name: 'NewSchema', fields: 0, used: 'SC-0X', desc: 'Description...' })
      );
    },
    workflows: function () {
      return e('div', null,
        arrayEditor('SCENARIOS', 'scenarios', data.scenarios, [{ label: 'ID', key: 'id', mono: true }, { label: 'Name', key: 'name' }, { label: 'Modules', key: 'modules' }, { label: 'Trigger', key: 'trigger' }, { label: 'Purpose', key: 'purpose', multi: true }, { label: 'Details', key: 'details', multi: true }], { id: 'SC-0' + ((data.scenarios || []).length + 1), name: 'New Scenario', modules: 5, trigger: 'Trigger...', purpose: 'Purpose...', details: 'Details...', moduleList: ['Step 1'] }),
        (data.scenarios || []).map(function (sc, i) {
          return e('div', { key: 'ml' + i, style: { marginBottom: 8 } },
            e('div', { style: { fontSize: 10, fontWeight: 600, color: C.purple, marginBottom: 4 } }, sc.id + ' MODULE LIST'),
            simpleArrayEditor('', 'scenarios.' + i + '.moduleList', sc.moduleList || [], 'New Module')
          );
        })
      );
    },
    knowledge: function () {
      return e('div', null,
        arrayEditor('FOLDER MAPPINGS', 'folderMappings', data.folderMappings, [{ label: 'Content', key: 'content' }, { label: 'What to Find', key: 'find' }, { label: 'Variable', key: 'variable', mono: true }], { content: 'New folder', find: 'Where to find it', variable: 'VAR_NEW' }),
        arrayEditor('SYSTEM FOLDERS', 'systemFolders', data.systemFolders, [{ label: 'Folder', key: 'folder', mono: true }, { label: 'Purpose', key: 'purpose' }], { folder: '/new_folder/', purpose: 'Purpose...' }),
        arrayEditor('MAKE.COM VARIABLES', 'makeVars', data.makeVars, [{ label: 'Name', key: 'name', mono: true }, { label: 'Purpose', key: 'purpose' }, { label: 'Example', key: 'example', mono: true }], { name: 'NEW_VAR', purpose: 'Purpose', example: 'value' })
      );
    },
    control: function () {
      return e('div', null,
        arrayEditor('PERMISSIONS', 'permissions', data.permissions, [{ label: 'Area', key: 'area' }, { label: 'Level', key: 'level' }, { label: 'Scope', key: 'scope' }], { area: 'New Area', level: 'Read', scope: 'Scope...' }),
        arrayEditor('ERROR HANDLING', 'errorHandling', data.errorHandling, [{ label: 'Trigger', key: 'trigger' }, { label: 'Response', key: 'response', multi: true }, { label: 'Severity (warning/danger)', key: 'severity' }], { trigger: 'New error', response: 'Response...', severity: 'warning' }),
        simpleArrayEditor('GUARDRAILS', 'guardrails', data.guardrails, 'New guardrail'),
        arrayEditor('FUNCTIONAL REQUIREMENTS', 'frRequirements', data.frRequirements, [{ label: 'ID', key: 'id', mono: true }, { label: 'Title', key: 'title' }, { label: 'Description', key: 'desc', multi: true }, { label: 'Scenario', key: 'scenario', mono: true }], { id: 'FR X.X', title: 'New FR', desc: 'Description...', scenario: 'SC-0X' })
      );
    },
    bestpractices: function () {
      return e('div', null,
        simpleArrayEditor('DO — BEST PRACTICES', 'bestDo', data.bestDo, 'New best practice'),
        simpleArrayEditor("DON'T — COMMON MISTAKES", 'bestDont', data.bestDont, "New don't"),
        arrayEditor('OPEN QUESTIONS', 'openQuestions', data.openQuestions, [{ label: 'Question', key: 'q' }, { label: 'Detail', key: 'detail' }], { q: 'New question', detail: 'Detail...' })
      );
    },
  };

  var editorTabs = [
    { id: 'executive', label: 'Executive', icon: '📊' },
    { id: 'technology', label: 'Technology', icon: '⚙️' },
    { id: 'training', label: 'Training', icon: '📅' },
    { id: 'instructions', label: 'Instructions', icon: '🧠' },
    { id: 'workflows', label: 'Workflows', icon: '📥' },
    { id: 'knowledge', label: 'Knowledge', icon: '📂' },
    { id: 'control', label: 'Control', icon: '🛡️' },
    { id: 'bestpractices', label: 'Best Practices', icon: '✅' },
  ];

  // ---- EDITOR PANEL ----
  function editorPanel() {
    return e('div', {
      style: {
        width: panelOpen ? 370 : 0, minHeight: '100vh', background: C.surface,
        borderRight: panelOpen ? '1px solid ' + C.border : 'none',
        overflow: 'hidden', transition: 'width 0.3s ease', flexShrink: 0, display: 'flex', flexDirection: 'column'
      }
    },
      e('div', { style: { padding: '14px 16px', borderBottom: '1px solid ' + C.border, background: C.bg } },
        e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } },
          e('div', { style: { display: 'flex', alignItems: 'baseline', gap: 3 } },
            e('span', { style: { fontSize: 15, fontWeight: 700, color: C.logo } }, 'MANAGE'),
            e('span', { style: { fontSize: 15, fontWeight: 700, color: C.accent } }, 'AI'),
            e('span', { style: { fontSize: 10, color: C.textDim, marginLeft: 8, fontFamily: mono } }, 'Editor')
          ),
          e('button', { onClick: function () { setPanelOpen(false); }, style: { background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontSize: 14, padding: '2px 6px' } }, '✕')
        ),
        e('div', { style: { display: 'flex', gap: 3, flexWrap: 'wrap' } },
          editorTabs.map(function (t) {
            var isActive = editSection === t.id;
            return e('button', {
              key: t.id,
              onClick: function () { setEditSection(t.id); setActiveView(t.id); },
              style: {
                padding: '5px 8px', borderRadius: 5,
                border: '1px solid ' + (isActive ? C.accent : C.border),
                background: isActive ? C.accentDim : C.bg,
                color: isActive ? C.accent : C.textDim,
                fontSize: 10, fontWeight: 500, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s ease'
              }
            }, e('span', { style: { fontSize: 11 } }, t.icon), t.label);
          })
        )
      ),
      e('div', { style: { flex: 1, padding: '14px 16px', overflowY: 'auto' } },
        editorViews[editSection] ? editorViews[editSection]() : null
      ),
      e('div', { style: { padding: '10px 16px', borderTop: '1px solid ' + C.border, background: C.bg } },
        e('button', {
          onClick: handleSave, disabled: saving,
          style: { width: '100%', padding: '9px', borderRadius: 6, border: 'none', cursor: saving ? 'wait' : 'pointer', background: C.success, color: '#FFF', fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.7 : 1 }
        }, saving ? '⏳ Saving...' : '💾 Save to Cloud'),
        lastSaved ? e('div', { style: { fontSize: 9, color: C.textDim, textAlign: 'center', margin: '4px 0' } }, 'Last saved: ' + lastSaved.toLocaleTimeString()) : null,
        e('button', {
          onClick: function () {
            var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url; a.download = data.clientName.toLowerCase().replace(/\s+/g, '-') + '-build-manual.json';
            a.click();
          },
          style: { width: '100%', padding: '9px', borderRadius: 6, border: 'none', cursor: 'pointer', background: C.accent, color: '#FFF', fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginTop: 6 }
        }, '⬇ Export JSON'),
        e('button', {
          onClick: function () { setData(getDefaultData()); },
          style: { width: '100%', padding: '7px', borderRadius: 6, border: '1px solid ' + C.border, cursor: 'pointer', background: 'transparent', color: C.textDim, fontSize: 10, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }
        }, 'Reset to Default')
      )
    );
  }

  // ---- NAV VIEWS ----
  var views = [
    { id: 'executive', label: 'Executive Overview' },
    { id: 'technology', label: 'Technology' },
    { id: 'training', label: 'Training Overview' },
    { id: 'instructions', label: 'Instructions' },
    { id: 'workflows', label: 'Workflows' },
    { id: 'knowledge', label: 'Knowledge' },
    { id: 'control', label: 'Control' },
    { id: 'bestpractices', label: 'Best Practices' },
  ];

  function navBtn(v) {
    var isA = activeView === v.id;
    return e('button', {
      key: v.id,
      onClick: function () { setActiveView(v.id); setEditSection(v.id); },
      style: {
        padding: '8px 13px', borderRadius: 6, border: 'none', cursor: 'pointer',
        fontSize: 11, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
        letterSpacing: '0.02em', transition: 'all 0.3s ease',
        background: isA ? C.accent : 'transparent',
        color: isA ? '#FFF' : C.textDim
      }
    }, v.label);
  }

  // ---- PAGE VIEWS ----
  function renderExecutive() {
    var phaseColors = [C.textMid, C.accent, C.purple, C.success, C.orange];
    return e('div', { style: { animation: 'slideIn 0.5s ease' } },
      e('div', { style: { marginBottom: 28 } },
        e('h2', { style: { fontSize: 22, fontWeight: 600, margin: '0 0 6px' } }, 'Business Objective'),
        e('p', { style: { fontSize: 13, color: C.textMid, margin: 0, maxWidth: 720, lineHeight: 1.6 } }, data.businessObjective)
      ),
      e('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 } },
        (data.metrics || []).map(function (m, i) {
          return e('div', { key: i, style: { padding: 18, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border, textAlign: 'center' } },
            e('div', { style: { fontSize: 16, marginBottom: 4 } }, m.icon),
            e('div', { style: { fontFamily: mono, fontSize: 20, fontWeight: 700, color: C.accent, marginBottom: 2 } }, m.num),
            e('div', { style: { fontSize: 10, color: C.textDim } }, m.label)
          );
        })
      ),
      e('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 } },
        e('div', { style: { padding: 20, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border } },
          e('div', { style: { fontSize: 12, fontWeight: 600, color: C.success, letterSpacing: '0.04em', marginBottom: 12 } }, 'IN SCOPE'),
          (data.inScope || []).map(function (s, i) {
            return e('div', { key: i, style: { display: 'flex', gap: 8, fontSize: 12, color: C.textMid, marginBottom: 6 } },
              e('span', { style: { color: C.success, fontWeight: 700 } }, '✓'), s
            );
          })
        ),
        e('div', { style: { padding: 20, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border } },
          e('div', { style: { fontSize: 12, fontWeight: 600, color: C.danger, letterSpacing: '0.04em', marginBottom: 12 } }, 'OUT OF SCOPE'),
          (data.outOfScope || []).map(function (s, i) {
            return e('div', { key: i, style: { display: 'flex', gap: 8, fontSize: 12, color: C.textMid, marginBottom: 6 } },
              e('span', { style: { color: C.danger, fontWeight: 700 } }, '×'), s
            );
          })
        )
      ),
      e('div', { style: { padding: 20, borderRadius: 12, background: C.accentDim, border: '1px solid ' + C.accent + '30' } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 6 } }, data.calloutTitle),
        e('div', { style: { fontSize: 12, color: C.textMid, lineHeight: 1.6 } }, data.calloutBody)
      )
    );
  }

  function renderTechnology() {
    return e('div', { style: { animation: 'slideIn 0.5s ease' } },
      e('div', { style: { marginBottom: 28 } },
        e('h2', { style: { fontSize: 22, fontWeight: 600, margin: '0 0 6px' } }, 'Technology'),
        e('p', { style: { fontSize: 13, color: C.textDim, margin: 0 } }, 'Accounts, integrations, and cost breakdown.')
      ),
      e('div', { style: { padding: 20, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border, marginBottom: 16 } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.accent, letterSpacing: '0.04em', marginBottom: 14 } }, 'REQUIRED ACCOUNTS'),
        e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
          (data.accounts || []).map(function (acc, i) {
            return e('div', { key: i, style: { display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 8, background: C.bg, border: '1px solid ' + C.border } },
              e('div', { style: { fontSize: 20, flexShrink: 0 } }, acc.icon),
              e('div', { style: { flex: 1 } },
                e('div', { style: { fontSize: 12, fontWeight: 600, marginBottom: 2 } }, acc.name),
                e('div', { style: { fontSize: 11, color: C.textMid, lineHeight: 1.5, marginBottom: 4 } }, acc.setup),
                e('div', { style: { fontSize: 10, fontFamily: mono, color: C.accent } }, acc.connection)
              )
            );
          })
        )
      ),
      e('div', { style: { padding: 20, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border, marginBottom: 16 } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.accent, letterSpacing: '0.04em', marginBottom: 14 } }, 'COST BREAKDOWN'),
        e('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
          (data.costs || []).map(function (c, i) {
            return e('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: C.bg, border: '1px solid ' + C.border } },
              e('div', { style: { flex: 1 } },
                e('div', { style: { fontSize: 12, fontWeight: 600 } }, c.resource),
                e('div', { style: { fontSize: 10, color: C.textDim } }, c.unit)
              ),
              e('div', { style: { fontSize: 10, color: C.textMid, fontFamily: mono } }, c.usage),
              e('div', { style: { fontFamily: mono, fontSize: 13, fontWeight: 600, color: C.accent, minWidth: 60, textAlign: 'right' } }, '$' + c.monthly)
            );
          })
        )
      )
    );
  }

  function renderTraining() {
    var phaseColors = [C.textMid, C.accent, C.purple, C.success, C.orange];
    return e('div', { style: { animation: 'slideIn 0.5s ease' } },
      e('div', { style: { marginBottom: 28 } },
        e('h2', { style: { fontSize: 22, fontWeight: 600, margin: '0 0 6px' } }, 'Training Overview'),
        e('p', { style: { fontSize: 13, color: C.textDim, margin: 0 } }, 'Phased delivery roadmap from discovery through production readiness.')
      ),
      e('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        (data.timeline || []).map(function (ph, i) {
          var clr = phaseColors[i % phaseColors.length];
          return e('div', { key: i, style: { display: 'flex', gap: 16, padding: '18px 20px', borderRadius: 12, background: C.surface, border: '1px solid ' + C.border } },
            e('div', { style: { width: 64, flexShrink: 0, textAlign: 'center', padding: '8px 0', borderRadius: 8, background: clr + '10', border: '1px solid ' + clr + '20' } },
              e('div', { style: { fontSize: 9, color: clr, fontWeight: 600, letterSpacing: '0.04em' } }, 'WEEK'),
              e('div', { style: { fontFamily: mono, fontSize: 18, fontWeight: 700, color: clr } }, ph.week)
            ),
            e('div', null,
              e('div', { style: { fontSize: 14, fontWeight: 600, marginBottom: 4 } }, ph.focus),
              e('div', { style: { fontSize: 12, color: C.textMid, lineHeight: 1.6 } }, ph.deliverables)
            )
          );
        })
      )
    );
  }

  function renderInstructions() {
    return e('div', { style: { animation: 'slideIn 0.5s ease' } },
      e('div', { style: { marginBottom: 28 } },
        e('h2', { style: { fontSize: 22, fontWeight: 600, margin: '0 0 6px' } }, 'Instructions'),
        e('p', { style: { fontSize: 13, color: C.textDim, margin: 0 } }, 'Claude configuration, prompt architecture, and structured output schemas.')
      ),
      e('div', { style: { fontSize: 12, fontWeight: 600, color: C.textDim, letterSpacing: '0.06em', marginBottom: 12 } }, 'SYSTEM PROMPT RULES'),
      e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 } },
        (data.promptRules || []).map(function (rule, i) {
          var ruleColors = [C.danger, C.warning, C.accent, C.success, C.purple, C.teal];
          var clr = ruleColors[i % ruleColors.length];
          return e('div', { key: i, style: { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderRadius: 10, background: C.surface, border: '1px solid ' + C.border } },
            e('div', { style: { width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: clr + '12', border: '1px solid ' + clr + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 11, fontWeight: 700, color: clr } }, i + 1),
            e('div', null,
              e('div', { style: { fontSize: 12, fontWeight: 600, marginBottom: 2 } }, rule.title),
              e('div', { style: { fontSize: 11, color: C.textMid, lineHeight: 1.5 } }, rule.desc)
            )
          );
        })
      ),
      e('div', { style: { fontSize: 12, fontWeight: 600, color: C.textDim, letterSpacing: '0.06em', marginBottom: 12 } }, 'JSON SCHEMAS'),
      e('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 } },
        (data.schemas || []).map(function (schema, i) {
          return e('div', { key: i, style: { padding: 16, borderRadius: 10, background: C.surface, border: '1px solid ' + C.border } },
            e('div', { style: { fontFamily: mono, fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 4 } }, schema.name),
            e('div', { style: { fontSize: 11, color: C.textMid, marginBottom: 8 } }, schema.desc),
            e('div', { style: { display: 'flex', gap: 8 } },
              e('span', { style: { fontSize: 9, padding: '2px 6px', borderRadius: 4, background: C.accentDim, color: C.accent, fontWeight: 600 } }, schema.fields + ' fields'),
              e('span', { style: { fontSize: 9, padding: '2px 6px', borderRadius: 4, background: C.surface2, color: C.textMid, fontFamily: mono } }, schema.used)
            )
          );
        })
      )
    );
  }

  function renderWorkflows() {
    return e('div', { style: { animation: 'slideIn 0.5s ease' } },
      e('div', { style: { marginBottom: 28 } },
        e('h2', { style: { fontSize: 22, fontWeight: 600, margin: '0 0 6px' } }, 'Workflows'),
        e('p', { style: { fontSize: 13, color: C.textDim, margin: 0 } }, 'Make.com scenario architecture and module sequences.')
      ),
      e('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        (data.scenarios || []).map(function (sc, i) {
          var isExp = expandedScenario === i;
          var scColors = [C.accent, C.purple, C.success, C.orange, C.teal];
          var clr = scColors[i % scColors.length];
          return e('div', { key: i },
            e('div', {
              onClick: function () { setExpandedScenario(isExp ? null : i); },
              style: { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 10, background: C.surface, border: '1px solid ' + (isExp ? clr + '50' : C.border), cursor: 'pointer' }
            },
              e('div', { style: { fontFamily: mono, fontSize: 11, fontWeight: 700, color: clr, minWidth: 50 } }, sc.id),
              e('div', { style: { flex: 1 } },
                e('div', { style: { fontSize: 13, fontWeight: 600, marginBottom: 2 } }, sc.name),
                e('div', { style: { fontSize: 11, color: C.textMid } }, sc.purpose)
              ),
              e('div', { style: { fontSize: 11, color: C.textDim, fontFamily: mono } }, sc.modules + ' modules'),
              e('span', { style: { color: C.textDim, fontSize: 12, marginLeft: 8 } }, isExp ? '▲' : '▼')
            ),
            isExp ? e('div', { style: { margin: '6px 0 8px', padding: 20, borderRadius: 10, background: C.surface, border: '1px solid ' + C.border } },
              e('div', { style: { fontSize: 12, color: C.textMid, lineHeight: 1.6, marginBottom: 14 } }, sc.details),
              e('div', { style: { fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: '0.04em', marginBottom: 4 } }, 'TRIGGER'),
              e('div', { style: { fontSize: 11, fontFamily: mono, padding: '4px 8px', background: C.surface2, borderRadius: 4, border: '1px solid ' + C.border, marginBottom: 12, display: 'inline-block' } }, sc.trigger),
              sc.moduleList ? e('div', null,
                e('div', { style: { fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: '0.04em', marginBottom: 6 } }, 'MODULE SEQUENCE'),
                e('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
                  (sc.moduleList || []).map(function (m, j) {
                    return e('div', { key: j, style: { display: 'flex', alignItems: 'center', gap: 4 } },
                      e('span', { style: { fontFamily: mono, fontSize: 9, color: clr, fontWeight: 600 } }, j + 1),
                      e('span', { style: { fontSize: 10, padding: '3px 8px', borderRadius: 4, background: C.bg, border: '1px solid ' + C.border, color: C.textMid } }, m),
                      j < sc.moduleList.length - 1 ? e('span', { style: { color: C.border, fontSize: 10 } }, '→') : null
                    );
                  })
                )
              ) : null
            ) : null
          );
        })
      )
    );
  }

  function renderKnowledge() {
    return e('div', { style: { animation: 'slideIn 0.5s ease' } },
      e('div', { style: { marginBottom: 28 } },
        e('h2', { style: { fontSize: 22, fontWeight: 600, margin: '0 0 6px' } }, 'Knowledge'),
        e('p', { style: { fontSize: 13, color: C.textDim, margin: 0 } }, 'Data setup, configuration, folder mapping, and variable references.')
      ),
      e('div', { style: { padding: 20, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border, marginBottom: 16 } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.teal, letterSpacing: '0.04em', marginBottom: 14 } }, 'FOLDER MAPPING'),
        e('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
          (data.folderMappings || []).map(function (m, i) {
            return e('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: C.bg, border: '1px solid ' + C.border } },
              e('div', { style: { flex: 1 } },
                e('div', { style: { fontSize: 12, fontWeight: 600 } }, m.content),
                e('div', { style: { fontSize: 11, color: C.textMid } }, m.find)
              ),
              e('div', { style: { fontFamily: mono, fontSize: 10, color: C.teal, background: C.teal + '0A', padding: '3px 8px', borderRadius: 4, border: '1px solid ' + C.teal + '20' } }, m.variable)
            );
          })
        )
      ),
      e('div', { style: { padding: 20, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border, marginBottom: 16 } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.purple, letterSpacing: '0.04em', marginBottom: 14 } }, 'MAKE.COM VARIABLES'),
        e('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
          (data.makeVars || []).map(function (v, i) {
            return e('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: C.bg, border: '1px solid ' + C.border } },
              e('div', { style: { fontFamily: mono, fontSize: 11, fontWeight: 600, color: C.purple, minWidth: 140 } }, v.name),
              e('div', { style: { flex: 1, fontSize: 11, color: C.textMid } }, v.purpose),
              e('div', { style: { fontFamily: mono, fontSize: 10, color: C.textDim } }, v.example)
            );
          })
        )
      )
    );
  }

  function renderControl() {
    return e('div', { style: { animation: 'slideIn 0.5s ease' } },
      e('div', { style: { marginBottom: 28 } },
        e('h2', { style: { fontSize: 22, fontWeight: 600, margin: '0 0 6px' } }, 'Control'),
        e('p', { style: { fontSize: 13, color: C.textDim, margin: 0 } }, 'Permissions, error handling, guardrails, and functional requirements.')
      ),
      e('div', { style: { padding: 20, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border, marginBottom: 16 } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.accent, letterSpacing: '0.04em', marginBottom: 14 } }, 'PERMISSIONS'),
        (data.permissions || []).map(function (p, i) {
          return e('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: C.bg, border: '1px solid ' + C.border, marginBottom: 6 } },
            e('div', { style: { flex: 1 } },
              e('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
                e('span', { style: { fontSize: 12, fontWeight: 600 } }, p.area),
                e('span', { style: { fontSize: 9, padding: '2px 6px', borderRadius: 4, background: C.accentDim, color: C.accent, fontWeight: 600 } }, p.level)
              ),
              e('div', { style: { fontSize: 11, color: C.textDim } }, p.scope)
            )
          );
        })
      ),
      e('div', { style: { padding: 20, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border, marginBottom: 16 } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.orange, letterSpacing: '0.04em', marginBottom: 14 } }, 'ERROR HANDLING'),
        (data.errorHandling || []).map(function (err, i) {
          return e('div', { key: i, style: { padding: '12px 14px', borderRadius: 8, background: C.bg, border: '1px solid ' + (err.severity === 'danger' ? C.danger + '30' : C.warning + '30'), marginBottom: 6 } },
            e('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } },
              e('div', { style: { width: 8, height: 8, borderRadius: '50%', background: err.severity === 'danger' ? C.danger : C.warning } }),
              e('span', { style: { fontSize: 12, fontWeight: 600 } }, err.trigger)
            ),
            e('div', { style: { fontSize: 11, color: C.textMid, lineHeight: 1.5, paddingLeft: 16 } }, err.response)
          );
        })
      ),
      e('div', { style: { padding: 20, borderRadius: 12, background: C.danger + '06', border: '1px solid ' + C.danger + '20', marginBottom: 16 } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.danger, letterSpacing: '0.04em', marginBottom: 10 } }, 'GUARDRAILS'),
        (data.guardrails || []).map(function (g, i) {
          return e('div', { key: i, style: { display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: C.textMid, lineHeight: 1.5, marginBottom: 4 } },
            e('span', { style: { color: C.danger, flexShrink: 0, fontWeight: 700 } }, '×'), g
          );
        })
      ),
      e('div', { style: { fontSize: 12, fontWeight: 600, color: C.textDim, letterSpacing: '0.06em', marginBottom: 12 } }, 'FUNCTIONAL REQUIREMENTS'),
      e('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        (data.frRequirements || []).map(function (fr, i) {
          var frColors = [C.accent, C.purple, C.success, C.danger, C.warning];
          var clr = frColors[i % frColors.length];
          return e('div', { key: i, style: { display: 'flex', gap: 14, padding: '14px 18px', borderRadius: 10, background: C.surface, border: '1px solid ' + C.border } },
            e('div', { style: { fontFamily: mono, fontSize: 10, fontWeight: 700, color: clr, minWidth: 50, paddingTop: 2 } }, fr.id),
            e('div', null,
              e('div', { style: { fontSize: 12, fontWeight: 600, marginBottom: 4 } }, fr.title),
              e('div', { style: { fontSize: 11, color: C.textMid, lineHeight: 1.5 } }, fr.desc)
            )
          );
        })
      )
    );
  }

  function renderBestPractices() {
    return e('div', { style: { animation: 'slideIn 0.5s ease' } },
      e('div', { style: { marginBottom: 28 } },
        e('h2', { style: { fontSize: 22, fontWeight: 600, margin: '0 0 6px' } }, 'Best Practices'),
        e('p', { style: { fontSize: 13, color: C.textDim, margin: 0 } }, "Do's, don'ts, and open questions.")
      ),
      e('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 } },
        e('div', { style: { padding: 20, borderRadius: 12, background: C.success + '06', border: '1px solid ' + C.success + '20' } },
          e('div', { style: { fontSize: 12, fontWeight: 600, color: C.success, letterSpacing: '0.04em', marginBottom: 12 } }, 'DO'),
          (data.bestDo || []).map(function (item, i) {
            return e('div', { key: i, style: { display: 'flex', gap: 8, fontSize: 12, color: C.textMid, marginBottom: 8, lineHeight: 1.5 } },
              e('span', { style: { color: C.success, fontWeight: 700, flexShrink: 0 } }, '✓'), item
            );
          })
        ),
        e('div', { style: { padding: 20, borderRadius: 12, background: C.danger + '06', border: '1px solid ' + C.danger + '20' } },
          e('div', { style: { fontSize: 12, fontWeight: 600, color: C.danger, letterSpacing: '0.04em', marginBottom: 12 } }, "DON'T"),
          (data.bestDont || []).map(function (item, i) {
            return e('div', { key: i, style: { display: 'flex', gap: 8, fontSize: 12, color: C.textMid, marginBottom: 8, lineHeight: 1.5 } },
              e('span', { style: { color: C.danger, fontWeight: 700, flexShrink: 0 } }, '×'), item
            );
          })
        )
      ),
      e('div', { style: { padding: 20, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.warning, letterSpacing: '0.04em', marginBottom: 14 } }, 'OPEN QUESTIONS'),
        (data.openQuestions || []).map(function (q, i) {
          return e('div', { key: i, style: { padding: '12px 14px', borderRadius: 8, background: C.bg, border: '1px solid ' + C.border, marginBottom: 6 } },
            e('div', { style: { fontSize: 12, fontWeight: 600, marginBottom: 4 } }, q.q),
            e('div', { style: { fontSize: 11, color: C.textMid } }, q.detail)
          );
        })
      )
    );
  }

  var viewRenderers = {
    executive: renderExecutive,
    technology: renderTechnology,
    training: renderTraining,
    instructions: renderInstructions,
    workflows: renderWorkflows,
    knowledge: renderKnowledge,
    control: renderControl,
    bestpractices: renderBestPractices,
  };

  // ---- LOADING SCREEN ----
  if (loading) {
    return e('div', { style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: "'DM Sans', sans-serif" } },
      e('div', { style: { textAlign: 'center' } },
        e('div', { style: { fontSize: 24, fontWeight: 700, marginBottom: 8 } },
          e('span', { style: { color: C.logo } }, 'MANAGE'),
          e('span', { style: { color: C.accent } }, 'AI')
        ),
        e('div', { style: { fontSize: 13, color: C.textDim } }, 'Loading manual...')
      )
    );
  }

  // ---- MAIN LAYOUT ----
  return e('div', { style: { display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text } },
    editorPanel(),
    e('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 } },
      e('header', { style: { padding: '20px 28px 16px', borderBottom: '1px solid ' + C.border, background: C.surface } },
        e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 } },
          e('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
            !panelOpen ? e('button', {
              onClick: function () { setPanelOpen(true); },
              style: { width: 32, height: 32, borderRadius: 6, border: '1px solid ' + C.border, background: C.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: C.accent, flexShrink: 0 }
            }, '✎') : null,
            e('div', { style: { display: 'flex', alignItems: 'baseline', gap: 4 } },
              e('span', { style: { fontSize: 20, fontWeight: 700, color: C.logo } }, 'MANAGE'),
              e('span', { style: { fontSize: 20, fontWeight: 700, color: C.accent } }, 'AI')
            ),
            e('div', { style: { width: 1, height: 20, background: C.border } }),
            e('div', null,
              e('div', { style: { fontSize: 12, fontWeight: 600 } }, data.clientName + ' — ' + data.solutionName),
              e('div', { style: { fontSize: 9, color: C.textDim, marginTop: 1, fontFamily: mono } }, 'Build Manual v' + data.version + ' · ' + data.stack)
            )
          ),
          e('div', { style: { display: 'flex', gap: 2, background: C.surface2, borderRadius: 8, padding: 3, border: '1px solid ' + C.border, flexWrap: 'wrap' } },
            views.map(function (v) { return navBtn(v); })
          )
        )
      ),
      e('main', { style: { padding: '24px 28px', maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' } },
        (viewRenderers[activeView] || renderExecutive)()
      ),
      e('footer', { style: { padding: '14px 28px', borderTop: '1px solid ' + C.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 } },
        e('div', { style: { fontSize: 11, color: C.textDim } },
          e('span', { style: { color: C.logo } }, 'MANAGE'),
          e('span', { style: { color: C.accent } }, 'AI'),
          e('span', { style: { marginLeft: 8 } }, '· ' + data.solutionName + ' Build Manual v' + data.version)
        ),
        e('div', { style: { fontSize: 10, color: C.textDim, fontFamily: mono } }, 'CONFIDENTIAL — ' + data.confidentialLine)
      )
    )
  );
}

export default App;