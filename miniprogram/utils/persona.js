/**
 * AIFitnessPro - 搭子话术系统
 * 支持四种人格风格：硬核教练 (coach) / 暖男兄弟 (buddy/bro) / 幽默毒舌 (comedian/roast) / 知性女教练 (beauty_coach)
 *
 * 模板变量支持（render 中的 {key}）：
 *   {exercise_name}  动作名
 *   {set_no}         当前组序
 *   {total_sets}     总组数
 *   {weight}         当前重量 kg
 *   {next_weight}    建议下次重量 kg
 *   {delta}          重量调整值（带 ± 号）kg
 *   {rpe}            主观强度 6-10
 *   {streak_days}    连续打卡天数
 *   {achievement_name} 成就名
 *   {total_volume}   总训练量 kg
 *   {duration_min}   训练时长 分钟
 */

const STYLE_ALIASES = {
  bro: 'buddy',
  roast: 'comedian',
  beauty: 'beauty_coach'
}

const TEMPLATES = {
  coach: {
    warmup: [
      '热身到位了吗？记住：宁可慢一点，也不要受伤。',
      '动作质量永远比重量更重要，做好每一个细节。',
      '准备好了吗？专注，专注，再专注。',
      '花两分钟激活目标肌群，训练效果翻倍。',
      '今天的目标很明确，热身完就开干。',
      '肩袖、髋关节先转起来，保护好你的关节。',
      '先做两组轻重量激活，别一上来就顶。',
      '深呼吸三次，收紧核心，我们开始。',
      '今天的第一个动作是 {exercise_name}，把动作模式先过一遍。',
      '心率拉起来再说，别冷启动。',
      '动态拉伸比静态拉伸更适合开训。',
      '检查下鞋带、护具、腰带，再进入工作组。',
      '先用 50% 的重量练神经，再加到工作重量。',
      '热身充分 = 少受伤 + 多进步。',
      '准备肌肉的同时，准备好你的头脑。',
      '把手机放下，把注意力收回来。',
      '目标是今天比昨天强 1%，不多也不少。',
      '把训练本翻开，上次的重量记好了吗？',
      '今天从 {exercise_name} 开始，热身 2-3 组，感觉到了再加重。',
      '站姿站稳，呼吸均匀，准备启动。'
    ],
    during: [
      '很好！继续保持这个节奏。',
      '动作标准！再来一组，别停！',
      '坚持住，这是突破的关键时刻！',
      '呼吸节奏不错，继续保持。',
      '离心阶段别放太快，这才是增长的关键。',
      '核心收紧！你的力量来自稳定。',
      '集中注意力在目标肌群上，心肌连接。',
      '最后几次才是有效次数，咬住！',
      '第 {set_no} 组 / 共 {total_sets} 组，节奏稳住。',
      '{weight}kg × {set_no} 组，干净利落。',
      '再来 3 次，每一次都像第一次那样标准。',
      '下放 2 秒，停一秒，发力 1 秒，这就是黄金节拍。',
      '骨盆中立位，别塌腰，别翘臀。',
      '别看别人，看你的动作。',
      '{exercise_name}，第 {set_no} 组，稳。',
      '顶峰收缩 1 秒，你能感觉到它在哪。',
      '力量往目标肌群送，不要借髋借背。',
      '呼吸：下吸上呼，离心吸，向心呼。',
      '这组到位了，最后 2 次全力。',
      '握力收紧，肩胛下压。',
      '不要摆动，借力就等于白做。',
      '做慢，更难，也更有效。',
      '全程控制，别让重量带着你。',
      '保持张力，不要在顶点休息。',
      '你比自己想象的更有力量，证明它。'
    ],
    finish: [
      '干得漂亮！今天的训练很棒。',
      '完成度100%，继续保持这个势头。',
      '这次训练强度够了，回去好好恢复。',
      '训练质量不错，记得补充蛋白质。',
      '完美收工，48 小时内好好恢复。',
      '每一次坚持都在重塑你的身体。',
      '今天总训练量 {total_volume}kg，扎实。',
      '{duration_min} 分钟，高效完成。',
      '练完别坐下，先走两分钟散热。',
      '拉伸 5-10 分钟，睡眠质量会好很多。',
      '训练后 30-60 分钟进食窗口，吃饱了再睡。',
      '明天肌肉会酸，这是正常适应。',
      '下次 {exercise_name} 可以试试 {next_weight}kg。',
      '已经比上次强了，记录在训练本里。',
      '一次好的训练 = 意图 + 执行 + 记录，三样都做到了。',
      '恢复和训练同样重要，今晚早睡。',
      '喝 500ml 水，补充电解质。',
      '干得好，这是今天第一件做对的事。',
      '强度刚好不过量，这才叫聪明训练。',
      '连续 {streak_days} 天了，习惯正在定型。'
    ],
    encouragement: [
      '做得好！', '标准动作！', '完美！', '就是这样！', '继续加油！',
      '节奏很稳！', '控制力不错！', '这组到位了！', '正确！', '稳！',
      '对！就这个感觉！', '顶住！', '再一次！', '不差这一个！', '顶峰收缩！',
      '离心慢！', '呼吸！', '核心！', '别塌腰！', '到位！'
    ],
    correction: [
      '注意姿势，别弓腰！',
      '控制动作节奏，慢一点。',
      '呼吸要配合动作。',
      '肩膀下沉，别耸肩。',
      '膝盖方向跟着脚尖走。',
      '全程保持张力，别借力。',
      '下放太快，慢 2 秒。',
      '动作幅度不够，再低一点。',
      '肩胛下沉收紧，胸口挺出来。',
      '手肘角度保持住，别甩。',
      '腹内压建立了再发力。',
      '杆路走直线，别画弧。',
      '这个重量过大了，质量比数量重要。',
      '先降一档重量练感觉，再加回来。',
      '深度不够等于没做。'
    ]
  },

  buddy: {
    warmup: [
      '嘿兄弟，今天准备搞点什么强度？',
      '热身舒服点了吗？待会儿一起冲！',
      '感觉怎么样？准备好开始了吗？',
      '身体感觉不赖吧？准备干活！',
      '先把关节活动开，一会儿直接起飞！',
      '热身也别马虎，不然后面哭的是自己。',
      '先来两组轻的找找感觉，稳住不急。',
      '老规矩，肩袖转起来，髋关节活一活。',
      '今天第一个是 {exercise_name}，咱俩一块儿上。',
      '状态看着不错，待会儿能冲！',
      '来，先激活下，等会儿有好东西。',
      '腰带扎好，护具戴上，我们准备好了。',
      '兄弟，别愣着，热身就是正赛的前奏。',
      '心率先拉到 120，我们就开干。',
      '今天目标不高，比上次多 1kg 就行。',
      '不紧张，跟上次一样的节奏就行。',
      '把杂念放下，就剩我跟你。',
      '先搞杯水，补点水再练。',
      '兄弟我看你这状态，今天要 PR 啊！',
      '热身 OK 的话，咱上 {exercise_name} 了。'
    ],
    during: [
      '哇，这组动作真帅！',
      '厉害啊兄弟，继续保持！',
      '这状态不错，再加把劲！',
      '节奏掌握得很好，加油！',
      '越来越猛了，我看好你！',
      '这力量输出，稳如老狗！',
      '动作流畅得很，再来！',
      '兄弟，感觉你今天状态爆棚啊！',
      '第 {set_no} 组啦，剩 {total_sets} 组，冲！',
      '{weight}kg 跟玩儿似的，再来！',
      '这个动作你越来越有感觉了。',
      '别给自己找借口，咬住，再来 3 个。',
      '我相信你，你也相信你自己。',
      '这一组下来，你又比昨天强一点了。',
      '节奏比重量更重要，稳住！',
      '呼吸别憋，跟动作走。',
      '兄弟你这上升曲线有点陡啊！',
      '再来，兄弟我在这给你数数。',
      '核心别松，屁股绷紧！',
      '这组我给你 9 分，稳得一批。',
      '离心慢点，让肌肉多吃点。',
      '最后两下，给我 follow through！',
      '我说真的，这组你完成度很高。',
      '顶峰停 1 秒，你会感谢自己。',
      '稳，太稳了兄弟。'
    ],
    finish: [
      '兄弟你太猛了！',
      '今天又突破自己了，牛！',
      '完美收工，回去多吃点奖励自己！',
      '辛苦了兄弟，明天见！',
      '今天的你比昨天的你更强了。',
      '又是高效的一天，回去好好休息！',
      '总量 {total_volume}kg，我陪你干到底了。',
      '{duration_min} 分钟高效率，兄弟这效率绝了。',
      '下次 {exercise_name} 试试 {next_weight}kg？',
      '拉伸别偷懒，明天才不会酸到怀疑人生。',
      '连续 {streak_days} 天了，你这是要起飞啊！',
      '兄弟，回去记得补蛋白，鸡胸或蛋白粉都行。',
      '睡够 7 小时，我们明天继续。',
      '今天给你打 9 分，剩那 1 分留给下次 PR。',
      '感谢陪伴，兄弟我们明天见。',
      '走走步，别立刻坐下，缓一缓。',
      '这一周的累积，下周一肯定能看出来变化。',
      '辛苦归辛苦，这是好的累。',
      '你已经做到了今天能做到的最好。',
      '洗完澡吃顿好的，奖励一下自己。'
    ],
    encouragement: [
      '稳住！', '继续！', '兄弟你行的！', '加油！', '太棒了！',
      '冲！', '这就对了！', '就这么干！', '可以可以！', '帅！',
      '再一下！', '顶住！', '咬牙！', '牛！', '稳如老狗！',
      '就是这样！', '我信你！', '冲冲冲！', '绝了！', '666！'
    ],
    correction: [
      '慢点来，别急，安全第一。',
      '动作幅度可以再大一点。',
      '注意一下呼吸节奏哦。',
      '别着急赶组数，质量要跟上。',
      '关节别锁死，留一点弹性。',
      '全程控制住，别甩。',
      '兄弟这组有点借力，减点重量吧。',
      '核心收紧一点，腰背会舒服。',
      '膝盖别内扣，跟脚尖一个方向。',
      '手肘角度固定住，别乱晃。',
      '肩膀放下来，别耸。',
      '这一下不标准，不计数，重来。',
      '下放慢点，让肌肉感受到。',
      '背一定要挺直，弓了就危险了。',
      '兄弟重量稍微重了，降一档。'
    ]
  },

  comedian: {
    warmup: [
      '听说今天有人要挑战自己的极限？',
      '热身完毕了吗？别一会儿哭着说累。',
      '准备好了？待会儿可能要怀疑人生。',
      '今天的计划看着就很刺激，你确定？',
      '先活动一下，不然一会儿在地板上爬着走。',
      '别怕，痛苦只是暂时的...大概。',
      '今天第一个 {exercise_name}，建议预约个按摩。',
      '热身三分钟，哭半小时？',
      '把遗嘱写好再开始训练。',
      '你的肌肉还没反应过来你要对它做什么。',
      '看你今天这状态，我建议直接上 {weight}kg。开玩笑的，正常热身。',
      '别紧张，最坏的结果就是...肌肉酸三天。',
      '热身时间 = 你反悔的最后窗口。',
      '准备好失去你的自尊，开始吧。',
      '你和 PR 之间只差一个勇气和一次热身。',
      '肩膀转三圈，明天少酸两度。',
      '你不热身，明天你的床热床。',
      '今天要开始了吗？我怕我的段子不够用。',
      '深呼吸，然后忘记你今天答应过减脂。',
      '准备起飞，飞机票是单程的。'
    ],
    during: [
      '哟，还挺能坚持嘛！',
      '看来你的铁还是有点料。',
      '这组动作勉强合格，下组加油。',
      '动作还行，就是有点像划水。',
      '我说加油是指——不要翻船。',
      '看样子你不是第一天练了？尊重。',
      '嗯，至少比我想象的好。',
      '你离标准只差了亿点点。',
      '第 {set_no} 组，你脸色已经很有说服力了。',
      '{weight}kg 在你手上有一种...沉重感？',
      '这组完成度 60%，剩下的 40% 去哪了？',
      '建议你把表情先收一收，还没结束呢。',
      '这是力量训练，不是表情管理。',
      '兄弟你这发力方式，蹦迪的时候用才对。',
      '我以为你会放弃，没想到你还在。',
      '你跟杠铃的关系像极了复杂的感情。',
      '动作好看程度：3 颗星。',
      '节奏对了，就是速度嘛...慢了点。',
      '你这姿势我打 80 分，剩 20 分扣在颜值。',
      '杠铃说它还好，但你的表情出卖了你。',
      '建议录下来，回家可以当励志片。',
      '{exercise_name} 这种东西，做好了叫训练，做不好叫表演。',
      '坚持，就算只是为了不给我素材笑你。',
      '你的核心说它今天请假了是真的吗？',
      '再来一个，凑够段子。'
    ],
    finish: [
      '居然没躺下？可以的。',
      '今天表现尚可，免得你尴尬。',
      '训练结束，可以回家晒朋友圈了。',
      '恭喜你，活着走出了健身房。',
      '收工！今天热量应该消耗了一顿饭。',
      '等等...你脸上的是汗还是泪？',
      '总量 {total_volume}kg，够写篇日记了。',
      '{duration_min} 分钟，有 10 分钟在喘。',
      '下次 {exercise_name} 试试 {next_weight}kg，当然——如果你还敢来。',
      '建议你慢点走出去，别摔在门口。',
      '连续 {streak_days} 天了？我开始怀疑你是机器人。',
      '今天你比昨天强 1%，明天继续欠 99%。',
      '收工回家吃肉，毕竟你今天练得像个人。',
      '建议把今天的狼狈发朋友圈，涨粉。',
      '恭喜你，今天没被杠铃打败。',
      '去拉伸，不然明天走路像企鹅。',
      '训练结束，自尊心完好程度未知。',
      '下次见，希望你届时还叫这个名字。',
      '拜，别忘了今晚的蛋白。',
      '你赢了杠铃，但输给了镜子。'
    ],
    encouragement: [
      '凑合吧。', '还行。', '勉强及格。', '可以的。', '还活着？',
      '啊？做完了？', '行吧行吧。', '比上次好那么一丢丢。',
      '嗯。', '哦，真的做完了。', '神奇。', '服。',
      '（鼓掌.gif）', '可以可以可以。', '勉勉强强。',
      '这就结束了？', '这组我服了。', '竟然做到了。',
      '行，没白来。', '你赢了，勉强。'
    ],
    correction: [
      '兄弟，你是来旅游的吗？',
      '动作幅度像蚊子叮的。',
      '你这呼吸，像鱼缺氧。',
      '形体管理？先管管动作形态吧。',
      '你这动作我教练看了要扣工资。',
      '借力借得炉火纯青，可惜不是好事。',
      '你这不是训练，是即兴表演。',
      '背弓得像问号，问你自己在干啥。',
      '膝盖内扣？你想挑战半月板？',
      '这杠路像心电图。',
      '举重是力学，不是玄学。',
      '重量太大了，降一档，留点尊严。',
      '你的肩胛已经投降了。',
      '呼吸别憋，你是在举铁不是潜水。',
      '下放速度：自由落体。不行不行。'
    ]
  },

  beauty_coach: {
    warmup: [
      '热身很重要哦，别偷懒～',
      '准备开始了吗？我会一直陪着你的！',
      '深呼吸，放松心情，我们开始吧！',
      '先把身体唤醒，我陪你一起来～',
      '拉伸做够了吗？关节要保护好哦。',
      '今天的训练很有趣的，别紧张！',
      '今天先从 {exercise_name} 开始，节奏慢慢来。',
      '不着急，给身体 5 分钟适应。',
      '把肩颈转一转，很舒服的～',
      '心态放松，我们一步一步来。',
      '今天的重量是 {weight}kg，你之前完成过的，稳住就好。',
      '状态好的话，我们试试小突破。',
      '身体是最诚实的，它会告诉你能做多少。',
      '不要和别人比，和昨天的自己比就好。',
      '先喝口水，我们就开始～',
      '站稳，收腹，肩胛下沉——准备好了吗？',
      '今天的目标是完成，不是完美。',
      '用鼻子吸气，嘴巴呼气，保持均匀。',
      '让我看看你今天的状态——嗯，不错！',
      '我们慢慢来，不抢不赶。'
    ],
    during: [
      '很棒！继续保持这个节奏。',
      '动作很标准呢，给你点赞！',
      '看得出来你在努力，加油加油！',
      '呼吸要配合动作，慢慢来～',
      '做得好！你的进步我都看在眼里。',
      '这个节奏刚刚好，不急不躁～',
      '一组比一组稳，非常棒！',
      '专注在感受肌肉发力，你做得到的。',
      '第 {set_no} 组了哦，一共 {total_sets} 组，坚持住～',
      '{weight}kg 控制得很好，继续。',
      '离心慢慢放，让肌肉充分感受。',
      '核心收紧一点点，力量会更稳。',
      '肩膀放下来，挺胸收腹。',
      '呼吸不要憋，自然一些。',
      '你今天的专注度我很欣赏。',
      '慢一秒，效果好很多哦。',
      '相信你的身体，它比你想象的强。',
      '动作做到位比次数多更重要。',
      '感受肌肉的收缩和放松，这叫心肌连接。',
      '{exercise_name} 你已经掌握了，再稳两组。',
      '不紧张，你一直很稳。',
      '还有 2 次，专注呼吸就好。',
      '顶峰停留一下，你会感觉到的。',
      '很好，这就是我想看到的状态。',
      '再来一次，和上一次一样漂亮。'
    ],
    finish: [
      '今天完成得很不错呢！',
      '坚持就是胜利，为你骄傲！',
      '训练结束了，辛苦啦！',
      '好好放松，你值得休息一下～',
      '拉伸别忘了，我们下次见！',
      '越来越有型了，继续保持哦！',
      '今天总量 {total_volume}kg，你真的很拼。',
      '{duration_min} 分钟的专注，非常值得。',
      '下次 {exercise_name} 可以试试 {next_weight}kg，但别勉强。',
      '连续 {streak_days} 天了，习惯的力量你感受到了吗？',
      '别忘了补充蛋白质和水分。',
      '睡前做一组静态拉伸，明天起床会轻很多。',
      '我能看到你一点一点的变化，真的很棒。',
      '别急着看结果，过程才是最珍贵的。',
      '你今天比昨天更优秀了一点点。',
      '辛苦了，你值得一顿好吃的。',
      '记得奖励自己——不是靠食物，是靠认可。',
      '休息也是训练的一部分，今晚早点睡。',
      '训练本记一下，未来会感谢今天的自己。',
      '我们下次见，保持这个节奏。'
    ],
    encouragement: [
      '加油！', '你可以的！', '坚持住！', '很棒！', '继续努力！',
      '太好了～', '你好厉害！', '一定可以的！', '稳住呼吸～', '再来一次！',
      '慢一点也可以～', '专注！', '我看到了你的努力。', '这就对啦！',
      '稳稳的～', '不要急～', '放松肩膀。', '真好看。',
      '你做得到的。', '越来越好啦！'
    ],
    correction: [
      '注意一下姿势，保护好自己哦。',
      '动作幅度可以再大一点，慢慢来。',
      '呼吸节奏要掌握好，别着急。',
      '肩膀放下来，不要耸肩哦～',
      '膝盖不要内扣，跟着脚尖走。',
      '慢一点也没关系，安全最重要。',
      '这一下借力了哦，降点重量试试。',
      '背要挺直，不要弓起来。',
      '核心再收紧一些，腰会舒服很多。',
      '下放速度慢一点，不要掉下去。',
      '手肘角度稳住，不要晃。',
      '动作不标准的话，咱们先降重量好吗？',
      '全程保持张力，不要在顶点完全放松。',
      '脚掌踩实地面，力量才稳。',
      '别憋气哦，自然呼吸。'
    ]
  }
}

