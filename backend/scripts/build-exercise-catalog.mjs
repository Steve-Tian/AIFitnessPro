#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const bundledPath = path.join(root, 'miniprogram/data/exercises.json');

const ADDITIONAL = [
  { id: 'diamond_push_up', name: '钻石俯卧撑', alias: ['窄距俯卧撑'], category: 'push', muscle: ['triceps', 'chest'], equipment: ['bodyweight'], difficulty: 'intermediate', instructions: ['双手拇指食指呈钻石形', '身体保持一条直线', '屈肘下放至胸部接近手背', '推起至手臂接近伸直'], commonMistakes: ['塌腰', '肘部过度外展'] },
  { id: 'pike_push_up', name: '派克俯卧撑', alias: ['Pike Push-up'], category: 'push', muscle: ['shoulders', 'triceps'], equipment: ['bodyweight'], difficulty: 'intermediate', instructions: ['双手撑地，臀部抬高成倒V', '屈肘让头部向地面下沉', '肩部发力推回起始位'], commonMistakes: ['臀部塌陷', '耸肩'] },
  { id: 'superman_hold', name: '超人挺身', alias: ['Superman'], category: 'pull', muscle: ['back', 'glutes'], equipment: ['bodyweight'], difficulty: 'beginner', instructions: ['俯卧，双臂前伸', '同时抬起双臂和双腿', '顶峰停顿后缓慢放下'], commonMistakes: ['抬头过高', '依靠甩动'] },
  { id: 'ytw_raise', name: '俯身Y-T-W', alias: ['YTW'], category: 'pull', muscle: ['rear_delts', 'back'], equipment: ['bodyweight'], difficulty: 'beginner', instructions: ['俯身或微屈髋站立', '依次做 Y、T、W 轨迹抬臂', '每个轨迹顶峰停顿'], commonMistakes: ['动作过快', '耸肩代偿'] },
  { id: 'towel_curl', name: '毛巾弯举', alias: ['自阻弯举'], category: 'pull', muscle: ['biceps'], equipment: ['bodyweight'], difficulty: 'beginner', instructions: ['双手握毛巾，对侧提供阻力', '固定肘部弯举', '顶峰停顿后缓慢下放'], commonMistakes: ['身体后仰', '肘部移动'] },
  { id: 'bodyweight_squat', name: '徒手深蹲', alias: ['自重深蹲'], category: 'legs', muscle: ['quads', 'glutes'], equipment: ['bodyweight'], difficulty: 'beginner', instructions: ['双脚与肩同宽', '屈髋屈膝下蹲至大腿平行', '脚跟发力站起'], commonMistakes: ['膝盖内扣', '脚跟离地'] },
  { id: 'reverse_lunge', name: '反向弓步蹲', alias: ['后撤箭步蹲'], category: 'legs', muscle: ['glutes', 'quads'], equipment: ['bodyweight'], difficulty: 'beginner', instructions: ['一条腿向后撤一大步', '双膝弯至约90°', '前脚脚跟蹬地站起'], commonMistakes: ['步幅过小', '躯干前倾'] },
  { id: 'standing_calf_raise', name: '站姿提踵', alias: ['自重提踵'], category: 'legs', muscle: ['calves'], equipment: ['bodyweight'], difficulty: 'beginner', instructions: ['双脚站稳', '踮起脚跟至最高点', '顶峰停顿后缓慢下放'], commonMistakes: ['动作反弹', '幅度不足'] },
];

