import { FormEvent, useCallback, useEffect, useState } from 'react';
import { request } from './api';

type Scope = { voyageIds: string[]; blockIds: string[]; equipmentIds: string[]; containerIds: string[] };
type IncidentSummary = {
  id: string; title: string; kind: string; severity: string; status: 'active' | 'closed'; phase: string; commander: string;
  openedAt: string; closedAt?: string; scope: Scope;
  counts: { rules: number; activeRules: number; heldTasks: number; restoreFailures: number; evidence: number };
  overlappingIncidents: string[];
};
type Hold = { impactId: string; incidentId: string; ruleId: string; action: string; status: string; restoreNote?: string };
type AffectedTask = { id: string; kind: string; containerId: string; from: string; to: string; equipmentId?: string; status: string; blockingReasons: string[]; holds: Hold[] };
type Impact = { id: string; ruleId: string; taskId: string; action: string; status: string; restoreNote?: string; appliedAt: string };
type Rule = { id: string; action: string; note: string; targetEquipmentId?: string; status: 'active' | 'lifted'; createdBy: string; createdAt: string; liftedBy?: string; liftedAt?: string; reviewNote?: string; impacts: Impact[] };
type ReportItem = { taskId: string; result: string; note?: string };
type IncidentDetail = IncidentSummary & {
  phases: { id: string; phase: string; note: string; actor: string; at: string }[];
  rules: Rule[];
  handovers: { id: string; from: string; to: string; note: string; actor: string; at: string }[];
  evidence: { id: string; kind: string; title: string; note: string; uri?: string; addedBy: string; at: string; postClose: boolean }[];
  notifications: { id: string; audience: string; topic: string; message: string; status: 'sent' | 'deduped'; at: string }[];
  closeSummary?: string;
  affected: {
    tasks: AffectedTask[];
    containers: { id: string; status: string; customs: string; yardSlot: string }[];
    appointments: { id: string; containerId: string; truckNo: string; status: string; windowStart: string }[];
    equipment: { id: string; name: string; status: string }[];
    voyages: { id: string; vessel: string }[];
    blocks: { id: string; zone: string }[];
  };
  unrecovered: { impactId: string; ruleId: string; ruleStatus: string; taskId: string; containerId?: string; taskStatus: string; state: 'held' | 'restore-failed'; restoreNote?: string }[];
  overlaps: { incidentId: string; title: string; shared: string[] }[];
};

const kindLabel: Record<string, string> = { 'equipment-failure': '设备故障', 'customs-control': '海关管制', 'gate-congestion': '闸口拥堵', 'yard-safety': '堆场安全', weather: '气象预警' };
const phaseLabel: Record<string, string> = { detected: '发现', assessing: '评估', mitigating: '处置', recovering: '恢复', closed: '关闭' };
const impactLabel: Record<string, string> = { applied: '持有中', restored: '已恢复', 'restore-failed': '恢复失败', superseded: '未生效' };
const phaseFlow = ['detected', 'assessing', 'mitigating', 'recovering', 'closed'];
const fmt = (value?: string) => value ? new Date(value).toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

const emptyCreate = { title: '', kind: 'equipment-failure', severity: 'major', commander: '', note: '', voyageIds: [] as string[], blockIds: [] as string[], equipmentIds: [] as string[], containerIds: [] as string[] };

