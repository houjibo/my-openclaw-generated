import { expect } from 'vitest'

// 全局测试配置
expect.extend({
  // 自定义匹配器可以在这里添加
})

// 清理函数
beforeAll(async () => {
  // 测试前的全局设置
})

afterAll(async () => {
  // 测试后的全局清理
})

// 每个测试后的清理
afterEach(() => {
  // 清理 mocks、临时数据等
})
