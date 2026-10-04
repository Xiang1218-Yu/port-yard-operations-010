export type ContainerStatus = 'in-transit' | 'at-gate' | 'in-yard' | 'on-quay' | 'released' | 'hold';
export type EquipmentKind = 'quay-crane' | 'yard-crane' | 'terminal-truck' | 'reach-stacker';
export type TaskStatus = 'queued' | 'assigned' | 'executing' | 'blocked' | 'done';
export type AppointmentStatus = 'booked' | 'checked-in' | 'completed' | 'cancelled' | 'exception';

export interface Voyage { id: string; vessel: string; imo: string; service: string; eta: string; etd: string; status: 'approaching' | 'berthed' | 'loading' | 'departed'; berth: string; movesPlanned: number; movesDone: number; lateRisk: 'low' | 'medium' | 'high'; }
export interface Container { id: string; voyageId: string; size: '20' | '40' | '45'; isoType: string; direction: 'import' | 'export' | 'transshipment'; status: ContainerStatus; weightT: number; reefer: boolean; temperature?: number; hazmatClass?: string; customs: 'released' | 'inspection' | 'hold'; priority: 'normal' | 'hot' | 'reefer' | 'hazmat'; yardSlot: string; appointmentId?: string; lastEvent: string; }
export interface YardBlock { id: string; zone: string; rows: number; tiers: number; capacity: number; occupied: number; reeferPlugs: number; usedPlugs: number; hazmatAllowed: boolean; equipment: EquipmentKind[]; heat: number; }
export interface GateAppointment { id: string; containerId: string; truckNo: string; driver: string; type: 'pickup' | 'dropoff'; windowStart: string; windowEnd: string; lane: 'north' | 'south' | 'rail'; status: AppointmentStatus; sealVerified: boolean; weightVerified: boolean; exception?: string; }
export interface Equipment { id: string; name: string; kind: EquipmentKind; status: 'available' | 'working' | 'maintenance' | 'offline'; location: string; battery: number; queue: number; movesPerHour: number; }
export interface YardTask { id: string; kind: 'receive' | 'deliver' | 'rehandle' | 'load' | 'discharge' | 'inspect'; containerId: string; from: string; to: string; equipmentId?: string; priority: number; status: TaskStatus; scheduledAt: string; blockingReasons: string[]; estimatedMinutes: number; }
export interface AuditEvent { id: string; actor: string; action: string; entity: string; entityId: string; at: string; details: string; }

