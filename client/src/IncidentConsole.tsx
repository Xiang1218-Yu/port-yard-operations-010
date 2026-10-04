import { FormEvent, useMemo, useState } from 'react';

type ScopeType = 'voyage' | 'block' | 'equipment' | 'container' | 'gate-lane';
type Severity = 'minor' | 'major' | 'critical';
type IncidentType = 'equipment-fault' | 'customs-control' | 'gate-congestion' | 'yard-safety' | 'weather' | 'system-outage' | 'other';
type EffectState = 'applied' | 'review-pending' | 'restored' | 'rejected' | 'restore-failed';

export interface ScopeRef { type: ScopeType; ref: string; }
interface OptionLike { id: string }
export interface SummaryIncident {
  id: string; title: string; type: IncidentType; severity: Severity; status: 'active' | 'closed';
  scope: ScopeRef[]; commander: string; phase: string; createdAt: string; closedAt?: string;
}
export interface IncidentSummary {
  incident: SummaryIncident; ruleCount: number; rulesLifted: number; pausedTasks: number;
  affectedTasks: number; affectedContainers: number; pendingReview: number;
  restoreFailed: number; unrecoveredTasks: number;
}
interface RuleEffectView {
  id: string; taskId: string; containerId: string; state: EffectState; attempts: number;
  reviewNote?: string; lastFailureReason?: string; task?: { id: string; from: string; to: string; equipmentId?: string; status: string };
}
interface RuleView {
  id: string; action: 'pause-tasks' | 'reassign-tasks'; fallbackEquipmentId?: string; memo: string;
  createdAt: string; liftRequested: boolean; liftedAt?: string; publishedBy: string; effects: RuleEffectView[];
}
interface TimelineEntry { kind: string; at: string; actor: string; title: string; note?: string }
export interface IncidentDetail {
  incident: SummaryIncident;
  scopeObjects: { voyages: OptionLike[]; blocks: OptionLike[]; equipment: OptionLike[]; containers: { id: string; yardSlot: string }[]; gateLanes: string[] };
  affected: {
    voyages: OptionLike[]; blocks: OptionLike[]; equipment: OptionLike[]; containers: OptionLike[]; gateLanes: string[];
    tasks: { task: { id: string; kind: string; containerId: string; status: string; equipmentId?: string; from: string; to: string }; alsoCoveredBy: string[]; suspended: boolean; ruleIds: string[] }[];
    relatedContainers: { id: string; status: string; customs: string }[];
    appointments: { id: string; truckNo: string; status: string }[];
  };
  unrecovered: { effects: unknown[]; tasks: { task: { id: string; containerId: string; status: string }; effects: RuleEffectView[]; coveringIncidents: string[]; pendingReview: boolean; restoreFailed: RuleEffectView[] }[] };
  rules: RuleView[];
  phases: { id: string; phase: string; note: string; actor: string; at: string }[];
  handovers: { id: string; fromCommander: string; toCommander: string; reason: string; at: string }[];
  evidences: { id: string; kind: string; title: string; note: string; fileRef: string; actor: string; at: string; afterClosure: boolean }[];
  notices: { id: string; kind: string; title: string; body: string; channel: string; at: string; read: boolean }[];
  carryOver?: { note: string; at: string; items: string[] };
  timeline: TimelineEntry[];
}
export interface UnrecoveredRow {
  task: { id: string; containerId: string; status: string; from: string; to: string; equipmentId?: string };
  incidents: { id: string; title: string; closed: boolean }[];
  pendingReview: boolean; restoreFailed: RuleEffectView[]; carriedOverFromClosed: string[];
}

interface Props {
  incidents: IncidentSummary[];
  detail?: IncidentDetail;
  unrecovered: UnrecoveredRow[];
  voyages: { id: string; vessel: string }[];
  blocks: { id: string; zone: string }[];
  equipment: { id: string; name: string; status: string }[];
  containers: { id: string; status: string }[];
  selectedId?: string;
  busy: boolean;
  onSelect: (id: string) => void;
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
  onAction: (path: string, body?: Record<string, unknown>) => Promise<void>;
}