// 特殊场景的专用模板（可复用变量替换）
const SCENE_TEMPLATES = {
  rpe_high: {
    coach: [
      '极限强度！下次可以考虑减重或减少组数。',
      '拼尽全力！记得充分恢复。',
      '高难度完成！进步就在这种时刻。',
      'RPE {rpe} 有点逼近上限，安排好恢复。',
      '下次 {exercise_name} 建议降到 {next_weight}kg。'
    ],
    buddy: [
      '哇，这么猛？小心别拉伤！',
      '兄弟你这是要上天啊！',
      '这强度，佩服佩服！',
      'RPE {rpe}，兄弟你卷得可以。',
      '下次 {exercise_name} 咱悠着点，{next_weight}kg 就够了。'
    ],
    comedian: [
      '玩命模式启动？注意身体。',
      '这么拼？确定不是在作死？',
      '极限挑战，佩服。',
      'RPE {rpe}？你是来渡劫的吧。',
      '下次 {exercise_name} 我建议 {next_weight}kg，留条命。'
    ],
    beauty_coach: [
      '今天这组有点逼近极限了，下一次降一点点重量。',
      'RPE {rpe} 可以理解，别硬撑。',
      '你已经很努力了，不一定每次都要到 {rpe}。',
      '下次 {exercise_name} 我们试试 {next_weight}kg，找个舒适区。',
      '拼是好事，但恢复也是训练的一部分。'
    ]
  },
  rpe_mid: {
    coach: [
      '完美强度！这就是进步的感觉。',
      '这个RPE很棒，继续保持。',
      '难度刚好，下次继续。',
      'RPE {rpe}，黄金区间。',
      '{exercise_name} 可以下次试 {next_weight}kg。'
    ],
    buddy: [
      '这感觉不错，刚刚好！',
      '强度正好，继续加油！',
      '完美掌控！',
      'RPE {rpe}，这是我想看到的。',
      '下次 {exercise_name} 上 {next_weight}kg 试试。'
    ],
    comedian: [
      '刚刚好，不多不少。',
      '标准答案，无可挑剔。',
      '这RPE，专业！',
      'RPE {rpe}，罕见地理智。',
      '{exercise_name} 下次 {next_weight}kg 应该还能爬起来。'
    ],
    beauty_coach: [
      '这个强度掌握得真好。',
      'RPE {rpe}，非常理想的训练区间。',
      '不多不少，你找到自己的节奏了。',
      '下次 {exercise_name} 试试 {next_weight}kg 吧。',
      '一直这样稳定下去就是最大的胜利。'
    ]
  },
  rpe_low: {
    coach: [
      '强度还可以再提升一点。',
      '下次可以尝试加重或增加组数。',
      '保持这个节奏，逐步提升。',
      'RPE {rpe} 偏低，下次 {exercise_name} 上 {next_weight}kg。',
      '肌肉需要更高刺激才会进步。'
    ],
    buddy: [
      '轻松模式？可以再挑战一下。',
      '下次试试更高强度哦！',
      '稳扎稳打也不错！',
      'RPE {rpe}？兄弟你是不是藏私了。',
      '下次 {next_weight}kg 走一波。'
    ],
    comedian: [
      '这是在散步吗？',
      '强度像在养生。',
      '下次可以再猛一点。',
      'RPE {rpe}？咱们的目标不该是太极班吧。',
      '下次 {exercise_name} 来 {next_weight}kg，试试真的累。'
    ],
    beauty_coach: [
      '状态不错的话，下次可以挑战一下。',
      'RPE {rpe} 偏轻松，你其实还有余力。',
      '训练需要循序渐进地突破哦。',
      '下次 {exercise_name} 我们加到 {next_weight}kg，但以动作质量为前提。',
      '你完全有能力做得更多。'
    ]
  },
  streak_3: {
    coach: '连续三天，良好开端。',
    buddy: '连续三天，状态不错！',
    comedian: '三天了？看来不是三分钟热度。',
    beauty_coach: '连续三天啦，习惯正在悄悄形成～'
  },
  streak_7: {
    coach: '一周连续训练，习惯正在形成。',
    buddy: '连续一周，你已经找到节奏了！',
    comedian: '一周了？看来是真的想练。',
    beauty_coach: '一周了，你比上周更强了一点点。'
  },
  streak_30: {
    coach: '一个月连续训练，真正的战士！',
    buddy: '一个月了！你已经是个训练老手了！',
    comedian: '一个月？不会是在刷存在感吧？',
    beauty_coach: '整整一个月，我为你骄傲。'
  },
  load_up: {
    coach: '这组反馈不错，下次 {exercise_name} 加到 {next_weight}kg（{delta}kg）。',
    buddy: '兄弟状态不错，下次 {exercise_name} 上 {next_weight}kg，稳。',
    comedian: '居然能加重？{exercise_name} 下次 {next_weight}kg，别哭。',
    beauty_coach: '你完成得很好，下次 {exercise_name} 可以加到 {next_weight}kg。'
  },
  load_down: {
    coach: '质量优先：下次 {exercise_name} 降到 {next_weight}kg（{delta}kg），把动作打磨好。',
    buddy: '兄弟别硬扛，下次 {exercise_name} 咱 {next_weight}kg。',
    comedian: '明智之举，下次 {exercise_name} {next_weight}kg，给自己留点余地。',
    beauty_coach: '下次 {exercise_name} 我们降一点到 {next_weight}kg，找回节奏。'
  },
  load_hold: {
    coach: '{exercise_name} 继续保持 {next_weight}kg，把节奏锁死。',
    buddy: '这重量 {next_weight}kg 正合适，下次继续。',
    comedian: '{next_weight}kg，不敢动，下次还这个。',
    beauty_coach: '{next_weight}kg 刚刚好，继续保持这个舒适区一段时间。'
  },
  achievement_unlock: {
    coach: '解锁成就「{achievement_name}」——这是坚持的奖励。',
    buddy: '恭喜解锁「{achievement_name}」！兄弟你太棒了！',
    comedian: '居然解锁「{achievement_name}」？服，真练出来了。',
    beauty_coach: '新成就「{achievement_name}」！你值得被看见。'
  },
  volume_pr: {
    coach: '训练量 {total_volume}kg，创个人新高。',
    buddy: '兄弟你这总量 {total_volume}kg，起飞了！',
    comedian: '{total_volume}kg 总量？确定不是吹牛？',
    beauty_coach: '总训练量 {total_volume}kg，今天真的很棒。'
  }
}

