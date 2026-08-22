"use client"

import { useParams } from 'next/navigation'

type L = 'en' | 'zh-CN' | 'ja' | 'ko' | 'zh-TW'

export function TermsContent() {
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
            {t('服务条款', '服務條款', '利用規約', '이용 약관', 'Terms of Service')}
          </h1>
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-8">
              {t('最后更新：2026年8月22日', '最後更新：2026年8月22日', '最終更新日：2026年8月22日', '최종 업데이트: 2026년 8월 22일', 'Last updated: August 22, 2026')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('1. 服务说明', '1. 服務說明', '1. サービス概要', '1. 서비스 설명', '1. Service Description')}
              </h2>
              <p className="mb-4">
                {t(
                  '欢迎使用MokerSaaS（"我们"、"我们的"或"本服务"）。MokerSaaS是一个开源的SaaS（软件即服务）模板，提供网站托管、用户认证、订阅与支付、推广返利、后台管理等功能。您可以将其作为产品部署，也可以基于源码进行二次开发。',
                  '歡迎使用MokerSaaS（"我們"、"我們的"或"本服務"）。MokerSaaS是一個開源的SaaS（軟件即服務）模板，提供網站託管、用戶認證、訂閱與支付、推廣返利、後台管理等功能。您可以將其作為產品部署，也可以基於源碼進行二次開發。',
                  'MokerSaaS（以下「当社」「当社の」または「本サービス」）へようこそ。MokerSaaSはオープンソースのSaaS（Software as a Service）テンプレートであり、ウェブサイトホスティング、ユーザー認証、サブスクリプションと決済、アフィリエイト、管理画面などの機能を提供します。製品としてデプロイすることも、ソースコードをベースに二次開発することも可能です。',
                  'MokerSaaS("당사", "당사의" 또는 "본 서비스")를 사용해 주셔서 환영합니다. MokerSaaS는 오픈소스 SaaS(Software as a Service) 템플릿으로, 웹사이트 호스팅, 사용자 인증, 구독 및 결제, 제휴 추천, 관리자 콘솔 등의 기능을 제공합니다. 제품으로 배포하거나 소스코드를 기반으로 2차 개발할 수 있습니다.',
                  'Welcome to MokerSaaS ("we", "our", or "the service"). MokerSaaS is an open-source SaaS (Software as a Service) template that provides website hosting, user authentication, subscriptions and payments, referral and affiliate programs, and an admin dashboard. You may deploy it as a product or fork the source code for further development.'
                )}
              </p>
              <p className="mb-4">
                {t(
                  '通过访问和使用我们的网站，即表示您同意受本服务条款的约束。如果您不同意本条款的任何部分，请不要使用我们的服务。',
                  '通過訪問和使用我們的網站，即表示您同意受本服務條款的約束。如果您不同意本條款的任何部分，請不要使用我們的服務。',
                  '本サービスをご利用いただくことで、お客様は本利用規約に拘束されることに同意したものとみなされます。本規約のいずれかの部分に同意されない場合は、本サービスのご利用をお控えください。',
                  '본 서비스를 이용함으로써 귀하는 본 이용 약관의 구속을 받는 데 동의하게 됩니다. 본 약관의 어떤 부분에도 동의하지 않으시는 경우 본 서비스를 이용하지 마십시오.',
                  'By accessing and using our website, you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, please do not use our service.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('2. 用户账户', '2. 用戶賬戶', '2. ユーザーアカウント', '2. 사용자 계정', '2. User Accounts')}
              </h2>
              <p className="mb-4">
                {t(
                  '为了使用完整功能，您需要创建一个账户。您必须提供准确、完整和最新的信息，并妥善保管您的登录凭证。您对您账户下发生的所有活动承担责任。',
                  '為了使用完整功能，您需要創建一個賬戶。您必須提供準確、完整和最新的信息，並妥善保管您的登入憑證。您對您賬戶下發生的所有活動承擔責任。',
                  'すべての機能をご利用いただくには、アカウントの作成が必要です。正確、完全かつ最新の情報を提供し、ログイン認証情報を適切に管理する責任はお客様にあります。お客様のアカウントで行われるすべての活動について、お客様が責任を負うものとします。',
                  '전체 기능을 사용하려면 계정을 만들어야 합니다. 정확하고 완전하며 최신의 정보를 제공해야 하며, 로그인 자격 증명을 안전하게 관리할 책임은 귀하에게 있습니다. 귀하의 계정에서 발생하는 모든 활동에 대해 귀하가 책임을 집니다.',
                  'To use the full functionality, you need to create an account. You must provide accurate, complete, and up-to-date information and keep your credentials secure. You are responsible for all activity that occurs under your account.'
                )}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('您必须年满18岁或在您所在司法管辖区的法定年龄', '您必須年滿18歲或在您所在司法管轄區的法定年齡', '18歳以上、またはお住まいの司法管轄区における法定年齢に達していること', '귀하는 18세 이상 또는 귀하의 관할 지역의 법적 성년에 도달해야 합니다', 'You must be 18 years old or the legal age in your jurisdiction')}</li>
                <li>{t('每个用户只能拥有一个账户', '每個用戶只能擁有一個賬戶', '各ユーザーは1つのアカウントのみ保有できます', '각 사용자는 하나의 계정만 보유할 수 있습니다', 'Each user can only have one account')}</li>
                <li>{t('您不得与他人共享您的账户凭据', '您不得與他人共享您的賬戶憑證', 'アカウントの認証情報を他者と共有することはできません', '다른 사람과 계정 자격 증명을 공유할 수 없습니다', 'You may not share your account credentials with others')}</li>
                <li>{t('您有责任维护账户信息的准确性', '您有責任維護賬戶信息的準確性', 'アカウント情報の正確性を維持する責任はお客様にあります', '계정 정보의 정확성을 유지하는 책임은 귀하에게 있습니다', 'You are responsible for maintaining the accuracy of your account information')}</li>
                <li>{t('如发现未经授权的访问，请立即通知我们', '如發現未經授權的訪問，請立即通知我們', '不正アクセスを確認した場合は、ただちに当社までご連絡ください', '무단 액세스를 발견한 경우 즉시 당사에 알려주십시오', 'Notify us immediately if you become aware of any unauthorized access')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('3. 可接受使用', '3. 可接受使用', '3. 許容される使用', '3. 허용되는 사용', '3. Acceptable Use')}
              </h2>
              <p className="mb-4">
                {t('您同意不会将本服务用于以下目的：', '您同意不會將本服務用於以下目的：', 'お客様は、本サービスを以下の目的で使用しないことに同意します：', '귀하는 본 서비스를 다음의 목적으로 사용하지 않는 것에 동의합니다:', 'You agree not to use the service for any of the following:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('从事违法、欺诈、侵权或损害他人权益的活动', '從事違法、欺詐、侵權或損害他人權益的活動', '違法、詐欺、権利侵害、または他者の権益を毀損する行為', '불법, 사기, 권리 침해 또는 타인의 권익을 해치는 활동', 'Engaging in illegal, fraudulent, infringing, or harmful activities')}</li>
                <li>{t('上传或传播恶意代码、病毒或垃圾内容', '上傳或傳播惡意代碼、病毒或垃圾內容', '悪意のあるコード、ウイルス、スパムコンテンツをアップロードまたは送信する行為', '악성 코드, 바이러스 또는 스팸 콘텐츠를 업로드 또는 유포하는 행위', 'Uploading or transmitting malware, viruses, or spam content')}</li>
                <li>{t('尝试未经授权访问系统、其他用户账户或数据', '嘗試未經授權訪問系統、其他用戶賬戶或數據', 'システム、他のユーザーアカウント、データへの不正アクセスを試みる行為', '시스템, 다른 사용자 계정 또는 데이터에 무단으로 액세스를 시도하는 행위', 'Attempting unauthorized access to systems, other users\' accounts, or data')}</li>
                <li>{t('干扰或破坏服务的正常运行', '干擾或破壞服務的正常運行', 'サービスの正常な動作を妨害または中断する行為', '서비스의 정상적인 작동을 방해하거나 중단시키는 행위', 'Interfering with or disrupting the operation of the service')}</li>
                <li>{t('使用自动化手段批量注册账户、抓取数据或绕过限制', '使用自動化手段批量註冊賬戶、抓取數據或繞過限制', '自動化された手段でアカウントを一括作成、データをスクレイピング、または制限を回避する行為', '자동화된 수단을 사용하여 계정을 대량 생성하거나, 데이터를 스크래핑하거나, 제한을 우회하는 행위', 'Using automated means to bulk-create accounts, scrape data, or bypass limitations')}</li>
                <li>{t('冒用他人身份或提供虚假信息', '冒用他人身份或提供虛假信息', '他者の身元を詐称する、または虚偽の情報を提供する行為', '타인의 신원을 도용하거나 허위 정보를 제공하는 행위', 'Impersonating others or providing false information')}</li>
                <li>{t('滥用推广或返利系统获取不当利益', '濫用推廣或返利系統獲取不當利益', '推薦またはアフィリエイトプログラムを悪用して不当な利益を得る行為', '추천 또는 제휴 프로그램을 남용하여 부당한 이익을 얻는 행위', 'Abusing referral or affiliate programs to obtain improper benefits')}</li>
              </ul>
              <p className="mb-4">
                {t('我们保留在发现违规行为时暂停或终止违规账户的权利。', '我們保留在發現違規行為時暫停或終止違規賬戶的權利。', '違反行為を確認した場合、当社は当該アカウントを一時停止または終了する権利を留保します。', '위반 행위가 발견될 경우 당사는 해당 계정을 일시 중지 또는 해지할 권리를 보유합니다.', 'We reserve the right to suspend or terminate accounts that violate these rules.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('4. 订阅与付款', '4. 訂閱與付款', '4. サブスクリプションと支払い', '4. 구독 및 결제', '4. Subscriptions and Payments')}
              </h2>
              <p className="mb-4">
                {t('本服务的部分功能以订阅形式提供。具体条款如下：', '本服務的部分功能以訂閱形式提供。具體條款如下：', '本サービスの一部機能はサブスクリプション形式で提供されます。具体的な条件は以下の通りです：', '본 서비스의 일부 기능은 구독 형태로 제공됩니다. 구체적인 조건은 다음과 같습니다:', 'Some features of the service are provided on a subscription basis. Specific terms are as follows:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('价格以页面展示为准，可能因地区、汇率或税费而有所调整', '價格以頁面展示為準，可能因地區、匯率或稅費而有所調整', '価格はページ表示の通りとなり、地域、為替レートまたは税金により調整される場合があります', '가격은 페이지에 표시된 대로이며, 지역, 환율 또는 세금에 따라 조정될 수 있습니다', 'Prices are as displayed on the page and may vary by region, exchange rate, or applicable taxes')}</li>
                <li>{t('订阅按所选周期（月付或年付）自动续费', '訂閱按所選週期（月付或年付）自動續費', 'サブスクリプションは選択された期間（月払いまたは年払い）で自動更新されます', '구독은 선택한 주기(월간 또는 연간)로 자동 갱신됩니다', 'Subscriptions auto-renew on the period you selected (monthly or yearly)')}</li>
                <li>{t('我们通过Stripe等第三方支付服务商处理付款，不会直接存储您的完整银行卡信息', '我們通過Stripe等第三方支付服務商處理付款，不會直接存儲您的完整銀行卡信息', 'Stripe等の第三者決済サービスを通じて支払いを処理し、お客様の完全なクレジットカード情報を直接保存しません', '당사는 Stripe 등 제3자 결제 서비스 제공업체를 통해 결제를 처리하며, 귀하의 전체 카드 정보를 직접 저장하지 않습니다', 'Payments are processed by third-party processors such as Stripe; we do not directly store your full card details')}</li>
                <li>{t('您可以随时取消订阅，取消将在当前计费周期结束时生效', '您可以隨時取消訂閱，取消將在當前計費週期結束時生效', 'サブスクリプションはいつでもキャンセル可能で、現在の請求期間の終了時に有効となります', '구독은 언제든지 취소할 수 있으며 취소는 현재 결제 주기가 끝날 때 효력이 발생합니다', 'You may cancel at any time; cancellation takes effect at the end of the current billing period')}</li>
                <li>{t('退款政策遵循各订阅计划页面公示的规则', '退款政策遵循各訂閱計劃頁面公示的規則', '返金ポリシーは各サブスクリプションページに記載された規定に従います', '환불 정책은 각 구독 플랜 페이지에 명시된 규칙을 따릅니다', 'Refund terms follow the rules published on each subscription plan page')}</li>
                <li>{t('如本服务提供积分或类似的计量型资源，相关规则（如有效期、清零、计费）将在购买页面和/或帮助文档中公示，并作为本条款的组成部分', '如本服務提供積分或類似的計量型資源，相關規則（如有效期、清零、計費）將在購買頁面和/或幫助文檔中公示，並作為本條款的組成部分', '本サービスがポイントやそれに類する計量型のリソースを提供する場合、有効期限、失効、課金などの関連ルールは購入ページおよび/またはヘルプドキュメントに掲載され、本規約の一部を構成するものとします', '본 서비스에서 포인트 또는 유사한計量형 리소스를 제공하는 경우, 관련 규정(유효 기간, 소멸, 과금 등)은 구매 페이지 및/또는 도움말 문서에 명시되며 본 약관의 일부를 구성합니다', 'Where the service provides credits or similar metered resources, the applicable rules (such as validity, expiration, and billing) are published on the purchase page and/or in the help docs and form part of these terms')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('5. 内容所有权与知识产权', '5. 內容所有權與知識產權', '5. コンテンツ所有権と知的財産', '5. 콘텐츠 소유권 및 지적 재산권', '5. Content Ownership and Intellectual Property')}
              </h2>
              <p className="mb-4">
                <strong>{t('您的内容', '您的內容', 'お客様のコンテンツ', '고객의 콘텐츠', 'Your Content')}</strong>：
                {t('您在服务中提交、上传或创建的内容（账号信息、配置数据、文本、文件等）的所有权归您所有。您授予我们为提供和维护服务所必需的有限使用许可。', '您在服務中提交、上傳或創建的內容（賬號信息、配置數據、文本、文件等）的所有權歸您所有。您授予我們為提供和維護服務所必需的有限使用許可。', 'サービスに送信、アップロードまたは作成したコンテンツ（アカウント情報、設定データ、テキスト、ファイル等）の所有権はお客様に帰属します。当社に対し、サービスの提供および維持に必要な限定的ライセンスを許諾するものとします。', '서비스에 제출, 업로드 또는 생성한 콘텐츠(계정 정보, 설정 데이터, 텍스트, 파일 등)의 소유권은 귀하에게 있습니다. 당사는 서비스 제공 및 유지에 필요한 범위의 사용권을 부여받습니다.', 'You retain ownership of the content you submit, upload, or create through the service (account data, configuration data, text, files, etc.). You grant us a limited license to use such content only as necessary to provide and maintain the service.')}
              </p>
              <p className="mb-4">
                <strong>{t('我们的知识产权', '我們的知識產權', '当社の知的財産', '당사의 지적 재산권', 'Our Intellectual Property')}</strong>：
                {t('MokerSaaS的源代码、商标、Logo、网站设计、品牌及相关内容受知识产权法保护。源代码遵循MIT开源协议，您可以在协议范围内自由使用、修改和分发。', 'MokerSaaS的源代碼、商標、Logo、網站設計、品牌及相關內容受知識產權法保護。源代碼遵循MIT開源協議，您可以在協議範圍內自由使用、修改和分發。', 'MokerSaaSのソースコード、商標、ロゴ、ウェブサイトデザイン、ブランドおよび関連コンテンツは知的財産法により保護されます。ソースコードはMITオープンソースライセンスの下で提供され、ライセンスの範囲内で自由に使用、修正、配布できます。', 'MokerSaaS의 소스코드, 상표, 로고, 웹사이트 디자인, 브랜드 및 관련 콘텐츠는 지적 재산권법에 의해 보호됩니다. 소스코드는 MIT 오픈소스 라이선스를 따르며, 라이선스 범위 내에서 자유롭게 사용, 수정 및 배포할 수 있습니다.', 'The source code, trademarks, logo, website design, branding, and related content of MokerSaaS are protected by intellectual property laws. The source code is released under the MIT License; you may freely use, modify, and redistribute it within the scope of that license.')}
              </p>
              <p className="mb-4">
                <strong>{t('反馈', '反饋', 'フィードバック', '피드백', 'Feedback')}</strong>：
                {t('如果您向我们提供建议或反馈，您同意我们可以为改进服务而自由使用这些信息，且无需向您支付费用。', '如果您向我們提供建議或反饋，您同意我們可以為改進服務而自由使用這些信息，且無需向您支付費用。', 'ご提案またはフィードバックを当社に提供いただいた場合、当社はサービス改善のため、報酬の支払いなしにこれらを自由に使用できることに同意するものとします。', '귀하가 당사에 제안 또는 피드백을 제공하는 경우, 당사는 서비스 개선을 위해 대가 없이 해당 정보를 자유롭게 사용할 수 있음에 동의합니다.', 'If you provide us with suggestions or feedback, you agree we may freely use them to improve the service without obligation to compensate you.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('6. 服务可用性', '6. 服務可用性', '6. サービスの可用性', '6. 서비스 가용성', '6. Service Availability')}
              </h2>
              <p className="mb-4">
                {t(
                  '我们努力保持服务的高可用性，但无法保证服务100%不间断。我们可能因维护、更新或不可抗力暂停服务，并会尽力提前通过站点公告或邮件通知计划内的维护。',
                  '我們努力保持服務的高可用性，但無法保證服務100%不間斷。我們可能因維護、更新或不可抗力暫停服務，並會盡力提前通過站點公告或郵件通知計劃內的維護。',
                  '当社はサービスの可用性の維持に努めていますが、100%の無中断稼働を保証するものではありません。保守、更新、または不可抗力によりサービスを一時停止する場合があります。予定された保守については、サイト通知やメールにより事前にお知らせするよう努めます。',
                  '당사는 서비스의 높은 가용성 유지를 위해 노력하지만 100% 무중단 운영을 보장하지는 않습니다. 유지보수, 업데이트 또는 불가항력으로 인해 서비스가 일시 중단될 수 있습니다. 예정된 유지보수는 사이트 공지 또는 이메일을 통해 사전에 알려 드리도록 노력합니다.',
                  'We strive to maintain high service availability but cannot guarantee 100% uninterrupted service. We may suspend the service for maintenance, updates, or force majeure events, and will make reasonable efforts to notify users of planned maintenance via site notices or email.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('7. 免责声明', '7. 免責聲明', '7. 免責事項', '7. 면책 사항', '7. Disclaimer')}
              </h2>
              <p className="mb-4">
                {t(
                  '本服务按"现状"提供。在适用法律允许的最大范围内，我们不对服务的及时性、安全性、可靠性、准确性或对您特定需求的适用性作出任何明示或暗示的保证。',
                  '本服務按"現狀"提供。在適用法律允許的最大範圍內，我們不對服務的及時性、安全性、可靠性、準確性或對您特定需求的適用性作出任何明示或暗示的保證。',
                  '本サービスは「現状有姿」で提供されます。適用される法律が許容する最大限において、当社はサービスの適時性、セキュリティ、信頼性、正確性、またはお客様の特定の目的への適合性について、明示または黙示の保証を行いません。',
                  '본 서비스는 "있는 그대로" 제공됩니다. 관련 법률이 허용하는 최대한의 범위 내에서 당사는 서비스의 시의성, 보안, 신뢰성, 정확성 또는 귀하의 특정 목적에의 적합성에 대해 명시적 또는 묵시적 보증을 하지 않습니다.',
                  'The service is provided "as is". To the maximum extent permitted by applicable law, we make no warranties, express or implied, regarding the timeliness, security, reliability, accuracy, or fitness for a particular purpose of the service.'
                )}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('我们不对您因使用本服务而遭受的任何损失承担责任，除非该损失是由我们的故意或重大过失造成的', '我們不對您因使用本服務而遭受的任何損失承擔責任，除非該損失是由我們的故意或重大過失造成的', 'お客様が本サービスを利用したことにより被った損失について、当社に故意または重大な過失がある場合を除き、当社は責任を負いません', '귀하가 본 서비스를 이용하여 발생한 손실에 대해 당사의 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다', 'We are not liable for losses arising from your use of the service, except where caused by our intentional misconduct or gross negligence')}</li>
                <li>{t('我们不对第三方服务（包括支付服务商、邮件服务商、分析服务商）的行为负责', '我們不對第三方服務（包括支付服務商、郵件服務商、分析服務商）的行為負責', '第三者サービス（決済、メール、分析サービス提供者を含む）の行為について当社は責任を負いません', '당사는 제3자 서비스(결제, 이메일, 분석 서비스 제공업체 포함)의 행위에 대해 책임을 지지 않습니다', 'We are not responsible for the conduct of third-party services (payment, email, analytics providers, etc.)')}</li>
                <li>{t('您理解并同意，使用本服务的风险由您自行承担', '您理解並同意，使用本服務的風險由您自行承擔', '本サービスの利用に伴うリスクはお客様ご自身が負うことを理解し同意するものとします', '본 서비스 이용에 따른 위험은 귀하가 부담한다는 점을 이해하고 동의합니다', 'You understand and agree that your use of the service is at your sole risk')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('8. 责任限制', '8. 責任限制', '8. 責任の制限', '8. 책임의 제한', '8. Limitation of Liability')}
              </h2>
              <p className="mb-4">
                {t(
                  '在适用法律允许的最大范围内，我们对任何间接、偶然、特殊、惩罚性或后果性损害不承担责任。在任何情况下，我们的总责任不超过您在过去12个月内就本服务实际支付给我们的费用总额。',
                  '在適用法律允許的最大範圍內，我們對任何間接、偶然、特殊、懲罰性或後果性損害不承擔責任。在任何情況下，我們的總責任不超過您在過去12個月內就本服務實際支付給我們的費用總額。',
                  '適用される法律で許容される最大限度において、当社は間接的、偶発的、特別、懲罰的または結果的損害について責任を負いません。いかなる場合も、当社の総責任は、お客様が過去12か月間に本サービスについて実際に当社へ支払われた料金総額を超えないものとします。',
                  '관련 법률이 허용하는 최대한의 범위 내에서 당사는 간접적, 부수적, 특수, 징벌적 또는 결과적 손해에 대해 책임을 지지 않습니다. 어떠한 경우에도 당사의 총 책임은 귀하가 지난 12개월 동안 본 서비스에 대해 실제로 당사에 지불한 총액을 초과하지 않습니다.',
                  'To the maximum extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, punitive, or consequential damages. In any event, our total liability shall not exceed the total amount you have actually paid us for the service in the past 12 months.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('9. 条款修改', '9. 條款修改', '9. 規約の変更', '9. 약관 변경', '9. Modifications')}
              </h2>
              <p className="mb-4">
                {t(
                  '我们保留随时修改本服务条款的权利。如有重大变更，我们会通过站点公告或邮件至少提前7天通知。继续使用服务即表示您接受修改后的条款。',
                  '我們保留隨時修改本服務條款的權利。如有重大變更，我們會通過站點公告或郵件至少提前7天通知。繼續使用服務即表示您接受修改後的條款。',
                  '当社は本利用規約をいつでも変更する権利を留保します。重要な変更については、サイト通知またはメールにより少なくとも7日前までにお知らせします。サービスの継続利用は、変更後の規約に同意したものとみなされます。',
                  '당사는 언제든지 본 이용 약관을 수정할 권리를 보유합니다. 중요한 변경이 있을 경우 사이트 공지 또는 이메일을 통해 최소 7일 전에 알려 드립니다. 서비스를 계속 이용하시면 수정된 약관에 동의하는 것으로 간주됩니다.',
                  'We reserve the right to modify these Terms at any time. For material changes, we will provide at least 7 days\' notice via a site announcement or email. Continued use of the service constitutes acceptance of the modified terms.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('10. 适用法律与争议解决', '10. 適用法律與爭議解決', '10. 準拠法と紛争解決', '10. 준거법 및 분쟁 해결', '10. Governing Law and Dispute Resolution')}
              </h2>
              <p className="mb-4">
                {t(
                  '本条款的订立、生效、解释、履行、修改、终止及争议解决均适用您所在司法管辖区的适用法律。因本条款产生的争议，双方应首先通过友好协商解决；协商不成的，提交至有管辖权的法院解决。',
                  '本條款的訂立、生效、解釋、履行、修改、終止及爭議解決均適用您所在司法管轄區的適用法律。因本條款產生的爭議，雙方應首先通過友好協商解決；協商不成的，提交至有管轄權的法院解決。',
                  '本規約の締結、有効性、解釈、履行、変更、終了および紛争解決には、お客様の司法管轄区域の適用法が適用されます。本規約から生じる紛争は、まず当事者間の友好的協議により解決するものとします。合意に至らない場合は、管轄権を有する裁判所に提起するものとします。',
                  '본 약관의 체결, 효력, 해석, 이행, 변경, 종료 및 분쟁 해결에는 귀하의 관할 지역의 적용 법률이 적용됩니다. 본 약관에서 발생하는 분쟁은 우선 당사자 간의 우호적 협상을 통해 해결하며, 합의가 이루어지지 않는 경우 관할 법원에 제출하여 해결합니다.',
                  'These Terms are governed by the applicable laws of your jurisdiction. Disputes arising from or relating to these Terms shall first be resolved through good-faith negotiation; failing that, they shall be submitted to the competent court of your jurisdiction.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('11. 可分割性', '11. 可分割性', '11. 可分性', '11. 분리 가능성', '11. Severability')}
              </h2>
              <p className="mb-4">
                {t(
                  '如本条款中的任何规定被有管辖权的法院认定为无效或不可执行，其余条款的效力不受影响。',
                  '如本條款中的任何規定被有管轄權的法院認定為無效或不可執行，其餘條款的效力不受影響。',
                  '本規約のいずれかの規定が管轄裁判所により無効または執行不能と判断された場合であっても、その他の規定の有効性には影響を与えないものとします。',
                  '본 약관의 어떤 조항이 관할 법원에 의해 무효 또는 집행 불가능으로 판단되더라도, 나머지 조항의 효력에는 영향을 미치지 않습니다.',
                  'If any provision of these Terms is held by a competent court to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('12. 联系我们', '12. 聯繫我們', '12. お問い合わせ', '12. 문의하기', '12. Contact Us')}
              </h2>
              <p className="mb-4">
                {t(
                  '如果您对本服务条款有任何疑问，请通过以下方式联系我们：',
                  '如果您對本服務條款有任何疑問，請通過以下方式聯繫我們：',
                  '本利用規約に関してご質問がございましたら、以下の方法でお問い合わせください：',
                  '본 이용 약관에 대해 궁금한 점이 있으시면 다음의 방법으로 당사에 문의하시기 바랍니다:',
                  'If you have any questions about these Terms of Service, please contact us through the following channels:'
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