const typeLabels: Record<IncidentType, string> = { 'equipment-fault': '设备故障', 'customs-control': '海关管制', 'gate-congestion': '闸口拥堵', 'yard-safety': '堆场安全', weather: '恶劣天气', 'system-outage': '系统中断', other: '其他事件' };
const severityLabels: Record<Severity, string> = { minor: '一般', major: '较大', critical: '重大' };
const phaseLabels: Record<string, string> = { detection: '发现接报', containment: '先期封控', response: '联动处置', recovery: '恢复评估', closed: '已关闭' };
const scopeTypeLabels: Record<ScopeType, string> = { voyage: '航次', block: '区块', equipment: '设备', container: '箱号', 'gate-lane': '闸口车道' };
const laneLabels: Record<string, string> = { north: '北闸口', south: '南闸口', rail: '铁路闸口' };
const stateLabels: Record<EffectState, string> = { applied: '执行中', 'review-pending': '待人工复核', restored: '已恢复', rejected: '复核驳回', 'restore-failed': '恢复失败' };
const dateTime = (value: string) => new Date(value).toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const scopeKey = (ref: ScopeRef) => `${ref.type}:${ref.ref}`;
const scopeLabel = (ref: ScopeRef) => ref.type === 'gate-lane' ? laneLabels[ref.ref] ?? ref.ref : ref.ref;

const emptyForm = { title: '', type: 'equipment-fault' as IncidentType, severity: 'major' as Severity, commander: '', scopeType: 'equipment' as ScopeType, scopeRef: 'YC-12', scopeList: [] as ScopeRef[], memo: '' };