function pickRandom(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return ''
  return arr[Math.floor(Math.random() * arr.length)]
}

function renderTemplate(template, context = {}) {
  if (!template || typeof template !== 'string') return ''
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (context[key] === undefined || context[key] === null) return match
    return String(context[key])
  })
}

class PersonaEngine {
  constructor(personaStyle = 'coach') {
    this.style = this.normalizeStyle(personaStyle)
    this.templates = TEMPLATES
  }

  normalizeStyle(personaStyle) {
    return STYLE_ALIASES[personaStyle] || personaStyle || 'coach'
  }

  /**
   * 获取随机话术
   * @param {string} category - warmup/during/finish/encouragement/correction
   * @param {object} context - { exerciseName, setNo, totalSets, weight, nextWeight, rpe, streakDays, achievementName, totalVolume, durationMin, delta }
   */
  getRandomMessage(category, context = {}) {
    const styleTemplates = this.templates[this.style] || this.templates.coach
    const categoryTemplates = styleTemplates[category] || []
    const template = pickRandom(categoryTemplates) || '加油！'
    return renderTemplate(template, this._normalizeContext(context))
  }

  /**
   * 根据 RPE 调整反馈
   */
  getRPEResponse(rpe, context = {}) {
    let bucket = 'rpe_mid'
    if (rpe >= 9) bucket = 'rpe_high'
    else if (rpe <= 7) bucket = 'rpe_low'
    const list = (SCENE_TEMPLATES[bucket] && SCENE_TEMPLATES[bucket][this.style]) || []
    const template = pickRandom(list) || '继续保持。'
    return renderTemplate(template, this._normalizeContext({ ...context, rpe }))
  }

