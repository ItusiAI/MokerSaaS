"use client"

import { useParams } from 'next/navigation'

type L = 'en' | 'zh-CN' | 'ja' | 'ko' | 'zh-TW'

export function PrivacyContent() {
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
            {t('隐私政策', '隱私政策', 'プライバシーポリシー', '개인정보 처리방침', 'Privacy Policy')}
          </h1>
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-8">
              {t('最后更新：2026年8月22日', '最後更新：2026年8月22日', '最終更新日：2026年8月22日', '최종 업데이트: 2026년 8월 22일', 'Last updated: August 22, 2026')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('1. 引言', '1. 引言', '1. はじめに', '1. 서문', '1. Introduction')}
              </h2>
              <p className="mb-4">
                {t(
                  'MokerSaaS（"我们"、"我们的"或"本服务"）非常重视用户隐私。本隐私政策说明我们在您访问和使用我们的网站时，如何收集、使用、存储和保护您的个人信息。',
                  'MokerSaaS（"我們"、"我們的"或"本服務"）非常重視用戶隱私。本隱私政策說明我們在您訪問和使用我們的網站時，如何收集、使用、存儲和保護您的個人信息。',
                  'MokerSaaS（以下「当社」「当社の」または「本サービス」）は、ユーザーのプライバシーを非常に重視しています。本プライバシーポリシーでは、お客様が当社のウェブサイトにアクセスし利用する際に、当社がどのように個人情報を収集、使用、保存、保護するかを説明します。',
                  'MokerSaaS("당사", "당사의" 또는 "본 서비스")는 사용자 개인정보를 매우 중요하게 생각합니다. 본 개인정보 처리방침은 귀하가 당사 웹사이트에 접속하여 이용하실 때 당사가 개인정보를 어떻게 수집, 사용, 저장 및 보호하는지를 설명합니다.',
                  'MokerSaaS ("we", "our", or "the service") takes user privacy seriously. This Privacy Policy explains how we collect, use, store, and protect your personal information when you access and use our website.'
                )}
              </p>
              <p className="mb-4">
                {t(
                  '使用我们的服务即表示您同意按照本隐私政策处理您的信息。如果您不同意本政策，请停止使用我们的服务。',
                  '使用我們的服務即表示您同意按照本隱私政策處理您的信息。如果您不同意本政策，請停止使用我們的服務。',
                  '本サービスを利用することで、お客様は本プライバシーポリシーに従った情報の取り扱いに同意したものとみなされます。本ポリシーに同意されない場合は、本サービスの利用を中止してください。',
                  '본 서비스를 사용하는 것은 본 개인정보 처리방침에 따른 정보 처리에 동의하는 것으로 간주됩니다. 본 정책에 동의하지 않으시는 경우 본 서비스 사용을 중단해 주십시오.',
                  'By using our services, you agree to the processing of your information in accordance with this Privacy Policy. If you do not agree with this policy, please stop using our services.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('2. 我们收集的信息', '2. 我們收集的信息', '2. 収集する情報', '2. 수집하는 정보', '2. Information We Collect')}
              </h2>

              <h3 className="text-xl font-semibold mb-3">
                {t('2.1 账户信息', '2.1 賬戶信息', '2.1 アカウント情報', '2.1 계정 정보', '2.1 Account Information')}
              </h3>
              <p className="mb-4">
                {t('当您注册账户时，我们收集：', '當您註冊賬戶時，我們收集：', 'アカウント登録時に、当社が収集する情報：', '계정을 등록할 때 당사가 수집하는 정보:', 'When you register an account, we collect:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('邮箱地址（用于账户验证和登录）', '郵箱地址（用於賬戶驗證和登錄）', 'メールアドレス（アカウント確認およびログイン用）', '이메일 주소(계정 확인 및 로그인용)', 'Email address (for account verification and login)')}</li>
                <li>{t('用户名和显示头像（可选）', '用戶名和顯示頭像（可選）', 'ユーザー名および表示アバター（任意）', '사용자 이름 및 표시 아바타(선택)', 'Username and display avatar (optional)')}</li>
                <li>{t('密码（以哈希形式存储，不会保存明文）', '密碼（以哈希形式存儲，不會保存明文）', 'パスワード（ハッシュ化して保存し、平文は保存しません）', '비밀번호(해시로 저장하며 평문은 저장하지 않습니다)', 'Password (stored as a hash; we never store plaintext)')}</li>
                <li>{t('注册时间、最后登录时间等基本账户元数据', '註冊時間、最後登錄時間等基本賬戶元數據', '登録時刻、最終ログイン時刻など基本的なアカウントメタデータ', '가입 시간, 마지막 로그인 시간 등 기본 계정 메타데이터', 'Basic account metadata such as registration time and last login time')}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('2.2 使用与运营数据', '2.2 使用與運營數據', '2.2 利用・運用データ', '2.2 이용 및 운영 데이터', '2.2 Usage and Operational Data')}
              </h3>
              <p className="mb-4">
                {t('为了提供、维护和改进服务，我们可能收集：', '為了提供、維護和改进服務，我們可能收集：', 'サービスの提供、維持、改善のため、当社が収集する可能性のある情報：', '서비스 제공, 유지 및 개선을 위해 당사가 수집할 수 있는 정보:', 'To provide, maintain, and improve the service, we may collect:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{t('订阅与付款数据', '訂閱與付款數據', 'サブスクリプション・決済データ', '구독 및 결제 데이터', 'Subscription and Payment Data')}</strong>：
                  {t('订阅计划、订阅状态、续费日期；付款信息由Stripe等支付服务商处理，我们不直接保存您的完整银行卡号', '訂閱計劃、訂閱狀態、續費日期；付款信息由Stripe等支付服務商處理，我們不直接保存您的完整銀行卡號', 'サブスクリプションプラン、状態、更新日時など。決済情報はStripeなどの決済サービス事業者が処理し、当社はお客様の完全なカード番号を直接保存しません', '구독 플랜, 구독 상태, 갱신 일자. 결제 정보는 Stripe 등 결제 서비스 제공업체가 처리하며 당사는 귀하의 전체 카드 번호를 직접 저장하지 않습니다', 'Subscription plan, status, renewal date; payment data is handled by Stripe and similar processors, and we do not store your full card number')}
                </li>
                <li>
                  <strong>{t('推广与返利数据', '推廣與返利數據', '推薦・アフィリエイトデータ', '추천 및 제휴 데이터', 'Referral and Affiliate Data')}</strong>：
                  {t('您使用的邀请码或推广链接、由此产生的佣金记录、提现申请信息', '您使用的邀請碼或推廣連結、由此產生的佣金記錄、提現申請信息', 'お客様が使用した招待コードまたはアフィリエイトリンク、それに伴うコミッション履歴、出金申請情報', '귀하가 사용한 초대 코드 또는 제휴 링크, 그에 따른 커미션 기록, 출금 신청 정보', 'The referral codes or affiliate links you use, the commission records generated from them, and payout request details')}
                </li>
                <li>
                  <strong>{t('技术支持数据', '技術支持數據', 'テクニカルサポートデータ', '기술 지원 데이터', 'Support Data')}</strong>：
                  {t('当您主动联系客服或提交反馈时，您所提供的联系信息及沟通内容', '當您主動聯繫客服或提交反饋時，您所提供的聯繫信息及溝通內容', 'お客様からお問い合わせやフィードバックをいただいた際の連絡先情報およびやり取りの内容', '귀하가 고객 지원팀에 문의하거나 피드백을 제출할 때 제공하는 연락처 정보 및 소통 내용', 'When you contact support or submit feedback, the contact details and content you provide')}
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('2.3 技术与日志信息', '2.3 技術與日誌信息', '2.3 技術・ログ情報', '2.3 기술 및 로그 정보', '2.3 Technical and Log Information')}
              </h3>
              <p className="mb-4">
                {t('我们自动收集的技术信息包括：', '我們自動收集的技術信息包括：', '当社が自動的に収集する技術情報には以下が含まれます：', '당사가 자동으로 수집하는 기술 정보는 다음과 같습니다:', 'Technical information we automatically collect includes:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('IP地址和粗粒度地理位置信息（如国家/地区级别，用于安全防护与本地化展示）', 'IP地址和粗粒度地理位置信息（如國家/地區級別，用於安全防護與本地化展示）', 'IPアドレスおよびおおまかな地理位置情報（国・地域単位、セキュリティ対策およびローカライズ表示に使用）', 'IP 주소 및 대략적인 지리적 위치 정보(국가/지역 수준, 보안 및 현지화 표시용)', 'IP address and coarse geolocation (country/region level, used for security and localization)')}</li>
                <li>{t('设备与浏览器信息（浏览器类型、操作系统、屏幕尺寸等）', '設備與瀏覽器信息（瀏覽器類型、操作系統、屏幕尺寸等）', 'デバイスおよびブラウザー情報（ブラウザーの種類、OS、画面サイズなど）', '기기 및 브라우저 정보(브라우저 종류, 운영체제, 화면 크기 등)', 'Device and browser information (browser type, OS, screen size, etc.)')}</li>
                <li>{t('访问时间、页面浏览路径和停留时长', '訪問時間、頁面瀏覽路徑和停留時長', 'アクセス時刻、ページ閲覧パスおよび滞在時間', '접근 시간, 페이지 방문 경로 및 체류 시간', 'Access time, page-view paths, and time on page')}</li>
                <li>{t('来源页面（Referrer），用于了解您是如何到达本站的', '來源頁面（Referrer），用於瞭解您是如何到達本站的', '参照元ページ（リファラー）。本サイトへの流入経路把握のため', '유입 페이지(Referrer). 본 사이트에 어떻게 도달했는지 파악하기 위해', 'Referrer URLs, used to understand how you arrived at our site')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('3. 信息使用方式', '3. 信息使用方式', '3. 情報の使用方法', '3. 정보 사용 방식', '3. How We Use Information')}
              </h2>
              <p className="mb-4">
                {t('我们使用所收集的信息用于：', '我們使用所收集的信息用於：', '収集した情報を以下の目的で使用します：', '당사는 수집한 정보를 다음의 목적으로 사용합니다:', 'We use collected information for:')}
              </p>

              <h3 className="text-xl font-semibold mb-3">
                {t('3.1 服务提供', '3.1 服務提供', '3.1 サービス提供', '3.1 서비스 제공', '3.1 Service Provision')}
              </h3>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('提供、维护并改进网站、应用与管理后台等核心功能', '提供、維護並改進網站、應用與管理後台等核心功能', 'ウェブサイト、アプリケーション、管理画面などの中核機能の提供、維持、改善', '웹사이트, 애플리케이션 및 관리 콘솔 등 핵심 기능의 제공, 유지 및 개선', 'Providing, maintaining, and improving the core features of our site, applications, and admin dashboard')}</li>
                <li>{t('处理您的注册、登录、订阅、付款和推广请求', '處理您的註冊、登入、訂閱、付款和推廣請求', '登録、ログイン、サブスクリプション、決済、推广リクエストの処理', '등록, 로그인, 구독, 결제 및 추천 요청 처리', 'Processing registration, sign-in, subscription, payment, and referral requests')}</li>
                <li>{t('维护账户安全和服务稳定性', '維護賬戶安全和服務穩定性', 'アカウントのセキュリティおよびサービスの安定性の維持', '계정 보안 및 서비스 안정성 유지', 'Maintaining account security and service stability')}</li>
                <li>{t('提供技术支持和处理您的请求', '提供技術支持和處理您的請求', 'テクニカルサポートおよびご要望への対応', '기술 지원 및 요청 처리', 'Providing technical support and handling your requests')}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('3.2 服务优化', '3.2 服務優化', '3.2 サービス最適化', '3.2 서비스 최적화', '3.2 Service Optimization')}
              </h3>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('分析使用模式以提升服务质量', '分析使用模式以提升服務質量', 'サービス品質向上のための利用パターンの分析', '서비스 품질 향상을 위한 이용 패턴 분석', 'Analyzing usage patterns to improve service quality')}</li>
                <li>{t('开发新功能和优化用户体验', '開發新功能和優化用戶體驗', '新機能の開発およびユーザー体験の最適化', '새로운 기능 개발 및 사용자 경험 최적화', 'Developing new features and optimizing user experience')}</li>
                <li>{t('进行安全监控、欺诈检测与滥用防护', '進行安全監控、欺詐檢測與濫用防護', 'セキュリティ監視、不正検知および悪用防止', '보안 모니터링, 사기 탐지 및 남용 방지', 'Conducting security monitoring, fraud detection, and abuse prevention')}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('3.3 法律合规', '3.3 法律合規', '3.3 法令遵守', '3.3 법적 준수', '3.3 Legal Compliance')}
              </h3>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('遵守适用的法律法规', '遵守適用的法律法規', '適用される法律および規制の遵守', '적용 가능한 법률 및 규정 준수', 'Complying with applicable laws and regulations')}</li>
                <li>{t('响应司法机关或政府主管部门的合法请求', '響應司法機關或政府主管部門的合法請求', '司法機関または政府機関からの正当な要請への対応', '사법 기관 또는 정부 기관의 적법한 요청에 응하기 위해', 'Responding to lawful requests from judicial or government authorities')}</li>
                <li>{t('保护我们的权利、财产及用户的安全', '保護我們的權利、財產及用戶的安全', '当社の権利、財産およびユーザーの安全の保護', '당사의 권리, 재산 및 사용자 안전 보호', 'Protecting our rights, property, and the safety of our users')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('4. Cookie 与同类技术', '4. Cookie 與同類技術', '4. Cookie と類似技術', '4. 쿠키 및 유사 기술', '4. Cookies and Similar Technologies')}
              </h2>
              <p className="mb-4">
                {t(
                  '我们使用 Cookie 及类似技术实现登录会话、语言偏好、统计分析和推广追踪等功能。详情请参见我们的Cookie政策，您也可以通过浏览器设置拒绝或限制非必要Cookie。',
                  '我們使用 Cookie 及類似技術實現登入會話、語言偏好、統計分析和推廣追蹤等功能。詳情請參見我們的 Cookie 政策，您也可以通過瀏覽器設置拒絕或限制非必要 Cookie。',
                  'ログインセッション、言語設定、統計分析、アフィリエイト追跡などの機能を実現するため、Cookieおよび類似技術を使用しています。詳細は Cookie ポリシーをご覧ください。ブラウザー設定で不要な Cookie を拒否または制限することもできます。',
                  '당사는 로그인 세션, 언어 설정, 통계 분석, 제휴 추적 등의 기능을 구현하기 위해 쿠키 및 유사 기술을 사용합니다. 자세한 내용은 쿠키 정책을 참조하시기 바라며, 브라우저 설정을 통해 필요하지 않은 쿠키를 거부하거나 제한할 수 있습니다.',
                  'We use cookies and similar technologies to enable login sessions, language preferences, analytics, and referral tracking. Please see our Cookie Policy for details; you can also refuse or restrict non-essential cookies via your browser settings.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('5. 数据共享', '5. 數據共享', '5. 情報の共有', '5. 정보 공유', '5. Data Sharing')}
              </h2>
              <p className="mb-4">
                {t('我们不会出售您的个人信息。仅在以下必要情形中，我们可能向第三方共享信息：', '我們不會出售您的個人信息。僅在以下必要情形中，我們可能向第三方共享信息：', '当社はお客様の個人情報を販売しません。以下の場合に限り、必要な範囲で第三者と情報を共有することがあります：', '당사는 귀하의 개인정보를 판매하지 않습니다. 다음의 필요 상황에서만 제3자와 정보를 공유할 수 있습니다:', 'We do not sell your personal information. We may share information with third parties only in the following necessary circumstances:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('支付服务商（Stripe 等）：用于安全处理您的付款交易', '支付服務商（Stripe 等）：用於安全處理您的付款交易', '決済サービス事業者（Stripe など）：決済取引の安全な処理のため', '결제 서비스 제공업체(Stripe 등): 결제 거래의 안전한 처리를 위해', 'Payment processors (e.g., Stripe) — to securely handle your payment transactions')}</li>
                <li>{t('基础设施服务商（如托管、邮件投递、对象存储）：用于提供正常运行所必需的技术服务', '基礎設施服務商（如託管、郵件投遞、對象存儲）：用於提供正常運行所必需的技術服務', 'インフラサービス事業者（ホスティング、メール配信、オブジェクトストレージなど）：正常なサービス運営に必要な技術サービスの提供のため', '인프라 서비스 제공업체(호스팅, 이메일 전송, 객체 스토리지 등): 정상적인 서비스 운영에 필요한 기술 서비스 제공을 위해', 'Infrastructure providers (hosting, email delivery, object storage) — to deliver the technical services needed to operate')}</li>
                <li>{t('分析服务商：在匿名或汇总层面了解服务的使用情况', '分析服務商：在匿名或匯總層面瞭解服務的使用情況', '分析サービス提供者：サービスの利用状況を匿名または集計された形で把握するため', '분석 서비스 제공업체: 익명 또는 집계된 형태로 서비스 이용 현황을 파악하기 위해', 'Analytics providers — to understand service usage at an anonymous or aggregate level')}</li>
                <li>{t('法律要求：在遵守适用法律或响应具有法律效力的请求时所必需', '法律要求：在遵守適用法律或響應具有法律效力的請求時所必需', '法令遵守：適用される法律を遵守するため、または法的効力を持つ要請に対応するため', '법적 요구: 관련 법률을 준수하거나 법적 효력이 있는 요청에 응하기 위해 필요한 경우', 'Legal requirements — when necessary to comply with applicable law or respond to legally binding requests')}</li>
                <li>{t('关联方转让：在合并、收购或资产出售等情形下，作为业务转让的一部分', '關聯方轉讓：在合併、收購或資產出售等情形下，作為業務轉讓的一部分', '関連当事者への譲渡：合併、買収、資産譲渡などの場面において、事業譲渡の一環として', '관계 당사자 양도: 합병, 인수, 자산 매각 등의 상황에서 사업 양도의 일환으로', 'Affiliate transfers — as part of a business transfer in the event of a merger, acquisition, or asset sale')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('6. 数据安全', '6. 數據安全', '6. データセキュリティ', '6. 데이터 보안', '6. Data Security')}
              </h2>
              <p className="mb-4">
                {t('我们采用业界常见的安全措施保护您的信息，包括但不限于：', '我們採用業界常見的安全措施保護您的信息，包括但不限於：', 'お客様の情報を保護するため、業界で標準的なセキュリティ対策を採用しています。以下を含みますが、これらに限定されません：', '당사는 업계에서 일반적으로 사용되는 보안 조치를 통해 귀하의 정보를 보호합니다. 다음을 포함하되 이에 국한되지 않습니다:', 'We use industry-standard measures to protect your information, including but not limited to:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('使用 HTTPS/TLS 加密所有传输数据', '使用 HTTPS/TLS 加密所有傳輸數據', 'HTTPS/TLS によるすべての通信データの暗号化', '모든 전송 데이터의 HTTPS/TLS 암호화', 'Encrypting all data in transit with HTTPS/TLS')}</li>
                <li>{t('密码以哈希形式存储，绝不保存明文', '密碼以哈希形式存儲，絕不保存明文', 'パスワードはハッシュ化して保存し、平文は保存しません', '비밀번호는 해시 형태로 저장하며 평문은 절대 저장하지 않습니다', 'Storing passwords as hashes only; never storing plaintext passwords')}</li>
                <li>{t('基于角色的最小权限访问控制', '基於角色的最小權限訪問控制', 'ロールベースの最小権限アクセス制御', '역할 기반 최소 권한 접근 제어', 'Role-based least-privilege access control')}</li>
                <li>{t('日志记录、异常检测与入侵防护', '日誌記錄、異常檢測與入侵防護', 'ログ記録、異常検知および侵入防止', '로그 기록, 이상 탐지 및 침입 방지', 'Logging, anomaly detection, and intrusion prevention')}</li>
                <li>{t('定期备份与恢复演练', '定期備份與恢復演練', '定期的なバックアップおよび復旧訓練', '정기적인 백업 및 복구 훈련', 'Regular backups and recovery drills')}</li>
              </ul>
              <p className="mb-4">
                {t('尽管我们采取了合理措施，但没有任何系统能保证绝对安全。', '儘管我們採取了合理措施，但沒有任何系統能保證絕對安全。', '合理的な対策を講じていますが、いかなるシステムも絶対的な安全性を保証することはできません。', '당사는 합리적인 조치를 취하고 있지만, 어떠한 시스템도 절대적인 보안을 보장할 수는 없습니다.', 'Despite our reasonable safeguards, no system can guarantee absolute security.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('7. 数据保留与删除', '7. 數據保留與刪除', '7. データの保持と削除', '7. 데이터 보존 및 삭제', '7. Data Retention and Deletion')}
              </h2>
              <p className="mb-4">
                {t(
                  '我们仅在为您提供服务所必需的时间内保留您的个人信息，或在法律要求的时间内保留。当您要求删除账户时，我们将在合理期限内删除或匿名化您的个人信息，但法律法规另有规定或出于纠纷解决需要的除外。',
                  '我們僅在為您提供服務所必需的時間內保留您的個人信息，或在法律要求的時間內保留。當您要求刪除賬戶時，我們將在合理期限內刪除或匿名化您的個人信息，但法律法規另有規定或出於糾紛解決需要的除外。',
                  '当社は、サービスの提供に必要な期間、または法令で求められる期間に限り、お客様の個人情報を保持します。アカウント削除のご要望をいただいた場合、合理的な期間内に個人情報を削除または匿名化しますが、法令により保持が義務付けられている場合、または紛争解決のために必要な場合はこの限りではありません。',
                  '당사는 서비스 제공에 필요한 기간 또는 법률이 요구하는 기간 동안에만 귀하의 개인정보를 보존합니다. 계정 삭제를 요청하시면 합리적인 기간 내에 개인정보를 삭제하거나 익명화합니다. 다만 법률에 따라 보존 의무가 있는 경우 또는 분쟁 해결을 위해 필요한 경우는 예외입니다.',
                  'We retain your personal information only for as long as necessary to provide the service or as required by law. When you request account deletion, we will delete or anonymize your personal information within a reasonable period, except where retention is required by law or necessary for dispute resolution.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('8. 您的权利', '8. 您的權利', '8. お客様の権利', '8. 사용자의 권리', '8. Your Rights')}
              </h2>
              <p className="mb-4">
                {t('根据适用的法律，您对自己的个人信息享有以下权利：', '根據適用的法律，您對自己的個人信息享有以下權利：', '適用される法律に基づき、お客様はご自身の個人情報について以下の権利を有します：', '관련 법률에 따라 귀하는 자신의 개인정보에 대해 다음과 같은 권리를 가집니다:', 'Under applicable law, you have the following rights regarding your personal information:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li><strong>{t('访问', '訪問', 'アクセス', '접근', 'Access')}</strong>：{t('查看我们持有的关于您的信息', '查看我們持有的關於您的信息', '当社が保有するお客様に関する情報をご確認いただけます', '당사가 보유한 귀하에 관한 정보를 열람할 수 있습니다', 'View the information we hold about you')}</li>
                <li><strong>{t('更正', '更正', '訂正', '정정', 'Correction')}</strong>：{t('更新或更正不准确的信息', '更新或更正不準確的信息', '正確でない情報を更新または訂正できます', '정확하지 않은 정보를 업데이트하거나 정정할 수 있습니다', 'Update or correct inaccurate information')}</li>
                <li><strong>{t('删除', '刪除', '削除', '삭제', 'Deletion')}</strong>：{t('要求删除您的账户和相关数据', '要求刪除您的賬戶和相關數據', 'アカウントおよび関連データの削除を要求できます', '계정 및 관련 데이터의 삭제를 요청할 수 있습니다', 'Request deletion of your account and related data')}</li>
                <li><strong>{t('导出', '導出', 'エクスポート', '내보내기', 'Export')}</strong>：{t('获取您账户数据的可携副本（数据可携权）', '獲取您賬戶數據的可攜副本（數據可攜權）', 'お客様のアカウントデータの可搬コピーを取得できます（データポータビリティ）', '귀하의 계정 데이터의 휴대용 사본을 받을 수 있습니다(데이터 이동권)', 'Receive a portable copy of your account data (data portability)')}</li>
                <li><strong>{t('反对/限制', '反對/限制', '異議/制限', '이의/제한', 'Object / Restrict')}</strong>：{t('反对或要求限制对您个人信息的某些处理', '反對或要求限制對您個人信息的某些處理', 'お客様の個人情報の特定の処理に対する異議申立てまたは制限要求', '귀하의 개인정보에 대한 특정 처리에 대한 이의 제기 또는 제한 요구', 'Object to or request restrictions on certain processing of your personal information')}</li>
                <li><strong>{t('撤回同意', '撤回同意', '同意の撤回', '동의 철회', 'Withdraw Consent')}</strong>：{t('撤回您此前就特定处理给予我们的同意', '撤回您此前就特定處理給予我們的同意', '特定の処理について当社に付与された同意を撤回できます', '특정 처리에 대해 이전에 부여한 동의를 철회할 수 있습니다', 'Withdraw consent you previously gave for specific processing')}</li>
              </ul>
              <p className="mb-4">
                {t('您可通过本政策末尾的联系方式与我们联系以行使上述权利。为保障安全，我们可能需要先核实您的身份。', '您可通過本政策末尾的聯繫方式與我們聯繫以行使上述權利。為保障安全，我們可能需要先核實您的身份。', '上記の権利を行使するには、本ポリシー末尾のお問い合わせ先よりご連絡ください。安全のため、ご本人確認をお願いする場合があります。', '위 권리를 행사하시려면 본 정책 하단의 연락처로 당사에 문의해 주십시오. 안전을 위해 먼저 신원 확인이 필요할 수 있습니다.', 'You may exercise these rights by contacting us via the channels listed at the end of this policy. To protect your security, we may need to verify your identity first.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('9. 国际数据传输', '9. 國際數據傳輸', '9. 国際データ転送', '9. 국제 데이터 전송', '9. International Data Transfers')}
              </h2>
              <p className="mb-4">
                {t(
                  '我们可能在全球多个司法管辖区运营并使用第三方服务，您的信息可能被传输至您所在司法管辖区以外的国家或地区。我们会在适用法律要求的范围内采取合理措施，确保您的信息得到充分保护。',
                  '我們可能在全球多個司法管轄區運營並使用第三方服務，您的信息可能被傳輸至您所在司法管轄區以外的國家或地區。我們會在適用法律要求的範圍內採取合理措施，確保您的信息得到充分保護。',
                  '当社は複数の司法管轄区域で事業を行い、第三者サービスを利用しているため、お客様の情報がお客様の司法管轄区域以外の国・地域へ転送される場合があります。当社は適用される法律の要求範囲内で合理的な措置を講じ、お客様の情報が適切に保護されるよう努めます。',
                  '당사는 여러 관할 지역에서 사업을 운영하며 제3자 서비스를 이용하므로, 귀하의 정보가 귀하의 관할 지역 외의 국가 또는 지역으로 전송될 수 있습니다. 당사는 관련 법률이 요구하는 범위 내에서 합리적인 조치를 취하여 귀하의 정보가 적절히 보호되도록 합니다.',
                  'We operate and use third-party services across multiple jurisdictions, which means your information may be transferred to a country or region other than your own. We take reasonable measures, within the scope required by applicable law, to ensure your information remains adequately protected.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('10. 未成年人', '10. 未成年人', '10. 未成年者', '10. 미성년자', '10. Minors')}
              </h2>
              <p className="mb-4">
                {t('本服务不面向未满18周岁的未成年人。我们不会故意收集未成年人的个人信息。如您是未成年人的监护人，并发现未成年人向我们提供了个人信息，请联系我们以便我们删除相关信息。', '本服務不面向未滿18週歲的未成年人。我們不會故意收集未成年人的個人信息。如您是未成年人的監護人，並發現未成年人向我們提供了個人信息，請聯繫我們以便我們刪除相關信息。', '本サービスは18歳未満の未成年者を対象としていません。当社は未成年者の個人情報を故意に収集することはありません。お子様の保護者の方で、お子様が当社に個人情報を提供したことに気づかれた場合は、関連情報を削除するため当社までご連絡ください。', '본 서비스는 18세 미만의 미성년자를 대상으로 하지 않습니다. 당사는 미성년자의 개인정보를 고의로 수집하지 않습니다. 미성년자의 보호자로서 미성년자가 당사에 개인정보를 제공한 사실을 알게 되신 경우, 관련 정보를 삭제할 수 있도록 당사에 연락해 주십시오.', 'The service is not directed to children under 18. We do not knowingly collect personal information from minors. If you are a guardian and become aware that a minor has provided personal information to us, please contact us so we can delete it.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('11. 政策的变更', '11. 政策的變更', '11. ポリシーの変更', '11. 정책의 변경', '11. Changes to This Policy')}
              </h2>
              <p className="mb-4">
                {t('我们可能根据业务或法律变化不时更新本隐私政策。重大变更将通过站点公告或邮件等方式通知您；继续使用服务即视为您接受更新后的政策。', '我們可能根據業務或法律變化不時更新本隱私政策。重大變更將通過站點公告或郵件等方式通知您；繼續使用服務即視為您接受更新後的政策。', '当社は、業務上または法令上の変更にともない、本プライバシーポリシーを随時更新する場合があります。重要な変更については、サイト通知やメールなどでお知らせします。サービスの継続利用は、更新後のポリシーに同意したものとみなされます。', '당사는 업무 또는 법률 변경에 따라 본 개인정보 처리방침을 수시로 업데이트할 수 있습니다. 중요한 변경 사항은 사이트 공지 또는 이메일을 통해 알려 드리며, 서비스를 계속 이용하시면 업데이트된 정책에 동의하는 것으로 간주됩니다.', 'We may update this Privacy Policy from time to time to reflect changes in our operations or in the law. Material changes will be announced via site notice or email; continued use of the service indicates your acceptance of the updated policy.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('12. 联系我们', '12. 聯繫我們', '12. お問い合わせ', '12. 문의하기', '12. Contact Us')}
              </h2>
              <p className="mb-4">
                {t('如果您对本隐私政策有任何疑问，或希望行使您的权利，请通过以下方式联系我们：', '如果您對本隱私政策有任何疑問，或希望行使您的權利，請通過以下方式聯繫我們：', '本プライバシーポリシーに関してご質問がある場合、またはお客様の権利を行使したい場合は、以下の方法でお問い合わせください：', '본 개인정보 처리방침에 대해 궁금한 점이 있거나 권리를 행사하고자 하시는 경우 다음의 방법으로 당사에 문의하시기 바랍니다:', 'If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:')}
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