const start = Date.now(); const iso = (minutes: number) => new Date(start + minutes * 60000).toISOString();
export const voyages: Voyage[] = [
  { id: 'VOY-AX7', vessel: 'MSC Aurora', imo: 'IMO9382014', service: 'AE-3', eta: iso(-90), etd: iso(350), status: 'berthed', berth: 'B07', movesPlanned: 1240, movesDone: 886, lateRisk: 'medium' },
  { id: 'VOY-QF2', vessel: 'Ever Quartz', imo: 'IMO9721103', service: 'TP9', eta: iso(190), etd: iso(890), status: 'approaching', berth: 'B04', movesPlanned: 760, movesDone: 0, lateRisk: 'high' },
  { id: 'VOY-RD8', vessel: 'ONE Redwood', imo: 'IMO9812340', service: 'PNW', eta: iso(-700), etd: iso(-330), status: 'departed', berth: 'B02', movesPlanned: 520, movesDone: 520, lateRisk: 'low' }
];
export const blocks: YardBlock[] = [
  { id: 'A01', zone: 'North Import', rows: 14, tiers: 5, capacity: 280, occupied: 247, reeferPlugs: 18, usedPlugs: 16, hazmatAllowed: false, equipment: ['yard-crane', 'terminal-truck'], heat: 78 },
  { id: 'B07', zone: 'Central Transshipment', rows: 18, tiers: 5, capacity: 360, occupied: 302, reeferPlugs: 24, usedPlugs: 19, hazmatAllowed: true, equipment: ['yard-crane', 'reach-stacker', 'terminal-truck'], heat: 91 },
  { id: 'C03', zone: 'Export Pre-staging', rows: 12, tiers: 4, capacity: 192, occupied: 128, reeferPlugs: 8, usedPlugs: 3, hazmatAllowed: false, equipment: ['yard-crane', 'terminal-truck'], heat: 54 },
  { id: 'D05', zone: 'Inspection & Hold', rows: 8, tiers: 3, capacity: 96, occupied: 72, reeferPlugs: 5, usedPlugs: 4, hazmatAllowed: true, equipment: ['reach-stacker'], heat: 63 }
];
export const containers: Container[] = [
  { id: 'MSCU-4829017', voyageId: 'VOY-AX7', size: '40', isoType: '45G1', direction: 'import', status: 'in-yard', weightT: 22.4, reefer: false, customs: 'released', priority: 'hot', yardSlot: 'A01-R07-T3', lastEvent: '卸船完成 08:42' },
  { id: 'EISU-1288420', voyageId: 'VOY-AX7', size: '40', isoType: '45R1', direction: 'import', status: 'in-yard', weightT: 27.8, reefer: true, temperature: -18, customs: 'released', priority: 'reefer', yardSlot: 'B07-R03-T2', lastEvent: '温度回传正常 08:51' },
  { id: 'TGHU-9831204', voyageId: 'VOY-AX7', size: '20', isoType: '22K2', direction: 'transshipment', status: 'hold', weightT: 19.7, reefer: false, hazmatClass: '3', customs: 'inspection', priority: 'hazmat', yardSlot: 'D05-R02-T1', lastEvent: '海关查验挂起' },
  { id: 'OOLU-7734201', voyageId: 'VOY-AX7', size: '40', isoType: '45G1', direction: 'export', status: 'at-gate', weightT: 24.1, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R06-T1', appointmentId: 'APT-9001', lastEvent: '南闸口已称重' },
  { id: 'CMAU-6001722', voyageId: 'VOY-QF2', size: '40', isoType: '45G1', direction: 'import', status: 'in-transit', weightT: 23.5, reefer: false, customs: 'released', priority: 'hot', yardSlot: 'B07-R10-T1', lastEvent: '船期 ETA +35min' },
  { id: 'FCIU-9920310', voyageId: 'VOY-QF2', size: '20', isoType: '22G1', direction: 'export', status: 'in-yard', weightT: 12.2, reefer: false, customs: 'released', priority: 'normal', yardSlot: 'C03-R04-T2', lastEvent: '待装船' },
  { id: 'TEMU-1774029', voyageId: 'VOY-AX7', size: '40', isoType: '45R1', direction: 'import', status: 'in-yard', weightT: 26.3, reefer: true, temperature: 4, customs: 'inspection', priority: 'reefer', yardSlot: 'D05-R05-T1', lastEvent: '待海关查验' }
];
export const appointments: GateAppointment[] = [
  { id: 'APT-9001', containerId: 'OOLU-7734201', truckNo: '沪A·7K229', driver: '陈海', type: 'dropoff', windowStart: iso(-14), windowEnd: iso(16), lane: 'south', status: 'checked-in', sealVerified: true, weightVerified: true },
  { id: 'APT-9002', containerId: 'MSCU-4829017', truckNo: '苏E·66218', driver: '王建国', type: 'pickup', windowStart: iso(34), windowEnd: iso(64), lane: 'north', status: 'booked', sealVerified: false, weightVerified: false },
  { id: 'APT-9003', containerId: 'EISU-1288420', truckNo: '沪B·02891', driver: '赵晨', type: 'pickup', windowStart: iso(38), windowEnd: iso(68), lane: 'north', status: 'booked', sealVerified: false, weightVerified: false },
  { id: 'APT-9004', containerId: 'FCIU-9920310', truckNo: '沪A·7K229', driver: '陈海', type: 'pickup', windowStart: iso(4), windowEnd: iso(22), lane: 'south', status: 'booked', sealVerified: false, weightVerified: false, exception: '同一车辆相邻窗口过短' }
];
export const equipment: Equipment[] = [
  { id: 'QC-07', name: '岸桥 QC-07', kind: 'quay-crane', status: 'working', location: 'B07 / MSC Aurora', battery: 96, queue: 4, movesPerHour: 31 },
  { id: 'YC-12', name: '场桥 YC-12', kind: 'yard-crane', status: 'working', location: 'B07-R03', battery: 72, queue: 9, movesPerHour: 24 },
  { id: 'YC-05', name: '场桥 YC-05', kind: 'yard-crane', status: 'available', location: 'C03-R06', battery: 88, queue: 3, movesPerHour: 27 },
  { id: 'TT-31', name: '集卡 TT-31', kind: 'terminal-truck', status: 'working', location: '南闸口', battery: 61, queue: 2, movesPerHour: 8 },
  { id: 'RS-02', name: '正面吊 RS-02', kind: 'reach-stacker', status: 'maintenance', location: 'D05', battery: 34, queue: 0, movesPerHour: 14 }
];
export const tasks: YardTask[] = [
  { id: 'TASK-101', kind: 'deliver', containerId: 'MSCU-4829017', from: 'A01-R07-T3', to: '南闸口', equipmentId: 'YC-12', priority: 92, status: 'assigned', scheduledAt: iso(12), blockingReasons: [], estimatedMinutes: 18 },
  { id: 'TASK-102', kind: 'rehandle', containerId: 'EISU-1288420', from: 'B07-R03-T2', to: 'D05-R05-T1', equipmentId: 'YC-12', priority: 88, status: 'queued', scheduledAt: iso(24), blockingReasons: ['查验区插件余量接近阈值'], estimatedMinutes: 26 },
  { id: 'TASK-103', kind: 'inspect', containerId: 'TGHU-9831204', from: 'D05-R02-T1', to: 'D05-R02-T1', priority: 125, status: 'blocked', scheduledAt: iso(4), blockingReasons: ['RS-02 维护中', '待海关查验窗口'], estimatedMinutes: 32 },
  { id: 'TASK-104', kind: 'load', containerId: 'FCIU-9920310', from: 'C03-R04-T2', to: 'B07 / VOY-QF2', equipmentId: 'YC-05', priority: 75, status: 'queued', scheduledAt: iso(76), blockingReasons: [], estimatedMinutes: 21 }
];
export const auditEvents: AuditEvent[] = [{ id: 'AUD-500', actor: '中控调度员', action: 'REPLAN', entity: 'voyage', entityId: 'VOY-AX7', at: new Date(start - 20 * 60000).toISOString(), details: '因 QC-07 瞬时降速，重新计算 14 个高优先级作业' }];

function parseSlot(slot: string) { const match = slot.match(/^([A-Z]\d\d)-/); return match?.[1]; }
export function dashboard() {
  const activeVoyages = voyages.filter(v => v.status !== 'departed');
  const yardCapacity = blocks.reduce((sum, block) => sum + block.capacity, 0); const yardOccupied = blocks.reduce((sum, block) => sum + block.occupied, 0);
  return { activeVoyages: activeVoyages.length, berthMoves: activeVoyages.reduce((sum, v) => sum + v.movesPlanned - v.movesDone, 0), yardUtilization: yardOccupied / yardCapacity, gateQueue: appointments.filter(a => a.status === 'checked-in').length + 7, pendingTasks: tasks.filter(t => t.status !== 'done').length, blockedTasks: tasks.filter(t => t.status === 'blocked').length, reeferAlerts: containers.filter(c => c.reefer && (c.customs === 'inspection' || (c.temperature ?? 0) > 5)).length, hazmatHolds: containers.filter(c => c.hazmatClass && c.customs !== 'released').length, lateVessels: activeVoyages.filter(v => v.lateRisk === 'high').length, activeIncidents: incidents.filter(i => i.status === 'active').length, incidentPausedTasks: tasks.filter(t => isTaskPausedByIncident(t.id)).length };
}
export function gateConflicts() {
  const result: { severity: 'critical' | 'warning'; appointmentId: string; reason: string }[] = [];
  appointments.forEach((a, index) => appointments.slice(index + 1).forEach(b => {
    const overlap = a.truckNo === b.truckNo && new Date(a.windowStart).getTime() < new Date(b.windowEnd).getTime() && new Date(b.windowStart).getTime() < new Date(a.windowEnd).getTime();
    if (overlap) result.push({ severity: 'critical', appointmentId: a.id, reason: `车辆 ${a.truckNo} 与 ${b.id} 时间窗口重叠，需重新分配闸口时隙` });
  }));
  appointments.filter(a => a.status === 'booked').forEach(a => { const container = containers.find(c => c.id === a.containerId); if (container?.customs !== 'released') result.push({ severity: 'warning', appointmentId: a.id, reason: `箱 ${a.containerId} 海关状态为 ${container?.customs}，无法无条件放行` }); });
  return result;
}
export function yardHeatmap() { return blocks.map(block => ({ ...block, utilization: block.occupied / block.capacity, freeSlots: block.capacity - block.occupied, pressure: block.heat > 85 ? 'critical' : block.heat > 65 ? 'warning' : 'normal' })); }
export function containerPlan(containerId: string) {
  const container = containers.find(c => c.id === containerId); if (!container) return undefined;
  const reasons: string[] = []; const candidates = blocks.filter(block => block.capacity > block.occupied && (!container.hazmatClass || block.hazmatAllowed) && (!container.reefer || block.reeferPlugs > block.usedPlugs));
  if (container.customs !== 'released' && container.status === 'in-yard') reasons.push('海关未放行，必须保持在查验/监管区');
  const ranked = candidates.map(block => ({ block, score: (block.capacity - block.occupied) * 2 - block.heat - (container.reefer && block.reeferPlugs - block.usedPlugs < 3 ? 18 : 0) - (container.hazmatClass && !block.hazmatAllowed ? 100 : 0) })).sort((a, b) => b.score - a.score);
  if (!ranked.length) reasons.push('没有同时满足危险品、冷藏电源与容量约束的区块');
  const selected = ranked[0]?.block; if (container.reefer && selected) reasons.push(`需要占用 ${selected.reeferPlugs - selected.usedPlugs} 个剩余冷插位中的 1 个`);
  if (container.hazmatClass) reasons.push(`危险品 ${container.hazmatClass} 级，只能进入有隔离资质的区块`);
  return { container, recommendedBlock: selected, alternatives: ranked.slice(1, 3).map(item => item.block), reasons };
}
export function prioritizeTasks() { return tasks.map(task => ({ ...task, score: task.priority + (task.blockingReasons.length ? -20 : 10) + (task.kind === 'inspect' ? 12 : 0) })).sort((a, b) => b.score - a.score); }
export function createAppointment(input: Omit<GateAppointment, 'id' | 'status' | 'sealVerified' | 'weightVerified'>) {
  const container = containers.find(item => item.id === input.containerId); if (!container) throw new Error('箱号不存在');
  if (container.customs !== 'released' && input.type === 'pickup') throw new Error('海关未放行，不能预约提箱');
  const item: GateAppointment = { ...input, id: `APT-${Date.now()}`, status: 'booked', sealVerified: false, weightVerified: false }; appointments.unshift(item); container.appointmentId = item.id; return item;
}
export function updateAppointment(id: string, patch: Partial<Pick<GateAppointment, 'status' | 'sealVerified' | 'weightVerified' | 'exception'>>) { const item = appointments.find(a => a.id === id); if (!item) return undefined; Object.assign(item, patch); const container = containers.find(c => c.id === item.containerId); if (item.status === 'checked-in' && container) container.status = 'at-gate'; if (item.status === 'completed' && container) container.status = item.type === 'pickup' ? 'released' : 'in-yard'; auditEvents.unshift({ id: `AUD-${Date.now()}`, actor: '闸口值班员', action: 'GATE_UPDATE', entity: 'appointment', entityId: id, at: new Date().toISOString(), details: JSON.stringify(patch) }); return item; }
export function assignTask(id: string, equipmentId: string) { const task = tasks.find(item => item.id === id); const machine = equipment.find(item => item.id === equipmentId); if (!task || !machine) return undefined;
  const governing = activeRulesOnTask(task.id).filter(rule => rule.action === 'pause-tasks' || (rule.action === 'reassign-tasks' && rule.fallbackEquipmentId));
  if (governing.length) throw new Error(`任务 ${task.id} 受事件 ${governing.map(r => r.incidentId).join('、')} 临时规则管控，改派需在事件指挥台先解除对应规则`);
  const blockingReasons = [...task.blockingReasons.filter(reason => !reason.startsWith(PAUSE_TAG) && !reason.startsWith(REASSIGN_TAG))]; if (machine.status === 'maintenance' || machine.status === 'offline') blockingReasons.push(`${machine.name} 当前不可用`); if (task.kind === 'inspect' && machine.kind !== 'reach-stacker') blockingReasons.push('查验作业需要正面吊或专用设备'); task.equipmentId = equipmentId; task.status = blockingReasons.length ? 'blocked' : 'assigned'; task.blockingReasons = blockingReasons;
  const suspension = taskSuspensions.find(entry => entry.taskId === id); if (suspension) { suspension.baseline.equipmentId = equipmentId; suspension.baseline.status = task.status; }
  auditEvents.unshift({ id: `AUD-${Date.now()}`, actor: '中控调度员', action: 'ASSIGN_TASK', entity: 'yard-task', entityId: id, at: new Date().toISOString(), details: `${equipmentId} -> ${task.containerId}` }); return task; }
export function containerDetail(id: string) { const container = containers.find(item => item.id === id); if (!container) return undefined; return { container, voyage: voyages.find(v => v.id === container.voyageId), appointment: appointments.find(a => a.id === container.appointmentId), plan: containerPlan(id), tasks: tasks.filter(t => t.containerId === id) }; }

export type ContainerInput = Omit<Container, 'lastEvent' | 'appointmentId'> & { appointmentId?: string };
export type AppointmentInput = Pick<GateAppointment, 'containerId' | 'truckNo' | 'driver' | 'type' | 'windowStart' | 'windowEnd' | 'lane'>;
export type TaskInput = Pick<YardTask, 'kind' | 'containerId' | 'from' | 'to' | 'priority' | 'scheduledAt' | 'estimatedMinutes'> & { equipmentId?: string };

function recordAudit(action: string, entity: string, entityId: string, details: string, actor = '中控调度员') {
  auditEvents.unshift({ id: `AUD-${Date.now()}-${auditSeq++}`, actor, action, entity, entityId, at: new Date().toISOString(), details });
}
let auditSeq = 1;

export function createContainer(input: ContainerInput) {
  const id = input.id.trim().toUpperCase();
  if (!id) throw new Error('箱号不能为空');
  if (containers.some(item => item.id === id)) throw new Error(`箱号 ${id} 已存在`);
  if (!voyages.some(item => item.id === input.voyageId)) throw new Error('关联航次不存在');
  const blockId = parseSlot(input.yardSlot);
  if (blockId && !blocks.some(block => block.id === blockId)) throw new Error('堆位所属区块不存在');
  if (input.hazmatClass && blockId && !blocks.find(block => block.id === blockId)?.hazmatAllowed) throw new Error('危险品不能进入当前堆场区块');
  if (input.reefer && blockId) {
    const block = blocks.find(item => item.id === blockId);
    if (block && block.reeferPlugs <= block.usedPlugs) throw new Error('当前区块没有可用冷藏插座');
  }
  const item: Container = { ...input, id, lastEvent: `人工建档 ${new Date().toLocaleString()}` };
  containers.unshift(item);
  recordAudit('CREATE', 'container', item.id, '新增集装箱台账记录');
  return item;
}

export function updateContainer(id: string, patch: Partial<Omit<Container, 'id' | 'lastEvent'>>) {
  const item = containers.find(container => container.id === id);
  if (!item) return undefined;
  if (patch.voyageId && !voyages.some(voyage => voyage.id === patch.voyageId)) throw new Error('关联航次不存在');
  const next = { ...item, ...patch };
  const blockId = parseSlot(next.yardSlot);
  if (blockId && !blocks.some(block => block.id === blockId)) throw new Error('堆位所属区块不存在');
  if (next.hazmatClass && blockId && !blocks.find(block => block.id === blockId)?.hazmatAllowed) throw new Error('危险品不能进入当前堆场区块');
  Object.assign(item, patch, { lastEvent: `台账更新 ${new Date().toLocaleString()}` });
  reconcileRulesWithTasks();
  recordAudit('UPDATE', 'container', id, '更新集装箱台账字段');
  return item;
}

export function deleteContainer(id: string) {
  const index = containers.findIndex(item => item.id === id);
  if (index < 0) return undefined;
  const [item] = containers.splice(index, 1);
  const removedAppointments = appointments.filter(appointment => appointment.containerId === id);
  for (const appointment of removedAppointments) appointments.splice(appointments.indexOf(appointment), 1);
  const removedTasks = tasks.filter(task => task.containerId === id);
  for (const task of removedTasks) { tasks.splice(tasks.indexOf(task), 1); purgeTaskGovernance(task.id); }
  recordAudit('DELETE', 'container', id, `删除箱务记录，并级联清理 ${removedAppointments.length} 条预约、${removedTasks.length} 条未完成任务`);
  return item;
}

export function createGateAppointment(input: AppointmentInput) {
  const container = containers.find(item => item.id === input.containerId);
  if (!container) throw new Error('箱号不存在');
  if (input.type === 'pickup' && container.customs !== 'released') throw new Error('海关未放行，不能预约提箱');
  if (new Date(input.windowEnd) <= new Date(input.windowStart)) throw new Error('预约结束时间必须晚于开始时间');
  const item: GateAppointment = { ...input, id: `APT-${Date.now()}`, status: 'booked', sealVerified: false, weightVerified: false };
  appointments.unshift(item);
  container.appointmentId = item.id;
  recordAudit('CREATE', 'appointment', item.id, `为 ${item.containerId} 创建闸口预约`);
  return item;
}

export function editGateAppointment(id: string, patch: Partial<AppointmentInput & Pick<GateAppointment, 'status' | 'sealVerified' | 'weightVerified' | 'exception'>>) {
  const item = appointments.find(appointment => appointment.id === id);
  if (!item) return undefined;
  if (patch.containerId && !containers.some(container => container.id === patch.containerId)) throw new Error('箱号不存在');
  if (patch.windowStart && patch.windowEnd && new Date(patch.windowEnd) <= new Date(patch.windowStart)) throw new Error('预约结束时间必须晚于开始时间');
  const previousContainer = containers.find(container => container.id === item.containerId);
  Object.assign(item, patch);
  const nextContainer = containers.find(container => container.id === item.containerId);
  if (previousContainer && previousContainer.id !== nextContainer?.id && previousContainer.appointmentId === id) previousContainer.appointmentId = undefined;
  if (nextContainer) nextContainer.appointmentId = id;
  if (item.status === 'checked-in' && nextContainer) nextContainer.status = 'at-gate';
  if (item.status === 'completed' && nextContainer) nextContainer.status = item.type === 'pickup' ? 'released' : 'in-yard';
  recordAudit('UPDATE', 'appointment', id, `更新预约状态/时隙：${JSON.stringify(patch)}`);
  return item;
}

export function deleteGateAppointment(id: string) {
  const index = appointments.findIndex(item => item.id === id);
  if (index < 0) return undefined;
  const [item] = appointments.splice(index, 1);
  const container = containers.find(entry => entry.id === item.containerId);
  if (container?.appointmentId === id) container.appointmentId = undefined;
  recordAudit('DELETE', 'appointment', id, `取消并删除 ${item.containerId} 的闸口预约`);
  return item;
}

export function createYardTask(input: TaskInput) {
  if (!containers.some(container => container.id === input.containerId)) throw new Error('关联箱号不存在');
  if (input.priority < 1 || input.priority > 100) throw new Error('优先级范围为 1–100');
  if (input.estimatedMinutes <= 0) throw new Error('预计作业时长必须大于 0');
  const item: YardTask = { ...input, id: `TASK-${Date.now()}`, status: input.equipmentId ? 'assigned' : 'queued', blockingReasons: [], scheduledAt: input.scheduledAt };
  tasks.unshift(item);
  reconcileRulesWithTasks();
  recordAudit('CREATE', 'yard-task', item.id, `创建 ${input.kind} 任务，关联 ${input.containerId}`);
  return item;
}

export function updateYardTask(id: string, patch: Partial<TaskInput & Pick<YardTask, 'status' | 'blockingReasons'>>) {
  const item = tasks.find(task => task.id === id);
  if (!item) return undefined;
  if (patch.containerId && !containers.some(container => container.id === patch.containerId)) throw new Error('关联箱号不存在');
  if (patch.priority !== undefined && (patch.priority < 1 || patch.priority > 100)) throw new Error('优先级范围为 1–100');
  const touchesGovernedState = patch.status !== undefined || patch.equipmentId !== undefined;
  if (touchesGovernedState && isTaskPausedByIncident(id)) throw new Error(`任务 ${id} 处于事件暂停规则下，状态/设备恢复必须在事件指挥台经人工复核完成`);
  if (patch.equipmentId !== undefined && !patch.equipmentId && activeRulesOnTask(id).some(rule => rule.action === 'reassign-tasks')) throw new Error(`任务 ${id} 受事件改派规则约束，不能直接撤派，请先解除对应事件规则`);
  Object.assign(item, patch);
  recordAudit('UPDATE', 'yard-task', id, `更新场内作业任务：${JSON.stringify(patch)}`);
  return item;
}

export function deleteYardTask(id: string) {
  const index = tasks.findIndex(item => item.id === id);
  if (index < 0) return undefined;
  const [item] = tasks.splice(index, 1);
  purgeTaskGovernance(id);
  recordAudit('DELETE', 'yard-task', id, `删除 ${item.containerId} 的场内任务，事件管控挂账同步清理`);
  return item;
}

// ───────────────────────────── 作业事件指挥台 ─────────────────────────────

export type IncidentType = 'equipment-fault' | 'customs-control' | 'gate-congestion' | 'yard-safety' | 'weather' | 'system-outage' | 'other';
export type IncidentSeverity = 'minor' | 'major' | 'critical';
export type IncidentPhase = 'detection' | 'containment' | 'response' | 'recovery' | 'closed';
export type IncidentStatus = 'active' | 'closed';
export type ScopeEntityType = 'voyage' | 'block' | 'equipment' | 'container' | 'gate-lane';
export type RuleAction = 'pause-tasks' | 'reassign-tasks';
export type RuleEffectState = 'applied' | 'review-pending' | 'restored' | 'rejected' | 'restore-failed';
export type EvidenceKind = 'photo' | 'document' | 'telemetry' | 'statement' | 'customs-order' | 'other';

export interface ScopeRef { type: ScopeEntityType; ref: string; }
export interface IncidentPhaseEntry { id: string; incidentId: string; phase: Exclude<IncidentPhase, 'closed'>; note: string; actor: string; at: string; }
export interface CommanderHandover { id: string; incidentId: string; fromCommander: string; toCommander: string; reason: string; actor: string; at: string; }
export interface IncidentEvidence { id: string; incidentId: string; kind: EvidenceKind; title: string; fileRef: string; note: string; actor: string; at: string; afterClosure: boolean; }
export interface OperationRule { id: string; incidentId: string; action: RuleAction; fallbackEquipmentId?: string; memo: string; createdAt: string; liftRequested: boolean; liftRequestedAt?: string; liftCycle: number; liftedAt?: string; publishedBy: string; }
export interface RuleEffect { id: string; ruleId: string; incidentId: string; taskId: string; containerId: string; state: RuleEffectState; appliedAt: string; reviewNote?: string; reviewedBy?: string; reviewedAt?: string; attempts: number; lastFailureReason?: string; }
export interface TaskSuspension { taskId: string; baseline: Pick<YardTask, 'status' | 'equipmentId' | 'blockingReasons'>; ruleIds: string[]; }
export interface IncidentNotice { id: string; incidentId: string; kind: string; title: string; body: string; channel: 'command-board' | 'sms' | 'radio' | 'email'; at: string; dedupKey: string; read: boolean; }
export interface Incident {
  id: string; title: string; type: IncidentType; severity: IncidentSeverity; status: IncidentStatus;
  scope: ScopeRef[]; commander: string; phase: Exclude<IncidentPhase, 'closed'>;
  createdAt: string; closedAt?: string; closeNote?: string; carryOver?: { note: string; at: string; items: string[] };
  createdBy: string;
}

interface IncidentStore {
  incidents: Incident[]; phases: IncidentPhaseEntry[]; handovers: CommanderHandover[];
  evidences: IncidentEvidence[]; rules: OperationRule[]; effects: RuleEffect[];
  suspensions: TaskSuspension[]; notices: IncidentNotice[];
}

const store: IncidentStore = { incidents: [], phases: [], handovers: [], evidences: [], rules: [], effects: [], suspensions: [], notices: [] };
const { incidents, phases, handovers, evidences, rules: operationRules, effects: ruleEffects, suspensions: taskSuspensions, notices } = store;
export { incidents, operationRules, ruleEffects, taskSuspensions, notices };

const PAUSE_TAG = '[事件暂停';
const PENDING_TAG = '[解除待复核';
const REASSIGN_TAG = '[事件改派';
let incidentSeq = 0; let ruleSeq = 0; let effectSeq = 0; let entrySeq = 0; let noticeSeq = 0;
const nextId = (prefix: string, seq: { value: number }) => `${prefix}-${seq.value++}`;
const seqBox = (n: number) => ({ value: n });
const incidentIds = seqBox(300); const ruleIds = seqBox(400); const effectIds = seqBox(800); const entryIds = seqBox(9000); const noticeIds = seqBox(600);
const nowIso = () => new Date().toISOString();
const isNaturalReason = (reason: string) => !reason.startsWith('[事件');

function pushNotice(incidentId: string, kind: string, title: string, body: string, dedupKey: string, channel: IncidentNotice['channel'] = 'command-board') {
  if (store.notices.some(notice => notice.dedupKey === dedupKey)) return undefined;
  const notice: IncidentNotice = { id: nextId('NTF', noticeIds), incidentId, kind, title, body, channel, at: nowIso(), dedupKey, read: false };
  store.notices.unshift(notice);
  return notice;
}

function taskBlockOf(task: YardTask) {
  const fromSlot = parseSlot(task.from);
  if (fromSlot && blocks.some(block => block.id === fromSlot)) return fromSlot;
  return parseSlot(task.to);
}
function scopeTasks(scope: ScopeRef[]): YardTask[] {
  return tasks.filter(task => {
    const container = containers.find(item => item.id === task.containerId);
    return scope.some(ref => {
      if (ref.type === 'voyage') return container?.voyageId === ref.ref;
      if (ref.type === 'block') return taskBlockOf(task) === ref.ref || (container?.yardSlot?.startsWith(`${ref.ref}-`) ?? false);
      if (ref.type === 'equipment') return task.equipmentId === ref.ref;
      if (ref.type === 'container') return task.containerId === ref.ref;
      if (ref.type === 'gate-lane') {
        const laneLabel = ref.ref === 'north' ? '北闸口' : ref.ref === 'south' ? '南闸口' : '铁路闸口';
        return task.from.includes(laneLabel) || task.to.includes(laneLabel);
      }
      return false;
    });
  });
}
function validateScopeRefs(scope: ScopeRef[]) {
  if (!Array.isArray(scope) || scope.length === 0) throw new Error('必须至少选择一个受影响对象（航次 / 区块 / 设备 / 箱号 / 车道）');
  for (const ref of scope) {
    const exists = ref.type === 'voyage' ? voyages.some(item => item.id === ref.ref)
      : ref.type === 'block' ? blocks.some(item => item.id === ref.ref)
      : ref.type === 'equipment' ? equipment.some(item => item.id === ref.ref)
      : ref.type === 'container' ? containers.some(item => item.id === ref.ref)
      : ['north', 'south', 'rail'].includes(ref.ref);
    if (!exists) throw new Error(`影响范围中的 ${ref.type}:${ref.ref} 不存在`);
  }
}
export function resolveScopeObjects(scope: ScopeRef[]) {
  const pick = <T,>(list: T[], ids: string[]) => list.filter(item => ids.includes((item as { id: string }).id));
  return {
    voyages: pick(voyages, scope.filter(r => r.type === 'voyage').map(r => r.ref)),
    blocks: pick(blocks, scope.filter(r => r.type === 'block').map(r => r.ref)),
    equipment: pick(equipment, scope.filter(r => r.type === 'equipment').map(r => r.ref)),
    containers: pick(containers, scope.filter(r => r.type === 'container').map(r => r.ref)),
    gateLanes: scope.filter(r => r.type === 'gate-lane').map(r => r.ref),
  };
}

// ── 规则作用与任务基线（支持同一任务被多条事件规则叠加） ──

function enforcedEffectsForRule(rule: OperationRule) {
  if (rule.liftedAt) return [];
  return store.effects.filter(effect => effect.ruleId === rule.id && effect.state !== 'restored');
}
function enforcedEffectsOnTask(taskId: string) {
  return store.effects.filter(effect => effect.taskId === taskId && effect.state !== 'restored' && !store.rules.some(rule => rule.id === effect.ruleId && rule.liftedAt));
}
export function activeRulesOnTask(taskId: string) {
  const ids = new Set(enforcedEffectsOnTask(taskId).map(effect => effect.ruleId));
  return store.rules.filter(rule => ids.has(rule.id));
}
export function isTaskPausedByIncident(taskId: string) {
  return enforcedEffectsOnTask(taskId).some(effect => store.rules.find(rule => rule.id === effect.ruleId)?.action === 'pause-tasks');
}
function effectTag(effect: RuleEffect, rule: OperationRule): string {
  const pending = effect.state === 'review-pending';
  if (rule.action === 'pause-tasks') return pending ? `${PENDING_TAG} ${rule.id}]` : `${PAUSE_TAG} ${rule.id}]`;
  const fallback = rule.fallbackEquipmentId ?? '';
  return pending ? `${PENDING_TAG}改派 ${rule.id}]` : `${REASSIGN_TAG} ${rule.id} → ${fallback}]`;
}
function recomputeTask(task: YardTask) {
  const enforced = enforcedEffectsOnTask(task.id);
  const suspension = store.suspensions.find(item => item.taskId === task.id);
  if (enforced.length === 0) {
    if (suspension) {
      task.status = suspension.baseline.status;
      task.equipmentId = suspension.baseline.equipmentId;
      task.blockingReasons = [...suspension.baseline.blockingReasons];
      store.suspensions.splice(store.suspensions.indexOf(suspension), 1);
    }
    return;
  }
  if (!suspension) {
    store.suspensions.push({ taskId: task.id, baseline: { status: task.status, equipmentId: task.equipmentId, blockingReasons: task.blockingReasons.filter(isNaturalReason) }, ruleIds: [] });
  }
  const baseline = (store.suspensions.find(item => item.taskId === task.id) as TaskSuspension).baseline;
  const natural = baseline.blockingReasons;
  const tags = enforced.map(effect => effectTag(effect, store.rules.find(rule => rule.id === effect.ruleId) as OperationRule));
  task.blockingReasons = [...natural, ...tags];
  const paused = enforced.some(effect => (store.rules.find(rule => rule.id === effect.ruleId) as OperationRule).action === 'pause-tasks');
  const reassignment = enforced.map(effect => store.rules.find(rule => rule.id === effect.ruleId)).find(rule => rule?.action === 'reassign-tasks' && rule.fallbackEquipmentId) as OperationRule | undefined;
  if (paused) {
    task.status = 'blocked';
  } else if (reassignment) {
    task.equipmentId = reassignment.fallbackEquipmentId;
    task.status = baseline.status === 'queued' ? 'assigned' : baseline.status;
  }
}
function refreshRuleState(rule: OperationRule) {
  const active = store.effects.filter(effect => effect.ruleId === rule.id);
  if (active.length > 0 && active.every(effect => effect.state === 'restored')) rule.liftedAt = nowIso();
}
function reconcileRulesWithTasks() {
  for (const rule of store.rules) {
    if (rule.liftedAt) continue;
    const matched = new Set(scopeTasks(scopeOfRule(rule)).map(task => task.id));
    const existing = store.effects.filter(effect => effect.ruleId === rule.id);
    for (const effect of existing) {
      if (matched.has(effect.taskId)) {
        if (effect.state === 'rejected' && !rule.liftRequested) {
          effect.state = 'applied'; effect.reviewNote = undefined; effect.reviewedBy = undefined;
        }
        continue;
      }
      if (effect.state === 'restored') continue;
      store.effects.splice(store.effects.indexOf(effect), 1);
      const task = tasks.find(item => item.id === effect.taskId);
      if (task) {
        recomputeTask(task);
        pushNotice(rule.incidentId, 'rule-scope-changed', `规则 ${rule.id} 作用对象变化`, `任务 ${effect.taskId} 已不在影响范围内，按基线自动解除`, `scope-${rule.id}-${effect.taskId}`);
      }
    }
    for (const taskId of matched) {
      if (existing.some(effect => effect.taskId === taskId)) continue;
      const task = tasks.find(item => item.id === taskId) as YardTask;
      const effect: RuleEffect = { id: nextId('EFF', effectIds), ruleId: rule.id, incidentId: rule.incidentId, taskId, containerId: task.containerId, state: 'applied', appliedAt: nowIso(), attempts: 0 };
      store.effects.unshift(effect);
      pushNotice(rule.incidentId, 'rule-coverage', `规则 ${rule.id} 新覆盖任务 ${taskId}`, `任务 ${taskId}（${task.containerId}）进入影响范围，临时规则自动生效`, `coverage-${rule.id}-${taskId}`);
    }
  }
  const governedIds = new Set(store.effects.filter(e => e.state !== 'restored').map(e => e.taskId));
  for (const task of [...tasks]) if (governedIds.has(task.id) || store.suspensions.some(s => s.taskId === task.id)) recomputeTask(task);
}
function scopeOfRule(rule: OperationRule): ScopeRef[] {
  return (store.incidents.find(item => item.id === rule.incidentId) as Incident).scope;
}
function purgeTaskGovernance(taskId: string) {
  const index = store.suspensions.findIndex(item => item.taskId === taskId);
  if (index >= 0) store.suspensions.splice(index, 1);
  for (const effect of store.effects.filter(item => item.taskId === taskId)) {
    if (effect.state !== 'restored') store.effects.splice(store.effects.indexOf(effect), 1);
  }
}
function baselineRestorable(suspension: TaskSuspension | undefined): string | undefined {
  if (!suspension) return undefined;
  const baselineEquipmentId = suspension.baseline.equipmentId;
  if (!baselineEquipmentId) return undefined;
  const machine = equipment.find(item => item.id === baselineEquipmentId);
  if (!machine) return `基线设备 ${baselineEquipmentId} 已不存在，无法自动恢复派工`;
  if (machine.status === 'offline' || machine.status === 'maintenance') return `基线设备 ${machine.name} 当前为 ${machine.status === 'offline' ? '离线' : '维护'} 状态，恢复派工失败`;
  return undefined;
}

// ── 事件生命周期 ──

export interface IncidentInput { id?: string; title: string; type: IncidentType; severity: IncidentSeverity; scope: ScopeRef[]; commander: string; description?: string; }
export function createIncident(input: IncidentInput, actor = '事件指挥官') {
  const title = input.title?.trim();
  if (!title) throw new Error('事件标题不能为空');
  validateScopeRefs(input.scope);
  const id = input.id?.trim() || `INC-${new Date().toISOString().slice(0, 10).slice(5)}-${incidentIds.value}-${incidentSeq++}`;
  if (store.incidents.some(item => item.id === id)) throw new Error(`事件编号 ${id} 已存在`);
  const incident: Incident = { id, title, type: input.type, severity: input.severity, status: 'active', scope: input.scope, commander: input.commander, phase: 'detection', createdAt: nowIso(), createdBy: actor };
  store.incidents.unshift(incident);
  store.phases.unshift({ id: nextId('PHS', entryIds), incidentId: id, phase: 'detection', note: input.description || '事件建立，录入影响范围', actor, at: nowIso() });
  pushNotice(id, 'incident-created', `事件建立：${title}`, `${actor} 创建事件并划定 ${input.scope.length} 个影响对象`, `create-${id}`);
  recordAudit('INCIDENT_CREATE', 'incident', id, `创建事件「${title}」，影响范围 ${input.scope.map(s => `${s.type}:${s.ref}`).join('、')}`, actor);
  return incident;
}
export function updateIncident(id: string, patch: Partial<Pick<Incident, 'title' | 'severity' | 'scope' | 'commander'>>, actor = '事件指挥官') {
  const incident = store.incidents.find(item => item.id === id);
  if (!incident) return undefined;
  if (incident.status === 'closed') throw new Error('事件已关闭，不能再修改事件基本信息（证据补录除外）');
  if (patch.scope) { validateScopeRefs(patch.scope); incident.scope = patch.scope; reconcileRulesWithTasks(); }
  if (patch.title?.trim()) incident.title = patch.title.trim();
  if (patch.severity) incident.severity = patch.severity;
  if (patch.commander?.trim()) incident.commander = patch.commander.trim();
  recordAudit('INCIDENT_UPDATE', 'incident', id, `更新事件信息：${JSON.stringify(patch)}`, actor);
  return incident;
}
export function registerPhase(id: string, phase: Exclude<IncidentPhase, 'closed'>, note: string, actor?: string) {
  const incident = store.incidents.find(item => item.id === id);
  if (!incident) return undefined;
  if (incident.status === 'closed') throw new Error('事件已关闭，不能再登记处置阶段');
  const acting = actor || incident.commander;
  if (phase === incident.phase) throw new Error(`事件当前已处于「${phaseLabel(phase)}」阶段`);
  incident.phase = phase;
  const entry: IncidentPhaseEntry = { id: nextId('PHS', entryIds), incidentId: id, phase, note: note || `进入${phaseLabel(phase)}阶段`, actor: acting, at: nowIso() };
  store.phases.unshift(entry);
  pushNotice(id, 'phase-change', `${incident.title} 进入${phaseLabel(phase)}阶段`, entry.note, `phase-${entry.id}`);
  recordAudit('INCIDENT_PHASE', 'incident', id, `阶段变更为 ${phase}：${entry.note}`, acting);
  return entry;
}
export function handoverCommander(id: string, input: { fromCommander: string; toCommander: string; reason: string }, actor?: string) {
  const incident = store.incidents.find(item => item.id === id);
  if (!incident) return undefined;
  if (incident.status === 'closed') throw new Error('事件已关闭，不能再交接指挥权');
  if (!input.toCommander?.trim()) throw new Error('接班指挥人不能为空');
  if (input.fromCommander !== incident.commander) throw new Error(`交班人不一致：当前指挥人为 ${incident.commander}`);
  const acting = actor || input.fromCommander;
  const entry: CommanderHandover = { id: nextId('HND', entryIds), incidentId: id, fromCommander: input.fromCommander, toCommander: input.toCommander.trim(), reason: input.reason || '现场交接', actor: acting, at: nowIso() };
  store.handovers.unshift(entry);
  incident.commander = input.toCommander.trim();
  pushNotice(id, 'commander-handover', `事件 ${id} 指挥权交接`, `${input.fromCommander} → ${input.toCommander}：${entry.reason}`, `handover-${entry.id}`, 'radio');
  recordAudit('INCIDENT_HANDOVER', 'incident', id, `指挥权 ${input.fromCommander} → ${input.toCommander}`, acting);
  return entry;
}
export function addEvidence(id: string, input: { kind: EvidenceKind; title: string; fileRef?: string; note?: string }, actor?: string) {
  const incident = store.incidents.find(item => item.id === id);
  if (!incident) return undefined;
  if (!input.title?.trim()) throw new Error('证据标题不能为空');
  const acting = actor || incident.commander;
  const item: IncidentEvidence = { id: nextId('EVD', entryIds), incidentId: id, kind: input.kind, title: input.title.trim(), fileRef: input.fileRef || '', note: input.note || '', actor: acting, at: nowIso(), afterClosure: incident.status === 'closed' };
  store.evidences.unshift(item);
  pushNotice(id, 'evidence-added', `事件 ${id} 补录证据`, `${acting} 上传「${item.title}」${item.afterClosure ? '（关闭后补录）' : ''}`, `evidence-${item.id}`);
  recordAudit('INCIDENT_EVIDENCE', 'incident', id, `登记证据「${item.title}」${item.afterClosure ? '（关闭后补录）' : ''}`, acting);
  return item;
}

// ── 临时操作规则：暂停 / 改派 ──

export interface RuleInput { action: RuleAction; fallbackEquipmentId?: string; memo: string; }
export function publishRule(incidentId: string, input: RuleInput, actor = '事件指挥官') {
  const incident = store.incidents.find(item => item.id === incidentId);
  if (!incident) throw new Error('事件不存在');
  if (incident.status === 'closed') throw new Error('事件已关闭，不能再发布临时规则');
  if (input.action !== 'pause-tasks' && input.action !== 'reassign-tasks') throw new Error('不支持的规则动作');
  let fallback: Equipment | undefined;
  if (input.action === 'reassign-tasks') {
    if (!input.fallbackEquipmentId) throw new Error('改派规则必须指定接替设备');
    fallback = equipment.find(item => item.id === input.fallbackEquipmentId);
    if (!fallback) throw new Error('接替设备不存在');
    if (fallback.status === 'offline' || fallback.status === 'maintenance') throw new Error(`${fallback.name} 当前${fallback.status === 'offline' ? '离线' : '维护中'}，不能作为接替设备`);
  }
  const rule: OperationRule = { id: nextId('RUL', ruleIds), incidentId, action: input.action, fallbackEquipmentId: fallback?.id, memo: input.memo || (input.action === 'pause-tasks' ? '受影响任务立即暂停，等待事件解除' : `任务临时改派至 ${fallback?.name ?? fallback?.id}`), createdAt: nowIso(), liftRequested: false, liftCycle: 0, publishedBy: actor };
  store.rules.unshift(rule);
  const matched = scopeTasks(incident.scope).filter(task => task.status !== 'done');
  for (const task of matched) {
    const effect: RuleEffect = { id: nextId('EFF', effectIds), ruleId: rule.id, incidentId, taskId: task.id, containerId: task.containerId, state: 'applied', appliedAt: nowIso(), attempts: 0 };
    store.effects.unshift(effect);
    recomputeTask(task);
  }
  pushNotice(incidentId, 'rule-published', `临时规则 ${rule.id} 已发布`, `${rule.action === 'pause-tasks' ? '暂停' : '改派'}规则覆盖 ${matched.length} 个进行中任务：${rule.memo}`, `rule-${rule.id}`, 'radio');
  recordAudit('INCIDENT_RULE_PUBLISH', 'operation-rule', rule.id, `${incidentId} 发布 ${rule.action}，命中 ${matched.length} 任务`, actor);
  return { rule, affectedTaskIds: matched.map(task => task.id) };
}
export function requestRuleLift(ruleId: string, actor = '事件指挥官') {
  const rule = store.rules.find(item => item.id === ruleId);
  if (!rule) throw new Error('临时规则不存在');
  if (rule.liftedAt) throw new Error('规则已解除');
  const effects = store.effects.filter(effect => effect.ruleId === ruleId && effect.state !== 'restored');
  if (effects.length === 0) { rule.liftRequested = true; rule.liftedAt = nowIso(); return { rule, reviewQueue: [] }; }
  if (rule.liftRequested && effects.some(effect => effect.state === 'review-pending')) throw new Error('该规则已提交解除，等待人工复核');
  rule.liftRequested = true; rule.liftRequestedAt = nowIso(); rule.liftCycle += 1;
  const queued: RuleEffect[] = [];
  for (const effect of effects) {
    if (effect.state === 'review-pending') continue;
    effect.state = 'review-pending'; effect.attempts += 1;
    queued.push(effect);
  }
  for (const taskId of new Set(effects.map(effect => effect.taskId))) {
    const task = tasks.find(item => item.id === taskId);
    if (task) recomputeTask(task);
  }
  pushNotice(rule.incidentId, 'rule-lift-requested', `规则 ${ruleId} 请求解除，等待人工复核`, `${queued.length} 个任务的恢复需要 ${rule.incidentId} 指挥人逐条确认`, `lift-${ruleId}-${rule.liftCycle}`, 'command-board');
  recordAudit('INCIDENT_RULE_LIFT_REQUEST', 'operation-rule', ruleId, `提交解除，${queued.length} 项待复核`, actor);
  return { rule, reviewQueue: queued };
}
export function reviewRuleEffect(ruleId: string, effectId: string, decision: 'approve' | 'reject', note: string | undefined, actor = '事件指挥官') {
  const rule = store.rules.find(item => item.id === ruleId);
  const effect = store.effects.find(item => item.id === effectId && item.ruleId === ruleId);
  if (!rule || !effect) throw new Error('规则作用记录不存在');
  if (rule.liftedAt && effect.state === 'restored') throw new Error('该作用已恢复并归档');
  if (effect.state !== 'review-pending' && effect.state !== 'restore-failed') throw new Error('该作用当前不处于待复核状态');
  const task = tasks.find(item => item.id === effect.taskId);
  if (!task) { store.effects.splice(store.effects.indexOf(effect), 1); refreshRuleState(rule); throw new Error('任务已不存在，作用记录自动清理'); }
  effect.reviewedBy = actor; effect.reviewedAt = nowIso(); effect.reviewNote = note || '';
  if (decision === 'reject') {
    effect.state = 'rejected';
    rule.liftRequested = false; rule.liftRequestedAt = undefined;
    for (const pending of store.effects.filter(item => item.ruleId === ruleId && item.state === 'review-pending')) pending.state = 'applied';
    for (const taskId of new Set(store.effects.filter(item => item.ruleId === ruleId).map(item => item.taskId))) {
      const t = tasks.find(item => item.id === taskId); if (t) recomputeTask(t);
    }
    pushNotice(rule.incidentId, 'rule-lift-rejected', `规则 ${ruleId} 解除复核被驳回`, `任务 ${effect.taskId} 恢复请求被 ${actor} 驳回：${note || '现场仍不具备恢复条件'}，规则继续生效`, `reject-${ruleId}-${rule.liftCycle}`);
    recordAudit('INCIDENT_RECOVERY_REJECT', 'rule-effect', effectId, `驳回 ${effect.taskId} 恢复：${note || ''}`, actor);
    return effect;
  }
  // approve：尝试按基线恢复。若该任务仍被其他未解除规则覆盖，本作用仅标记恢复，任务保持管控
  const suspension = store.suspensions.find(item => item.taskId === task.id);
  const otherCovering = enforcedEffectsOnTask(task.id).filter(item => item.id !== effect.id && item.state !== 'restored');
  const failure = otherCovering.length ? undefined : baselineRestorable(suspension);
  if (failure) {
    effect.state = 'restore-failed'; effect.lastFailureReason = failure;
    pushNotice(rule.incidentId, 'recovery-failed', `任务 ${task.id} 恢复失败`, `${actor} 复核通过但恢复未成功：${failure}`, `fail-${effect.id}-${effect.attempts}`, 'sms');
    recordAudit('INCIDENT_RECOVERY_FAILED', 'rule-effect', effectId, failure, actor);
    recomputeTask(task);
    return effect;
  }
  effect.state = 'restored'; effect.lastFailureReason = undefined;
  recomputeTask(task);
  refreshRuleState(rule);
  if (rule.liftedAt) {
    rule.liftRequested = false;
    pushNotice(rule.incidentId, 'rule-lifted', `规则 ${ruleId} 已全部解除`, `所有受影响任务完成人工复核并恢复`, `lifted-${ruleId}`);
    recordAudit('INCIDENT_RULE_LIFTED', 'operation-rule', ruleId, '全部作用恢复完成', actor);
    maybeAutoRecoverPhase(rule.incidentId, actor);
  } else {
    pushNotice(rule.incidentId, 'effect-restored', `任务 ${task.id} 已恢复`, `${actor} 复核通过，任务回到事件前作业基线${otherCovering.length ? '；仍被其他事件规则覆盖，保持暂停/改派' : ''}`, `restored-${effect.id}`);
    recordAudit('INCIDENT_RECOVERY_APPROVE', 'rule-effect', effectId, `批准恢复 ${task.id}`, actor);
  }
  return effect;
}
function maybeAutoRecoverPhase(incidentId: string, actor: string) {
  const incident = store.incidents.find(item => item.id === incidentId) as Incident;
  const pending = store.rules.filter(rule => rule.incidentId === incidentId && !rule.liftedAt);
  if (pending.length === 0 && incident.status === 'active' && incident.phase !== 'recovery') {
    incident.phase = 'recovery';
    const entry: IncidentPhaseEntry = { id: nextId('PHS', entryIds), incidentId, phase: 'recovery', note: '全部临时规则解除并恢复完成，自动转入恢复阶段', actor, at: nowIso() };
    store.phases.unshift(entry);
    pushNotice(incidentId, 'phase-change', `${incident.title} 进入恢复阶段`, entry.note, `phase-${entry.id}`);
  }
}
export function closeIncident(id: string, opts: { force?: boolean; note?: string } = {}, actor = '事件指挥官') {
  const incident = store.incidents.find(item => item.id === id);
  if (!incident) return undefined;
  if (incident.status === 'closed') throw new Error('事件已关闭');
  const pendingRules = store.rules.filter(rule => rule.incidentId === id && !rule.liftedAt);
  const open = incidentUnrecovered(id);
  if (!opts.force && (pendingRules.length || open.effects.length)) {
    const reasons: string[] = [];
    if (pendingRules.length) reasons.push(`仍有 ${pendingRules.length} 条规则未解除（${pendingRules.map(r => r.id).join('、')}）`);
    if (open.effects.length) reasons.push(`${open.effects.length} 个任务作用未恢复（${[...new Set(open.effects.map(e => e.taskId))].join('、')}）`);
    throw new Error(`事件尚不能关闭：${reasons.join('；')}。如确认保留尾欠，可强制关闭并登记交接尾欠。`);
  }
  incident.status = 'closed'; incident.closedAt = nowIso(); incident.phase = 'recovery'; incident.closeNote = opts.note || '';
  if (opts.force && open.tasks.length) {
    incident.carryOver = { note: opts.note || '强制关闭，未恢复工作作为尾欠移交', at: incident.closedAt, items: open.tasks.map(item => `${item.task.id}（${item.task.containerId}）：${item.effects.map(e => e.state === 'review-pending' ? '待复核' : e.state === 'restore-failed' ? `恢复失败：${e.lastFailureReason}` : '管控中').join('；')}`) };
  }
  pushNotice(id, 'incident-closed', `事件 ${id} 已关闭`, opts.force && incident.carryOver ? `强制关闭，${open.tasks.length} 项未恢复工作登记为尾欠` : '全部处置与恢复完成，事件关闭归档', `close-${id}`);
  recordAudit('INCIDENT_CLOSE', 'incident', id, opts.force ? `强制关闭，尾欠 ${open.tasks.length} 项` : '正常关闭', actor);
  return incident;
}

// ── 查询：受影响对象 / 未恢复工作（控制台展示的是实体而非描述文本） ──

export function affectedObjects(incidentId: string) {
  const incident = store.incidents.find(item => item.id === incidentId);
  if (!incident) return undefined;
  const resolved = resolveScopeObjects(incident.scope);
  const ruleList = store.rules.filter(rule => rule.incidentId === incidentId);
  const hitTaskIds = new Set(store.effects.filter(effect => effect.incidentId === incidentId).map(effect => effect.taskId));
  scopeTasks(incident.scope).forEach(task => hitTaskIds.add(task.id));
  const tasksAffected = [...hitTaskIds].map(taskId => {
    const task = tasks.find(item => item.id === taskId);
    if (!task) return undefined;
    const otherIncidents = [...new Set(enforcedEffectsOnTask(taskId).map(effect => effect.incidentId).filter(rid => rid !== incidentId))];
    return { task, alsoCoveredBy: otherIncidents, suspended: isTaskPausedByIncident(taskId), ruleIds: activeRulesOnTask(taskId).map(rule => rule.id) };
  }).filter(Boolean);
  const taskContainerIds = new Set(tasksAffected.map((entry: any) => entry.task.containerId));
  resolved.containers.forEach(container => taskContainerIds.add(container.id));
  scopeTasks(incident.scope).forEach(task => taskContainerIds.add(task.containerId));
  const affectedAppointments = appointments.filter(appointment => taskContainerIds.has(appointment.containerId));
  return { ...resolved, tasks: tasksAffected, relatedContainers: containers.filter(container => taskContainerIds.has(container.id)), appointments: affectedAppointments, ruleCount: ruleList.length };
}
export function incidentUnrecovered(incidentId: string) {
  const openEffects = store.effects.filter(effect => effect.incidentId === incidentId && effect.state !== 'restored');
  const taskIds = new Set(openEffects.map(effect => effect.taskId));
  const result = [...taskIds].map(taskId => {
    const task = tasks.find(item => item.id === taskId);
    if (!task) return undefined;
    const effects = openEffects.filter(effect => effect.taskId === taskId);
    const covering = [...new Set(enforcedEffectsOnTask(taskId).map(effect => effect.incidentId))];
    return { task, effects, coveringIncidents: covering, pendingReview: effects.some(effect => effect.state === 'review-pending'), restoreFailed: effects.filter(effect => effect.state === 'restore-failed') };
  }).filter(Boolean);
  return { effects: openEffects, tasks: result as { task: YardTask; effects: RuleEffect[]; coveringIncidents: string[]; pendingReview: boolean; restoreFailed: RuleEffect[] }[] };
}
export function unrecoveredWork() {
  const open = store.effects.filter(effect => effect.state !== 'restored');
  const byTask = new Map<string, RuleEffect[]>();
  for (const effect of open) {
    if (!tasks.some(task => task.id === effect.taskId)) continue;
    byTask.set(effect.taskId, [...(byTask.get(effect.taskId) ?? []), effect]);
  }
  return [...byTask.entries()].map(([taskId, list]) => {
    const task = tasks.find(item => item.id === taskId) as YardTask;
    const incidentIds = [...new Set(list.map(entry => entry.incidentId))];
    const closedCarryOver = incidentIds.filter(id => store.incidents.find(item => item.id === id)?.status === 'closed');
    return {
      task, incidents: incidentIds.map(id => ({ id, title: store.incidents.find(item => item.id === id)?.title, closed: store.incidents.find(item => item.id === id)?.status === 'closed' })),
      pendingReview: list.some(entry => entry.state === 'review-pending'),
      restoreFailed: list.filter(entry => entry.state === 'restore-failed'),
      carriedOverFromClosed: closedCarryOver,
    };
  });
}
function phaseLabel(phase: string) {
  return phase === 'detection' ? '发现接报' : phase === 'containment' ? '先期封控' : phase === 'response' ? '处置中' : phase === 'recovery' ? '恢复评估' : '关闭';
}
export function incidentSummary(id: string) {
  const incident = store.incidents.find(item => item.id === id);
  if (!incident) return undefined;
  const effects = store.effects.filter(effect => effect.incidentId === id);
  const ruleList = store.rules.filter(rule => rule.incidentId === id);
  const pausedTaskIds = new Set(effects.filter(effect => {
    const rule = store.rules.find(r => r.id === effect.ruleId);
    return effect.state !== 'restored' && !rule?.liftedAt && rule?.action === 'pause-tasks';
  }).map(effect => effect.taskId));
  const affected = affectedObjects(id) as NonNullable<ReturnType<typeof affectedObjects>>;
  return {
    incident,
    ruleCount: ruleList.length,
    rulesLifted: ruleList.filter(rule => rule.liftedAt).length,
    pausedTasks: pausedTaskIds.size,
    affectedTasks: affected.tasks.length,
    affectedContainers: affected.relatedContainers.length,
    pendingReview: effects.filter(effect => effect.state === 'review-pending').length,
    restoreFailed: effects.filter(effect => effect.state === 'restore-failed').length,
    unrecoveredTasks: incidentUnrecovered(id).tasks.length,
  };
}
export function listIncidents() {
  return store.incidents.map(incident => incidentSummary(incident.id) as NonNullable<ReturnType<typeof incidentSummary>>);
}
interface TimelineEntry { kind: string; at: string; actor: string; title: string; note?: string }
export function incidentDetail(id: string) {
  const incident = store.incidents.find(item => item.id === id);
  if (!incident) return undefined;
  const ruleList = store.rules.filter(rule => rule.incidentId === id).map(rule => ({
    ...rule,
    effects: store.effects.filter(effect => effect.ruleId === rule.id).map(effect => ({ ...effect, task: tasks.find(task => task.id === effect.taskId) })),
  }));
  const timeline: TimelineEntry[] = [
    ...store.phases.filter(entry => entry.incidentId === id).map(entry => ({ kind: 'phase', at: entry.at, actor: entry.actor, title: `${phaseLabel(entry.phase)}：${entry.note}` })),
    ...store.handovers.filter(entry => entry.incidentId === id).map(entry => ({ kind: 'handover', at: entry.at, actor: entry.actor, title: `指挥权交接：${entry.fromCommander} → ${entry.toCommander}`, note: entry.reason })),
    ...store.evidences.filter(entry => entry.incidentId === id).map(entry => ({ kind: 'evidence', at: entry.at, actor: entry.actor, title: `证据${entry.afterClosure ? '（关闭后补录）' : ''}：${entry.title}`, note: entry.note })),
    ...ruleList.map(rule => ({ kind: 'rule-published', at: rule.createdAt, actor: rule.publishedBy, title: `发布规则 ${rule.id}：${rule.action === 'pause-tasks' ? '暂停任务' : `改派至 ${rule.fallbackEquipmentId}`}` })),
    ...ruleList.filter(rule => rule.liftRequestedAt).map(rule => ({ kind: 'lift-requested', at: rule.liftRequestedAt as string, actor: '', title: `规则 ${rule.id} 提交解除复核` })),
    ...ruleList.filter(rule => rule.liftedAt).map(rule => ({ kind: 'rule-lifted', at: rule.liftedAt as string, actor: '', title: `规则 ${rule.id} 解除完成` })),
    ...(incident.closedAt ? [{ kind: 'closed', at: incident.closedAt as string, actor: '', title: `事件关闭${incident.carryOver ? `（强制关闭，尾欠 ${incident.carryOver.items.length} 项）` : ''}` }] : []),
  ].sort((a, b) => b.at.localeCompare(a.at));
  return {
    incident,
    scopeObjects: resolveScopeObjects(incident.scope),
    affected: affectedObjects(id),
    unrecovered: incidentUnrecovered(id),
    rules: ruleList,
    phases: store.phases.filter(entry => entry.incidentId === id),
    handovers: store.handovers.filter(entry => entry.incidentId === id),
    evidences: store.evidences.filter(entry => entry.incidentId === id),
    notices: store.notices.filter(notice => notice.incidentId === id),
    carryOver: incident.carryOver,
    timeline,
  };
}
export function listNotices() { return store.notices; }
export function markNoticesRead(ids?: string[]) {
  for (const notice of store.notices) if (!ids || ids.includes(notice.id)) notice.read = true;
  return store.notices;
}

// ── 种子事件：设备故障 + 海关临时管制，覆盖同一任务演示多事件叠加 ──
(function seedIncidents() {
  const fault = createIncident({ id: 'INC-2410-01', title: '场桥 YC-12 起升机构异常停机', type: 'equipment-fault', severity: 'major', scope: [{ type: 'equipment', ref: 'YC-12' }], commander: '值班经理 高源', description: 'YC-12 起升钢丝绳异响，机务要求停机检查；影响 B07 相关收发箱任务' }, '值班经理 高源');
  publishRule(fault.id, { action: 'pause-tasks', memo: 'YC-12 停机检修，所有指派该机的任务暂停，等待机务放行' }, '值班经理 高源');
  registerPhase(fault.id, 'containment', '现场设置警戒，YC-12 停止动作，已通知机务', '值班经理 高源');
  registerPhase(fault.id, 'response', '机务组到场更换滑轮组件，预计 40 分钟', '应急主任 林岚');
  handoverCommander(fault.id, { fromCommander: '值班经理 高源', toCommander: '应急主任 林岚', reason: '白夜班交接，处置继续由夜班应急主任统一指挥' }, '值班经理 高源');

  const customs = createIncident({ id: 'INC-2410-02', title: '海关临时布控：B07 中转箱查验管制', type: 'customs-control', severity: 'critical', scope: [{ type: 'block', ref: 'B07' }, { type: 'container', ref: 'TGHU-9831204' }], commander: '卡口值班员 赵辛', description: '海关缉私部门临时布控 B07 区块中转箱，未经查验放行不得移位；危化品箱 TGHU-9831204 一并纳管' }, '卡口值班员 赵辛');
  publishRule(customs.id, { action: 'pause-tasks', memo: '海关布控期间 B07 进出箱任务一律暂停，凭海关解除书复核恢复' }, '卡口值班员 赵辛');
})();
