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
  { id: 'YC-12', name: '场桥 YC-12', kind: 'yard-crane', status: 'maintenance', location: 'B07-R03', battery: 72, queue: 9, movesPerHour: 24 },
  { id: 'YC-05', name: '场桥 YC-05', kind: 'yard-crane', status: 'available', location: 'C03-R06', battery: 88, queue: 3, movesPerHour: 27 },
  { id: 'TT-31', name: '集卡 TT-31', kind: 'terminal-truck', status: 'working', location: '南闸口', battery: 61, queue: 2, movesPerHour: 8 },
  { id: 'RS-02', name: '正面吊 RS-02', kind: 'reach-stacker', status: 'maintenance', location: 'D05', battery: 34, queue: 0, movesPerHour: 14 }
];
export const tasks: YardTask[] = [
  { id: 'TASK-101', kind: 'deliver', containerId: 'MSCU-4829017', from: 'A01-R07-T3', to: '南闸口', equipmentId: 'YC-12', priority: 92, status: 'assigned', scheduledAt: iso(12), blockingReasons: [], estimatedMinutes: 18 },
  { id: 'TASK-102', kind: 'rehandle', containerId: 'EISU-1288420', from: 'B07-R03-T2', to: 'D05-R05-T1', equipmentId: 'YC-12', priority: 88, status: 'queued', scheduledAt: iso(24), blockingReasons: ['查验区插件余量接近阈值'], estimatedMinutes: 26 },
  { id: 'TASK-103', kind: 'inspect', containerId: 'TGHU-9831204', from: 'D05-R02-T1', to: 'D05-R02-T1', priority: 125, status: 'blocked', scheduledAt: iso(4), blockingReasons: ['RS-02 维护中', '待海关查验窗口'], estimatedMinutes: 32 },
  { id: 'TASK-104', kind: 'load', containerId: 'FCIU-9920310', from: 'C03-R04-T2', to: 'B07 / VOY-QF2', equipmentId: 'YC-05', priority: 75, status: 'queued', scheduledAt: iso(76), blockingReasons: [], estimatedMinutes: 21 },
  { id: 'TASK-105', kind: 'rehandle', containerId: 'TEMU-1774029', from: 'D05-R05-T1', to: 'D05-R02-T2', equipmentId: 'RS-02', priority: 60, status: 'assigned', scheduledAt: iso(30), blockingReasons: [], estimatedMinutes: 24 }
];
export const auditEvents: AuditEvent[] = [{ id: 'AUD-500', actor: '中控调度员', action: 'REPLAN', entity: 'voyage', entityId: 'VOY-AX7', at: new Date(start - 20 * 60000).toISOString(), details: '因 QC-07 瞬时降速，重新计算 14 个高优先级作业' }];

