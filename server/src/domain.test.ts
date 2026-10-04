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

// ───────────────────────────── 作业事件指挥台 ─────────────────────────────

test('incident rule pauses in-scope tasks and resolves actual affected objects', async () => {
  const { createIncident, publishRule, incidentDetail, tasks } = await import('./domain.js');
  const incident = createIncident({ title: '测试-设备停机', type: 'equipment-fault', severity: 'major', scope: [{ type: 'equipment', ref: 'QC-07' }], commander: '测试指挥' }, '测试');
  publishRule(incident.id, { action: 'pause-tasks', memo: 'QC-07 停机' }, '测试');
  const detail = incidentDetail(incident.id)!;
  assert.equal(detail.affected!.equipment.some((item: { id: string }) => item.id === 'QC-07'), true);
  assert.equal(detail.rules[0].effects.length, 0, 'QC-07 当前无任务，规则作用为空，而不是凭空描述');
  const task = tasks.find(t => t.id === 'TASK-104');
  assert.equal(task?.status, 'queued');
});

test('overlapping incidents stay in force until every covering rule is reviewed and restored', async () => {
  const domain = await import('./domain.js');
  const { createIncident, publishRule, requestRuleLift, reviewRuleEffect, incidentDetail, createContainer, createYardTask, deleteContainer, deleteYardTask } = domain;
  const container = createContainer({ id: 'TEST-INC-OVL01', voyageId: 'VOY-QF2', size: '20', isoType: '22G1', direction: 'export', status: 'in-yard', weightT: 10, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R09-T1' });
  const task = createYardTask({ kind: 'deliver', containerId: container.id, from: 'C03-R09-T1', to: '南闸口', equipmentId: 'YC-05', priority: 60, scheduledAt: new Date().toISOString(), estimatedMinutes: 15 });
  const incA = createIncident({ title: '测试-闸口拥堵', type: 'gate-congestion', severity: 'major', scope: [{ type: 'gate-lane', ref: 'south' }], commander: '指挥A' }, '指挥A');
  const incB = createIncident({ title: '测试-设备故障叠加', type: 'equipment-fault', severity: 'critical', scope: [{ type: 'equipment', ref: 'YC-05' }], commander: '指挥B' }, '指挥B');
  const ruleA = publishRule(incA.id, { action: 'pause-tasks', memo: '南闸拥堵暂停' }, '指挥A').rule;
  const ruleB = publishRule(incB.id, { action: 'pause-tasks', memo: 'YC-05 故障暂停' }, '指挥B').rule;
  assert.equal(task.status, 'blocked');
  const detailA = incidentDetail(incA.id)!;
  const entryA: any = detailA.affected!.tasks.find((t: any) => t.task.id === task.id);
  assert.deepEqual(entryA.alsoCoveredBy, [incB.id], '控制台可见同一任务还被另一事件覆盖');

  const liftA = requestRuleLift(ruleA.id, '指挥A');
  const effectA = liftA.reviewQueue.find(e => e.taskId === task.id)!;
  reviewRuleEffect(ruleA.id, effectA.id, 'approve', '闸口疏通', '指挥A');
  assert.equal(task.status, 'blocked', '事件A解除但事件B仍覆盖，任务必须保持暂停');
  assert.equal(task.equipmentId, 'YC-05');
  // 事件A的南闸口范围还命中种子任务，复核剩余作用，避免规则残留影响后续测试
  for (const effect of liftA.reviewQueue.filter(e => e.taskId !== task.id)) reviewRuleEffect(ruleA.id, effect.id, 'approve', '闸口疏通', '指挥A');

  const liftB = requestRuleLift(ruleB.id, '指挥B');
  const effectB = liftB.reviewQueue.find(e => e.taskId === task.id)!;
  reviewRuleEffect(ruleB.id, effectB.id, 'approve', '设备修复', '指挥B');
  assert.equal(task.status, 'assigned', '最后一个覆盖事件恢复后，任务回到事件前基线');
  assert.equal(incidentDetail(incA.id)!.unrecovered.tasks.length, 0);
  // 事件B的设备范围还命中种子任务 TASK-104，同样复核恢复，彻底清理规则
  for (const effect of liftB.reviewQueue.filter(e => e.taskId !== task.id)) reviewRuleEffect(ruleB.id, effect.id, 'approve', '设备修复', '指挥B');
  deleteYardTask(task.id); deleteContainer(container.id);
});

test('incident close is blocked until recovery review completes, and force close carries over open work', async () => {
  const domain = await import('./domain.js');
  const { createIncident, publishRule, requestRuleLift, closeIncident, incidentDetail, unrecoveredWork, createContainer, createYardTask, deleteContainer, deleteYardTask } = domain;
  const container = createContainer({ id: 'TEST-INC-CL01', voyageId: 'VOY-QF2', size: '20', isoType: '22G1', direction: 'export', status: 'in-yard', weightT: 10, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R08-T2' });
  const task = createYardTask({ kind: 'deliver', containerId: container.id, from: 'C03-R08-T2', to: '北闸口', equipmentId: 'YC-05', priority: 55, scheduledAt: new Date().toISOString(), estimatedMinutes: 15 });
  const inc = createIncident({ title: '测试-关闭顺序', type: 'yard-safety', severity: 'major', scope: [{ type: 'container', ref: container.id }], commander: '指挥C' }, '指挥C');
  const rule = publishRule(inc.id, { action: 'pause-tasks', memo: '箱级暂停' }, '指挥C').rule;
  requestRuleLift(rule.id, '指挥C');
  assert.throws(() => closeIncident(inc.id), /尚不能关闭/, '待复核未处理时禁止关闭');
  const closed = closeIncident(inc.id, { force: true, note: '跨班次强制关闭' }, '指挥C');
  assert.equal(closed?.status, 'closed');
  assert.ok(closed?.carryOver?.items.some(item => item.includes(task.id)), '尾欠清单包含未恢复任务');
  assert.equal(task.status, 'blocked', '强制关闭不自动恢复，尾欠任务保持暂停');
  const open = unrecoveredWork().find((w: any) => w.task.id === task.id);
  assert.ok(open, '全局未恢复工作台账仍能查到该任务');
  assert.equal(open.carriedOverFromClosed.includes(inc.id), true);
  deleteYardTask(task.id); deleteContainer(container.id);
});

test('failed recovery stays on the recovery board and can be retried after equipment returns', async () => {
  const domain = await import('./domain.js');
  const { createIncident, publishRule, requestRuleLift, reviewRuleEffect, equipment, createContainer, createYardTask, deleteContainer, deleteYardTask, updateYardTask } = domain;
  const container = createContainer({ id: 'TEST-INC-RF01', voyageId: 'VOY-QF2', size: '20', isoType: '22G1', direction: 'export', status: 'in-yard', weightT: 10, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R07-T1' });
  const tt = equipment.find(e => e.id === 'TT-31')!;
  const task = createYardTask({ kind: 'deliver', containerId: container.id, from: 'C03-R07-T1', to: '南闸口', equipmentId: 'TT-31', priority: 50, scheduledAt: new Date().toISOString(), estimatedMinutes: 12 });
  const inc = createIncident({ title: '测试-恢复失败', type: 'equipment-fault', severity: 'major', scope: [{ type: 'container', ref: container.id }], commander: '指挥D' }, '指挥D');
  const rule = publishRule(inc.id, { action: 'pause-tasks', memo: '暂停待修' }, '指挥D').rule;
  tt.status = 'maintenance';
  const lift = requestRuleLift(rule.id, '指挥D');
  const effect = lift.reviewQueue.find(e => e.taskId === task.id)!;
  const reviewed = reviewRuleEffect(rule.id, effect.id, 'approve', '现场已疏通', '指挥D');
  assert.equal(reviewed.state, 'restore-failed');
  assert.match(reviewed.lastFailureReason ?? '', /维护/);
  assert.equal(task.status, 'blocked', '恢复失败时任务不得回到基线');
  const retried = reviewRuleEffect(rule.id, effect.id, 'approve', '设备已复位', '指挥D');
  assert.equal(retried.state, 'restore-failed', '设备仍维护，重试依然失败');
  tt.status = 'working';
  const retried2 = reviewRuleEffect(rule.id, effect.id, 'approve', '设备恢复运行', '指挥D');
  assert.equal(retried2.state, 'restored');
  assert.equal(task.status, 'assigned');
  assert.equal(task.equipmentId, 'TT-31');
  deleteYardTask(task.id); deleteContainer(container.id);
  void updateYardTask;
});

test('reassign rule moves tasks to fallback equipment and restores original assignment after review', async () => {
  const domain = await import('./domain.js');
  const { createIncident, publishRule, requestRuleLift, reviewRuleEffect, createContainer, createYardTask, deleteContainer, deleteYardTask } = domain;
  const container = createContainer({ id: 'TEST-INC-RA01', voyageId: 'VOY-QF2', size: '20', isoType: '22G1', direction: 'export', status: 'in-yard', weightT: 10, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R06-T2' });
  const task = createYardTask({ kind: 'deliver', containerId: container.id, from: 'C03-R06-T2', to: '铁路闸口', equipmentId: 'TT-31', priority: 70, scheduledAt: new Date().toISOString(), estimatedMinutes: 18 });
  const inc = createIncident({ title: '测试-改派', type: 'equipment-fault', severity: 'minor', scope: [{ type: 'container', ref: container.id }], commander: '指挥E' }, '指挥E');
  assert.throws(() => publishRule(inc.id, { action: 'reassign-tasks', memo: '改派' }, '指挥E'), /接替设备/, '改派规则不指定接替设备必须报错');
  const rule = publishRule(inc.id, { action: 'reassign-tasks', fallbackEquipmentId: 'YC-05', memo: '集卡不足，改派 YC-05 吊装' }, '指挥E').rule;
  assert.equal(task.equipmentId, 'YC-05');
  assert.ok(task.blockingReasons.some(r => r.includes('RUL-')));
  assert.throws(() => { domain.assignTask(task.id, 'RS-02'); }, /管控/, '管控期间任务不能被直接改派');
  const lift = requestRuleLift(rule.id, '指挥E');
  const effect = lift.reviewQueue.find(e => e.taskId === task.id)!;
  reviewRuleEffect(rule.id, effect.id, 'approve', '恢复原派工', '指挥E');
  assert.equal(task.equipmentId, 'TT-31', '复核后恢复原设备');
  deleteYardTask(task.id); deleteContainer(container.id);
});

test('commander handover is validated and audited, and duplicate notifications are suppressed', async () => {
  const domain = await import('./domain.js');
  const { createIncident, handoverCommander, publishRule, requestRuleLift, incidentDetail, notices, registerPhase } = domain;
  const inc = createIncident({ title: '测试-交接与通知', type: 'system-outage', severity: 'minor', scope: [{ type: 'block', ref: 'A01' }], commander: '交班人' }, '交班人');
  assert.throws(() => handoverCommander(inc.id, { fromCommander: '外人', toCommander: '接班人', reason: 'x' }), /交班人不一致/);
  handoverCommander(inc.id, { fromCommander: '交班人', toCommander: '接班人', reason: '夜班交接' }, '交班人');
  const detail = incidentDetail(inc.id)!;
  assert.equal(detail.incident.commander, '接班人');
  assert.equal(detail.handovers.length, 1);
  assert.ok(detail.timeline.some((t: { kind: string }) => t.kind === 'handover'));
  const rule = publishRule(inc.id, { action: 'pause-tasks', memo: 'A01 暂停' }, '接班人').rule;
  requestRuleLift(rule.id, '接班人');
  const before = notices.filter((n: { dedupKey: string }) => n.dedupKey === `lift-${rule.id}-1`).length;
  assert.throws(() => requestRuleLift(rule.id, '接班人'), /等待人工复核/, '重复提交解除不产生第二条通知');
  const after = notices.filter((n: { dedupKey: string }) => n.dedupKey === `lift-${rule.id}-1`).length;
  assert.equal(before, 1); assert.equal(after, 1);
  assert.throws(() => registerPhase(inc.id, 'detection', '重复阶段', '接班人'), /发现接报/);
});

test('evidence can be added after closure and rejected lift keeps the rule enforcing', async () => {
  const domain = await import('./domain.js');
  const { createIncident, publishRule, requestRuleLift, reviewRuleEffect, closeIncident, addEvidence, incidentDetail, createContainer, createYardTask, deleteContainer, deleteYardTask } = domain;
  const container = createContainer({ id: 'TEST-INC-EV01', voyageId: 'VOY-QF2', size: '20', isoType: '22G1', direction: 'export', status: 'in-yard', weightT: 10, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R05-T1' });
  const task = createYardTask({ kind: 'deliver', containerId: container.id, from: 'C03-R05-T1', to: '北闸口', equipmentId: 'YC-05', priority: 45, scheduledAt: new Date().toISOString(), estimatedMinutes: 14 });
  const inc = createIncident({ title: '测试-补录证据', type: 'other', severity: 'minor', scope: [{ type: 'container', ref: container.id }], commander: '指挥F' }, '指挥F');
  const rule = publishRule(inc.id, { action: 'pause-tasks', memo: '临时暂停' }, '指挥F').rule;
  const lift = requestRuleLift(rule.id, '指挥F');
  const effect = lift.reviewQueue.find(e => e.taskId === task.id)!;
  reviewRuleEffect(rule.id, effect.id, 'reject', '海关解除书未到，继续暂停', '指挥F');
  assert.equal(task.status, 'blocked', '复核驳回后规则继续生效');
  assert.equal(rule.liftRequested, false);
  const lift2 = requestRuleLift(rule.id, '指挥F');
  const effect2 = lift2.reviewQueue.find(e => e.taskId === task.id)!;
  reviewRuleEffect(rule.id, effect2.id, 'approve', '解除书已核验', '指挥F');
  const closed = closeIncident(inc.id, { note: '归档' }, '指挥F');
  assert.equal(closed?.status, 'closed');
  const evidence = addEvidence(inc.id, { kind: 'customs-order', title: '海关解除通知书扫描件', fileRef: 'docs/customs-release-01.pdf', note: '关闭后由卡口补传' }, '卡口值班员');
  assert.equal(evidence?.afterClosure, true);
  assert.ok(incidentDetail(inc.id)!.evidences.some((e: { afterClosure: boolean }) => e.afterClosure));
  assert.throws(() => addEvidence(inc.id, { kind: 'photo', title: '' }, 'x'), /证据标题/);
  deleteYardTask(task.id); deleteContainer(container.id);
});

test('newly created tasks inside incident scope are auto-enforced and deleting a task purges its suspension ledger', async () => {
  const domain = await import('./domain.js');
  const { createIncident, publishRule, createYardTask, deleteYardTask, incidentDetail, unrecoveredWork, taskSuspensions, createContainer, deleteContainer } = domain;
  const container = createContainer({ id: 'TEST-INC-AUTO1', voyageId: 'VOY-QF2', size: '20', isoType: '22G1', direction: 'import', status: 'in-yard', weightT: 11, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R04-T1' });
  const inc = createIncident({ title: '测试-新任务自动纳管', type: 'gate-congestion', severity: 'major', scope: [{ type: 'gate-lane', ref: 'north' }], commander: '指挥G' }, '指挥G');
  publishRule(inc.id, { action: 'pause-tasks', memo: '北闸拥堵' }, '指挥G');
  const task = createYardTask({ kind: 'deliver', containerId: container.id, from: 'C03-R04-T1', to: '北闸口', equipmentId: 'YC-05', priority: 30, scheduledAt: new Date().toISOString(), estimatedMinutes: 10 });
  assert.equal(task.status, 'blocked', '创建后立即被范围内规则暂停');
  assert.ok(taskSuspensions.some((s: { taskId: string }) => s.taskId === task.id));
  deleteYardTask(task.id);
  assert.equal(taskSuspensions.some((s: { taskId: string }) => s.taskId === task.id), false);
  assert.equal(incidentDetail(inc.id)!.unrecovered.tasks.length, 0);
  assert.equal(unrecoveredWork().some((w: any) => w.task.id === task.id), false);
  deleteContainer(container.id);
});

