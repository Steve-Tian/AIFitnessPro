/**
 * training-resume.js — 断点恢复机制
 * 包含：快照校验、本地/云端快照合并、UI 状态计算
 */

const { PREP_COUNTDOWN_SECONDS } = require('./training-constants')

function clampProgress(currentSet, totalSets) {
  if (!totalSets || totalSets < 1) return 0
  const safeCurrent = currentSet < 0 ? 0 : currentSet
  const percent = Math.round((safeCurrent / totalSets) * 100)
  if (percent < 0) return 0
  if (percent > 100) return 100
  return percent
}

function buildSessionUiState(input) {
  const currentSet = typeof input.currentSet === 'number' ? input.currentSet : 1
  const totalSets = typeof input.totalSets === 'number' && input.totalSets > 0 ? input.totalSets : 3
  const isCountingDown = Boolean(input.isCountingDown)
  const isResting = Boolean(input.isResting)
  const hasLoadError = Boolean(input.loadError)
  const isLoading = Boolean(input.isLoading)

  return {
    progressPercent: clampProgress(currentSet, totalSets),
    prepStatusLabel: isResting ? '休息中' : '准备开始',
    actionButtonLabel: currentSet > totalSets ? '完成' : '开始',
    disabledButtonLabel: isCountingDown ? '进行中...' : '休息中...',
    skipButtonLabel: '跳过当前动作',
    setSkipButtonLabel: '跳过本组',
    restSkipButtonLabel: '跳过休息',
    showTrainingBody: !isLoading && !hasLoadError,
    showRestTimer: !isCountingDown && isResting,
    showMediaArea: !isCountingDown && !isResting
  }
}

function isResumeSnapshotUsable(snapshot) {
  if (!snapshot) return false
  if (snapshot.status === 'completed' || snapshot.status === 'abandoned') return false
  const savedAt = Number(snapshot.savedAt) || 0
  if (savedAt && Date.now() - savedAt > 24 * 3600 * 1000) return false
  const planLen = Number(snapshot.planLength) || 0
  const idx = Number(snapshot.currentExerciseIndex)
  if (planLen > 0 && Number.isFinite(idx) && idx >= planLen) return false
  return true
}

function cloudDocToResumeSnapshot(doc) {
  if (!doc) return null
  const rp = doc.resumePoint || {}
  const countdown = typeof rp.countdown === 'number' ? rp.countdown : PREP_COUNTDOWN_SECONDS
  let savedAt = Number(doc.clientSavedAt) || 0
  if (!savedAt && doc.updatedAt) {
    try {
      const u = doc.updatedAt
      const t = u instanceof Date ? u.getTime() : new Date(u).getTime()
      if (Number.isFinite(t)) savedAt = t
    } catch (e) {
      /* ignore */
    }
  }
  return {
    status: doc.status || 'in_progress',
    currentExerciseIndex: Number(rp.exerciseIndex) || 0,
    currentSet: Number(rp.set) || 1,
    totalSets: Number(rp.totalSets) || 3,
    isResting: Boolean(rp.isResting),
    isCountingDown: Boolean(rp.isCountingDown),
    countdown,
    workoutDate: doc.workoutDate || '',
    dayType: doc.dayType || '',
    exerciseFeedbackDrafts: doc.exerciseFeedbackDrafts || [],
    planLength: typeof rp.planLength === 'number' ? rp.planLength : 0,
    savedAt
  }
}

function pickNewerResumeSnapshot(local, remote) {
  const okLocal = isResumeSnapshotUsable(local)
  const okRemote = isResumeSnapshotUsable(remote)
  if (!okLocal && !okRemote) return null
  if (!okLocal) return remote
  if (!okRemote) return local
  const ta = Number(local.savedAt) || 0
  const tb = Number(remote.savedAt) || 0
  return ta >= tb ? local : remote
}

module.exports = {
  clampProgress,
  buildSessionUiState,
  isResumeSnapshotUsable,
  cloudDocToResumeSnapshot,
  pickNewerResumeSnapshot
}
