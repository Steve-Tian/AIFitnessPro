const path = require('path')
const fs = require('fs')

const syncScriptPath = path.resolve(__dirname, '../../scripts/sync_exercise_catalog.js')

describe('exercise sync pipeline', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  test('detects dual-source configuration for ExerciseDB and Wger', () => {
    process.env.EXERCISEDB_SOURCE_URL = 'https://example.com/exercisedb'
    process.env.WGER_SOURCE_URL = 'https://example.com/wger'

    const { getActiveSourceConfigs } = require(syncScriptPath)
    const configs = getActiveSourceConfigs()

    expect(configs).toHaveLength(2)
    expect(configs.map((item) => item.provider)).toEqual(['ExerciseDB', 'Wger'])
  })

  test('merges duplicate exercises with ExerciseDB media priority and Wger text fallback', () => {
    const { mergeSourceRecords } = require(syncScriptPath)

    const merged = mergeSourceRecords([
      {
        exercise_id: 'bench_press',
        name_cn: '杠铃卧推',
        name_en: 'Bench Press',
        aliases: ['卧推'],
        category: 'push',
        equipment_required: ['barbell_bench'],
        primary_muscles: ['chest'],
        secondary_muscles: ['triceps'],
        difficulty: 'intermediate',
        overview: '',
        media: {
          gif_url: 'https://cdn.example.com/bench_press.gif',
          video_url: '',
          thumbnail_url: 'https://cdn.example.com/bench_press.jpg'
        },
        instructions: ['控制下放，稳定推起'],
        exercise_tips: ['肩胛后收'],
        common_mistakes: [],
        default_sets: 3,
        default_reps: 8,
        alternatives: [],
        tags: ['push'],
        source: {
          provider: 'ExerciseDB',
          source_id: 'bench_press'
        }
      },
      {
        exercise_id: 'wger_100',
        name_cn: '卧推',
        name_en: 'Bench Press',
        aliases: ['Bench Press'],
        category: 'push',
        equipment_required: ['full_gym'],
        primary_muscles: ['chest'],
        secondary_muscles: ['front_delts'],
        difficulty: 'intermediate',
        overview: '经典胸推动作',
        media: {
          gif_url: '',
          video_url: '',
          thumbnail_url: ''
        },
        instructions: ['平板卧推，杠铃下放至胸前后推起'],
        exercise_tips: [],
        common_mistakes: ['肘部外翻过大'],
        default_sets: 3,
        default_reps: 10,
        alternatives: [],
        tags: ['chest'],
        source: {
          provider: 'Wger',
          source_id: '100'
        }
      }
    ])

    expect(merged).toHaveLength(1)
    expect(merged[0].exercise_id).toBe('bench_press')
    expect(merged[0].media.gif_url).toBe('https://cdn.example.com/bench_press.gif')
    expect(merged[0].overview).toBe('经典胸推动作')
    expect(merged[0].common_mistakes).toContain('肘部外翻过大')
    expect(merged[0].source.provider).toBe('ExerciseDB')
    expect(merged[0].source.merged_from).toEqual(expect.arrayContaining(['ExerciseDB', 'Wger']))
  })

  test('normalizes Wger exercise payload with nested muscle and equipment objects', () => {
    const { normalizeWgerExercise } = require(syncScriptPath)

    const record = normalizeWgerExercise({
      id: 88,
      name: 'Pull Up',
      description: '<p>Pull yourself up until your chin passes the bar.</p>',
      category: { name: 'Back' },
      muscles: [{ name_en: 'Biceps' }, { name_en: 'Back' }],
      muscles_secondary: [{ name_en: 'Forearms' }],
      equipment: [{ name_en: 'Pull-up bar' }]
    }, 0, {
      provider: 'Wger',
      mediaBaseUrl: ''
    })

    expect(record.exercise_id).toBe('wger_88')
    expect(record.name_en).toBe('Pull Up')
    expect(record.primary_muscles).toEqual(expect.arrayContaining(['biceps', 'back']))
    expect(record.secondary_muscles).toContain('forearms')
    expect(record.equipment_required).toContain('full_gym')
    expect(record.instructions[0]).toContain('Pull yourself up')
  })

  test('builds next page url from paginated payload', () => {
    const { getNextPageUrl } = require(syncScriptPath)

    expect(getNextPageUrl({
      next: 'https://wger.example.com/api/v2/exerciseinfo/?page=2'
    }, 'https://wger.example.com/api/v2/exerciseinfo/?page=1')).toBe(
      'https://wger.example.com/api/v2/exerciseinfo/?page=2'
    )

    expect(getNextPageUrl({
      next: '/api/v2/exerciseinfo/?page=3'
    }, 'https://wger.example.com/api/v2/exerciseinfo/?page=2')).toBe(
      'https://wger.example.com/api/v2/exerciseinfo/?page=3'
    )
  })

  test('loads sync env file values without overriding existing process env', () => {
    const tempEnvPath = path.resolve(__dirname, '../tmp.exercise-sync.env')
    fs.writeFileSync(tempEnvPath, 'EXERCISEDB_SOURCE_URL=https://seed.example.com\nWGER_SOURCE_URL=https://wger.example.com\n', 'utf8')

    process.env.EXERCISEDB_SOURCE_URL = 'https://already-set.example.com'

    const { loadEnvFile } = require(syncScriptPath)
    loadEnvFile(tempEnvPath)

    expect(process.env.EXERCISEDB_SOURCE_URL).toBe('https://already-set.example.com')
    expect(process.env.WGER_SOURCE_URL).toBe('https://wger.example.com')

    fs.unlinkSync(tempEnvPath)
  })
})
