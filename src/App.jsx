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
  var { error } = await supabase
    .from('manuals')
    .upsert({ slug, client_name: data.clientName, data: data }, { onConflict: 'slug' });
  return !error;
}

async function loadManual(slug) {
  var { data, error } = await supabase
    .from('manuals')
    .select('data, updated_at')
    .eq('slug', slug)
    .single();
  if (error || !data) return null;
  return { manual: data.data, updatedAt: data.updated_at };
}

function EditorField({ label, value, onChange, multi, mono: isMono }) {
  var base = { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid ' + C.border, background: C.bg, color: C.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif" };
  var style = Object.assign({}, base, isMono ? { fontFamily: mono, fontSize: 11 } : {}, multi ? { resize: 'vertical', minHeight: 54 } : {});
  return e('div', { style: { marginBottom: 8 } },
    e('label', { style: { fontSize: 9, fontWeight: 600, color: C.textDim, letterSpacing: '0.05em', display: 'block', marginBottom: 3, textTransform: 'uppercase' } }, label),
    multi
      ? e('textarea', { value: value || '', onChange: function (ev) { onChange(ev.target.value); }, style: style })
      : e('input', { type: 'text', value: value || '', onChange: function (ev) { onChange(ev.target.value); }, style: style })
  );
}

function App() {
  var slug = window.location.pathname.split('/manual/')[1] || 'demo';

  var [data, setData] = useState(getDefaultData());
  var [panelOpen, setPanelOpen] = useState(false);
  var [editSection, setEditSection] = useState('overview');
  var [activeView, setActiveView] = useState('overview');
  var [animPhase, setAnimPhase] = useState(0);
  var [expandedScenario, setExpandedScenario] = useState(null);
  var [expandedBP, setExpandedBP] = useState({});
  var [expandedBPItem, setExpandedBPItem] = useState({});
  var [expandedBuildBP, setExpandedBuildBP] = useState({});
  var [expandedBuildBPItem, setExpandedBuildBPItem] = useState({});
  var [promptOpen, setPromptOpen] = useState(false);
  var [promptCopied, setPromptCopied] = useState(false);
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
    var i = setInterval(function () { setAnimPhase(function (p) { return (p + 1) % 7; }); }, 2200);
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
  var cardStyle = { padding: 12, borderRadius: 8, background: C.bg, border: '1px solid ' + C.border, marginBottom: 8 };
  var rmBtnStyle = { background: 'none', border: 'none', color: C.danger, cursor: 'pointer', fontSize: 13, padding: '2px 5px', fontWeight: 700 };
  var addBtnStyle = { width: '100%', padding: '7px', borderRadius: 6, border: '1px dashed ' + C.border, background: 'transparent', color: C.accent, fontSize: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginTop: 4 };

  function arrayEditor(label, path, arr, fields, template) {
    return e('div', { style: { marginBottom: 14 } },
      e('div', { style: { fontSize: 10, fontWeight: 600, color: C.accent, marginBottom: 6, letterSpacing: '0.04em' } }, label),
      (arr || []).map(function (item, i) {
        return e('div', { key: i, style: cardStyle },
          e('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 } },
            e('span', { style: { fontSize: 10, fontWeight: 600, color: C.textMid } }, '#' + (i + 1)),
            e('button', { onClick: function () { removeItem(path, i); }, style: rmBtnStyle }, '\u00d7')
          ),
          fields.map(function (f) {
            return e(EditorField, { key: f.key, label: f.label, value: typeof item === 'string' ? item : item[f.key], onChange: function (v) { upd(path + '.' + i + '.' + (typeof item === 'string' ? '' : f.key), v); }, multi: f.multi, mono: f.mono });
          })
        );
      }),
      e('button', { onClick: function () { addItem(path, template); }, style: addBtnStyle }, '+ Add')
    );
  }

  function simpleArrayEditor(label, path, arr) {
    return e('div', { style: { marginBottom: 14 } },
      label ? e('div', { style: { fontSize: 10, fontWeight: 600, color: C.accent, marginBottom: 6 } }, label) : null,
      (arr || []).map(function (item, i) {
        return e('div', { key: i, style: { display: 'flex', gap: 4, marginBottom: 4 } },
          e('input', { type: 'text', value: item, onChange: function (ev) { upd(path + '.' + i, ev.target.value); }, style: { flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid ' + C.border, background: C.bg, color: C.text, fontSize: 12, fontFamily: "'DM Sans', sans-serif" } }),
          e('button', { onClick: function () { removeItem(path, i); }, style: rmBtnStyle }, '\u00d7')
        );
      }),
      e('button', { onClick: function () { addItem(path, 'New item'); }, style: addBtnStyle }, '+ Add')
    );
  }

  // ---- EDITOR PANEL SECTIONS ----
  var editorSections = {
    overview: function () {
      return e('div', null,
        e(EditorField, { label: 'Client Name', value: data.clientName, onChange: function (v) { upd('clientName', v); } }),
        e(EditorField, { label: 'Solution Name', value: data.solutionName, onChange: function (v) { upd('solutionName', v); } }),
        e(EditorField, { label: 'Version', value: data.version, onChange: function (v) { upd('version', v); } }),
        e(EditorField, { label: 'Confidential Line', value: data.confidentialLine, onChange: function (v) { upd('confidentialLine', v); } }),
        e(EditorField, { label: 'Callout Title', value: data.calloutTitle, onChange: function (v) { upd('calloutTitle', v); } }),
        e(EditorField, { label: 'Callout Body', value: data.calloutBody, onChange: function (v) { upd('calloutBody', v); }, multi: true }),
        simpleArrayEditor('IN SCOPE', 'scopeIn', data.scopeIn),
        simpleArrayEditor('OUT OF SCOPE', 'scopeOut', data.scopeOut)
      );
    },
    technology: function () {
      return e('div', null,
        arrayEditor('ACCOUNTS', 'accounts', data.accounts, [{ label: 'Name', key: 'name' }, { label: 'Setup', key: 'setup', multi: true }, { label: 'Connection', key: 'connection' }, { label: 'Icon', key: 'icon' }], { name: 'New Service', setup: 'Setup steps...', connection: 'Connection type', icon: '\uD83D\uDD0C', color: C.textMid }),
        arrayEditor('SHAREPOINT FOLDERS', 'spFolders', data.spFolders, [{ label: 'Content', key: 'content' }, { label: 'What to Find', key: 'find' }, { label: 'Variable', key: 'variable', mono: true }], { content: 'New folder', find: 'Where to find it', variable: 'PR_NEW_VAR', color: C.accent }),
        arrayEditor('MAKE.COM VARIABLES', 'makeVars', data.makeVars, [{ label: 'Name', key: 'name', mono: true }, { label: 'Purpose', key: 'purpose' }, { label: 'Example', key: 'example', mono: true }], { name: 'PR_NEW', purpose: 'Purpose', example: 'value' })
      );
    },
    training: function () {
      return e('div', null,
        arrayEditor('TRAINING ROWS', 'trainingRows', data.trainingRows, [{ label: '#', key: 'num' }, { label: 'Name', key: 'name' }, { label: 'Type', key: 'type' }, { label: 'Tools', key: 'tools' }, { label: 'Trigger', key: 'trigger' }, { label: 'Inputs', key: 'inputs', multi: true }, { label: 'Outputs', key: 'outputs', multi: true }], { num: (data.trainingRows || []).length + 1, name: 'New Training', type: 'Workflow', tools: 'Make.com', trigger: 'Trigger...', inputs: 'Inputs...', outputs: 'Outputs...', typeColor: C.accent })
      );
    },
    workflows: function () {
      return e('div', null,
        (data.scenarios || []).map(function (sc, i) {
          return e('div', { key: i, style: Object.assign({}, cardStyle, { marginBottom: 12 }) },
            e('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 } },
              e('span', { style: { fontSize: 11, fontWeight: 700, color: C.accent, fontFamily: mono } }, sc.id),
              e('button', { onClick: function () { removeItem('scenarios', i); }, style: rmBtnStyle }, '\u00d7')
            ),
            e(EditorField, { label: 'Name', value: sc.name, onChange: function (v) { upd('scenarios.' + i + '.name', v); } }),
            e(EditorField, { label: 'Icon', value: sc.icon, onChange: function (v) { upd('scenarios.' + i + '.icon', v); } }),
            e(EditorField, { label: 'Purpose', value: sc.purpose, onChange: function (v) { upd('scenarios.' + i + '.purpose', v); }, multi: true }),
            e(EditorField, { label: 'Trigger', value: sc.trigger, onChange: function (v) { upd('scenarios.' + i + '.trigger', v); } }),
            e(EditorField, { label: 'Details', value: sc.details, onChange: function (v) { upd('scenarios.' + i + '.details', v); }, multi: true }),
            e('div', { style: { fontSize: 10, fontWeight: 600, color: C.purple, marginBottom: 4, marginTop: 6 } }, 'MODULE LIST'),
            (sc.moduleList || []).map(function (m, j) {
              return e('div', { key: j, style: { display: 'flex', gap: 4, marginBottom: 3 } },
                e('span', { style: { fontFamily: mono, fontSize: 10, color: C.accent, padding: '6px 0', minWidth: 16 } }, j + 1),
                e('input', { type: 'text', value: m, onChange: function (ev) { upd('scenarios.' + i + '.moduleList.' + j, ev.target.value); }, style: { flex: 1, padding: '5px 8px', borderRadius: 5, border: '1px solid ' + C.border, background: C.bg, color: C.text, fontSize: 11 } }),
                e('button', { onClick: function () { removeItem('scenarios.' + i + '.moduleList', j); }, style: rmBtnStyle }, '\u00d7')
              );
            }),
            e('button', { onClick: function () { addItem('scenarios.' + i + '.moduleList', 'New module'); }, style: Object.assign({}, addBtnStyle, { marginTop: 4 }) }, '+ Add Module')
          );
        }),
        e('button', { onClick: function () { addItem('scenarios', { id: 'SC-0' + ((data.scenarios || []).length + 1), name: 'New Scenario', trigger: 'Trigger...', purpose: 'Purpose...', icon: '\uD83D\uDCCB', modules: 5, type: 'hitl', claude: false, details: 'Details...', frMap: [], moduleList: ['Step 1'], template: null }); }, style: Object.assign({}, addBtnStyle, { background: C.accentDim, border: '1px solid ' + C.accent + '44' }) }, '+ Add Scenario')
      );
    },
    configuration: function () {
      return e('div', null,
        e(EditorField, { label: 'System Prompt (Full Text)', value: data.systemPromptText, onChange: function (v) { upd('systemPromptText', v); }, multi: true }),
        arrayEditor('SYSTEM PROMPT RULES', 'systemPromptRules', data.systemPromptRules, [{ label: '#', key: 'num' }, { label: 'Title', key: 'title' }, { label: 'Description', key: 'desc', multi: true }], { num: (data.systemPromptRules || []).length + 1, title: 'NEW RULE', desc: 'Rule description...', color: C.accent }),
        arrayEditor('JSON SCHEMAS', 'jsonSchemas', data.jsonSchemas, [{ label: 'Name', key: 'name', mono: true }, { label: 'Fields', key: 'fields' }, { label: 'Used In', key: 'used' }, { label: 'Description', key: 'desc' }], { name: 'NewSchema', fields: 5, used: 'SC-0X', desc: 'Description...', arrays: [] }),
        arrayEditor('CONDITIONAL LOGIC', 'conditionalLogic', data.conditionalLogic, [{ label: 'Scenario', key: 'scenario' }, { label: 'Condition', key: 'condition' }, { label: 'If True', key: 'action', multi: true }, { label: 'If False', key: 'elseAction', multi: true }], { scenario: 'SC-0X', condition: 'New condition', action: 'Action...', elseAction: 'Else action...', color: C.accent })
      );
    },
    control: function () {
      return e('div', null,
        arrayEditor('ERROR HANDLING', 'errorHandling', data.errorHandling, [{ label: 'Trigger', key: 'trigger' }, { label: 'Response', key: 'response', multi: true }, { label: 'Severity (warning/danger)', key: 'severity' }], { trigger: 'New error', response: 'Response...', severity: 'warning' }),
        simpleArrayEditor('GUARDRAILS', 'guardrails', data.guardrails)
      );
    },
    bestpractices: function () {
      return e('div', null,
        (data.operationalBP || []).map(function (cat, ci) {
          return e('div', { key: ci, style: Object.assign({}, cardStyle, { marginBottom: 14 }) },
            e('div', { style: { fontSize: 11, fontWeight: 700, color: cat.color, marginBottom: 8 } }, cat.category),
            (cat.items || []).map(function (item, ii) {
              return e('div', { key: ii, style: { marginBottom: 8, padding: '8px 10px', borderRadius: 6, background: C.surface } },
                e(EditorField, { label: (item.type === 'do' ? '\u2713' : '\u00d7') + ' Label', value: item.label, onChange: function (v) { upd('operationalBP.' + ci + '.items.' + ii + '.label', v); } }),
                e(EditorField, { label: 'Detail', value: item.detail, onChange: function (v) { upd('operationalBP.' + ci + '.items.' + ii + '.detail', v); }, multi: true })
              );
            }),
            e('button', { onClick: function () { addItem('operationalBP.' + ci + '.items', { label: 'New item', detail: 'Detail...', type: 'do' }); }, style: addBtnStyle }, '+ Add Item')
          );
        })
      );
    },
  };

  var editorTabs = [
    { id: 'overview', label: 'Overview', icon: '\uD83C\uDFE0' },
    { id: 'technology', label: 'Technology', icon: '\u2699\uFE0F' },
    { id: 'training', label: 'Training', icon: '\uD83D\uDCCB' },
    { id: 'workflows', label: 'Workflows', icon: '\uD83D\uDCCA' },
    { id: 'configuration', label: 'Config', icon: '\uD83E\uDDE0' },
    { id: 'control', label: 'Control', icon: '\uD83D\uDEE1\uFE0F' },
    { id: 'bestpractices', label: 'Best Practices', icon: '\u2705' },
  ];

  // ---- EDITOR SLIDE-OUT PANEL ----
  function editorPanel() {
    return e('div', {
      style: {
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
        width: panelOpen ? 380 : 0,
        background: C.surface, borderRight: panelOpen ? '1px solid ' + C.border : 'none',
        overflow: 'hidden', transition: 'width 0.3s ease',
        display: 'flex', flexDirection: 'column', boxShadow: panelOpen ? '4px 0 24px rgba(0,0,0,0.08)' : 'none',
      }
    },
      // Header
      e('div', { style: { padding: '16px', borderBottom: '1px solid ' + C.border, background: C.bg, flexShrink: 0 } },
        e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } },
          e('div', { style: { display: 'flex', alignItems: 'baseline', gap: 3 } },
            e('span', { style: { fontSize: 15, fontWeight: 700, color: C.logo } }, 'MANAGE'),
            e('span', { style: { fontSize: 15, fontWeight: 700, color: C.accent } }, 'AI'),
            e('span', { style: { fontSize: 10, color: C.textDim, marginLeft: 8, fontFamily: mono } }, 'Editor')
          ),
          e('button', { onClick: function () { setPanelOpen(false); }, style: { background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '2px 6px' } }, '\u2715')
        ),
        // Tab row
        e('div', { style: { display: 'flex', gap: 3, flexWrap: 'wrap' } },
          editorTabs.map(function (t) {
            var isA = editSection === t.id;
            return e('button', {
              key: t.id,
              onClick: function () { setEditSection(t.id); setActiveView(t.id); },
              style: {
                padding: '5px 8px', borderRadius: 5,
                border: '1px solid ' + (isA ? C.accent : C.border),
                background: isA ? C.accentDim : C.bg,
                color: isA ? C.accent : C.textDim,
                fontSize: 10, fontWeight: 500, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s'
              }
            }, e('span', { style: { fontSize: 11 } }, t.icon), t.label);
          })
        )
      ),
      // Scrollable content
      e('div', { style: { flex: 1, padding: '14px 16px', overflowY: 'auto' } },
        editorSections[editSection] ? editorSections[editSection]() : null
      ),
      // Footer
      e('div', { style: { padding: '12px 16px', borderTop: '1px solid ' + C.border, background: C.bg, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 } },
        e('button', {
          onClick: handleSave, disabled: saving,
          style: { width: '100%', padding: '9px', borderRadius: 6, border: 'none', cursor: saving ? 'wait' : 'pointer', background: C.success, color: '#FFF', fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.7 : 1 }
        }, saving ? '\u23F3 Saving...' : '\u2601 Save to Cloud'),
        lastSaved ? e('div', { style: { fontSize: 9, color: C.textDim, textAlign: 'center' } }, 'Last saved: ' + lastSaved.toLocaleTimeString()) : null,
        e('button', {
          onClick: function () {
            var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url; a.download = data.clientName.toLowerCase().replace(/\s+/g, '-') + '-build-manual.json';
            a.click();
          },
          style: { width: '100%', padding: '7px', borderRadius: 6, border: '1px solid ' + C.border, cursor: 'pointer', background: 'transparent', color: C.textMid, fontSize: 10, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }
        }, '\u2193 Export JSON'),
        e('button', { onClick: function () { setData(getDefaultData()); }, style: { width: '100%', padding: '6px', borderRadius: 6, border: '1px solid ' + C.border, cursor: 'pointer', background: 'transparent', color: C.textDim, fontSize: 10, fontFamily: "'DM Sans', sans-serif" } }, 'Reset to Default')
      )
    );
  }

  // ============ NAV ============
  var views = [
    { id: 'overview', label: 'Overview' }, { id: 'technology', label: 'Technology' },
    { id: 'training', label: 'Training Overview' }, { id: 'workflows', label: 'Workflows' },
    { id: 'configuration', label: 'Configuration' }, { id: 'control', label: 'Control' },
    { id: 'bestpractices', label: 'Best Practices' }, { id: 'buildpractices', label: 'Build Best Practices' },
  ];

  function navBtn(v) {
    var isA = activeView === v.id;
    return e('button', {
      key: v.id, onClick: function () { setActiveView(v.id); },
      style: { padding: '8px 13px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.02em', transition: 'all 0.3s ease', background: isA ? C.accent : 'transparent', color: isA ? '#FFF' : C.textDim }
    }, v.label);
  }

  // ============ VIEWS ============
  function overviewView() {
    var flowItems = [
      { icon: '\uD83D\uDCC1', label: 'PR-01', sub: 'Create Workspace', clr: C.border },
      { icon: '\uD83D\uDCC4', label: 'PR-02', sub: 'Intake + Normalize', clr: C.border },
      { icon: '\uD83D\uDCCB', label: 'PR-03', sub: 'Kickoff Pack', clr: C.accent },
      { icon: '\u2705', label: 'PR-04', sub: 'HITL: Approve', clr: C.warning },
      { icon: '\uD83D\uDCDD', label: 'PR-05', sub: 'Content Pack', clr: C.purple },
      { icon: '\uD83D\uDD04', label: 'PR-06', sub: 'HITL: Review', clr: C.warning },
      { icon: '\uD83C\uDFC1', label: 'PR-07', sub: 'Final Handoff', clr: C.success },
    ];
    return e('div', { style: { animation: 'slideIn 0.5s ease' } },
      e('div', { style: { marginBottom: 28 } },
        e('h2', { style: { fontSize: 22, fontWeight: 600, margin: '0 0 6px' } }, data.solutionName + ' \u2014 System Overview'),
        e('p', { style: { fontSize: 13, color: C.textDim, margin: 0, maxWidth: 720, lineHeight: 1.6 } }, 'AI-assisted proposal generation for construction RFPs. Extracts compliance requirements, retrieves reusable content from existing SharePoint, drafts section blocks with source transparency, and packages deliverables with human-in-the-loop at every gate.')
      ),
      // Flow diagram
      (data.scenarios || []).length > 1 ? e('div', { style: { padding: 24, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border, marginBottom: 20 } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.accent, letterSpacing: '0.04em', marginBottom: 18 } }, 'WORKFLOW FLOW'),
        e('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' } },
          (data.scenarios || []).reduce(function (acc, sc, i) {
            if (i > 0) acc.push(e('span', { key: 'arr' + i, style: { color: C.textDim, fontSize: 14, flexShrink: 0 } }, '\u2192'));
            acc.push(e('div', { key: sc.id, style: { padding: '10px 14px', borderRadius: 10, background: C.bg, border: '2px solid ' + C.border, textAlign: 'center', minWidth: 88 } },
              e('div', { style: { fontSize: 18, marginBottom: 3 } }, sc.icon || '\uD83D\uDCCB'),
              e('div', { style: { fontSize: 10, fontWeight: 600, fontFamily: mono, color: C.textMid } }, sc.id),
              e('div', { style: { fontSize: 8, color: C.textDim, marginTop: 1 } }, sc.name)
            ));
            return acc;
          }, [])
        )
      ) : null,
      // Scope
      e('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 } },
        e('div', { style: { padding: 20, borderRadius: 12, background: C.success + '06', border: '1px solid ' + C.success + '20' } },
          e('div', { style: { fontSize: 11, fontWeight: 600, color: C.success, letterSpacing: '0.06em', marginBottom: 12, textTransform: 'uppercase' } }, 'In Scope (Phase 1)'),
          e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } }, (data.scopeIn || []).map(function (item, i) { return e('div', { key: i, style: { display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, color: C.textMid, lineHeight: 1.5 } }, e('span', { style: { color: C.success, flexShrink: 0, fontWeight: 700, marginTop: 1 } }, '\u2713'), item); }))
        ),
        e('div', { style: { padding: 20, borderRadius: 12, background: C.danger + '06', border: '1px solid ' + C.danger + '20' } },
          e('div', { style: { fontSize: 11, fontWeight: 600, color: C.danger, letterSpacing: '0.06em', marginBottom: 12, textTransform: 'uppercase' } }, 'Out of Scope (Phase 1)'),
          e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } }, (data.scopeOut || []).map(function (item, i) { return e('div', { key: i, style: { display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, color: C.textMid, lineHeight: 1.5 } }, e('span', { style: { color: C.danger, flexShrink: 0, fontWeight: 700, marginTop: 1 } }, '\u00d7'), item); }))
        )
      ),
      // Callouts
      e('div', { style: { padding: '16px 20px', borderRadius: 10, background: C.teal + '08', border: '1px solid ' + C.teal + '22', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 12 } },
        e('span', { style: { fontSize: 18, flexShrink: 0 } }, '\uD83D\uDCC2'),
        e('div', null, e('div', { style: { fontSize: 12, fontWeight: 600, color: C.teal, marginBottom: 3 } }, data.calloutTitle), e('div', { style: { fontSize: 11, color: C.textMid, lineHeight: 1.6 } }, data.calloutBody))
      ),
      e('div', { style: { padding: '16px 20px', borderRadius: 10, background: C.warning + '08', border: '1px solid ' + C.warning + '22', display: 'flex', alignItems: 'flex-start', gap: 12 } },
        e('span', { style: { fontSize: 18, flexShrink: 0 } }, '\u26A0\uFE0F'),
        e('div', null, e('div', { style: { fontSize: 12, fontWeight: 600, color: C.warning, marginBottom: 3 } }, 'Citations vs. Structured Outputs'), e('div', { style: { fontSize: 11, color: C.textMid, lineHeight: 1.6 } }, 'Claude citations cannot be used at the same time as Structured Outputs (json_schema). This system does NOT use Claude citations. Instead, Make.com passes source content directly to Claude and Claude outputs sources_used[] referencing file names and locations.'))
      )
    );
  }

  function technologyView() {
    return e('div', { style: { animation: 'slideIn 0.5s ease' } },
      e('div', { style: { marginBottom: 28 } },
        e('h2', { style: { fontSize: 22, fontWeight: 600, margin: '0 0 6px' } }, 'Tools, Accounts & Access'),
        e('p', { style: { fontSize: 13, color: C.textDim, margin: 0, maxWidth: 720, lineHeight: 1.6 } }, 'All required platforms, connections, and access levels. No custom code required \u2014 all connections use Make.com built-in apps or HTTP modules.')
      ),
      // Accounts
      e('div', { style: { padding: 22, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border, marginBottom: 20 } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.accent, letterSpacing: '0.04em', marginBottom: 14 } }, 'TOOLS, ACCOUNTS & ACCESS'),
        e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
          (data.accounts || []).map(function (row, ri) {
            return e('div', { key: ri, style: { display: 'flex', gap: 12, padding: '12px 16px', borderRadius: 8, background: C.bg, border: '1px solid ' + C.border } },
              e('div', { style: { fontSize: 20, flexShrink: 0 } }, row.icon),
              e('div', { style: { flex: 1 } },
                e('div', { style: { fontSize: 12, fontWeight: 600, marginBottom: 2 } }, row.name),
                e('div', { style: { fontSize: 11, color: C.textMid, lineHeight: 1.5, marginBottom: 4 } }, row.setup),
                e('div', { style: { fontSize: 10, fontFamily: mono, color: row.color || C.accent } }, row.connection)
              )
            );
          })
        )
      ),
      // SharePoint Folder Mapping
      e('div', { style: { padding: 22, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border, marginBottom: 20 } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.teal, letterSpacing: '0.04em', marginBottom: 14 } }, 'FOLDER MAPPING (EXISTING LOCATIONS)'),
        e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
          (data.spFolders || []).map(function (item, i) {
            return e('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, background: C.bg, border: '1px solid ' + C.border } },
              e('div', { style: { width: 4, height: 32, borderRadius: 2, background: item.color || C.accent, flexShrink: 0 } }),
              e('div', { style: { flex: 1 } }, e('div', { style: { fontSize: 12, fontWeight: 600, marginBottom: 2 } }, item.content), e('div', { style: { fontSize: 10, color: C.textDim } }, item.find)),
              e('div', { style: { fontFamily: mono, fontSize: 10, color: item.color || C.accent, padding: '3px 8px', borderRadius: 4, background: (item.color || C.accent) + '0A', border: '1px solid ' + (item.color || C.accent) + '15', flexShrink: 0 } }, item.variable)
            );
          })
        )
      ),
      // Make.com Variables
      e('div', { style: { padding: 22, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.purple, letterSpacing: '0.04em', marginBottom: 14 } }, 'MAKE.COM VARIABLES'),
        e('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
          (data.makeVars || []).map(function (v, i) {
            return e('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: C.bg, border: '1px solid ' + C.border } },
              e('div', { style: { fontFamily: mono, fontSize: 11, fontWeight: 600, color: C.purple, minWidth: 160 } }, v.name),
              e('div', { style: { flex: 1, fontSize: 11, color: C.textMid } }, v.purpose),
              e('div', { style: { fontFamily: mono, fontSize: 10, color: C.textDim } }, v.example)
            );
          })
        )
      )
    );
  }

  function trainingView() {
    var typeColors = { Workflow: C.accent, Knowledge: C.purple, Instructions: C.teal };
    return e('div', { style: { animation: 'slideIn 0.5s ease' } },
      e('div', { style: { marginBottom: 28 } },
        e('h2', { style: { fontSize: 22, fontWeight: 600, margin: '0 0 6px' } }, 'Training Overview'),
        e('p', { style: { fontSize: 13, color: C.textDim, margin: 0, maxWidth: 720, lineHeight: 1.6 } }, 'Complete training matrix. Each row defines what triggers the training, what goes in, and what comes out.')
      ),
      e('div', { style: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' } },
        Object.entries(typeColors).map(function (entry) {
          return e('div', { key: entry[0], style: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, background: entry[1] + '0D', border: '1px solid ' + entry[1] + '30' } },
            e('div', { style: { width: 8, height: 8, borderRadius: '50%', background: entry[1] } }),
            e('span', { style: { fontSize: 11, fontWeight: 600, color: entry[1] } }, entry[0])
          );
        })
      ),
      e('div', { style: { borderRadius: 12, border: '1px solid ' + C.border, overflow: 'hidden' } },
        e('div', { style: { overflowX: 'auto' } },
          e('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: 11 } },
            e('thead', null, e('tr', { style: { background: 'linear-gradient(135deg,' + C.surface + ',' + C.surface2 + ')' } },
              ['#', 'Training Name', 'Type', 'Tools Required', 'Trigger', 'Inputs', 'Outputs'].map(function (h, i) {
                return e('th', { key: i, style: { padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: '0.06em', borderBottom: '2px solid ' + C.border, whiteSpace: 'nowrap' } }, h);
              })
            )),
            e('tbody', null, (data.trainingRows || []).map(function (row, ri) {
              var tc = typeColors[row.type] || C.accent;
              return e('tr', { key: ri, style: { borderBottom: '1px solid ' + C.border, background: ri % 2 === 0 ? C.bg : C.surface } },
                e('td', { style: { padding: '12px 14px', verticalAlign: 'top' } }, e('div', { style: { width: 24, height: 24, borderRadius: 6, background: tc + '12', border: '1px solid ' + tc + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 11, fontWeight: 700, color: tc } }, row.num)),
                e('td', { style: { padding: '12px 14px', verticalAlign: 'top', minWidth: 160 } }, e('span', { style: { fontSize: 12, fontWeight: 600 } }, row.name)),
                e('td', { style: { padding: '12px 14px', verticalAlign: 'top', whiteSpace: 'nowrap' } }, e('span', { style: { padding: '3px 8px', borderRadius: 4, background: tc + '12', color: tc, fontSize: 10, fontWeight: 600, border: '1px solid ' + tc + '25' } }, row.type)),
                e('td', { style: { padding: '12px 14px', verticalAlign: 'top', minWidth: 160 } }, e('div', { style: { display: 'flex', flexDirection: 'column', gap: 3 } }, (row.tools || '').split(', ').map(function (t, ti) { return e('span', { key: ti, style: { fontSize: 10, fontFamily: mono, color: C.textMid } }, t); }))),
                e('td', { style: { padding: '12px 14px', verticalAlign: 'top', minWidth: 180 } }, e('div', { style: { padding: '5px 9px', borderRadius: 5, background: C.warning + '08', border: '1px solid ' + C.warning + '20', fontSize: 10, color: C.textMid, lineHeight: 1.5, fontFamily: mono } }, row.trigger)),
                e('td', { style: { padding: '12px 14px', verticalAlign: 'top', minWidth: 200, maxWidth: 260 } }, e('div', { style: { fontSize: 11, color: C.textMid, lineHeight: 1.6 } }, row.inputs)),
                e('td', { style: { padding: '12px 14px', verticalAlign: 'top', minWidth: 200, maxWidth: 260 } }, e('div', { style: { fontSize: 11, color: C.text, lineHeight: 1.6 } }, row.outputs))
              );
            }))
          )
        )
      )
    );
  }

  function workflowsView() {
    return e('div', { style: { animation: 'slideIn 0.5s ease' } },
      e('div', { style: { marginBottom: 28 } },
        e('h2', { style: { fontSize: 22, fontWeight: 600, margin: '0 0 6px' } }, 'Workflow Pipeline'),
        e('p', { style: { fontSize: 13, color: C.textDim, margin: 0, maxWidth: 720 } }, 'Make.com workflows. Each card shows the full module sequence, trigger, and DOCX template where applicable.')
      ),
      e('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        (data.scenarios || []).map(function (sc, i) {
          var isActive = animPhase === i;
          var isExpanded = expandedScenario === sc.id;
          return e('div', { key: sc.id || i },
            e('div', {
              onClick: function () { setExpandedScenario(isExpanded ? null : sc.id); },
              style: { padding: '16px 20px', borderRadius: 12, cursor: 'pointer', background: isActive ? C.accentDim : C.surface, border: '1px solid ' + (isActive ? C.accent : C.border), transition: 'all 0.4s ease', position: 'relative', overflow: 'hidden', animation: isActive ? 'pulseGlow 2.5s infinite' : 'none' }
            },
              isActive ? e('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,' + C.accent + ',transparent)', backgroundSize: '200% 100%', animation: 'dataFlow 1.5s linear infinite' } }) : null,
              e('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
                e('div', { style: { width: 44, height: 44, borderRadius: 10, background: isActive ? C.accent + '18' : C.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, border: '1px solid ' + (isActive ? C.accent + '33' : C.border) } }, sc.icon || '\uD83D\uDCCB'),
                e('div', { style: { flex: 1 } },
                  e('div', { style: { display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 3 } },
                    e('span', { style: { fontFamily: mono, fontSize: 10, color: C.accent, background: C.accentDim, padding: '2px 6px', borderRadius: 4, fontWeight: 600 } }, sc.id),
                    e('span', { style: { fontSize: 13, fontWeight: 600 } }, sc.name),
                    sc.type === 'hitl' ? e('span', { style: { fontSize: 9, padding: '2px 6px', borderRadius: 4, background: C.warning + '15', color: C.warning, fontWeight: 600 } }, 'HITL GATE') : null,
                    sc.claude ? e('span', { style: { fontSize: 9, padding: '2px 6px', borderRadius: 4, background: C.purple + '12', color: C.purple, fontWeight: 600 } }, 'CLAUDE AI') : null,
                    sc.template ? e('span', { style: { fontSize: 9, padding: '2px 6px', borderRadius: 4, background: C.success + '12', color: C.success, fontWeight: 600 } }, '\uD83D\uDCC4 TEMPLATE') : null
                  ),
                  e('div', { style: { fontSize: 11, color: C.textDim, lineHeight: 1.4 } }, sc.purpose)
                ),
                e('div', { style: { textAlign: 'right', flexShrink: 0 } }, e('div', { style: { fontFamily: mono, fontSize: 16, fontWeight: 600, color: C.accent } }, sc.modules || (sc.moduleList || []).length), e('div', { style: { fontSize: 9, color: C.textDim, letterSpacing: '0.04em' } }, 'MODULES')),
                e('div', { style: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: isActive ? C.success : C.border, animation: isActive ? 'pulseDot 1.5s infinite' : 'none' } }),
                e('div', { style: { fontSize: 11, color: C.textDim, marginLeft: 4 } }, isExpanded ? '\u25B2' : '\u25BC')
              )
            ),
            // Expanded detail
            isExpanded ? e('div', { style: { margin: '6px 0 6px 0', padding: 18, borderRadius: 10, background: C.surface, border: '1px solid ' + C.border, animation: 'slideIn 0.3s ease' } },
              e('div', { style: { fontSize: 12, color: C.textMid, lineHeight: 1.6, marginBottom: 14 } }, sc.details),
              e('div', { style: { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 } },
                e('div', null, e('div', { style: { fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: '0.04em', marginBottom: 4 } }, 'TRIGGER'), e('div', { style: { fontSize: 11, fontFamily: mono, padding: '4px 8px', background: C.surface2, borderRadius: 4, border: '1px solid ' + C.border } }, sc.trigger)),
                sc.frMap && sc.frMap.length > 0 ? e('div', null, e('div', { style: { fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: '0.04em', marginBottom: 4 } }, 'MAPS TO'), e('div', { style: { display: 'flex', gap: 4, flexWrap: 'wrap' } }, sc.frMap.map(function (fr) { return e('span', { key: fr, style: { fontSize: 10, padding: '3px 7px', borderRadius: 4, background: C.accentDim, color: C.accent, fontWeight: 500 } }, fr); }))) : null
              ),
              e('div', { style: { fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: '0.04em', marginBottom: 6 } }, 'MODULE SEQUENCE'),
              e('div', { style: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: sc.template ? 16 : 0 } },
                (sc.moduleList || []).map(function (m, j) {
                  return e('div', { key: j, style: { display: 'flex', alignItems: 'center', gap: 8 } },
                    e('span', { style: { fontFamily: mono, fontSize: 9, color: C.accent, fontWeight: 600, minWidth: 16 } }, j + 1),
                    e('span', { style: { fontSize: 10, padding: '4px 10px', borderRadius: 4, background: C.bg, border: '1px solid ' + C.border, color: C.textMid } }, m)
                  );
                })
              ),
              // Template
              sc.template ? e('div', { style: { padding: '14px 18px', borderRadius: 8, background: C.success + '06', border: '1px solid ' + C.success + '20' } },
                e('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } }, e('span', { style: { fontSize: 16 } }, '\uD83D\uDCC4'), e('div', null, e('div', { style: { fontSize: 12, fontWeight: 600, color: C.success } }, sc.template.name), e('div', { style: { fontSize: 11, color: C.textMid } }, sc.template.purpose))),
                e('div', { style: { fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: '0.04em', marginBottom: 6 } }, 'MERGE TAGS'),
                e('div', { style: { display: 'flex', gap: 5, flexWrap: 'wrap' } }, (sc.template.mergeTags || []).map(function (tag) { return e('span', { key: tag, style: { fontFamily: mono, fontSize: 10, padding: '3px 8px', borderRadius: 4, background: C.purple + '0A', color: C.purple, border: '1px solid ' + C.purple + '15' } }, '{{' + tag + '}}'); }))
              ) : null
            ) : null,
            // Connector line
            i < (data.scenarios || []).length - 1 ? e('div', { style: { display: 'flex', alignItems: 'center', padding: '3px 0 3px 28px' } }, e('div', { style: { width: 1, height: 10, background: C.border, marginLeft: 20 } })) : null
          );
        })
      )
    );
  }

  function configurationView() {
    return e('div', { style: { animation: 'slideIn 0.5s ease' } },
      e('div', { style: { marginBottom: 28 } },
        e('h2', { style: { fontSize: 22, fontWeight: 600, margin: '0 0 6px' } }, 'Configuration'),
        e('p', { style: { fontSize: 13, color: C.textDim, margin: 0, maxWidth: 720 } }, 'Everything Claude. Model selection, HTTP call settings, system prompt rules, the full prompt text, conditional logic per workflow, and all JSON schemas.')
      ),
      // Model Selection
      e('div', { style: { padding: 20, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border, marginBottom: 16 } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.accent, letterSpacing: '0.04em', marginBottom: 14 } }, 'MODEL SELECTION & HTTP SETTINGS'),
        e('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 14 } },
          [{ label: 'Model', value: 'claude-sonnet-4-5-20250929' }, { label: 'Variable', value: '{{PR_CLAUDE_MODEL}}' }, { label: 'Method', value: 'POST' }, { label: 'URL', value: 'api.anthropic.com/v1/messages' }, { label: 'anthropic-version', value: '2023-06-01' }, { label: 'content-type', value: 'application/json' }].map(function (item) {
            return e('div', { key: item.label, style: { padding: '10px 14px', borderRadius: 8, background: C.bg, border: '1px solid ' + C.border } },
              e('div', { style: { fontSize: 10, color: C.textDim, fontWeight: 500, letterSpacing: '0.04em', marginBottom: 3 } }, item.label),
              e('div', { style: { fontSize: 12, fontFamily: mono, fontWeight: 500 } }, item.value)
            );
          })
        ),
        e('div', { style: { padding: '10px 14px', borderRadius: 8, background: C.warning + '08', border: '1px solid ' + C.warning + '20', fontSize: 11, color: C.textMid } }, '\uD83D\uDCA1 Store model string as Make.com variable PR_CLAUDE_MODEL. Update the model across all workflows from one place.')
      ),
      // System Prompt Rules
      e('div', { style: { fontSize: 12, fontWeight: 600, color: C.textDim, letterSpacing: '0.06em', marginBottom: 12, textTransform: 'uppercase' } }, 'System Prompt Rules'),
      e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 } },
        (data.systemPromptRules || []).map(function (rule, i) {
          return e('div', { key: i, style: { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderRadius: 10, background: C.surface, border: '1px solid ' + C.border } },
            e('div', { style: { width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: (rule.color || C.accent) + '12', border: '1px solid ' + (rule.color || C.accent) + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 11, fontWeight: 700, color: rule.color || C.accent } }, rule.num),
            e('div', null, e('div', { style: { fontSize: 12, fontWeight: 600, marginBottom: 2 } }, rule.title), e('div', { style: { fontSize: 11, color: C.textMid, lineHeight: 1.5 } }, rule.desc))
          );
        })
      ),
      // Prompt Dropdown
      e('div', { style: { borderRadius: 10, border: '1px solid ' + C.purple + '40', overflow: 'hidden', marginBottom: 20 } },
        e('div', {
          onClick: function () { setPromptOpen(function (o) { return !o; }); },
          style: { padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: promptOpen ? C.purple + '08' : C.surface, borderBottom: promptOpen ? '1px solid ' + C.purple + '25' : 'none', transition: 'background 0.2s' }
        },
          e('div', { style: { width: 32, height: 32, borderRadius: 8, background: C.purple + '14', border: '1px solid ' + C.purple + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 } }, '\uD83D\uDCAC'),
          e('div', { style: { flex: 1 } },
            e('div', { style: { fontSize: 13, fontWeight: 600, color: promptOpen ? C.purple : C.text } }, 'Full System Prompt'),
            e('div', { style: { fontSize: 11, color: C.textDim, marginTop: 2 } }, 'The exact prompt text used as the system message in every Claude call')
          ),
          e('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
            e('span', { style: { fontSize: 10, padding: '2px 8px', borderRadius: 4, background: C.teal + '12', color: C.teal, fontWeight: 600, border: '1px solid ' + C.teal + '25' } }, (data.systemPromptRules || []).length + ' RULES'),
            e('div', { style: { fontSize: 14, color: promptOpen ? C.purple : C.textDim, transition: 'transform 0.2s', transform: promptOpen ? 'rotate(180deg)' : 'rotate(0deg)' } }, '\u25BC')
          )
        ),
        promptOpen ? e('div', { style: { background: C.bg, animation: 'slideIn 0.25s ease' } },
          e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', background: C.surface2, borderBottom: '1px solid ' + C.border } },
            e('span', { style: { fontSize: 10, fontFamily: mono, color: C.textDim } }, 'system prompt \u00b7 applied as system message in all Claude HTTP module calls'),
            e('button', {
              onClick: function () { navigator.clipboard.writeText(data.systemPromptText || '').then(function () { setPromptCopied(true); setTimeout(function () { setPromptCopied(false); }, 2000); }); },
              style: { fontSize: 11, padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, transition: 'all 0.2s', border: '1px solid ' + (promptCopied ? C.success + '60' : C.border), background: promptCopied ? C.success + '10' : C.bg, color: promptCopied ? C.success : C.textMid }
            }, promptCopied ? '\u2713 Copied!' : '\uD83D\uDCCB Copy Prompt')
          ),
          e('div', { style: { padding: '18px 22px' } },
            (data.systemPromptText || '').split('\n\n').map(function (block, bi) {
              var isRule = /^\d\./.test(block.trim());
              var ruleColors = [C.danger, C.warning, C.accent, C.textMid, C.success, C.purple, C.teal];
              if (isRule) {
                var ruleNum = parseInt(block.trim()[0]) - 1;
                var color = ruleColors[ruleNum] || C.accent;
                var colonIdx = block.indexOf(':');
                var titleText = colonIdx > -1 ? block.substring(0, colonIdx).trim() : block;
                var bodyText = colonIdx > -1 ? block.substring(colonIdx + 1).trim() : '';
                return e('div', { key: bi, style: { display: 'flex', gap: 14, padding: '12px 16px', borderRadius: 8, marginBottom: 8, background: color + '05', border: '1px solid ' + color + '20' } },
                  e('div', { style: { width: 26, height: 26, borderRadius: 6, flexShrink: 0, background: color + '14', border: '1px solid ' + color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 11, fontWeight: 700, color: color } }, ruleNum + 1),
                  e('div', null,
                    e('div', { style: { fontSize: 12, fontWeight: 700, color: color, marginBottom: 3, letterSpacing: '0.02em' } }, titleText.replace(/^\d\.\s*/, '')),
                    e('div', { style: { fontSize: 12, color: C.textMid, lineHeight: 1.6, fontFamily: mono, whiteSpace: 'pre-wrap' } }, bodyText)
                  )
                );
              }
              return e('div', { key: bi, style: { padding: '10px 14px', borderRadius: 8, background: C.surface, border: '1px solid ' + C.border, marginBottom: 12, fontSize: 12, color: C.text, fontFamily: mono, lineHeight: 1.6, fontStyle: 'italic' } }, block);
            })
          )
        ) : null
      ),
      // Conditional Logic
      e('div', { style: { padding: 20, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border, marginBottom: 16 } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.orange, letterSpacing: '0.04em', marginBottom: 14 } }, 'CONDITIONAL LOGIC (IF / ELSE PER WORKFLOW)'),
        e('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
          (data.conditionalLogic || []).map(function (logic, i) {
            var lc = logic.color || C.accent;
            return e('div', { key: i, style: { borderRadius: 8, overflow: 'hidden', border: '1px solid ' + lc + '30' } },
              e('div', { style: { padding: '8px 14px', background: lc + '08', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid ' + lc + '20' } },
                e('span', { style: { fontFamily: mono, fontSize: 10, fontWeight: 600, color: lc, padding: '2px 6px', borderRadius: 3, background: lc + '12' } }, logic.scenario),
                e('span', { style: { fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: '0.04em' } }, 'CONDITION'),
                e('span', { style: { fontSize: 11, color: C.text, fontWeight: 500 } }, logic.condition)
              ),
              e('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 } },
                e('div', { style: { padding: '10px 14px', borderRight: '1px solid ' + C.border } }, e('div', { style: { fontSize: 9, fontWeight: 700, color: C.success, letterSpacing: '0.06em', marginBottom: 4 } }, 'IF TRUE \u2192'), e('div', { style: { fontSize: 11, color: C.textMid, lineHeight: 1.5 } }, logic.action)),
                e('div', { style: { padding: '10px 14px' } }, e('div', { style: { fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: '0.06em', marginBottom: 4 } }, 'IF FALSE \u2192'), e('div', { style: { fontSize: 11, color: C.textMid, lineHeight: 1.5 } }, logic.elseAction))
              )
            );
          })
        )
      ),
      // JSON Schemas
      e('div', { style: { padding: 20, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.accent, letterSpacing: '0.04em', marginBottom: 14 } }, 'JSON SCHEMAS (STRUCTURED OUTPUTS)'),
        e('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 } },
          (data.jsonSchemas || []).map(function (schema, i) {
            return e('div', { key: i, style: { padding: 16, borderRadius: 8, background: C.bg, border: '1px solid ' + C.border } },
              e('div', { style: { fontFamily: mono, fontSize: 13, fontWeight: 600, color: C.purple, marginBottom: 4 } }, schema.name),
              e('div', { style: { fontSize: 11, color: C.textMid, marginBottom: 10 } }, schema.desc),
              e('div', { style: { display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' } },
                e('span', { style: { fontSize: 10, padding: '2px 6px', borderRadius: 3, background: C.surface2, color: C.textDim, fontFamily: mono } }, schema.fields + ' fields'),
                e('span', { style: { fontSize: 10, padding: '2px 6px', borderRadius: 3, background: C.accentDim, color: C.accent, fontFamily: mono } }, 'Used in ' + schema.used)
              ),
              schema.arrays ? e('div', { style: { display: 'flex', gap: 4, flexWrap: 'wrap' } }, (schema.arrays || []).map(function (a) { return e('span', { key: a, style: { fontSize: 9, padding: '2px 6px', borderRadius: 3, background: C.purple + '0A', color: C.purple, fontFamily: mono } }, a + '[]'); })) : null
            );
          })
        )
      )
    );
  }

  function controlView() {
    return e('div', { style: { animation: 'slideIn 0.5s ease' } },
      e('div', { style: { marginBottom: 28 } },
        e('h2', { style: { fontSize: 22, fontWeight: 600, margin: '0 0 6px' } }, 'Control'),
        e('p', { style: { fontSize: 13, color: C.textDim, margin: 0, maxWidth: 720 } }, 'Error handling, logging, status tracking, permissions, and system guardrails.')
      ),
      // Error Handling
      e('div', { style: { padding: 20, borderRadius: 12, background: C.surface, border: '1px solid ' + C.border, marginBottom: 16 } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.orange, letterSpacing: '0.04em', marginBottom: 14 } }, 'ERROR HANDLING MATRIX'),
        e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
          (data.errorHandling || []).map(function (err, i) {
            return e('div', { key: i, style: { padding: '14px 16px', borderRadius: 8, background: C.bg, border: '1px solid ' + (err.severity === 'danger' ? C.danger + '30' : C.warning + '30') } },
              e('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 } },
                e('div', { style: { width: 8, height: 8, borderRadius: '50%', background: err.severity === 'danger' ? C.danger : C.warning, flexShrink: 0 } }),
                e('span', { style: { fontSize: 12, fontWeight: 600 } }, err.trigger),
                e('span', { style: { fontSize: 9, padding: '2px 6px', borderRadius: 4, background: err.severity === 'danger' ? C.danger + '12' : C.warning + '12', color: err.severity === 'danger' ? C.danger : C.warning, fontWeight: 600, marginLeft: 'auto' } }, (err.severity || 'warning').toUpperCase())
              ),
              e('div', { style: { fontSize: 11, color: C.textMid, lineHeight: 1.5, paddingLeft: 16 } }, err.response)
            );
          })
        )
      ),
      // Guardrails
      e('div', { style: { padding: 20, borderRadius: 12, background: C.danger + '06', border: '1px solid ' + C.danger + '20', marginBottom: 16 } },
        e('div', { style: { fontSize: 12, fontWeight: 600, color: C.danger, letterSpacing: '0.04em', marginBottom: 12 } }, 'SYSTEM GUARDRAILS (NON-NEGOTIABLE)'),
        e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
          (data.guardrails || []).map(function (g, i) {
            return e('div', { key: i, style: { display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: C.textMid, lineHeight: 1.5 } }, e('span', { style: { color: C.danger, flexShrink: 0, fontWeight: 700 } }, '\u00d7'), g);
          })
        )
      )
    );
  }

  // ---- BEST PRACTICES SHARED VIEW ----
  function bpView(bpData, expState, setExpState, expItemState, setExpItemState) {
    return e('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
      (bpData || []).map(function (cat, ci) {
        var catOpen = !!expState[ci];
        return e('div', { key: ci, style: { borderRadius: 12, border: '1px solid ' + (catOpen ? (cat.color || C.accent) + '44' : C.border), overflow: 'hidden' } },
          e('div', {
            onClick: function () { setExpState(function (p) { var n = Object.assign({}, p); n[ci] = !p[ci]; return n; }); },
            style: { padding: '16px 20px', background: catOpen ? (cat.color || C.accent) + '06' : C.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }
          },
            e('div', { style: { width: 40, height: 40, borderRadius: 10, background: (cat.color || C.accent) + '12', border: '1px solid ' + (cat.color || C.accent) + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 } }, cat.icon),
            e('div', { style: { flex: 1 } },
              e('div', { style: { fontSize: 14, fontWeight: 600, color: catOpen ? (cat.color || C.accent) : C.text } }, cat.category),
              e('div', { style: { fontSize: 11, color: C.textDim } }, (cat.items || []).filter(function (x) { return x.type === 'do'; }).length + ' do / ' + (cat.items || []).filter(function (x) { return x.type === 'dont'; }).length + " don't")
            ),
            e('div', { style: { display: 'flex', gap: 6, alignItems: 'center' } },
              e('div', { style: { width: 20, height: 20, borderRadius: '50%', background: C.success + '12', border: '1px solid ' + C.success + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: C.success } }, (cat.items || []).filter(function (x) { return x.type === 'do'; }).length),
              e('div', { style: { width: 20, height: 20, borderRadius: '50%', background: C.danger + '12', border: '1px solid ' + C.danger + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: C.danger } }, (cat.items || []).filter(function (x) { return x.type === 'dont'; }).length),
              e('div', { style: { fontSize: 14, color: catOpen ? (cat.color || C.accent) : C.textDim, marginLeft: 6, transition: 'transform 0.2s', transform: catOpen ? 'rotate(180deg)' : 'rotate(0deg)' } }, '\u25BC')
            )
          ),
          catOpen ? e('div', { style: { padding: '0 16px 16px', background: C.bg, display: 'flex', flexDirection: 'column', gap: 6, animation: 'slideIn 0.25s ease' } },
            (cat.items || []).map(function (item, ii) {
              var itemKey = ci + '-' + ii;
              var itemOpen = !!expItemState[itemKey];
              var isDo = item.type === 'do';
              return e('div', { key: ii, style: { borderRadius: 8, border: '1px solid ' + (isDo ? C.success + '25' : C.danger + '25'), overflow: 'hidden', marginTop: ii === 0 ? 12 : 0 } },
                e('div', {
                  onClick: function () { setExpItemState(function (p) { var n = Object.assign({}, p); n[itemKey] = !p[itemKey]; return n; }); },
                  style: { padding: '11px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: isDo ? C.success + '04' : C.danger + '04' }
                },
                  e('div', { style: { width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: isDo ? C.success + '15' : C.danger + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: isDo ? C.success : C.danger } }, isDo ? '\u2713' : '\u00d7'),
                  e('span', { style: { fontSize: 12, fontWeight: 500, flex: 1 } }, item.label),
                  e('span', { style: { fontSize: 11, color: C.textDim } }, itemOpen ? '\u25B2' : '\u25BC')
                ),
                itemOpen ? e('div', { style: { padding: '10px 14px 12px 46px', background: C.bg, fontSize: 12, color: C.textMid, lineHeight: 1.6, borderTop: '1px solid ' + C.border, animation: 'fadeIn 0.2s ease' } }, item.detail) : null
              );
            })
          ) : null
        );
      })
    );
  }

  function bestPracticesView() {
    return e('div', { style: { animation: 'slideIn 0.5s ease' } },
      e('div', { style: { marginBottom: 28 } }, e('h2', { style: { fontSize: 22, fontWeight: 600, margin: '0 0 6px' } }, 'Best Practices'), e('p', { style: { fontSize: 13, color: C.textDim, margin: 0, maxWidth: 720 } }, 'Operational guidance for running this system. Click a category, then each item for full detail.')),
      bpView(data.operationalBP, expandedBP, setExpandedBP, expandedBPItem, setExpandedBPItem)
    );
  }

  function buildPracticesView() {
    return e('div', { style: { animation: 'slideIn 0.5s ease' } },
      e('div', { style: { marginBottom: 28 } }, e('h2', { style: { fontSize: 22, fontWeight: 600, margin: '0 0 6px' } }, 'Build Best Practices'), e('p', { style: { fontSize: 13, color: C.textDim, margin: 0, maxWidth: 720 } }, 'Guidance for building this AI and automation system from scratch. Click a category, then each item for full detail.')),
      bpView(data.buildBP, expandedBuildBP, setExpandedBuildBP, expandedBuildBPItem, setExpandedBuildBPItem)
    );
  }

  var viewMap = {
    overview: overviewView,
    technology: technologyView,
    training: trainingView,
    workflows: workflowsView,
    configuration: configurationView,
    control: controlView,
    bestpractices: bestPracticesView,
    buildpractices: buildPracticesView,
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

  var content = (viewMap[activeView] || overviewView)();

  // ---- MAIN LAYOUT ----
  return e('div', { style: { display: 'flex', minHeight: '100vh' } },
    editorPanel(),
    // Main content shifts when panel open
    e('div', { style: { flex: 1, minHeight: '100vh', background: C.bg, position: 'relative', transition: 'margin-left 0.3s ease', marginLeft: panelOpen ? 380 : 0 } },
      // Grid background
      e('div', { style: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(' + C.border + '33 1px, transparent 1px), linear-gradient(90deg, ' + C.border + '33 1px, transparent 1px)', backgroundSize: '60px 60px' } }),
      // Floating particles
      e('div', { style: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 } },
        Array.from({ length: 12 }, function (_, i) {
          return e('div', { key: i, style: { position: 'absolute', width: 2, height: 2, borderRadius: '50%', background: C.accent, opacity: 0, left: (Math.random() * 100) + '%', top: '100%', animation: 'floatUp 10s ' + (i * 0.9) + 's infinite ease-out' } });
        })
      ),
      // Header
      e('header', { style: { position: 'relative', zIndex: 10, padding: '20px 28px 16px', borderBottom: '1px solid ' + C.border, background: 'linear-gradient(180deg,' + C.surface + ' 0%,' + C.bg + ' 100%)' } },
        e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 } },
          e('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
            !panelOpen ? e('button', { onClick: function () { setPanelOpen(true); }, title: 'Open Editor', style: { width: 32, height: 32, borderRadius: 6, border: '1px solid ' + C.border, background: C.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: C.accent, flexShrink: 0, transition: 'all 0.2s' } }, '\u270F\uFE0F') : null,
            e('div', { style: { display: 'flex', alignItems: 'baseline', gap: 4 } }, e('span', { style: { fontSize: 20, fontWeight: 700, color: C.logo, letterSpacing: '-0.02em' } }, 'MANAGE'), e('span', { style: { fontSize: 20, fontWeight: 700, color: C.accent, letterSpacing: '-0.02em' } }, 'AI')),
            e('div', { style: { width: 1, height: 20, background: C.border } }),
            e('div', null,
              e('div', { style: { fontSize: 12, fontWeight: 600 } }, data.clientName + ' \u2014 ' + data.solutionName),
              e('div', { style: { fontSize: 9, color: C.textDim, marginTop: 1, fontFamily: mono } }, 'Build Manual v' + data.version + ' \u00b7 ' + data.stack)
            )
          ),
          e('div', { style: { display: 'flex', gap: 2, background: C.surface2, borderRadius: 8, padding: 3, border: '1px solid ' + C.border, flexWrap: 'wrap' } }, views.map(function (v) { return navBtn(v); }))
        )
      ),
      // Main content
      e('main', { style: { position: 'relative', zIndex: 5, padding: '30px 28px', maxWidth: 1400, margin: '0 auto' } }, content),
      // Footer
      e('footer', { style: { position: 'relative', zIndex: 5, padding: '16px 28px', borderTop: '1px solid ' + C.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 } },
        e('div', { style: { fontSize: 11, color: C.textDim } }, e('span', { style: { color: C.logo } }, 'MANAGE'), e('span', { style: { color: C.accent } }, 'AI'), e('span', { style: { marginLeft: 8 } }, '\u00b7 ' + data.solutionName + ' Build Manual v' + data.version + ' \u00b7 February 2026')),
        e('div', { style: { fontSize: 10, color: C.textDim, fontFamily: mono } }, 'CONFIDENTIAL \u2014 ' + data.confidentialLine)
      )
    )
  );
}

export default App;
