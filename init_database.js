/**
 * AIFitnessPro - 云数据库初始化脚本
 * 
 * 请在微信开发者工具的云开发控制台中执行此脚本
 * 用于创建项目所需的数据库集合
 */

// 1. 创建 users 集合（用户档案）
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_openid', 'profile', 'created_at'],
      properties: {
        _openid: {
          bsonType: 'string',
          description: '用户的OpenID（必填）'
        },
        profile: {
          bsonType: 'object',
          required: ['gender', 'age', 'height', 'weight', 'goal', 'experience', 'days_per_week', 'equipment', 'persona'],
          properties: {
            gender: { bsonType: 'string' },
            age: { bsonType: 'int' },
            height: { bsonType: 'int' },
            weight: { bsonType: 'int' },
            goal: { bsonType: 'string' },
            experience: { bsonType: 'string' },
            days_per_week: { bsonType: 'int' },
            equipment: { bsonType: 'array' },
            persona: { bsonType: 'string' }
          }
        },
        streak_days: { bsonType: 'int', default: 0 },
        current_plan_id: { bsonType: 'string' },
        achievements: { bsonType: 'array', default: [] },
        total_points: { bsonType: 'int', default: 0 },
        onboarding_completed: { bsonType: 'bool', default: false },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
        last_training_date: { bsonType: 'date' }
      }
    }
  }
})

// 2. 创建 plans 集合（训练计划）
db.createCollection('plans', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'userId', 'startDate', 'endDate', 'weeklyPlan'],
      properties: {
        _id: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        startDate: { bsonType: 'date' },
        endDate: { bsonType: 'date' },
        weeklyPlan: { 
          bsonType: 'array',
          items: {
            type: 'object',
            properties: {
              date: { bsonType: 'date' },
              type: { bsonType: 'string' }, // 'push', 'pull', 'legs', 'rest'
              title: { bsonType: 'string' },
              workout: {
                bsonType: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { bsonType: 'string' },
                    alias: { bsonType: 'string' },
                    sets: { bsonType: 'int' },
                    reps: { bsonType: 'int' },
                    rest: { bsonType: 'int' }
                  }
                }
              },
              focus_muscles: { bsonType: 'array' },
              note: { bsonType: 'string' }
            }
          }
        },
        session_feedback: { 
          bsonType: 'array',
          items: {
            type: 'object',
            properties: {
              exerciseIndex: { bsonType: 'int' },
              rpe: { bsonType: 'int' },
              completedAt: { bsonType: 'date' },
              intensityAdjustment: { bsonType: 'number' }
            }
          }
        },
        createdAt: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
})

// 3. 创建 feedback 集合（训练反馈）
db.createCollection('feedback', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'planId', 'userId', 'exerciseIndex', 'rpe', 'completedAt'],
      properties: {
        _id: { bsonType: 'string' },
        planId: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        exerciseIndex: { bsonType: 'int' },
        rpe: { bsonType: 'int', minimum: 6, maximum: 10 },
        completedAt: { bsonType: 'date' },
        intensityAdjustment: { bsonType: 'number' }
      }
    }
  }
})

// 4. 创建 achievement_logs 集合（成就日志）
db.createCollection('achievement_logs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'userId', 'achievementId', 'unlockedAt', 'pointsAwarded'],
      properties: {
        _id: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        achievementId: { bsonType: 'string' },
        unlockedAt: { bsonType: 'date' },
        pointsAwarded: { bsonType: 'int' }
      }
    }
  }
})

console.log('✅ AIFitnessPro 数据库集合创建完成！');
console.log('📋 已创建集合：');
console.log('   - users: 用户档案');
console.log('   - plans: 训练计划'); 
console.log('   - feedback: 训练反馈');
console.log('   - achievement_logs: 成就日志');
console.log('');
console.log('💡 提示：现在可以在微信开发者工具中上传云函数了！');