const EXTENDED = [
  { id: 'incline_bench_press', name: '上斜卧推', alias: ['上斜杠铃卧推'], category: 'push', muscle: ['chest', 'shoulders'], equipment: ['full_gym', 'barbell_bench'], difficulty: 'intermediate', instructions: ['上斜凳约30°-45°', '握杠略宽于肩', '下放至胸上部', '推起至锁定'], commonMistakes: ['凳角过大', '杠铃反弹'] },
  { id: 'dumbbell_press', name: '哑铃卧推', alias: ['哑铃推胸'], category: 'push', muscle: ['chest', 'triceps'], equipment: ['dumbbell_only'], difficulty: 'intermediate', instructions: ['仰卧持哑铃于胸侧', '推起至手臂接近伸直', '控制下放至胸侧'], commonMistakes: ['哑铃碰撞', '肩胛未收紧'] },
  { id: 'cable_crossover', name: '龙门架夹胸', alias: ['夹胸'], category: 'push', muscle: ['chest'], equipment: ['full_gym', 'cable'], difficulty: 'beginner', instructions: ['双手持绳，步前一步', '沿弧线在胸前合拢', '顶峰挤压后缓慢打开'], commonMistakes: ['身体前倾借力', '肘部过度弯曲'] },
  { id: 'close_grip_bench', name: '窄握卧推', alias: ['窄距卧推'], category: 'push', muscle: ['triceps', 'chest'], equipment: ['full_gym', 'barbell_bench'], difficulty: 'intermediate', instructions: ['握距窄于肩宽', '肘部贴近身体', '下放至胸下部', '推起'], commonMistakes: ['握距过窄伤腕', '肘部外展'] },
  { id: 'skull_crusher', name: '仰卧臂屈伸', alias: ['Skull Crusher'], category: 'push', muscle: ['triceps'], equipment: ['full_gym', 'barbell_bench'], difficulty: 'intermediate', instructions: ['仰卧持杠或哑铃', '屈肘使重量落向额头附近', '伸直手臂推起'], commonMistakes: ['肘部外展', '下放过快'] },
  { id: 'tricep_pushdown', name: '绳索下压', alias: ['三头下压'], category: 'push', muscle: ['triceps'], equipment: ['full_gym', 'cable'], difficulty: 'beginner', instructions: ['肘部固定于身体两侧', '下压至手臂伸直', '顶峰挤压后缓慢还原'], commonMistakes: ['身体前倾', '肘部前移'] },
  { id: 'dumbbell_shoulder_press', name: '哑铃肩推', alias: ['坐姿肩推'], category: 'push', muscle: ['shoulders', 'triceps'], equipment: ['dumbbell_only'], difficulty: 'intermediate', instructions: ['坐姿或站姿持哑铃于肩高', '沿面部前方推起', '缓慢下放至肩位'], commonMistakes: ['腰部过度反弓', '下放过低'] },
  { id: 'front_raise', name: '哑铃前平举', alias: ['前平举'], category: 'push', muscle: ['shoulders'], equipment: ['dumbbell_only'], difficulty: 'beginner', instructions: ['双手持哑铃于大腿前', '沿前方抬至肩高', '控制下放'], commonMistakes: ['借助甩动', '抬得过高'] },
  { id: 'arnold_press', name: '阿诺德推举', alias: ['Arnold Press'], category: 'push', muscle: ['shoulders', 'triceps'], equipment: ['dumbbell_only'], difficulty: 'intermediate', instructions: ['起始掌心朝向自己', '推起同时旋转至掌心朝前', '反向还原'], commonMistakes: ['重量过大', '耸肩'] },
  { id: 'lat_pulldown', name: '高位下拉', alias: ['宽握下拉'], category: 'pull', muscle: ['back', 'biceps'], equipment: ['full_gym', 'cable'], difficulty: 'beginner', instructions: ['宽握横杠', '肩胛后缩下沉', '拉至锁骨附近', '控制还原'], commonMistakes: ['身体过度后仰', '只用手臂拉'] },
  { id: 'seated_cable_row', name: '坐姿划船', alias: ['绳索划船'], category: 'pull', muscle: ['back', 'biceps'], equipment: ['full_gym', 'cable'], difficulty: 'beginner', instructions: ['坐稳，胸贴挡板', '拉把手至腹部', '顶峰夹背后还原'], commonMistakes: ['圆背', '借助身体摆动'] },
  { id: 'reverse_fly', name: '反向飞鸟', alias: ['俯身飞鸟'], category: 'pull', muscle: ['rear_delts', 'back'], equipment: ['dumbbell_only'], difficulty: 'beginner', instructions: ['俯身或器械坐姿', '沿弧线打开双臂', '顶峰挤压后合拢'], commonMistakes: ['重量过大', '耸肩'] },
  { id: 'chin_up', name: '反手引体', alias: ['窄握引体'], category: 'pull', muscle: ['back', 'biceps'], equipment: ['full_gym', 'bodyweight'], difficulty: 'intermediate', instructions: ['反握单杠与肩同宽', '拉起至下巴过杠', '缓慢下放'], commonMistakes: ['摆动借力', '半程动作'] },
  { id: 'preacher_curl', name: '牧师凳弯举', alias: ['托臂弯举'], category: 'pull', muscle: ['biceps'], equipment: ['full_gym', 'barbell_bench'], difficulty: 'beginner', instructions: ['上臂贴紧斜板', '弯举至顶峰', '缓慢下放至接近伸直'], commonMistakes: ['上臂离开斜板', '快速甩动'] },
  { id: 'concentration_curl', name: '集中弯举', alias: ['单臂集中弯举'], category: 'pull', muscle: ['biceps'], equipment: ['dumbbell_only'], difficulty: 'beginner', instructions: ['坐姿，肘部抵住大腿内侧', '单臂弯举', '顶峰停顿后下放'], commonMistakes: ['身体晃动', '肘部离开大腿'] },
  { id: 'shrug', name: '杠铃耸肩', alias: ['耸肩'], category: 'pull', muscle: ['traps'], equipment: ['full_gym', 'barbell_bench'], difficulty: 'beginner', instructions: ['双手正握杠铃自然下垂', '只做耸肩动作', '顶峰停顿后放下'], commonMistakes: ['旋转肩膀', '借助腿部'] },
  { id: 'leg_press', name: '腿举', alias: ['倒蹬'], category: 'legs', muscle: ['quads', 'glutes'], equipment: ['full_gym'], difficulty: 'beginner', instructions: ['双脚与肩同宽踩板', '控制下放至膝约90°', '脚跟发力推起'], commonMistakes: ['下放过深', '膝盖内扣'] },
  { id: 'romanian_deadlift', name: '罗马尼亚硬拉', alias: ['RDL'], category: 'legs', muscle: ['hamstrings', 'glutes'], equipment: ['full_gym', 'barbell_bench'], difficulty: 'intermediate', instructions: ['微屈膝，屈髋后移', '杠铃沿腿下滑至腘绳肌拉伸', '臀腿发力站直'], commonMistakes: ['圆背', '变成深蹲'] },
  { id: 'leg_curl', name: '腿弯举', alias: ['腘绳肌弯举'], category: 'legs', muscle: ['hamstrings'], equipment: ['full_gym'], difficulty: 'beginner', instructions: ['俯卧或坐姿固定', '脚跟向臀部弯举', '控制还原'], commonMistakes: ['臀部抬起', '快速甩动'] },
  { id: 'leg_extension', name: '腿屈伸', alias: ['股四头肌伸展'], category: 'legs', muscle: ['quads'], equipment: ['full_gym'], difficulty: 'beginner', instructions: ['坐稳，脚踝勾住滚垫', '伸膝至接近伸直', '控制还原'], commonMistakes: ['锁死膝关节', '身体后仰'] },
  { id: 'goblet_squat', name: '高脚杯深蹲', alias: ['哑铃深蹲'], category: 'legs', muscle: ['quads', 'glutes'], equipment: ['dumbbell_only'], difficulty: 'beginner', instructions: ['双手捧哑铃于胸前', '屈髋屈膝下蹲', '脚跟发力站起'], commonMistakes: ['弓背', '膝盖内扣'] },
  { id: 'step_up', name: '台阶登阶', alias: ['登阶'], category: 'legs', muscle: ['quads', 'glutes'], equipment: ['dumbbell_only', 'bodyweight'], difficulty: 'beginner', instructions: ['一脚踏上台阶', '前腿发力站上', '控制下撤'], commonMistakes: ['后脚蹬地过多', '躯干前倾'] },
  { id: 'sumo_deadlift', name: '相扑硬拉', alias: ['宽站硬拉'], category: 'legs', muscle: ['glutes', 'hamstrings'], equipment: ['full_gym', 'barbell_bench'], difficulty: 'advanced', instructions: ['宽站距，脚尖外展', '双手在腿间握杠', '沿腿贴身拉起'], commonMistakes: ['圆背', '杠铃离身'] },
  { id: 'glute_bridge', name: '臀桥', alias: ['自重臀桥'], category: 'legs', muscle: ['glutes', 'hamstrings'], equipment: ['bodyweight'], difficulty: 'beginner', instructions: ['仰卧屈膝', '脚跟发力顶髋', '顶峰挤压臀部'], commonMistakes: ['腰部过度拱起', '顶峰无停顿'] },
  { id: 'plank', name: '平板支撑', alias: ['Plank'], category: 'core', muscle: ['core'], equipment: ['bodyweight'], difficulty: 'beginner', instructions: ['前臂与脚尖撑地', '身体成一条直线', '保持核心收紧'], commonMistakes: ['塌腰', '撅臀'] },
  { id: 'crunch', name: '卷腹', alias: ['仰卧起坐变式'], category: 'core', muscle: ['core'], equipment: ['bodyweight'], difficulty: 'beginner', instructions: ['仰卧屈膝', '上背离地卷向膝盖', '控制还原'], commonMistakes: ['拉脖子', '借助惯性'] },
  { id: 'hanging_leg_raise', name: '悬垂举腿', alias: ['挂杠举腿'], category: 'core', muscle: ['core'], equipment: ['full_gym', 'bodyweight'], difficulty: 'intermediate', instructions: ['悬挂单杠', '抬腿至接近水平', '控制下放'], commonMistakes: ['摆动借力', '只做半程'] },
  { id: 'russian_twist', name: '俄罗斯转体', alias: ['转体'], category: 'core', muscle: ['core'], equipment: ['bodyweight', 'dumbbell_only'], difficulty: 'beginner', instructions: ['坐姿微后仰', '双手合十左右转体', '保持核心稳定'], commonMistakes: ['速度过快', '弓背'] },
  { id: 'dead_bug', name: '死虫式', alias: ['Dead Bug'], category: 'core', muscle: ['core'], equipment: ['bodyweight'], difficulty: 'beginner', instructions: ['仰卧，对侧手脚同时伸展', '保持下背贴地', '交替进行'], commonMistakes: ['下背拱起', '动作过快'] },
  { id: 'side_plank', name: '侧平板', alias: ['Side Plank'], category: 'core', muscle: ['core'], equipment: ['bodyweight'], difficulty: 'beginner', instructions: ['侧卧前臂撑地', '髋部抬离地面成直线', '保持稳定'], commonMistakes: ['髋部下沉', '耸肩'] },
  { id: 'bicycle_crunch', name: '自行车卷腹', alias: ['交替卷腹'], category: 'core', muscle: ['core'], equipment: ['bodyweight'], difficulty: 'beginner', instructions: ['仰卧，对侧肘碰膝', '交替进行', '控制节奏'], commonMistakes: ['拉脖子', '速度过快'] },
  { id: 'ab_wheel', name: '健腹轮', alias: ['Ab Wheel'], category: 'core', muscle: ['core'], equipment: ['bodyweight'], difficulty: 'advanced', instructions: ['跪姿握健腹轮', '向前滚动至身体接近地面', '核心发力拉回'], commonMistakes: ['塌腰', '幅度过大'] },
  { id: 'burpee', name: '波比跳', alias: ['Burpee'], category: 'full_body', muscle: ['full_body'], equipment: ['bodyweight'], difficulty: 'intermediate', instructions: ['下蹲双手撑地', '跳至平板位', '收腿跳起'], commonMistakes: ['塌腰', '落地过重'] },
  { id: 'mountain_climber', name: '登山跑', alias: ['Mountain Climber'], category: 'full_body', muscle: ['core', 'full_body'], equipment: ['bodyweight'], difficulty: 'beginner', instructions: ['平板支撑起始', '交替提膝向胸', '保持核心稳定'], commonMistakes: ['臀部过高', '塌腰'] },
  { id: 'shoulder_press', name: '肩上推举', alias: ['军事推举'], category: 'push', muscle: ['shoulders', 'triceps'], equipment: ['full_gym', 'barbell_bench'], difficulty: 'intermediate', instructions: ['杠铃于肩前', '沿面部前方推起', '缓慢下放'], commonMistakes: ['腰部过度后仰'] },
  { id: 'tricep_extension', name: '哑铃三头伸展', alias: ['三头伸展'], category: 'push', muscle: ['triceps'], equipment: ['full_gym', 'dumbbell_only'], difficulty: 'beginner', instructions: ['单手持哑铃上举', '屈肘使哑铃下落至脑后', '伸直推起'], commonMistakes: ['肘部外展'] },
  { id: 'bicep_curl', name: '哑铃弯举', alias: ['二头弯举'], category: 'pull', muscle: ['biceps'], equipment: ['full_gym', 'dumbbell_only'], difficulty: 'beginner', instructions: ['站立持哑铃', '固定肘部弯举', '缓慢下放'], commonMistakes: ['身体晃动', '肘部前移'] },
  { id: 'lunge', name: '弓步蹲', alias: ['分腿蹲'], category: 'legs', muscle: ['quads', 'glutes'], equipment: ['full_gym', 'dumbbell_only', 'bodyweight'], difficulty: 'beginner', instructions: ['向前迈一大步', '双膝弯至约90°', '前脚蹬地回位'], commonMistakes: ['前膝过度前移', '躯干前倾'] },
  { id: 'upright_row', name: '杠铃提拉', alias: ['直立划船'], category: 'pull', muscle: ['shoulders', 'traps'], equipment: ['full_gym', 'barbell_bench'], difficulty: 'intermediate', instructions: ['窄握杠铃', '沿身体向上拉至胸上部', '控制下放'], commonMistakes: ['拉得过高', '耸肩'] },
  { id: 'chest_supported_row', name: '俯卧支撑划船', alias: ['海豹划船'], category: 'pull', muscle: ['back', 'biceps'], equipment: ['full_gym', 'dumbbell_only'], difficulty: 'beginner', instructions: ['胸贴斜板', '拉哑铃至腰侧', '顶峰夹背后还原'], commonMistakes: ['离开斜板', '甩动'] },
  { id: 'hip_abduction', name: '侧抬腿', alias: ['蚌式开合'], category: 'legs', muscle: ['glutes'], equipment: ['bodyweight'], difficulty: 'beginner', instructions: ['侧卧或绑弹力带', '上腿外展', '顶峰停顿后还原'], commonMistakes: ['骨盆旋转', '速度过快'] },
  { id: 'wall_sit', name: '靠墙静蹲', alias: ['Wall Sit'], category: 'legs', muscle: ['quads'], equipment: ['bodyweight'], difficulty: 'beginner', instructions: ['背靠墙下滑至大腿平行', '保持静止', '均匀呼吸'], commonMistakes: ['膝超过脚尖过多', '臀部过低'] },
  { id: 'farmer_walk', name: '农夫行走', alias: ['Farmer Walk'], category: 'full_body', muscle: ['forearms', 'core'], equipment: ['dumbbell_only'], difficulty: 'beginner', instructions: ['双手持重哑铃', '挺胸步行', '保持核心稳定'], commonMistakes: ['含胸', '步伐不稳'] },
  { id: 'jump_squat', name: '跳跃深蹲', alias: ['跳蹲'], category: 'full_body', muscle: ['quads', 'glutes'], equipment: ['bodyweight'], difficulty: 'intermediate', instructions: ['深蹲后爆发跳起', '轻柔落地', '连续进行'], commonMistakes: ['落地过重', '膝盖内扣'] },
];