  /**
   * 连续打卡话术
   */
  getStreakMessage(streakDays) {
    let key = null
    if (streakDays >= 30) key = 'streak_30'
    else if (streakDays >= 7) key = 'streak_7'
    else if (streakDays >= 3) key = 'streak_3'
    if (!key) return ''
    const tpl = SCENE_TEMPLATES[key][this.style] || ''
    return renderTemplate(tpl, this._normalizeContext({ streakDays }))
  }

  /**
   * 重量调整话术
   * @param {object} context - { exerciseName, weight, nextWeight, delta }
   */
  getLoadAdjustmentMessage(context = {}) {
    const delta = Number(context.delta) || 0
    let bucket = 'load_hold'
    if (delta > 0.01) bucket = 'load_up'
    else if (delta < -0.01) bucket = 'load_down'
    const tpl = SCENE_TEMPLATES[bucket][this.style] || ''
    return renderTemplate(tpl, this._normalizeContext(context))
  }

  /**
   * 解锁成就话术
   */
  getAchievementMessage(achievementName) {
    const tpl = SCENE_TEMPLATES.achievement_unlock[this.style] || ''
    return renderTemplate(tpl, this._normalizeContext({ achievementName }))
  }

  /**
   * 训练量 PR 话术
   */
  getVolumeMessage(totalVolume) {
    const tpl = SCENE_TEMPLATES.volume_pr[this.style] || ''
    return renderTemplate(tpl, this._normalizeContext({ totalVolume }))
  }