export function IncidentsPanel({ voyages, blocks, equipment, containers, onDataChanged }: {
  voyages: { id: string; vessel: string }[];
  blocks: { id: string; zone: string }[];
  equipment: { id: string; name: string; status: string }[];
  containers: { id: string; status: string }[];
  onDataChanged: () => Promise<void> | void;
}) {
  const [summaries, setSummaries] = useState<IncidentSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [detail, setDetail] = useState<IncidentDetail>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [phaseNote, setPhaseNote] = useState('');
  const [phasePick, setPhasePick] = useState('');
  const [ruleForm, setRuleForm] = useState({ action: 'pause-tasks', note: '', targetEquipmentId: '' });
  const [liftDrafts, setLiftDrafts] = useState<Record<string, { reviewer: string; note: string }>>({});
  const [reports, setReports] = useState<Record<string, ReportItem[]>>({});
  const [handoverForm, setHandoverForm] = useState({ to: '', note: '' });
  const [evidenceForm, setEvidenceForm] = useState({ kind: 'photo', title: '', note: '' });
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastResult, setBroadcastResult] = useState('');
  const [closeSummary, setCloseSummary] = useState('');

  const loadList = useCallback(async () => {
    const list = await request<IncidentSummary[]>('/incidents');
    setSummaries(list);
    setSelectedId(current => current && list.some(item => item.id === current) ? current : list[0]?.id);
    return list;
  }, []);
  const loadDetail = useCallback(async (id: string) => setDetail(await request<IncidentDetail>(`/incidents/${id}`)), []);
  useEffect(() => { void loadList().catch(reason => setError(reason instanceof Error ? reason.message : '加载事件失败')); }, [loadList]);
  useEffect(() => { if (selectedId) void loadDetail(selectedId).catch(reason => setError(reason instanceof Error ? reason.message : '加载事件详情失败')); }, [selectedId, loadDetail]);

  const refresh = async () => { await loadList(); if (selectedId) await loadDetail(selectedId); await onDataChanged(); };
  const run = async (action: () => Promise<unknown>, ok: string) => {
    setBusy(true); setError(''); setNotice('');
    try { await action(); await refresh(); setNotice(ok); return true; }
    catch (reason) { setError(reason instanceof Error ? reason.message : '操作失败'); return false; }
    finally { setBusy(false); }
  };

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const created = await request<IncidentDetail>('/incidents', { method: 'POST', body: JSON.stringify(createForm) });
      setCreating(false); setCreateForm(emptyCreate);
      await loadList(); setSelectedId(created.id); await onDataChanged();
      setNotice(`事件 ${created.id} 已创建，影响范围已锁定`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : '创建事件失败'); }
    finally { setBusy(false); }
  };
  const toggleScope = (key: 'voyageIds' | 'blockIds' | 'equipmentIds' | 'containerIds', id: string) =>
    setCreateForm(form => ({ ...form, [key]: form[key].includes(id) ? form[key].filter(item => item !== id) : [...form[key], id] }));

  const phaseOptions = detail ? phaseFlow.filter(phase => phase !== 'closed' && phaseFlow.indexOf(phase) > phaseFlow.indexOf(detail.phase)) : [];
  const phaseValue = phaseOptions.includes(phasePick) ? phasePick : phaseOptions[0] ?? '';
  const submitPhase = (event: FormEvent) => { event.preventDefault(); if (!detail || !phaseValue) return; void run(() => request(`/incidents/${detail.id}/phases`, { method: 'POST', body: JSON.stringify({ phase: phaseValue, note: phaseNote }) }), '处置阶段已登记').then(ok => { if (ok) { setPhaseNote(''); setPhasePick(''); } }); };
  const submitRule = (event: FormEvent) => { event.preventDefault(); if (!detail) return; void run(() => request(`/incidents/${detail.id}/rules`, { method: 'POST', body: JSON.stringify({ action: ruleForm.action, note: ruleForm.note, ...(ruleForm.action === 'reassign-tasks' ? { targetEquipmentId: ruleForm.targetEquipmentId } : {}) }) }), '临时规则已发布并作用于受影响任务').then(ok => { if (ok) setRuleForm({ action: 'pause-tasks', note: '', targetEquipmentId: '' }); }); };
  const lift = (ruleId: string) => {
    if (!detail) return;
    const draft = liftDrafts[ruleId] ?? { reviewer: '', note: '' };
    setBusy(true); setError(''); setNotice('');
    void request<{ rule: Rule; report: ReportItem[] }>(`/incidents/${detail.id}/rules/${ruleId}/lift`, { method: 'POST', body: JSON.stringify(draft) })
      .then(result => { setReports(current => ({ ...current, [ruleId]: result.report })); return refresh(); })
      .then(() => setNotice('规则已解除，恢复报告已生成'))
      .catch(reason => setError(reason instanceof Error ? reason.message : '解除规则失败'))
      .finally(() => setBusy(false));
  };
  const retry = (ruleId: string) => {
    if (!detail) return;
    setBusy(true); setError(''); setNotice('');
    void request<{ rule: Rule; report: ReportItem[] }>(`/incidents/${detail.id}/rules/${ruleId}/restore-retry`, { method: 'POST', body: JSON.stringify({}) })
      .then(result => { setReports(current => ({ ...current, [ruleId]: result.report })); return refresh(); })
      .then(() => setNotice('恢复重试完成，结果见报告'))
      .catch(reason => setError(reason instanceof Error ? reason.message : '恢复重试失败'))
      .finally(() => setBusy(false));
  };
  const submitHandover = (event: FormEvent) => { event.preventDefault(); if (!detail) return; void run(() => request(`/incidents/${detail.id}/handover`, { method: 'POST', body: JSON.stringify(handoverForm) }), '处置人已交接').then(ok => { if (ok) setHandoverForm({ to: '', note: '' }); }); };
  const submitEvidence = (event: FormEvent) => { event.preventDefault(); if (!detail) return; void run(() => request(`/incidents/${detail.id}/evidence`, { method: 'POST', body: JSON.stringify(evidenceForm) }), detail.status === 'closed' ? '证据已补录（关闭后）' : '证据已登记').then(ok => { if (ok) setEvidenceForm({ kind: 'photo', title: '', note: '' }); }); };
  const submitBroadcast = (event: FormEvent) => {
    event.preventDefault(); if (!detail || !broadcastMessage.trim()) return;
    setBusy(true); setError('');
    void request<{ sent: number; deduped: number }>(`/incidents/${detail.id}/notify`, { method: 'POST', body: JSON.stringify({ message: broadcastMessage }) })
      .then(result => { setBroadcastResult(`发送 ${result.sent} 个对象 · 去重拦截 ${result.deduped} 条`); return refresh(); })
      .catch(reason => setError(reason instanceof Error ? reason.message : '发送通知失败'))
      .finally(() => setBusy(false));
  };
  const activeRuleCount = detail?.rules.filter(rule => rule.status === 'active').length ?? 0;
  const closeBlockers = [
    ...(activeRuleCount ? [`尚有 ${activeRuleCount} 条临时规则未解除，需先经人工复核解除`] : []),
    ...(detail && detail.phase !== 'recovering' ? ['事件需推进到「恢复」阶段后才能关闭'] : [])
  ];
  const submitClose = (event: FormEvent) => { event.preventDefault(); if (!detail || closeBlockers.length) return; void run(() => request(`/incidents/${detail.id}/close`, { method: 'POST', body: JSON.stringify({ summary: closeSummary }) }), '事件已关闭').then(ok => { if (ok) setCloseSummary(''); }); };

  const activeCount = summaries.filter(item => item.status === 'active').length;
  const heldCount = summaries.reduce((sum, item) => sum + item.counts.heldTasks, 0);
  const failedCount = summaries.reduce((sum, item) => sum + item.counts.restoreFailures, 0);

  return <div>
    <section className="kpis incident-kpis">
      <div><small>ACTIVE INCIDENTS</small><b>{activeCount}<em> 起</em></b><span>跨箱 / 跨任务统一指挥</span></div>
      <div><small>HELD TASKS</small><b>{heldCount}<em> 项</em></b><span>被事件规则暂停或改派</span></div>
      <div><small>RESTORE FAILURES</small><b>{failedCount}<em> 项</em></b><span>解除后仍未恢复的工作</span></div>
      <div><small>CLOSED</small><b>{summaries.length - activeCount}<em> 起</em></b><span>证据可关闭后补录</span></div>
    </section>
    {notice && <div className="toast" onClick={() => setNotice('')}>{notice} ×</div>}
    {error && <div className="form-error page-error">{error}<button onClick={() => setError('')}>关闭</button></div>}
    <div className="incident-layout">
      <div>
        <button className="primary-action create-incident" onClick={() => { setError(''); setCreating(true); }}>＋ 创建作业事件</button>
        <div className="incident-list">
          {summaries.map(item => <button key={item.id} className={`incident-card ${selectedId === item.id ? 'selected' : ''} ${item.status}`} onClick={() => setSelectedId(item.id)}>
            <div className="card-top"><b>{item.id} · {item.title}</b><span className={`sev ${item.severity}`}>{item.severity}</span></div>
            <small>{kindLabel[item.kind]} · {phaseLabel[item.phase]} · 处置人 {item.commander}</small>
            <small>{fmt(item.openedAt)}{item.closedAt ? ` → ${fmt(item.closedAt)}` : ''}</small>
            <div className="incident-meta">
              {item.counts.activeRules > 0 && <span className="chip">{item.counts.activeRules} 条规则生效</span>}
              {item.counts.heldTasks > 0 && <span className="chip">{item.counts.heldTasks} 任务被持有</span>}
              {item.counts.restoreFailures > 0 && <span className="chip block-chip">{item.counts.restoreFailures} 恢复失败</span>}
              {item.overlappingIncidents.length > 0 && <span className="chip block-chip">与 {item.overlappingIncidents.join('、')} 重叠</span>}
            </div>
          </button>)}
          {summaries.length === 0 && <div className="incident-card">暂无事件，点击上方按钮创建第一起作业事件。</div>}
        </div>
      </div>
      {!detail && <section className="panel"><p className="muted">正在加载事件详情…</p></section>}
      {detail && <section className="panel incident-detail">
        <div className="panel-head">
          <div>
            <div className="eyebrow">INCIDENT / {detail.id} · {kindLabel[detail.kind]}</div>
            <h2>{detail.title}</h2>
            <span className="muted">处置人 {detail.commander} · 开启 {fmt(detail.openedAt)}{detail.closedAt ? ` · 关闭 ${fmt(detail.closedAt)}` : ''}</span>
          </div>
          <span className={`badge ${detail.status === 'active' ? 'medium' : 'low'}`}>{detail.status === 'active' ? '进行中' : '已关闭'}</span>
        </div>
        <div className="phase-stepper">
          {phaseFlow.map(phase => {
            const reached = phaseFlow.indexOf(phase) <= phaseFlow.indexOf(detail.phase);
            return <div key={phase} className={`phase-step ${reached ? 'done' : ''} ${phase === detail.phase ? 'current' : ''}`}>{phaseLabel[phase]}</div>;
          })}
        </div>
        <div className="chip-row">
          {detail.scope.voyageIds.map(id => <span className="chip" key={id}>航次 {id}</span>)}
          {detail.scope.blockIds.map(id => <span className="chip" key={id}>区块 {id}</span>)}
          {detail.scope.equipmentIds.map(id => <span className="chip" key={id}>设备 {id}</span>)}
          {detail.scope.containerIds.map(id => <span className="chip" key={id}>箱 {id}</span>)}
        </div>
        {detail.overlaps.length > 0 && <div className="overlap-banner">影响范围与 {detail.overlaps.map(item => `${item.incidentId}（共享：${item.shared.join('、')}）`).join('；')} 重叠。共享任务须全部相关事件的规则解除后才会真正恢复。</div>}
        {detail.unrecovered.length > 0 && <div className="unrecovered">
          <h4>尚未恢复的工作 · {detail.unrecovered.length}</h4>
          {detail.unrecovered.map(item => <div className="item" key={item.impactId}>
            <span><b>{item.taskId}</b>{item.containerId ? ` · ${item.containerId}` : ''} · {item.state === 'held' ? `规则持有中（任务状态 ${item.taskStatus}）` : '恢复失败'}{item.restoreNote ? ` · ${item.restoreNote}` : ''}</span>
            {item.state === 'restore-failed' && <button disabled={busy} onClick={() => retry(item.ruleId)}>重试恢复</button>}
          </div>)}
        </div>}
        <div className="subsection"><h4>实际受影响对象</h4>
          <div className="affected-grid">
            <div>
              <div className="eyebrow">TASKS / {detail.affected.tasks.length}</div>
              <div className="mini-table">
                {detail.affected.tasks.map(task => <div className="row" key={task.id}>
                  <span><b>{task.id}</b> {task.kind} · {task.containerId}<small>{task.from} → {task.to}{task.equipmentId ? ` · ${task.equipmentId}` : ''}</small>
                    <span>{task.holds.map(hold => <span key={hold.impactId} className={`hold-badge ${hold.status}`} title={hold.restoreNote ?? ''}>{hold.incidentId}·{hold.action === 'paused' ? '暂停' : '改派'}·{impactLabel[hold.status] ?? hold.status}</span>)}</span>
                  </span>
                  <span className={`pill ${task.status}`}>{task.status}</span>
                </div>)}
                {detail.affected.tasks.length === 0 && <div className="row">范围内暂无作业任务</div>}
              </div>
            </div>
            <div>
              <div className="eyebrow">CONTAINERS / {detail.affected.containers.length}</div>
              <div className="mini-table">
                {detail.affected.containers.map(item => <div className="row" key={item.id}><span><b>{item.id}</b><small>{item.yardSlot} · 海关 {item.customs}</small></span><span className={`pill ${item.status === 'hold' ? 'blocked' : 'assigned'}`}>{item.status}</span></div>)}
                {detail.affected.containers.length === 0 && <div className="row">范围内暂无集装箱</div>}
              </div>
              {detail.affected.appointments.length > 0 && <div className="eyebrow sub-eyebrow">APPOINTMENTS / {detail.affected.appointments.length}</div>}
              <div className="mini-table">
                {detail.affected.appointments.map(item => <div className="row" key={item.id}><span><b>{item.id}</b><small>{item.containerId} · {item.truckNo}</small></span><span className={`pill ${item.status}`}>{item.status}</span></div>)}
              </div>
              {detail.affected.equipment.length > 0 && <div className="eyebrow sub-eyebrow">EQUIPMENT / {detail.affected.equipment.length}</div>}
              <div className="mini-table">
                {detail.affected.equipment.map(item => <div className="row" key={item.id}><span><b>{item.name}</b></span><span className={`pill ${item.status === 'available' ? 'done' : item.status === 'working' ? 'assigned' : 'blocked'}`}>{item.status}</span></div>)}
              </div>
            </div>
          </div>
        </div>
        <div className="subsection"><h4>临时操作规则 · {detail.rules.length}</h4>
          {detail.rules.map(rule => {
            const draft = liftDrafts[rule.id] ?? { reviewer: '', note: '' };
            const failedCount = rule.impacts.filter(im => im.status === 'restore-failed').length;
            return <div className={`rule-card ${rule.status}`} key={rule.id}>
              <div className="card-top"><b>{rule.id} · {rule.action === 'pause-tasks' ? '暂停受影响任务' : `改派受影响任务 → ${rule.targetEquipmentId}`}</b><span className={`pill ${rule.status === 'active' ? 'blocked' : 'done'}`}>{rule.status === 'active' ? '生效中' : '已解除'}</span></div>
              <p className="rule-note">{rule.note}</p>
              <small>发布人 {rule.createdBy} · {fmt(rule.createdAt)}{rule.liftedAt ? ` · 复核解除 ${rule.liftedBy} · ${fmt(rule.liftedAt)}` : ''}{rule.reviewNote ? ` · ${rule.reviewNote}` : ''}</small>
              <div className="chip-row">
                <span className="chip">持有 {rule.impacts.filter(im => im.status === 'applied').length}</span>
                <span className="chip">已恢复 {rule.impacts.filter(im => im.status === 'restored').length}</span>
                <span className={`chip ${failedCount ? 'block-chip' : ''}`}>恢复失败 {failedCount}</span>
                <span className="chip">未生效 {rule.impacts.filter(im => im.status === 'superseded').length}</span>
              </div>
              {rule.status === 'active' && detail.status === 'active' && <div className="inline-form">
                <input placeholder="复核人（须与发布人不同）" value={draft.reviewer} onChange={event => setLiftDrafts(current => ({ ...current, [rule.id]: { ...draft, reviewer: event.target.value } }))} />
                <input placeholder="复核意见" value={draft.note} onChange={event => setLiftDrafts(current => ({ ...current, [rule.id]: { ...draft, note: event.target.value } }))} />
                <button className="primary-action" disabled={busy} onClick={() => lift(rule.id)}>人工复核并解除</button>
              </div>}
              {rule.status === 'lifted' && failedCount > 0 && <div className="inline-form">
                <button disabled={busy} onClick={() => retry(rule.id)}>重试恢复失败项（{failedCount}）</button>
                <small className="muted">设备恢复可用或现场确认后，可在此重试；已关闭事件同样适用。</small>
              </div>}
              {reports[rule.id] && <div>{reports[rule.id].map((item, index) => <div key={`${item.taskId}-${index}`} className={`report-line ${item.result === 'restored' ? 'ok' : item.result === 'restore-failed' ? 'fail' : ''}`}>{item.taskId} → {impactLabel[item.result] ?? item.result}{item.note ? ` · ${item.note}` : ''}</div>)}</div>}
            </div>;
          })}
          {detail.status === 'active' && <form className="inline-form" onSubmit={submitRule}>
            <select value={ruleForm.action} onChange={event => setRuleForm(form => ({ ...form, action: event.target.value }))}>
              <option value="pause-tasks">暂停受影响任务</option>
              <option value="reassign-tasks">改派受影响任务</option>
            </select>
            {ruleForm.action === 'reassign-tasks' && <select required value={ruleForm.targetEquipmentId} onChange={event => setRuleForm(form => ({ ...form, targetEquipmentId: event.target.value }))}>
              <option value="">选择目标设备</option>
              {equipment.map(item => <option key={item.id} value={item.id}>{item.name} · {item.status}</option>)}
            </select>}
            <input required placeholder="规则说明（如：暂停 YC-12 全部作业）" value={ruleForm.note} onChange={event => setRuleForm(form => ({ ...form, note: event.target.value }))} />
            <button className="primary-action" disabled={busy}>发布规则</button>
          </form>}
        </div>
        <div className="subsection"><h4>处置阶段</h4>
          <div className="timeline">
            {detail.phases.slice().reverse().map(entry => <div className="timeline-item" key={entry.id}><b>{phaseLabel[entry.phase]}</b><span>{entry.note}</span><small>{entry.actor} · {fmt(entry.at)}</small></div>)}
          </div>
          {detail.status === 'active' && phaseOptions.length > 0 && <form className="inline-form" onSubmit={submitPhase}>
            <select value={phaseValue} onChange={event => setPhasePick(event.target.value)}>
              {phaseOptions.map(phase => <option key={phase} value={phase}>{phaseLabel[phase]}</option>)}
            </select>
            <input required placeholder="阶段说明" value={phaseNote} onChange={event => setPhaseNote(event.target.value)} />
            <button disabled={busy}>登记阶段</button>
          </form>}
        </div>
        <div className="subsection"><h4>处置人交接</h4>
          <div className="timeline">
            {detail.handovers.slice().reverse().map(entry => <div className="timeline-item" key={entry.id}><b>{entry.from} → {entry.to}</b><span>{entry.note}</span><small>{fmt(entry.at)}</small></div>)}
            {detail.handovers.length === 0 && <div className="timeline-item"><span className="muted">尚未发生交接，当前处置人 {detail.commander}</span></div>}
          </div>
          {detail.status === 'active' && <form className="inline-form" onSubmit={submitHandover}>
            <input required placeholder={`接任人（当前：${detail.commander}）`} value={handoverForm.to} onChange={event => setHandoverForm(form => ({ ...form, to: event.target.value }))} />
            <input placeholder="交接说明" value={handoverForm.note} onChange={event => setHandoverForm(form => ({ ...form, note: event.target.value }))} />
            <button disabled={busy}>交接</button>
          </form>}
        </div>
        <div className="subsection"><h4>证据与记录 · {detail.evidence.length}</h4>
          <div className="timeline">
            {detail.evidence.slice().reverse().map(item => <div className="timeline-item" key={item.id}><b>{item.title}</b><span>{item.note}</span>{item.postClose && <span className="chip block-chip">关闭后补录</span>}<small>{item.addedBy} · {fmt(item.at)}</small></div>)}
            {detail.evidence.length === 0 && <div className="timeline-item"><span className="muted">暂无证据记录</span></div>}
          </div>
          <form className="inline-form" onSubmit={submitEvidence}>
            <select value={evidenceForm.kind} onChange={event => setEvidenceForm(form => ({ ...form, kind: event.target.value }))}>
              <option value="photo">照片</option><option value="log">日志</option><option value="telemetry">遥测</option><option value="statement">口头记录</option><option value="work-order">工单</option><option value="other">其他</option>
            </select>
            <input required placeholder="证据标题" value={evidenceForm.title} onChange={event => setEvidenceForm(form => ({ ...form, title: event.target.value }))} />
            <input placeholder="说明" value={evidenceForm.note} onChange={event => setEvidenceForm(form => ({ ...form, note: event.target.value }))} />
            <button disabled={busy}>{detail.status === 'closed' ? '补录证据' : '登记证据'}</button>
          </form>
          {detail.status === 'closed' && <small className="muted">事件已关闭，补录证据将标记为「关闭后补录」并写入审计。</small>}
        </div>
        <div className="subsection"><h4>通知记录 · {detail.notifications.length}</h4>
          <div className="notify-log">
            {detail.notifications.slice(0, 12).map(item => <div className="notify-item" key={item.id}><span className={item.status}>{item.status === 'sent' ? '已发送' : '已去重'}</span><b>{item.audience}</b><span>{item.message}</span></div>)}
            {detail.notifications.length === 0 && <div className="notify-item"><span className="muted">暂无通知</span></div>}
          </div>
          <form className="inline-form" onSubmit={submitBroadcast}>
            <input placeholder="人工广播（相同内容重复发送将被自动去重）" value={broadcastMessage} onChange={event => setBroadcastMessage(event.target.value)} />
            <button disabled={busy}>发送通知</button>
          </form>
          {broadcastResult && <small className="muted">{broadcastResult}</small>}
        </div>
        {detail.status === 'active' && <div className="subsection"><h4>关闭事件</h4>
          {closeBlockers.length > 0 && <div className="overlap-banner">{closeBlockers.join('；')}</div>}
          <form className="inline-form" onSubmit={submitClose}>
            <input required placeholder="关闭总结" value={closeSummary} onChange={event => setCloseSummary(event.target.value)} />
            <button className="danger-action" disabled={busy || closeBlockers.length > 0}>关闭事件</button>
          </form>
        </div>}
        {detail.status === 'closed' && detail.closeSummary && <div className="callout"><strong>关闭总结</strong><span>{detail.closeSummary}</span></div>}
      </section>}
    </div>
    {creating && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setCreating(false); }}>
      <form className="editor-modal" onSubmit={submitCreate}>
        <div className="modal-head"><div><div className="eyebrow">CREATE / INCIDENT</div><h2>创建作业事件</h2></div><button type="button" className="icon-button" onClick={() => setCreating(false)}>×</button></div>
        <div className="form-grid">
          <label>事件标题<input required placeholder="如：YC-12 场桥变频器故障" value={createForm.title} onChange={event => setCreateForm(form => ({ ...form, title: event.target.value }))} /></label>
          <label>处置人<input required placeholder="值班指挥姓名" value={createForm.commander} onChange={event => setCreateForm(form => ({ ...form, commander: event.target.value }))} /></label>
          <label>事件类型<select value={createForm.kind} onChange={event => setCreateForm(form => ({ ...form, kind: event.target.value }))}>{Object.entries(kindLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>严重级别<select value={createForm.severity} onChange={event => setCreateForm(form => ({ ...form, severity: event.target.value }))}><option value="critical">严重</option><option value="major">较大</option><option value="minor">一般</option></select></label>
          <label className="wide-label">事件说明<input placeholder="现场情况简述" value={createForm.note} onChange={event => setCreateForm(form => ({ ...form, note: event.target.value }))} /></label>
        </div>
        <div className="scope-picker">
          <div><div className="eyebrow">关联航次</div><div className="chip-row">{voyages.map(item => <button type="button" key={item.id} className={`chip pick ${createForm.voyageIds.includes(item.id) ? 'chip-on' : ''}`} onClick={() => toggleScope('voyageIds', item.id)}>{item.id} · {item.vessel}</button>)}</div></div>
          <div><div className="eyebrow">关联区块</div><div className="chip-row">{blocks.map(item => <button type="button" key={item.id} className={`chip pick ${createForm.blockIds.includes(item.id) ? 'chip-on' : ''}`} onClick={() => toggleScope('blockIds', item.id)}>{item.id} · {item.zone}</button>)}</div></div>
          <div><div className="eyebrow">关联设备</div><div className="chip-row">{equipment.map(item => <button type="button" key={item.id} className={`chip pick ${createForm.equipmentIds.includes(item.id) ? 'chip-on' : ''}`} onClick={() => toggleScope('equipmentIds', item.id)}>{item.name}</button>)}</div></div>
          <div><div className="eyebrow">关联箱号</div><div className="chip-row">{containers.map(item => <button type="button" key={item.id} className={`chip pick ${createForm.containerIds.includes(item.id) ? 'chip-on' : ''}`} onClick={() => toggleScope('containerIds', item.id)}>{item.id}</button>)}</div></div>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions"><button type="button" onClick={() => setCreating(false)}>取消</button><button className="primary-action" disabled={busy}>{busy ? '创建中…' : '创建事件'}</button></div>
      </form>
    </div>}
  </div>;
}
