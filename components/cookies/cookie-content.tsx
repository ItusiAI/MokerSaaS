"use client"

import { useParams } from 'next/navigation'

type L = 'en' | 'zh' | 'ja' | 'ko' | 'tw'

export function CookieContent() {
  const params = useParams()
  const localeRaw = (params.locale as string) || 'en'
  const locale: L = (['en', 'zh', 'ja', 'ko', 'tw'] as const).includes(localeRaw as any)
    ? (localeRaw as L)
    : 'en'
  const t = (zh: string, tw: string, ja: string, ko: string, en: string): string => {
    if (locale === 'zh') return zh
    if (locale === 'tw') return tw
    if (locale === 'ja') return ja
    if (locale === 'ko') return ko
    return en
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">
            {t('Cookie政策', 'Cookie政策', 'Cookieポリシー', '쿠키 정책', 'Cookie Policy')}
          </h1>
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-8">
              {t('最后更新：2026年1月6日', '最後更新：2026年1月6日', '最終更新日：2026年1月6日', '최종 업데이트: 2026년 1월 6일', 'Last updated: January 6, 2026')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('1. 什么是Cookie', '1. 什麼是Cookie', '1. Cookieとは', '1. 쿠키란?', '1. What Are Cookies')}
              </h2>
              <p className="mb-4">
                {t(
                  'Cookie是在您访问网站时存储在您设备上的小型文本文件。Cookie帮助我们记住您的偏好设置，提供个性化体验，并改善我们网站的功能。',
                  'Cookie是在您訪問網站時存儲在您設備上的小型文本文件。Cookie幫助我們記住您的偏好設置，提供個性化體驗，並改善我們網站的功能。',
                  'Cookieとは、ウェブサイト訪問時にお客様のデバイスに保存される小さなテキストファイルです。Cookieはお客様の設定を記憶し、パーソナライズされた体験を提供し、ウェブサイト機能の向上に役立ちます。',
                  '쿠키는 웹사이트를 방문할 때 귀하의 장치에 저장되는 작은 텍스트 파일입니다. 쿠키는 귀하의 환경설정을 기억하고, 개인화된 경험을 제공하며, 웹사이트 기능을 개선하는 데 도움이 됩니다.',
                  'Cookies are small text files that are stored on your device when you visit a website. Cookies help us remember your preferences, provide personalized experiences, and improve our website functionality.'
                )}
              </p>
              <p className="mb-4">
                {t(
                  'MokerSaaS使用Cookie和类似技术来增强您的用户体验，分析网站使用情况，并提供相关的AI服务功能。',
                  'MokerSaaS使用Cookie和類似技術來增強您的用戶體驗，分析網站使用情況，並提供相關的AI服務功能。',
                  'MokerSaaSは、Cookieおよび類似技術を使用してユーザー体験を向上させ、ウェブサイト利用状況を分析し、関連するAIサービス機能を提供します。',
                  'MokerSaaS는 쿠키 및 유사 기술을 사용하여 사용자 경험을 향상시키고, 웹사이트 사용 현황을 분석하며, 관련 AI 서비스 기능을 제공합니다.',
                  'MokerSaaS uses cookies and similar technologies to enhance your user experience, analyze website usage, and provide relevant AI service features.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('2. 我们使用的Cookie类型', '2. 我們使用的Cookie類型', '2. 使用するCookieの種類', '2. 당사가 사용하는 쿠키 종류', '2. Types of Cookies We Use')}
              </h2>

              <h3 className="text-xl font-semibold mb-3">
                {t('2.1 必要Cookie', '2.1 必要Cookie', '2.1 必須Cookie', '2.1 필수 쿠키', '2.1 Necessary Cookies')}
              </h3>
              <p className="mb-4">
                {t('这些Cookie对于网站的基本功能是必需的，无法禁用：', '這些Cookie對於網站的基本功能是必需的，無法禁用：', 'これらのCookieはウェブサイト基本機能に必須であり、無効化できません：', '이 쿠키는 웹사이트의 기본 기능에 필수적이며 비활성화할 수 없습니다:', 'These cookies are essential for the basic functionality of the website and cannot be disabled:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{t('会话管理', '會話管理', 'セッション管理', '세션 관리', 'Session Management')}</strong>：
                  {t('保持您的登录状态和会话安全', '保持您的登錄狀態和會話安全', 'ログイン状態とセッションセキュリティを維持', '로그인 상태 및 세션 보안 유지', 'Maintaining your login status and session security')}
                </li>
                <li>
                  <strong>{t('安全Cookie', '安全Cookie', 'セキュリティCookie', '보안 쿠키', 'Security Cookies')}</strong>：
                  {t('防止跨站请求伪造（CSRF）攻击', '防止跨站請求偽造（CSRF）攻擊', 'クロスサイトリクエストフォージェリ（CSRF）攻撃を防止', '사이트 간 요청 위조(CSRF) 공격 방지', 'Preventing Cross-Site Request Forgery (CSRF) attacks')}
                </li>
                <li>
                  <strong>{t('语言偏好', '語言偏好', '言語設定', '언어 설정', 'Language Preferences')}</strong>：
                  {t('记住您选择的语言设置', '記住您選擇的語言設置', '選択された言語設定を記憶', '선택한 언어 설정을 기억', 'Remembering your chosen language settings')}
                </li>
                <li>
                  <strong>{t('负载均衡', '負載均衡', '負荷分散', '로드 밸런싱', 'Load Balancing')}</strong>：
                  {t('确保请求被正确路由到服务器', '確保請求被正確路由到服務器', 'リクエストが正しくサーバーにルーティングされることを確保', '요청이 서버로 올바르게 라우팅되도록 보장', 'Ensuring requests are properly routed to servers')}
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('2.2 性能Cookie', '2.2 性能Cookie', '2.2 パフォーマンスCookie', '2.2 성능 쿠키', '2.2 Performance Cookies')}
              </h3>
              <p className="mb-4">
                {t('这些Cookie帮助我们了解网站的使用情况并改进性能：', '這些Cookie幫助我們瞭解網站的使用情況並改進性能：', 'これらのCookieはウェブサイトの利用状況を把握し、パフォーマンスを改善するのに役立ちます：', '이 쿠키는 웹사이트 사용 현황 파악 및 성능 개선에 도움이 됩니다:', 'These cookies help us understand website usage and improve performance:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{t('分析Cookie', '分析Cookie', '分析Cookie', '분석 쿠키', 'Analytics Cookies')}</strong>：
                  {t('收集匿名的使用统计信息', '收集匿名的使用統計信息', '匿名の利用統計情報を収集', '익명의 사용 통계 정보 수집', 'Collecting anonymous usage statistics')}
                </li>
                <li>
                  <strong>{t('性能监控', '性能監控', 'パフォーマンス監視', '성능 모니터링', 'Performance Monitoring')}</strong>：
                  {t('监控页面加载时间和错误', '監控頁面加載時間和錯誤', 'ページ読み込み時間とエラーを監視', '페이지 로딩 시간 및 오류 모니터링', 'Monitoring page load times and errors')}
                </li>
                <li>
                  <strong>{t('功能使用', '功能使用', '機能利用', '기능 사용', 'Feature Usage')}</strong>：
                  {t('了解哪些功能最受欢迎', '瞭解哪些功能最受歡迎', 'どの機能が最も人気があるかを把握', '가장 인기 있는 기능 파악', 'Understanding which features are most popular')}
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('2.3 功能Cookie', '2.3 功能Cookie', '2.3 機能Cookie', '2.3 기능 쿠키', '2.3 Functional Cookies')}
              </h3>
              <p className="mb-4">
                {t('这些Cookie增强网站功能并提供个性化体验：', '這些Cookie增強網站功能並提供個性化體驗：', 'これらのCookieはウェブサイト機能を強化し、パーソナライズされた体験を提供します：', '이 쿠키는 웹사이트 기능을 강화하고 개인화된 경험을 제공합니다:', 'These cookies enhance website functionality and provide personalized experiences:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{t('用户偏好', '用戶偏好', 'ユーザー設定', '사용자 환경설정', 'User Preferences')}</strong>：
                  {t('记住您的主题、字体大小等设置', '記住您的主題、字體大小等設置', 'テーマ、フォントサイズなどの設定を記憶', '테마, 글꼴 크기 등 설정 기억', 'Remembering your theme, font size, and other settings')}
                </li>
                <li>
                  <strong>{t('个性化内容', '個性化內容', 'パーソナライズされたコンテンツ', '맞춤형 콘텐츠', 'Personalized Content')}</strong>：
                  {t('根据您的使用历史提供相关建议', '根據您的使用歷史提供相關建議', '利用履歴に基づいて関連する提案を提供', '이용 이력에 따라 관련 제안 제공', 'Providing relevant suggestions based on your usage history')}
                </li>
                <li>
                  <strong>{t('表单数据', '表單數據', 'フォームデータ', '양식 데이터', 'Form Data')}</strong>：
                  {t('暂时保存表单输入以防意外丢失', '暫時保存表單輸入以防意外丟失', 'フォーム入力を一時的に保存し、偶発的な損失を防止', '실수로 인한 손실을 방지하기 위해 양식 입력을 일시적으로 저장', 'Temporarily saving form inputs to prevent accidental loss')}
                </li>
                <li>
                  <strong>{t('AI服务偏好', 'AI服務偏好', 'AIサービス設定', 'AI 서비스 설정', 'AI Service Preferences')}</strong>：
                  {t('记住您常用的AI模型、参数设置和生成历史', '記住您常用的AI模型、參數設置和生成歷史', 'よく使うAIモデル、パラメータ設定、生成履歴を記憶', '자주 사용하는 AI 모델, 매개변수 설정 및 생성 이력 기억', 'Remembering your frequently used AI models, parameter settings, and generation history')}
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('2.4 第三方Cookie', '2.4 第三方Cookie', '2.4 第三者Cookie', '2.4 제3자 쿠키', '2.4 Third-Party Cookies')}
              </h3>
              <p className="mb-4">
                {t('我们可能使用第三方服务提供商的Cookie：', '我們可能使用第三方服務提供商的Cookie：', '第三者サービス提供者のCookieを使用する場合があります：', '당사는 제3자 서비스 제공업체의 쿠키를 사용할 수 있습니다:', 'We may use cookies from third-party service providers:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{t('支付处理', '支付處理', '決済処理', '결제 처리', 'Payment Processing')}</strong>：
                  {t('安全处理支付交易', '安全處理支付交易', '決済トランザクションを安全に処理', '결제 거래를 안전하게 처리', 'Securely processing payment transactions')}
                </li>
                <li>
                  <strong>{t('客户支持', '客戶支持', 'カスタマーサポート', '고객 지원', 'Customer Support')}</strong>：
                  {t('提供在线客服和帮助功能', '提供在線客服和幫助功能', 'オンラインカスタマーサービスとヘルプ機能を提供', '온라인 고객 서비스 및 도움말 기능 제공', 'Providing online customer service and help features')}
                </li>
                <li>
                  <strong>{t('内容分发', '內容分發', 'コンテンツ配信', '콘텐츠 배포', 'Content Delivery')}</strong>：
                  {t('优化内容加载速度', '優化內容加載速度', 'コンテンツ読み込み速度を最適化', '콘텐츠 로딩 속도 최적화', 'Optimizing content loading speed')}
                </li>
                <li>
                  <strong>{t('AI模型提供商', 'AI模型提供商', 'AIモデル提供者', 'AI 모델 제공업체', 'AI Model Providers')}</strong>：
                  {t('第三方AI服务（如OpenAI、Replicate等）可能使用Cookie来提供服务', '第三方AI服務（如OpenAI、Replicate等）可能使用Cookie來提供服務', '第三者AIサービス（OpenAI、Replicateなど）がサービス提供のためにCookieを使用する場合があります', '제3자 AI 서비스(예: OpenAI, Replicate 등)는 서비스 제공을 위해 쿠키를 사용할 수 있습니다', 'Third-party AI services (such as OpenAI, Replicate, etc.) may use cookies to provide services')}
                </li>
                <li>
                  <strong>{t('推广追踪', '推廣追蹤', 'アフィリエイト追跡', '제휴 추적', 'Affiliate Tracking')}</strong>：
                  {t('记录推广来源以支持联盟营销计划', '記錄推廣來源以支持聯盟營銷計劃', 'アフィリエイトマーケティングプログラムを支援するreferrerを記録', '제휴 마케팅 프로그램을 지원하기 위해 추천 경로를 기록', 'Recording referral sources to support affiliate marketing programs')}
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('3. Cookie的用途', '3. Cookie的用途', '3. Cookieの目的', '3. 쿠키의 용도', '3. Cookie Purposes')}
              </h2>
              <p className="mb-4">
                {t('我们使用Cookie来实现以下目标：', '我們使用Cookie來實現以下目標：', '次の目標を達成するためにCookieを使用します：', '당사는 다음의 목표를 달성하기 위해 쿠키를 사용합니다:', 'We use cookies to achieve the following goals:')}
              </p>

              <h3 className="text-xl font-semibold mb-3">
                {t('3.1 用户体验优化', '3.1 用戶體驗優化', '3.1 ユーザー体験の最適化', '3.1 사용자 경험 최적화', '3.1 User Experience Optimization')}
              </h3>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('提供流畅的导航体验', '提供流暢的導航體驗', 'スムーズなナビゲーション体験を提供', '원활한 탐색 경험 제공', 'Providing smooth navigation experience')}</li>
                <li>{t('记住您的偏好设置', '記住您的偏好設置', 'お客様の設定を記憶', '사용자의 환경설정을 기억', 'Remembering your preference settings')}</li>
                <li>{t('减少重复输入信息', '減少重複輸入信息', '繰り返し情報入力を削減', '반복적인 정보 입력 감소', 'Reducing repetitive information input')}</li>
                <li>{t('提供个性化推荐', '提供個性化推薦', 'パーソナライズされたおすすめを提供', '맞춤형 추천 제공', 'Providing personalized recommendations')}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('3.2 安全保护', '3.2 安全保護', '3.2 セキュリティ保護', '3.2 보안 보호', '3.2 Security Protection')}
              </h3>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('防止未授权访问', '防止未授權訪問', '不正アクセスを防止', '무단 액세스 방지', 'Preventing unauthorized access')}</li>
                <li>{t('检测和防止恶意活动', '檢測和防止惡意活動', '悪意のある活動を検知および防止', '악의적인 활동 탐지 및 방지', 'Detecting and preventing malicious activities')}</li>
                <li>{t('保护账户安全', '保護賬戶安全', 'アカウントセキュリティを保護', '계정 보안 보호', 'Protecting account security')}</li>
                <li>{t('验证用户身份', '驗證用戶身份', 'ユーザーIDを確認', '사용자 신원 확인', 'Verifying user identity')}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('3.3 服务改进', '3.3 服務改進', '3.3 サービス改善', '3.3 서비스 개선', '3.3 Service Improvement')}
              </h3>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('分析用户行为模式', '分析用戶行為模式', 'ユーザーの行動パターンを分析', '사용자 행동 패턴 분석', 'Analyzing user behavior patterns')}</li>
                <li>{t('识别和修复技术问题', '識別和修復技術問題', '技術的問題を特定および修正', '기술적 문제 식별 및 수정', 'Identifying and fixing technical issues')}</li>
                <li>{t('优化网站性能', '優化網站性能', 'ウェブサイトのパフォーマンスを最適化', '웹사이트 성능 최적화', 'Optimizing website performance')}</li>
                <li>{t('开发新功能', '開發新功能', '新機能を開発', '새로운 기능 개발', 'Developing new features')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('4. Cookie管理', '4. Cookie管理', '4. Cookie管理', '4. 쿠키 관리', '4. Cookie Management')}
              </h2>
              <p className="mb-4">
                {t('您可以通过以下方式管理Cookie：', '您可以通過以下方式管理Cookie：', '次の方法でCookieを管理できます：', '다음 방법으로 쿠키를 관리할 수 있습니다:', 'You can manage cookies in the following ways:')}
              </p>

              <h3 className="text-xl font-semibold mb-3">
                {t('4.1 浏览器设置', '4.1 瀏覽器設置', '4.1 ブラウザー設定', '4.1 브라우저 설정', '4.1 Browser Settings')}
              </h3>
              <p className="mb-4">
                {t('大多数浏览器允许您：', '大多數瀏覽器允許您：', 'ほとんどのブラウザーで次のことができます：', '대부분의 브라우저에서 다음 작업을 수행할 수 있습니다:', 'Most browsers allow you to:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('查看已存储的Cookie', '查看已存儲的Cookie', '保存されたCookieを確認', '저장된 쿠키 확인', 'View stored cookies')}</li>
                <li>{t('删除特定或所有Cookie', '刪除特定或所有Cookie', '特定のCookieまたはすべてのCookieを削除', '특정 또는 모든 쿠키 삭제', 'Delete specific or all cookies')}</li>
                <li>{t('阻止Cookie的设置', '阻止Cookie的設置', 'Cookie設定をブロック', '쿠키 설정 차단', 'Block cookie settings')}</li>
                <li>{t('设置Cookie到期时间', '設置Cookie到期時間', 'Cookieの有効期限を設定', '쿠키 만료 시간 설정', 'Set cookie expiration time')}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('4.2 Cookie保留期', '4.2 Cookie保留期', '4.2 Cookieの保持期間', '4.2 쿠키 보존 기간', '4.2 Cookie Retention Period')}
              </h3>
              <p className="mb-4">
                {t('不同类型的Cookie有不同的保留期：', '不同類型的Cookie有不同的保留期：', 'Cookieの種類により保持期間が異なります：', '쿠키 유형에 따라 보존 기간이 다릅니다:', 'Different types of cookies have different retention periods:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{t('会话Cookie', '會話Cookie', 'セッションCookie', '세션 쿠키', 'Session Cookies')}</strong>：
                  {t('浏览器关闭时自动删除', '瀏覽器關閉時自動刪除', 'ブラウザー終了時に自動的に削除', '브라우저를 닫을 때 자동으로 삭제', 'Automatically deleted when browser is closed')}
                </li>
                <li>
                  <strong>{t('持久Cookie', '持久Cookie', '永続Cookie', '지속 쿠키', 'Persistent Cookies')}</strong>：
                  {t('根据设定的到期日期删除，最长不超过2年', '根據設定的到期日期刪除，最長不超過2年', '設定された有効期限に従って削除（最長2年）', '설정된 만료일에 따라 삭제되며, 최대 2년', 'Deleted based on set expiration date, maximum 2 years')}
                </li>
                <li>
                  <strong>{t('功能Cookie', '功能Cookie', '機能Cookie', '기능 쿠키', 'Functional Cookies')}</strong>：
                  {t('通常保留30天到1年', '通常保留30天到1年', '通常30日から1年保持', '보통 30일에서 1년 동안 보존', 'Usually retained for 30 days to 1 year')}
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('4.3 撤回同意', '4.3 撤回同意', '4.3 同意の撤回', '4.3 동의 철회', '4.3 Withdrawing Consent')}
              </h3>
              <p className="mb-4">
                {t(
                  '您可以随时撤回对非必要Cookie的同意。请注意，这可能会影响某些网站功能的正常使用。',
                  '您可以隨時撤回對非必要Cookie的同意。請注意，這可能會影響某些網站功能的正常使用。',
                  '不要なCookieへの同意はいつでも撤回できます。これにより一部のウェブサイト機能が正常使用できなくなる可能性があることにご注意ください。',
                  '필수가 아닌 쿠키에 대한 동의는 언제든지 철회할 수 있습니다. 이로 인해 일부 웹사이트 기능의 정상적인 사용이 영향을 받을 수 있습니다.',
                  'You can withdraw consent for non-essential cookies at any time. Please note that this may affect the normal use of certain website features.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('5. 移动应用中的Cookie', '5. 移動應用中的Cookie', '5. モバイルアプリのCookie', '5. 모바일 앱의 쿠키', '5. Cookies in Mobile Apps')}
              </h2>
              <p className="mb-4">
                {t(
                  '在我们的移动应用中，我们使用类似Cookie的技术来实现相同的功能。这些技术包括：',
                  '在我們的移動應用中，我們使用類似Cookie的技術來實現相同的功能。這些技術包括：',
                  'モバイルアプリでは、Cookie類似技術を利用して同等の機能を実現しています。これらの技術には以下が含まれます：',
                  '당사의 모바일 앱에서는 쿠키와 유사한 기술을 사용하여 동일한 기능을 구현합니다. 이러한 기술은 다음과 같습니다:',
                  'In our mobile apps, we use cookie-like technologies to achieve the same functionality. These technologies include:'
                )}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{t('本地存储', '本地存儲', 'ローカルストレージ', '로컬 스토리지', 'Local Storage')}</strong>：
                  {t('在设备上存储偏好设置和配置信息', '在設備上存儲偏好設置和配置信息', 'デバイスに設定と構成情報を保存', '기기에 환경설정 및 구성 정보를 저장', 'Storing preferences and configuration information on the device')}
                </li>
                <li>
                  <strong>{t('设备标识符', '設備標識符', 'デバイス識別子', '기기 식별자', 'Device Identifiers')}</strong>：
                  {t('用于分析和个性化服务', '用於分析和個性化服務', '分析およびパーソナライズサービスに使用', '분석 및 개인화된 서비스에 사용', 'Used for analytics and personalized services')}
                </li>
                <li>
                  <strong>{t('推送通知令牌', '推送通知令牌', 'プッシュ通知トークン', '푸시 알림 토큰', 'Push Notification Tokens')}</strong>：
                  {t('发送相关通知和更新', '發送相關通知和更新', '関連する通知および更新を送信', '관련 알림 및 업데이트 발송', 'Sending relevant notifications and updates')}
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('6. 联系我们', '6. 聯繫我們', '6. お問い合わせ', '6. 문의하기', '6. Contact Us')}
              </h2>
              <p className="mb-4">
                {t(
                  '如果您对我们的Cookie政策有任何疑问或需要帮助管理Cookie设置，请联系我们：',
                  '如果您對我們的Cookie政策有任何疑問或需要幫助管理Cookie設置，請聯繫我們：',
                  'Cookieポリシーに関するご質問がある場合、またはCookie設定の管理についてサポートが必要な場合は、当社までご連絡ください：',
                  '당사의 쿠키 정책에 대해 궁금한 점이 있거나 쿠키 설정 관리에 도움이 필요하신 경우 당사에 문의하시기 바랍니다:',
                  'If you have any questions about our Cookie Policy or need help managing cookie settings, please contact us:'
                )}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('邮箱：app@itusi.cn', '郵箱：app@itusi.cn', 'メール：app@itusi.cn', '이메일: app@itusi.cn', 'Email: app@itusi.cn')}</li>
                <li>{t('网站：https://mokersaas.com', '網站：https://mokersaas.com', 'ウェブサイト：https://mokersaas.com', '웹사이트: https://mokersaas.com', 'Website: https://mokersaas.com')}</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}