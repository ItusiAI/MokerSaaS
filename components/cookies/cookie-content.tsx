"use client"

import { useParams } from 'next/navigation'

type L = 'en' | 'zh-CN' | 'ja' | 'ko' | 'zh-TW'

export function CookieContent() {
  const params = useParams()
  const localeRaw = (params.locale as string) || 'en'
  const locale: L = (['en', 'zh-CN', 'ja', 'ko', 'zh-TW'] as const).includes(localeRaw as any)
    ? (localeRaw as L)
    : 'en'
  const t = (zh: string, tw: string, ja: string, ko: string, en: string): string => {
    if (locale === 'zh-CN') return zh
    if (locale === 'zh-TW') return tw
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
              {t('最后更新：2026年8月22日', '最後更新：2026年8月22日', '最終更新日：2026年8月22日', '최종 업데이트: 2026년 8월 22일', 'Last updated: August 22, 2026')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('1. 什么是Cookie', '1. 什麼是Cookie', '1. Cookieとは', '1. 쿠키란?', '1. What Are Cookies')}
              </h2>
              <p className="mb-4">
                {t(
                  'Cookie 是您访问网站时存储在您设备上的小型文本文件。Cookie 帮助我们维持登录状态、记住您的偏好（如语言、主题），并了解站点功能的使用情况，以便持续改进。',
                  'Cookie 是您訪問網站時存儲在您設備上的小型文字檔案。Cookie 幫助我們維持登入狀態、記住您的偏好（如語言、主題），並瞭解站點功能的使用情況，以便持續改進。',
                  'Cookie とは、ウェブサイト訪問時にお客様のデバイスに保存される小さなテキストファイルです。Cookie はログイン状態の維持、お客様の設定（言語、テーマなど）の記憶、サイト機能の利用状況把握に役立ち、継続的な改善を可能にします。',
                  '쿠키는 웹사이트를 방문할 때 귀하의 장치에 저장되는 작은 텍스트 파일입니다. 쿠키는 로그인 상태 유지, 환경설정(언어, 테마 등) 기억, 사이트 기능 이용 현황 파악에 도움을 주며 지속적인 개선을 가능하게 합니다.',
                  'Cookies are small text files stored on your device when you visit a website. They help us maintain your login session, remember your preferences (such as language and theme), and understand how our site features are used so we can keep improving them.'
                )}
              </p>
              <p className="mb-4">
                {t(
                  'MokerSaaS 同时使用 Cookie 与类似技术（如 localStorage、sessionStorage）来保证核心功能正常运行、统计站点使用情况，并支持推广返利追踪。',
                  'MokerSaaS 同時使用 Cookie 與類似技術（如 localStorage、sessionStorage）來保證核心功能正常運行、統計站點使用情況，並支援推廣返利追蹤。',
                  'MokerSaaS は、Cookie および類似技術（localStorage、sessionStorage など）を使用して、コア機能の安定動作、サイトの利用統計、推薦・アフィリエイトの追跡を実現しています。',
                  'MokerSaaS는 쿠키와 유사 기술(localStorage, sessionStorage 등)을 함께 사용하여 핵심 기능의 안정적 작동, 사이트 이용 통계, 추천 및 제휴 추적을 지원합니다.',
                  'MokerSaaS uses cookies and similar technologies (such as localStorage and sessionStorage) to keep core features working, gather site usage statistics, and support referral and affiliate tracking.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('2. 我们使用的Cookie类型', '2. 我們使用的Cookie類型', '2. 使用するCookieの種類', '2. 당사가 사용하는 쿠키 종류', '2. Types of Cookies We Use')}
              </h2>

              <h3 className="text-xl font-semibold mb-3">
                {t('2.1 必要Cookie', '2.1 必要Cookie', '2.1 必須Cookie', '2.1 필수 쿠키', '2.1 Strictly Necessary Cookies')}
              </h3>
              <p className="mb-4">
                {t('这些 Cookie 对于网站的基本功能是必需的，无法禁用：', '這些 Cookie 對於網站的基本功能是必需的，無法停用：', 'これらの Cookie はサイトの基本機能に必須であり、無効化できません：', '이 쿠키는 사이트의 기본 기능에 필수적이며 비활성화할 수 없습니다:', 'These cookies are essential for the basic functionality of the site and cannot be disabled:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{t('登录与会话', '登入與會話', 'ログインとセッション', '로그인 및 세션', 'Sign-in and Session')}</strong>：
                  {t('维持您的登录状态，使您在不同页面之间保持已登录', '維持您的登入狀態，使您在不同頁面之間保持已登入', 'お客様のログイン状態を維持し、ページ遷移後もログインを継続', '로그인 상태를 유지하여 페이지 이동 시에도 로그인이 유지되도록 합니다', 'Maintaining your sign-in state so you remain logged in across pages')}
                </li>
                <li>
                  <strong>{t('安全 Cookie', '安全 Cookie', 'セキュリティ Cookie', '보안 쿠키', 'Security Cookies')}</strong>：
                  {t('防止跨站请求伪造（CSRF）以及常见的 Web 攻击', '防止跨站請求偽造（CSRF）以及常見的 Web 攻擊', 'CSRF を含む一般的な Web 攻撃の防止', 'CSRF 및 일반적인 웹 공격 방지', 'Preventing Cross-Site Request Forgery (CSRF) and other common web attacks')}
                </li>
                <li>
                  <strong>{t('语言偏好', '語言偏好', '言語設定', '언어 설정', 'Language Preference')}</strong>：
                  {t('记住您选择的语言，使您下次访问时自动使用同一种语言', '記住您選擇的語言，使您下次訪問時自動使用同一種語言', '選択された言語を記憶し、次回訪問時に同じ言語が自動的に使用されるようにします', '선택한 언어를 기억하여 다음 방문 시 같은 언어가 자동으로 사용되도록 합니다', 'Remembering your chosen language so the next visit is in the same language')}
                </li>
                <li>
                  <strong>{t('负载均衡', '負載均衡', 'ロードバランシング', '로드 밸런싱', 'Load Balancing')}</strong>：
                  {t('将请求正确路由到合适的服务器节点', '將請求正確路由到合適的伺服器節點', 'リクエストを適切なサーバーノードへ正しくルーティング', '요청을 적합한 서버 노드로 올바르게 라우팅', 'Routing requests to the appropriate server node')}
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('2.2 偏好 Cookie', '2.2 偏好 Cookie', '2.2 設定 Cookie', '2.2 환경설정 쿠키', '2.2 Preference Cookies')}
              </h3>
              <p className="mb-4">
                {t('这些 Cookie 记住您的偏好设置，以提供更个性化的体验：', '這些 Cookie 記住您的偏好設定，以提供更個性化的體驗：', 'これらの Cookie はお客様の設定を記憶し、よりパーソナライズされた体験を提供します：', '이 쿠키는 사용자의 환경설정을 기억하여 보다 개인화된 경험을 제공합니다:', 'These cookies remember your preferences to provide a more personalized experience:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{t('界面偏好', '介面偏好', 'インターフェース設定', '인터페이스 환경설정', 'Interface Preferences')}</strong>：
                  {t('主题（深色/浅色）、语言区域、字体大小等界面设置', '主題（深色/淺色）、語言區域、字體大小等介面設定', 'テーマ（ダーク/ライト）、言語地域、フォントサイズなどのインターフェース設定', '테마(다크/라이트), 언어 지역, 글꼴 크기 등 인터페이스 설정', 'Theme (dark/light), locale, font size, and other interface settings')}
                </li>
                <li>
                  <strong>{t('视图偏好', '視圖偏好', '表示設定', '표시 환경설정', 'View Preferences')}</strong>：
                  {t('列表分页大小、默认排序方式、是否折叠侧边栏等', '列表分頁大小、預設排序方式、是否摺疊側邊欄等', 'リストのページサイズ、デフォルトの並び順、サイドバーの折りたたみ状態など', '목록 페이지 크기, 기본 정렬 방식, 사이드바 접힘 여부 등', 'List page size, default sort order, sidebar collapsed state, etc.')}
                </li>
                <li>
                  <strong>{t('表单草稿', '表單草稿', 'フォームの下書き', '양식 임시 저장', 'Form Draft')}</strong>：
                  {t('临时保存未提交的表单内容，避免意外丢失', '臨時保存未提交的表單內容，避免意外丟失', '送信前のフォーム内容を一時保存し、偶発的な損失を防止', '제출하지 않은 양식 내용을 임시 저장하여 실수로 인한 손실을 방지합니다', 'Temporarily saving unsubmitted form content to prevent accidental loss')}
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('2.3 统计 Cookie', '2.3 統計 Cookie', '2.3 統計 Cookie', '2.3 통계 쿠키', '2.3 Statistics Cookies')}
              </h3>
              <p className="mb-4">
                {t('这些 Cookie 帮助我们了解站点的使用情况（通常匿名），以便持续改进：', '這些 Cookie 幫助我們瞭解站點的使用情況（通常匿名），以便持續改進：', 'これらの Cookie は、サイトの利用状況（通常は匿名）を把握し、継続的な改善に役立ちます：', '이 쿠키는 사이트의 이용 현황(보통 익명)을 파악하여 지속적인 개선에 도움이 됩니다:', 'These cookies help us understand how the site is used (typically anonymously) so we can keep improving it:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{t('访问统计', '訪問統計', 'アクセス統計', '접근 통계', 'Access Statistics')}</strong>：
                  {t('记录访问量、页面浏览量、停留时间等汇总指标', '記錄訪問量、頁面瀏覽量、停留時間等匯總指標', 'アクセス数、ページビュー、滞在時間などの集計指標を記録', '방문 수, 페이지뷰, 체류 시간 등 집계 지표를 기록', 'Recording aggregate metrics such as visit counts, page views, and time on page')}
                </li>
                <li>
                  <strong>{t('性能监控', '性能監控', 'パフォーマンス監視', '성능 모니터링', 'Performance Monitoring')}</strong>：
                  {t('监控页面加载时间、错误率等性能指标', '監控頁面加載時間、錯誤率等性能指標', 'ページ読み込み時間、エラー率などのパフォーマンス指標を監視', '페이지 로딩 시간, 오류율 등 성능 지표를 모니터링', 'Monitoring page load times, error rates, and other performance metrics')}
                </li>
                <li>
                  <strong>{t('功能使用情况', '功能使用情況', '機能の利用状況', '기능 이용 현황', 'Feature Usage')}</strong>：
                  {t('了解哪些功能更受欢迎，以便优化迭代', '瞭解哪些功能更受歡迎，以便優化迭代', 'どの機能がより多く利用されているかを把握し、改善に活かす', '어떤 기능이 더 많이 사용되는지 파악하여 개선에 활용', 'Understanding which features are used more, to inform iteration priorities')}
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('2.4 第三方 Cookie', '2.4 第三方 Cookie', '2.4 第三者 Cookie', '2.4 제3자 쿠키', '2.4 Third-Party Cookies')}
              </h3>
              <p className="mb-4">
                {t('我们可能使用第三方服务商提供的 Cookie 来完成特定功能：', '我們可能使用第三方服務商提供的 Cookie 來完成特定功能：', '特定の機能を実現するために、第三者サービス提供者の Cookie を使用する場合があります：', '특정 기능을 구현하기 위해 제3자 서비스 제공업체의 쿠키를 사용할 수 있습니다:', 'We may use cookies from third-party providers to deliver specific functionality:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{t('支付处理', '支付處理', '決済処理', '결제 처리', 'Payment Processing')}</strong>：
                  {t('通过 Stripe 等支付服务商处理付款交易', '通過 Stripe 等支付服務商處理付款交易', 'Stripe などの決済サービス事業者を通じた決済処理', 'Stripe 등 결제 서비스 제공업체를 통한 결제 처리', 'Processing payment transactions through providers such as Stripe')}
                </li>
                <li>
                  <strong>{t('邮件投递与统计', '郵件投遞與統計', 'メール配信と統計', '이메일 전송 및 통계', 'Email Delivery and Stats')}</strong>：
                  {t('用于事务性邮件（验证、密码重置、订阅提醒等）的投递与回执统计', '用於事務性郵件（驗證、密碼重設、訂閱提醒等）的投遞與回執統計', 'トランザクションメール（確認、パスワードリセット、サブスクリプション通知など）の配信および配信統計', '트랜잭션 메일(확인, 비밀번호 재설정, 구독 알림 등) 전송 및 수신 통계', 'Delivering transactional emails (verification, password reset, subscription reminders, etc.) and collecting delivery statistics')}
                </li>
                <li>
                  <strong>{t('站点的分析与监控', '站點的分析與監控', 'サイトの分析と監視', '사이트 분석 및 모니터링', 'Site Analytics and Monitoring')}</strong>：
                  {t('通过分析服务了解访问量、来源、用户行为等聚合指标', '通過分析服務瞭解訪問量、來源、用戶行為等聚合指標', '分析サービスを通じたアクセス数、流入元、ユーザー行動などの集計指標の把握', '분석 서비스를 통한 방문 수, 유입 경로, 사용자 행동 등 집계 지표 파악', 'Aggregate metrics such as traffic, sources, and user behavior via analytics services')}
                </li>
                <li>
                  <strong>{t('推广返利追踪', '推廣返利追蹤', '推薦・アフィリエイト追跡', '추천 및 제휴 추적', 'Referral and Affiliate Tracking')}</strong>：
                  {t('记录推广链接来源，以便正确归因并结算推广佣金', '記錄推廣連結來源，以便正確歸因並結算推廣佣金', 'アフィリエイトリンクの参照元を記録し、正しく帰属してコミッションを精算するため', '제휴 링크의 유입 경로를 기록하여 올바르게 귀속하고 커미션을 정산하기 위해', 'Recording the source of referral links so commissions can be correctly attributed and settled')}
                </li>
                <li>
                  <strong>{t('CDN 与对象存储', 'CDN 與對象存儲', 'CDN とオブジェクトストレージ', 'CDN 및 객체 스토리지', 'CDN and Object Storage')}</strong>：
                  {t('通过内容分发网络加速静态资源加载', '通過內容分發網路加速靜態資源加載', 'コンテンツデリバリーネットワークによる静的リソースの配信高速化', '콘텐츠 전송 네트워크를 통한 정적 리소스 로딩 가속', 'Accelerating static-asset delivery via content delivery networks')}
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('3. Cookie 的保留期限', '3. Cookie 的保留期限', '3. Cookie の保持期間', '3. 쿠키 보존 기간', '3. Cookie Retention')}
              </h2>
              <p className="mb-4">
                {t('不同类型的 Cookie 具有不同的保留期限：', '不同類型的 Cookie 具有不同的保留期限：', 'Cookie の種類により保持期間は異なります：', '쿠키 유형에 따라 보존 기간이 다릅니다:', 'Different cookies have different retention periods:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{t('会话 Cookie', '會話 Cookie', 'セッション Cookie', '세션 쿠키', 'Session Cookies')}</strong>：
                  {t('浏览器关闭时自动删除', '瀏覽器關閉時自動刪除', 'ブラウザーを閉じると自動的に削除されます', '브라우저를 닫으면 자동으로 삭제됩니다', 'Automatically deleted when the browser is closed')}
                </li>
                <li>
                  <strong>{t('偏好 Cookie', '偏好 Cookie', '設定 Cookie', '환경설정 쿠키', 'Preference Cookies')}</strong>：
                  {t('通常保留 30 天到 1 年', '通常保留 30 天到 1 年', '通常 30 日から 1 年保持されます', '보통 30일에서 1년 동안 보존됩니다', 'Typically retained from 30 days up to 1 year')}
                </li>
                <li>
                  <strong>{t('统计 Cookie', '統計 Cookie', '統計 Cookie', '통계 쿠키', 'Statistics Cookies')}</strong>：
                  {t('通常保留 3 个月到 2 年', '通常保留 3 個月到 2 年', '通常 3 か月から 2 年保持されます', '보통 3개월에서 2년 동안 보존됩니다', 'Typically retained from 3 months up to 2 years')}
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('4. 如何管理 Cookie', '4. 如何管理 Cookie', '4. Cookie の管理方法', '4. 쿠키 관리 방법', '4. How to Manage Cookies')}
              </h2>

              <h3 className="text-xl font-semibold mb-3">
                {t('4.1 浏览器设置', '4.1 瀏覽器設置', '4.1 ブラウザー設定', '4.1 브라우저 설정', '4.1 Browser Settings')}
              </h3>
              <p className="mb-4">
                {t('大多数浏览器允许您查看、删除或屏蔽 Cookie。常见操作包括：', '大多數瀏覽器允許您查看、刪除或封鎖 Cookie。常見操作包括：', 'ほとんどのブラウザーでは、Cookie の確認、削除、ブロックが可能です。一般的な操作は次の通りです：', '대부분의 브라우저에서 쿠키를 확인, 삭제 또는 차단할 수 있습니다. 일반적인 작업은 다음과 같습니다:', 'Most browsers let you view, delete, or block cookies. Typical options include:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('查看设备上已存储的所有 Cookie', '查看設備上已存儲的所有 Cookie', 'デバイスに保存されているすべての Cookie を確認する', '장치에 저장된 모든 쿠키 확인', 'View all cookies stored on your device')}</li>
                <li>{t('删除特定 Cookie 或全部 Cookie', '刪除特定 Cookie 或全部 Cookie', '特定の Cookie またはすべての Cookie を削除する', '특정 쿠키 또는 모든 쿠키 삭제', 'Delete specific cookies or all cookies')}</li>
                <li>{t('阻止 Cookie 的设置或限制其使用范围', '阻止 Cookie 的設置或限制其使用範圍', 'Cookie の設定をブロックまたは使用範囲を制限する', '쿠키 설정을 차단하거나 사용 범위를 제한', 'Block cookie settings or restrict their scope')}</li>
                <li>{t('设置 Cookie 到期时间', '設置 Cookie 到期時間', 'Cookie の有効期限を設定する', '쿠키 만료 시간 설정', 'Set cookie expiration')}</li>
              </ul>
              <p className="mb-4">
                {t('请注意：禁用必要 Cookie 可能导致站点核心功能（例如登录、订阅）无法正常使用。', '請注意：禁用必要 Cookie 可能導致站點核心功能（例如登入、訂閱）無法正常使用。', 'ご注意：必須 Cookie を無効にすると、サイトのコア機能（ログイン、サブスクリプションなど）が正常に動作しなくなる可能性があります。', '참고: 필수 쿠키를 비활성화하면 사이트의 핵심 기능(로그인, 구독 등)이 정상적으로 작동하지 않을 수 있습니다.', 'Note: disabling strictly necessary cookies may prevent core site functionality (such as sign-in and subscriptions) from working properly.')}
              </p>

              <h3 className="text-xl font-semibold mb-3">
                {t('4.2 撤回同意', '4.2 撤回同意', '4.2 同意の撤回', '4.2 동의 철회', '4.2 Withdrawing Consent')}
              </h3>
              <p className="mb-4">
                {t(
                  '您可以随时撤回对非必要 Cookie 的同意。请通过本政策末尾的联系方式告知我们，或在下次访问站点时通过 Cookie 偏好设置重新选择。',
                  '您可以隨時撤回對非必要 Cookie 的同意。請通過本政策末尾的聯繫方式告知我們，或在下次訪問站點時通過 Cookie 偏好設定重新選擇。',
                  '不要な Cookie への同意はいつでも撤回できます。本ポリシー末尾のお問い合わせ先にご連絡いただくか、次回サイト訪問時に Cookie 設定で再選択してください。',
                  '필수가 아닌 쿠키에 대한 동의는 언제든지 철회할 수 있습니다. 본 정책 하단의 연락처로 알려주시거나, 다음 방문 시 쿠키 환경설정에서 다시 선택하실 수 있습니다.',
                  'You can withdraw consent for non-essential cookies at any time. Please notify us via the contact details at the end of this policy, or adjust your cookie preferences the next time you visit the site.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('5. 政策的变更', '5. 政策的變更', '5. ポリシーの変更', '5. 정책의 변경', '5. Changes to This Policy')}
              </h2>
              <p className="mb-4">
                {t('我们可能根据业务或法律变化不时更新本 Cookie 政策。重大变更将通过站点公告或邮件等方式通知。继续使用服务即视为您接受更新后的政策。', '我們可能根據業務或法律變化不時更新本 Cookie 政策。重大變更將通過站點公告或郵件等方式通知。繼續使用服務即視為您接受更新後的政策。', '当社は、業務上または法令上の変更にともない、本 Cookie ポリシーを随時更新する場合があります。重要な変更については、サイト通知やメールなどでお知らせします。サービスの継続利用は、更新後のポリシーに同意したものとみなされます。', '당사는 업무 또는 법률 변경에 따라 본 쿠키 정책을 수시로 업데이트할 수 있습니다. 중요한 변경은 사이트 공지 또는 이메일을 통해 알려 드리며, 서비스를 계속 이용하시면 업데이트된 정책에 동의하는 것으로 간주됩니다.', 'We may update this Cookie Policy from time to time to reflect changes in our operations or in the law. Material changes will be announced via site notice or email; continued use of the service indicates your acceptance of the updated policy.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('6. 联系我们', '6. 聯繫我們', '6. お問い合わせ', '6. 문의하기', '6. Contact Us')}
              </h2>
              <p className="mb-4">
                {t('如果您对我们的 Cookie 政策有任何疑问，请通过以下方式联系我们：', '如果您對我們的 Cookie 政策有任何疑問，請通過以下方式聯繫我們：', '本 Cookie ポリシーに関してご質問がございましたら、以下の方法でお問い合わせください：', '본 쿠키 정책에 대해 궁금한 점이 있으시면 다음의 방법으로 당사에 문의하시기 바랍니다:', 'If you have any questions about this Cookie Policy, please contact us:')}
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