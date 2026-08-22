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
              {t('最后更新：2026年1月6日', '最後更新：2026年1月6日', '最終更新日：2026年1月6日', '최종 업데이트: 2026년 1월 6일', 'Last updated: January 6, 2026')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('1. 引言', '1. 引言', '1. はじめに', '1. 서문', '1. Introduction')}
              </h2>
              <p className="mb-4">
                {t(
                  'MokerSaaS（"我们"、"我们的"或"本服务"）非常重视用户的隐私保护。本隐私政策详细说明了我们如何收集、使用、存储和保护您在使用我们AI服务时的个人信息。',
                  'MokerSaaS（"我們"、"我們的"或"本服務"）非常重視用戶的隱私保護。本隱私政策詳細說明了我們如何收集、使用、存儲和保護您在使用我們AI服務時的個人信息。',
                  'MokerSaaS（以下「当社」「当社の」または「本サービス」）は、ユーザーのプライバシー保護を非常に重視しています。本プライバシーポリシーでは、当社のAIサービスをご利用いただく際に、当社がどのように個人情報を収集、使用、保存、保護するかを詳しく説明します。',
                  'MokerSaaS("당사", "당사의" 또는 "본 서비스")는 사용자의 개인정보 보호를 매우 중요하게 생각합니다. 본 개인정보 처리방침은 당사 AI 서비스 이용 시 당사가 개인정보를 어떻게 수집, 사용, 저장 및 보호하는지에 대해 자세히 설명합니다.',
                  'MokerSaaS ("we", "our", or "the service") takes user privacy protection very seriously. This privacy policy details how we collect, use, store, and protect your personal information when you use our AI services.'
                )}
              </p>
              <p className="mb-4">
                {t(
                  '使用我们的服务即表示您同意按照本隐私政策处理您的信息。如果您不同意本政策，请停止使用我们的服务。',
                  '使用我們的服務即表示您同意按照本隱私政策處理您的信息。如果您不同意本政策，請停止使用我們的服務。',
                  '本サービスを利用することで、お客様は本プライバシーポリシーに従った情報の取り扱いに同意したものとみなされます。本ポリシーに同意されない場合は、本サービスの利用を中止してください。',
                  '본 서비스를 사용하는 것은 본 개인정보 처리방침에 따른 정보 처리에 동의하는 것으로 간주됩니다. 본 정책에 동의하지 않으시는 경우 본 서비스 사용을 중단해 주십시오.',
                  'By using our services, you agree to the processing of your information in accordance with this privacy policy. If you do not agree with this policy, please stop using our services.'
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
                <li>{t('用户名（可选）', '用戶名（可選）', 'ユーザー名（任意）', '사용자 이름(선택사항)', 'Username (optional)')}</li>
                <li>{t('密码（加密存储）', '密碼（加密存儲）', 'パスワード（暗号化して保存）', '비밀번호(암호화 저장)', 'Password (encrypted storage)')}</li>
                <li>{t('注册时间和最后登录时间', '註冊時間和最後登錄時間', '登録時刻および最終ログイン時刻', '가입 시간 및 마지막 로그인 시간', 'Registration time and last login time')}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('2.2 AI服务使用数据', '2.2 AI服務使用數據', '2.2 AIサービス利用データ', '2.2 AI 서비스 이용 데이터', '2.2 AI Service Usage Data')}
              </h3>
              <p className="mb-4">
                {t('为了提供AI服务，我们可能收集：', '為了提供AI服務，我們可能收集：', 'AIサービス提供のため、当社が収集する可能性のある情報：', 'AI 서비스 제공을 위해 당사가 수집할 수 있는 정보:', 'To provide AI services, we may collect:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{t('输入内容', '輸入內容', '入力コンテンツ', '입력 콘텐츠', 'Input Content')}</strong>：
                  {t('您提供给AI服务的文本、图像、音频或其他内容', '您提供給AI服務的文本、圖像、音頻或其他內容', 'AIサービスに提供するテキスト、画像、音声、その他のコンテンツ', 'AI 서비스에 제공하는 텍스트, 이미지, 오디오 및 기타 콘텐츠', 'Text, images, audio, or other content you provide to AI services')}
                </li>
                <li>
                  <strong>{t('生成内容', '生成內容', '生成コンテンツ', '생성 콘텐츠', 'Generated Content')}</strong>：
                  {t('AI服务为您生成的内容（图像、视频、音频、文本等）', 'AI服務為您生成的內容（圖像、視頻、音頻、文本等）', 'AIサービスによって生成されたコンテンツ（画像、動画、音声、テキストなど）', 'AI 서비스가 생성한 콘텐츠(이미지, 영상, 오디오, 텍스트 등)', 'Content generated by AI services for you (images, videos, audio, text, etc.)')}
                </li>
                <li>
                  <strong>{t('使用统计', '使用統計', '利用統計', '이용 통계', 'Usage Statistics')}</strong>：
                  {t('服务调用次数、使用频率、功能偏好、积分消费记录', '服務調用次數、使用頻率、功能偏好、積分消費記錄', 'サービス呼び出し回数、利用頻度、機能設定、ポイント消費履歴', '서비스 호출 횟수, 이용 빈도, 기능 설정, 포인트 소비 기록', 'Service call count, usage frequency, feature preferences, points consumption records')}
                </li>
                <li>
                  <strong>{t('技术日志', '技術日誌', '技術ログ', '기술 로그', 'Technical Logs')}</strong>：
                  {t('处理时间、错误日志、性能数据、API调用记录', '處理時間、錯誤日誌、性能數據、API調用記錄', '処理時間、エラーログ、性能データ、API呼び出し記録', '처리 시간, 오류 로그, 성능 데이터, API 호출 기록', 'Processing time, error logs, performance data, API call records')}
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('2.3 技术信息', '2.3 技術信息', '2.3 技術情報', '2.3 기술 정보', '2.3 Technical Information')}
              </h3>
              <p className="mb-4">
                {t('我们自动收集的技术信息包括：', '我們自動收集的技術信息包括：', '当社が自動的に収集する技術情報には以下が含まれます：', '당사가 자동으로 수집하는 기술 정보는 다음과 같습니다:', 'Technical information we automatically collect includes:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('IP地址和地理位置信息', 'IP地址和地理位置信息', 'IPアドレスおよび地理位置情報', 'IP 주소 및 지리적 위치 정보', 'IP address and geographic location information')}</li>
                <li>{t('设备信息（浏览器类型、操作系统）', '設備信息（瀏覽器類型、操作系統）', 'デバイス情報（ブラウザの種類、オペレーティングシステム）', '기기 정보(브라우저 종류, 운영체제)', 'Device information (browser type, operating system)')}</li>
                <li>{t('访问时间和页面浏览记录', '訪問時間和頁面瀏覽記錄', 'アクセス時刻およびページ閲覧履歴', '접근 시간 및 페이지浏览 기록', 'Access time and page browsing history')}</li>
                <li>{t('推荐来源网址', '推薦來源網址', 'リファラーURL', '유입 경로 URL', 'Referrer URLs')}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('2.4 支付信息', '2.4 支付信息', '2.4 支払い情報', '2.4 결제 정보', '2.4 Payment Information')}
              </h3>
              <p className="mb-4">
                {t(
                  '对于付费服务，我们通过第三方支付处理商收集必要的支付信息。我们不直接存储您的完整信用卡信息。',
                  '對於付費服務，我們通過第三方支付處理商收集必要的支付信息。我們不直接存儲您的完整信用卡信息。',
                  '有料サービスについては、当社は第三者決済処理事業者を通じて必要な支払い情報を収集します。当社はお客様の完全なクレジットカード情報を直接保存しません。',
                  '유료 서비스의 경우 당사는 제3자 결제 처리업체를 통해 필요한 결제 정보를 수집합니다. 당사는 귀하의 전체 신용카드 정보를 직접 저장하지 않습니다.',
                  'For paid services, we collect necessary payment information through third-party payment processors. We do not directly store your complete credit card information.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('3. 信息使用方式', '3. 信息使用方式', '3. 情報の使用方法', '3. 정보 사용 방식', '3. How We Use Information')}
              </h2>
              <p className="mb-4">
                {t('我们使用收集的信息用于：', '我們使用收集的信息用於：', '当社は収集した情報を次の目的で使用します：', '당사는 수집한 정보를 다음의 목적으로 사용합니다:', 'We use collected information for:')}
              </p>

              <h3 className="text-xl font-semibold mb-3">
                {t('3.1 服务提供', '3.1 服務提供', '3.1 サービス提供', '3.1 서비스 제공', '3.1 Service Provision')}
              </h3>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('提供和改进AI服务功能', '提供和改進AI服務功能', 'AIサービス機能を提供および改善するため', 'AI 서비스 기능을 제공 및 개선하기 위해', 'Providing and improving AI service features')}</li>
                <li>{t('处理您的请求和生成内容', '處理您的請求和生成內容', 'お客様のリクエストを処理し、コンテンツを生成するため', '고객의 요청을 처리하고 콘텐츠를 생성하기 위해', 'Processing your requests and generating content')}</li>
                <li>{t('维护账户安全和服务稳定性', '維護賬戶安全和服務穩定性', 'アカウントのセキュリティとサービスの安定性を維持するため', '계정 보안 및 서비스 안정성을 유지하기 위해', 'Maintaining account security and service stability')}</li>
                <li>{t('管理订阅和积分系统', '管理訂閱和積分系統', 'サブスクリプションおよびポイントシステムを管理するため', '구독 및 포인트 시스템을 관리하기 위해', 'Managing subscription and points system')}</li>
                <li>{t('提供技术支持和客户服务', '提供技術支持和客戶服務', 'テクニカルサポートおよびカスタマーサービスを提供するため', '기술 지원 및 고객 서비스를 제공하기 위해', 'Providing technical support and customer service')}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('3.2 服务优化', '3.2 服務優化', '3.2 サービス最適化', '3.2 서비스 최적화', '3.2 Service Optimization')}
              </h3>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('分析使用模式以改进服务质量', '分析使用模式以改進服務質量', 'サービス品質向上のため利用パターンを分析するため', '서비스 품질 개선을 위해 이용 패턴을 분석하기 위해', 'Analyzing usage patterns to improve service quality')}</li>
                <li>{t('开发新功能和AI服务类型', '開發新功能和AI服務類型', '新機能およびAIサービス種別を開発するため', '새로운 기능 및 AI 서비스 유형을 개발하기 위해', 'Developing new features and AI service types')}</li>
                <li>{t('优化用户体验和界面设计', '優化用戶體驗和界面設計', 'ユーザー体験とUIデザインを最適化するため', '사용자 경험 및 인터페이스 디자인을 최적화하기 위해', 'Optimizing user experience and interface design')}</li>
                <li>{t('进行安全监控和欺诈防护', '進行安全監控和欺詐防護', 'セキュリティ監視および不正アクセス防止を行うため', '보안 모니터링 및 사기 방지 활동을 수행하기 위해', 'Conducting security monitoring and fraud protection')}</li>
                <li>{t('评估和集成新的AI模型和技术', '評估和集成新的AI模型和技術', '新しいAIモデルと技術を評価・統合するため', '새로운 AI 모델과 기술을 평가하고 통합하기 위해', 'Evaluating and integrating new AI models and technologies')}</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('3.3 法律合规', '3.3 法律合規', '3.3 法令遵守', '3.3 법적 준수', '3.3 Legal Compliance')}
              </h3>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('遵守适用的法律法规', '遵守適用的法律法規', '適用される法律および規制を遵守するため', '적용 가능한 법률 및 규정을 준수하기 위해', 'Complying with applicable laws and regulations')}</li>
                <li>{t('响应法律程序和政府要求', '響應法律程序和政府要求', '法的手続きおよび政府要請に対応するため', '법적 절차 및 정부 요청에 대응하기 위해', 'Responding to legal processes and government requests')}</li>
                <li>{t('保护我们的权利和用户安全', '保護我們的權利和用戶安全', '当社の権利およびユーザーの安全を保護するため', '당사의 권리 및 사용자 안전을 보호하기 위해', 'Protecting our rights and user safety')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('4. 数据安全', '4. 數據安全', '4. データセキュリティ', '4. 데이터 보안', '4. Data Security')}
              </h2>
              <p className="mb-4">
                {t('我们采用行业标准的安全措施保护您的信息：', '我們採用行業標準的安全措施保護您的信息：', 'お客様の情報を保護するために、業界標準のセキュリティ対策を採用しています：', '당사는 업계 표준 보안 조치를 사용하여 귀하의 정보를 보호합니다:', 'We employ industry-standard security measures to protect your information:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{t('加密传输', '加密傳輸', '暗号化通信', '암호화된 전송', 'Encrypted Transmission')}</strong>：
                  {t('使用SSL/TLS协议加密所有数据传输', '使用SSL/TLS協議加密所有數據傳輸', 'すべてのデータ通信をSSL/TLSプロトコルで暗号化', '모든 데이터 전송을 SSL/TLS 프로토콜로 암호화', 'Using SSL/TLS protocols to encrypt all data transmission')}
                </li>
                <li>
                  <strong>{t('加密存储', '加密存儲', '暗号化保存', '암호화된 저장', 'Encrypted Storage')}</strong>：
                  {t('敏感数据采用AES-256加密存储', '敏感數據採用AES-256加密存儲', '機微データはAES-256で暗号化して保存', '민감한 데이터는 AES-256으로 암호화하여 저장', 'Sensitive data stored using AES-256 encryption')}
                </li>
                <li>
                  <strong>{t('访问控制', '訪問控制', 'アクセス制御', '접근 제어', 'Access Control')}</strong>：
                  {t('严格限制数据访问权限', '嚴格限制數據訪問權限', 'データアクセス権限を厳格に制限', '데이터 접근 권한을 엄격하게 제한', 'Strictly limiting data access permissions')}
                </li>
                <li>
                  <strong>{t('安全监控', '安全監控', 'セキュリティ監視', '보안 모니터링', 'Security Monitoring')}</strong>：
                  {t('7×24小时安全监控和威胁检测', '7×24小時安全監控和威脅檢測', '24時間体制でのセキュリティ監視および脅威検出', '연중무휴 24시간 보안 모니터링 및 위협 탐지', '24/7 security monitoring and threat detection')}
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('5. 您的权利', '5. 您的權利', '5. お客様の権利', '5. 사용자의 권리', '5. Your Rights')}
              </h2>
              <p className="mb-4">
                {t('您对自己的个人信息享有以下权利：', '您對自己的個人信息享有以下權利：', 'お客様は、ご自身の個人情報に関して以下の権利を有します：', '귀하는 자신의 개인정보에 대해 다음과 같은 권리를 가집니다:', 'You have the following rights regarding your personal information:')}
              </p>

              <h3 className="text-xl font-semibold mb-3">
                {t('5.1 访问和查看', '5.1 訪問和查看', '5.1 アクセスおよび閲覧', '5.1 접근 및 열람', '5.1 Access and View')}
              </h3>
              <p className="mb-4">
                {t('您可以随时查看我们收集的关于您的信息。', '您可以隨時查看我們收集的關於您的信息。', 'お客様は、当社がお客様について収集した情報をいつでも確認できます。', '귀하는 당사가 귀하에 대해 수집한 정보를 언제든지 열람할 수 있습니다.', 'You can view information we have collected about you at any time.')}
              </p>

              <h3 className="text-xl font-semibold mb-3">
                {t('5.2 更正和更新', '5.2 更正和更新', '5.2 訂正および更新', '5.2 정정 및 업데이트', '5.2 Correction and Update')}
              </h3>
              <p className="mb-4">
                {t('您可以更新或更正您的账户信息。', '您可以更新或更正您的賬戶信息。', 'お客様は、アカウント情報を更新または訂正できます。', '귀하는 계정 정보를 업데이트하거나 정정할 수 있습니다.', 'You can update or correct your account information.')}
              </p>

              <h3 className="text-xl font-semibold mb-3">
                {t('5.3 删除', '5.3 刪除', '5.3 削除', '5.3 삭제', '5.3 Deletion')}
              </h3>
              <p className="mb-4">
                {t('您可以要求删除您的账户和相关数据。某些信息可能因法律要求而保留。', '您可以要求刪除您的賬戶和相關數據。某些信息可能因法律要求而保留。', 'お客様は、アカウントおよび関連データの削除を要求できます。法令により保持が義務付けられている情報は例外です。', '귀하는 계정 및 관련 데이터의 삭제를 요청할 수 있습니다. 일부 정보는 법적 요구 사항에 따라 보존될 수 있습니다.', 'You can request deletion of your account and related data. Some information may be retained due to legal requirements.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('6. 联系我们', '6. 聯繫我們', '6. お問い合わせ', '6. 문의하기', '6. Contact Us')}
              </h2>
              <p className="mb-4">
                {t(
                  '如果您对本隐私政策有任何疑问或需要行使您的权利，请联系我们：',
                  '如果您對本隱私政策有任何疑問或需要行使您的權利，請聯繫我們：',
                  '本プライバシーポリシーに関してご質問がある場合、またはお客様の権利を行使したい場合は、当社までご連絡ください：',
                  '본 개인정보 처리방침에 대해 궁금한 점이 있거나 권리를 행사하고자 하시는 경우 당사에 문의하시기 바랍니다:',
                  'If you have any questions about this privacy policy or need to exercise your rights, please contact us:'
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