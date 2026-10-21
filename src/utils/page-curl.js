/**
 * 番茄 / 七猫小说风格 纸张仿真卷页物理引擎 (Page Curl Physics Engine)
 * 纯原生 Canvas 2D，零外部依赖，极度轻量与高帧率。
 *
 * 核心特性：
 * 1. 手指拖动时，纸页随触点位置逐渐卷起，露出底层下一页；
 * 2. 卷起部分包含逼真的纸张背面、对角折痕、圆柱微曲弧面高光与立体落页投射阴影；
 * 3. 松手后根据拖拽距离和瞬时速度，物理惯性自动完成翻页或弹性回弹；
 * 4. 点击屏幕边缘，也能播放优雅完整的全屏仿真卷页动画；
 * 5. 适配浅色（宣纸/暖白）与深色（月下）主题的古卷质感。
 */

export class PageCurlEngine {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.width = 0
    this.height = 0
    this.dpr = window.devicePixelRatio || 1

    // 状态机
    this.isActive = false // 是否正在翻页交互中（拖拽或自动动画）
    this.isDragging = false // 是否处于手指拖拽阶段
    this.direction = 'next' // 'next' (右下角掀起向左翻) | 'prev' (左下角掀起向右翻)
    this.themeKey = 'warm'

    // 几何触点
    this.originX = 0
    this.originY = 0
    this.curX = 0
    this.curY = 0

    // 速度追踪（惯性判定）
    this.lastTouchX = 0
    this.lastTouchTime = 0
    this.velocityX = 0