  /**
   * 将外部 camelCase context 归一化为模板使用的 snake_case
   */
  _normalizeContext(ctx = {}) {
    const delta = ctx.delta
    return {
      exercise_name: ctx.exerciseName || ctx.exercise_name || '',
      set_no: ctx.setNo || ctx.set_no || '',
      total_sets: ctx.totalSets || ctx.total_sets || '',
      weight: ctx.weight != null ? ctx.weight : '',
      next_weight: ctx.nextWeight != null ? ctx.nextWeight : (ctx.next_weight != null ? ctx.next_weight : ''),
      delta: delta != null ? (Number(delta) >= 0 ? `+${delta}` : String(delta)) : '',
      rpe: ctx.rpe != null ? ctx.rpe : '',
      streak_days: ctx.streakDays != null ? ctx.streakDays : (ctx.streak_days != null ? ctx.streak_days : ''),
      achievement_name: ctx.achievementName || ctx.achievement_name || '',
      total_volume: ctx.totalVolume != null ? ctx.totalVolume : (ctx.total_volume != null ? ctx.total_volume : ''),
      duration_min: ctx.durationMin != null ? ctx.durationMin : (ctx.duration_min != null ? ctx.duration_min : '')
    }
  }
}

// 内部导出便于测试
module.exports = {
  PersonaEngine,
  __internals: {
    TEMPLATES,
    SCENE_TEMPLATES,
    renderTemplate,
    pickRandom
  }
}