function parseSlot(slot: string) { const match = slot.match(/^([A-Z]\d\d)-/); return match?.[1]; }
export function dashboard() {
  const activeVoyages = voyages.filter(v => v.status !== 'departed');
  const yardCapacity = blocks.reduce((sum, block) => sum + block.capacity, 0); const yardOccupied = blocks.reduce((sum, block) => sum + block.occupied, 0);
  const allImpacts = incidents.flatMap(incident => incident.rules).flatMap(rule => rule.impacts);
  return { activeVoyages: activeVoyages.length, berthMoves: activeVoyages.reduce((sum, v) => sum + v.movesPlanned - v.movesDone, 0), yardUtilization: yardOccupied / yardCapacity, gateQueue: appointments.filter(a => a.status === 'checked-in').length + 7, pendingTasks: tasks.filter(t => t.status !== 'done').length, blockedTasks: tasks.filter(t => t.status === 'blocked').length, reeferAlerts: containers.filter(c => c.reefer && (c.customs === 'inspection' || (c.temperature ?? 0) > 5)).length, hazmatHolds: containers.filter(c => c.hazmatClass && c.customs !== 'released').length, lateVessels: activeVoyages.filter(v => v.lateRisk === 'high').length, activeIncidents: incidents.filter(i => i.status === 'active').length, heldTasks: new Set(allImpacts.filter(im => im.status === 'applied').map(im => im.taskId)).size, restoreFailures: allImpacts.filter(im => im.status === 'restore-failed').length };
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
export function assignTask(id: string, equipmentId: string) { const task = tasks.find(item => item.id === id); const machine = equipment.find(item => item.id === equipmentId); if (!task || !machine) return undefined; const blockingReasons = [...task.blockingReasons]; if (machine.status === 'maintenance' || machine.status === 'offline') blockingReasons.push(`${machine.name} 当前不可用`); if (task.kind === 'inspect' && machine.kind !== 'reach-stacker') blockingReasons.push('查验作业需要正面吊或专用设备'); task.equipmentId = equipmentId; task.status = blockingReasons.length ? 'blocked' : 'assigned'; task.blockingReasons = blockingReasons; auditEvents.unshift({ id: `AUD-${Date.now()}`, actor: '中控调度员', action: 'ASSIGN_TASK', entity: 'yard-task', entityId: id, at: new Date().toISOString(), details: `${equipmentId} -> ${task.containerId}` }); return task; }
export function containerDetail(id: string) { const container = containers.find(item => item.id === id); if (!container) return undefined; return { container, voyage: voyages.find(v => v.id === container.voyageId), appointment: appointments.find(a => a.id === container.appointmentId), plan: containerPlan(id), tasks: tasks.filter(t => t.containerId === id) }; }

export type ContainerInput = Omit<Container, 'lastEvent' | 'appointmentId'> & { appointmentId?: string };
export type AppointmentInput = Pick<GateAppointment, 'containerId' | 'truckNo' | 'driver' | 'type' | 'windowStart' | 'windowEnd' | 'lane'>;
export type TaskInput = Pick<YardTask, 'kind' | 'containerId' | 'from' | 'to' | 'priority' | 'scheduledAt' | 'estimatedMinutes'> & { equipmentId?: string };

function recordAudit(action: string, entity: string, entityId: string, details: string) {
  auditEvents.unshift({ id: `AUD-${Date.now()}`, actor: '中控调度员', action, entity, entityId, at: new Date().toISOString(), details });
}

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
  for (const task of removedTasks) tasks.splice(tasks.indexOf(task), 1);
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

let yardTaskSeq = 0;
export function createYardTask(input: TaskInput) {
  if (!containers.some(container => container.id === input.containerId)) throw new Error('关联箱号不存在');
  if (input.priority < 1 || input.priority > 100) throw new Error('优先级范围为 1–100');
  if (input.estimatedMinutes <= 0) throw new Error('预计作业时长必须大于 0');
  const item: YardTask = { ...input, id: `TASK-${Date.now()}-${++yardTaskSeq}`, status: input.equipmentId ? 'assigned' : 'queued', blockingReasons: [], scheduledAt: input.scheduledAt };
  tasks.unshift(item);
  for (const incident of incidents.filter(entry => entry.status === 'active')) {
    const containerIds = scopedContainerIds(incident.scope);
    for (const rule of incident.rules.filter(entry => entry.status === 'active')) {
      if (taskInScope(item, incident.scope, containerIds)) rule.impacts.push(applyRuleToTask(incident, rule, item));
    }
  }
  recordAudit('CREATE', 'yard-task', item.id, `创建 ${input.kind} 任务，关联 ${input.containerId}`);
  return item;
}

export function updateYardTask(id: string, patch: Partial<TaskInput & Pick<YardTask, 'status' | 'blockingReasons'>>) {
  const item = tasks.find(task => task.id === id);
  if (!item) return undefined;
  if (patch.containerId && !containers.some(container => container.id === patch.containerId)) throw new Error('关联箱号不存在');
  if (patch.priority !== undefined && (patch.priority < 1 || patch.priority > 100)) throw new Error('优先级范围为 1–100');
  Object.assign(item, patch);
  recordAudit('UPDATE', 'yard-task', id, `更新场内作业任务：${JSON.stringify(patch)}`);
  return item;
}

export function deleteYardTask(id: string) {
  const index = tasks.findIndex(item => item.id === id);
  if (index < 0) return undefined;
  const [item] = tasks.splice(index, 1);
  const released = allImpacts().filter(im => im.taskId === id && im.status === 'applied');
  released.forEach(im => { im.status = 'superseded'; im.restoreNote = '任务已删除，事件持有自动解除'; im.resolvedAt = nowIso(); });
  recordAudit('DELETE', 'yard-task', id, `删除 ${item.containerId} 的场内任务${released.length ? `，并解除 ${released.length} 项事件持有` : ''}`);
  return item;
}

export function updateEquipment(id: string, patch: Partial<Pick<Equipment, 'status' | 'location' | 'battery' | 'queue'>>) {
  const item = equipment.find(entry => entry.id === id);
  if (!item) return undefined;
  Object.assign(item, patch);
  recordAudit('UPDATE', 'equipment', id, `更新设备状态：${JSON.stringify(patch)}`);
  return item;
}

// ================= 作业事件指挥台 =================
export type IncidentKind = 'equipment-failure' | 'customs-control' | 'gate-congestion' | 'yard-safety' | 'weather';
export type IncidentSeverity = 'critical' | 'major' | 'minor';
export type IncidentPhase = 'detected' | 'assessing' | 'mitigating' | 'recovering' | 'closed';
export type RuleAction = 'pause-tasks' | 'reassign-tasks';
export type ImpactStatus = 'applied' | 'restored' | 'restore-failed' | 'superseded';
export interface IncidentScope { voyageIds: string[]; blockIds: string[]; equipmentIds: string[]; containerIds: string[]; }
export interface PhaseEntry { id: string; phase: IncidentPhase; note: string; actor: string; at: string; }
export interface HandoverEntry { id: string; from: string; to: string; note: string; actor: string; at: string; }
export interface EvidenceEntry { id: string; kind: 'photo' | 'log' | 'telemetry' | 'statement' | 'work-order' | 'other'; title: string; note: string; uri?: string; addedBy: string; at: string; postClose: boolean; }
export interface NotificationEntry { id: string; audience: string; topic: string; message: string; status: 'sent' | 'deduped'; at: string; }
export interface RuleImpact {
  id: string; seq: number; ruleId: string; taskId: string; action: 'paused' | 'reassigned';
  previousStatus: TaskStatus; previousEquipmentId?: string; previousBlockingReasons: string[];
  status: ImpactStatus; restoreNote?: string; appliedAt: string; resolvedAt?: string;
}
export interface IncidentRule {
  id: string; action: RuleAction; note: string; targetEquipmentId?: string;
  status: 'active' | 'lifted'; createdBy: string; createdAt: string;
  liftedBy?: string; liftedAt?: string; reviewNote?: string;
  impacts: RuleImpact[];
}
export interface Incident {
  id: string; title: string; kind: IncidentKind; severity: IncidentSeverity;
  status: 'active' | 'closed'; phase: IncidentPhase; commander: string;
  scope: IncidentScope; phases: PhaseEntry[]; rules: IncidentRule[];
  handovers: HandoverEntry[]; evidence: EvidenceEntry[]; notifications: NotificationEntry[];
  openedAt: string; closedAt?: string; closeSummary?: string;
}
export interface RestoreReportItem { taskId: string; result: ImpactStatus; note?: string; }

export const incidents: Incident[] = [];
const idCounters: Record<string, number> = {};
let impactSeq = 0;
const nextId = (prefix: string) => { idCounters[prefix] = (idCounters[prefix] ?? 0) + 1; return `${prefix}-${String(idCounters[prefix]).padStart(4, '0')}`; };
const nowIso = () => new Date().toISOString();
const phaseOrder: IncidentPhase[] = ['detected', 'assessing', 'mitigating', 'recovering', 'closed'];
const incidentKinds: IncidentKind[] = ['equipment-failure', 'customs-control', 'gate-congestion', 'yard-safety', 'weather'];
const incidentSeverities: IncidentSeverity[] = ['critical', 'major', 'minor'];

function locationBlock(location?: string) { return location?.match(/^([A-Z]\d\d)(?=[-/\s]|$)/)?.[1]; }
function scopeEntities(scope: IncidentScope) { return [...scope.voyageIds, ...scope.blockIds, ...scope.equipmentIds, ...scope.containerIds]; }
function scopedContainerIds(scope: IncidentScope): Set<string> {
  const ids = new Set(scope.containerIds);
  containers.forEach(container => {
    if (scope.voyageIds.includes(container.voyageId)) ids.add(container.id);
    const block = locationBlock(container.yardSlot);
    if (block && scope.blockIds.includes(block)) ids.add(container.id);
  });
  return ids;
}
function taskInScope(task: YardTask, scope: IncidentScope, containerIds: Set<string>): boolean {
  if (containerIds.has(task.containerId)) return true;
  if (task.equipmentId && scope.equipmentIds.includes(task.equipmentId)) return true;
  const from = locationBlock(task.from); if (from && scope.blockIds.includes(from)) return true;
  const to = locationBlock(task.to); if (to && scope.blockIds.includes(to)) return true;
  return false;
}
function allImpacts() { return incidents.flatMap(incident => incident.rules).flatMap(rule => rule.impacts); }
function impactIncident(impactId: string) { return incidents.find(incident => incident.rules.some(rule => rule.impacts.some(im => im.id === impactId))); }

function audiencesFor(incident: Incident): string[] {
  const audiences = new Set<string>(['中控调度']);
  incident.scope.voyageIds.forEach(id => audiences.add(`航次计划·${id}`));
  incident.scope.blockIds.forEach(id => audiences.add(`堆场主管·${id}`));
  incident.scope.equipmentIds.forEach(id => audiences.add(`设备班组·${id}`));
  if (incident.scope.containerIds.length) audiences.add('箱务值班');
  return [...audiences];
}
function notify(incident: Incident, topic: string, message: string) {
  let sent = 0; let deduped = 0;
  for (const audience of audiencesFor(incident)) {
    const duplicate = incident.notifications.some(entry => entry.audience === audience && entry.topic === topic && entry.message === message && entry.status === 'sent');
    incident.notifications.unshift({ id: nextId('NTF'), audience, topic, message, status: duplicate ? 'deduped' : 'sent', at: nowIso() });
    if (duplicate) deduped += 1; else sent += 1;
  }
  return { sent, deduped };
}

function applyRuleToTask(incident: Incident, rule: IncidentRule, task: YardTask): RuleImpact {
  const impact: RuleImpact = {
    id: nextId('IMP'), seq: ++impactSeq, ruleId: rule.id, taskId: task.id, action: rule.action === 'pause-tasks' ? 'paused' : 'reassigned',
    previousStatus: task.status, previousEquipmentId: task.equipmentId, previousBlockingReasons: [...task.blockingReasons],
    status: 'applied', appliedAt: nowIso()
  };
  if (task.status === 'done') { impact.status = 'superseded'; impact.restoreNote = '任务已完成，规则未生效'; return impact; }
  const tag = `[${incident.id}]`;
  if (rule.action === 'pause-tasks') {
    task.status = 'blocked';
    task.blockingReasons = [...task.blockingReasons, `${tag} 事件暂停：${rule.note}`];
  } else {
    const target = equipment.find(entry => entry.id === rule.targetEquipmentId);
    task.equipmentId = rule.targetEquipmentId;
    if (!target || target.status === 'maintenance' || target.status === 'offline') {
      task.status = 'blocked';
      task.blockingReasons = [...task.blockingReasons, `${tag} 事件改派失败：目标设备 ${rule.targetEquipmentId} 不可用`];
      impact.restoreNote = '改派目标设备不可用，任务已挂起';
    } else {
      task.status = 'assigned';
    }
  }
  return impact;
}

function restoreImpact(incident: Incident, impact: RuleImpact): void {
  const task = tasks.find(entry => entry.id === impact.taskId);
  if (!task) { impact.status = 'restore-failed'; impact.restoreNote = '任务已删除，无法恢复'; impact.resolvedAt = nowIso(); return; }
  if (task.status === 'done') { impact.status = 'restored'; impact.restoreNote = '任务已完成，无需恢复'; impact.resolvedAt = nowIso(); return; }
  if (task.status === 'executing') { impact.status = 'restore-failed'; impact.restoreNote = '任务执行中，需现场确认安全后才能恢复'; return; }
  const tag = `[${incident.id}]`;
  const remainingReasons = task.blockingReasons.filter(reason => !reason.startsWith(tag));
  const otherHolds = allImpacts().filter(im => im.taskId === task.id && im.status === 'applied' && im.id !== impact.id);
  if (otherHolds.length) {
    const holders = [...new Set(otherHolds.map(im => impactIncident(im.id)?.id ?? im.ruleId))];
    task.status = 'blocked';
    task.blockingReasons = remainingReasons;
    impact.status = 'restored';
    impact.restoreNote = `本事件持有已解除，任务仍被 ${holders.join('、')} 持有`;
    impact.resolvedAt = nowIso();
    return;
  }
  const snapshot = allImpacts().filter(im => im.taskId === task.id).sort((a, b) => a.seq - b.seq)[0] ?? impact;
  const machine = snapshot.previousEquipmentId ? equipment.find(entry => entry.id === snapshot.previousEquipmentId) : undefined;
  if (machine && (machine.status === 'maintenance' || machine.status === 'offline')) {
    impact.status = 'restore-failed';
    impact.restoreNote = `恢复失败：${machine.name} 仍不可用`;
    task.status = 'blocked';
    task.blockingReasons = [...remainingReasons, `${tag} 恢复失败：${machine.name} 仍不可用`];
    return;
  }
  task.status = snapshot.previousStatus;
  task.equipmentId = snapshot.previousEquipmentId;
  task.blockingReasons = [...snapshot.previousBlockingReasons];
  impact.status = 'restored';
  impact.resolvedAt = nowIso();
}

function affectedTaskIdSet(incident: Incident): Set<string> {
  const containerIds = scopedContainerIds(incident.scope);
  const ids = new Set(tasks.filter(task => taskInScope(task, incident.scope, containerIds)).map(task => task.id));
  incident.rules.forEach(rule => rule.impacts.forEach(im => ids.add(im.taskId)));
  return ids;
}
function incidentOverlaps(incident: Incident, includeClosed = false) {
  const myTasks = affectedTaskIdSet(incident);
  const myEntities = new Set(scopeEntities(incident.scope));
  return incidents
    .filter(other => other.id !== incident.id && (includeClosed || other.status === 'active'))
    .map(other => {
      const sharedTasks = [...affectedTaskIdSet(other)].filter(id => myTasks.has(id)).map(id => `任务 ${id}`);
      const sharedEntities = scopeEntities(other.scope).filter(entity => myEntities.has(entity));
      return { incidentId: other.id, title: other.title, shared: [...new Set([...sharedEntities, ...sharedTasks])] };
    })
    .filter(entry => entry.shared.length > 0);
}

export interface IncidentInput { title: string; kind: IncidentKind; severity: IncidentSeverity; commander: string; scope: IncidentScope; note?: string; }
export function createIncident(input: IncidentInput) {
  const title = input.title?.trim();
  if (!title) throw new Error('事件标题不能为空');
  const commander = input.commander?.trim();
  if (!commander) throw new Error('处置人不能为空');
  if (!incidentKinds.includes(input.kind)) throw new Error('事件类型不合法');
  if (!incidentSeverities.includes(input.severity)) throw new Error('严重级别不合法');
  const scope: IncidentScope = {
    voyageIds: input.scope?.voyageIds ?? [], blockIds: input.scope?.blockIds ?? [],
    equipmentIds: input.scope?.equipmentIds ?? [], containerIds: input.scope?.containerIds ?? []
  };
  scope.voyageIds.forEach(id => { if (!voyages.some(item => item.id === id)) throw new Error(`航次 ${id} 不存在`); });
  scope.blockIds.forEach(id => { if (!blocks.some(item => item.id === id)) throw new Error(`区块 ${id} 不存在`); });
  scope.equipmentIds.forEach(id => { if (!equipment.some(item => item.id === id)) throw new Error(`设备 ${id} 不存在`); });
  scope.containerIds.forEach(id => { if (!containers.some(item => item.id === id)) throw new Error(`箱号 ${id} 不存在`); });
  if (!scopeEntities(scope).length) throw new Error('影响范围至少需要一个航次、区块、设备或箱号');
  const incident: Incident = {
    id: nextId('INC'), title, kind: input.kind, severity: input.severity, status: 'active', phase: 'detected', commander, scope,
    phases: [{ id: nextId('PHS'), phase: 'detected', note: input.note?.trim() || '事件创建，现场情况待确认', actor: commander, at: nowIso() }],
    rules: [], handovers: [], evidence: [], notifications: [], openedAt: nowIso()
  };
  incidents.unshift(incident);
  notify(incident, 'incident-opened', `事件 ${incident.id} 开启：${title}（${commander} 负责处置）`);
  recordAudit('OPEN', 'incident', incident.id, `开启事件：${title}，范围 ${scopeEntities(scope).join('、')}`);
  return incidentDetail(incident.id);
}

export function registerPhase(incidentId: string, input: { phase: IncidentPhase; note: string; actor?: string }) {
  const incident = incidents.find(entry => entry.id === incidentId);
  if (!incident) return undefined;
  if (incident.status === 'closed') throw new Error('事件已关闭，不能登记新阶段');
  if (input.phase === 'closed') throw new Error('请通过关闭事件操作进入关闭阶段');
  if (!phaseOrder.includes(input.phase)) throw new Error('处置阶段不合法');
  if (phaseOrder.indexOf(input.phase) <= phaseOrder.indexOf(incident.phase)) throw new Error('处置阶段只能向前推进，不能回退或重复登记');
  if (!input.note?.trim()) throw new Error('阶段说明不能为空');
  const entry: PhaseEntry = { id: nextId('PHS'), phase: input.phase, note: input.note.trim(), actor: input.actor?.trim() || incident.commander, at: nowIso() };
  incident.phase = input.phase;
  incident.phases.push(entry);
  notify(incident, `phase:${input.phase}`, `事件 ${incident.id} 进入${input.phase}阶段：${entry.note}`);
  recordAudit('PHASE', 'incident', incidentId, `进入 ${input.phase} 阶段`);
  return entry;
}

export function publishRule(incidentId: string, input: { action: RuleAction; note: string; targetEquipmentId?: string; createdBy?: string }) {
  const incident = incidents.find(entry => entry.id === incidentId);
  if (!incident) return undefined;
  if (incident.status === 'closed') throw new Error('事件已关闭，不能发布规则');
  if (input.action !== 'pause-tasks' && input.action !== 'reassign-tasks') throw new Error('规则动作不合法');
  if (!input.note?.trim()) throw new Error('规则说明不能为空');
  if (input.action === 'reassign-tasks') {
    if (!input.targetEquipmentId) throw new Error('改派规则必须指定目标设备');
    if (!equipment.some(entry => entry.id === input.targetEquipmentId)) throw new Error('目标设备不存在');
  }
  const rule: IncidentRule = {
    id: nextId('RULE'), action: input.action, note: input.note.trim(), targetEquipmentId: input.targetEquipmentId,
    status: 'active', createdBy: input.createdBy?.trim() || incident.commander, createdAt: nowIso(), impacts: []
  };
  const containerIds = scopedContainerIds(incident.scope);
  tasks.filter(task => taskInScope(task, incident.scope, containerIds)).forEach(task => rule.impacts.push(applyRuleToTask(incident, rule, task)));
  incident.rules.push(rule);
  const applied = rule.impacts.filter(im => im.status === 'applied').length;
  notify(incident, `rule-published:${rule.id}`, `临时规则生效（${rule.action === 'pause-tasks' ? '暂停任务' : '改派任务'}）：${rule.note}，影响 ${applied} 项任务`);
  recordAudit('PUBLISH_RULE', 'incident', incidentId, `${rule.id} ${rule.action}，命中 ${rule.impacts.length} 个任务`);
  return rule;
}

export function liftRule(incidentId: string, ruleId: string, input: { reviewer: string; note?: string }) {
  const incident = incidents.find(entry => entry.id === incidentId);
  if (!incident) return undefined;
  const rule = incident.rules.find(entry => entry.id === ruleId);
  if (!rule) return undefined;
  if (incident.status === 'closed') throw new Error('事件已关闭，规则状态不可变更；未恢复的工作请使用恢复重试');
  if (rule.status !== 'active') throw new Error('规则已解除，请勿重复操作');
  const reviewer = input.reviewer?.trim();
  if (!reviewer) throw new Error('解除规则必须填写复核人');
  if (reviewer === rule.createdBy) throw new Error('复核人不能与规则发布人相同，需独立复核');
  rule.status = 'lifted'; rule.liftedBy = reviewer; rule.liftedAt = nowIso(); rule.reviewNote = input.note?.trim() || undefined;
  const report: RestoreReportItem[] = rule.impacts
    .filter(im => im.status === 'applied')
    .map(im => { restoreImpact(incident, im); return { taskId: im.taskId, result: im.status, note: im.restoreNote }; });
  notify(incident, `rule-lifted:${rule.id}`, `临时规则已解除（复核：${reviewer}）：${rule.note}`);
  const failed = report.filter(item => item.result === 'restore-failed');
  if (failed.length) notify(incident, `restore-failed:${rule.id}`, `${failed.length} 项任务恢复失败：${failed.map(item => item.taskId).join('、')}，请人工跟进`);
  recordAudit('LIFT_RULE', 'incident', incidentId, `解除规则 ${ruleId}，恢复 ${report.length} 项，失败 ${failed.length} 项`);
  return { rule, report };
}

export function retryRestore(incidentId: string, ruleId: string, input: { actor?: string }) {
  const incident = incidents.find(entry => entry.id === incidentId);
  if (!incident) return undefined;
  const rule = incident.rules.find(entry => entry.id === ruleId);
  if (!rule) return undefined;
  if (rule.status !== 'lifted') throw new Error('规则尚未解除，无需恢复重试');
  const failed = rule.impacts.filter(im => im.status === 'restore-failed');
  if (!failed.length) throw new Error('该规则没有恢复失败的任务');
  const report: RestoreReportItem[] = failed.map(im => { restoreImpact(incident, im); return { taskId: im.taskId, result: im.status, note: im.restoreNote }; });
  const stillFailed = report.filter(item => item.result === 'restore-failed');
  if (stillFailed.length) notify(incident, `restore-failed:${rule.id}`, `恢复重试后仍有 ${stillFailed.length} 项失败：${stillFailed.map(item => item.taskId).join('、')}`);
  recordAudit('RESTORE_RETRY', 'incident', incidentId, `${input.actor?.trim() || incident.commander} 重试恢复 ${ruleId}：${report.map(item => `${item.taskId}=${item.result}`).join(', ')}`);
  return { rule, report };
}

export function handoverIncident(incidentId: string, input: { to: string; note?: string; actor?: string }) {
  const incident = incidents.find(entry => entry.id === incidentId);
  if (!incident) return undefined;
  if (incident.status === 'closed') throw new Error('事件已关闭，不能交接');
  const to = input.to?.trim();
  if (!to) throw new Error('接任人不能为空');
  if (to === incident.commander) throw new Error('接任人与当前处置人相同，无需交接');
  const entry: HandoverEntry = { id: nextId('HND'), from: incident.commander, to, note: input.note?.trim() ?? '', actor: input.actor?.trim() || incident.commander, at: nowIso() };
  incident.handovers.push(entry);
  incident.commander = to;
  notify(incident, `handover:${entry.id}`, `处置人交接：${entry.from} → ${to}${entry.note ? `。${entry.note}` : ''}`);
  recordAudit('HANDOVER', 'incident', incidentId, `${entry.from} -> ${to}`);
  return entry;
}

export function addEvidence(incidentId: string, input: { kind?: EvidenceEntry['kind']; title: string; note?: string; uri?: string; addedBy?: string }) {
  const incident = incidents.find(entry => entry.id === incidentId);
  if (!incident) return undefined;
  if (!input.title?.trim()) throw new Error('证据标题不能为空');
  const entry: EvidenceEntry = {
    id: nextId('EVD'), kind: input.kind ?? 'other', title: input.title.trim(), note: input.note?.trim() ?? '',
    uri: input.uri?.trim() || undefined, addedBy: input.addedBy?.trim() || incident.commander, at: nowIso(), postClose: incident.status === 'closed'
  };
  incident.evidence.push(entry);
  recordAudit(entry.postClose ? 'POST_CLOSE_EVIDENCE' : 'EVIDENCE', 'incident', incidentId, `${entry.postClose ? '关闭后补录证据' : '登记证据'}：${entry.title}`);
  return entry;
}

export function broadcastIncident(incidentId: string, input: { message: string }) {
  const incident = incidents.find(entry => entry.id === incidentId);
  if (!incident) return undefined;
  const message = input.message?.trim();
  if (!message) throw new Error('通知内容不能为空');
  const result = notify(incident, 'manual-broadcast', message);
  recordAudit('BROADCAST', 'incident', incidentId, `人工通知：发送 ${result.sent}，去重 ${result.deduped}`);
  return result;
}

export function closeIncident(incidentId: string, input: { actor?: string; summary: string }) {
  const incident = incidents.find(entry => entry.id === incidentId);
  if (!incident) return undefined;
  if (incident.status === 'closed') throw new Error('事件已关闭');
  const activeRules = incident.rules.filter(rule => rule.status === 'active');
  if (activeRules.length) throw new Error(`尚有 ${activeRules.length} 条临时规则未解除，需先经人工复核解除后再关闭`);
  if (incident.phase !== 'recovering') throw new Error('事件需推进到恢复阶段后才能关闭');
  if (!input.summary?.trim()) throw new Error('关闭总结不能为空');
  incident.status = 'closed';
  incident.phase = 'closed';
  incident.closedAt = nowIso();
  incident.closeSummary = input.summary.trim();
  incident.phases.push({ id: nextId('PHS'), phase: 'closed', note: incident.closeSummary, actor: input.actor?.trim() || incident.commander, at: nowIso() });
  const unrecovered = incident.rules.flatMap(rule => rule.impacts).filter(im => im.status === 'restore-failed').length;
  notify(incident, 'incident-closed', `事件 ${incident.id} 已关闭：${incident.closeSummary}${unrecovered ? `（仍有 ${unrecovered} 项工作待恢复）` : ''}`);
  recordAudit('CLOSE', 'incident', incidentId, `关闭事件；遗留未恢复工作 ${unrecovered} 项`);
  return incidentDetail(incidentId);
}

export function incidentSummaries() {
  return incidents.map(incident => ({
    id: incident.id, title: incident.title, kind: incident.kind, severity: incident.severity, status: incident.status,
    phase: incident.phase, commander: incident.commander, openedAt: incident.openedAt, closedAt: incident.closedAt, scope: incident.scope,
    counts: {
      rules: incident.rules.length,
      activeRules: incident.rules.filter(rule => rule.status === 'active').length,
      heldTasks: new Set(incident.rules.flatMap(rule => rule.impacts).filter(im => im.status === 'applied').map(im => im.taskId)).size,
      restoreFailures: incident.rules.flatMap(rule => rule.impacts).filter(im => im.status === 'restore-failed').length,
      evidence: incident.evidence.length
    },
    overlappingIncidents: incidentOverlaps(incident).map(entry => entry.incidentId)
  })).sort((a, b) => (a.status === b.status ? b.openedAt.localeCompare(a.openedAt) : a.status === 'active' ? -1 : 1));
}

export function incidentDetail(incidentId: string) {
  const incident = incidents.find(entry => entry.id === incidentId);
  if (!incident) return undefined;
  const containerIds = scopedContainerIds(incident.scope);
  const impactedTaskIds = new Set(incident.rules.flatMap(rule => rule.impacts).map(im => im.taskId));
  const affectedTasks = tasks
    .filter(task => taskInScope(task, incident.scope, containerIds) || impactedTaskIds.has(task.id))
    .map(task => ({
      ...task,
      holds: allImpacts().filter(im => im.taskId === task.id).map(im => ({
        impactId: im.id, incidentId: impactIncident(im.id)?.id ?? '', ruleId: im.ruleId, action: im.action, status: im.status, restoreNote: im.restoreNote
      }))
    }));
  const unrecovered = incident.rules.flatMap(rule => rule.impacts
    .filter(im => im.status === 'applied' || im.status === 'restore-failed')
    .map(im => {
      const task = tasks.find(entry => entry.id === im.taskId);
      return { impactId: im.id, ruleId: rule.id, ruleStatus: rule.status, taskId: im.taskId, containerId: task?.containerId, taskStatus: task?.status ?? 'deleted', state: im.status === 'applied' ? 'held' as const : 'restore-failed' as const, restoreNote: im.restoreNote };
    }));
  return {
    ...incident,
    affected: {
      tasks: affectedTasks,
      containers: containers.filter(item => containerIds.has(item.id)),
      appointments: appointments.filter(item => containerIds.has(item.containerId)),
      equipment: equipment.filter(item => incident.scope.equipmentIds.includes(item.id)),
      voyages: voyages.filter(item => incident.scope.voyageIds.includes(item.id)),
      blocks: blocks.filter(item => incident.scope.blockIds.includes(item.id))
    },
    unrecovered,
    overlaps: incidentOverlaps(incident, true)
  };
}

// ---- 事件指挥台种子：一起已关闭的设备故障（含恢复失败与关闭后补录），一起进行中的场桥故障 ----
const seedIncidentA = createIncident({ title: 'RS-02 正面吊液压故障', kind: 'equipment-failure', severity: 'major', commander: '张值班', note: 'RS-02 液压报警停机，D05 查验区机械作业受限', scope: { voyageIds: [], blockIds: ['D05'], equipmentIds: ['RS-02'], containerIds: ['TEMU-1774029'] } });
if (seedIncidentA) {
  registerPhase(seedIncidentA.id, { phase: 'assessing', note: '确认液压泵故障，维修工单 WO-8821 已下发', actor: '张值班' });
  const seedRuleA = publishRule(seedIncidentA.id, { action: 'pause-tasks', note: '暂停 D05 查验区全部机械作业', createdBy: '张值班' });
  registerPhase(seedIncidentA.id, { phase: 'mitigating', note: '维修班组进场更换液压泵', actor: '张值班' });
  handoverIncident(seedIncidentA.id, { to: '李班长', note: '夜班交接，维修进度见工单 WO-8821', actor: '张值班' });
  registerPhase(seedIncidentA.id, { phase: 'recovering', note: '液压泵更换完成，等待负载测试', actor: '李班长' });
  if (seedRuleA) liftRule(seedIncidentA.id, seedRuleA.id, { reviewer: '李班长', note: '规则解除观察；RS-02 负载测试未通过，相关任务恢复失败待跟进' });
  closeIncident(seedIncidentA.id, { actor: '李班长', summary: '故障定位完成，RS-02 转计划维修；TASK-105 待设备可用后重试恢复' });
  addEvidence(seedIncidentA.id, { kind: 'work-order', title: '维修工单 WO-8821', note: '液压泵更换记录，负载测试未通过曲线附后', addedBy: '李班长' });
  const rawA = incidents.find(entry => entry.id === seedIncidentA.id);
  if (rawA) {
    rawA.openedAt = iso(-240); rawA.closedAt = iso(-70);
    const phaseTimes: Record<string, number> = { detected: -240, assessing: -225, mitigating: -190, recovering: -95, closed: -70 };
    rawA.phases.forEach(entry => { entry.at = iso(phaseTimes[entry.phase] ?? -120); });
  }
}
const seedIncidentB = createIncident({ title: 'YC-12 场桥变频器故障', kind: 'equipment-failure', severity: 'critical', commander: '王调度', note: 'YC-12 作业中变频器报警停机，VOY-AX7 关联作业与冷藏箱翻箱受阻', scope: { voyageIds: ['VOY-AX7'], blockIds: [], equipmentIds: ['YC-12'], containerIds: ['EISU-1288420'] } });
if (seedIncidentB) {
  registerPhase(seedIncidentB.id, { phase: 'assessing', note: '初步判断需更换功率模块，备件调拨中', actor: '王调度' });
  publishRule(seedIncidentB.id, { action: 'pause-tasks', note: '暂停 YC-12 及 VOY-AX7 关联任务，冷藏箱优先人工干预', createdBy: '王调度' });
  addEvidence(seedIncidentB.id, { kind: 'telemetry', title: 'YC-12 变频器报警日志', note: '故障代码 F-218，瞬时过流', addedBy: '王调度' });
  broadcastIncident(seedIncidentB.id, { message: '请航次计划确认 VOY-AX7 装船顺序调整方案' });
  const rawB = incidents.find(entry => entry.id === seedIncidentB.id);
  if (rawB) {
    rawB.openedAt = iso(-45);
    const phaseTimes: Record<string, number> = { detected: -45, assessing: -30 };
    rawB.phases.forEach(entry => { entry.at = iso(phaseTimes[entry.phase] ?? -30); });
  }
}
