"use client"

import { useParams } from 'next/navigation'

type L = 'en' | 'zh' | 'ja' | 'ko' | 'tw'

export function TermsContent() {
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
            {t('服务条款', '服務條款', '利用規約', '이용 약관', 'Terms of Service')}
          </h1>
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-8">
              {t('最后更新：2026年1月6日', '最後更新：2026年1月6日', '最終更新日：2026年1月6日', '최종 업데이트: 2026년 1월 6일', 'Last updated: January 6, 2026')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('1. 服务说明', '1. 服務說明', '1. サービス概要', '1. 서비스 설명', '1. Service Description')}
              </h2>
              <p className="mb-4">
                {t(
                  '欢迎使用MokerSaaS（"我们"、"我们的"或"本服务"）。MokerSaaS是一个专业的AI服务平台，为用户提供包括但不限于AI对话、AI图像生成、AI视频生成、AI语音合成、AI音乐生成等多种AI功能服务。',
                  '歡迎使用MokerSaaS（"我們"、"我們的"或"本服務"）。MokerSaaS是一個專業的AI服務平臺，為用戶提供包括但不限於AI對話、AI圖像生成、AI視頻生成、AI語音合成、AI音樂生成等多種AI功能服務。',
                  'MokerSaaS（以下「当社」「当社の」または「本サービス」）へようこそ。MokerSaaSはプロフェッショナルなAIサービスプラットフォームであり、AIチャット、AI画像生成、AI動画生成、AI音声合成、AI音楽生成など、多彩なAI機能を提供します。',
                  'MokerSaaS("당사", "당사의" 또는 "본 서비스")를 사용해 주셔서 환영합니다. MokerSaaS는 전문 AI 서비스 플랫폼으로, AI 대화, AI 이미지 생성, AI 영상 생성, AI 음성 합성, AI 음악 생성 등 다양한 AI 기능을 제공합니다.',
                  'Welcome to MokerSaaS ("we", "our", or "the service"). MokerSaaS is a professional AI service platform that provides users with various AI features including but not limited to AI chat, AI image generation, AI video generation, AI text-to-speech, AI music generation, and more.'
                )}
              </p>
              <p className="mb-4">
                {t(
                  '通过访问和使用我们的服务，您同意受本服务条款的约束。如果您不同意本条款的任何部分，请不要使用我们的服务。',
                  '通過訪問和使用我們的服務，您同意受本服務條款的約束。如果您不同意本條款的任何部分，請不要使用我們的服務。',
                  '本サービスにアクセスし利用することで、お客様は本利用規約に拘束されることに同意したものとみなされます。本規約のいずれかの部分に同意されない場合は、本サービスのご利用をお控えください。',
                  '본 서비스에 접속하고 이용함으로써 귀하는 본 이용 약관의 구속을 받는 데 동의하게 됩니다. 본 약관의 어떤 부분에도 동의하지 않으시는 경우 본 서비스를 이용하지 마십시오.',
                  'By accessing and using our service, you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, please do not use our service.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('2. 用户账户', '2. 用戶賬戶', '2. ユーザーアカウント', '2. 사용자 계정', '2. User Accounts')}
              </h2>
              <p className="mb-4">
                {t(
                  '为了使用我们的服务，您需要创建一个账户。您必须提供准确、完整和最新的信息。您有责任保护您的账户安全，包括保护您的密码不被泄露。',
                  '為了使用我們的服務，您需要創建一個賬戶。您必須提供準確、完整和最新的信息。您有責任保護您的賬戶安全，包括保護您的密碼不被洩露。',
                  '本サービスをご利用いただくには、アカウントの作成が必要です。正確で完全な最新の情報を提供していただく必要があります。パスワードの機密保持を含め、アカウントのセキュリティ保護はお客様の責任となります。',
                  '본 서비스를 이용하시려면 계정을 만들어야 합니다. 정확하고 완전하며 최신의 정보를 제공해야 합니다. 비밀번호의 비밀을 유지하는 것을 포함하여 계정의 보안을 보호하는 것은 귀하의 책임입니다.',
                  'To use our service, you need to create an account. You must provide accurate, complete, and up-to-date information. You are responsible for protecting your account security, including keeping your password confidential.'
                )}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('您必须年满18岁或在您所在司法管辖区的法定年龄', '您必須年滿18歲或在您所在司法管轄區的法定年齡', '18歳以上、またはお住まいの司法管轄区における法定年齢に達していること', '귀하는 18세 이상 또는 귀하의 관할 지역의 법적 성년에 도달해야 합니다', 'You must be 18 years old or the legal age in your jurisdiction')}</li>
                <li>{t('每个用户只能拥有一个账户', '每個用戶只能擁有一個賬戶', '各ユーザーは1つのアカウントのみ保有できます', '각 사용자는 하나의 계정만 보유할 수 있습니다', 'Each user can only have one account')}</li>
                <li>{t('您不得与他人共享您的账户', '您不得與他人共享您的賬戶', 'アカウントを他者と共有することはできません', '다른 사람과 계정을 공유할 수 없습니다', 'You may not share your account with others')}</li>
                <li>{t('您有责任维护账户信息的准确性', '您有責任維護賬戶信息的準確性', 'アカウント情報の正確性を維持する責任はお客様にあります', '계정 정보의 정확성을 유지하는 책임은 귀하에게 있습니다', 'You are responsible for maintaining the accuracy of your account information')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('3. AI服务使用规则', '3. AI服務使用規則', '3. AIサービス利用ルール', '3. AI 서비스 이용 규칙', '3. AI Service Usage Rules')}
              </h2>
              <p className="mb-4">
                {t('我们的AI服务包括但不限于：', '我們的AI服務包括但不限於：', '当社のAIサービスには以下が含まれますが、これらに限定されません：', '당사의 AI 서비스에는 다음이 포함되나 이에 국한되지 않습니다:', 'Our AI services include but are not limited to:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>{t('AI对话', 'AI對話', 'AIチャット', 'AI 대화', 'AI Chat')}</strong>：
                  {t('智能对话助手，支持多种AI模型', '智能對話助手，支持多種AI模型', '複数のAIモデルに対応するインテリジェントな会話アシスタント', '여러 AI 모델을 지원하는 지능형 대화 어시스턴트', 'Intelligent conversation assistant supporting multiple AI models')}
                </li>
                <li>
                  <strong>{t('AI图像生成', 'AI圖像生成', 'AI画像生成', 'AI 이미지 생성', 'AI Image Generation')}</strong>：
                  {t('文本生成图像、图像编辑等视觉创作服务', '文本生成圖像、圖像編輯等視覺創作服務', 'テキストからの画像生成、画像編集などのビジュアル創作サービス', '텍스트-이미지 변환, 이미지 편집 등 시각적 창작 서비스', 'Text-to-image, image editing, and other visual creation services')}
                </li>
                <li>
                  <strong>{t('AI视频生成', 'AI視頻生成', 'AI動画生成', 'AI 영상 생성', 'AI Video Generation')}</strong>：
                  {t('文本或图像生成视频的自动化视频制作', '文本或圖像生成視頻的自動化視頻製作', 'テキストまたは画像からの動画自動生成サービス', '텍스트 또는 이미지로 영상을 자동 생성하는 서비스', 'Automated video production from text or images')}
                </li>
                <li>
                  <strong>{t('AI语音合成', 'AI語音合成', 'AI音声合成', 'AI 음성 합성', 'AI Text-to-Speech')}</strong>：
                  {t('文本转语音服务，生成自然流畅的语音', '文本轉語音服務，生成自然流暢的語音', '自然で流暢な音声を生成するテキスト読み上げサービス', '자연스럽고 유창한 음성을 생성하는 텍스트 음성 변환 서비스', 'Text-to-speech service generating natural and fluent voice')}
                </li>
                <li>
                  <strong>{t('AI音乐生成', 'AI音樂生成', 'AI音楽生成', 'AI 음악 생성', 'AI Music Generation')}</strong>：
                  {t('根据提示词和歌词生成完整音乐作品', '根據提示詞和歌詞生成完整音樂作品', 'プロンプトや歌詞から完全な楽曲を生成', '프롬프트와 가사로 완전한 음악 작품을 생성', 'Generate complete music compositions from prompts and lyrics')}
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                {t('使用限制', '使用限制', '利用制限', '이용 제한', 'Usage Restrictions')}
              </h3>
              <p className="mb-4">
                {t('在使用我们的AI服务时，您不得：', '在使用我們的AI服務時，您不得：', '当社のAIサービスをご利用いただく際、以下の行為を禁止します：', '당사의 AI 서비스 이용 시 다음 행위를 금합니다:', 'When using our AI services, you may not:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('生成非法、有害、威胁、辱骂、诽谤或侵犯他人权利的内容', '生成非法、有害、威脅、辱罵、誹謗或侵犯他人權利的內容', '違法、有害、脅迫的、侮辱的、誹謗的、または他者の権利を侵害するコンテンツを生成すること', '불법적이거나 유해하며 위협적이며 모욕적·비방적이거나 타인의 권리를 침해하는 콘텐츠를 생성하는 행위', 'Generate illegal, harmful, threatening, abusive, defamatory, or rights-infringing content')}</li>
                <li>{t('生成虚假信息或误导性内容', '生成虛假信息或誤導性內容', '虚偽の情報または誤解を招くコンテンツを生成すること', '허위 정보나 오해의 소지가 있는 콘텐츠를 생성하는 행위', 'Generate false information or misleading content')}</li>
                <li>{t('侵犯任何第三方的知识产权', '侵犯任何第三方的知識產權', '第三者の知的財産権を侵害すること', '제3자의 지적 재산권을 침해하는 행위', 'Infringe on any third party\'s intellectual property')}</li>
                <li>{t('尝试逆向工程或破解我们的AI系统', '嘗試逆向工程或破解我們的AI系統', '当社のAIシステムをリバースエンジニアリングまたはハッキングしようとすること', '당사의 AI 시스템을 리버스 엔지니어링하거나 해킹하려는 행위', 'Attempt to reverse engineer or hack our AI systems')}</li>
                <li>{t('超过您订阅计划的使用限制', '超過您訂閱計劃的使用限制', 'ご契約のサブスクリプションプランの利用上限を超過すること', '구독 플랜의 이용 한도를 초과하는 행위', 'Exceed the usage limits of your subscription plan')}</li>
                <li>{t('使用AI服务进行自动化批量操作以规避使用限制', '使用AI服務進行自動化批量操作以規避使用限制', '利用制限を回避するためにAIサービスを自動化された一括操作に利用すること', '이용 제한을 우회하기 위해 AI 서비스를 자동화된 대량 작업에 사용하는 행위', 'Use AI services for automated bulk operations to circumvent usage limits')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('4. 内容所有权和知识产权', '4. 內容所有權和知識產權', '4. コンテンツ的所有権と知的財産', '4. 콘텐츠 소유권 및 지적 재산권', '4. Content Ownership and Intellectual Property')}
              </h2>
              <p className="mb-4">
                <strong>{t('您的内容', '您的內容', 'お客様のコンテンツ', '고객의 콘텐츠', 'Your Content')}</strong>：
                {t('您保留对输入到我们AI系统中的原始内容的所有权利。', '您保留對輸入到我們AI系統中的原始內容的所有權利。', 'お客様が当社のAIシステムに入力した元のコンテンツに関するすべての権利はお客様に帰属します。', '당사의 AI 시스템에 입력한 원본 콘텐츠에 대한 모든 권리는 귀하에게 귀속됩니다.', 'You retain all rights to the original content you input into our AI systems.')}
              </p>
              <p className="mb-4">
                <strong>{t('AI生成内容', 'AI生成內容', 'AIが生成したコンテンツ', 'AI 생성 콘텐츠', 'AI Generated Content')}</strong>：
                {t('通过我们的AI服务生成的内容版权归您所有。您可以自由使用、修改、分发和商业化这些内容。但请注意，您需要遵守相关法律法规和第三方AI模型提供商的使用条款。', '通過我們的AI服務生成的內容版權歸您所有。您可以自由使用、修改、分發和商業化這些內容。但請注意，您需要遵守相關法律法規和第三方AI模型提供商的使用條款。', '当社のAIサービスを通じて生成されたコンテンツの著作権はお客様に帰属します。自由に利用、修正、配布、商用利用することができます。ただし、関連法規および第三者AIモデル提供者の利用規約を遵守する必要があることにご注意ください。', '당사 AI 서비스를 통해 생성된 콘텐츠의 저작권은 귀하에게 귀속됩니다. 자유롭게 사용, 수정, 배포 및 상업적 활용이 가능합니다. 단, 관련 법규 및 제3자 AI 모델 제공업체의 이용 약관을 준수해야 합니다.', 'The copyright of content generated through our AI services belongs to you. You may freely use, modify, distribute, and commercialize this content. However, please note that you must comply with relevant laws and regulations and the terms of use of third-party AI model providers.')}
              </p>
              <p className="mb-4">
                <strong>{t('我们的知识产权', '我們的知識產權', '当社の知的財産', '당사의 지적 재산권', 'Our Intellectual Property')}</strong>：
                {t('MokerSaaS平台、网站设计、代码、算法和相关技术受知识产权法保护，归我们所有。', 'MokerSaaS平臺、網站設計、代碼、算法和相關技術受知識產權法保護，歸我們所有。', 'MokerSaaSプラットフォーム、ウェブサイトデザイン、コード、アルゴリズムおよび関連技術は知的財産法により保護され、当社に帰属します。', 'MokerSaaS 플랫폼, 웹사이트 디자인, 코드, 알고리즘 및 관련 기술은 지적 재산권법에 의해 보호되며 당사에 귀속됩니다.', 'The MokerSaaS platform, website design, code, algorithms, and related technologies are protected by intellectual property laws and belong to us.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('5. 付费服务和退款', '5. 付費服務和退款', '5. 有料サービスと返金', '5. 유료 서비스 및 환불', '5. Paid Services and Refunds')}
              </h2>
              <p className="mb-4">
                {t('我们提供免费和付费的AI服务。付费服务的具体条款包括：', '我們提供免費和付費的AI服務。付費服務的具體條款包括：', '当社は無料および有料のAIサービスを提供しています。有料サービスの具体的な条件は次の通りです：', '당사는 무료 및 유료 AI 서비스를 제공합니다. 유료 서비스의 구체적인 조건은 다음과 같습니다:', 'We offer both free and paid AI services. Specific terms for paid services include:')}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('所有价格以美元计算，可能因增值税而有所调整', '所有價格以美元計算，可能因增值稅而有所調整', 'すべての価格は米ドルで表示され、付加価値税により調整される場合があります', '모든 가격은 미국 달러로 표시되며 부가세에 따라 조정될 수 있습니다', 'All prices are calculated in US dollars and may be adjusted for VAT')}</li>
                <li>{t('订阅费用按月收取，自动续费', '訂閱費用按月收取，自動續費', 'サブスクリプション料金は月額で自動更新されます', '구독료는 매월 청구되며 자동 갱신됩니다', 'Subscription fees are charged monthly with automatic renewal')}</li>
                <li>{t('积分购买后立即生效，可用于各种AI服务', '積分購買後立即生效，可用於各種AI服務', 'ポイントは購入後すぐに有効となり、各种のAIサービスに利用できます', '포인트는 구매 즉시 효력이 발생하며 다양한 AI 서비스에 사용할 수 있습니다', 'Points are effective immediately after purchase and can be used for various AI services')}</li>
                <li>{t('您可以随时取消订阅，取消将在当前计费周期结束时生效', '您可以隨時取消訂閱，取消將在當前計費週期結束時生效', 'サブスクリプションはいつでもキャンセル可能で、現在の請求期間の終了時に有効となります', '구독은 언제든지 취소할 수 있으며 취소는 현재 결제 주기가 종료될 때 효력이 발생합니다', 'You can cancel your subscription at any time, with cancellation taking effect at the end of the current billing cycle')}</li>
                <li>{t('我们提供7天无理由退款保证（仅限首次订阅）', '我們提供7天無理由退款保證（僅限首次訂閱）', '初回サブスクリプションに限り、7日間無条件返金保証を提供します', '첫 구독에 한해 7일 무조건 환불 보증을 제공합니다', 'We offer a 7-day no-questions-asked refund guarantee (first-time subscriptions only)')}</li>
                <li>{t('已使用的积分和服务不可退款', '已使用的積分和服務不可退款', '既に使用されたポイントおよびサービスは返金対象外です', '이미 사용된 포인트와 서비스는 환불되지 않습니다', 'Used points and services are non-refundable')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('6. 服务可用性', '6. 服務可用性', '6. サービスの可用性', '6. 서비스 가용성', '6. Service Availability')}
              </h2>
              <p className="mb-4">
                {t(
                  '我们努力保持服务的高可用性，但无法保证服务100%不间断。我们可能因维护、更新或其他技术原因暂停服务。我们会尽力提前通知用户计划中的维护。',
                  '我們努力保持服務的高可用性，但無法保證服務100%不間斷。我們可能因維護、更新或其他技術原因暫停服務。我們會盡力提前通知用戶計劃中的維護。',
                  '当社は高いサービス可用性の維持に努めていますが、100%の無中断稼働を保証するものではありません。保守、更新、その他の技術的理由によりサービスを一時停止する場合があります。予定された保守については事前にお客様にお知らせするよう努めます。',
                  '당사는 서비스의 높은 가용성 유지를 위해 노력하지만 100% 무중단 운영을 보장하지는 않습니다. 유지보수, 업데이트 및 기타 기술적 이유로 서비스를 일시 중단할 수 있습니다. 예정된 유지보수는 사전에 사용자에게 알려 드리도록 노력합니다.',
                  'We strive to maintain high service availability but cannot guarantee 100% uninterrupted service. We may suspend service for maintenance, updates, or other technical reasons. We will make every effort to notify users in advance of planned maintenance.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('7. 免责声明', '7. 免責聲明', '7. 免責事項', '7. 면책 사항', '7. Disclaimer')}
              </h2>
              <p className="mb-4">
                {t(
                  '我们的AI服务按"现状"提供。我们不保证AI生成内容的准确性、完整性或适用性。用户应对AI生成内容进行审查，并承担使用风险。',
                  '我們的AI服務按"現狀"提供。我們不保證AI生成內容的準確性、完整性或適用性。用戶應對AI生成內容進行審查，並承擔使用風險。',
                  '当社のAIサービスは「現状有姿」で提供されます。AIが生成したコンテンツの正確性、完全性、適合性を保証するものではありません。ユーザーはAIが生成したコンテンツをレビューし、利用に伴うリスクを負担するものとします。',
                  '당사의 AI 서비스는 "있는 그대로" 제공됩니다. AI가 생성한 콘텐츠의 정확성, 완전성 또는 적합성을 보장하지 않습니다. 사용자는 AI 생성 콘텐츠를 검토하고 이용에 따른 위험을 부담해야 합니다.',
                  'Our AI services are provided "as is". We do not guarantee the accuracy, completeness, or suitability of AI-generated content. Users should review AI-generated content and assume the risks of use.'
                )}
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>{t('我们不对AI生成内容的质量做任何保证', '我們不對AI生成內容的質量做任何保證', 'AIが生成したコンテンツの品質について一切保証しません', '당사는 AI 생성 콘텐츠의 품질에 대해 어떠한 보증도 하지 않습니다', 'We make no guarantees about the quality of AI-generated content')}</li>
                <li>{t('我们不对因使用AI生成内容而产生的任何损失负责', '我們不對因使用AI生成內容而產生的任何損失負責', 'AIが生成したコンテンツの利用により生じるいかなる損失についても責任を負いません', 'AI 생성 콘텐츠 사용으로 발생하는 어떠한 손실에 대해서도 책임을 지지 않습니다', 'We are not responsible for any losses arising from the use of AI-generated content')}</li>
                <li>{t('我们不保证服务不会出现错误或中断', '我們不保證服務不會出現錯誤或中斷', 'サービスがエラーなく中断なく提供されることを保証しません', '서비스가 오류나 중단 없이 제공될 것을 보장하지 않습니다', 'We do not guarantee that the service will be error-free or uninterrupted')}</li>
                <li>{t('第三方AI模型的可用性和性能可能会影响服务质量', '第三方AI模型的可用性和性能可能會影響服務質量', '第三者AIモデルの可用性と性能がサービス品質に影響を与える可能性があります', '제3자 AI 모델의 가용성과 성능이 서비스 품질에 영향을 줄 수 있습니다', 'The availability and performance of third-party AI models may affect service quality')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('8. 责任限制', '8. 責任限制', '8. 責任の制限', '8. 책임의 제한', '8. Limitation of Liability')}
              </h2>
              <p className="mb-4">
                {t(
                  '在适用法律允许的最大范围内，我们对任何间接、偶然、特殊或后果性损害不承担责任。我们的总责任不超过您在过去12个月内支付给我们的费用。',
                  '在適用法律允許的最大範圍內，我們對任何間接、偶然、特殊或後果性損害不承擔責任。我們的總責任不超過您在過去12個月內支付給我們的費用。',
                  '適用される法律で許容される最大限度において、当社は間接的、偶発的、特別または結果的損害について責任を負いません。当社の総責任は、お客様が過去12か月間にお支払いいただいた料金を超えないものとします。',
                  '관련 법률이 허용하는 최대한의 범위 내에서 당사는 간접적, 부수적, 특수 또는 결과적 손해에 대해 책임을 지지 않습니다. 당사의 총 책임은 귀하가 지난 12개월 동안 당사에 지불한 요금을 초과하지 않습니다.',
                  'To the maximum extent permitted by applicable law, we are not liable for any indirect, incidental, special, or consequential damages. Our total liability shall not exceed the fees you have paid to us in the past 12 months.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('9. 条款修改', '9. 條款修改', '9. 規約の変更', '9. 약관 변경', '9. Terms Modification')}
              </h2>
              <p className="mb-4">
                {t(
                  '我们保留随时修改本服务条款的权利。如有重大变更，我们会提前30天通知用户。继续使用服务即表示您接受修改后的条款。',
                  '我們保留隨時修改本服務條款的權利。如有重大變更，我們會提前30天通知用戶。繼續使用服務即表示您接受修改後的條款。',
                  '当社は本利用規約をいつでも変更する権利を留保します。重要な変更については、30日前までにお客様にお知らせします。サービスの継続利用は、変更後の規約に同意したものとみなされます。',
                  '당사는 언제든지 본 이용 약관을 수정할 권리를 보유합니다. 중요한 변경 사항이 있을 경우 30일 전에 사용자에게 통지합니다. 서비스를 계속 이용하시면 수정된 약관에 동의하는 것으로 간주됩니다.',
                  'We reserve the right to modify these Terms of Service at any time. For significant changes, we will notify users 30 days in advance. Continued use of the service indicates your acceptance of the modified terms.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('10. 法律适用', '10. 法律適用', '10. 準拠法', '10. 준거법', '10. Governing Law')}
              </h2>
              <p className="mb-4">
                {t(
                  '本服务条款受您所在司法管辖区的适用法律管辖。因本条款产生的争议应通过友好协商解决，协商不成的，提交至有管辖权的法院解决。',
                  '本服務條款受您所在司法管轄區的適用法律管轄。因本條款產生的爭議應通過友好協商解決，協商不成的，提交至有管轄權的法院解決。',
                  '本利用規約は、お客様の司法管轄区域の適用法に準拠します。本規約から生じる紛争は、友好的協議により解決するものとしますが、合意に至らない場合は、管轄権を有する裁判所に提起するものとします。',
                  '본 이용 약관은 귀하의 관할 지역의 적용 법률의 규정을 따릅니다. 본 약관에서 발생하는 분쟁은 우선 우호적으로 협상하여 해결하며, 합의가 이루어지지 않는 경우 관할 법원에 제출하여 해결합니다.',
                  'These Terms of Service are governed by the applicable laws of your jurisdiction. Disputes arising from these terms should be resolved through friendly negotiation. If negotiation fails, they shall be submitted to the competent court for resolution.'
                )}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('11. 联系我们', '11. 聯繫我們', '11. お問い合わせ', '11. 문의하기', '11. Contact Us')}
              </h2>
              <p className="mb-4">
                {t(
                  '如果您对本服务条款有任何疑问，请通过以下方式联系我们：',
                  '如果您對本服務條款有任何疑問，請通過以下方式聯繫我們：',
                  '本サービス規約に関してご質問がございましたら、以下の方法でお問い合わせください：',
                  '본 이용 약관에 대해 궁금한 점이 있으시면 다음 방법으로 당사에 문의하시기 바랍니다:',
                  'If you have any questions about these Terms of Service, please contact us through the following methods:'
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