function normalizeMuscle(m) {
  const map = {
    chest: 'chest', triceps: 'triceps', front_delts: 'anterior_deltoid', shoulders: 'deltoids',
    back: 'latissimus_dorsi', biceps: 'biceps', rear_delts: 'rear_deltoid', rhomboids: 'rhomboids',
    quads: 'quadriceps', glutes: 'glutes', hamstrings: 'hamstrings', calves: 'calves',
    core: 'core', forearms: 'forearms', traps: 'traps', full_body: 'full_body',
  };
  return map[m] || m;
}

function toRecord(raw) {
  const tips = raw.tips || [];
  return {
    slug: raw.id,
    nameCn: raw.name,
    aliases: raw.alias || [],
    category: raw.category,
    primaryMuscles: (raw.muscle || []).map(normalizeMuscle),
    equipment: raw.equipment || ['bodyweight'],
    difficulty: raw.difficulty || 'beginner',
    instructions: raw.instructions || [],
    commonMistakes: raw.commonMistakes || [],
    safetyNotes: tips.length ? tips : ['选择适合重量，控制动作节奏'],
  };
}

const bundled = JSON.parse(fs.readFileSync(bundledPath, 'utf8')).exercises;
const merged = new Map();
for (const item of [...bundled, ...ADDITIONAL, ...EXTENDED]) {
  merged.set(item.id, toRecord(item));
}

const catalog = Array.from(merged.values()).sort((a, b) => a.slug.localeCompare(b.slug));
const outDir = path.join(__dirname, '../prisma/data');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'exercise-catalog.json'), JSON.stringify(catalog, null, 2));

console.log(`Built exercise catalog with ${catalog.length} exercises.`);
