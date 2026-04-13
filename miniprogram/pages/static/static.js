Page({
  data: {
    planData: [
      {
        date: '2026-04-13',
        type: 'push',
        title: '推日',
        workout: [
          {
            name: '卧推',
            alias: '杠铃卧推',
            sets: 3,
            reps: 8,
            rest: 90
          },
          {
            name: '肩推',
            alias: '哑铃肩推',
            sets: 3,
            reps: 10,
            rest: 60
          }
        ]
      },
      {
        date: '2026-04-14',
        type: 'pull',
        title: '拉日',
        workout: [
          {
            name: '引体向上',
            alias: '宽距引体',
            sets: 3,
            reps: 5,
            rest: 120
          }
        ]
      },
      {
        date: '2026-04-15',
        type: 'legs',
        title: '腿日',
        workout: [
          {
            name: '深蹲',
            alias: '杠铃深蹲',
            sets: 4,
            reps: 6,
            rest: 180
          }
        ]
      },
      {
        date: '2026-04-16',
        type: 'rest',
        title: '休息日',
        note: '充分恢复，为下周训练储备能量'
      },
      {
        date: '2026-04-17',
        type: 'push',
        title: '推日',
        workout: [
          {
            name: '俯卧撑',
            alias: '宽距俯卧撑',
            sets: 3,
            reps: 15,
            rest: 60
          }
        ]
      },
      {
        date: '2026-04-18',
        type: 'pull',
        title: '拉日',
        workout: [
          {
            name: '哑铃划船',
            alias: '单臂哑铃划船',
            sets: 3,
            reps: 10,
            rest: 90
          }
        ]
      },
      {
        date: '2026-04-19',
        type: 'rest',
        title: '休息日',
        note: '周末休息，准备下周训练'
      }
    ]
  },

  onLoad() {
    console.log('Static test page loaded with hardcoded plan data')
  },

  onShow() {
    console.log('Static test page shown')
  }
})