export default function IncidentConsole({ incidents, detail, unrecovered, voyages, blocks, equipment, containers, selectedId, busy, onSelect, onCreate, onAction }: Props) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showHandover, setShowHandover] = useState(false);
  const [evidenceForm, setEvidenceForm] = useState({ kind: 'document', title: '', fileRef: '', note: '' });
  const [handoverForm, setHandoverForm] = useState({ toCommander: '', reason: '' });

  const active = incidents.filter(item => item.incident.status === 'active');
  const closed = incidents.filter(item => item.incident.status === 'closed');
  const globalOpen = useMemo(() => unrecovered.filter(row => row.pendingReview || row.restoreFailed.length || row.task.status === 'blocked'), [unrecovered]);

  const optionsFor = (type: ScopeType) => {
    if (type === 'voyage') return voyages.map(v => ({ value: v.id, label: `${v.id} · ${v.vessel}` }));
    if (type === 'block') return blocks.map(b => ({ value: b.id, label: `${b.id} · ${b.zone}` }));
    if (type === 'equipment') return equipment.map(e => ({ value: e.id, label: `${e.name} · ${e.status}` }));
    if (type === 'container') return containers.map(c => ({ value: c.id, label: c.id }));
    return [
      { value: 'north', label: '北闸口' }, { value: 'south', label: '南闸口' }, { value: 'rail', label: '铁路闸口' },
    ];
  };

  const addScope = () => {
    const ref: ScopeRef = { type: form.scopeType, ref: form.scopeRef };
    if (!form.scopeList.some(item => scopeKey(item) === scopeKey(ref))) setForm({ ...form, scopeList: [...form.scopeList, ref] });
  };
  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    await onCreate({ title: form.title, type: form.type, severity: form.severity, commander: form.commander || '现场指挥', scope: form.scopeList });
    setCreating(false); setForm(emptyForm);
  };

  const act = async (path: string, body?: Record<string, unknown>) => { await onAction(path, body); };
  const publishPause = async () => {
    const memo = window.prompt('暂停规则说明（将通知受影响班组）：', '受影响任务立即暂停，等待事件解除与人工复核');
    if (memo === null) return;
    await act(`/incidents/${selectedId}/rules`, { action: 'pause-tasks', memo });
  };
  const publishReassign = async () => {
    const fallback = window.prompt('输入接替设备编号（可选项：' + equipment.filter(e => e.status !== 'offline').map(e => e.id).join('、') + '）：', 'YC-05');
    if (!fallback) return;
    const memo = window.prompt('改派规则说明：', `任务临时改派至 ${fallback}`);
    if (memo === null) return;
    await act(`/incidents/${selectedId}/rules`, { action: 'reassign-tasks', fallbackEquipmentId: fallback.trim(), memo });
  };
  const requestLift = (ruleId: string) => act(`/rules/${ruleId}/lift`);
  const review = async (ruleId: string, effectId: string, decision: 'approve' | 'reject') => {
    const note = window.prompt(decision === 'approve' ? '复核通过备注（恢复依据）：' : '驳回原因（规则将继续生效）：', decision === 'approve' ? '现场条件恢复，同意恢复作业' : '');
    if (note === null) return;
    await act(`/rules/${ruleId}/effects/${effectId}/review`, { decision, note });
  };
  const registerPhase = async (phase: string) => {
    const note = window.prompt(`进入「${phaseLabels[phase]}」阶段的处置记录：`, '');
    if (note === null) return;
    await act(`/incidents/${selectedId}/phase`, { phase, note });
  };
  const close = async () => {
    if (!detail) return;
    const note = window.prompt('关闭说明：', '全部处置与恢复完成');
    if (note === null) return;
    await act(`/incidents/${detail.incident.id}/close`, { note });
  };
  const forceClose = async () => {
    if (!detail) return;
    if (!window.confirm(`仍有 ${detail.unrecovered.tasks.length} 项未恢复工作。强制关闭后这些任务保持暂停/改派，并作为尾欠挂到全局恢复台账，确认强制关闭？`)) return;
    const note = window.prompt('尾欠交接说明：', '强制关闭，未恢复工作移交下一班次跟进');
    if (note === null) return;
    await act(`/incidents/${detail.incident.id}/close`, { force: true, note });
  };
  const submitEvidence = async (event: FormEvent) => {
    event.preventDefault();
    await act(`/incidents/${selectedId}/evidence`, evidenceForm);
    setShowEvidence(false); setEvidenceForm({ kind: 'document', title: '', fileRef: '', note: '' });
  };
  const submitHandover = async (event: FormEvent) => {
    event.preventDefault();
    await act(`/incidents/${selectedId}/handover`, { fromCommander: detail?.incident.commander ?? '', ...handoverForm });
    setShowHandover(false); setHandoverForm({ toCommander: '', reason: '' });
  };

  return <div className="incident-console">
    <div className="incident-toolbar">
      <div><div className="eyebrow">INCIDENT COMMAND / 跨箱跨任务统一处置</div><h2>作业事件指挥台</h2></div>
      <div className="incident-toolbar-right">
        <span className="incident-count"><b className="critical">{active.length}</b> 处置中 · <b>{globalOpen.length}</b> 未恢复任务</span>
        <button className="primary-action" onClick={() => setCreating(value => !value)}>{creating ? '取消' : '＋ 创建事件'}</button>
      </div>
    </div>

    {globalOpen.length > 0 && <div className="unrecovered-banner">
      <strong>尚未恢复的工作（{globalOpen.length}）</strong>
      <div className="unrecovered-rows">
        {globalOpen.map(row => <button key={row.task.id} className="unrecovered-row" onClick={() => onSelect(row.incidents[0]?.id)}>
          <b>{row.task.id}</b><span>{row.task.containerId} · {row.task.from} → {row.task.to}</span>
          <em className={row.restoreFailed.length ? 'critical' : row.pendingReview ? 'warning' : ''}>
            {row.restoreFailed.length ? `恢复失败：${row.restoreFailed[0].lastFailureReason}` : row.pendingReview ? '等待人工复核' : '管控中'}
          </em>
          <small>{row.incidents.map(i => i.id + (i.closed ? '(已关闭尾欠)' : '')).join('、')}</small>
        </button>)}
      </div>
    </div>}

    <div className="incident-layout">
      <section className="panel incident-list-panel">
        {creating && <form className="incident-create" onSubmit={submitCreate}>
          <h3>创建作业事件</h3>
          <label>事件标题<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="例如：2 号岸桥起升机构故障停机" /></label>
          <div className="form-row">
            <label>类型<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as IncidentType })}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>严重度<select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value as Severity })}>{Object.entries(severityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <label>现场指挥人<input required value={form.commander} onChange={e => setForm({ ...form, commander: e.target.value })} placeholder="姓名 / 班组" /></label>
          <label>影响范围</label>
          <div className="scope-builder">
            <select value={form.scopeType} onChange={e => setForm({ ...form, scopeType: e.target.value as ScopeType, scopeRef: optionsFor(e.target.value as ScopeType)[0]?.value ?? '' })}>{Object.entries(scopeTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <select value={form.scopeRef} onChange={e => setForm({ ...form, scopeRef: e.target.value })}>{optionsFor(form.scopeType).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            <button type="button" onClick={addScope}>加入范围</button>
          </div>
          <div className="scope-chips">{form.scopeList.map(ref => <span key={scopeKey(ref)} className="scope-chip">{scopeTypeLabels[ref.type]} · {scopeLabel(ref)}<i onClick={() => setForm({ ...form, scopeList: form.scopeList.filter(item => scopeKey(item) !== scopeKey(ref)) })}>×</i></span>)}{form.scopeList.length === 0 && <small>至少选择一个航次 / 区块 / 设备 / 箱号 / 车道</small>}</div>
          <button className="primary-action" disabled={busy || form.scopeList.length === 0}>{busy ? '创建中…' : '建立事件并划定范围'}</button>
        </form>}

        <h3 className="list-heading">进行中（{active.length}）</h3>
        {active.map(item => <IncidentCard key={item.incident.id} item={item} selected={item.incident.id === selectedId} onSelect={onSelect} />)}
        {closed.length > 0 && <h3 className="list-heading">已关闭归档（{closed.length}）</h3>}
        {closed.map(item => <IncidentCard key={item.incident.id} item={item} selected={item.incident.id === selectedId} onSelect={onSelect} />)}
      </section>

      {!selectedId && <section className="panel incident-empty"><div className="eyebrow">NO INCIDENT SELECTED</div><h3>从左侧选择一个事件</h3><p>这里将展示事件的实际受影响对象（任务、箱、设备、预约）、临时规则的作用清单、逐条恢复复核以及处置时间线，而不是一段文字描述。</p></section>}

      {detail && selectedId === detail.incident.id && <section className="panel incident-detail-panel">
        <div className="detail-head">
          <div>
            <div className="eyebrow">{detail.incident.id} · {typeLabels[detail.incident.type]} · 指挥人 {detail.incident.commander}</div>
            <h2>{detail.incident.title}</h2>
            <p>建立于 {dateTime(detail.incident.createdAt)}{detail.incident.closedAt ? ` · 关闭于 ${dateTime(detail.incident.closedAt)}` : ''}</p>
          </div>
          <div className="detail-badges">
            <span className={`badge sev-${detail.incident.severity}`}>{severityLabels[detail.incident.severity]}</span>
            <span className={`badge phase-${detail.incident.phase}`}>{phaseLabels[detail.incident.phase] ?? detail.incident.phase}</span>
          </div>
        </div>

        <div className="command-actions">
          {detail.incident.status === 'active' ? <>
            <div className="phase-switch">
              <small>处置阶段</small>
              {(['detection', 'containment', 'response', 'recovery'] as const).map(phase => <button key={phase} disabled={busy || detail.incident.phase === phase} className={detail.incident.phase === phase ? 'active' : ''} onClick={() => registerPhase(phase)}>{phaseLabels[phase]}</button>)}
            </div>
            <button onClick={publishPause} disabled={busy}>⏸ 发布暂停规则</button>
            <button onClick={publishReassign} disabled={busy}>↗ 发布改派规则</button>
            <button onClick={() => setShowHandover(value => !value)} disabled={busy}>⇄ 指挥权交接</button>
            <button onClick={() => setShowEvidence(value => !value)} disabled={busy}>📎 登记证据</button>
            <button className="close-action" onClick={close} disabled={busy}>✓ 关闭事件</button>
            {detail.unrecovered.tasks.length > 0 && <button className="force-close-action" onClick={forceClose} disabled={busy}>强制关闭（{detail.unrecovered.tasks.length} 项尾欠）</button>}
          </> : <button onClick={() => setShowEvidence(value => !value)} disabled={busy}>📎 关闭后补录证据</button>}
        </div>

        {showHandover && <form className="inline-form" onSubmit={submitHandover}>
          <small>当前指挥人：{detail.incident.commander}（交班人须一致）</small>
          <div className="form-row"><label>接班指挥人<input required value={handoverForm.toCommander} onChange={e => setHandoverForm({ ...handoverForm, toCommander: e.target.value })} /></label>
          <label>交接事项<input value={handoverForm.reason} onChange={e => setHandoverForm({ ...handoverForm, reason: e.target.value })} placeholder="未恢复工作、注意事项" /></label></div>
          <div className="inline-actions"><button type="button" onClick={() => setShowHandover(false)}>取消</button><button className="primary-action" disabled={busy}>确认交接</button></div>
        </form>}
        {showEvidence && <form className="inline-form" onSubmit={submitEvidence}>
          <div className="form-row">
            <label>证据类型<select value={evidenceForm.kind} onChange={e => setEvidenceForm({ ...evidenceForm, kind: e.target.value })}>{[['photo', '现场照片'], ['document', '文书'], ['telemetry', '遥测数据'], ['statement', '口述记录'], ['customs-order', '海关文书'], ['other', '其他']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>标题<input required value={evidenceForm.title} onChange={e => setEvidenceForm({ ...evidenceForm, title: e.target.value })} /></label>
            <label>附件编号 / 链接<input value={evidenceForm.fileRef} onChange={e => setEvidenceForm({ ...evidenceForm, fileRef: e.target.value })} placeholder="可选" /></label>
          </div>
          <label>说明<input value={evidenceForm.note} onChange={e => setEvidenceForm({ ...evidenceForm, note: e.target.value })} /></label>
          <div className="inline-actions"><button type="button" onClick={() => setShowEvidence(false)}>取消</button><button className="primary-action" disabled={busy}>{detail.incident.status === 'closed' ? '补录证据' : '登记证据'}</button></div>
        </form>}

        {detail.carryOver && <div className="carryover-box"><strong>关闭尾欠（{detail.carryOver.items.length}）</strong><p>{detail.carryOver.note}</p><ul>{detail.carryOver.items.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}

        <div className="detail-grid">
          <div className="detail-block">
            <h4>影响范围（定义）</h4>
            <div className="scope-tags">
              {detail.scopeObjects.voyages.map(v => <span key={v.id} className="tag voyage-tag">航次 {v.id}</span>)}
              {detail.scopeObjects.blocks.map(b => <span key={b.id} className="tag block-tag">区块 {b.id}</span>)}
              {detail.scopeObjects.equipment.map(e => <span key={e.id} className="tag equip-tag">设备 {e.id}</span>)}
              {detail.scopeObjects.containers.map(c => <span key={c.id} className="tag container-tag">箱号 {c.id}<small>{c.yardSlot}</small></span>)}
              {detail.scopeObjects.gateLanes.map(lane => <span key={lane} className="tag lane-tag">车道 {laneLabels[lane]}</span>)}
            </div>
          </div>
          <div className="detail-block">
            <h4>实际受影响对象</h4>
            <ul className="affected-stats">
              <li><b>{detail.affected.tasks.length}</b><span>任务</span></li>
              <li><b>{detail.affected.relatedContainers.length}</b><span>集装箱</span></li>
              <li><b>{detail.affected.equipment.length}</b><span>设备</span></li>
              <li><b>{detail.affected.appointments.length}</b><span>闸口预约</span></li>
            </ul>
          </div>
        </div>

        <div className="detail-block">
          <h4>受影响任务（{detail.affected.tasks.length}）</h4>
          {detail.affected.tasks.length === 0 && <p className="empty-note">当前范围内没有进行中任务；规则发布后新建的同范围任务会被自动纳管。</p>}
          <div className="affected-table">
            {detail.affected.tasks.map(({ task, alsoCoveredBy, suspended }) => <div className="affected-row" key={task.id}>
              <span><b>{task.id}</b><small>{task.kind} · {task.containerId}</small></span>
              <span>{task.from} → {task.to}<small>{task.equipmentId ? `设备 ${task.equipmentId}` : '未指派'}</small></span>
              <span className={`pill ${task.status}`}>{task.status}</span>
              <span>{alsoCoveredBy.length > 0 ? <small className="overlap-text">同时被 {alsoCoveredBy.join('、')} 覆盖</small> : <small className="ok-text">唯一覆盖</small>}</span>
              <span>{suspended ? <small className="critical">已暂停</small> : <small>未被暂停</small>}</span>
            </div>)}
          </div>
        </div>

        {detail.unrecovered.tasks.length > 0 && <div className="detail-block open-work">
          <h4>尚未恢复的工作（{detail.unrecovered.tasks.length}）</h4>
          {detail.unrecovered.tasks.map(row => <div className="open-row" key={row.task.id}>
            <b>{row.task.id}</b><span>{row.task.containerId}</span>
            <div className="effect-states">{row.effects.map(effect => <span key={effect.id} className={`state-chip state-${effect.state}`}>{stateLabels[effect.state]}{effect.attempts > 1 ? ` ×${effect.attempts}` : ''}{effect.lastFailureReason ? `：${effect.lastFailureReason}` : ''}</span>)}</div>
            <small>{row.coveringIncidents.length > 1 ? `仍被 ${row.coveringIncidents.join('、')} 共同覆盖` : ''}</small>
          </div>)}
        </div>}

        <div className="detail-block">
          <h4>临时操作规则（{detail.rules.length}）</h4>
          {detail.rules.length === 0 && <p className="empty-note">尚未发布临时规则。暂停 / 改派规则发布后立即对范围内任务生效。</p>}
          {detail.rules.map(rule => {
            const pending = rule.effects.filter(e => e.state === 'review-pending' || e.state === 'restore-failed');
            return <div className={`rule-card ${rule.liftedAt ? 'lifted' : ''}`} key={rule.id}>
              <div className="rule-head">
                <b>{rule.action === 'pause-tasks' ? '⏸ 暂停任务' : `↗ 改派至 ${rule.fallbackEquipmentId}`}</b>
                <span className="rule-id">{rule.id}</span>
                <small>{rule.memo} · {rule.publishedBy} 发布于 {dateTime(rule.createdAt)}</small>
                <span className={`pill ${rule.liftedAt ? 'done' : rule.liftRequested ? 'booked' : 'assigned'}`}>{rule.liftedAt ? '已解除' : rule.liftRequested ? '解除待复核' : '执行中'}</span>
                {!rule.liftedAt && !rule.liftRequested && detail.incident.status === 'active' && <button onClick={() => requestLift(rule.id)} disabled={busy}>申请解除（逐条复核）</button>}
              </div>
              <div className="effect-list">
                {rule.effects.map(effect => <div className="effect-row" key={effect.id}>
                  <b>{effect.taskId}</b><small>{effect.containerId}{effect.task ? ` · ${effect.task.from} → ${effect.task.to}` : ''}</small>
                  <span className={`state-chip state-${effect.state}`}>{stateLabels[effect.state]}{effect.attempts > 1 ? `（第 ${effect.attempts} 次复核）` : ''}</span>
                  {effect.lastFailureReason && <small className="critical">{effect.lastFailureReason}</small>}
                  {(effect.state === 'review-pending' || effect.state === 'restore-failed') && <span className="effect-actions">
                    <button className="approve" onClick={() => review(rule.id, effect.id, 'approve')} disabled={busy}>复核通过并恢复</button>
                    {effect.state === 'review-pending' && <button className="reject" onClick={() => review(rule.id, effect.id, 'reject')} disabled={busy}>驳回</button>}
                  </span>}
                  {effect.state === 'rejected' && <small className="warning">已驳回：{effect.reviewNote}，规则继续生效</small>}
                </div>)}
                {rule.effects.length === 0 && <small className="empty-note">规则发布时范围内无进行中任务</small>}
                {pending.length > 0 && <small className="warning">还有 {pending.length} 项等待人工复核，全部通过前规则不会解除、事件不能关闭</small>}
              </div>
            </div>;
          })}
        </div>

        <div className="detail-grid two-col">
          <div className="detail-block">
            <h4>处置时间线</h4>
            <ul className="timeline">{detail.timeline.map((entry, index) => <li key={index} className={`tl-${entry.kind}`}><i/><div><b>{entry.title}</b><small>{dateTime(entry.at)}{entry.actor ? ` · ${entry.actor}` : ''}{entry.note ? ` · ${entry.note}` : ''}</small></div></li>)}</ul>
          </div>
          <div className="detail-block">
            <h4>通知记录（{detail.notices.length}）</h4>
            <ul className="notice-list">{detail.notices.slice(0, 8).map(notice => <li key={notice.id} className={notice.read ? 'read' : ''}><span className={`channel channel-${notice.channel}`}>{notice.channel}</span><div><b>{notice.title}</b><small>{notice.body}</small><small>{dateTime(notice.at)}</small></div></li>)}</ul>
            <h4>证据（{detail.evidences.length}）</h4>
            <ul className="evidence-list">{detail.evidences.map(evidence => <li key={evidence.id}><b>{evidence.afterClosure && <em className="warning">关闭后补录 · </em>}{evidence.title}</b><small>{evidence.kind} · {evidence.actor} · {dateTime(evidence.at)}</small></li>)}{detail.evidences.length === 0 && <li><small className="empty-note">暂无证据</small></li>}</ul>
          </div>
        </div>
      </section>}
    </div>
  </div>;
}

function IncidentCard({ item, selected, onSelect }: { item: IncidentSummary; selected: boolean; onSelect: (id: string) => void }) {
  const { incident } = item;
  return <button className={`incident-card ${selected ? 'selected' : ''}`} onClick={() => onSelect(incident.id)}>
    <div className="incident-card-top"><span className={`sev-dot sev-${incident.severity}`} /><b>{incident.title}</b>{incident.status === 'closed' && <span className="pill done">已关闭</span>}</div>
    <small>{incident.id} · {typeLabels[incident.type]} · {phaseLabels[incident.phase] ?? incident.phase}</small>
    <div className="incident-card-meta">
      <span><b>{item.affectedTasks}</b> 任务</span>
      <span><b className={item.pausedTasks ? 'critical' : ''}>{item.pausedTasks}</b> 暂停</span>
      <span><b className={item.pendingReview ? 'warning' : ''}>{item.pendingReview}</b> 待复核</span>
      <span><b className={item.restoreFailed ? 'critical' : ''}>{item.restoreFailed}</b> 恢复失败</span>
      <span><b className={item.unrecoveredTasks ? 'critical' : 'ok'}>{item.unrecoveredTasks}</b> 未恢复</span>
    </div>
    <small className="incident-scope">{incident.scope.map(ref => `${scopeTypeLabels[ref.type]}:${scopeLabel(ref)}`).join(' · ')}</small>
  </button>;
}
