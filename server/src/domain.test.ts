import test from 'node:test'; import assert from 'node:assert/strict'; import { containerPlan, dashboard, gateConflicts, prioritizeTasks } from './domain.js';
test('dashboard aggregates berth, yard, gate and exception signals', () => { const data = dashboard(); assert.equal(data.activeVoyages, 2); assert.ok(data.yardUtilization > 0.7); assert.ok(data.blockedTasks >= 1); });
test('gate conflict engine detects same truck overlap', () => { const conflicts = gateConflicts(); assert.ok(conflicts.some(item => item.appointmentId === 'APT-9001' || item.appointmentId === 'APT-9004')); });
test('yard planner respects reefer and hazmat constraints', () => { const plan = containerPlan('TGHU-9831204'); assert.equal(plan?.recommendedBlock?.hazmatAllowed, true); assert.ok(plan?.reasons.some(reason => reason.includes('危险品'))); });
test('priority queue promotes customs inspection work', () => { const tasks = prioritizeTasks(); assert.equal(tasks[0].containerId, 'TGHU-9831204'); });

test('container create, update and delete form a complete audited CRUD cycle', async () => {
  const { createContainer, updateContainer, deleteContainer, containers } = await import('./domain.js');
  const created = createContainer({ id: 'TEST-CRUD-0001', voyageId: 'VOY-AX7', size: '20', isoType: '22G1', direction: 'import', status: 'in-yard', weightT: 10, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R11-T1' });
  assert.equal(created.id, 'TEST-CRUD-0001');
  assert.equal(updateContainer(created.id, { weightT: 12 })?.weightT, 12);
  assert.equal(deleteContainer(created.id)?.id, 'TEST-CRUD-0001');
  assert.equal(containers.some(item => item.id === 'TEST-CRUD-0001'), false);
});

test('appointment and task domain operations support create, update and delete', async () => {
  const { createGateAppointment, editGateAppointment, deleteGateAppointment, createYardTask, updateYardTask, deleteYardTask } = await import('./domain.js');
  const appointment = createGateAppointment({ containerId: 'MSCU-4829017', truckNo: 'TEST-CRUD-01', driver: '测试司机', type: 'pickup', windowStart: new Date(Date.now()+3600000).toISOString(), windowEnd: new Date(Date.now()+7200000).toISOString(), lane: 'north' });
  assert.equal(editGateAppointment(appointment.id, { driver: '更新司机' })?.driver, '更新司机');
  assert.equal(deleteGateAppointment(appointment.id)?.id, appointment.id);
  const task = createYardTask({ kind: 'deliver', containerId: 'MSCU-4829017', from: 'A01-R01-T1', to: '南闸口', priority: 40, scheduledAt: new Date().toISOString(), estimatedMinutes: 12 });
  assert.equal(updateYardTask(task.id, { to: '北闸口' })?.to, '北闸口');
  assert.equal(deleteYardTask(task.id)?.id, task.id);
});

test('incident lifecycle: phases, pause rule, reviewed lift, close ordering and post-close evidence', async () => {
  const { createIncident, registerPhase, publishRule, liftRule, closeIncident, addEvidence, createYardTask, tasks } = await import('./domain.js');
  const task = createYardTask({ kind: 'deliver', containerId: 'FCIU-9920310', from: 'C03-R04-T2', to: '北闸口', priority: 50, scheduledAt: new Date().toISOString(), estimatedMinutes: 15 });
  const incident = createIncident({ title: '测试·闸口拥堵', kind: 'gate-congestion', severity: 'minor', commander: '测试指挥', scope: { voyageIds: [], blockIds: [], equipmentIds: [], containerIds: ['FCIU-9920310'] } });
  assert.ok(incident);
  assert.equal(incident.phase, 'detected');
  assert.throws(() => registerPhase(incident.id, { phase: 'detected', note: '重复登记' }), /只能向前推进/);
  assert.throws(() => createIncident({ title: 'x', kind: 'weather', severity: 'minor', commander: 'y', scope: { voyageIds: [], blockIds: [], equipmentIds: [], containerIds: [] } }), /影响范围/);
  registerPhase(incident.id, { phase: 'assessing', note: '评估完成' });
  const rule = publishRule(incident.id, { action: 'pause-tasks', note: '暂停提箱作业', createdBy: '测试指挥' });
  assert.ok(rule);
  assert.equal(tasks.find(item => item.id === task.id)?.status, 'blocked');
  assert.throws(() => closeIncident(incident.id, { summary: '提前关闭' }), /规则/);
  assert.throws(() => liftRule(incident.id, rule.id, { reviewer: '测试指挥' }), /独立复核/);
  const lifted = liftRule(incident.id, rule.id, { reviewer: '复核人', note: '现场确认可恢复' });
  assert.equal(lifted?.report[0]?.result, 'restored');
  assert.equal(tasks.find(item => item.id === task.id)?.status, 'queued');
  assert.throws(() => closeIncident(incident.id, { summary: '未到恢复阶段' }), /恢复阶段/);
  registerPhase(incident.id, { phase: 'mitigating', note: '分流车道' });
  registerPhase(incident.id, { phase: 'recovering', note: '拥堵缓解' });
  const closed = closeIncident(incident.id, { actor: '复核人', summary: '闸口恢复常态' });
  assert.equal(closed?.status, 'closed');
  const evidence = addEvidence(incident.id, { kind: 'photo', title: '车道恢复照片', addedBy: '复核人' });
  assert.equal(evidence?.postClose, true);
  assert.throws(() => publishRule(incident.id, { action: 'pause-tasks', note: '已关闭事件' }), /已关闭/);
});

test('overlapping incidents keep a task held until every rule is lifted', async () => {
  const { createIncident, publishRule, liftRule, createYardTask, tasks } = await import('./domain.js');
  const task = createYardTask({ kind: 'rehandle', containerId: 'CMAU-6001722', from: 'B07-R10-T1', to: 'B07-R11-T2', priority: 40, scheduledAt: new Date().toISOString(), estimatedMinutes: 20 });
  const a = createIncident({ title: '测试·事件A', kind: 'yard-safety', severity: 'major', commander: '指挥A', scope: { voyageIds: [], blockIds: [], equipmentIds: [], containerIds: ['CMAU-6001722'] } });
  const b = createIncident({ title: '测试·事件B', kind: 'customs-control', severity: 'major', commander: '指挥B', scope: { voyageIds: ['VOY-QF2'], blockIds: [], equipmentIds: [], containerIds: [] } });
  const ruleA = publishRule(a!.id, { action: 'pause-tasks', note: 'A 暂停' });
  const ruleB = publishRule(b!.id, { action: 'pause-tasks', note: 'B 暂停' });
  assert.equal(tasks.find(item => item.id === task.id)?.blockingReasons.length, 2);
  const liftA = liftRule(a!.id, ruleA!.id, { reviewer: '复核A' });
  assert.equal(liftA?.report.find(item => item.taskId === task.id)?.result, 'restored');
  assert.equal(tasks.find(item => item.id === task.id)?.status, 'blocked');
  assert.ok(tasks.find(item => item.id === task.id)?.blockingReasons.every(reason => !reason.startsWith(`[${a!.id}]`)));
  liftRule(b!.id, ruleB!.id, { reviewer: '复核B' });
  const restored = tasks.find(item => item.id === task.id);
  assert.equal(restored?.status, 'queued');
  assert.deepEqual(restored?.blockingReasons, []);
});

test('reassign rule retargets equipment, and restore failure can be retried after equipment recovers', async () => {
  const { createIncident, publishRule, liftRule, retryRestore, createContainer, createYardTask, updateEquipment, tasks } = await import('./domain.js');
  createContainer({ id: 'TEST-INC-0001', voyageId: 'VOY-QF2', size: '20', isoType: '22G1', direction: 'import', status: 'in-yard', weightT: 10, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R12-T1' });
  const task = createYardTask({ kind: 'deliver', containerId: 'TEST-INC-0001', from: 'C03-R12-T1', to: '北闸口', priority: 30, scheduledAt: new Date().toISOString(), estimatedMinutes: 10, equipmentId: 'YC-05' });
  const incident = createIncident({ title: '测试·设备故障', kind: 'equipment-failure', severity: 'major', commander: '指挥C', scope: { voyageIds: [], blockIds: [], equipmentIds: [], containerIds: ['TEST-INC-0001'] } });
  const rule = publishRule(incident!.id, { action: 'reassign-tasks', note: '改派至 TT-31', targetEquipmentId: 'TT-31', createdBy: '指挥C' });
  assert.equal(tasks.find(item => item.id === task.id)?.equipmentId, 'TT-31');
  assert.throws(() => publishRule(incident!.id, { action: 'reassign-tasks', note: '缺目标设备' }), /目标设备/);
  updateEquipment('YC-05', { status: 'maintenance' });
  const lifted = liftRule(incident!.id, rule!.id, { reviewer: '复核C' });
  assert.equal(lifted?.report[0]?.result, 'restore-failed');
  assert.equal(tasks.find(item => item.id === task.id)?.status, 'blocked');
  updateEquipment('YC-05', { status: 'available' });
  const retried = retryRestore(incident!.id, rule!.id, {});
  assert.equal(retried?.report[0]?.result, 'restored');
  const restored = tasks.find(item => item.id === task.id);
  assert.equal(restored?.status, 'assigned');
  assert.equal(restored?.equipmentId, 'YC-05');
  assert.deepEqual(restored?.blockingReasons, []);
});

test('handover validates successor and broadcast dedupes repeated notifications', async () => {
  const { createIncident, handoverIncident, broadcastIncident, incidentDetail } = await import('./domain.js');
  const incident = createIncident({ title: '测试·海关临时管制', kind: 'customs-control', severity: 'critical', commander: '甲', scope: { voyageIds: [], blockIds: ['D05'], equipmentIds: [], containerIds: [] } });
  assert.ok(incident);
  assert.throws(() => handoverIncident(incident.id, { to: '甲' }), /相同/);
  handoverIncident(incident.id, { to: '乙', note: '夜班交接' });
  assert.equal(incidentDetail(incident.id)?.commander, '乙');
  const first = broadcastIncident(incident.id, { message: '请确认现场警戒' });
  assert.ok(first!.sent > 0);
  assert.equal(first!.deduped, 0);
  const second = broadcastIncident(incident.id, { message: '请确认现场警戒' });
  assert.equal(second!.sent, 0);
  assert.ok(second!.deduped > 0);
});

test('seeded incidents expose affected objects and unrecovered work', async () => {
  const { incidentSummaries, incidentDetail } = await import('./domain.js');
  const summaries = incidentSummaries();
  assert.ok(summaries.some(item => item.status === 'active'));
  assert.ok(summaries.some(item => item.status === 'closed'));
  const closed = summaries.find(item => item.counts.restoreFailures > 0);
  assert.ok(closed);
  const detail = incidentDetail(closed.id);
  assert.ok(detail);
  assert.ok(detail.affected.tasks.length > 0);
  assert.ok(detail.unrecovered.some(item => item.state === 'restore-failed'));
  assert.ok(detail.evidence.some(item => item.postClose));
  const active = incidentDetail(summaries.find(item => item.status === 'active')!.id);
  assert.ok(active!.affected.tasks.some(task => task.holds.some(hold => hold.status === 'applied')));
});
