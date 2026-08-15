"use client"

import { useParams } from 'next/navigation'

export function CookieContent() {
  const params = useParams()
  const locale = params.locale as string
  const isZh = locale === 'zh'

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">
            {isZh ? 'Cookie政策' : 'Cookie Policy'}
          </h1>
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-8">
              {isZh ? '最后更新：2026年1月6日' : 'Last updated: January 6, 2026'}
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '1. 什么是Cookie' : '1. What Are Cookies'}
              </h2>
              <p className="mb-4">
                {isZh 
                  ? 'Cookie是在您访问网站时存储在您设备上的小型文本文件。Cookie帮助我们记住您的偏好设置，提供个性化体验，并改善我们网站的功能。'
                  : 'Cookies are small text files that are stored on your device when you visit a website. Cookies help us remember your preferences, provide personalized experiences, and improve our website functionality.'
                }
              </p>
              <p className="mb-4">
                {isZh
                  ? 'MokerSaaS使用Cookie和类似技术来增强您的用户体验，分析网站使用情况，并提供相关的AI服务功能。'
                  : 'MokerSaaS uses cookies and similar technologies to enhance your user experience, analyze website usage, and provide relevant AI service features.'
                }
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '2. 我们使用的Cookie类型' : '2. Types of Cookies We Use'}
              </h2>
              
              <h3 className="text-xl font-semibold mb-3">
                {isZh ? '2.1 必要Cookie' : '2.1 Necessary Cookies'}
              </h3>
              <p className="mb-4">
                {isZh ? '这些Cookie对于网站的基本功能是必需的，无法禁用：' : 'These cookies are essential for the basic functionality of the website and cannot be disabled:'}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{isZh ? '会话管理' : 'Session Management'}</strong>：
                  {isZh ? '保持您的登录状态和会话安全' : 'Maintaining your login status and session security'}
                </li>
                <li>
                  <strong>{isZh ? '安全Cookie' : 'Security Cookies'}</strong>：
                  {isZh ? '防止跨站请求伪造（CSRF）攻击' : 'Preventing Cross-Site Request Forgery (CSRF) attacks'}
                </li>
                <li>
                  <strong>{isZh ? '语言偏好' : 'Language Preferences'}</strong>：
                  {isZh ? '记住您选择的语言设置' : 'Remembering your chosen language settings'}
                </li>
                <li>
                  <strong>{isZh ? '负载均衡' : 'Load Balancing'}</strong>：
                  {isZh ? '确保请求被正确路由到服务器' : 'Ensuring requests are properly routed to servers'}
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {isZh ? '2.2 性能Cookie' : '2.2 Performance Cookies'}
              </h3>
              <p className="mb-4">
                {isZh ? '这些Cookie帮助我们了解网站的使用情况并改进性能：' : 'These cookies help us understand website usage and improve performance:'}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{isZh ? '分析Cookie' : 'Analytics Cookies'}</strong>：
                  {isZh ? '收集匿名的使用统计信息' : 'Collecting anonymous usage statistics'}
                </li>
                <li>
                  <strong>{isZh ? '性能监控' : 'Performance Monitoring'}</strong>：
                  {isZh ? '监控页面加载时间和错误' : 'Monitoring page load times and errors'}
                </li>
                <li>
                  <strong>{isZh ? '功能使用' : 'Feature Usage'}</strong>：
                  {isZh ? '了解哪些功能最受欢迎' : 'Understanding which features are most popular'}
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {isZh ? '2.3 功能Cookie' : '2.3 Functional Cookies'}
              </h3>
              <p className="mb-4">
                {isZh ? '这些Cookie增强网站功能并提供个性化体验：' : 'These cookies enhance website functionality and provide personalized experiences:'}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{isZh ? '用户偏好' : 'User Preferences'}</strong>：
                  {isZh ? '记住您的主题、字体大小等设置' : 'Remembering your theme, font size, and other settings'}
                </li>
                <li>
                  <strong>{isZh ? '个性化内容' : 'Personalized Content'}</strong>：
                  {isZh ? '根据您的使用历史提供相关建议' : 'Providing relevant suggestions based on your usage history'}
                </li>
                <li>
                  <strong>{isZh ? '表单数据' : 'Form Data'}</strong>：
                  {isZh ? '暂时保存表单输入以防意外丢失' : 'Temporarily saving form inputs to prevent accidental loss'}
                </li>
                <li>
                  <strong>{isZh ? 'AI服务偏好' : 'AI Service Preferences'}</strong>：
                  {isZh ? '记住您常用的AI模型、参数设置和生成历史' : 'Remembering your frequently used AI models, parameter settings, and generation history'}
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {isZh ? '2.4 第三方Cookie' : '2.4 Third-Party Cookies'}
              </h3>
              <p className="mb-4">
                {isZh ? '我们可能使用第三方服务提供商的Cookie：' : 'We may use cookies from third-party service providers:'}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{isZh ? '支付处理' : 'Payment Processing'}</strong>：
                  {isZh ? '安全处理支付交易' : 'Securely processing payment transactions'}
                </li>
                <li>
                  <strong>{isZh ? '客户支持' : 'Customer Support'}</strong>：
                  {isZh ? '提供在线客服和帮助功能' : 'Providing online customer service and help features'}
                </li>
                <li>
                  <strong>{isZh ? '内容分发' : 'Content Delivery'}</strong>：
                  {isZh ? '优化内容加载速度' : 'Optimizing content loading speed'}
                </li>
                <li>
                  <strong>{isZh ? 'AI模型提供商' : 'AI Model Providers'}</strong>：
                  {isZh ? '第三方AI服务（如OpenAI、Replicate等）可能使用Cookie来提供服务' : 'Third-party AI services (such as OpenAI, Replicate, etc.) may use cookies to provide services'}
                </li>
                <li>
                  <strong>{isZh ? '推广追踪' : 'Affiliate Tracking'}</strong>：
                  {isZh ? '记录推广来源以支持联盟营销计划' : 'Recording referral sources to support affiliate marketing programs'}
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '3. Cookie的用途' : '3. Cookie Purposes'}
              </h2>
              <p className="mb-4">
                {isZh ? '我们使用Cookie来实现以下目标：' : 'We use cookies to achieve the following goals:'}
              </p>
              
              <h3 className="text-xl font-semibold mb-3">
                {isZh ? '3.1 用户体验优化' : '3.1 User Experience Optimization'}
              </h3>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{isZh ? '提供流畅的导航体验' : 'Providing smooth navigation experience'}</li>
                <li>{isZh ? '记住您的偏好设置' : 'Remembering your preference settings'}</li>
                <li>{isZh ? '减少重复输入信息' : 'Reducing repetitive information input'}</li>
                <li>{isZh ? '提供个性化推荐' : 'Providing personalized recommendations'}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {isZh ? '3.2 安全保护' : '3.2 Security Protection'}
              </h3>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{isZh ? '防止未授权访问' : 'Preventing unauthorized access'}</li>
                <li>{isZh ? '检测和防止恶意活动' : 'Detecting and preventing malicious activities'}</li>
                <li>{isZh ? '保护账户安全' : 'Protecting account security'}</li>
                <li>{isZh ? '验证用户身份' : 'Verifying user identity'}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {isZh ? '3.3 服务改进' : '3.3 Service Improvement'}
              </h3>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{isZh ? '分析用户行为模式' : 'Analyzing user behavior patterns'}</li>
                <li>{isZh ? '识别和修复技术问题' : 'Identifying and fixing technical issues'}</li>
                <li>{isZh ? '优化网站性能' : 'Optimizing website performance'}</li>
                <li>{isZh ? '开发新功能' : 'Developing new features'}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '4. Cookie管理' : '4. Cookie Management'}
              </h2>
              <p className="mb-4">
                {isZh ? '您可以通过以下方式管理Cookie：' : 'You can manage cookies in the following ways:'}
              </p>
              
              <h3 className="text-xl font-semibold mb-3">
                {isZh ? '4.1 浏览器设置' : '4.1 Browser Settings'}
              </h3>
              <p className="mb-4">
                {isZh ? '大多数浏览器允许您：' : 'Most browsers allow you to:'}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{isZh ? '查看已存储的Cookie' : 'View stored cookies'}</li>
                <li>{isZh ? '删除特定或所有Cookie' : 'Delete specific or all cookies'}</li>
                <li>{isZh ? '阻止Cookie的设置' : 'Block cookie settings'}</li>
                <li>{isZh ? '设置Cookie到期时间' : 'Set cookie expiration time'}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {isZh ? '4.2 Cookie保留期' : '4.2 Cookie Retention Period'}
              </h3>
              <p className="mb-4">
                {isZh ? '不同类型的Cookie有不同的保留期：' : 'Different types of cookies have different retention periods:'}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{isZh ? '会话Cookie' : 'Session Cookies'}</strong>：
                  {isZh ? '浏览器关闭时自动删除' : 'Automatically deleted when browser is closed'}
                </li>
                <li>
                  <strong>{isZh ? '持久Cookie' : 'Persistent Cookies'}</strong>：
                  {isZh ? '根据设定的到期日期删除，最长不超过2年' : 'Deleted based on set expiration date, maximum 2 years'}
                </li>
                <li>
                  <strong>{isZh ? '功能Cookie' : 'Functional Cookies'}</strong>：
                  {isZh ? '通常保留30天到1年' : 'Usually retained for 30 days to 1 year'}
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {isZh ? '4.3 撤回同意' : '4.3 Withdrawing Consent'}
              </h3>
              <p className="mb-4">
                {isZh 
                  ? '您可以随时撤回对非必要Cookie的同意。请注意，这可能会影响某些网站功能的正常使用。'
                  : 'You can withdraw consent for non-essential cookies at any time. Please note that this may affect the normal use of certain website features.'
                }
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '5. 移动应用中的Cookie' : '5. Cookies in Mobile Apps'}
              </h2>
              <p className="mb-4">
                {isZh 
                  ? '在我们的移动应用中，我们使用类似Cookie的技术来实现相同的功能。这些技术包括：'
                  : 'In our mobile apps, we use cookie-like technologies to achieve the same functionality. These technologies include:'
                }
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{isZh ? '本地存储' : 'Local Storage'}</strong>：
                  {isZh ? '在设备上存储偏好设置和配置信息' : 'Storing preferences and configuration information on the device'}
                </li>
                <li>
                  <strong>{isZh ? '设备标识符' : 'Device Identifiers'}</strong>：
                  {isZh ? '用于分析和个性化服务' : 'Used for analytics and personalized services'}
                </li>
                <li>
                  <strong>{isZh ? '推送通知令牌' : 'Push Notification Tokens'}</strong>：
                  {isZh ? '发送相关通知和更新' : 'Sending relevant notifications and updates'}
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {isZh ? '6. 联系我们' : '6. Contact Us'}
              </h2>
              <p className="mb-4">
                {isZh 
                  ? '如果您对我们的Cookie政策有任何疑问或需要帮助管理Cookie设置，请联系我们：'
                  : 'If you have any questions about our Cookie Policy or need help managing cookie settings, please contact us:'
                }
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{isZh ? '邮箱：app@itusi.cn' : 'Email: app@itusi.cn'}</li>
                <li>{isZh ? '网站：https://mokersaas.com' : 'Website: https://mokersaas.com'}</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
} 