    // 动画调度
    this.animId = null
    this.onFlipComplete = null
    this.onFlipMidway = null
    this.midwayTriggered = false
  }

  resize(w, h) {
    this.width = w
    this.height = h
    this.dpr = window.devicePixelRatio || 1
    this.canvas.width = Math.round(w * this.dpr)
    this.canvas.height = Math.round(h * this.dpr)
    this.canvas.style.width = `${w}px`
    this.canvas.style.height = `${h}px`
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.scale(this.dpr, this.dpr)
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  /**
   * 手指按下：开始拖拽卷角
   * @param {number} x 触摸起点 x
   * @param {number} y 触摸起点 y
   * @param {'next'|'prev'} dir 翻页方向
   */
  startDrag(x, y, dir = 'next', themeKey = 'warm') {
    if (this.animId) cancelAnimationFrame(this.animId)
    this.themeKey = themeKey
    this.direction = dir
    this.isActive = true
    this.isDragging = true
    this.midwayTriggered = false

    const w = this.width
    const h = this.height

    // 初始原角点：向后翻从右下角起卷，向前翻从左下角起卷
    this.originX = dir === 'next' ? w : 0
    this.originY = h

    // 初始卷起触点
    this.curX = this.originX
    this.curY = this.originY

    this.lastTouchX = x
    this.lastTouchTime = performance.now()
    this.velocityX = 0

    this.clear()
  }

  /**
   * 手指移动：实时跟随拖拽更新纸角
   */
  dragTo(x, y) {
    if (!this.isActive || !this.isDragging) return

    const now = performance.now()
    const dt = now - this.lastTouchTime
    if (dt > 10) {
      this.velocityX = (x - this.lastTouchX) / dt
      this.lastTouchX = x
      this.lastTouchTime = now
    }

    const w = this.width
    const h = this.height

    // 限制触点在合理范围内，避免过度扭曲物理模型
    let targetX = x
    let targetY = y

    if (this.direction === 'next') {
      targetX = Math.min(w - 2, Math.max(-w * 0.4, x))
      targetY = Math.min(h, Math.max(h * 0.15, y))
    } else {
      targetX = Math.max(2, Math.min(w * 1.4, x))
      targetY = Math.min(h, Math.max(h * 0.15, y))
    }

    this.curX = targetX
    this.curY = targetY

    this.render()
  }

  /**
   * 手指松开：根据位移与速度判定是自动完成翻页，还是弹性回弹
   */
  releaseDrag(callbacks = {}) {
    if (!this.isActive || !this.isDragging) return
    this.isDragging = false

    this.onFlipMidway = callbacks.onMidway
    this.onFlipComplete = callbacks.onComplete

    const w = this.width
    const h = this.height
    const isNext = this.direction === 'next'

    // 拖拽位移与阈值判定
    const dragDistance = isNext ? this.originX - this.curX : this.curX - this.originX
    const threshold = w * 0.28 // 拖过屏幕 28% 即可触发完成翻页
    const flickVelocity = isNext ? -0.42 : 0.42 // 快速划过速度阈值

    const shouldComplete =
      dragDistance > threshold ||
      (isNext ? this.velocityX < flickVelocity : this.velocityX > flickVelocity)

    if (shouldComplete) {
      // 自动平滑完成翻页：甩出屏幕
      const targetX = isNext ? -w * 0.45 : w * 1.45
      const targetY = -h * 0.18
      this.animateTo(targetX, targetY, true)
    } else {
      // 拖拽距离不够，自动弹性回弹放平纸张
      this.animateTo(this.originX, this.originY, false)
    }
  }

  /**
   * 点击屏幕边缘或按键触发的完整自动翻页动画
   */
  autoFlip(dir = 'next', themeKey = 'warm', callbacks = {}) {
    if (this.animId) cancelAnimationFrame(this.animId)
    this.themeKey = themeKey
    this.direction = dir
    this.isActive = true
    this.isDragging = false
    this.midwayTriggered = false
    this.onFlipMidway = callbacks.onMidway
    this.onFlipComplete = callbacks.onComplete

    const w = this.width
    const h = this.height
    const isNext = dir === 'next'

    this.originX = isNext ? w : 0
    this.originY = h

    const startX = this.originX
    const startY = this.originY
    const targetX = isNext ? -w * 0.45 : w * 1.45
    const targetY = -h * 0.18

    const duration = 380
    const startTime = performance.now()

    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(1, Math.max(0, elapsed / duration))
      const p = easeInOutCubic(progress)

      // 角尖沿自然抛物弧线向左上方移动
      this.curX = startX + (targetX - startX) * p
      const arcLift = Math.sin(p * Math.PI) * (h * 0.12)
      this.curY = startY + (targetY - startY) * p - arcLift

      if (progress >= 0.38 && !this.midwayTriggered) {
        this.midwayTriggered = true
        this.onFlipMidway?.()
      }

      this.render()

      if (progress < 1) {
        this.animId = requestAnimationFrame(step)
      } else {
        this.clear()
        this.isActive = false
        this.animId = null
        this.onFlipComplete?.()
      }
    }

    this.animId = requestAnimationFrame(step)
  }

  /**
   * 平滑插值动画到指定目标点 (用于松手后的完成或回弹)
   */
  animateTo(targetX, targetY, isCompleting) {
    if (this.animId) cancelAnimationFrame(this.animId)

    const startX = this.curX
    const startY = this.curY
    const startTime = performance.now()
    const duration = isCompleting ? 280 : 220

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(1, Math.max(0, elapsed / duration))
      const p = easeOutCubic(progress)

      this.curX = startX + (targetX - startX) * p
      this.curY = startY + (targetY - startY) * p

      if (isCompleting && progress >= 0.35 && !this.midwayTriggered) {
        this.midwayTriggered = true
        this.onFlipMidway?.()
      }

      this.render()

      if (progress < 1) {
        this.animId = requestAnimationFrame(step)
      } else {
        this.clear()
        this.isActive = false
        this.animId = null
        if (isCompleting) {
          this.onFlipComplete?.()
        }
      }
    }

    this.animId = requestAnimationFrame(step)
  }

  /**
   * 核心 Canvas 卷页物理绘制流水线
   */
  render() {
    const w = this.width
    const h = this.height
    if (w <= 0 || h <= 0) return

    const ctx = this.ctx
    const isNext = this.direction === 'next'
    const ox = this.originX
    const oy = this.originY
    const cx = this.curX
    const cy = this.curY

    this.clear()

    // 卷起位移微弱时（静止状态）不绘制
    const dist = Math.hypot(cx - ox, cy - oy)
    if (dist < 8) return

    const palette = this.getThemePalette(this.themeKey)

    // 1. 计算折痕控制几何
    // 卷起跨度比率
    const spanRatio = Math.min(1.4, dist / (w * 0.95))

    // 侧边界折点与底边界折点
    const edgeY = Math.max(-h * 0.2, h - spanRatio * (h * 0.92))
    const bottomX = isNext
      ? Math.max(-w * 0.3, w - spanRatio * (w * 0.92))
      : Math.min(w * 1.3, spanRatio * (w * 0.92))

    // 2. 绘制露出的下一页底板与落纸立体投影 (Drop Shadow onto next page)
    ctx.save()
    ctx.beginPath()
    if (isNext) {
      ctx.moveTo(w, edgeY)
      ctx.lineTo(cx, cy)
      ctx.lineTo(bottomX, h)
      ctx.lineTo(w, h)
    } else {
      ctx.moveTo(0, edgeY)
      ctx.lineTo(cx, cy)
      ctx.lineTo(bottomX, h)
      ctx.lineTo(0, h)
    }
    ctx.closePath()

    // 填充底层露出区域的纸张底色（真实透出下一页背景）
    ctx.fillStyle = palette.underPageBg
    ctx.fill()

    // 沿折痕落下的深邃漫反射软阴影
    const shadowGrad = ctx.createRadialGradient(
      cx,
      cy,
      5,
      (ox + cx) / 2,
      (oy + cy) / 2,
      Math.max(w, h) * 0.85
    )
    shadowGrad.addColorStop(0, palette.shadowStrong)
    shadowGrad.addColorStop(0.32, palette.shadowSoft)
    shadowGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = shadowGrad
    ctx.fill()
    ctx.restore()

    // 3. 绘制被掀起折叠的纸张背面 (Curled Backside Flap)
    ctx.save()
    ctx.beginPath()
    if (isNext) {
      // 贝塞尔圆弧拱形（纸张受力自然拱起的圆柱微曲面）
      ctx.moveTo(w, Math.max(0, edgeY))
      ctx.quadraticCurveTo(
        w - (w - cx) * 0.38,
        edgeY + (cy - edgeY) * 0.58,
        cx,
        cy
      )
      ctx.quadraticCurveTo(
        bottomX + (cx - bottomX) * 0.58,
        h - (h - cy) * 0.38,
        Math.max(0, bottomX),
        h
      )
    } else {
      ctx.moveTo(0, Math.max(0, edgeY))
      ctx.quadraticCurveTo(
        cx * 0.38,
        edgeY + (cy - edgeY) * 0.58,
        cx,
        cy
      )
      ctx.quadraticCurveTo(
        bottomX + (cx - bottomX) * 0.58,
        h - (h - cy) * 0.38,
        Math.min(w, bottomX),
        h
      )
    }
    ctx.closePath()

    // 纸背底色
    ctx.fillStyle = palette.backBg
    ctx.fill()

    // 4. 纸背圆柱微曲面的圆弧高光与暗角光影 (Cylinder Specular Gradient)
    const curlGrad = ctx.createLinearGradient(
      isNext ? w : 0,
      edgeY,
      cx,
      cy
    )
    curlGrad.addColorStop(0, palette.creaseEdge)
    curlGrad.addColorStop(0.24, palette.backBg)
    curlGrad.addColorStop(0.58, palette.highlight)
    curlGrad.addColorStop(0.82, palette.backBg)
    curlGrad.addColorStop(1, palette.creaseEdge)

    ctx.fillStyle = curlGrad
    ctx.fill()

    // 5. 纸张边缘超微细致描边 (0.8px 纸张裁切厚度高光)
    ctx.lineWidth = 1.0
    ctx.strokeStyle = palette.strokeColor
    ctx.stroke()

    ctx.restore()
  }

  getThemePalette(themeKey) {
    if (themeKey === 'night') {
      return {
        underPageBg: '#111D26',
        backBg: '#182733',
        creaseEdge: 'rgba(8, 14, 20, 0.72)',
        highlight: 'rgba(64, 88, 108, 0.42)',
        strokeColor: 'rgba(100, 128, 150, 0.32)',
        shadowStrong: 'rgba(0, 0, 0, 0.55)',
        shadowSoft: 'rgba(0, 0, 0, 0.22)',
      }
    }
    if (themeKey === 'paper') {
      return {
        underPageBg: '#f7f1e7',
        backBg: '#f0e6d6',
        creaseEdge: 'rgba(185, 165, 140, 0.62)',
        highlight: 'rgba(255, 253, 248, 0.85)',
        strokeColor: 'rgba(180, 155, 130, 0.38)',
        shadowStrong: 'rgba(55, 40, 25, 0.32)',
        shadowSoft: 'rgba(55, 40, 25, 0.1)',
      }
    }
    // 暖白 (warm)
    return {
      underPageBg: '#f8f7f2',
      backBg: '#f0eee6',
      creaseEdge: 'rgba(180, 188, 178, 0.62)',
      highlight: 'rgba(255, 255, 255, 0.92)',
      strokeColor: 'rgba(160, 172, 158, 0.38)',
      shadowStrong: 'rgba(35, 50, 40, 0.28)',
      shadowSoft: 'rgba(35, 50, 40, 0.08)',
    }
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId)
    this.animId = null
    this.isActive = false
    this.isDragging = false
  }
}
